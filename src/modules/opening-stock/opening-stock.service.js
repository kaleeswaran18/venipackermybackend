
const mongoose = require("mongoose");

const OpeningStock = require("./opening-stock.model");
const PieceSize = require("../piece-size/piece-size.model");
const Location = require("../locations/location.model");

// ItemCategory model already registered in the application

const isNewItemCategory = (category) => {
  if (!category) return false;

  const categoryName = String(
    category.name || category
  )
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");

  return categoryName === "newitem";
};

/*
 * ==========================================
 * CREATE OPENING STOCK
 * ==========================================
 */

const createOpeningStock = async (data) => {
  const session = await mongoose.startSession();

  try {
    let result;

    await session.withTransaction(async () => {
      // Get all active locations
      const locations = await Location.find({
        isActive: true,
      })
        .select("_id name")
        .session(session);

      if (!locations.length) {
        const error = new Error("No active locations found");
        error.statusCode = 404;
        throw error;
      }

      let category = null;
      let pieces = [];

      // Validate item category
      if (data.type === "item") {
        const ItemCategory = mongoose.model("ItemCategory");

        category = await ItemCategory.findById(data.category)
          .select("name")
          .session(session);

        if (!category) {
          const error = new Error("Item category not found");
          error.statusCode = 404;
          throw error;
        }

        // Prepare New Item pieces
        if (isNewItemCategory(category)) {
          const pieceSizes = await PieceSize.find()
            .sort({ createdAt: 1 })
            .session(session);

          pieces = pieceSizes.map((pieceSize) => ({
            pieceSizeId: pieceSize._id,
            width: pieceSize.width,
            height: pieceSize.height,
            inch: pieceSize.inch,

            count: 0,
          }));
        }
      }

      const createdStocks = [];
      const skippedLocations = [];

      // Create separate document for every active location
      for (const location of locations) {
        const duplicateQuery = {
          location: location._id,
          type: data.type,
          referenceId: data.referenceId,
        };

        if (data.type === "item") {
          duplicateQuery.category = data.category;
        }

        const existingStock = await OpeningStock.findOne(
          duplicateQuery
        ).session(session);

        // Skip duplicate only for this location
        if (existingStock) {
          skippedLocations.push({
            locationId: location._id,
            locationName: location.name,
            reason: "Opening stock already exists",
          });

          continue;
        }

        let stockData;

        // New Item
        if (
          data.type === "item" &&
          isNewItemCategory(category)
        ) {
          stockData = {
            type: data.type,
            category: data.category,
            referenceId: data.referenceId,
            location: location._id,
            cft: data.cft,
            cubicMeter: data.cubicMeter,
            pieces: pieces.map((piece) => ({
              ...piece,
            })),
          };
        } else {
          // Used Item / Nail / Consumable
          stockData = {
            ...data,
            location: location._id,
            currentStock: data.quantity,
          };
        }

        const createdStocksForLocation = await OpeningStock.create(
          [stockData],
          { session }
        );
        const createdStock = createdStocksForLocation[0];

        createdStocks.push(createdStock);
      }

      // All locations already have this item
      if (!createdStocks.length) {
        const error = new Error(
          "Opening stock already exists in all active locations"
        );

        error.statusCode = 409;
        error.skippedLocations = skippedLocations;

        throw error;
      }

      result = createdStocks;
    });

    return result;

  } catch (error) {
    if (error.code === 11000) {
      const duplicateError = new Error(
        "Opening stock already exists for this item in one or more locations"
      );

      duplicateError.statusCode = 409;
      throw duplicateError;
    }

    throw error;
  } finally {
    await session.endSession();
  }
};

/*
 * ==========================================
 * GET ALL OPENING STOCKS
 * ==========================================
 */

const getOpeningStocks = async (locationId) => {
  const filter = {};

  if (locationId) {
    filter.location = locationId;
  }

  const openingStocks =
    await OpeningStock.find(filter)
      .populate("location", "name")
      .populate("category", "name")
      .sort({ createdAt: -1 });

  const stocks = openingStocks.map((stock) =>
    stock.toObject()
  );

  // Dynamic referenceId lookup

  for (const stock of stocks) {
    if (stock.type === "item") {
      const Item = mongoose.model("Item");

      stock.referenceId = await Item.findById(
        stock.referenceId
      )
        .select("_id name")
        .lean();
    }

    if (stock.type === "nail") {
      const Nail = mongoose.model("Nail");

      stock.referenceId = await Nail.findById(
        stock.referenceId
      )
        .select("_id name")
        .lean();
    }

    if (stock.type === "consumable") {
      const Consumable = mongoose.model("Consumable");

      stock.referenceId = await Consumable.findById(
        stock.referenceId
      )
        .select("_id name")
        .lean();
    }
  }

  return stocks;
};

/*
 * ==========================================
 * GET OPENING STOCK BY ID
 * ==========================================
 */

