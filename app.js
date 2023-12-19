
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const port = process.env.PORT || 3000;

app.use(express.json());

mongoose.connect('mongodb://localhost/users')
    .then(() => console.log('connected to mongodb: users collection'))
    .catch(err => console.error('Could not connect to mongodb server: users collection', err));

const userSchema = new mongoose.Schema({
  username: String,
  nickname: String,
  
  creatingDate: { type: Date, default: Date.now }
});

const UserModel = mongoose.model('User', userSchema);

async function createUser(req, res) {
  const user = {
    username: req.body.username,
    nickname: req.body.nickname
  };
  const result = await UserModel(user).save();
  if(result != null) {
    res.json(user);
  } else {
    res.send(400);
  }
}

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.post('/users', createUser);

app.listen(port, () => {
  console.log(`Server listening on port: ${port}`);
})
