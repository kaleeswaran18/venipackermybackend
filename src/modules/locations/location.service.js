
const Location = require("./location.model");

const dailyHistoryService = require(
  "../daily-history/daily-history.service"
);

const DailyHistory = require(
  "../daily-history/daily-history.model"
);

const FinishedMaterialProduct = require(
  "../finished-material-products/finished-material-product.model"
);

const FinishedMaterial = require(
  "../finished-materials/finishedMaterial.model"
);

const CategoryField = require(
  "../category-fields/category-field.model"
);

const OpeningStock = require(
  "../opening-stock/opening-stock.model"
);

const OverallStock = require(
  "../finished-material-product-stock/finished-material-product-stock.model"
);

const Item = require("../items/item.model");
const ItemCategory = require("../item-categories/item-category.model");
const Nail = require("../nails/nail.model");
const Consumable = require("../consumables/consumable.model");
const PieceSize = require("../piece-size/piece-size.model");


// ========================================
// INITIALIZE OPENING STOCK FOR NEW LOCATION
// ========================================

const initializeOpeningStockForLocation = async (locationId) => {
  const [categories, items, nails, consumables, pieceSizes] =
    await Promise.all([
      ItemCategory.find({ isActive: true })
        .select("_id name")
        .lean(),

      Item.find()
        .select("_id name")
        .lean(),

      Nail.find({ isActive: true })
        .select("_id name")
        .lean(),

      Consumable.find({ isActive: true })
        .select("_id name")
        .lean(),

      PieceSize.find()
        .select("_id width inch height")
        .lean(),
    ]);

  // Reuse unit from the same master record
  // in another location.
  const existingTemplates = await OpeningStock.find({
    location: { $ne: locationId },
  })
    .select("type category referenceId unit")
    .lean();

  const unitByKey = new Map();

  for (const stock of existingTemplates) {
    const key =
      `${stock.type}:${stock.category?.toString() || "none"}:${stock.referenceId.toString()}`;

    if (stock.unit && !unitByKey.has(key)) {
      unitByKey.set(key, stock.unit);
    }
  }

  const operations = [];

  const normalizedCategory = (name) =>
    (name || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "");

  // ========================================
  // ITEMS - NEW ITEM AND USED ITEM
  // ========================================

  for (const category of categories) {
    const categoryName = normalizedCategory(category.name);

    if (!["newitem", "useditem"].includes(categoryName)) {
      continue;
    }

    for (const item of items) {
      const base = {
        location: locationId,
        type: "item",
        category: category._id,
        referenceId: item._id,
      };

      const unitKey =
        `item:${category._id.toString()}:${item._id.toString()}`;

      let document;

      if (categoryName === "newitem") {
        document = {
          ...base,
          cft: 0,
          cubicMeter: 0,

          pieces: pieceSizes.map((piece) => ({
            pieceSizeId: piece._id,
            width: piece.width,
            inch: piece.inch,
            height: piece.height,
            count: 0,
          })),
        };
      } else {
        document = {
          ...base,
          quantity: 0,
          currentStock: 0,

          ...(unitByKey.has(unitKey)
            ? { unit: unitByKey.get(unitKey) }
            : {}),
        };
      }

      operations.push({
        updateOne: {
          filter: base,
          update: {
            $setOnInsert: document,
          },
          upsert: true,
        },
      });
    }
  }

  // ========================================
  // NAILS
  // ========================================

  for (const nail of nails) {
    const base = {
      location: locationId,
      type: "nail",
      referenceId: nail._id,
    };

    const unitKey =
      `nail:none:${nail._id.toString()}`;

    const document = {
      ...base,
      quantity: 0,
      currentStock: 0,

      ...(unitByKey.has(unitKey)
        ? { unit: unitByKey.get(unitKey) }
        : {}),
    };

    operations.push({
      updateOne: {
        filter: base,
        update: {
          $setOnInsert: document,
        },
        upsert: true,
      },
    });
  }

  // ========================================
  // CONSUMABLES
  // ========================================

  for (const consumable of consumables) {
    const base = {
      location: locationId,
      type: "consumable",
      referenceId: consumable._id,
    };

    const unitKey =
      `consumable:none:${consumable._id.toString()}`;

    const document = {
      ...base,
      quantity: 0,
      currentStock: 0,

      ...(unitByKey.has(unitKey)
        ? { unit: unitByKey.get(unitKey) }
        : {}),
    };

    operations.push({
      updateOne: {
        filter: base,
        update: {
          $setOnInsert: document,
        },
        upsert: true,
      },
    });
  }

  if (!operations.length) return 0;

  const result = await OpeningStock.bulkWrite(
    operations,
    { ordered: false }
  );

  return result.upsertedCount || 0;
};


// ========================================
// CREATE LOCATION
// ========================================

