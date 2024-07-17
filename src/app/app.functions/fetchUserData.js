const axios = require('axios');

exports.main = async (context = {}) => {
  const {userId} = context.parameters;
  try {
    const response = await axios.get(`https://api.hubspot.com/settings/v3/users/roles`, {

    });

    return response.data; 
  } catch (error) {
    if (error.response) {
      console.error('API Error:', error.response.status, error.response.data);
      throw new Error(`API Error: ${error.response.status}`);
    } else if (error.request) {
      console.error('Request Error:', error.request);
      throw new Error('Request Error: No response received');
    } else {
      console.error('Error:', error.message);
      throw new Error(`Error: ${error.message}`);
    }
  }
};