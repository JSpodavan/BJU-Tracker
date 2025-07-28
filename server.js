import 'dotenv/config';
import express from 'express';
import userRouter from './routes/user-routes.js';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();
app.use(cookieParser());
app.use(
    cors({
        origin: true,
        credentials: true,
    })
);
app.use(express.static('.'));
app.use(express.json());
app.use(userRouter);

app.listen(process.env.PORT, () => {
    console.log(`Server started on port ${process.env.PORT}`);
});
