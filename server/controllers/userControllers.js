const { User } = require("../models/index");
const jwt = require("jsonwebtoken");

const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select("-__v -password");
    res.status(200).json(users);
  } catch (error) {
    res.json({
      error: error.message,
    });
  }
};

const getMe = async (req, res) => {
  try {
    if (!req.user) {
      res.status(404);
      throw new Error("User could not be found");
    }
    res.send(req.user);
  } catch (error) {
    res.json({
      error: error.message,
    });
  }
};

const getOneUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const foundUser = await User.findById(userId).select("-__v -password");
    if (!foundUser) {
      res.status(404);
      throw new Error("User Not Found");
    }
    res.status(200).json(foundUser);
  } catch (error) {
    res.json({
      error: error.message,
    });
  }
};

const registerUser = async (req, res) => {
  try {
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
  } catch (error) {
    res.json({
      error: error.message,
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400);
      throw new Error("Please add all fields");
    }

    const foundUser = await User.findOne({ email });
    if (!foundUser) {
      res.status(404);
      throw new Error("Incorrect credentials");
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
  } catch (error) {
    res.json({
      error: error.message,
    });
  }
};

async function logoutUser (req, res) {
  res.send("Logged out!")
}

async function updateUser(req, res) {
  try {
    const { userId } = req.params;
    const body = req.body;

    const userUpdate = await User.findByIdAndUpdate(userId, body, {
      new: true,
    }).select("-__v -password");

    if (!userUpdate) {
      throw new Error("User could not be found");
    }

    res.send(userUpdate);
  } catch (error) {
    res.json({
      error: error.message,
    });
  }
}

async function deleteUser(req, res) {
  try {
    const { userId } = req.params;
    const deletedUser = await User.findByIdAndDelete(
      { _id: userId },
      { new: true }
    );
    if (!deletedUser) {
      res.status(404);
      throw new Error("User could not be found");
    }
    res.status(200).json({ message: "Delete User", deleted: deletedUser });
  } catch (error) {
    res.json({
      error: error.message,
    });
  }
}

async function generateToken({ username, _id }) {
  const payload = { username, _id };
  return jwt.sign({ data: payload }, process.env.JWT_SECRET, {
    expiresIn: "12hr",
  });
}

module.exports = {
  getUsers,
  getMe,
  getOneUser,
  registerUser,
  loginUser,
  logoutUser,
  updateUser,
  deleteUser,
};
