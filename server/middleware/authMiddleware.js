const jwt = require("jsonwebtoken");
const { User } = require("../models");

const protected = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      res.status(401);
      throw new Error("Not authorized, please login");
    }

    // Verify Token
    const varified = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(varified.data._id).select(
      "-__v -password"
    );

    if (!user) {
      res.status(401);
      throw new Error("Not authorized, please login");
    }

    req.user = user;

    next();
  } catch (error) {
    res.json({
      error: error.message,
    });
  }
};

module.exports = protected;
