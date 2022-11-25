const router = require("express").Router();
const {
  getUsers,
  getOneUser,
  getMe,
  registerUser,
  loginUser,
} = require("../../controllers/userControllers");
const protected = require("../../middleware/authMiddleware");

router.get("/", protected, getUsers);
router.get("/me", protected, getMe);
router.get("/:userId", protected, getOneUser);
router.post("/register", registerUser);
router.post("/login", loginUser);

module.exports = router;
