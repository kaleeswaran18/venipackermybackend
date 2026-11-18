const OverallStock = require(
  "./finished-material-product-stock.model"
);

const FinishedMaterialProduct = require(
  "../finished-material-products/finished-material-product.model"
);

const CategoryField = require(
  "../category-fields/category-field.model"
);

const Location = require(
  "../locations/location.model"
);

const DailyHistory = require(
  "../daily-history/daily-history.model"
);

const dailyHistoryService = require(
  "../daily-history/daily-history.service"
);

// ----------------------------------------
// ADD PRODUCT TO TODAY'S DAILY HISTORY
// PRODUCTION
// ----------------------------------------

const addProductToDailyHistoryProduction = async (
  categoryId,
  productId,
  categoryFields,
  session = null
) => {
  // Get today's DailyHistory
  const todayHistory =
    await dailyHistoryService.getTodayDailyHistory();

  if (!todayHistory?._id) {
    const error = new Error(
      "Today's Daily History not found"
    );

    error.statusCode = 404;
    throw error;
  }

  // Re-fetch as a Mongoose document
  let dailyHistoryQuery = DailyHistory.findById(
    todayHistory._id
  );

  if (session) {
    dailyHistoryQuery = dailyHistoryQuery.session(session);
  }

  const dailyHistory = await dailyHistoryQuery;

  if (!dailyHistory) {
    const error = new Error(
      "Daily History document not found"
    );

    error.statusCode = 404;
    throw error;
  }

  if (!dailyHistory.production?.length) {
    const error = new Error(
      "No production locations found"
    );

    error.statusCode = 404;
    throw error;
  }

  // Prepare default values
  const values = {};

  categoryFields.forEach((field) => {
    const fieldKey = field.key || field.name;

    if (fieldKey) {
      values[fieldKey] = 0;
    }
  });

  // Add product to every production location
  dailyHistory.production.forEach(
    (locationProduction) => {
      if (!Array.isArray(locationProduction.categories)) {
        locationProduction.categories = [];
      }

      // Find category
      let category =
        locationProduction.categories.find(
          (item) =>
            item.categoryId?.toString() ===
            categoryId.toString()
        );

      // Create category if missing
      if (!category) {
        locationProduction.categories.push({
          categoryId,
          products: [],
        });

        category =
          locationProduction.categories[
            locationProduction.categories.length - 1
          ];
      }

      if (!Array.isArray(category.products)) {
        category.products = [];
      }

      // Prevent duplicate product
      const existingProduct =
        category.products.find(
          (item) =>
            item.productId?.toString() ===
            productId.toString()
        );

      if (!existingProduct) {
        category.products.push({
          productId,
          values: { ...values },
        });
      }
    }
  );

  return dailyHistory;
};


// ----------------------------------------
// CREATE OVERALL STOCK
// ----------------------------------------

const createOverallStock = async (data) => {
  const { categoryId, productId } = data;

  const session = await OverallStock.db.startSession();

  let createdStockIds = [];

  try {
    await session.withTransaction(async () => {
      // 1. Check product
      const product =
        await FinishedMaterialProduct.findOne({
          _id: productId,
          categoryId,
        }).session(session);

      if (!product) {
        const error = new Error(
          "Finished material product not found in this category"
        );

        error.statusCode = 404;
        throw error;
      }

      // 2. Check duplicate category + product
      const existingStock =
        await OverallStock.findOne({
          categoryId,
          productId,
        }).session(session);

      if (existingStock) {
        const error = new Error(
          "Overall stock already exists for this category and product"
        );

        error.statusCode = 409;
        throw error;
      }

      // 3. Get active category fields
      const categoryFields =
        await CategoryField.find({
          categoryId,
          isActive: true,
        })
          .sort({ order: 1 })
          .session(session);

      // 4. Create dynamic values
      const values = {};

      categoryFields.forEach((field) => {
        values[field.key] = 0;
      });

      // 5. Get all active locations
      const locations = await Location.find({
        isActive: true,
      }).session(session);

      if (!locations.length) {
        const error = new Error(
          "No active locations found"
        );

        error.statusCode = 404;
        throw error;
      }

      // ----------------------------------------
      // 6. PREPARE TODAY'S DAILY HISTORY PRODUCTION
      // ----------------------------------------

      let dailyHistory = null;

      try {
        dailyHistory =
          await addProductToDailyHistoryProduction(
            categoryId,
            productId,
            categoryFields,
            session
          );
      } catch (error) {
        // Daily History not found - skip production update
        if (error.statusCode !== 404) {
          throw error;
        }

        dailyHistory = null;
      }

      // ----------------------------------------
      // 7. CREATE ONE STOCK RECORD FOR EACH LOCATION
      // ----------------------------------------

      const stockRecords = locations.map((location) => ({
        categoryId,
        productId,
        locationId: location._id,
        values: {
          ...values,
        },
      }));

      const createdStocks =
        await OverallStock.insertMany(
          stockRecords,
          { session }
        );

      createdStockIds = createdStocks.map(
        (stock) => stock._id
      );

      // ----------------------------------------
      // 8. SAVE DAILY HISTORY IF AVAILABLE
      // ----------------------------------------

      if (dailyHistory) {
        await dailyHistory.save({ session });
      }
    });

    // ----------------------------------------
    // 9. RETURN WITH POPULATED DATA
    // ----------------------------------------

    const result = await OverallStock.find({
      _id: {
        $in: createdStockIds,
      },
    })
      .populate("categoryId", "name")
      .populate(
        "productId",
        "name companyName"
      )
      .populate("locationId", "name");

    return result;
  } finally {
    await session.endSession();
  }
};


