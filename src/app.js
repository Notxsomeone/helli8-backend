
import express from 'express';
import userRouter from './routes/user.js';
import { mongoose as mg } from 'mongoose';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

mg.connect(process.env.DBIP + '/private')
    .then(() => console.log('Connected to mongodb: private database'))
    .catch(err => console.error('Could not connect to mongodb server: private database', err));

app.use('/user', userRouter);

app.listen(PORT, () => {
  console.log(`Server listening on PORT: ${PORT}`);
})
