import type { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import cloudinary from "../config/cloudinary.js";
import path from "node:path";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import bookModel from "./bookModel.js";
import type { AuthRequest } from "../middlewares/authenticate.js";
import { getPublicIdFromUrl } from "../utils/cloudinaryParser.js";

interface MulterFiles {
    coverImage?: Express.Multer.File[];
    file?: Express.Multer.File[];
}

// Recreate __dirname once globally outside the request handler for optimal memory efficiency
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.resolve(__dirname, '../../public/data/uploads');

const createBook = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { title, genre } = req.body;

        if (!title || !genre) {
            return next(createHttpError(400, 'Title and genre fields are required.'));
        }

        const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
        const coverFile = files?.coverImage?.[0];
        const bookFile = files?.file?.[0];

        if (!coverFile) {
            return next(createHttpError(400, 'Cover image is required.'));
        }
        if (!bookFile) {
            return next(createHttpError(400, 'Book PDF file is required.'));
        }

        const coverImageMimeType = coverFile.mimetype.split('/').at(-1);
        const coverFilePath = path.join(UPLOADS_DIR, coverFile.filename);
        const bookFilePath = path.join(UPLOADS_DIR, bookFile.filename);

        // Track variables for potential cleanup if database execution fails later
        let uploadResult;
        let bookFileUploadResult;

        try {
            //  Concurrent Cloudinary Uploads
            [uploadResult, bookFileUploadResult] = await Promise.all([
                cloudinary.uploader.upload(coverFilePath, {
                    folder: 'book-covers',
                    ...(coverFile.filename && { filename_override: coverFile.filename }),
                    ...(coverImageMimeType && { format: coverImageMimeType })
                }),
                cloudinary.uploader.upload(bookFilePath, {
                    resource_type: 'raw',
                    folder: 'book-pdfs',
                    format: 'pdf',
                    ...(bookFile.filename && { filename_override: bookFile.filename })
                })
            ]);
        } catch (uploadError) {
            console.error("Cloudinary upload error: ", uploadError);
            return next(createHttpError(500, 'Cloud storage upload failed.'));
        } finally {
            // Local Storage Cleanup immediately after cloud stream finishes
            await Promise.all([
                fs.unlink(coverFilePath).catch(() => { }),
                fs.unlink(bookFilePath).catch(() => { })
            ]);
        }

        //  Database Interaction
        const _req = req as AuthRequest;
        const newBook = await bookModel.create({
            title,
            author: { _id: _req.userId },
            genre,
            coverImage: uploadResult.secure_url,
            file: bookFileUploadResult.secure_url
        });

        return res.status(201).json({ id: newBook._id });

    } catch (error) {
        console.error("Database or Application error: ", error);
        return next(createHttpError(500, 'Failed to process and complete book creation.'));
    }
}

const updateBook = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { title, genre } = req.body;
        const { bookId } = req.params;

        // 1. Validate incoming ID
        if (!bookId) {
            return next(createHttpError(400, 'Book ID is required.'));
        }

        // 2. Locate the existing book record
        const book = await bookModel.findById(bookId);
        if (!book) {
            return next(createHttpError(404, 'Book not found!'));
        }

        // 3. Authorization verification
        const authReq = req as AuthRequest;
        if (!authReq.userId || book.author.toString() !== authReq.userId) {
            return next(createHttpError(403, 'Unauthorized!'));
        }

        // 4. File Resolution Strategy
        const files = req.files as MulterFiles | undefined;
        const coverFile = files?.coverImage?.[0];
        const bookFile = files?.file?.[0];

        let coverImageUrl = book.coverImage;
        let bookFileUrl = book.file;

        const localFilesToCleanup: string[] = [];
        const uploadPromises: Promise<unknown>[] = [];
        const cloudDeletesToExecute: Promise<unknown>[] = [];

        // --- Process Cover Image Update ---
        if (coverFile) {
            const coverFilePath = path.join(UPLOADS_DIR, coverFile.filename);
            localFilesToCleanup.push(coverFilePath);

            // Queue the old file deletion if a valid URL exists
            const oldCoverPublicId = getPublicIdFromUrl(book.coverImage, 'book-covers');
            if (oldCoverPublicId) {
                cloudDeletesToExecute.push(cloudinary.uploader.destroy(oldCoverPublicId));
            }

            // Queue the new upload
            const coverImageMimeType = coverFile.mimetype.split('/').at(-1);
            uploadPromises.push(
                cloudinary.uploader.upload(coverFilePath, {
                    folder: 'book-covers',
                    ...(coverFile.filename && { filename_override: coverFile.filename }),
                    ...(coverImageMimeType && { format: coverImageMimeType })
                }).then(res => coverImageUrl = res.secure_url)
            );
        }

        // --- Process Book PDF Update ---
        if (bookFile) {
            const bookFilePath = path.join(UPLOADS_DIR, bookFile.filename);
            localFilesToCleanup.push(bookFilePath);

            // Queue the old raw PDF deletion if a valid URL exists
            const oldBookPublicId = getPublicIdFromUrl(book.file, 'book-pdfs');
            if (oldBookPublicId) {
                cloudDeletesToExecute.push(cloudinary.uploader.destroy(oldBookPublicId, { resource_type: 'raw' }));
            }

            // Queue the new upload
            uploadPromises.push(
                cloudinary.uploader.upload(bookFilePath, {
                    resource_type: 'raw',
                    folder: 'book-pdfs',
                    format: 'pdf',
                    ...(bookFile.filename && { filename_override: bookFile.filename })
                }).then(res => bookFileUrl = res.secure_url)
            );
        }

        // 5. Execute Staged Asset Actions Parallelly
        if (uploadPromises.length > 0) {
            try {
                // Upload new assets and remove old assets simultaneously to optimize network requests
                await Promise.all([...uploadPromises, ...cloudDeletesToExecute]);
            } catch (uploadError) {
                console.error("Cloudinary transfer synchronization error: ", uploadError);
                return next(createHttpError(500, 'Cloud storage update failed.'));
            } finally {
                // Immediate asynchronous cleanup of local multer storage cache
                await Promise.all(localFilesToCleanup.map(filePath => fs.unlink(filePath).catch(() => { })));
            }
        }

        // 6. Persist changes atomically in the database
        const updatedBook = await bookModel.findByIdAndUpdate(
            bookId,
            {
                title: title ?? book.title,
                genre: genre ?? book.genre,
                coverImage: coverImageUrl,
                file: bookFileUrl
            },
            { new: true, runValidators: true }
        );

        return res.status(200).json(updatedBook);

    } catch (error) {
        console.error("Database or Application runtime error: ", error);
        return next(createHttpError(500, 'Failed to process request.'));
    }
};

const getBooks = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const _req = req as AuthRequest;
        const books = await bookModel.find(
            { author: _req.userId } as Record<string, unknown>
        );

        res.status(200).json(books);
    } catch (err) {
        console.log(err)
        return next(createHttpError(500, 'Error while getting books!'));
    }
}

export { createBook, updateBook, getBooks };
