import 'dotenv/config';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';

import { errorMiddleware } from './middlewares/index.js';
import { router } from './router/index.js';

const app = express();
const PORT = process.env.PORT;

app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use('/api', router);
app.use(errorMiddleware);

app.listen(PORT, () => console.log(`Server started on PORT: ${PORT}`));
