
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const port = process.env.PORT || 3000;

app.use(express.json());

mongoose.connect('mongodb://localhost/playground')
    .then(() => console.log('connected to mongodb'))
    .catch(err => console.error('Could not connect to mongodb server', err));

const userSchema = new mongoose.Schema({
  username: String,
  creatingDate: { type: Date, default: Date.now }
});

const UserModel = mongoose.model('User', userSchema);

async function createUser() {
const testUser = UserModel({
  username: 'mostafa',
});

const result = await testUser.save();
console.log(result);
}

createUser();
app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Server listening on port: ${port}`);
})
