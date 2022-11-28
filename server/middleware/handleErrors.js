require("dotenv").config();

async function errorHandler(error, req, res, next) {
  const statusCode = res.statusCode ? statusCode : 500;
  res.status(statusCode);

  res.json({
    message: error.message,
    stack: process.env.NODE_ENV === "DEV" ? error.stack : null,
  });
}

module.exports = errorHandler;
