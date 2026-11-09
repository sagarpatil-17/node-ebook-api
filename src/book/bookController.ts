import type { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import cloudinary from "../config/cloudinary.js";
import path from "node:path";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import bookModel from "./bookModel.js";
import type { AuthRequest } from "../middlewares/authenticate.js";

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

export { createBook };
