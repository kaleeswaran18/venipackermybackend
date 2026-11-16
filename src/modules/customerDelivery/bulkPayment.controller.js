
const bulkPaymentService = require("./bulkPayment.service");

// =========================
// GET COMPANY PENDING ORDERS
// GET /bulk-payment/pending-orders/:companyId
// =========================

const getPendingOrders = async (req, res) => {
  try {
    const { companyId } = req.params;

    // Call the actual service function name
    const result =
      await bulkPaymentService.getPendingOrdersByCompany(
        companyId
      );

    return res.status(200).json({
      success: true,
      message: "Pending orders fetched successfully",
      data: {
        orders: (result.pendingOrders || []).map((order) => ({
          _id: String(order.orderId),
          orderNo: order.orderNo,
          orderDate: order.orderDate,
          totalAmount: Number(order.totalAmount || 0),
          alreadyPaidAmount: Number(
            order.alreadyPaidAmount || 0
          ),
          pendingAmount: Number(order.pendingAmount || 0),
        })),

        totalPending: Number(
          result.totalOutstandingAmount || 0
        ),

        totalOrders: Number(
          result.pendingOrderCount || 0
        ),
      },
    });
  } catch (error) {
    console.error("Get Pending Orders Error:", error);

    return res.status(400).json({
      success: false,
      message:
        error.message || "Failed to fetch pending orders",
    });
  }
};

// =========================
// CREATE BULK PAYMENT
// POST /bulk-payment
// =========================

const createBulkPayment = async (req, res) => {
  try {
    const userId =
      req.user?._id || req.user?.id || null;

    const result =
      await bulkPaymentService.createBulkPayment(
        req.body,
        userId
      );

    return res.status(201).json({
      success: true,
      message: "Bulk payment created successfully",
      data: result,
    });
  } catch (error) {
    console.error("Create Bulk Payment Error:", error);

    return res.status(400).json({
      success: false,
      message:
        error.message || "Failed to create bulk payment",
    });
  }
};

// =========================
// UPDATE BULK PAYMENT
// PATCH /bulk-payment/:id
// =========================

const updateBulkPayment = async (req, res) => {
  try {
    const { id } = req.params;

    const userId =
      req.user?._id || req.user?.id || null;

    const result =
      await bulkPaymentService.updateBulkPayment(
        id,
        req.body,
        userId
      );

    return res.status(200).json({
      success: true,
      message: "Bulk payment updated successfully",
      data: result,
    });
  } catch (error) {
    console.error("Update Bulk Payment Error:", error);

    return res.status(400).json({
      success: false,
      message:
        error.message || "Failed to update bulk payment",
    });
  }
};

// =========================
// GET BULK PAYMENT BY ID
// GET /bulk-payment/:id
// =========================

const getBulkPaymentById = async (req, res) => {
  try {
    const { id } = req.params;

    const result =
      await bulkPaymentService.getBulkPaymentById(id);

    return res.status(200).json({
      success: true,
      message: "Bulk payment fetched successfully",
      data: result,
    });
  } catch (error) {
    console.error("Get Bulk Payment Error:", error);

    return res.status(400).json({
      success: false,
      message:
        error.message || "Failed to fetch bulk payment",
    });
  }
};

// =========================
// GET ALL BULK PAYMENTS
// GET /bulk-payment
// =========================

const getAllBulkPayments = async (req, res) => {
  try {
    const result =
      await bulkPaymentService.getAllBulkPayments(
        req.query
      );

    return res.status(200).json({
      success: true,
      message: "Bulk payments fetched successfully",
      total: result.length,
      data: result,
    });
  } catch (error) {
    console.error("Get All Bulk Payments Error:", error);

    return res.status(400).json({
      success: false,
      message:
        error.message || "Failed to fetch bulk payments",
    });
  }
};

// =========================
// EXPORTS
// =========================

module.exports = {
  getPendingOrders,
  createBulkPayment,
  updateBulkPayment,
  getBulkPaymentById,
  getAllBulkPayments,
};
