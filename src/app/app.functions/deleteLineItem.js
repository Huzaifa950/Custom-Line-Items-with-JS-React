const axios = require('axios');

exports.main = async (context = {}) => {
  const { lineItemId } = context.parameters;

  if (!lineItemId) {
    return { statusCode: 400, body: { message: 'Line item ID is required.' } };
  }

  try {
    const url = `https://api.hubapi.com/crm/v3/objects/line_items/${lineItemId}`;

    console.log('url', url);

    const response = await axios.delete(url, {

    });

    if (response.status === 204) {
      return { statusCode: 200, body: { message: 'Line item deleted successfully.' } };
    } else {
      throw new Error(`Unexpected response status: ${response.status}`);
    }
  } catch (error) {
    console.error(`Error deleting line item: ${lineItemId}`, error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return {
      statusCode: error.response ? error.response.status : 500,
      body: { message: error.response?.data?.message || error.message }
    };
  }
};
