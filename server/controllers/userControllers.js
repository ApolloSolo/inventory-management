const { User } = require("../models/index");
const jwt = require("jsonwebtoken");

const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select("-__v -password");
    res.status(200).json(users);
  } catch (error) {
    res.send(error.message);
    console.log(error);
  }
};

const getMe = async (req, res) => {
  res.send(req.user);
};

const getOneUser = async (req, res) => {
  const { userId } = req.params;
  const foundUser = await User.findById(userId).select("-__v -password");
  if (!foundUser) {
    res.status(404);
    throw new Error("User Not Found");
  }
  res.status(200).json(foundUser);
};

const registerUser = async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    res.status(400);
    throw new Error("Please add all fields");
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error("User already registered");
  }

  const newUser = await User.create(req.body);

  if (newUser) {
    res.status(201).json({
      _id: newUser.id,
      username: newUser.username,
      password: newUser.password,
      token: await generateToken(newUser),
    });
  } else {
    res.status(400);
    throw new Error("Invalid user data");
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Please add all fields");
  }

  const foundUser = await User.findOne({ email });
  if (!foundUser) {
    res.status(404);
    throw new Error("User Not Found");
  }

  const correctPassword = await foundUser.isCorrectPassword(password);

  if (!correctPassword) {
    res.status(400);
    throw new Error("Incorrect credentials");
  }

  res.status(201).json({
    _id: foundUser.id,
    username: foundUser.username,
    email: foundUser.email,
    token: await generateToken(foundUser),
  });
};

async function generateToken({ username, _id }) {
  const payload = { username, _id };
  return jwt.sign({ data: payload }, process.env.JWT_SECRET, {
    expiresIn: "8hr",
  });
}

module.exports = {
  getUsers,
  getMe,
  getOneUser,
  registerUser,
  loginUser,
};
