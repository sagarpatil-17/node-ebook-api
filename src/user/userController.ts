import type { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import bcrypt from "bcrypt";
import userModel from "./userModel.js";
import jwt from "jsonwebtoken";
import { config } from "../config/config.js";

const createUser = async (req: Request, res: Response, next: NextFunction) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        const error = createHttpError(400, 'All fields are required!')
        return next(error);
    }

    // database call
    const user = await userModel.findOne({ email });

    if (user) {
        const error = createHttpError(400, 'User already exist with this email!');
        return next(error);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await userModel.create({
        name, email, password: hashedPassword
    })

    // token generation jwt
    const token = jwt.sign({ sub: newUser._id }, config.jwtSecret as string, { expiresIn: "7d" });

    res.json({ accessToken: token });
}

export { createUser };