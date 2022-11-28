const express = require("express");
require("dotenv").config();
const PORT = process.env.PORT || 5000;
const db = require("./config/connection");
const bodyParser = require("body-parser");
const cors = require("cors");
const errorHandler = require("./middleware/handleErrors");
const cookieParser = require("cookie-parser");

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

app.use(require("./routes"));

//Error Middleware
app.use(errorHandler);

db.once("open", () => {
  app.listen(PORT, () => {
    console.log("Listning at port: " + PORT);
  });
});
