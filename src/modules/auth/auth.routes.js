const express = require("express");

const router = express.Router();

const {
  register,
  login,
  refresh,
  logout,
} = require("./auth.controller");

const validationMiddleware = require("../../middleware/validation.middleware");

const {
  registerSchema,
  loginSchema,
} = require("./auth.validation");


// =========================
// AUTH ROUTES
// =========================

// Register
router.post(
  "/register",
  validationMiddleware(registerSchema),
  register
);


// Login
router.post(
  "/login",
  validationMiddleware(loginSchema),
  login
);


// Refresh Token
router.post("/refresh", refresh);


// Logout
router.post("/logout", logout);


module.exports = router;