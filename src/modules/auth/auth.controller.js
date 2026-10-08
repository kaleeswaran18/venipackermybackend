const authService = require("./auth.service");


// =========================
// REGISTER
// =========================

const register = async (req, res, next) => {
  try {
    const user = await authService.registerUser(req.body);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};


// =========================
// LOGIN
// =========================

const login = async (req, res, next) => {
  try {
    const result = await authService.loginUser(req.body);

    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};


// =========================
// REFRESH TOKEN
// =========================

const refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    const result = await authService.refreshAccessToken(
      refreshToken
    );

    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      data: {
        accessToken: result.accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};


// =========================
// LOGOUT
// =========================

const logout = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    await authService.logoutUser(refreshToken);

    // Clear refresh token cookie
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    next(error);
  }
};


// =========================
// EXPORT
// =========================

module.exports = {
  register,
  login,
  refresh,
  logout,
};