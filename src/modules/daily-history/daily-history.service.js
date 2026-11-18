const DailyHistory = require("./daily-history.model");

const Location = require("../locations/location.model");

const FinishedMaterial = require(
  "../finished-materials/finishedMaterial.model"
);

const FinishedMaterialStock = require(
  "../finished-material-stock/finishedMaterialStock.model"
);
const FinishedMaterialProductStock = require(
  "../finished-material-product-stock/finished-material-product-stock.model"
);

// /api/finished-material-product-stock

const FinishedMaterialProduct = require(
  "../finished-material-products/finished-material-product.model"
);

const CategoryField = require(
  "../category-fields/category-field.model"
);

const OpeningStock = require(
  "../opening-stock/opening-stock.model"
);

const Item = require("../items/item.model");

const ItemCategory = require("../item-categories/item-category.model");
const Nail = require("../nails/nail.model");

const Consumable = require(
  "../consumables/consumable.model"
);


// ================================================
// CREATE DAILY HISTORY
// ================================================

const createDailyHistory = async () => {
  // --------------------------------
  // STEP 1: Check Today's Record
  // --------------------------------

  const today = new Date();

  const startOfDay = new Date(today);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);

  const existingHistory = await DailyHistory.findOne({
    date: {
      $gte: startOfDay,
      $lte: endOfDay,
    },
  });

  // --------------------------------
  // STEP 2: Stop If Already Exists
  // --------------------------------

  if (existingHistory) {
    return existingHistory;
  }

  // --------------------------------
  // STEP 3: Create DailyHistory
  // --------------------------------

  const dailyHistory = await DailyHistory.create({
    date: new Date(),
    attendance: [],
    production: [],
    consumption: [],
    customerDelivery: [],
    updates: [],
    updatesHistory: [],
  });

  const dailyHistoryId = dailyHistory._id;

  // --------------------------------
  // STEP 4: Attendance
  // --------------------------------

  await createAttendance(dailyHistoryId);

  // --------------------------------
  // STEP 5: Production
  // --------------------------------

  await createProduction(dailyHistoryId);

  // --------------------------------
  // STEP 6: Consumption
  // --------------------------------

  await createConsumption(dailyHistoryId);

  // --------------------------------
  // STEP 7: Return DailyHistory
  // --------------------------------

  return await DailyHistory.findById(dailyHistoryId);
};


// ================================================
// ATTENDANCE
// ================================================

