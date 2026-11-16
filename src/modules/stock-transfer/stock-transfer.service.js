const mongoose = require("mongoose");

const OpeningStock = require("../opening-stock/opening-stock.model");
const StockTransfer = require("./stock-transfer.model");
const Nail = require("../nails/nail.model");
const Item = require("../items/item.model");
const Consumable = require("../consumables/consumable.model");

// ==========================================
// HELPERS
// ==========================================

const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const isValidId = (id) =>
  mongoose.Types.ObjectId.isValid(id);

const isNewItemCategory = (category) => {
  const name = String(category?.name || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");

  return name === "newitem";
};

const getCategory = async (categoryId) => {
  return mongoose
    .model("ItemCategory")
    .findById(categoryId)
    .select("name");
};

const getStockFilter = ({
  location,
  itemType,
  category,
  referenceId,
}) => {
  const filter = {
    location,
    type: itemType,
    referenceId,
  };

  if (itemType === "item") {
    filter.category = category;
  }

  return filter;
};

const getStockRecords = async (transfer) => {
  const filter = {
    itemType: transfer.itemType,
    category: transfer.category,
    referenceId: transfer.referenceId,
  };

  const [sourceStock, destinationStock] = await Promise.all([
    OpeningStock.findOne(
      getStockFilter({
        ...filter,
        location: transfer.fromLocation,
      })
    ),

    OpeningStock.findOne(
      getStockFilter({
        ...filter,
        location: transfer.toLocation,
      })
    ),
  ]);

  if (!sourceStock) {
    throw createError("Source location stock not found", 404);
  }

  if (!destinationStock) {
    throw createError("Destination location stock not found", 404);
  }

  return { sourceStock, destinationStock };
};

// ==========================================
// VALIDATE TRANSFER TYPE
// ==========================================

const getTransferDetails = async (itemType, category) => {
  if (!["item", "nail", "consumable"].includes(itemType)) {
    throw createError("Invalid stock type");
  }

  if (itemType === "item") {
    if (!isValidId(category)) {
      throw createError("Valid item category is required");
    }

    const itemCategory = await getCategory(category);

    if (!itemCategory) {
      throw createError("Item category not found", 404);
    }

    return {
      isNewItem: isNewItemCategory(itemCategory),
    };
  }

  return { isNewItem: false };
};

// ==========================================
// NORMALIZE PIECES
// ==========================================

const normalizePieces = (pieces = []) => {
  if (!Array.isArray(pieces)) {
    throw createError("Pieces must be an array");
  }

  const map = new Map();

  for (const piece of pieces) {
    if (
      !isValidId(piece.pieceSizeId) ||
      !Number.isInteger(Number(piece.count)) ||
      Number(piece.count) <= 0
    ) {
      throw createError("Invalid piece details");
    }

    const id = String(piece.pieceSizeId);

    map.set(id, (map.get(id) || 0) + Number(piece.count));
  }

  return Array.from(map, ([pieceSizeId, count]) => ({
    pieceSizeId,
    count,
  }));
};

// ==========================================
// NORMAL STOCK UPDATE
// direction: -1 = decrease
// direction: +1 = increase
// ==========================================

const adjustNormalStock = async (stockId, quantity, direction) => {
  if (quantity <= 0) return;

  const filter = {
    _id: stockId,
  };

  if (direction === -1) {
    filter.currentStock = {
      $gte: quantity,
    };
  }

  const result = await OpeningStock.updateOne(
    filter,
    {
      $inc: {
        currentStock: direction * quantity,
      },
    }
  );

  if (!result.modifiedCount) {
    throw createError(
      direction === -1
        ? "Insufficient stock"
        : "Normal stock update failed"
    );
  }
};

// ==========================================
// NEW ITEM PIECE STOCK UPDATE
// direction: -1 = decrease
// direction: +1 = increase
// ==========================================

const adjustPieceStock = async (stockId, pieces, direction) => {
  const changes = pieces.filter((piece) => piece.count > 0);

  if (!changes.length) return;

  const increment = {};
  const arrayFilters = [];
  const conditions = [];

  changes.forEach((piece, index) => {
    const key = `piece${index}`;

    increment[`pieces.$[${key}].count`] =
      direction * piece.count;

    arrayFilters.push({
      [`${key}.pieceSizeId`]: new mongoose.Types.ObjectId(
        piece.pieceSizeId
      ),
    });

    conditions.push({
      pieces: {
        $elemMatch: {
          pieceSizeId: new mongoose.Types.ObjectId(
            piece.pieceSizeId
          ),
          ...(direction === -1
            ? { count: { $gte: piece.count } }
            : {}),
        },
      },
    });
  });

  const result = await OpeningStock.updateOne(
    {
      _id: stockId,
      $and: conditions,
    },
    {
      $inc: increment,
    },
    {
      arrayFilters,
    }
  );

  if (!result.modifiedCount) {
    throw createError(
      direction === -1
        ? "Insufficient piece stock or piece size not found"
        : "Piece stock update failed"
    );
  }
};

// ==========================================
// MOVE NORMAL STOCK
// transferDirection:
// +1 = increase transfer quantity
// -1 = decrease transfer quantity
// ==========================================

const moveNormalStock = async (
  sourceStockId,
  destinationStockId,
  quantity,
  transferDirection
) => {
  const sourceDirection = -transferDirection;
  const destinationDirection = transferDirection;

  await adjustNormalStock(
    sourceStockId,
    quantity,
    sourceDirection
  );

  try {
    await adjustNormalStock(
      destinationStockId,
      quantity,
      destinationDirection
    );
  } catch (error) {
    // Restore source if destination update fails
    try {
      await adjustNormalStock(
        sourceStockId,
        quantity,
        -sourceDirection
      );
    } catch (rollbackError) {
      error.rollbackError = rollbackError;
    }

    throw error;
  }

  return {
    sourceStockId,
    destinationStockId,
    quantity,
    transferDirection,
  };
};

// ==========================================
// MOVE NEW ITEM PIECES
// ==========================================

const movePieceStock = async (
  sourceStockId,
  destinationStockId,
  piece,
  transferDirection
) => {
  const sourceDirection = -transferDirection;
  const destinationDirection = transferDirection;

  const pieceData = [
    {
      pieceSizeId: piece.pieceSizeId,
      count: piece.count,
    },
  ];

  await adjustPieceStock(
    sourceStockId,
    pieceData,
    sourceDirection
  );

  try {
    await adjustPieceStock(
      destinationStockId,
      pieceData,
      destinationDirection
    );
  } catch (error) {
    // Restore source if destination update fails
    try {
      await adjustPieceStock(
        sourceStockId,
        pieceData,
        -sourceDirection
      );
    } catch (rollbackError) {
      error.rollbackError = rollbackError;
    }

    throw error;
  }

  return {
    sourceStockId,
    destinationStockId,
    piece: pieceData[0],
    transferDirection,
  };
};

// ==========================================
// ROLLBACK MOVEMENTS
// ==========================================

const rollbackMovements = async (movements, isNewItem) => {
  const errors = [];

  for (const movement of [...movements].reverse()) {
    try {
      if (isNewItem) {
        await movePieceStock(
          movement.sourceStockId,
          movement.destinationStockId,
          movement.piece,
          -movement.transferDirection
        );
      } else {
        await moveNormalStock(
          movement.sourceStockId,
          movement.destinationStockId,
          movement.quantity,
          -movement.transferDirection
        );
      }
    } catch (error) {
      errors.push(error);
    }
  }

  if (errors.length) {
    const error = createError(
      "Stock rollback failed. Please verify both location stocks.",
      500
    );

    error.rollbackErrors = errors;
    throw error;
  }
};
// ==========================================
// CREATE STOCK TRANSFER
// ==========================================

const createStockTransfer = async (data, userId) => {
  const {
    fromLocation,
    toLocation,
    itemType,
    category,
    referenceId,
    quantity,
    unit,
    pieces,
    remarks,
  } = data;

  // Validate IDs
  if (
    !isValidId(fromLocation) ||
    !isValidId(toLocation) ||
    !isValidId(referenceId) ||
    !isValidId(userId)
  ) {
    throw createError("Invalid location, item or user ID");
  }

  if (String(fromLocation) === String(toLocation)) {
    throw createError("From and To locations cannot be same");
  }

  const { isNewItem } = await getTransferDetails(
    itemType,
    category
  );

  // Dynamic reference model mapping
  const referenceModel = {
    nail: "Nail",
    item: "Item",
    consumable: "Consumable",
  }[itemType];

  if (!referenceModel) {
    throw createError("Invalid reference model");
  }

  const transferData = {
    fromLocation,
    toLocation,
    itemType,
    ...(itemType === "item" && { category }),
    referenceId,
    referenceModel,
  };

  const { sourceStock, destinationStock } =
    await getStockRecords(transferData);

  let transferQuantity;
  let normalizedPieces = [];

  // New Item validation
  if (isNewItem) {
    normalizedPieces = normalizePieces(pieces);

    if (!normalizedPieces.length) {
      throw createError("Piece details are required");
    }

    for (const piece of normalizedPieces) {
      const sourcePiece = sourceStock.pieces.find(
        (p) =>
          String(p.pieceSizeId) === piece.pieceSizeId
      );

      const destinationPiece = destinationStock.pieces.find(
        (p) =>
          String(p.pieceSizeId) === piece.pieceSizeId
      );

      if (!sourcePiece || sourcePiece.count < piece.count) {
        throw createError("Insufficient source piece stock");
      }

      if (!destinationPiece) {
        throw createError("Destination piece size not found");
      }
    }
  } else {
    // Normal stock validation
    transferQuantity = Number(quantity);

    if (
      !Number.isFinite(transferQuantity) ||
      transferQuantity <= 0
    ) {
      throw createError("Valid transfer quantity is required");
    }

    if (!["kg", "g", "pcs"].includes(unit)) {
      throw createError("Valid stock unit is required");
    }

    if (Number(sourceStock.currentStock || 0) < transferQuantity) {
      throw createError("Insufficient source stock");
    }
  }

  const movements = [];

  try {
    // Update stock
    if (isNewItem) {
      for (const piece of normalizedPieces) {
        const movement = await movePieceStock(
          sourceStock._id,
          destinationStock._id,
          piece,
          1
        );

        movements.push(movement);
      }
    } else {
      const movement = await moveNormalStock(
        sourceStock._id,
        destinationStock._id,
        transferQuantity,
        1
      );

      movements.push(movement);
    }

    // Create transfer record
    const transfer = await StockTransfer.create({
      ...transferData,

      ...(isNewItem
        ? { pieces: normalizedPieces }
        : { quantity: transferQuantity, unit }),

      transferredBy: userId,
      remarks: remarks || "",
    });

    return transfer;
  } catch (error) {
    try {
      await rollbackMovements(movements, isNewItem);
    } catch (rollbackError) {
      error.rollbackError = rollbackError;
    }

    throw error;
  }
};

// ==========================================
// GET ALL STOCK TRANSFERS
// ==========================================

const getAllStockTransfers = async (filters = {}) => {
  const query = {};

  // From Location Filter
  if (filters.fromLocation) {
    if (!isValidId(filters.fromLocation)) {
      throw createError("Invalid from location ID");
    }

    query.fromLocation = filters.fromLocation;
  }

  // To Location Filter
  if (filters.toLocation) {
    if (!isValidId(filters.toLocation)) {
      throw createError("Invalid to location ID");
    }

    query.toLocation = filters.toLocation;
  }

  // Item Type Filter
  if (filters.itemType) {
    if (!["item", "nail", "consumable"].includes(filters.itemType)) {
      throw createError("Invalid stock type");
    }

    query.itemType = filters.itemType;
  }

  // Reference ID Filter
  if (filters.referenceId) {
    if (!isValidId(filters.referenceId)) {
      throw createError("Invalid reference ID");
    }

    query.referenceId = filters.referenceId;
  }

  // Date Filter
  if (filters.startDate || filters.endDate) {
    query.transferDate = {};

    if (filters.startDate) {
      const startDate = new Date(filters.startDate);

      if (Number.isNaN(startDate.getTime())) {
        throw createError("Invalid start date");
      }

      query.transferDate.$gte = startDate;
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate);

      if (Number.isNaN(endDate.getTime())) {
        throw createError("Invalid end date");
      }

      endDate.setHours(23, 59, 59, 999);
      query.transferDate.$lte = endDate;
    }
  }

  // Fetch Stock Transfers
  const transfers = await StockTransfer.find(query)
    .populate("fromLocation", "name")
    .populate("toLocation", "name")
    .populate("category", "name")
    .populate("transferredBy", "name email")
    .sort({
      transferDate: -1,
      createdAt: -1,
    })
    .lean();

  // Resolve referenceId based on itemType
  const formattedTransfers = await Promise.all(
    transfers.map(async (transfer) => {
      let Model;

      switch (transfer.itemType) {
        case "nail":
          Model = Nail;
          break;

        case "consumable":
          Model = Consumable;
          break;

        case "item":
          Model = Item;
          break;

        default:
          return {
            ...transfer,
            itemName: "-",
          };
      }

      const reference = await Model.findById(transfer.referenceId)
        .select("name")
        .lean();

      return {
        ...transfer,
        referenceId: reference || transfer.referenceId,
        itemName: reference?.name || "-",
      };
    })
  );

  return formattedTransfers;
};
// ==========================================
// GET STOCK TRANSFERS BY LOCATION
// ==========================================

