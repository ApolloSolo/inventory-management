const jwt = require("jsonwebtoken");

async function generateToken({ username, _id }) {
  const payload = { username, _id };
  return jwt.sign({ data: payload }, process.env.JWT_SECRET, {
    expiresIn: "12hr",
  });
}

module.exports = generateToken;
