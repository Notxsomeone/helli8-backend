
import express from 'express';
import { mongoose as mg } from 'mongoose';
import joi from 'joi';

const userRouter = express.Router();

const UserSchema = joi.object({
  username: joi.string().required().min(4).max(16).alphanum(),
  email: joi.string().email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } }).required(),
  password: joi.string().pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')),
  created: { type: Date, default: Date.now }
});

const User = mg.model('user', new mg.Schema({
    username: String,
    email: String,
    password: String,
    created: { type: Date, default: Date.now }
  })
);

userRouter.post('/', async (req, res) => {
  const user = req.body;

  if (UserSchema.validate(user).error) {
    res.status(400).send('Bad field data');
    return;
  }
  
  if (await User.exists({ username: user.username }).exec()) {
    res.status(400).send('A user with this username already exists.');
    return;
  }; 
  
  if (await User.exists({ email: user.email }).exec()) {
    res.status(400).send('A user with this email already exists.');
    return;
  };
  
  await User.create(user).then(
    () => {
      console.log('Created new user!');
      res.sendStatus(200);
    },
    () => {
      console.log('Could not create a new user.');
      res.sendStatus(500);
    }
  );
});

export default userRouter;