const getStockTransfersByLocation = async (
  locationId,
  filters = {}
) => {
  if (!isValidId(locationId)) {
    throw createError("Invalid location ID");
  }

  const query = {
    $or: [
      { fromLocation: locationId },
      { toLocation: locationId },
    ],
  };

  if (filters.itemType) {
    if (!["item", "nail", "consumable"].includes(filters.itemType)) {
      throw createError("Invalid stock type");
    }

    query.itemType = filters.itemType;
  }

  if (filters.startDate || filters.endDate) {
    query.transferDate = {};

    if (filters.startDate) {
      const startDate = new Date(filters.startDate);

      if (Number.isNaN(startDate.getTime())) {
        throw createError("Invalid start date");
      }

      query.transferDate.$gte = startDate;
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate);

      if (Number.isNaN(endDate.getTime())) {
        throw createError("Invalid end date");
      }

      query.transferDate.$lte = endDate;
    }
  }

  const transfers = await StockTransfer.find(query)
    .populate("fromLocation", "name")
    .populate("toLocation", "name")
    .populate("category", "name")
    .populate("transferredBy", "name email")
    .sort({
      transferDate: -1,
      createdAt: -1,
    })
    .lean();

  return transfers.map((transfer) => ({
    ...transfer,

    movementType:
      String(transfer.fromLocation?._id) === String(locationId)
        ? "transfer_out"
        : "transfer_in",
  }));
};

