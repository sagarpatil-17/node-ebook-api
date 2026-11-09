import type { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import cloudinary from "../config/cloudinary.js";
import path from "node:path";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
// import bookModel from "./bookModel.js";

// Recreate __dirname once globally outside the request handler for optimal memory efficiency
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.resolve(__dirname, '../../public/data/uploads');

const createBook = async (req: Request, res: Response, next: NextFunction) => {
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

    try {
        const [uploadResult, bookFileUploadResult] = await Promise.all([
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

        console.log("Cover Upload Result:", uploadResult);
        console.log("Book Upload Result:", bookFileUploadResult);

        // TODO: Save to database here using uploadResult.secure_url and bookFileUploadResult.secure_url
        // const newBook = await bookModel.create({ ...req.body, coverImage: uploadResult.secure_url, file: bookFileUploadResult.secure_url });

        res.status(201).json({
            message: 'Book created successfully',
            data: {
                coverUrl: uploadResult.secure_url,
                fileUrl: bookFileUploadResult.secure_url
            }
        });

    } catch (error) {
        // Pass Cloudinary or execution failures to the global Express error handler
        return next(createHttpError(500, 'Cloud storage upload failed.'));
    } finally {
        // 3. Automated Storage Cleanup: Remove temp files safely from server disk space
        await Promise.all([
            fs.unlink(coverFilePath).catch(() => { }),
            fs.unlink(bookFilePath).catch(() => { })
        ]);
    }
}

export { createBook };