const createAttendance = async (dailyHistoryId) => {
  // --------------------------------
  // STEP 1: Get all locations
  // --------------------------------

  const locations = await Location.find()
    .select("_id name")
    .lean();

  // --------------------------------
  // STEP 2: Create attendance data
  // --------------------------------

  const attendanceData = locations.map((location) => ({
    locationId: location._id,
    workersPresent: 0,
    workerDetails: "",
  }));

  // --------------------------------
  // STEP 3: Find DailyHistory
  // and update attendance
  // --------------------------------

  const dailyHistory =
    await DailyHistory.findByIdAndUpdate(
      dailyHistoryId,
      {
        $set: {
          attendance: attendanceData,
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

  // --------------------------------
  // STEP 4: Check DailyHistory
  // --------------------------------

  if (!dailyHistory) {
    const error = new Error(
      "Daily history not found"
    );

    error.statusCode = 404;

    throw error;
  }

  // --------------------------------
  // STEP 5: Return attendance
  // --------------------------------

  return dailyHistory.attendance;
};


// ================================================
// PRODUCTION
// ================================================

// ================================================
// PRODUCTION
// ================================================

const createProduction = async (dailyHistoryId) => {
  // --------------------------------
  // STEP 1: Get all locations
  // --------------------------------

  const locations = await Location.find()
    .select("_id name")
    .lean();

  // --------------------------------
  // STEP 2: Get all categories
  // --------------------------------

  const categories = await FinishedMaterial.find()
    .select("_id name")
    .lean();

  // --------------------------------
  // STEP 3: Create production data
  // --------------------------------

  const productionData = [];

  for (const location of locations) {
    const locationCategories = [];

    for (const category of categories) {
      // --------------------------------
      // Get products for this category
      // --------------------------------

      const products =
        await FinishedMaterialProduct.find({
          categoryId: category._id,
        })
          .select("_id name categoryId")
          .lean();

      const categoryFields =
        await CategoryField.find({
          categoryId: category._id,
        })
          .select("_id key name")
          .lean();

      // --------------------------------
      // Create products with zero values
      // --------------------------------

      const productData = products.map((product) => {
        const values = {};

        for (const field of categoryFields) {
          const fieldKey =
            field.key || field.name;

          values[fieldKey] = 0;
        }

        return {
          productId: product._id,
          values,
        };
      });

      // --------------------------------
      // Add category
      // --------------------------------

      locationCategories.push({
        categoryId: category._id,
        products: productData,
      });
    }

    // --------------------------------
    // Add location
    // --------------------------------

    productionData.push({
      locationId: location._id,
      categories: locationCategories,
    });
  }

  // --------------------------------
  // STEP 4: Update DailyHistory
  // --------------------------------

  const dailyHistory =
    await DailyHistory.findByIdAndUpdate(
      dailyHistoryId,
      {
        $set: {
          production: productionData,
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

  // --------------------------------
  // STEP 5: Check DailyHistory
  // --------------------------------

  if (!dailyHistory) {
    const error = new Error(
      "Daily history not found"
    );

    error.statusCode = 404;

    throw error;
  }

  // --------------------------------
  // STEP 6: Return production
  // --------------------------------

  return dailyHistory.production;
};


// ================================================
// CONSUMPTION
// ================================================

// ================================================
// CONSUMPTION
// ================================================

const createConsumption = async (dailyHistoryId) => {
  // --------------------------------
  // STEP 1: Get Opening Stock
  // --------------------------------

  const openingStocks = await OpeningStock.find()
    .select(
      "location type category referenceId quantity unit cft cubicMeter pieces"
    )
    .populate("category", "_id name")
    .lean();

  const consumptionMap = new Map();

  // --------------------------------
  // STEP 2: Create location-wise data
  // --------------------------------

  for (const stock of openingStocks) {
    const locationId = stock.location.toString();

    if (!consumptionMap.has(locationId)) {
      consumptionMap.set(locationId, {
        locationId: stock.location,
        items: [],
      });
    }

    const locationData = consumptionMap.get(locationId);

    const item = {
      type: stock.type,
      referenceId: stock.referenceId,
    };

    // --------------------------------
    // ITEM
    // --------------------------------

    if (stock.type === "item") {
      const categoryName = stock.category?.name
        ?.trim()
        .toLowerCase()
        .replace(/\s+/g, "");

      // Store category ID
      if (stock.category) {
        item.category = stock.category._id;
      }

      // --------------------------------
      // USED ITEM
      // --------------------------------

      if (categoryName === "useditem") {
        item.quantity = 0;
        item.unit = stock.unit;
      }

      // --------------------------------
      // NEW ITEM
      // --------------------------------

      if (categoryName === "newitem") {
        item.cft = 0;
        item.cubicMeter = 0;

        if (stock.pieces?.length) {
          item.pieces = stock.pieces.map((piece) => ({
            pieceSizeId: piece.pieceSizeId,
            width: piece.width,
            inch: piece.inch,
            height: piece.height,
            count: 0,
          }));
        } else {
          item.pieces = [];
        }
      }
    }

    // --------------------------------
    // NAIL
    // --------------------------------

    if (stock.type === "nail") {
      item.quantity = 0;
      item.unit = stock.unit;
    }

    // --------------------------------
    // CONSUMABLE
    // --------------------------------

    if (stock.type === "consumable") {
      item.quantity = 0;
      item.unit = stock.unit;
    }

    locationData.items.push(item);
  }

  // --------------------------------
  // STEP 3: Convert Map to Array
  // --------------------------------

  const consumptionData = Array.from(
    consumptionMap.values()
  );

  // --------------------------------
  // STEP 4: Update DailyHistory
  // --------------------------------

  const dailyHistory =
    await DailyHistory.findByIdAndUpdate(
      dailyHistoryId,
      {
        $set: {
          consumption: consumptionData,
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

  // --------------------------------
  // STEP 5: Check DailyHistory
  // --------------------------------

  if (!dailyHistory) {
    const error = new Error(
      "Daily history not found"
    );

    error.statusCode = 404;

    throw error;
  }

  // --------------------------------
  // STEP 6: Return Consumption
  // --------------------------------

  return dailyHistory.consumption;
};
const getDailyHistories = async () => {
  // --------------------------------
  // STEP 1: Get all DailyHistory
  // --------------------------------

  const dailyHistories =
    await DailyHistory.find()
      .sort({ date: -1 })

      // --------------------------------
      // ATTENDANCE
      // --------------------------------

      .populate(
        "attendance.locationId",
        "_id name"
      )

      // --------------------------------
      // PRODUCTION
      // --------------------------------

      .populate(
        "production.locationId",
        "_id name"
      )
      .populate(
        "production.categories.categoryId",
        "_id name"
      )
      .populate(
        "production.categories.products.productId",
        "_id name categoryId"
      )

      // --------------------------------
      // CONSUMPTION
      // --------------------------------

      .populate(
        "consumption.locationId",
        "_id name"
      )
      .populate(
        "consumption.items.category",
        "_id name"
      )

      // --------------------------------
      // CUSTOMER DELIVERY
      // --------------------------------

      .populate(
        "customerDelivery.locationId",
        "_id name"
      )
      .populate(
        "customerDelivery.productId",
        "_id name categoryId"
      )

      // --------------------------------
      // CURRENT UPDATES
      // --------------------------------

      .populate(
        "updates.locationId",
        "_id name"
      )
      .populate(
        "updates.updatedBy",
        "_id name email"
      )

      // --------------------------------
      // UPDATE HISTORY
      // --------------------------------

      .populate(
        "updatesHistory.locationId",
        "_id name"
      )
      .populate(
        "updatesHistory.updatedBy",
        "_id name email"
      )

      .lean();

  // --------------------------------
  // STEP 2: Get master data
  // --------------------------------

  const [
    items,
    nails,
    consumables,
    finishedMaterials,
    finishedMaterialProducts,
    itemCategories,
  ] = await Promise.all([
    Item.find()
      .select("_id name")
      .lean(),

    Nail.find()
      .select("_id name")
      .lean(),

    Consumable.find()
      .select("_id name")
      .lean(),

    FinishedMaterial.find()
      .select("_id name")
      .lean(),

    FinishedMaterialProduct.find()
      .select("_id name categoryId")
      .lean(),

    ItemCategory.find()
      .select("_id name")
      .lean(),
  ]);

  // --------------------------------
  // STEP 3: Create lookup maps
  // --------------------------------

  const itemMap = new Map(
    items.map((item) => [
      item._id.toString(),
      item,
    ])
  );

  const nailMap = new Map(
    nails.map((nail) => [
      nail._id.toString(),
      nail,
    ])
  );

  const consumableMap = new Map(
    consumables.map((consumable) => [
      consumable._id.toString(),
      consumable,
    ])
  );

  const finishedMaterialMap = new Map(
    finishedMaterials.map((category) => [
      category._id.toString(),
      category,
    ])
  );

  const finishedMaterialProductMap =
    new Map(
      finishedMaterialProducts.map(
        (product) => [
          product._id.toString(),
          product,
        ]
      )
    );

  const itemCategoryMap = new Map(
    itemCategories.map((category) => [
      category._id.toString(),
      category,
    ])
  );

  // --------------------------------
  // STEP 4: Enrich current updates
  // --------------------------------

  for (const history of dailyHistories) {
    // ========================================
    // CURRENT UPDATES
    // ========================================

    if (history.updates?.length) {
      for (const update of history.updates) {
        const data = update.data || {};

        // --------------------------------------
        // PRODUCTION UPDATE
        // --------------------------------------

        if (update.type === "production") {
          if (data.categoryId) {
            data.categoryDetails =
              finishedMaterialMap.get(
                data.categoryId.toString()
              ) || null;
          }

          if (data.productId) {
            data.product =
              finishedMaterialProductMap.get(
                data.productId.toString()
              ) || null;
          }
        }

        // --------------------------------------
        // CONSUMPTION UPDATE
        // --------------------------------------

        if (update.type === "consumption") {
          if (data.referenceId) {
            const referenceId =
              data.referenceId.toString();

            if (data.type === "item") {
              data.reference =
                itemMap.get(referenceId) || null;
            }

            if (data.type === "nail") {
              data.reference =
                nailMap.get(referenceId) || null;
            }

            if (data.type === "consumable") {
              data.reference =
                consumableMap.get(
                  referenceId
                ) || null;
            }
          }

          // Item Category
          if (data.category) {
            data.categoryDetails =
              itemCategoryMap.get(
                data.category.toString()
              ) || null;
          }
        }

        // --------------------------------------
        // CUSTOMER DELIVERY UPDATE
        // --------------------------------------

        if (
          update.type ===
          "customer_delivery"
        ) {
          if (data.productId) {
            data.product =
              finishedMaterialProductMap.get(
                data.productId.toString()
              ) || null;
          }
        }
      }
    }

    // ========================================
    // UPDATE HISTORY
    // ========================================

    if (history.updatesHistory?.length) {
      for (
        const audit of history.updatesHistory
      ) {
        // --------------------------------------
        // OLD DATA
        // --------------------------------------

        if (audit.oldData) {
          audit.oldData =
            enrichHistoryData(
              audit.type,
              audit.oldData,
              itemMap,
              nailMap,
              consumableMap,
              finishedMaterialMap,
              finishedMaterialProductMap,
              itemCategoryMap
            );
        }

        // --------------------------------------
        // NEW DATA
        // --------------------------------------

        if (audit.newData) {
          audit.newData =
            enrichHistoryData(
              audit.type,
              audit.newData,
              itemMap,
              nailMap,
              consumableMap,
              finishedMaterialMap,
              finishedMaterialProductMap,
              itemCategoryMap
            );
        }
      }
    }
  }

  // --------------------------------
  // STEP 5: Return
  // --------------------------------

  return dailyHistories;
};


// ============================================
// ENRICH UPDATE HISTORY DATA
// ============================================




// =============================================
// ENRICH HISTORY DATA
// =============================================

const enrichHistoryData = (
  type,
  data,
  itemMap,
  nailMap,
  consumableMap,
  finishedMaterialMap,
  finishedMaterialProductMap,
  itemCategoryMap
) => {
  const result = {
    ...data,
  };

  // ===========================================
  // PRODUCTION
  // ===========================================

  if (type === "production") {
    // Company / Finished Material
    if (result.categoryId) {
      result.company =
        finishedMaterialMap.get(
          result.categoryId.toString()
        ) || null;
    }

    // Product
    if (result.productId) {
      result.product =
        finishedMaterialProductMap.get(
          result.productId.toString()
        ) || null;
    }
  }

  // ===========================================
  // CONSUMPTION
  // ===========================================

  if (type === "consumption") {
    if (result.referenceId) {
      const referenceId =
        result.referenceId.toString();

      // Item
      if (result.type === "item") {
        result.reference =
          itemMap.get(referenceId) || null;
      }

      // Nail
      if (result.type === "nail") {
        result.reference =
          nailMap.get(referenceId) || null;
      }

      // Consumable
      if (result.type === "consumable") {
        result.reference =
          consumableMap.get(referenceId) || null;
      }
    }

    // Item Category
    if (result.category) {
      result.categoryDetails =
        itemCategoryMap.get(
          result.category.toString()
        ) || null;
    }
  }

  // ===========================================
  // CUSTOMER DELIVERY
  // ===========================================

  if (type === "customer_delivery") {
    if (result.productId) {
      result.product =
        finishedMaterialProductMap.get(
          result.productId.toString()
        ) || null;
    }
  }

  return result;
};
// ================================================
// GET TODAY DAILY HISTORY
// ================================================

const getTodayDailyHistory = async () => {
  // --------------------------------
  // STEP 1: Get today's date
  // --------------------------------

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  // --------------------------------
  // STEP 2: Find today's DailyHistory
  // --------------------------------

  const dailyHistory =
    await DailyHistory.findOne({
      date: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    })
      .populate("attendance.locationId", "name")
      .populate("production.locationId", "name")
      .populate(
        "production.categories.categoryId",
        "name"
      )
      .populate(
        "production.categories.products.productId",
        "name"
      )
      .populate("consumption.locationId", "name")
      .populate(
        "consumption.items.category",
        "_id name"
      )
      .populate("customerDelivery.locationId", "name")
      .populate("customerDelivery.productId", "name")
      .populate("updates.locationId", "name")
      .populate("updates.updatedBy", "name")
      .lean();

  // --------------------------------
  // STEP 3: Check DailyHistory
  // --------------------------------

  if (!dailyHistory) {
    const error = new Error(
      "Today's daily history not found"
    );

    error.statusCode = 404;

    throw error;
  }

  // --------------------------------
  // STEP 4: Add readable item names
  // --------------------------------

  for (const consumption of dailyHistory.consumption) {
    const readableItems = [];

    for (const item of consumption.items) {
      let itemData = null;

      // --------------------------------
      // ITEM
      // newitem / useditem
      // --------------------------------

      if (item.type === "item") {
        itemData = await Item.findById(
          item.referenceId
        )
          .select("_id name")
          .lean();
      }

      // --------------------------------
      // NAIL
      // --------------------------------

      else if (item.type === "nail") {
        itemData = await Nail.findById(
          item.referenceId
        )
          .select("_id name")
          .lean();
      }

      // --------------------------------
      // CONSUMABLE
      // --------------------------------

      else if (item.type === "consumable") {
        itemData = await Consumable.findById(
          item.referenceId
        )
          .select("_id name")
          .lean();
      }

      // --------------------------------
      // Build readable item
      // --------------------------------

      const readableItem = {
        type: item.type,
        category: item.category,
        referenceId: item.referenceId,

        ...(itemData && {
          item: itemData,
        }),
      };

      // Quantity
      if (item.quantity !== undefined) {
        readableItem.quantity = item.quantity;
      }

      // Unit
      if (item.unit !== undefined) {
        readableItem.unit = item.unit;
      }

      // CFT
      if (item.cft !== undefined) {
        readableItem.cft = item.cft;
      }

      // Cubic Meter
      if (item.cubicMeter !== undefined) {
        readableItem.cubicMeter = item.cubicMeter;
      }

      // Pieces
      if (item.pieces !== undefined) {
        readableItem.pieces = item.pieces;
      }

      readableItems.push(readableItem);
    }

    consumption.items = readableItems;
  }

  // --------------------------------
  // STEP 5: Return today's history
  // --------------------------------

  return dailyHistory;
};
const updateDailyHistory = async (
  dailyHistoryId,
  data,
  userId
) => {
  console.log("updateDailyHistory called with data:", dailyHistoryId,"dailyHistoryId",data,"userId",userId);
  // ==========================================
  // ATTENDANCE
  // ==========================================

  if (data.type === "attendance") {
    await updateAttendance(
      dailyHistoryId,
      data,
      userId
    );
  }

  // ==========================================
  // PRODUCTION
  // ==========================================

  if (data.type === "production") {
    await updateProduction(
      dailyHistoryId,
      data,
      userId
    );
  }

  // ==========================================
  // CONSUMPTION
  // ==========================================

  if (data.section === "consumption") {
    await updateConsumption(
      dailyHistoryId,
      data,
      userId
    );
  }

  // ==========================================
  // CUSTOMER DELIVERY
  // ==========================================

  if (data.type === "customer_delivery") {
    await updateCustomerDelivery(
      dailyHistoryId,
      data,
      userId
    );
  }

  // ==========================================
  // RETURN UPDATED DAILY HISTORY
  // ==========================================

  return await DailyHistory.findById(
    dailyHistoryId
  );
};
const updateAttendance = async (
  dailyHistoryId,
  data,
  userId
) => {
  // --------------------------------
  // STEP 1: Find DailyHistory
  // --------------------------------

  const dailyHistory =
    await DailyHistory.findById(dailyHistoryId);

  if (!dailyHistory) {
    const error = new Error(
      "Daily history not found"
    );

    error.statusCode = 404;

    throw error;
  }

  // --------------------------------
  // STEP 2: Get attendance data
  // --------------------------------

  const {
    updateId,
    locationId,
    workersPresent,
    workerDetails,
  } = data;

  // --------------------------------
  // STEP 3: Find location attendance
  // --------------------------------

  const attendance =
    dailyHistory.attendance.find(
      (item) =>
        item.locationId.toString() ===
        locationId.toString()
    );

  if (!attendance) {
    const error = new Error(
      "Attendance for this location not found"
    );

    error.statusCode = 404;

    throw error;
  }

  // --------------------------------
  // STEP 4: Common new data
  // --------------------------------

  const newData = {
    workersPresent,
    workerDetails: workerDetails || "",
  };

  // --------------------------------
  // STEP 5: CREATE
  // --------------------------------

  if (!updateId) {
    // Update current attendance
    attendance.workersPresent =
      workersPresent;

    attendance.workerDetails =
      workerDetails || "";

    // Create current update record
    const updateRecord =
      dailyHistory.updates.create({
        type: "attendance",

        locationId,

        updatedBy: userId,

        updatedAt: new Date(),

        data: newData,
      });

    dailyHistory.updates.push(
      updateRecord
    );

    // --------------------------------
    // Create audit history
    // --------------------------------

    dailyHistory.updatesHistory.push({
      type: "attendance",

      action: "created",

      updateId: updateRecord._id,

      locationId,

      updatedBy: userId,

      updatedAt: new Date(),

      newData,
    });
  }

  // --------------------------------
  // STEP 6: UPDATE
  // --------------------------------

  else {
    const attendanceUpdate =
      dailyHistory.updates.find(
        (update) =>
          update._id.toString() ===
            updateId.toString() &&
          update.type === "attendance"
      );

    if (!attendanceUpdate) {
      const error = new Error(
        "Attendance update record not found"
      );

      error.statusCode = 404;

      throw error;
    }

    // --------------------------------
    // Validate location
    // --------------------------------

    if (
      attendanceUpdate.locationId.toString() !==
      locationId.toString()
    ) {
      const error = new Error(
        "Attendance update location does not match"
      );

      error.statusCode = 400;

      throw error;
    }

    // --------------------------------
    // Save old data for history
    // --------------------------------

    const oldData = {
      ...(attendanceUpdate.data || {}),
    };

    // --------------------------------
    // Update current attendance
    // --------------------------------

    attendance.workersPresent =
      workersPresent;

    attendance.workerDetails =
      workerDetails || "";

    // --------------------------------
    // Update current update record
    // --------------------------------

    attendanceUpdate.data =
      newData;

    attendanceUpdate.updatedBy =
      userId;

    attendanceUpdate.updatedAt =
      new Date();

    // --------------------------------
    // Create audit history
    // --------------------------------

    dailyHistory.updatesHistory.push({
      type: "attendance",

      action: "updated",

      updateId: attendanceUpdate._id,

      locationId,

      updatedBy: userId,

      updatedAt: new Date(),

      oldData,

      newData,
    });
  }

  // --------------------------------
  // STEP 7: Save DailyHistory
  // --------------------------------

  await dailyHistory.save();

  // --------------------------------
  // STEP 8: Return updated DailyHistory
  // --------------------------------

  return dailyHistory;
};
const updateProduction = async (
  dailyHistoryId,
  data,
  userId
) => {
  // --------------------------------
  // STEP 1: Find DailyHistory
  // --------------------------------

  const dailyHistory =
    await DailyHistory.findById(dailyHistoryId);

  if (!dailyHistory) {
    const error = new Error(
      "Daily history not found"
    );

    error.statusCode = 404;

    throw error;
  }

  // --------------------------------
  // STEP 2: Get production data
  // --------------------------------

  const {
    updateId,
    locationId,
    categoryId,
    productId,
    values,
    remark,
  } = data;

  if (
    !locationId ||
    !categoryId ||
    !productId ||
    !values ||
    typeof values !== "object" ||
    Array.isArray(values)
  ) {
    const error = new Error(
      "locationId, categoryId, productId and values are required"
    );

    error.statusCode = 400;

    throw error;
  }

  // --------------------------------
  // STEP 3: Validate values
  // --------------------------------

  for (const [key, value] of Object.entries(values)) {
    if (
      typeof value !== "number" ||
      Number.isNaN(value) ||
      value < 0
    ) {
      const error = new Error(
        `Invalid production value for ${key}`
      );

      error.statusCode = 400;

      throw error;
    }
  }

  // --------------------------------
  // STEP 4: Find production location
  // --------------------------------

  const productionLocation =
    dailyHistory.production.find(
      (item) =>
        item.locationId.toString() ===
        locationId.toString()
    );

  if (!productionLocation) {
    const error = new Error(
      "Production location not found"
    );

    error.statusCode = 404;

    throw error;
  }

  // --------------------------------
  // STEP 5: Find category
  // --------------------------------

  const productionCategory =
    productionLocation.categories.find(
      (item) =>
        item.categoryId.toString() ===
        categoryId.toString()
    );

  if (!productionCategory) {
    const error = new Error(
      "Production category not found"
    );

    error.statusCode = 404;

    throw error;
  }

  // --------------------------------
  // STEP 6: Find product
  // --------------------------------

  const productionProduct =
    productionCategory.products.find(
      (item) =>
        item.productId.toString() ===
        productId.toString()
    );

  if (!productionProduct) {
    const error = new Error(
      "Production product not found"
    );

    error.statusCode = 404;

    throw error;
  }

  // --------------------------------
  // STEP 7: Find FinishedMaterialProductStock
  // --------------------------------

  const stock =
    await FinishedMaterialProductStock.findOne({
      locationId,
      categoryId,
      productId,
    });

  if (!stock) {
    const error = new Error(
      "Finished material product stock not found"
    );

    error.statusCode = 404;

    throw error;
  }

  // ================================================
  // NEW PRODUCTION UPDATE
  // ================================================

  if (!updateId) {
    // --------------------------------
    // STEP 8A: Prepare new data
    // --------------------------------

    const newData = {
      categoryId,
      productId,
      values,
      ...(remark && { remark }),
    };

    const now = new Date();

    // --------------------------------
    // STEP 9A: Create current update
    // --------------------------------

    const productionUpdate =
      dailyHistory.updates.create({
        type: "production",

        locationId,

        updatedBy: userId,

        updatedAt: now,

        data: newData,
      });

    dailyHistory.updates.push(
      productionUpdate
    );

    // --------------------------------
    // STEP 10A: Create audit history
    // --------------------------------

    dailyHistory.updatesHistory.push({
      type: "production",

      action: "created",

      updateId: productionUpdate._id,

      locationId,

      updatedBy: userId,

      updatedAt: now,

      newData,
    });

    // --------------------------------
    // STEP 11A: Update stock
    // --------------------------------

    for (const [key, value] of Object.entries(values)) {
      const currentValue =
        Number(stock.values?.get(key) || 0);

      stock.values.set(
        key,
        currentValue + value
      );
    }
  }

  // ================================================
  // EDIT EXISTING PRODUCTION UPDATE
  // ================================================

  else {
    // --------------------------------
    // STEP 8B: Find existing update
    // --------------------------------

    const productionUpdate =
      dailyHistory.updates.find(
        (update) =>
          update._id.toString() ===
            updateId.toString() &&
          update.type === "production"
      );

    if (!productionUpdate) {
      const error = new Error(
        "Production update record not found"
      );

      error.statusCode = 404;

      throw error;
    }

    // --------------------------------
    // STEP 9B: Verify location
    // --------------------------------

    if (
      productionUpdate.locationId.toString() !==
      locationId.toString()
    ) {
      const error = new Error(
        "Production update location does not match"
      );

      error.statusCode = 400;

      throw error;
    }

    // --------------------------------
    // STEP 10B: Verify category
    // --------------------------------

    if (
      productionUpdate.data?.categoryId?.toString() !==
      categoryId.toString()
    ) {
      const error = new Error(
        "Production update category does not match"
      );

      error.statusCode = 400;

      throw error;
    }

    // --------------------------------
    // STEP 11B: Verify product
    // --------------------------------

    if (
      productionUpdate.data?.productId?.toString() !==
      productId.toString()
    ) {
      const error = new Error(
        "Production update product does not match"
      );

      error.statusCode = 400;

      throw error;
    }

    // --------------------------------
    // STEP 12B: Get old data
    // --------------------------------

    const oldData = {
      ...(productionUpdate.data || {}),
    };

    const oldValues =
      productionUpdate.data?.values || {};

    // --------------------------------
    // STEP 13B: Get all field keys
    // --------------------------------

    const fieldKeys = new Set([
      ...Object.keys(oldValues),
      ...Object.keys(values),
    ]);

    // --------------------------------
    // STEP 14B: Update stock using difference
    // --------------------------------

    for (const key of fieldKeys) {
      const oldValue =
        Number(oldValues[key] || 0);

      const newValue =
        Number(values[key] || 0);

      const difference =
        newValue - oldValue;

      if (difference === 0) {
        continue;
      }

      const currentStockValue =
        Number(stock.values?.get(key) || 0);

      const updatedStockValue =
        currentStockValue + difference;

      // --------------------------------
      // Prevent negative stock
      // --------------------------------

      if (updatedStockValue < 0) {
        const error = new Error(
          `Insufficient stock for ${key}`
        );

        error.statusCode = 400;

        throw error;
      }

      stock.values.set(
        key,
        updatedStockValue
      );
    }

    // --------------------------------
    // STEP 15B: Prepare new data
    // --------------------------------

    const newData = {
      categoryId,
      productId,
      values,
      ...(remark && { remark }),
    };

    const now = new Date();

    // --------------------------------
    // STEP 16B: Update current record
    // --------------------------------

    productionUpdate.data =
      newData;

    productionUpdate.updatedBy =
      userId;

    productionUpdate.updatedAt =
      now;

    // --------------------------------
    // STEP 17B: Create audit history
    // --------------------------------

    dailyHistory.updatesHistory.push({
      type: "production",

      action: "updated",

      updateId: productionUpdate._id,

      locationId,

      updatedBy: userId,

      updatedAt: now,

      oldData,

      newData,
    });
  }

  // ================================================
  // COMMON
  // Recalculate DailyHistory.production
  // ================================================

  // --------------------------------
  // STEP 18: Calculate effective values
  // --------------------------------

  const effectiveValues = {};

  for (const update of dailyHistory.updates) {
    if (
      update.type !== "production"
    ) {
      continue;
    }

    // Location check
    if (
      update.locationId.toString() !==
      locationId.toString()
    ) {
      continue;
    }

    // Category check
    const updateCategoryId =
      update.data?.categoryId?.toString();

    if (
      updateCategoryId !==
      categoryId.toString()
    ) {
      continue;
    }

    // Product check
    const updateProductId =
      update.data?.productId?.toString();

    if (
      updateProductId !==
      productId.toString()
    ) {
      continue;
    }

    // Values
    const updateValues =
      update.data?.values || {};

    for (const [key, value] of Object.entries(
      updateValues
    )) {
      effectiveValues[key] =
        (effectiveValues[key] || 0) + value;
    }
  }

  // --------------------------------
  // STEP 19: Update current production
  // --------------------------------

  productionProduct.values =
    effectiveValues;

  // --------------------------------
  // STEP 20: Save DailyHistory
  // --------------------------------

  dailyHistory.markModified(
    "updates"
  );

  dailyHistory.markModified(
    "updatesHistory"
  );

  await dailyHistory.save();

  // --------------------------------
  // STEP 21: Save stock
  // --------------------------------

  await stock.save();

  // --------------------------------
  // STEP 22: Return
  // --------------------------------

  return {
    dailyHistory,
    production: productionProduct,
    stock,
  };
};
const updateConsumption = async (
  dailyHistoryId,
  data,
  userId
) => {
  const dailyHistory =
    await DailyHistory.findById(dailyHistoryId);

  if (!dailyHistory) {
    const error = new Error(
      "Daily history not found"
    );
    error.statusCode = 404;
    throw error;
  }

  const {
    updateId,
    locationId,
    type,
    category,
    referenceId,
    quantity,
    unit,
    cft,
    cubicMeter,
    pieces,
    remark,
  } = data;

  // ==================================================
  // VALIDATION
  // ==================================================

  if (!locationId) {
    const error = new Error(
      "Location is required"
    );
    error.statusCode = 400;
    throw error;
  }

  if (!type) {
    const error = new Error(
      "Consumption type is required"
    );
    error.statusCode = 400;
    throw error;
  }

  if (!["item", "nail", "consumable"].includes(type)) {
    const error = new Error(
      "Invalid consumption type"
    );
    error.statusCode = 400;
    throw error;
  }

  if (!referenceId) {
    const error = new Error(
      "Reference ID is required"
    );
    error.statusCode = 400;
    throw error;
  }

  if (type === "item" && !category) {
    const error = new Error(
      "Category is required for item"
    );
    error.statusCode = 400;
    throw error;
  }

  // ==================================================
  // FIND OPENING STOCK
  // ==================================================

  const stockQuery = {
    location: locationId,
    type,
    referenceId,
  };

  if (type === "item") {
    stockQuery.category = category;
  }

  const openingStock =
    await OpeningStock.findOne(stockQuery);

  if (!openingStock) {
    const error = new Error(
      "Opening stock not found"
    );
    error.statusCode = 404;
    throw error;
  }

  // ==================================================
  // CREATE NEW CONSUMPTION
  // ==================================================

  if (!updateId) {
    // ------------------------------------------------
    // STOCK VALIDATION
    // ------------------------------------------------

    if (
      quantity !== undefined &&
      quantity !== null
    ) {
      const currentStock =
        Number(
          openingStock.currentStock || 0
        );

      if (quantity > currentStock) {
        const error = new Error(
          "Insufficient stock"
        );
        error.statusCode = 400;
        throw error;
      }
    }

    // ------------------------------------------------
    // BUILD DATA
    // ------------------------------------------------

    const updateData = {
      // IMPORTANT:
      // updates.type must be activity type
      type: "consumption",

      locationId,

      updatedBy: userId,

      updatedAt: new Date(),

      data: {
        // IMPORTANT:
        // Actual consumption type
        // stays inside data
        type,

        referenceId,

        ...(type === "item" && {
          category,
        }),

        ...(quantity !== undefined && {
          quantity,
        }),

        ...(unit && {
          unit,
        }),

        ...(cft !== undefined && {
          cft,
        }),

        ...(cubicMeter !== undefined && {
          cubicMeter,
        }),

        ...(pieces !== undefined && {
          pieces,
        }),

        ...(remark && {
          remark,
        }),
      },
    };

    // ------------------------------------------------
    // CREATE UPDATE RECORD
    // ------------------------------------------------

    const consumptionUpdate =
      dailyHistory.updates.create(
        updateData
      );

    dailyHistory.updates.push(
      consumptionUpdate
    );

    // ------------------------------------------------
    // AUDIT HISTORY - CREATED
    // ------------------------------------------------

    dailyHistory.updatesHistory.push({
      type: "consumption",

      action: "created",

      updateId:
        consumptionUpdate._id,

      locationId,

      updatedBy: userId,

      updatedAt:
        updateData.updatedAt,

      newData: {
        ...updateData.data,
      },
    });

    // ------------------------------------------------
    // DEDUCT STOCK
    // ------------------------------------------------

    if (
      quantity !== undefined &&
      quantity !== null
    ) {
      openingStock.currentStock =
        Number(
          openingStock.currentStock || 0
        ) -
        Number(quantity);
    }

    // ------------------------------------------------
    // NEW ITEM STOCK
    // ------------------------------------------------

    if (
      type === "item" &&
      cft !== undefined
    ) {
      openingStock.cft =
        Number(
          openingStock.cft || 0
        ) -
        Number(cft);

      if (openingStock.cft < 0) {
        const error = new Error(
          "Insufficient CFT stock"
        );
        error.statusCode = 400;
        throw error;
      }
    }

    if (
      type === "item" &&
      cubicMeter !== undefined
    ) {
      openingStock.cubicMeter =
        Number(
          openingStock.cubicMeter || 0
        ) -
        Number(cubicMeter);

      if (
        openingStock.cubicMeter < 0
      ) {
        const error = new Error(
          "Insufficient cubic meter stock"
        );
        error.statusCode = 400;
        throw error;
      }
    }

    if (
      type === "item" &&
      Array.isArray(pieces)
    ) {
      for (const newPiece of pieces) {
        const stockPiece =
          openingStock.pieces.find(
            (piece) =>
              piece.pieceSizeId.toString() ===
              newPiece.pieceSizeId.toString()
          );

        if (!stockPiece) {
          const error = new Error(
            "Piece size not found in opening stock"
          );
          error.statusCode = 404;
          throw error;
        }

        const availableCount =
          Number(
            stockPiece.count || 0
          );

        if (
          Number(newPiece.count || 0) >
          availableCount
        ) {
          const error = new Error(
            "Insufficient piece stock"
          );
          error.statusCode = 400;
          throw error;
        }

        stockPiece.count =
          availableCount -
          Number(
            newPiece.count || 0
          );
      }
    }
  }

  // ==================================================
  // EDIT EXISTING CONSUMPTION
  // ==================================================

  else {
    const consumptionUpdate =
      dailyHistory.updates.find(
        (update) =>
          update._id.toString() ===
            updateId.toString() &&
          update.type === "consumption"
      );

    if (!consumptionUpdate) {
      const error = new Error(
        "Consumption update record not found"
      );
      error.statusCode = 404;
      throw error;
    }

    // ------------------------------------------------
    // LOCATION VALIDATION
    // ------------------------------------------------

    if (
      consumptionUpdate.locationId.toString() !==
      locationId.toString()
    ) {
      const error = new Error(
        "Consumption update location does not match"
      );
      error.statusCode = 400;
      throw error;
    }

    // ------------------------------------------------
    // OLD DATA
    // ------------------------------------------------

    const oldData =
      consumptionUpdate.data
        ? JSON.parse(
            JSON.stringify(
              consumptionUpdate.data
            )
          )
        : {};

    // ------------------------------------------------
    // RESTORE OLD QUANTITY STOCK
    // ------------------------------------------------

    if (
      oldData.quantity !== undefined &&
      oldData.quantity !== null
    ) {
      openingStock.currentStock =
        Number(
          openingStock.currentStock || 0
        ) +
        Number(oldData.quantity);
    }

    // ------------------------------------------------
    // RESTORE OLD CFT
    // ------------------------------------------------

    if (
      oldData.cft !== undefined
    ) {
      openingStock.cft =
        Number(
          openingStock.cft || 0
        ) +
        Number(oldData.cft);
    }

    // ------------------------------------------------
    // RESTORE OLD CUBIC METER
    // ------------------------------------------------

    if (
      oldData.cubicMeter !== undefined
    ) {
      openingStock.cubicMeter =
        Number(
          openingStock.cubicMeter || 0
        ) +
        Number(oldData.cubicMeter);
    }

    // ------------------------------------------------
    // RESTORE OLD PIECES
    // ------------------------------------------------

    if (
      Array.isArray(oldData.pieces)
    ) {
      for (const oldPiece of oldData.pieces) {
        const stockPiece =
          openingStock.pieces.find(
            (piece) =>
              piece.pieceSizeId.toString() ===
              oldPiece.pieceSizeId.toString()
          );

        if (stockPiece) {
          stockPiece.count =
            Number(
              stockPiece.count || 0
            ) +
            Number(
              oldPiece.count || 0
            );
        }
      }
    }

    // ------------------------------------------------
    // VALIDATE NEW QUANTITY STOCK
    // ------------------------------------------------

    if (
      quantity !== undefined &&
      quantity !== null
    ) {
      const availableStock =
        Number(
          openingStock.currentStock || 0
        );

      if (
        Number(quantity) >
        availableStock
      ) {
        const error = new Error(
          "Insufficient stock"
        );
        error.statusCode = 400;
        throw error;
      }

      openingStock.currentStock =
        availableStock -
        Number(quantity);
    }

    // ------------------------------------------------
    // VALIDATE NEW CFT
    // ------------------------------------------------

    if (
      type === "item" &&
      cft !== undefined
    ) {
      const availableCft =
        Number(
          openingStock.cft || 0
        );

      if (
        Number(cft) >
        availableCft
      ) {
        const error = new Error(
          "Insufficient CFT stock"
        );
        error.statusCode = 400;
        throw error;
      }

      openingStock.cft =
        availableCft -
        Number(cft);
    }

    // ------------------------------------------------
    // VALIDATE NEW CUBIC METER
    // ------------------------------------------------

    if (
      type === "item" &&
      cubicMeter !== undefined
    ) {
      const availableCubicMeter =
        Number(
          openingStock.cubicMeter || 0
        );

      if (
        Number(cubicMeter) >
        availableCubicMeter
      ) {
        const error = new Error(
          "Insufficient cubic meter stock"
        );
        error.statusCode = 400;
        throw error;
      }

      openingStock.cubicMeter =
        availableCubicMeter -
        Number(cubicMeter);
    }

    // ------------------------------------------------
    // VALIDATE NEW PIECES
    // ------------------------------------------------

    if (
      type === "item" &&
      Array.isArray(pieces)
    ) {
      for (const newPiece of pieces) {
        const stockPiece =
          openingStock.pieces.find(
            (piece) =>
              piece.pieceSizeId.toString() ===
              newPiece.pieceSizeId.toString()
          );

        if (!stockPiece) {
          const error = new Error(
            "Piece size not found in opening stock"
          );
          error.statusCode = 404;
          throw error;
        }

        const availableCount =
          Number(
            stockPiece.count || 0
          );

        if (
          Number(newPiece.count || 0) >
          availableCount
        ) {
          const error = new Error(
            "Insufficient piece stock"
          );
          error.statusCode = 400;
          throw error;
        }

        stockPiece.count =
          availableCount -
          Number(
            newPiece.count || 0
          );
      }
    }

    // ------------------------------------------------
    // NEW DATA
    // ------------------------------------------------

    const newUpdateData = {
      type,

      referenceId,

      ...(type === "item" && {
        category,
      }),

      ...(quantity !== undefined && {
        quantity,
      }),

      ...(unit && {
        unit,
      }),

      ...(cft !== undefined && {
        cft,
      }),

      ...(cubicMeter !== undefined && {
        cubicMeter,
      }),

      ...(pieces !== undefined && {
        pieces,
      }),

      ...(remark && {
        remark,
      }),
    };

    const now = new Date();

    // ------------------------------------------------
    // UPDATE CURRENT RECORD
    // ------------------------------------------------

    consumptionUpdate.data =
      newUpdateData;

    consumptionUpdate.updatedBy =
      userId;

    consumptionUpdate.updatedAt =
      now;

    // ------------------------------------------------
    // AUDIT HISTORY - UPDATED
    // ------------------------------------------------

    dailyHistory.updatesHistory.push({
      type: "consumption",

      action: "updated",

      updateId:
        consumptionUpdate._id,

      locationId,

      updatedBy: userId,

      updatedAt: now,

      oldData,

      newData: {
        ...newUpdateData,
      },
    });
  }

  // ==================================================
  // RECALCULATE DAILY HISTORY CONSUMPTION
  // ==================================================

  const effectiveConsumption = {};

  const consumptionLocation =
    dailyHistory.consumption.find(
      (item) =>
        item.locationId.toString() ===
        locationId.toString()
    );

  if (!consumptionLocation) {
    const error = new Error(
      "Consumption location not found"
    );
    error.statusCode = 404;
    throw error;
  }

  // --------------------------------------------------
  // FIND ALL CURRENT CONSUMPTION UPDATES
  // --------------------------------------------------

  for (const update of dailyHistory.updates) {
    if (
      update.type !== "consumption"
    ) {
      continue;
    }

    if (
      update.locationId.toString() !==
      locationId.toString()
    ) {
      continue;
    }

    const updateData =
      update.data || {};

    if (
      updateData.type !== type
    ) {
      continue;
    }

    if (
      updateData.referenceId?.toString() !==
      referenceId.toString()
    ) {
      continue;
    }

    if (type === "item") {
      if (
        updateData.category?.toString() !==
        category.toString()
      ) {
        continue;
      }
    }

    // ------------------------------------------------
    // QUANTITY BASED
    // ------------------------------------------------

    if (
      type === "nail" ||
      type === "consumable"
    ) {
      effectiveConsumption.quantity =
        (
          effectiveConsumption.quantity ||
          0
        ) +
        Number(
          updateData.quantity || 0
        );

      effectiveConsumption.unit =
        updateData.unit;

      continue;
    }

    // ------------------------------------------------
    // ITEM
    // ------------------------------------------------

    if (type === "item") {
      // Used Item
      if (
        updateData.quantity !==
        undefined
      ) {
        effectiveConsumption.quantity =
          (
            effectiveConsumption.quantity ||
            0
          ) +
          Number(
            updateData.quantity || 0
          );

        effectiveConsumption.unit =
          updateData.unit;
      }

      // New Item - CFT
      if (
        updateData.cft !==
        undefined
      ) {
        effectiveConsumption.cft =
          (
            effectiveConsumption.cft ||
            0
          ) +
          Number(
            updateData.cft || 0
          );
      }

      // New Item - Cubic Meter
      if (
        updateData.cubicMeter !==
        undefined
      ) {
        effectiveConsumption.cubicMeter =
          (
            effectiveConsumption.cubicMeter ||
            0
          ) +
          Number(
            updateData.cubicMeter || 0
          );
      }

      // New Item - Pieces
      if (
        updateData.pieces
      ) {
        if (
          !effectiveConsumption.pieces
        ) {
          effectiveConsumption.pieces =
            [];
        }

        for (
          const updatePiece of
          updateData.pieces
        ) {
          const existingPiece =
            effectiveConsumption.pieces.find(
              (piece) =>
                piece.pieceSizeId.toString() ===
                updatePiece.pieceSizeId.toString()
            );

          if (existingPiece) {
            existingPiece.count +=
              Number(
                updatePiece.count || 0
              );
          } else {
            effectiveConsumption.pieces.push(
              {
                ...updatePiece,
              }
            );
          }
        }
      }
    }
  }

  // --------------------------------------------------
  // UPDATE DAILY HISTORY CONSUMPTION
  // --------------------------------------------------

  const consumptionItem =
    consumptionLocation.items.find(
      (item) => {
        if (
          item.type !== type
        ) {
          return false;
        }

        if (
          item.referenceId.toString() !==
          referenceId.toString()
        ) {
          return false;
        }

        if (type === "item") {
          return (
            item.category?.toString() ===
            category.toString()
          );
        }

        return true;
      }
    );

  if (!consumptionItem) {
    const error = new Error(
      "Consumption item not found"
    );
    error.statusCode = 404;
    throw error;
  }

  // --------------------------------------------------
  // APPLY EFFECTIVE VALUES
  // --------------------------------------------------

  if (
    effectiveConsumption.quantity !==
    undefined
  ) {
    consumptionItem.quantity =
      effectiveConsumption.quantity;

    consumptionItem.unit =
      effectiveConsumption.unit;
  }

  if (
    effectiveConsumption.cft !==
    undefined
  ) {
    consumptionItem.cft =
      effectiveConsumption.cft;
  }

  if (
    effectiveConsumption.cubicMeter !==
    undefined
  ) {
    consumptionItem.cubicMeter =
      effectiveConsumption.cubicMeter;
  }

  if (
    effectiveConsumption.pieces
  ) {
    consumptionItem.pieces =
      effectiveConsumption.pieces;
  }

  // ==================================================
  // MARK MODIFIED
  // ==================================================

  dailyHistory.markModified(
    "updates"
  );

  dailyHistory.markModified(
    "updatesHistory"
  );

  dailyHistory.markModified(
    "consumption"
  );

  // ==================================================
  // SAVE
  // ==================================================

  await openingStock.save();

  await dailyHistory.save();

  // ==================================================
  // RETURN
  // ==================================================

  return {
    dailyHistory,

    consumption:
      dailyHistory.consumption,

    openingStock,
  };
};

const updateCustomerDelivery = async (
  dailyHistoryId,
  data,
  userId
) => {
  // Customer Delivery update logic
};
// ================================================
// EXPORT
// ================================================

module.exports = {
  createDailyHistory,
  getTodayDailyHistory,
  updateDailyHistory,
  getDailyHistories,
};