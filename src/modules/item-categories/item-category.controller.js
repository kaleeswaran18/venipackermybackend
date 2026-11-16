const itemCategoryService = require("./item-category.service");

const createItemCategory = async (req, res, next) => {
  try {
    const category = await itemCategoryService.createItemCategory(
      req.body
    );

    res.status(201).json({
      success: true,
      message: "Item category created successfully",
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

const getItemCategories = async (req, res, next) => {
  try {
    const categories =
      await itemCategoryService.getItemCategories();

    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

const getItemCategoryById = async (req, res, next) => {
  try {
    const category =
      await itemCategoryService.getItemCategoryById(req.params.id);

    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

const updateItemCategory = async (req, res, next) => {
  try {
    const category =
      await itemCategoryService.updateItemCategory(
        req.params.id,
        req.body
      );

    res.status(200).json({
      success: true,
      message: "Item category updated successfully",
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

const deleteItemCategory = async (req, res, next) => {
  try {
    const result =
      await itemCategoryService.deleteItemCategory(req.params.id);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createItemCategory,
  getItemCategories,
  getItemCategoryById,
  updateItemCategory,
  deleteItemCategory,
};