const createLocation = async ({ name }) => {
  const existingLocation = await Location.findOne({
    name,
  });

  if (existingLocation) {
    throw new Error("Location already exists");
  }

  // 1. Create Location
  const location = await Location.create({
    name,
  });

  // 2. Check today's Daily History
  let dailyHistory = null;

  try {
    dailyHistory =
      await dailyHistoryService.getTodayDailyHistory();
  } catch (error) {
    // Daily History not found - skip remaining processes
    if (error.statusCode === 404) {
      return {
        location,
        dailyHistoryId: null,
        message:
          "Location created successfully. Daily History not found. Initialization skipped.",
      };
    }

    // Other errors should not be ignored
    throw error;
  }

  // Safety check
  if (!dailyHistory?._id) {
    return {
      location,
      dailyHistoryId: null,
      message:
        "Location created successfully. Daily History not found. Initialization skipped.",
    };
  }

  const dailyHistoryId = dailyHistory._id;

  // 3. Create missing Opening Stock records
  await initializeOpeningStockForLocation(location._id);

  // 4. Add Production
  await addLocationToProduction(
    dailyHistoryId,
    location._id
  );

  // 5. Add Consumption from Opening Stock
  await addLocationToConsumption(
    dailyHistoryId,
    location._id
  );

  // 6. Create Overall Stock
  await addLocationToOverallStock(location._id);

  return {
    location,
    dailyHistoryId,
  };
};


// ========================================
// ADD LOCATION TO PRODUCTION
// ========================================

const addLocationToProduction = async (
  dailyHistoryId,
  locationId
) => {
  const dailyHistory =
    await DailyHistory.findById(dailyHistoryId);

  if (!dailyHistory) {
    const error = new Error("Daily history not found");
    error.statusCode = 404;
    throw error;
  }

  if (!Array.isArray(dailyHistory.production)) {
    dailyHistory.production = [];
  }

  let locationProduction = dailyHistory.production.find(
    (item) =>
      item.locationId?.toString() === locationId.toString()
  );

  let isModified = false;

  if (!locationProduction) {
    locationProduction = {
      locationId,
      categories: [],
    };

    dailyHistory.production.push(locationProduction);

    locationProduction = dailyHistory.production[
      dailyHistory.production.length - 1
    ];

    isModified = true;
  }

  if (!Array.isArray(locationProduction.categories)) {
    locationProduction.categories = [];
    isModified = true;
  }

  const categories = await FinishedMaterial.find()
    .select("_id name")
    .lean();

  for (const categoryInfo of categories) {
    const products = await FinishedMaterialProduct.find({
      categoryId: categoryInfo._id,
    })
      .select("_id name categoryId")
      .lean();

    const categoryFields = await CategoryField.find({
      categoryId: categoryInfo._id,
    })
      .select("_id key name")
      .lean();

    const fieldKeys = categoryFields
      .map((field) => field.key || field.name)
      .filter(Boolean);

    let productionCategory =
      locationProduction.categories.find(
        (item) =>
          item.categoryId?.toString() ===
          categoryInfo._id.toString()
      );

    if (!productionCategory) {
      productionCategory = {
        categoryId: categoryInfo._id,
        products: [],
      };

      locationProduction.categories.push(productionCategory);

      productionCategory = locationProduction.categories[
        locationProduction.categories.length - 1
      ];

      isModified = true;
    }

    if (!Array.isArray(productionCategory.products)) {
      productionCategory.products = [];
      isModified = true;
    }

    for (const productInfo of products) {
      let productionProduct =
        productionCategory.products.find(
          (item) =>
            item.productId?.toString() ===
            productInfo._id.toString()
        );

      // Create missing product
      if (!productionProduct) {
        const values = {};

        for (const fieldKey of fieldKeys) {
          values[fieldKey] = 0;
        }

        productionCategory.products.push({
          productId: productInfo._id,
          values,
        });

        isModified = true;
        continue;
      }

      // Add missing fields only
      if (!productionProduct.values) {
        productionProduct.values = {};
        isModified = true;
      }

      for (const fieldKey of fieldKeys) {
        if (productionProduct.values instanceof Map) {
          if (!productionProduct.values.has(fieldKey)) {
            productionProduct.values.set(fieldKey, 0);
            isModified = true;
          }
        } else if (
          productionProduct.values[fieldKey] === undefined
        ) {
          productionProduct.values[fieldKey] = 0;
          isModified = true;
        }
      }
    }
  }

  if (isModified) {
    dailyHistory.markModified("production");
    await dailyHistory.save();
  }

  return dailyHistory.production;
};


// ========================================
// ADD LOCATION TO OVERALL STOCK
// ========================================

