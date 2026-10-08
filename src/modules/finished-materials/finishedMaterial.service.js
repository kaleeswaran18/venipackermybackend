const FinishedMaterial = require("./finishedMaterial.model");

// CREATE FINISHED MATERIAL
const createFinishedMaterial = async ({ name }) => {
  const existingMaterial = await FinishedMaterial.findOne({
    name,
  });

  if (existingMaterial) {
    throw new Error("Finished material already exists");
  }

  const material = await FinishedMaterial.create({
    name,
  });

  return material;
};


// GET ALL FINISHED MATERIALS
const getAllFinishedMaterials = async () => {
  const materials = await FinishedMaterial.find()
    .sort({ name: 1 });

  return materials;
};


// GET FINISHED MATERIAL BY ID
const getFinishedMaterialById = async (materialId) => {
  const material = await FinishedMaterial.findById(
    materialId
  );

  if (!material) {
    throw new Error("Finished material not found");
  }

  return material;
};


// UPDATE FINISHED MATERIAL
const updateFinishedMaterial = async (
  materialId,
  { name, isActive }
) => {
  const material = await FinishedMaterial.findById(
    materialId
  );

  if (!material) {
    throw new Error("Finished material not found");
  }

  if (name && name !== material.name) {
    const existingMaterial =
      await FinishedMaterial.findOne({
        name,
        _id: { $ne: materialId },
      });

    if (existingMaterial) {
      throw new Error(
        "Finished material already exists"
      );
    }

    material.name = name;
  }

  if (isActive !== undefined) {
    material.isActive = isActive;
  }

  await material.save();

  return material;
};


// DELETE FINISHED MATERIAL
const deleteFinishedMaterial = async (materialId) => {
  const material = await FinishedMaterial.findById(
    materialId
  );

  if (!material) {
    throw new Error("Finished material not found");
  }

  await FinishedMaterial.findByIdAndDelete(materialId);

  return {
    id: material._id,
    message: "Finished material deleted successfully",
  };
};


module.exports = {
  createFinishedMaterial,
  getAllFinishedMaterials,
  getFinishedMaterialById,
  updateFinishedMaterial,
  deleteFinishedMaterial,
};