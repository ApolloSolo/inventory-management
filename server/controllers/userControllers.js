const { User, Token } = require("../models/index");
const generateToken = require("../util/generateToken");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const sendEmail = require("../util/sendEmail");

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

    if (!newUser) {
      res.status(400);
      throw new Error("Invalid user data");
    }

    const token = await generateToken(newUser);

    // Send HTTP-only cookie
    res.cookie("token", token, {
      path: "/",
      httpOnly: true, // Flags the cookie to be used by the web server
      expires: new Date(Date.now() + 1000 * 86400), // expires in one day
      sameSite: "none",
      secure: true, // Flags the cookie to be used by https only
    });

    res.status(201).json({
      _id: newUser.id,
      username: newUser.username,
      password: newUser.password,
      token,
    });
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

    const token = await generateToken(foundUser);
    // Send HTTP-only cookie
    res.cookie("token", token, {
      path: "/",
      httpOnly: true, // Flags the cookie to be used by the web server
      expires: new Date(Date.now() + 1000 * 86400), // expires in one day
      sameSite: "none",
      secure: true, // Flags the cookie to be used by https only
    });

    res.status(201).json({
      _id: foundUser.id,
      username: foundUser.username,
      email: foundUser.email,
      token,
    });
  } catch (error) {
    res.json({
      error: error.message,
    });
  }
};

async function logoutUser(req, res) {
  try {
    res.cookie("token", "", {
      path: "/",
      httpOnly: true,
      expires: new Date(0), // expires now
      sameSite: "none",
      secure: true,
    });
    return res.status(200).json({ message: "Logged out" });
  } catch (error) {
    res.json({
      error: error.message,
    });
  }
}

async function updateUser(req, res) {
  try {
    const { _id } = req.user._id;
    const body = req.body;

    const updatedUser = await User.findByIdAndUpdate(_id, body, {
      new: true,
    }).select("-__v -password");

    if (!updatedUser) {
      throw new Error("User could not be found");
    }

    res.send(updatedUser);
  } catch (error) {
    res.json({
      error: error.message,
    });
  }
}

async function changePassword(req, res) {
  try {
    const user = await User.findById(req.user._id).select("-__v");
    if (!user) {
      res.status(400);
      throw new Error("User not found");
    }

    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (!oldPassword || !newPassword || !confirmPassword) {
      res.status(400);
      throw new Error("Please fill in all fields");
    }

    if (newPassword !== confirmPassword) {
      res.status(400);
      throw new Error("Passwords don't match");
    }

    const passwordIsCorrect = await bcrypt.compare(oldPassword, user.password);

    if (!passwordIsCorrect) {
      res.status(400);
      throw new Error("Current password is incorrect");
    }

    user.password = newPassword;
    await user.save();
    res.status(200).json({ message: "Changed password" });
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

async function loginStatus(req, res) {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.json(false);
    }

    const varified = jwt.verify(token, process.env.JWT_SECRET);
    if (varified) {
      return res.json(true);
    }
    return res.json(false);
  } catch (error) {
    res.json({
      error: error.message,
    });
  }
}

async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      res.status(404);
      throw new Error("User email does not exits");
    }

    // Delete token if exits in DB for user
    let token = await Token.findOne({ userId: user._id });

    if (token) await Token.deleteOne({ _id: token._id });

    // Create Reset Token
    let resetToken = crypto.randomBytes(32).toString("hex") + user._id;

    // Hash token to and save to db
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Save token to user in DB
    await new Token({
      userId: user._id,
      token: hashedToken,
      createdAt: Date.now(),
      expiresAt: Date.now() + 30 * (60 * 1000), // 30 minutes
    }).save();

    // Construct reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`;

    // Reset Email
    const message = `
    <h2>Hello ${user.username}</h2>
    <p>You have requested a password reset.</p>
    <p>The reset link is valid for 30 minutes.</p>
    <p>Please use the link to reset your password.</p>
    <a href=${resetUrl} clicktracking=off>${resetUrl}</a>
    <p>Thank you,</p>
    <p>AppSolo Tech.</p>
    `;

    const subject = `Password Reset Request`;
    const send_to = user.email;
    const sent_from = process.env.EMAIL_USER;

    await sendEmail(subject, message, send_to, sent_from);

    res.status(200).json({ success: true, message: "Reset email sent" });
  } catch (error) {
    res.json({
      error: error.message,
    });
  }
}

async function resetPassword(req, res) {
  try {
    const { resetToken } = req.params;
    const { newPassword, confirmPassword } = req.body;
    console.log(newPassword, confirmPassword);
    if (!newPassword || !confirmPassword) {
      throw new Error("No Data");
    } else if (newPassword !== confirmPassword) {
      throw new Error("Passwords don't match");
    }

    // Hash resetToken from link then compare it to DB token

    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Get DB token
    const dbToken = await Token.findOne({
      token: hashedToken,
      expiresAt: { $gt: Date.now() },
    });

    if (!dbToken) {
      throw new Error("Invalid or expired reset token");
    }

    // Find user
    const user = await User.findOne({ _id: dbToken.userId });

    user.password = newPassword;
    await user.save();

    res.status(201).json({
      success: true,
      message: "Password reset successful. Please log in.",
    });
  } catch (error) {
    res.json({
      error: error.message,
      stack: error.stack,
    });
  }
}

module.exports = {
  getUsers,
  getMe,
  getOneUser,
  registerUser,
  loginUser,
  logoutUser,
  updateUser,
  changePassword,
  deleteUser,
  loginStatus,
  forgotPassword,
  resetPassword,
};
