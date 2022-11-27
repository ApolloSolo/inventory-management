const router = require("express").Router();
const {
  getUsers,
  getOneUser,
  getMe,
  registerUser,
  loginUser,
  logoutUser,
  updateUser,
  deleteUser,
  loginStatus,
  changePassword,
} = require("../../controllers/userControllers");
const protected = require("../../middleware/authMiddleware");

router.get("/", protected, getUsers);
router.get("/me", protected, getMe);
router.get("/logstatus", protected, loginStatus);
router.get("/:userId", protected, getOneUser);
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.put("/update", protected, updateUser);
router.put("/changepw", protected, changePassword);
router.delete("/:userId", protected, deleteUser);

module.exports = router;
