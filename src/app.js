const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const helmet = require("helmet");
const locationRoutes = require("./modules/locations/location.routes");
const itemRoutes = require("./modules/items/item.routes");
const nailRoutes = require("./modules/nails/nail.routes");
const consumableRoutes = require("./modules/consumables/consumable.routes");
const finishedMaterialRoutes = require(
  "./modules/finished-materials/finishedMaterial.routes"
);
const finishedMaterialStockRoutes = require(
  "./modules/finished-material-stock/finishedMaterialStock.routes"
);
const app = express();


// =========================
// Security Headers
// =========================

app.use(helmet());


// =========================
// Body Parser
// =========================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// =========================
// CORS
// =========================

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);


// =========================
// Cookie Parser
// =========================

app.use(cookieParser());


// =========================
// Auth Routes
// =========================

const authRoutes = require("./modules/auth/auth.routes");

app.use("/api/auth", authRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/nails", nailRoutes);
app.use("/api/consumables", consumableRoutes);
// =========================
// User Routes
// =========================

const userRoutes = require("./modules/user/user.routes");

app.use("/api/users", userRoutes);
app.use("/api/locations", locationRoutes);
app.use("/api/finished-materials", finishedMaterialRoutes);
app.use(
  "/api/finished-material-stock",
  finishedMaterialStockRoutes
);

// =========================
// Auth Middleware
// =========================

const authMiddleware = require("./middleware/auth.middleware");


// =========================
// Role Middleware
// =========================

const roleMiddleware = require("./middleware/role.middleware");


// =========================
// Not Found Middleware
// =========================

const notFoundMiddleware = require("./middleware/notFound.middleware");


// =========================
// Error Middleware
// =========================

const errorMiddleware = require("./middleware/error.middleware");


// =========================
// Protected Test API
// =========================

app.get(
  "/api/protected-test",
  authMiddleware,
  (req, res) => {
    res.status(200).json({
      success: true,
      message: "Protected API is working",
      user: req.user,
    });
  }
);


// =========================
// Admin Only Test API
// =========================

app.get(
  "/api/admin-test",
  authMiddleware,
  roleMiddleware("admin"),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: "Admin API is working",
      user: req.user,
    });
  }
);


// =========================
// Health Check
// =========================

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "VeniPacker API is running",
  });
});


// =========================
// Not Found Middleware
// =========================

app.use(notFoundMiddleware);


// =========================
// Global Error Middleware
// =========================

app.use(errorMiddleware);


module.exports = app;