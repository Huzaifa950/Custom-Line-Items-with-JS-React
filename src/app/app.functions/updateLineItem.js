const axios = require("axios");

exports.main = async (context = {}) => {
  const { id, dealId, prodege, name, description, unit_price, quantity, rateType, department, offer } = context.parameters;

  try {
    const updateResponse = await axios.patch(
      `https://api.hubapi.com/crm/v3/objects/line_items/${id}`,
      {
        properties: {
          prodege: prodege,
          name: name,
          description: description,
          unit_price: unit_price,
          rate_type: rateType,
          quantity: quantity,
          net_price: unit_price * quantity,
          department: department,
          offer: offer,
        },
      },

    );

    console.log(`Line item ${id} updated successfully`);

    return { success: true, lineItemId: id };
  } catch (error) {
    if (error.response) {
      console.error('Error updating line item:', error.response.data);
      return { error: error.response.data };
    } else {
      console.error('Error updating line item:', error.message);
      return { error: error.message };
    }
  }
};