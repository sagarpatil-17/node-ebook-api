import express from "express";

const app = express();

// routes 
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to APIs' })
})

export default app;