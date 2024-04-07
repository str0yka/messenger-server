import { createServer } from 'http';
import 'dotenv/config';
import path from 'path';

import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import fileUpload from 'express-fileupload';
import { Server } from 'socket.io';

import { errorMiddleware } from './middlewares';
import { createRouter } from './router';
import { onConnection } from './socket/on-connection';

const PORT = process.env.PORT;

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
  },
});
const router = createRouter(io);

app.use(fileUpload());
app.use(
  cors({
    credentials: true,
    origin: process.env.CLIENT_URL,
  }),
);
app.use('/images', express.static(path.resolve(__dirname, 'images')));
app.use(express.json());
app.use(cookieParser());
app.use('/api', router);
app.use(errorMiddleware);

io.on('connection', (socket) => {
  onConnection(io, socket);
});

server.listen(PORT, () => console.log(`Server started on PORT: ${PORT}`));
