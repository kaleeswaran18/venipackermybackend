const locationService = require("./location.service");

// =========================
// CREATE LOCATION
// =========================

const createLocation = async (req, res, next) => {
  try {
    const location = await locationService.createLocation(
      req.body
    );

    res.status(201).json({
      success: true,
      message: "Location created successfully",
      data: location,
    });
  } catch (error) {
    next(error);
  }
};


// =========================
// GET ALL LOCATIONS
// =========================

const getAllLocations = async (req, res, next) => {
  try {
    const locations =
      await locationService.getAllLocations();

    res.status(200).json({
      success: true,
      message: "Locations fetched successfully",
      data: locations,
    });
  } catch (error) {
    next(error);
  }
};


// =========================
// GET LOCATION BY ID
// =========================

const getLocationById = async (req, res, next) => {
  try {
    const location =
      await locationService.getLocationById(
        req.params.id
      );

    res.status(200).json({
      success: true,
      message: "Location fetched successfully",
      data: location,
    });
  } catch (error) {
    next(error);
  }
};


// =========================
// UPDATE LOCATION
// =========================

const updateLocation = async (req, res, next) => {
  try {
    const location =
      await locationService.updateLocation(
        req.params.id,
        req.body
      );

    res.status(200).json({
      success: true,
      message: "Location updated successfully",
      data: location,
    });
  } catch (error) {
    next(error);
  }
};


// =========================
// DELETE LOCATION
// =========================

const deleteLocation = async (req, res, next) => {
  try {
    const result =
      await locationService.deleteLocation(
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
  createLocation,
  getAllLocations,
  getLocationById,
  updateLocation,
  deleteLocation,
};