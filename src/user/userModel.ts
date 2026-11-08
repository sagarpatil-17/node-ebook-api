import mongoose from "mongoose";
import type { User } from "./userTypes.js";

const userSchema = new mongoose.Schema<User>({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        unique: true,
        required: true
    },
    password: {
        type: String,
        required: true
    }
},
    { timestamps: true }
)

export default mongoose.model<User>('User', userSchema);