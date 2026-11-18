const NailPacking = require("./nail-packing.model");

const FinishedMaterialProduct = require(
  "../finished-material-products/finished-material-product.model"
);

// ==========================================
// GET MAHINDRA CITY PRODUCTS
// ==========================================

const getMahindraCityProducts = async () => {
  const products = await FinishedMaterialProduct.find({
    isActive: true,
  })
    .populate("categoryId", "name")
    .sort({ name: 1 });

  return products.filter(
    (product) =>
      product.categoryId?.name?.toLowerCase() === "mahindracity"
  );
};

// ==========================================
// GENERATE FULL MONTH DATES
// ==========================================

const generateMonthDates = (month, year) => {
  const totalDays = new Date(
    Date.UTC(year, month, 0)
  ).getUTCDate();

  const dates = [];

  for (let day = 1; day <= totalDays; day++) {
    dates.push({
      date: new Date(
        Date.UTC(year, month - 1, day)
      ),
      products: [],
      remarks: "",
    });
  }

  return dates;
};

// ==========================================
// SYNC NEW PRODUCTS
// ==========================================

const syncMonthlyProducts = async (
  monthlyRecord,
  activeProducts
) => {
  const existingProductIds = new Set(
    monthlyRecord.products.map((id) => id.toString())
  );

  let hasChanges = false;

  for (const product of activeProducts) {
    const productId = product._id.toString();

    if (!existingProductIds.has(productId)) {
      monthlyRecord.products.push(product._id);

      existingProductIds.add(productId);

      hasChanges = true;
    }
  }

  // Add new products to every existing date
  for (const dailyEntry of monthlyRecord.dailyEntries) {
    const dailyProductIds = new Set(
      dailyEntry.products.map((item) =>
        item.productId.toString()
      )
    );

    for (const productId of monthlyRecord.products) {
      const id = productId.toString();

      if (!dailyProductIds.has(id)) {
        dailyEntry.products.push({
          productId,
          quantity: 0,
        });

        hasChanges = true;
      }
    }
  }

  if (hasChanges) {
    await monthlyRecord.save();
  }

  return monthlyRecord;
};

// ==========================================
// GET / CREATE MONTHLY REPORT
// ==========================================

const getNailPackingReport = async (month, year) => {
  const activeProducts = await getMahindraCityProducts();

  let monthlyRecord = await NailPacking.findOne({
    companyName: "Mahindra City",
    month,
    year,
  });

  // ========================================
  // CREATE MONTHLY DOCUMENT IF NOT EXISTS
  // ========================================

  if (!monthlyRecord) {
    const productIds = activeProducts.map(
      (product) => product._id
    );

    const dailyEntries = generateMonthDates(
      month,
      year
    ).map((entry) => ({
      ...entry,
      products: productIds.map((productId) => ({
        productId,
        quantity: 0,
      })),
    }));

    try {
      monthlyRecord = await NailPacking.create({
        companyName: "Mahindra City",
        month,
        year,
        products: productIds,
        dailyEntries,
      });
    } catch (error) {
      // Handle simultaneous GET requests
      if (error.code === 11000) {
        monthlyRecord = await NailPacking.findOne({
          companyName: "Mahindra City",
          month,
          year,
        });
      } else {
        throw error;
      }
    }
  }

  if (!monthlyRecord) {
    throw new Error("Unable to create monthly report");
  }

  // ========================================
  // SYNC NEW PRODUCTS
  // ========================================

  await syncMonthlyProducts(
    monthlyRecord,
    activeProducts
  );

  // ========================================
  // POPULATE PRODUCT DETAILS
  // ========================================

  await monthlyRecord.populate([
    {
      path: "products",
      select: "name isActive",
    },
    {
      path: "dailyEntries.products.productId",
      select: "name isActive",
    },
  ]);

  return monthlyRecord;
};

// ==========================================
// UPDATE DAILY PRODUCTION
// ==========================================

const updateNailPackingDaily = async (
  monthId,
  date,
  data
) => {
  const monthlyRecord = await NailPacking.findById(
    monthId
  );

  if (!monthlyRecord) {
    const error = new Error(
      "Nail packing monthly report not found"
    );
    error.statusCode = 404;
    throw error;
  }

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const error = new Error("Invalid date format");
    error.statusCode = 400;
    throw error;
  }

  const [year, month, day] = date
    .split("-")
    .map(Number);

  const selectedDate = new Date(
    Date.UTC(year, month - 1, day)
  );

  // Check actual calendar date
  if (
    selectedDate.getUTCFullYear() !== year ||
    selectedDate.getUTCMonth() + 1 !== month ||
    selectedDate.getUTCDate() !== day
  ) {
    const error = new Error("Invalid calendar date");
    error.statusCode = 400;
    throw error;
  }

  if (
    month !== monthlyRecord.month ||
    year !== monthlyRecord.year
  ) {
    const error = new Error(
      "Date does not belong to this monthly report"
    );
    error.statusCode = 400;
    throw error;
  }

  // ========================================
  // CHECK PRODUCT IDs
  // ========================================

  const monthlyProductIds = new Set(
    monthlyRecord.products.map((id) => id.toString())
  );

  for (const item of data.products) {
    if (!monthlyProductIds.has(item.productId)) {
      const error = new Error(
        "Product does not belong to this monthly report"
      );
      error.statusCode = 400;
      throw error;
    }
  }

  // ========================================
  // FIND DAILY ENTRY
  // ========================================

  let dailyEntry = monthlyRecord.dailyEntries.find(
    (entry) =>
      entry.date.getTime() === selectedDate.getTime()
  );

  if (!dailyEntry) {
    const error = new Error(
      "Daily entry not found"
    );
    error.statusCode = 404;
    throw error;
  }

  // ========================================
  // UPDATE QUANTITIES
  // ========================================

  for (const item of data.products) {
    const existingProduct = dailyEntry.products.find(
      (product) =>
        product.productId.toString() === item.productId
    );

    if (existingProduct) {
      existingProduct.quantity = item.quantity;
    }
  }

  // ========================================
  // UPDATE REMARKS
  // ========================================

  dailyEntry.remarks = data.remarks ?? "";

  await monthlyRecord.save();

  // Populate latest product names
  await monthlyRecord.populate([
    {
      path: "products",
      select: "name isActive",
    },
    {
      path: "dailyEntries.products.productId",
      select: "name isActive",
    },
  ]);

  return monthlyRecord;
};

module.exports = {
  getNailPackingReport,
  updateNailPackingDaily,
};