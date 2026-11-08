import express from "express";
import createHttpError from "http-errors";
import globalErrorHandler from "./middlewares/globalErrorHandler.js";

const app = express();

// routes 
app.get('/', (req, res) => {
    const error = createHttpError(500, 'something went wrong!')
    throw error;
    res.json({ message: 'Welcome to APIs' })
})


// global error handler 
app.use(globalErrorHandler);

export default app;