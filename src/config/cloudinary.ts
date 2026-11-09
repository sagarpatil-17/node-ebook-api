import { v2 as cloudinary } from 'cloudinary';
import { config } from './config.js';

// Configuration
cloudinary.config({
    cloud_name: config.cloudinary_cloud_name as string,
    api_key: config.cloudinary_api_key as string,
    api_secret: config.cloudinary_api_secret as string
});

export default cloudinary;