// ===================== controllers/auth/authController.js =====================
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const User = require("../../models/User");
const FarmerProfile = require("../../models/FarmerProfile");
const FPOProfile = require("../../models/FPOProfile");
const BuyerProfile = require("../../models/BuyerProfile");
const LogisticsProfile = require("../../models/LogisticsProfile");

const sendEmail = require("../../services/notificationService").sendEmail;

// Map role -> profile model, so registration stays generic instead of 4 near-duplicate functions
const PROFILE_MODEL_MAP = {
  Farmer: FarmerProfile,
  FPO: FPOProfile,
  Buyer: BuyerProfile,
  Logistics: LogisticsProfile,
};

const generateToken = (userId, role) => {
  return jwt.sign({ id: userId, role }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

const setAuthCookie = (res, token) => {
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

// --- REGISTER ---
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone, role, profileData } = req.body;

    if (!name || !email || !password || !phone || !role) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    if (!PROFILE_MODEL_MAP[role]) {
      return res.status(400).json({ success: false, message: "Invalid role specified" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ success: false, message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // OTP for email verification
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      role,
      isVerified: false,
      otp,
      otpExpiry,
    });

    // Create the corresponding role-specific profile, linked via userId
    const ProfileModel = PROFILE_MODEL_MAP[role];
    await ProfileModel.create({
      userId: newUser._id,
      ...profileData, // fullName, address, cropsGrown, etc. — validated at route level via validators/
    });

    await sendEmail({
      to: email,
      subject: "Verify your account - OTP",
      text: `Your OTP is ${otp}. It expires in 10 minutes.`,
    });

    return res.status(201).json({
      success: true,
      message: "Registered successfully. Please verify your email with the OTP sent.",
      userId: newUser._id,
    });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({ success: false, message: "Server error during registration" });
  }
};

// --- VERIFY OTP ---
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: "Account already verified" });
    }

    if (user.otp !== otp || user.otpExpiry < new Date()) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    const token = generateToken(user._id, user.role);
    setAuthCookie(res, token);

    return res.status(200).json({
      success: true,
      message: "Account verified successfully",
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error("OTP verification error:", error);
    return res.status(500).json({ success: false, message: "Server error during OTP verification" });
  }
};

// --- LOGIN ---
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    if (!user.isVerified) {
      return res.status(403).json({ success: false, message: "Please verify your email before logging in" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const token = generateToken(user._id, user.role);
    setAuthCookie(res, token);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ success: false, message: "Server error during login" });
  }
};

// --- LOGOUT ---
exports.logout = async (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
  });
  return res.status(200).json({ success: true, message: "Logged out successfully" });
};

// --- FORGOT PASSWORD ---
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal whether email exists — standard security practice
      return res.status(200).json({
        success: true,
        message: "If that email is registered, a reset link has been sent.",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 min
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    await sendEmail({
      to: email,
      subject: "Reset your password",
      text: `Click here to reset your password: ${resetUrl}. This link expires in 15 minutes.`,
    });

    return res.status(200).json({
      success: true,
      message: "If that email is registered, a reset link has been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// --- RESET PASSWORD ---
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpiry: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid or expired reset token" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiry = undefined;
    await user.save();

    return res.status(200).json({ success: true, message: "Password reset successful. Please log in." });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// --- GET CURRENT USER (for auth persistence on frontend) ---
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password -otp -resetPasswordToken");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    return res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("GetMe error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};