import 'dotenv/config';
import express from 'express';
import userRouter from './routes/user-routes.js';
import cors from 'cors';
const app = express();
app.use(cors());
app.use(express.json());
app.use(userRouter);

app.listen(process.env.PORT, () => {
    console.log(`Server started on port ${process.env.PORT}`);
});
