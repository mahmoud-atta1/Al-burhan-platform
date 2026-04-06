const express = require("express");
const router = express.Router();

const { protect, allowedTo } = require("../services/auth.service");

const {
  getMe,
  updateMe,
  changeMyPassword,
  deleteMe,
  getUsers,
  getUser,
  changeActiveStatus,
  changeUserPassword,
} = require("../services/user.service");

const {
  updateMeValidator,
  updatePassValidator,
  getUserValidator,
  statusValidator,
  adminPassValidator,
} = require("../validators/user.validator");

router.use(protect);

router.get("/me", getMe);
router.put("/update-me", updateMeValidator, updateMe);
router.put("/change-my-password", updatePassValidator, changeMyPassword);
router.delete("/delete-me", deleteMe);

router.use(allowedTo("admin"));

router.get("/", getUsers);
router.get("/:id", getUserValidator, getUser);
router.put("/:id/status", statusValidator, changeActiveStatus);
router.put("/:id/password", adminPassValidator, changeUserPassword);

module.exports = router;
