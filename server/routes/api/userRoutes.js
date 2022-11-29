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
  forgotPassword,
  resetPassword,
} = require("../../controllers/userControllers");
const protected = require("../../middleware/authMiddleware");

router.get("/", getUsers);
router.get("/me", protected, getMe);
router.get("/logstatus", protected, loginStatus);
router.get("/:userId", protected, getOneUser);
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.post("/forgotpassword", forgotPassword);
router.put("/update", protected, updateUser);
router.put("/changepw", protected, changePassword);
router.put("/resetpassword/:resetToken", resetPassword);
router.delete("/:userId", protected, deleteUser);

module.exports = router;
