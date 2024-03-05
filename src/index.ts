import { createServer } from 'http';

import 'dotenv/config';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { Server } from 'socket.io';

import { errorMiddleware } from './middlewares';
import { router } from './router';
import { onConnection } from './socket/on-connection';

const PORT = process.env.PORT;

const app = express();

app.use(
  cors({
    credentials: true,
    origin: process.env.CLIENT_URL,
  }),
);
app.use(express.json());
app.use(cookieParser());
app.use('/api', router);
app.use(errorMiddleware);

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    credentials: true,
  },
});

io.on('connection', (socket) => {
  onConnection(io, socket);
});

server.listen(PORT, () => console.log(`Server started on PORT: ${PORT}`));