// ==========================================
// UPDATE STOCK TRANSFER
// ==========================================

const updateStockTransfer = async (id, data) => {
  if (!isValidId(id)) {
    throw createError("Invalid transfer ID");
  }

  const transfer = await StockTransfer.findById(id);

  if (!transfer) {
    throw createError("Stock transfer not found", 404);
  }

  // ------------------------------------------
  // REFERENCE MODEL
  // ------------------------------------------

  if (!transfer.referenceModel) {
    transfer.referenceModel = {
      nail: "Nail",
      item: "Item",
      consumable: "Consumable",
    }[transfer.itemType];
  }

  if (!transfer.referenceModel) {
    throw createError("Invalid reference model");
  }

  // ------------------------------------------
  // VALIDATE TRANSFER TYPE
  // ------------------------------------------

  const { isNewItem } = await getTransferDetails(
    transfer.itemType,
    transfer.category
  );

  const { sourceStock, destinationStock } =
    await getStockRecords(transfer);

  let oldQuantity = 0;
  let newQuantity = 0;

  let oldPieces = [];
  let newPieces = [];

  // ------------------------------------------
  // NEW ITEM UPDATE
  // ------------------------------------------

  if (isNewItem) {
    oldPieces = normalizePieces(transfer.pieces);

    newPieces =
      data.pieces !== undefined
        ? normalizePieces(data.pieces)
        : oldPieces;

    if (!newPieces.length) {
      throw createError("Piece details are required");
    }
  } else {
    // ------------------------------------------
    // NORMAL STOCK UPDATE
    // ------------------------------------------

    oldQuantity = Number(transfer.quantity);

    newQuantity =
      data.quantity !== undefined
        ? Number(data.quantity)
        : oldQuantity;

    if (
      !Number.isFinite(newQuantity) ||
      newQuantity <= 0
    ) {
      throw createError("Valid transfer quantity is required");
    }

    if (
      data.unit !== undefined &&
      data.unit !== transfer.unit
    ) {
      throw createError("Changing stock unit is not allowed");
    }
  }

  // ------------------------------------------
  // CALCULATE PIECE DIFFERENCES
  // ------------------------------------------

  const pieceChanges = [];

  if (isNewItem) {
    const oldMap = new Map(
      oldPieces.map((p) => [p.pieceSizeId, p.count])
    );

    const newMap = new Map(
      newPieces.map((p) => [p.pieceSizeId, p.count])
    );

    const allPieceIds = new Set([
      ...oldMap.keys(),
      ...newMap.keys(),
    ]);

    for (const pieceSizeId of allPieceIds) {
      const oldCount = oldMap.get(pieceSizeId) || 0;
      const newCount = newMap.get(pieceSizeId) || 0;

      const difference = newCount - oldCount;

      if (difference !== 0) {
        pieceChanges.push({
          pieceSizeId,
          count: Math.abs(difference),

          // +1 = transfer increased
          // -1 = transfer decreased
          transferDirection: difference > 0 ? 1 : -1,
        });
      }
    }

    // Validate destination piece sizes
    for (const piece of newPieces) {
      const destinationPiece = destinationStock.pieces.find(
        (p) =>
          String(p.pieceSizeId) === piece.pieceSizeId
      );

      const sourcePiece = sourceStock.pieces.find(
        (p) =>
          String(p.pieceSizeId) === piece.pieceSizeId
      );

      if (!destinationPiece || !sourcePiece) {
        throw createError(
          "Piece size not found in both locations"
        );
      }
    }
  } else {
    const difference = newQuantity - oldQuantity;

    // When reducing transfer quantity,
    // destination must have enough stock to return.
    if (
      difference < 0 &&
      Number(destinationStock.currentStock || 0) <
        Math.abs(difference)
    ) {
      throw createError(
        "Destination does not have enough stock for this update"
      );
    }
  }

  // ------------------------------------------
  // APPLY STOCK CHANGES
  // ------------------------------------------

  const movements = [];

  try {
    if (isNewItem) {
      for (const change of pieceChanges) {
        const movement = await movePieceStock(
          sourceStock._id,
          destinationStock._id,
          {
            pieceSizeId: change.pieceSizeId,
            count: change.count,
          },
          change.transferDirection
        );

        movements.push(movement);
      }

      transfer.pieces = newPieces;
    } else {
      const difference = newQuantity - oldQuantity;

      if (difference !== 0) {
        const movement = await moveNormalStock(
          sourceStock._id,
          destinationStock._id,
          Math.abs(difference),
          difference > 0 ? 1 : -1
        );

        movements.push(movement);
      }

      transfer.quantity = newQuantity;
    }

    // Update remarks
    if (data.remarks !== undefined) {
      transfer.remarks = data.remarks;
    }

    // Save transfer
    await transfer.save();

    return transfer;
  } catch (error) {
    // Rollback stock movements if save/update fails
    try {
      await rollbackMovements(movements, isNewItem);
    } catch (rollbackError) {
      error.rollbackError = rollbackError;
    }

    throw error;
  }
};

// ==========================================
// EXPORTS
// ==========================================

module.exports = {
  createStockTransfer,
  getAllStockTransfers,
  getStockTransfersByLocation,
  updateStockTransfer,
};