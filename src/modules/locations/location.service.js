const Location = require("./location.model");

// =========================
// CREATE LOCATION
// =========================

const createLocation = async ({ name }) => {
  const existingLocation = await Location.findOne({
    name,
  });

  if (existingLocation) {
    throw new Error("Location already exists");
  }

  const location = await Location.create({
    name,
  });

  return location;
};


// =========================
// GET ALL LOCATIONS
// =========================

const getAllLocations = async () => {
  const locations = await Location.find()
    .sort({ createdAt: 1 });

  return locations;
};


// =========================
// GET LOCATION BY ID
// =========================

const getLocationById = async (locationId) => {
  const location = await Location.findById(
    locationId
  );

  if (!location) {
    throw new Error("Location not found");
  }

  return location;
};


// =========================
// UPDATE LOCATION
// =========================

const updateLocation = async (
  locationId,
  { name, isActive }
) => {
  const location = await Location.findById(
    locationId
  );

  if (!location) {
    throw new Error("Location not found");
  }

  if (name && name !== location.name) {
    const existingLocation = await Location.findOne({
      name,
      _id: { $ne: locationId },
    });

    if (existingLocation) {
      throw new Error("Location already exists");
    }

    location.name = name;
  }

  if (isActive !== undefined) {
    location.isActive = isActive;
  }

  await location.save();

  return location;
};


// =========================
// DELETE LOCATION
// =========================

const deleteLocation = async (locationId) => {
  const location = await Location.findById(
    locationId
  );

  if (!location) {
    throw new Error("Location not found");
  }

  await Location.findByIdAndDelete(locationId);

  return {
    id: location._id,
    message: "Location deleted successfully",
  };
};


module.exports = {
  createLocation,
  getAllLocations,
  getLocationById,
  updateLocation,
  deleteLocation,
};