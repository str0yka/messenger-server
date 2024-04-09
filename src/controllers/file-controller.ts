import path from 'path';

import { UploadedFile } from 'express-fileupload';
import { v4 as uuidv4 } from 'uuid';

import { ApiError } from '../exceptions';

export class FileController {
  async upload(req: Ex.Request, res: Ex.Response, next: Ex.NextFunction) {
    try {
      const image = req.files?.image;
      if (!image) {
        throw ApiError.BadRequest('The image was not delivered');
      }
      const fileName = uuidv4() + '.jpg';
      (image as UploadedFile).mv(path.resolve(__dirname, '..', 'images', fileName));
      res.json({ fileName });
    } catch (e) {
      console.log(e);
      next(e);
    }
  }
}
