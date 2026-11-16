const Enquiry = require("./enquiry.model");

// =========================
// GENERATE ENQUIRY NUMBER
// =========================

const generateEnquiryNo = async () => {
  const lastEnquiry = await Enquiry.findOne()
    .sort({ createdAt: -1 })
    .select("enquiryNo");

  if (!lastEnquiry) {
    return "ENQ001";
  }

  const lastCode = lastEnquiry.enquiryNo;

  const number = parseInt(
    lastCode.replace("ENQ", ""),
    10
  );

  const nextNumber = number + 1;

  return `ENQ${String(nextNumber).padStart(3, "0")}`;
};

// =========================
// CREATE ENQUIRY
// =========================

const createEnquiry = async (data) => {
  const {
    date,
    customerName,
    companyId,
    companyName,
    phone,
    platform,
    location,
    requirement,
    details,
    status,
  } = data;

  const enquiryNo = await generateEnquiryNo();

  const enquiry = await Enquiry.create({
    enquiryNo,
    date,
    customerName,
    companyId,
    companyName,
    phone,
    platform,
    location,
    requirement,
    details,
    status,
  });

  return enquiry;
};

// =========================
// GET ALL ENQUIRIES
// =========================

const getAllEnquiries = async () => {
  return await Enquiry.find()
    .populate("companyId", "companyName")
    // .populate("orderId")
    .sort({
      date: -1,
      createdAt: -1,
    });
};

// =========================
// GET ENQUIRY BY ID
// =========================

const getEnquiryById = async (enquiryId) => {
  const enquiry = await Enquiry.findById(enquiryId)
    .populate("companyId", "companyName");
    // .populate("orderId");

  if (!enquiry) {
    throw new Error("Enquiry not found");
  }

  return enquiry;
};

// =========================
// UPDATE ENQUIRY
// =========================

const updateEnquiry = async (
  enquiryId,
  data
) => {
  const enquiry = await Enquiry.findById(
    enquiryId
  );

  if (!enquiry) {
    throw new Error("Enquiry not found");
  }

  if (data.date !== undefined) {
    enquiry.date = data.date;
  }

  if (data.customerName !== undefined) {
    enquiry.customerName = data.customerName;
  }

  if (data.companyId !== undefined) {
    enquiry.companyId = data.companyId;
  }

  if (data.companyName !== undefined) {
    enquiry.companyName = data.companyName;
  }

  if (data.phone !== undefined) {
    enquiry.phone = data.phone;
  }

  if (data.platform !== undefined) {
    enquiry.platform = data.platform;
  }

  if (data.location !== undefined) {
    enquiry.location = data.location;
  }

  if (data.requirement !== undefined) {
    enquiry.requirement = data.requirement;
  }

  if (data.details !== undefined) {
    enquiry.details = data.details;
  }

  if (data.status !== undefined) {
    enquiry.status = data.status;
  }

  if (data.orderId !== undefined) {
    enquiry.orderId = data.orderId;
  }

  await enquiry.save();

  return enquiry;
};

// =========================
// DELETE ENQUIRY
// =========================

const deleteEnquiry = async (enquiryId) => {
  const enquiry = await Enquiry.findById(
    enquiryId
  );

  if (!enquiry) {
    throw new Error("Enquiry not found");
  }

  await Enquiry.findByIdAndDelete(
    enquiryId
  );

  return {
    id: enquiry._id,
    message: "Enquiry deleted successfully",
  };
};

module.exports = {
  createEnquiry,
  getAllEnquiries,
  getEnquiryById,
  updateEnquiry,
  deleteEnquiry,
};