const jwt = require("jsonwebtoken");
const { User } = require("../models");

const protected = async (req, res, next) => {
  let token;
  try {
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      // Get token from header
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      console.log(decoded);

      // Get user from token
      req.user = await User.findById(decoded.data._id).select("-password");

      next();
    }

    if (!token) {
      res.status(401);
      throw new Error("Not Authorized - No Token");
    }
  } catch (error) {
    console.log(error);
    res.status(401);
    res.send(error.message);
  }
};

module.exports = protected;
