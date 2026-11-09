import express from "express";
import cors from "cors";
import globalErrorHandler from "./middlewares/globalErrorHandler.js";
import userRouter from "./user/userRouter.js";
import bookRouter from "./book/bookRouter.js";
import { config } from "./config/config.js";

const app = express();

app.use(cors({
    origin: config.frontend_domain
}))
app.use(express.json());

// routes 
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to APIs' })
})

app.use('/api/users', userRouter);
app.use('/api/books', bookRouter);

// global error handler 
app.use(globalErrorHandler);

export default app;