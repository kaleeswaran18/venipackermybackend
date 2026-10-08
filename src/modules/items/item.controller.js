const itemService = require("./item.service");

// =========================
// CREATE ITEM
// =========================

const createItem = async (req, res, next) => {
  try {
    const item = await itemService.createItem(
      req.body
    );

    res.status(201).json({
      success: true,
      message: "Item created successfully",
      data: item,
    });
  } catch (error) {
    next(error);
  }
};


// =========================
// GET ALL ITEMS
// =========================

const getAllItems = async (req, res, next) => {
  try {
    const items = await itemService.getAllItems();

    res.status(200).json({
      success: true,
      message: "Items fetched successfully",
      data: items,
    });
  } catch (error) {
    next(error);
  }
};


// =========================
// GET ITEM BY ID
// =========================

const getItemById = async (req, res, next) => {
  try {
    const item = await itemService.getItemById(
      req.params.id
    );

    res.status(200).json({
      success: true,
      message: "Item fetched successfully",
      data: item,
    });
  } catch (error) {
    next(error);
  }
};


// =========================
// UPDATE ITEM
// =========================

const updateItem = async (req, res, next) => {
  try {
    const item = await itemService.updateItem(
      req.params.id,
      req.body
    );

    res.status(200).json({
      success: true,
      message: "Item updated successfully",
      data: item,
    });
  } catch (error) {
    next(error);
  }
};


// =========================
// DELETE ITEM
// =========================

const deleteItem = async (req, res, next) => {
  try {
    const result = await itemService.deleteItem(
      req.params.id
    );

    res.status(200).json({
      success: true,
      message: result.message,
      data: {
        id: result.id,
      },
    });
  } catch (error) {
    next(error);
  }
};


module.exports = {
  createItem,
  getAllItems,
  getItemById,
  updateItem,
  deleteItem,
};