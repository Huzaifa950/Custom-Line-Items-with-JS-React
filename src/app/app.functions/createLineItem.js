const axios = require("axios");

exports.main = async (context = {}) => {
  const { lineItemId, dealId, prodege_property, name, survey_language, hs_sku, netsuite_invoice__, system1_survey_path, sample_line_item_breakdown, invoice_date, status, system1_pricing, currency, description, price, quantity, rate_type, department, offer, amount, loi__target_, incidence____target_, start_date, end_date, country, vertical } = context.parameters;

  try {
    if (lineItemId) {
      const updateResponse = await axios.patch(
        `https://api.hubapi.com/crm/v3/objects/line_items/${lineItemId}`,
        {
          properties: {
            prodege_property: prodege_property,
            name: name,
            country: country,
            survey_language: survey_language,
            description: description,
            price: price,
            rate_type: rate_type,
            loi__target_: loi__target_,
            incidence____target_: incidence____target_,
            start_date: start_date,
            end_date: end_date,
            quantity: quantity,
            net_price: amount,
            department: department,
            offer: offer,
            vertical: vertical,
            hs_sku: hs_sku,
            currency: currency,
            netsuite_invoice__: netsuite_invoice__,
            invoice_date: invoice_date,
            status : status,
            system1_pricing: system1_pricing,
            system1_survey_path: system1_survey_path,
            sample_line_item_breakdown: sample_line_item_breakdown
          },
        },

      );

      console.log(`Line item updated successfully with ID: ${lineItemId}`);
    } else {
      const createResponse = await axios.post(
        `https://api.hubapi.com/crm/v3/objects/line_items`,
        {
          properties: {
            prodege_property: prodege_property,
            name: name,
            country: country,
            survey_language: survey_language,
            description: description,
            price: price,
            rate_type: rate_type,
            loi__target_: loi__target_,
            incidence____target_: incidence____target_,
            start_date: start_date,
            end_date: end_date,
            quantity: quantity,
            net_price: amount,
            department: department,
            offer: offer,
            vertical: vertical,
            hs_sku: hs_sku,
            currency: currency,
            netsuite_invoice__: netsuite_invoice__,
            invoice_date: invoice_date,
            status : status,
            system1_pricing: system1_pricing,
            system1_survey_path: system1_survey_path,
            sample_line_item_breakdown: sample_line_item_breakdown
          },
        },

      );

      const newLineItemId = createResponse.data.id;
      console.log(`Line item created successfully with ID: ${newLineItemId}`);

      const associateResponse = await axios.put(
        `https://api.hubapi.com/crm/v3/objects/line_items/${newLineItemId}/associations/deals/${dealId}/line_item_to_deal`,
        {},

      );

      console.log(`Line item ${newLineItemId} associated with deal ${dealId} successfully`);

      return { success: true, lineItemId: newLineItemId };
    }

    return { success: true, lineItemId };
  } catch (error) {
    if (error.response) {
      console.error('Error creating or updating line item:', error.response.data);
      return { error: error.response.data };
    } else {
      console.error('Error creating or updating line item:', error.message);
      return { error: error.message };
    }
  }
};
