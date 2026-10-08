const finishedMaterialService = require("./finishedMaterial.service");

// CREATE FINISHED MATERIAL
const createFinishedMaterial = async (req, res, next) => {
  try {
    const material =
      await finishedMaterialService.createFinishedMaterial(
        req.body
      );

    res.status(201).json({
      success: true,
      message: "Finished material created successfully",
      data: material,
    });
  } catch (error) {
    next(error);
  }
};


// GET ALL FINISHED MATERIALS
const getAllFinishedMaterials = async (req, res, next) => {
  try {
    const materials =
      await finishedMaterialService.getAllFinishedMaterials();

    res.status(200).json({
      success: true,
      data: materials,
    });
  } catch (error) {
    next(error);
  }
};


// GET FINISHED MATERIAL BY ID
const getFinishedMaterialById = async (req, res, next) => {
  try {
    const material =
      await finishedMaterialService.getFinishedMaterialById(
        req.params.id
      );

    res.status(200).json({
      success: true,
      data: material,
    });
  } catch (error) {
    next(error);
  }
};


// UPDATE FINISHED MATERIAL
const updateFinishedMaterial = async (req, res, next) => {
  try {
    const material =
      await finishedMaterialService.updateFinishedMaterial(
        req.params.id,
        req.body
      );

    res.status(200).json({
      success: true,
      message: "Finished material updated successfully",
      data: material,
    });
  } catch (error) {
    next(error);
  }
};


// DELETE FINISHED MATERIAL
const deleteFinishedMaterial = async (req, res, next) => {
  try {
    const result =
      await finishedMaterialService.deleteFinishedMaterial(
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
  createFinishedMaterial,
  getAllFinishedMaterials,
  getFinishedMaterialById,
  updateFinishedMaterial,
  deleteFinishedMaterial,
};