const {
  createFinishedMaterialProduct,
  getAllFinishedMaterialProducts,
  getFinishedMaterialProductById,
  updateFinishedMaterialProduct,
  deleteFinishedMaterialProduct,
} = require("./finished-material-product.service");

const createFinishedMaterialProductController = async (
  req,
  res,
  next
) => {
  try {
    const product =
      await createFinishedMaterialProduct(req.body);

    res.status(201).json({
      success: true,
      message:
        "Finished material product created successfully",
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

const getAllFinishedMaterialProductsController = async (
  req,
  res,
  next
) => {
  try {
    const { categoryId } = req.query;

    const products =
      await getAllFinishedMaterialProducts(categoryId);

    res.status(200).json({
      success: true,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

const getFinishedMaterialProductByIdController = async (
  req,
  res,
  next
) => {
  try {
    const product =
      await getFinishedMaterialProductById(req.params.id);

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

const updateFinishedMaterialProductController = async (
  req,
  res,
  next
) => {
  try {
    const product =
      await updateFinishedMaterialProduct(
        req.params.id,
        req.body
      );

    res.status(200).json({
      success: true,
      message:
        "Finished material product updated successfully",
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

const deleteFinishedMaterialProductController = async (
  req,
  res,
  next
) => {
  try {
    await deleteFinishedMaterialProduct(req.params.id);

    res.status(200).json({
      success: true,
      message:
        "Finished material product deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createFinishedMaterialProductController,
  getAllFinishedMaterialProductsController,
  getFinishedMaterialProductByIdController,
  updateFinishedMaterialProductController,
  deleteFinishedMaterialProductController,
};