const addLocationToOverallStock = async (locationId) => {
  const categories = await FinishedMaterial.find()
    .select("_id name")
    .lean();

  const existingStocks = await OverallStock.find({
    locationId,
  })
    .select("categoryId productId")
    .lean();

  const existingKeys = new Set(
    existingStocks.map(
      (stock) =>
        `${stock.categoryId.toString()}:${stock.productId.toString()}`
    )
  );

  const stockRecords = [];

  for (const category of categories) {
    const products = await FinishedMaterialProduct.find({
      categoryId: category._id,
    })
      .select("_id name categoryId")
      .lean();

    const categoryFields = await CategoryField.find({
      categoryId: category._id,
      isActive: true,
    })
      .sort({ order: 1 })
      .select("_id key name")
      .lean();

    const values = {};

    categoryFields.forEach((field) => {
      const fieldKey = field.key || field.name;

      if (fieldKey) {
        values[fieldKey] = 0;
      }
    });

    for (const product of products) {
      const uniqueKey =
        `${category._id.toString()}:${product._id.toString()}`;

      if (existingKeys.has(uniqueKey)) {
        continue;
      }

      stockRecords.push({
        categoryId: category._id,
        productId: product._id,
        locationId,
        values: { ...values },
      });

      existingKeys.add(uniqueKey);
    }
  }

  if (!stockRecords.length) {
    return 0;
  }

  const createdStocks = await OverallStock.insertMany(
    stockRecords
  );

  return createdStocks.length;
};


// ========================================
// SYNC EXISTING LOCATION
// ========================================

const syncLocationData = async (locationId) => {
  const location = await Location.findById(locationId);

  if (!location) {
    const error = new Error("Location not found");
    error.statusCode = 404;
    throw error;
  }

  const todayHistory =
    await dailyHistoryService.getTodayDailyHistory();

  if (!todayHistory?._id) {
    const error = new Error(
      "Today's Daily History not found"
    );

    error.statusCode = 404;
    throw error;
  }

  // Add missing Opening Stock records too
  await initializeOpeningStockForLocation(location._id);

  await addLocationToProduction(
    todayHistory._id,
    location._id
  );

  await addLocationToConsumption(
    todayHistory._id,
    location._id
  );

  const overallStockCreated =
    await addLocationToOverallStock(location._id);

  return {
    location: {
      _id: location._id,
      name: location.name,
    },
    dailyHistoryId: todayHistory._id,
    overallStockCreated,
  };
};


// ========================================
// ADD LOCATION TO CONSUMPTION
// ========================================

const addLocationToConsumption = async (
  dailyHistoryId,
  locationId
) => {
  const dailyHistory =
    await DailyHistory.findById(dailyHistoryId);

  if (!dailyHistory) {
    const error = new Error("Daily history not found");
    error.statusCode = 404;
    throw error;
  }

  if (!Array.isArray(dailyHistory.consumption)) {
    dailyHistory.consumption = [];
  }

  let locationConsumption = dailyHistory.consumption.find(
    (item) =>
      item.locationId?.toString() === locationId.toString()
  );

  let isModified = false;

  if (!locationConsumption) {
    locationConsumption = {
      locationId,
      items: [],
    };

    dailyHistory.consumption.push(locationConsumption);

    locationConsumption = dailyHistory.consumption[
      dailyHistory.consumption.length - 1
    ];

    isModified = true;
  }

  if (!Array.isArray(locationConsumption.items)) {
    locationConsumption.items = [];
    isModified = true;
  }

  const openingStocks = await OpeningStock.find({
    location: locationId,
  })
    .select(
      "location type category referenceId quantity unit cft cubicMeter pieces"
    )
    .populate("category", "_id name")
    .lean();

  const existingKeys = new Set(
    locationConsumption.items.map((item) =>
      `${item.type}:${item.category?.toString() || "none"}:${item.referenceId?.toString()}`
    )
  );

  for (const stock of openingStocks) {
    const categoryName = stock.category?.name
      ?.trim()
      .toLowerCase()
      .replace(/\s+/g, "");

    const key =
      `${stock.type}:${stock.category?._id?.toString() || "none"}:${stock.referenceId.toString()}`;

    if (existingKeys.has(key)) {
      continue;
    }

    const item = {
      type: stock.type,
      referenceId: stock.referenceId,
    };

    if (stock.type === "item") {
      if (stock.category) {
        item.category = stock.category._id;
      }

      if (categoryName === "useditem") {
        item.quantity = 0;

        if (stock.unit) {
          item.unit = stock.unit;
        }
      } else if (categoryName === "newitem") {
        item.cft = 0;
        item.cubicMeter = 0;

        item.pieces = (stock.pieces || []).map((piece) => ({
          pieceSizeId: piece.pieceSizeId,
          width: piece.width,
          inch: piece.inch,
          height: piece.height,
          count: 0,
        }));
      }
    } else if (
      stock.type === "nail" ||
      stock.type === "consumable"
    ) {
      item.quantity = 0;

      if (stock.unit) {
        item.unit = stock.unit;
      }
    }

    locationConsumption.items.push(item);
    existingKeys.add(key);
    isModified = true;
  }

  if (isModified) {
    dailyHistory.markModified("consumption");
    await dailyHistory.save();
  }

  return dailyHistory.consumption;
};


