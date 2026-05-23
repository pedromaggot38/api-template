import AppError from '../utils/appError.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const routeSegment = req.baseUrl.split('/').pop();
    const subFolder =
      routeSegment === 'me' ? 'avatars' : routeSegment || 'misc';

    const targetFolder = `uploads/${subFolder}`;

    if (!fs.existsSync(targetFolder)) {
      fs.mkdirSync(targetFolder, { recursive: true });
    }

    cb(null, targetFolder);
  },
  filename: (req, file, cb) => {
    const userId = req.user?.id || 'anonymous';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);

    const prefix = file.fieldname;
    cb(null, `${prefix}-${userId}-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        'Formato de arquivo inválido. Envie apenas JPEG, PNG ou WEBP.',
        400,
      ),
      false,
    );
  }
};

const limits = {
  fileSize: 2 * 1024 * 1024,
};

const upload = multer({
  storage,
  fileFilter,
  limits,
});

export const uploadAvatar = upload.single('avatar');
