const FinishedMaterialProduct = require(
  "./finished-material-product.model"
);

const createFinishedMaterialProduct = async (data) => {
  const companyName = data.companyName?.trim() || "";

  const existingProduct =
    await FinishedMaterialProduct.findOne({
      categoryId: data.categoryId,
      companyName,
      name: data.name,
    });

  if (existingProduct) {
    const error = new Error(
      "This product already exists for this company in this category"
    );
    error.statusCode = 409;
    throw error;
  }

  return await FinishedMaterialProduct.create({
    ...data,
    companyName,
  });
};

const getAllFinishedMaterialProducts = async (
  categoryId = null
) => {
  const filter = {};

  if (categoryId) {
    filter.categoryId = categoryId;
  }

  return await FinishedMaterialProduct.find(filter)
    .populate("categoryId", "name")
    .sort({ name: 1 });
};

const getFinishedMaterialProductById = async (id) => {
  const product =
    await FinishedMaterialProduct.findById(id).populate(
      "categoryId",
      "name"
    );

  if (!product) {
    const error = new Error(
      "Finished material product not found"
    );
    error.statusCode = 404;
    throw error;
  }

  return product;
};

const updateFinishedMaterialProduct = async (
  id,
  data
) => {
  const existingProduct =
    await FinishedMaterialProduct.findById(id);

  if (!existingProduct) {
    const error = new Error(
      "Finished material product not found"
    );
    error.statusCode = 404;
    throw error;
  }

  const categoryId =
    data.categoryId || existingProduct.categoryId;

  const name =
    data.name || existingProduct.name;

  const companyName =
    data.companyName !== undefined
      ? data.companyName.trim()
      : existingProduct.companyName || "";

  if (
    data.categoryId ||
    data.name ||
    data.companyName !== undefined
  ) {
    const duplicateProduct =
      await FinishedMaterialProduct.findOne({
        categoryId,
        companyName,
        name,
        _id: { $ne: id },
      });

    if (duplicateProduct) {
      const error = new Error(
        "This product already exists for this company in this category"
      );
      error.statusCode = 409;
      throw error;
    }
  }

  Object.assign(existingProduct, {
    ...data,
    companyName,
  });

  return await existingProduct.save();
};

const deleteFinishedMaterialProduct = async (id) => {
  const product =
    await FinishedMaterialProduct.findById(id);

  if (!product) {
    const error = new Error(
      "Finished material product not found"
    );
    error.statusCode = 404;
    throw error;
  }

  await FinishedMaterialProduct.findByIdAndDelete(id);

  return product;
};

module.exports = {
  createFinishedMaterialProduct,
  getAllFinishedMaterialProducts,
  getFinishedMaterialProductById,
  updateFinishedMaterialProduct,
  deleteFinishedMaterialProduct,
};