// ========================================
// GET ALL LOCATIONS
// ========================================

const getAllLocations = async () => {
  return await Location.find().sort({ createdAt: 1 });
};


// ========================================
// GET LOCATION BY ID
// ========================================

const getLocationById = async (locationId) => {
  const location = await Location.findById(locationId);

  if (!location) {
    throw new Error("Location not found");
  }

  return location;
};


// ========================================
// UPDATE LOCATION
// ========================================

const updateLocation = async (
  locationId,
  { name, isActive }
) => {
  const location = await Location.findById(locationId);

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


// ========================================
// DELETE LOCATION
// ========================================

const deleteLocation = async (locationId) => {
  const location = await Location.findById(locationId);

  if (!location) {
    throw new Error("Location not found");
  }

  const dailyHistory =
    await dailyHistoryService.getTodayDailyHistory();

  const dailyHistoryId = dailyHistory._id;

  await Location.findByIdAndDelete(locationId);

  // Attendance is optional
  const hasAttendance = (
    dailyHistory.attendance || []
  ).some(
    (item) =>
      item.locationId?.toString() === location._id.toString()
  );

  if (hasAttendance) {
    await deleteLocationFromAttendance(
      dailyHistoryId,
      location._id
    );
  }

  await deleteLocationFromProduction(
    dailyHistoryId,
    location._id
  );

  await deleteLocationFromConsumption(
    dailyHistoryId,
    location._id
  );

  return {
    id: location._id,
    message: "Location deleted successfully",
  };
};


// ========================================
// DELETE LOCATION FROM ATTENDANCE
// ========================================

const deleteLocationFromAttendance = async (
  dailyHistoryId,
  locationId
) => {
  const dailyHistory =
    await DailyHistory.findById(dailyHistoryId);

  if (!dailyHistory) {
    const error = new Error("Daily history not found");
    error.statusCode = 404;
    throw error;
  }

  const existingLocation =
    (dailyHistory.attendance || []).find(
      (item) =>
        item.locationId.toString() === locationId.toString()
    );

  if (!existingLocation) {
    const error = new Error(
      "Location not found in attendance"
    );

    error.statusCode = 404;
    throw error;
  }

  dailyHistory.attendance =
    dailyHistory.attendance.filter(
      (item) =>
        item.locationId.toString() !== locationId.toString()
    );

  await dailyHistory.save();

  return dailyHistory.attendance;
};


// ========================================
// DELETE LOCATION FROM PRODUCTION
// ========================================

const deleteLocationFromProduction = async (
  dailyHistoryId,
  locationId
) => {
  const dailyHistory =
    await DailyHistory.findById(dailyHistoryId);

  if (!dailyHistory) {
    const error = new Error("Daily history not found");
    error.statusCode = 404;
    throw error;
  }

  const existingLocation =
    dailyHistory.production.find(
      (item) =>
        item.locationId.toString() === locationId.toString()
    );

  if (!existingLocation) {
    const error = new Error(
      "Location not found in production"
    );

    error.statusCode = 404;
    throw error;
  }

  dailyHistory.production =
    dailyHistory.production.filter(
      (item) =>
        item.locationId.toString() !== locationId.toString()
    );

  await dailyHistory.save();

  return dailyHistory.production;
};


// ========================================
// DELETE LOCATION FROM CONSUMPTION
// ========================================

const deleteLocationFromConsumption = async (
  dailyHistoryId,
  locationId
) => {
  const dailyHistory =
    await DailyHistory.findById(dailyHistoryId);

  if (!dailyHistory) {
    const error = new Error("Daily history not found");
    error.statusCode = 404;
    throw error;
  }

  const existingLocation =
    dailyHistory.consumption.find(
      (item) =>
        item.locationId.toString() === locationId.toString()
    );

  if (!existingLocation) {
    const error = new Error(
      "Location not found in consumption"
    );

    error.statusCode = 404;
    throw error;
  }

  dailyHistory.consumption =
    dailyHistory.consumption.filter(
      (item) =>
        item.locationId.toString() !== locationId.toString()
    );

  await dailyHistory.save();

  return dailyHistory.consumption;
};


// ========================================
// EXPORTS
// ========================================

module.exports = {
  createLocation,
  getAllLocations,
  getLocationById,
  updateLocation,
  deleteLocation,
  syncLocationData,
};
