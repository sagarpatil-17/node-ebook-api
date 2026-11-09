import express from "express";
import globalErrorHandler from "./middlewares/globalErrorHandler.js";
import userRouter from "./user/userRouter.js";
import bookRouter from "./book/bookRouter.js";

const app = express();
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