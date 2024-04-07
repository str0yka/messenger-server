import path from 'path';

import { v4 as uuidv4 } from 'uuid';

export class FileController {
  async upload(req: Ex.Request, res: Ex.Response, next: Ex.NextFunction) {
    try {
      const { img } = req.files;
      const fileName = uuidv4() + '.jpg';
      console.log(path.resolve(__dirname, 'images', fileName));

      img.mv(path.resolve(__dirname, '..', 'images', fileName));
      res.json({ success: true });
    } catch (e) {
      console.log(e);
      next(e);
    }
  }
}
