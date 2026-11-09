import type { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
// import bookModel from "./bookModel.js";

const createBook = async (req: Request, res: Response, next: NextFunction) => {
    const { title, author } = req.body;

    if (!title || !author) {
        return next(createHttpError(400, 'All fields are required!'));
    }

    res.status(201).json();
}

export { createBook };