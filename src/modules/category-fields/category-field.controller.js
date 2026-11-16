const {
  createCategoryField,
  getAllCategoryFields,
  getCategoryFieldById,
  updateCategoryField,
  deleteCategoryField,
} = require("./category-field.service");

const createCategoryFieldController = async (req, res, next) => {
  try {
    const categoryField = await createCategoryField(req.body);

    res.status(201).json({
      success: true,
      message: "Category field created successfully",
      data: categoryField,
    });
  } catch (error) {
    next(error);
  }
};

const getAllCategoryFieldsController = async (req, res, next) => {
  try {
    const { categoryId } = req.query;

    const categoryFields = await getAllCategoryFields(categoryId);

    res.status(200).json({
      success: true,
      data: categoryFields,
    });
  } catch (error) {
    next(error);
  }
};

const getCategoryFieldByIdController = async (req, res, next) => {
  try {
    const categoryField = await getCategoryFieldById(req.params.id);

    res.status(200).json({
      success: true,
      data: categoryField,
    });
  } catch (error) {
    next(error);
  }
};

const updateCategoryFieldController = async (req, res, next) => {
  try {
    const categoryField = await updateCategoryField(
      req.params.id,
      req.body
    );

    res.status(200).json({
      success: true,
      message: "Category field updated successfully",
      data: categoryField,
    });
  } catch (error) {
    next(error);
  }
};

const deleteCategoryFieldController = async (req, res, next) => {
  try {
    await deleteCategoryField(req.params.id);

    res.status(200).json({
      success: true,
      message: "Category field deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCategoryFieldController,
  getAllCategoryFieldsController,
  getCategoryFieldByIdController,
  updateCategoryFieldController,
  deleteCategoryFieldController,
};