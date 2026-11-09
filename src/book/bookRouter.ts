import express from 'express';
import { createBook } from './bookController.js';

const bookRouter = express.Router();

// routes
bookRouter.post('/create', createBook)

export default bookRouter;