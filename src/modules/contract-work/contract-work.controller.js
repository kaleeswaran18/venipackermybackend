
const contractWorkService = require("./contract-work.service");

// Create Contract Work
const createContractWork = async (req, res, next) => {
  try {
    const result = await contractWorkService.createContractWork(req.body,req.user.userId);

    res.status(201).json({
      success: true,
      message: "Contract Work created successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Get All Contract Works
const getAllContractWorks = async (req, res, next) => {
  try {
    const result = await contractWorkService.getAllContractWorks(req.query);

    res.status(200).json({
      success: true,
      message: "Contract Works fetched successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Get Contract Work By ID
const getContractWorkById = async (req, res, next) => {
  try {
    const result = await contractWorkService.getContractWorkById(
      req.params.id
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Contract Work not found",
      });
    }

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Update Contract Work
const updateContractWork = async (req, res, next) => {
  try {
    const result = await contractWorkService.updateContractWork(
      req.params.id,
      req.body,
      req.user.userId
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Contract Work not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Contract Work updated successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Delete Contract Work
const deleteContractWork = async (req, res, next) => {
  try {
    const result = await contractWorkService.deleteContractWork(
      req.params.id
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Contract Work not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Contract Work deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Add Payment
const addPayment = async (req, res, next) => {
  try {
    const result = await contractWorkService.addPayment(
      req.params.id,
      req.body,
      req.user.userId
    );

    res.status(200).json({
      success: true,
      message: "Payment added successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Update Payment
const updatePayment = async (req, res, next) => {
  try {
    const result = await contractWorkService.updatePayment(
      req.params.id,
      req.params.paymentId,
      req.body,
      req.user.userId
    );

    res.status(200).json({
      success: true,
      message: "Payment updated successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Delete Payment
const deletePayment = async (req, res, next) => {
  try {
    const result = await contractWorkService.deletePayment(
      req.params.id,
      req.params.paymentId
    );

    res.status(200).json({
      success: true,
      message: "Payment deleted successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createContractWork,
  getAllContractWorks,
  getContractWorkById,
  updateContractWork,
  deleteContractWork,
  addPayment,
  updatePayment,
  deletePayment,
};
