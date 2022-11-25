const router = require("express").Router();
const { getUsers } = require("../../controllers/userControllers");

router.get("/", getUsers);

module.exports = router;
