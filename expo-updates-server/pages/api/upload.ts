import decompress from "decompress";
import { Request } from 'express';
import fs from 'fs';
import multer, { StorageEngine } from 'multer';
import { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';

export default async function uploadEndpoint(req: NextApiRequest, res: NextApiResponse) {
  // @ts-ignore ts-todo
  upload.single('zip')(req, res, async (err: any) => {
    if (err) {
      console.error('Error uploading file:', err);
      res.status(500).json({ error: 'Error uploading file' });
    } else {
      // Access the uploaded file using 'req.file'
      // @ts-ignore ts-todo
      const file: Express.Multer.File = req.file;
      // ...
      if (req.method !== 'POST') return res.status(405).json({ error: 'Expected POST.' });
      try {
        const runtimeVersion = req.headers['x-runtimeversion'];

        if (!runtimeVersion || !file) {
          res.status(400).json({ error: 'Invalid request payload' });
          return;
        }
        if (Array.isArray(runtimeVersion)) {
          res.status(400).json({ error: 'Invalid request headers' });
          return;
        }

        const zipFilePath = file.path;
        const destinationPath = path.join(process.cwd(), 'updates', runtimeVersion);

        // Create the updates folder if it doesn't exist
        if (!fs.existsSync(destinationPath)) {
          fs.mkdirSync(destinationPath, { recursive: true });
        }

        // Extract the zip file
        await extractZip(zipFilePath, destinationPath);

        // Delete the uploaded zip file
        fs.unlinkSync(zipFilePath);

        res.status(200).json({ message: 'Files extracted successfully' });
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });
}

const extractZip = async (zipFilePath: string, destinationPath: string) => {
  try {
    await decompress(zipFilePath, destinationPath);
  } catch (e) {
    console.log({ e });
  }
};

// Create a storage engine to define where to save the uploaded files
const storage: StorageEngine = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    // Specify the destination folder where uploaded files will be stored
    cb(null, './uploads');
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    // Generate a unique filename for each uploaded file
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const filename = file.originalname.replace(/\.zip$/i, '');
    cb(null, `${filename}-${uniqueSuffix}.zip`);
  },
});

// Create the multer middleware instance
const upload = multer({ storage });

export const config = {
  api: {
    bodyParser: false,
  },
};
