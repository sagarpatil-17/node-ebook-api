import app from "./src/app.js";
import { config } from "./src/config/config.js";
import connectDB from "./src/config/db.js";

const startServer = async () => {
    // connect database 
    await connectDB();

    const port = config.port || 3000

    app.listen(port, () => {
        console.log(`server is running on port ${port}`);

    })
}

startServer();