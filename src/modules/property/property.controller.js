
const propertyService = require("./property.service");

// CREATE PROPERTY
const createProperty = async (req, res, next) => {
  try {
    const property = await propertyService.createProperty(req.body);

    res.status(201).json({
      success: true,
      message: "Property created successfully",
      data: property,
    });
  } catch (error) {
    next(error);
  }
};

// GET ALL PROPERTIES
const getAllProperties = async (req, res, next) => {
  try {
    const properties = await propertyService.getAllProperties();

    res.status(200).json({
      success: true,
      message: "Properties fetched successfully",
      data: properties,
    });
  } catch (error) {
    next(error);
  }
};

// GET PROPERTY BY ID
const getPropertyById = async (req, res, next) => {
  try {
    const property = await propertyService.getPropertyById(req.params.id);

    res.status(200).json({
      success: true,
      message: "Property fetched successfully",
      data: property,
    });
  } catch (error) {
    next(error);
  }
};

// UPDATE PROPERTY
const updateProperty = async (req, res, next) => {
  try {
    const property = await propertyService.updateProperty(
      req.params.id,
      req.body,
      req.user._id
    );

    res.status(200).json({
      success: true,
      message: "Property updated successfully",
      data: property,
    });
  } catch (error) {
    next(error);
  }
};

// CREATE RENT PAYMENT
const createRentPayment = async (req, res, next) => {
  try {
    const result = await propertyService.createRentPayment(
      req.params.id,
      req.body,
      req.user._id
    );

    res.status(201).json({
      success: true,
      message: "Rent payment saved and finance income created successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE PROPERTY
const deleteProperty = async (req, res, next) => {
  try {
    const result = await propertyService.deleteProperty(req.params.id);

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
  createProperty,
  getAllProperties,
  getPropertyById,
  updateProperty,
  createRentPayment,
  deleteProperty,
};
