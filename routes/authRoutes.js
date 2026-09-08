// ===================== routes/authRoutes.js =====================
const express = require("express");
const router = express.Router();

const {
  register,
  verifyOtp,
  login,
  logout,
  forgotPassword,
  resetPassword,
  getMe,
} = require("../controllers/auth/authController");

const { verifyToken } = require("../middlewares/auth");

router.post("/register", register);
router.post("/verify-otp", verifyOtp);
router.post("/login", login);
router.post("/logout", logout);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/me", verifyToken, getMe);

module.exports = router;