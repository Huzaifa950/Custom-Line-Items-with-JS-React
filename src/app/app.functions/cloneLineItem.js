const axios = require("axios");

exports.main = async (context = {}) => {
  const { lineItemId } = context.parameters;

  try {
    // First, fetch the details of the line item to be cloned
    const fetchResponse = await axios.get(
      `https://api.hubapi.com/crm/v3/objects/line_items/${lineItemId}`,
    );

    const lineItemDetails = fetchResponse.data.properties;
    delete lineItemDetails.id; // Remove the id property for cloning

    // Now create a new line item with the fetched details
    const createResponse = await axios.post(
      `https://api.hubapi.com/crm/v3/objects/line_items`,
      {
        properties: lineItemDetails,
      },
    );

    const newLineItemId = createResponse.data.id;

    console.log(`Line item cloned successfully with ID: ${newLineItemId}`);

    return { success: true, lineItemId: newLineItemId };
  } catch (error) {
    if (error.response) {
      console.error('Error cloning line item:', error.response.data);
      return { error: error.response.data };
    } else {
      console.error('Error cloning line item:', error.message);
      return { error: error.message };
    }
  }
};