// ----------------------------------------
// GET ALL OVERALL STOCKS
// ----------------------------------------

const getAllOverallStocks = async (
  productId = null,
  locationId = null,
  categoryId = null
) => {
  const filter = {};

  if (productId) {
    filter.productId = productId;
  }

  if (locationId) {
    filter.locationId = locationId;
  }

  if (categoryId) {
    filter.categoryId = categoryId;
  }

  return await OverallStock.find(filter)
    .populate("categoryId", "name")
    .populate(
      "productId",
      "name companyName"
    )
    .populate("locationId", "name")
    .sort({ createdAt: -1 });
};


// ----------------------------------------
// GET OVERALL STOCK BY ID
// ----------------------------------------

const getOverallStockById = async (id) => {
  const stock =
    await OverallStock.findById(id)
      .populate("categoryId", "name")
      .populate(
        "productId",
        "name companyName"
      )
      .populate("locationId", "name");

  if (!stock) {
    const error = new Error(
      "Overall stock not found"
    );

    error.statusCode = 404;
    throw error;
  }

  return stock;
};


// ----------------------------------------
// UPDATE OVERALL STOCK
// ----------------------------------------

const updateOverallStock = async (
  id,
  data
) => {
  const existingStock =
    await OverallStock.findById(id);

  if (!existingStock) {
    const error = new Error(
      "Overall stock not found"
    );

    error.statusCode = 404;
    throw error;
  }

  // Prevent duplicate combination
  if (
    data.categoryId ||
    data.productId ||
    data.locationId
  ) {
    const categoryId =
      data.categoryId ||
      existingStock.categoryId;

    const productId =
      data.productId ||
      existingStock.productId;

    const locationId =
      data.locationId ||
      existingStock.locationId;

    // Validate selected product belongs to category
    const product =
      await FinishedMaterialProduct.findOne({
        _id: productId,
        categoryId,
      });

    if (!product) {
      const error = new Error(
        "Finished material product not found in this category"
      );

      error.statusCode = 404;
      throw error;
    }

    const duplicateStock =
      await OverallStock.findOne({
        categoryId,
        productId,
        locationId,
        _id: { $ne: id },
      });

    if (duplicateStock) {
      const error = new Error(
        "Overall stock already exists for this category, product and location"
      );

      error.statusCode = 409;
      throw error;
    }
  }

  Object.assign(existingStock, data);

  const updatedStock =
    await existingStock.save();

  return await OverallStock.findById(
    updatedStock._id
  )
    .populate("categoryId", "name")
    .populate(
      "productId",
      "name companyName"
    )
    .populate("locationId", "name");
};


// ----------------------------------------
// DELETE OVERALL STOCK
// ----------------------------------------

const deleteOverallStock = async (id) => {
  const stock =
    await OverallStock.findById(id);

  if (!stock) {
    const error = new Error(
      "Overall stock not found"
    );

    error.statusCode = 404;
    throw error;
  }

  await OverallStock.findByIdAndDelete(id);

  return stock;
};


module.exports = {
  createOverallStock,
  getAllOverallStocks,
  getOverallStockById,
  updateOverallStock,
  deleteOverallStock,
};
