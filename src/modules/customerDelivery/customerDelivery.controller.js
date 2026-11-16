const customerDeliveryService = require("./customerDelivery.service");
const {
  createCustomerDeliverySchema,
  updateCustomerDeliverySchema,
} = require("./customerDelivery.validation");

const createCustomerDelivery = async (req, res) => {
  try {
    const { error, value } =
      createCustomerDeliverySchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const delivery =
      await customerDeliveryService.createCustomerDelivery(
        value
      );

    return res.status(201).json({
      success: true,
      message: "Customer delivery created successfully.",
      data: delivery,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getCustomerDeliveries = async (req, res) => {
  try {
    const deliveries =
      await customerDeliveryService.getCustomerDeliveries();

    return res.status(200).json({
      success: true,
      data: deliveries,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getCustomerDeliveryById = async (req, res) => {
  try {
    const delivery =
      await customerDeliveryService.getCustomerDeliveryById(
        req.params.id
      );

    return res.status(200).json({
      success: true,
      data: delivery,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

const updateCustomerDelivery = async (req, res) => {
  try {
    const { error, value } =
      updateCustomerDeliverySchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const delivery =
      await customerDeliveryService.updateCustomerDelivery(
        req.params.id,
        value
      );

    return res.status(200).json({
      success: true,
      message: "Customer delivery updated successfully.",
      data: delivery,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteCustomerDelivery = async (req, res) => {
  try {
    await customerDeliveryService.deleteCustomerDelivery(
      req.params.id
    );

    return res.status(200).json({
      success: true,
      message: "Customer delivery deleted successfully.",
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createCustomerDelivery,
  getCustomerDeliveries,
  getCustomerDeliveryById,
  updateCustomerDelivery,
  deleteCustomerDelivery,
};