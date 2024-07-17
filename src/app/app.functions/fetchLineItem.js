const axios = require("axios");

exports.main = async (context = {}) => {
  const { dealId } = context.parameters;
  let lineItemIds = [];

  try {
    const response = await axios.get(
      `https://api.hubspot.com/crm/v3/objects/deals/${dealId}/associations/line_items`,

    );

    lineItemIds = response.data.results;
  } catch (error) {
    return null;
  }

  try {
    const lineItemsPromises = lineItemIds.map(lineItemId => axios.get(`https://api.hubapi.com/crm/v3/objects/line_items/${lineItemId.id}`, {
      params: {
        properties: 'name,lineItemId,hs_object_id,hs_sku,country,survey_language,line_item_description,price,amount,rate_type,department,description,quantity,amount,prodege_property,loi__target_,incidence____target_,loi,ir,start_date,end_date,system1_pricing,system1_survey_path, vertical, currency, netsuite_invoice__, invoice_date, status, sample_line_item_breakdown',
      },
    }));
    const lineItemsResponses = await Promise.all(lineItemsPromises);
    const lineItems = lineItemsResponses.map(response => response.data);

    return lineItems.map(item => {
      if (item.properties) {
        Object.assign(item, item.properties);
        delete item.properties;
      }

      return item;
    });
  } catch (error) {
    return error
  }
};