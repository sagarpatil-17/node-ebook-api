import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { createBook, getBooks, updateBook } from './bookController.js';
import multer from "multer";
import authenticate from '../middlewares/authenticate.js';

// Recreate __filename and __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const bookRouter = express.Router();

const upload = multer({
    dest: path.resolve(__dirname, '../../public/data/uploads'),
    limits: { fileSize: 3e7 }
})

// routes
bookRouter.post('/create', authenticate, upload.fields([
    { name: 'coverImage', maxCount: 1 },
    { name: 'file', maxCount: 1 }
]), createBook)

bookRouter.patch('/update/:bookId', authenticate, upload.fields([
    { name: 'coverImage', maxCount: 1 },
    { name: 'file', maxCount: 1 }
]), updateBook)

bookRouter.get('/', authenticate, getBooks)

export default bookRouter;