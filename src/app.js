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
const nailPackingRoutes = require(
  "./modules/nail-packing/nail-packing.routes"
);
const stockTransferRoutes = require("./modules/stock-transfer/stock-transfer.routes");
const TaxRoutes = require("./modules/tax/tax.routes");
const stockTransactionRoutes = require(
  "./modules/StockTransaction/StockTransaction.routes"
);
const companyRoutes = require("./modules/company/company.routes");
const financeCategoryRoutes = require(
  "./modules/finance-category/finance-category.routes"
);
const dailyLogRoutes = require("./modules/daily-logs/daily-log.routes");
const bulkPaymentRoutes = require(
  "./modules/customerDelivery/bulkPayment.routes"
);
const employeeRoutes = require("./modules/employee/employee.routes");
const finishedMaterialStockRoutes = require(
  "./modules/finished-material-stock/finishedMaterialStock.routes"
);
const StaffRoutes = require("./modules/staff/staff.routes");
const orderRoutes = require("./modules/order/order.routes");
const employeeAttendanceRoutes = require(
  "./modules/employee-attendance/employee-attendance.routes"
);
const financeTransactionRoutes = require(
  "./modules/finance-transaction/finance-transaction.routes"
);
const customerDeliveryRoutes = require("./modules/customerDelivery/customerDelivery.routes");
const dailyProgramRoutes = require("./modules/dailyprogram/dailyProgram.routes");
const enquiryRoutes = require("./modules/enquiry/enquiry.routes");
const weeklySalaryRoutes = require('./modules/weekly-salary/weekly-salary.routes');
const categoryFieldRoutes = require("./modules/category-fields/category-field.routes");
const finishedMaterialProductStockRoutes = require(
  "./modules/finished-material-product-stock/finished-material-product-stock.routes"
);
const openingStockRoutes = require(
  "./modules/opening-stock/opening-stock.routes"
);
const finishedMaterialProductRoutes = require(
  "./modules/finished-material-products/finished-material-product.routes"
);
const salaryAdvanceRoutes = require(
  "./modules/salary-advance/salary-advance.routes"
);
const updateHistoryRoutes = require(
  "./modules/daily-history/update-history.routes"
);
const dailyHistoryRoutes = require(
  "./modules/daily-history/daily-history.routes"
);
const purchaseRoutes = require(
  "./modules/purchase/Purchase.routes"
);
const vehicleExpenseRoutes = require(
  "./modules/VehicleExpense/VehicleExpense.routes"
);
const contractWorkRoutes = require("./modules/contract-work/contract-work.routes");
const pieceSizeRoutes = require("./modules/piece-size/piece-size.routes");
const itemCategoryRoutes = require("./modules/item-categories/item-category.routes");
const propertyRoutes = require("./modules/property/property.routes");
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
app.use("/api/stock-transfers", stockTransferRoutes);
app.use("/api/company", companyRoutes);
app.use("/api/piece-size", pieceSizeRoutes);
app.use("/api/piece-size", pieceSizeRoutes);
app.use("/api/tax", TaxRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/nails", nailRoutes);
app.use("/api/consumables", consumableRoutes);
app.use("/api/nail-packing", nailPackingRoutes);
app.use(
  "/api/customer-delivery/bulk-payment",
  bulkPaymentRoutes
);
app.use(
  "/api/stock-transactions",
  stockTransactionRoutes
);
app.use("/api/daily-logs", dailyLogRoutes);
app.use(
  "/api/finance-categories",
  financeCategoryRoutes
);
app.use("/api/contract-work", contractWorkRoutes);
app.use(
  "/api/finance-transactions",
  financeTransactionRoutes
);
app.use(
  "/api/purchases",
  purchaseRoutes
);
app.use("/api/staff", StaffRoutes);
app.use(
  "/api/orders",
  orderRoutes
);
app.use(
  "/api/vehicle-expenses",
  vehicleExpenseRoutes
);
app.use(
  "/api/daily-programs",
  dailyProgramRoutes
);
app.use("/api/customer-delivery", customerDeliveryRoutes);
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
app.use(
  "/api/weekly-salary",
  weeklySalaryRoutes
);
app.use(
  "/api/salary-advance",
  salaryAdvanceRoutes
);
app.use("/api/employees", employeeRoutes);
app.use(
  "/api/opening-stock",
  openingStockRoutes
);
app.use("/api/enquiries", enquiryRoutes);
app.use("/api/properties", propertyRoutes);
app.use(
  "/api/daily-history",
  dailyHistoryRoutes
);
app.use(
  "/api/employee-attendance",
  employeeAttendanceRoutes
);
app.use("/api/category-fields", categoryFieldRoutes);
app.use("/api/item-categories", itemCategoryRoutes);
app.use(
  "/api/finished-material-products",
  finishedMaterialProductRoutes
);
app.use(
  "/api/finished-material-product-stock",
  finishedMaterialProductStockRoutes
);
app.use(
  "/api/update-history",
  updateHistoryRoutes
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