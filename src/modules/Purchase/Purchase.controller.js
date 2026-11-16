const {
  createPurchase,
  getPurchases,
  getPurchaseById,
  updatePurchase,
  deletePurchase,
} = require("./Purchase.service");

// =========================
// Create Purchase
// =========================

const createPurchaseController = async (req, res) => {
  try {
    console.log("purchase", req.user.userId);
    const purchase = await createPurchase(
      req.body,
      req.user.userId
    );

    return res.status(201).json({
      success: true,
      message: "Purchase created successfully",
      data: purchase,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// =========================
// Get All Purchases
// =========================

const getPurchasesController = async (
  req,
  res,
  next
) => {
  try {
    const purchases =
      await getPurchases();

    res.status(200).json({
      success: true,
      data: purchases,
    });
  } catch (error) {
    next(error);
  }
};

// =========================
// Get Purchase By ID
// =========================

const getPurchaseByIdController = async (
  req,
  res,
  next
) => {
  try {
    const purchase =
      await getPurchaseById(
        req.params.id
      );

    res.status(200).json({
      success: true,
      data: purchase,
    });
  } catch (error) {
    next(error);
  }
};

// =========================
// Update Purchase
// =========================

const updatePurchaseController = async (
  req,
  res,
  next
) => {
  try {
    const purchase =
      await updatePurchase(
        req.params.id,
        req.body,
         req.user.userId
      );

    res.status(200).json({
      success: true,
      message:
        "Purchase updated successfully",
      data: purchase,
    });
  } catch (error) {
    next(error);
  }
};

// =========================
// Delete Purchase
// =========================

const deletePurchaseController = async (
  req,
  res,
  next
) => {
  try {
    const result =
      await deletePurchase(
        req.params.id
      );

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPurchaseController,
  getPurchasesController,
  getPurchaseByIdController,
  updatePurchaseController,
  deletePurchaseController,
};