const getOpeningStockById = async (id) => {
  const openingStock =
    await OpeningStock.findById(id)
      .populate("location", "name")
      .populate("category", "name");

  if (!openingStock) {
    const error = new Error("Opening stock not found");
    error.statusCode = 404;
    throw error;
  }

  const stock = openingStock.toObject();

  // Dynamic referenceId lookup

  if (stock.type === "item") {
    const Item = mongoose.model("Item");

    stock.referenceId = await Item.findById(
      stock.referenceId
    )
      .select("_id name")
      .lean();
  }

  if (stock.type === "nail") {
    const Nail = mongoose.model("Nail");

    stock.referenceId = await Nail.findById(
      stock.referenceId
    )
      .select("_id name")
      .lean();
  }

  if (stock.type === "consumable") {
    const Consumable = mongoose.model("Consumable");

    stock.referenceId = await Consumable.findById(
      stock.referenceId
    )
      .select("_id name")
      .lean();
  }

  return stock;
};

/*
 * ==========================================
 * UPDATE OPENING STOCK
 * ==========================================
 */

const updateOpeningStock = async (id, data) => {
  const openingStock =
    await OpeningStock.findById(id);

  if (!openingStock) {
    const error = new Error("Opening stock not found");
    error.statusCode = 404;
    throw error;
  }

  if (data.location !== undefined) {
    openingStock.location = data.location;
  }

  if (data.type !== undefined) {
    openingStock.type = data.type;
  }

  if (data.category !== undefined) {
    openingStock.category = data.category;
  }

  if (data.referenceId !== undefined) {
    openingStock.referenceId = data.referenceId;
  }

  if (data.cft !== undefined) {
    openingStock.cft = data.cft;
  }

  if (data.cubicMeter !== undefined) {
    openingStock.cubicMeter = data.cubicMeter;
  }

  if (data.quantity !== undefined) {
    openingStock.quantity = data.quantity;

    if (
      openingStock.type === "nail" ||
      openingStock.type === "consumable"
    ) {
      openingStock.currentStock = data.quantity;
    }
  }

  if (data.unit !== undefined) {
    openingStock.unit = data.unit;
  }

  await openingStock.save();

  return openingStock;
};

/*
 * ==========================================
 * DELETE OPENING STOCK
 * ==========================================
 */

const deleteOpeningStock = async (id) => {
  const openingStock =
    await OpeningStock.findById(id);

  if (!openingStock) {
    const error = new Error("Opening stock not found");
    error.statusCode = 404;
    throw error;
  }

  await openingStock.deleteOne();

  return {
    message: "Opening stock deleted successfully",
  };
};

/*
 * ==========================================
 * UPDATE PARTICULAR PIECE
 * ==========================================
 */

const updateOpeningStockPiece = async (
  openingStockId,
  pieceId,
  data
) => {
  const openingStock =
    await OpeningStock.findById(openingStockId);

  if (!openingStock) {
    const error = new Error("Opening stock not found");
    error.statusCode = 404;
    throw error;
  }

  if (openingStock.type !== "item") {
    const error = new Error(
      "Pieces are available only for items"
    );

    error.statusCode = 400;
    throw error;
  }

  const piece = openingStock.pieces.id(pieceId);

  if (!piece) {
    const error = new Error("Piece not found");
    error.statusCode = 404;
    throw error;
  }

  if (data.width !== undefined) {
    piece.width = data.width;
  }

  if (data.inch !== undefined) {
    piece.inch = data.inch;
  }

  if (data.height !== undefined) {
    piece.height = data.height;
  }

  if (data.count !== undefined) {
    piece.count = data.count;
  }

  await openingStock.save();

  return openingStock;
};

/*
 * ==========================================
 * DELETE PARTICULAR PIECE
 * ==========================================
 */

const deleteOpeningStockPiece = async (
  openingStockId,
  pieceId
) => {
  const openingStock =
    await OpeningStock.findById(openingStockId);

  if (!openingStock) {
    const error = new Error("Opening stock not found");
    error.statusCode = 404;
    throw error;
  }

  if (openingStock.type !== "item") {
    const error = new Error(
      "Pieces are available only for items"
    );

    error.statusCode = 400;
    throw error;
  }

  const piece = openingStock.pieces.id(pieceId);

  if (!piece) {
    const error = new Error("Piece not found");
    error.statusCode = 404;
    throw error;
  }

  piece.deleteOne();

  await openingStock.save();

  return {
    message: "Piece deleted successfully",
  };
};

/*
 * ==========================================
 * EXPORTS
 * ==========================================
 */

module.exports = {
  createOpeningStock,
  getOpeningStocks,
  getOpeningStockById,

  updateOpeningStock,
  updateOpeningStockPiece,

  deleteOpeningStock,
  deleteOpeningStockPiece,
};
