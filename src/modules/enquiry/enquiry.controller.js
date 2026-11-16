const enquiryService = require("./enquiry.service");

// =========================
// CREATE ENQUIRY
// =========================

const createEnquiry = async (req, res, next) => {
  try {
    const enquiry = await enquiryService.createEnquiry(
      req.body
    );

    res.status(201).json({
      success: true,
      message: "Enquiry created successfully",
      data: enquiry,
    });
  } catch (error) {
    next(error);
  }
};

// =========================
// GET ALL ENQUIRIES
// =========================

const getAllEnquiries = async (req, res, next) => {
  try {
    const enquiries =
      await enquiryService.getAllEnquiries();

    res.status(200).json({
      success: true,
      message: "Enquiries fetched successfully",
      data: enquiries,
    });
  } catch (error) {
    next(error);
  }
};

// =========================
// GET ENQUIRY BY ID
// =========================

const getEnquiryById = async (req, res, next) => {
  try {
    const enquiry =
      await enquiryService.getEnquiryById(
        req.params.id
      );

    res.status(200).json({
      success: true,
      message: "Enquiry fetched successfully",
      data: enquiry,
    });
  } catch (error) {
    next(error);
  }
};

// =========================
// UPDATE ENQUIRY
// =========================

const updateEnquiry = async (req, res, next) => {
  try {
    const enquiry =
      await enquiryService.updateEnquiry(
        req.params.id,
        req.body
      );

    res.status(200).json({
      success: true,
      message: "Enquiry updated successfully",
      data: enquiry,
    });
  } catch (error) {
    next(error);
  }
};

// =========================
// DELETE ENQUIRY
// =========================

const deleteEnquiry = async (req, res, next) => {
  try {
    const result =
      await enquiryService.deleteEnquiry(
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
  createEnquiry,
  getAllEnquiries,
  getEnquiryById,
  updateEnquiry,
  deleteEnquiry,
};