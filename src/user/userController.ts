import type { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import bcrypt from "bcrypt";
import userModel from "./userModel.js";
import jwt from "jsonwebtoken";
import { config } from "../config/config.js";
import type { User } from "./userTypes.js";

const createUser = async (req: Request, res: Response, next: NextFunction) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        const error = createHttpError(400, 'All fields are required!')
        return next(error);
    }

    // database call
    try {
        const user = await userModel.findOne({ email });

        if (user) {
            const error = createHttpError(400, 'User already exist with this email!');
            return next(error);
        }

    } catch (err) {
        const error = createHttpError(500, `Error while getting user ${err}`);
        return next(error);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let newUser: User;
    try {
        newUser = await userModel.create({
            name, email, password: hashedPassword
        })
    } catch (err) {
        const error = createHttpError(500, `Error while getting user ${err}`)
        return next(error)
    }

    try {
        // token generation jwt
        const token = jwt.sign({ sub: newUser._id }, config.jwtSecret as string, { expiresIn: "7d" });

        res.status(201).json({ accessToken: token });
    } catch (err) {
        const error = createHttpError(500, `Error while signing token ${err}`);
        return next(error);
    }
}

const loginUser = async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    if (!email || !password) {
        const error = createHttpError(400, 'All field are required!')
        return next(error);
    }

    let user;
    try {
        user = await userModel.findOne({ email });

        if (!user) {
            const error = createHttpError(400, 'Invalid user email');
            return next(error);
        }
    } catch (err) {
        const error = createHttpError(500, `Error while getting user ${err}`);
        return next(error);
    }

    const isPasswordMatched = await bcrypt.compare(password, user.password);

    if (!isPasswordMatched) {
        const error = createHttpError(400, 'password mismatched!');
        return next(error);
    }

    try {
        const token = jwt.sign({ sub: user._id }, config.jwtSecret as string, { expiresIn: "7d" });

        res.json({ accessToken: token });
    } catch (err) {
        const error = createHttpError(500, `Error while signing token ${err}`);
        return next(error);
    }
}

export { createUser, loginUser };