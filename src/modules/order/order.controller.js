const orderService = require("./order.service");

// =========================
// CREATE ORDER
// POST /api/orders
// =========================

const createOrder = async (
  req,
  res,
  next
) => {
  try {
    const order =
      await orderService.createOrder(
        req.body
      );

    res.status(201).json({
      success: true,

      message:
        "Order created successfully",

      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// =========================
// GET ALL ORDERS
// GET /api/orders
// =========================

const getAllOrders = async (
  req,
  res,
  next
) => {
  try {
    const orders =
      await orderService.getAllOrders();

    res.status(200).json({
      success: true,

      count: orders.length,

      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

// =========================
// GET ORDER BY ID
// GET /api/orders/:id
// =========================

const getOrderById = async (
  req,
  res,
  next
) => {
  try {
    const order =
      await orderService.getOrderById(
        req.params.id
      );

    res.status(200).json({
      success: true,

      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// =========================
// UPDATE ORDER
// PATCH /api/orders/:id
// =========================

const updateOrder = async (
  req,
  res,
  next
) => {
  try {
    const order =
      await orderService.updateOrder(
        req.params.id,
        req.body
      );

    res.status(200).json({
      success: true,

      message:
        "Order updated successfully",

      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// =========================
// DELETE ORDER
// DELETE /api/orders/:id
// =========================

const deleteOrder = async (
  req,
  res,
  next
) => {
  try {
    const result =
      await orderService.deleteOrder(
        req.params.id
      );

    res.status(200).json({
      success: true,

      message:
        result.message,

      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
};