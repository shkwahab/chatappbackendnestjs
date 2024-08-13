import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class AppService {
  sayHi(): Object {
    return { message: "Welcome to the Chatapp" };
  }

  async uploadImage(img: Express.Multer.File) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    // Promisify the upload stream method
    const uploadStream = (buffer: Buffer): Promise<any> => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { public_id: 'chatapp' }, // Optional: specify a public_id or remove if not needed
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        Readable.from(buffer).pipe(stream);
      });
    };

    try {
      const uploadResult = await uploadStream(img.buffer);
      const imgurl = {
        img: uploadResult.secure_url as string
      }
      return imgurl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error('Error uploading image');
    }
  }
}
