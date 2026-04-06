const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();

const {
  signupValidator,
  loginValidator,
  verifyCodeValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
} = require("../validators/auth.validator");

const {
  signup,
  login,
  logout,
  forgotPassword,
  verifyResetCode,
  resetPassword,
  protect,
} = require("../services/auth.service");

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    status: "fail",
    message: "Too many login attempts, please try again after 15 minutes",
  },
});

const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: {
    status: "fail",
    message: "Too many password reset requests, please try again after an hour",
  },
});

router.post("/signup", signupValidator, signup);
router.post("/login", loginLimiter, loginValidator, login);
router.post("/logout", protect, logout);

router.post(
  "/forgot-password",
  emailLimiter,
  forgotPasswordValidator,
  forgotPassword,
);
router.post("/verify-reset-code", verifyCodeValidator, verifyResetCode);
router.put("/reset-password", resetPasswordValidator, resetPassword);

module.exports = router;
