
const CategoryField = require("./category-field.model");

const OverallStock = require(
  "../finished-material-product-stock/finished-material-product-stock.model"
);

const DailyHistory = require(
  "../daily-history/daily-history.model"
);


// ----------------------------------------
// HELPER: GET REFERENCE ID
// ----------------------------------------

const getReferenceId = (value) => {
  if (!value) return null;

  return value._id
    ? value._id.toString()
    : value.toString();
};


// ----------------------------------------
// CREATE CATEGORY FIELD
// ----------------------------------------

const createCategoryField = async (data) => {
  const existingField = await CategoryField.findOne({
    categoryId: data.categoryId,
    key: data.key,
  });

  if (existingField) {
    const error = new Error(
      "This field already exists for this category"
    );

    error.statusCode = 409;
    throw error;
  }

  // Create category field
  const createdField = await CategoryField.create(data);

  const categoryId = createdField.categoryId;
  const fieldKey = createdField.key || createdField.name;

  if (!fieldKey) {
    return createdField;
  }

  // ----------------------------------------
  // STEP 1: UPDATE ALL OVERALL STOCKS
  // ----------------------------------------

  await OverallStock.updateMany(
    {
      categoryId,
      [`values.${fieldKey}`]: {
        $exists: false,
      },
    },
    {
      $set: {
        [`values.${fieldKey}`]: 0,
      },
    }
  );

  // ----------------------------------------
  // STEP 2: GET EXISTING DAILY HISTORIES
  // ----------------------------------------

  const dailyHistories = await DailyHistory.find({
    "production.categories.categoryId": categoryId,
  });

  // ----------------------------------------
  // STEP 3: UPDATE PRODUCTION PRODUCTS
  // ----------------------------------------

  for (const dailyHistory of dailyHistories) {
    let isModified = false;

    for (const location of dailyHistory.production || []) {
      for (const category of location.categories || []) {

        // Match category
        if (
          getReferenceId(category.categoryId) !==
          categoryId.toString()
        ) {
          continue;
        }

        // Update all products
        for (const product of category.products || []) {
          if (!product.values) {
            product.values = {};
          }

          const values = product.values;

          // Handle Map or normal object
          if (values instanceof Map) {
            if (!values.has(fieldKey)) {
              values.set(fieldKey, 0);
              isModified = true;
            }
          } else {
            if (values[fieldKey] === undefined) {
              values[fieldKey] = 0;
              isModified = true;
            }
          }
        }
      }
    }

    // Save only when something changed
    if (isModified) {
      dailyHistory.markModified("production");

      await dailyHistory.save();
    }
  }

  // Return same response type as before
  return createdField;
};


// ----------------------------------------
// GET ALL CATEGORY FIELDS
// ----------------------------------------

const getAllCategoryFields = async (categoryId = null) => {
  const filter = {};

  if (categoryId) {
    filter.categoryId = categoryId;
  }

  return await CategoryField.find(filter)
    .populate("categoryId", "name")
    .sort({ order: 1 });
};


// ----------------------------------------
// GET CATEGORY FIELD BY ID
// ----------------------------------------

const getCategoryFieldById = async (id) => {
  const categoryField = await CategoryField.findById(id)
    .populate("categoryId", "name");

  if (!categoryField) {
    const error = new Error(
      "Category field not found"
    );

    error.statusCode = 404;
    throw error;
  }

  return categoryField;
};


// ----------------------------------------
// UPDATE CATEGORY FIELD
// ----------------------------------------

const updateCategoryField = async (id, data) => {
  const existingField = await CategoryField.findById(id);

  if (!existingField) {
    const error = new Error(
      "Category field not found"
    );

    error.statusCode = 404;
    throw error;
  }

  if (data.categoryId || data.key) {
    const categoryId =
      data.categoryId || existingField.categoryId;

    const key = data.key || existingField.key;

    const duplicateField = await CategoryField.findOne({
      categoryId,
      key,
      _id: { $ne: id },
    });

    if (duplicateField) {
      const error = new Error(
        "This field already exists for this category"
      );

      error.statusCode = 409;
      throw error;
    }
  }

  Object.assign(existingField, data);

  return await existingField.save();
};


// ----------------------------------------
// DELETE CATEGORY FIELD
// ----------------------------------------

const deleteCategoryField = async (id) => {
  const categoryField = await CategoryField.findById(id);

  if (!categoryField) {
    const error = new Error(
      "Category field not found"
    );

    error.statusCode = 404;
    throw error;
  }

  await CategoryField.findByIdAndDelete(id);

  return categoryField;
};


module.exports = {
  createCategoryField,
  getAllCategoryFields,
  getCategoryFieldById,
  updateCategoryField,
  deleteCategoryField,
};
