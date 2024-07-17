import React, { useState, useEffect } from "react";
import {
  Table,
  TableHead,
  TableRow,
  Dropdown,
  TableHeader,
  TableBody,
  TableCell,
  NumberInput,
  Input,
  Button,
  hubspot,
  Alert,
  Flex,
  Divider,
  LoadingSpinner,
  Text,
  DateInput,
  TextArea,
} from "@hubspot/ui-extensions";

import {
  NameOptions,
  VerticalOptions,
  RateTypeOptions,
  DeptOptions,
  surveyLangOptions,
  ProdegeOptions,
  CountryOptions,
  StatusOptions,
  System1PricingOptions,
} from "./options";

hubspot.extend(({ context, runServerlessFunction, actions }) => (
  <Extension
    context={context}
    runServerless={runServerlessFunction}
    sendAlert={actions.addAlert}
  />
));

const flattenObject = (obj, parent = "", res = {}) => {
  for (let key in obj) {
    let propName = parent ? `${parent}.${key}` : key;
    if (typeof obj[key] === "object" && obj[key] !== null) {
      flattenObject(obj[key], propName, res);
    } else {
      res[propName] = obj[key];
    }
  }
  return res;
};

const Extension = ({ context, runServerless, sendAlert }) => {
  const [deal, setDeal] = useState(null);
  const [error, setError] = useState(null);
  const [superAdmin, setSuperAdmin] = useState(null);
  const [markedForDeletion, setMarkedForDeletion] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const DEFAULT_PRODEGE_ID = "11";
  const [isActionDisabled, setIsActionDisabled] = useState(false);

  const flattenedContext = flattenObject(context);
  const teamName = flattenedContext["user.teams.0.name"];
  // const teamName = 'Perf';
  const dealId = context.crm.objectId;

  const fetchAndConsoleDeal = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const dealData = await runServerless({
        name: "fetchDealData",
        parameters: { dealId },
      });
      console.log("Fetched deal object:", dealData);
      setDeal(dealData);
    } catch (error) {
      setError(error.message);
      console.error("Error fetching deal object:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch the deal object when the component mounts
  useEffect(() => {
    fetchAndConsoleDeal();
  }, [dealId]);

  const fetchUserData = async () => {
    try {
      const usersId = flattenedContext["user.id"];
      // console.log("--> userId", usersId);
      const response = await runServerless({
        name: "fetchUserData",
        parameters: { userId: usersId },
      });

      // console.log("Fetched user data:", response);
      const flatUserData = flattenObject(response);
      // console.log("Fetched user data:", flatUserData);
      setSuperAdmin(flatUserData["response.results.0.name"]);
      // console.log("superAdmin = ", superAdmin);
      // Handle user data as needed
    } catch (error) {
      console.error("Error fetching user data:", error);
      setError(error.message || "Failed to fetch user data");
    }
  };

  fetchUserData();

  // console.log("--> context", context);
  // console.log("--> flattened context", flattenedContext);
  // console.log("--> team name", teamName);

  const [lineItems, setLineItems] = useState([
    { start_date: null, end_date: null, invoice_date: null },
    { start_date: null, end_date: null, invoice_date: null },
  ]);

  const handleDateChange = (index, key, value) => {
    const updatedItems = [...lineItems];
    updatedItems[index][key] = value?.formattedDate;
    setIsDirty(true);
    setLineItems(updatedItems);
  };

  useEffect(() => {
    const fetchLineItem = async () => {
      try {
        setLineItems(await fetchLineItems());
      } catch (error) {
        console.error("Failed to fetch Line Items:", error);
        setError("Failed to fetch Line Items.");
      }
    };
    fetchLineItem();
  }, [context.crm.objectId, runServerless]);

  const ActionOptions = [
    { label: "Delete", id: "delete", value: "Delete" },
    { label: "Clone", id: "clone", value: "Clone" },
  ];

  function createEmptyLineItem() {
    return {
      prodege_property: DEFAULT_PRODEGE_ID,
      name: "",
      country: "",
      survey_language: "",
      description: "",
      price: "",
      quantity: 1,
      loi__target_: "",
      incidence____target_: "",
      start_date: "",
      end_date: "",
      rate_type: "",
      department: "",
      offer: "",
      netPrice: "",
      vertical: "",
      currency: "",
      netsuite_invoice__: "",
      invoice_date: "",
      status: "",
      system1_pricing: "",
      system1_survey_path: "",
      sample_line_item_breakdown: "",
    };
  }

  const fetchLineItems = async () => {
    const response = await runServerless({
      name: "fetchLineItem",
      parameters: { dealId: context.crm.objectId },
    });
    if (response && Array.isArray(response.response)) {
      console.log("response.response ---> ", response.response)
      return await response.response;
      // const formattedLineItems = await response.response.map(item => {
      //   return {
      //     ...item,
      //     start_date: formatDate(item.start_date),
      //     end_date: formatDate(item.end_date),
      //     invoice_date: formatDate(item.invoice_date)
      //   };
      // });
      // console.log("formattedLineItems --> ", formattedLineItems);
      // return formattedLineItems;
    } else {
      console.error("Unexpected response format:", response);
      return [];
    }
  };
  // console.log("context.crm.objectId", context.crm.objectId);

  const formatDate = (dateString) => {
    if (!dateString) return null; // handle cases where dateString is null or undefined
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };


  const isRowComplete = (item) => {
    return (
      item.prodege_property ||
      item.name ||
      item.country ||
      item.survey_language ||
      item.description ||
      item.price ||
      item.quantity ||
      item.rate_type ||
      item.loi__target_ ||
      item.start_date ||
      item.end_date ||
      item.incidence____target_ ||
      item.department ||
      item.vertical ||
      item.offer
    );
  };

  const handleTableInputChange = (value, index, key) => {
    const updatedItems = [...lineItems];

    if (key === "price") {
      updatedItems[index][key] = `${parseFloat(value).toFixed(2)}`;
    } else if (
      key === "rate_type" ||
      key === "department" ||
      key === "prodege_property" ||
      key === "country" ||
      key === "survey_language"
    ) {
      updatedItems[index][key] = value;
    } else {
      updatedItems[index][key] = value;
    }

    if (key === "name") {
      console.log("going to update the department id");
      let departmentId = 32;
      if (value === "Shopper Marketing") {
        departmentId = 45;
      }
      updatedItems[index]["department"] = departmentId.toString();
      console.log("updatedItems[index][]", updatedItems[index]["department"]);
    }

    setLineItems(updatedItems);
    console.log("line items hamza", lineItems);
    setIsDirty(true);
  };

  const handleActionSelect = async (action, index) => {
    setIsActionDisabled(true);
    if (action === "delete") {
      console.log("DropDown Delete Clicked Successfully");
      await handleDeleteLineItem(index);
      await recalculateTotalNetPrice();
    } else if (action === "clone") {
      const lineItemToClone = lineItems[index];
      const clonedLineItem = { ...lineItemToClone };

      delete clonedLineItem.id;

      setLineItems([clonedLineItem, ...lineItems]);
      sendAlert({ message: "Line Item cloned successfully", type: "success" });
      setIsDirty(true);
      await recalculateTotalNetPrice();
    }

    setTimeout(() => {
      setIsActionDisabled(false);
    }, 1000);
  };

  const handleDeleteLineItem = async (index) => {
    console.log("handleDeleteLineItem called successfully");
    const lineItem = lineItems[index];
    // Mark the item for deletion
    setMarkedForDeletion([...markedForDeletion, lineItem]);
    // Temporarily remove the item from the displayed list
    setLineItems(lineItems.filter((_, i) => i !== index));
    sendAlert({ message: `Line Item marked for deletion`, type: "warning" });
    setIsDirty(true);
  };

  const handleCancelEvent = async () => {
    setError(null);
    setIsLoading(true);
    setLineItems(await fetchLineItems());
    setIsLoading(false);
  };

  const handleSubmitAll = async () => {
    // setLineItems(await fetchLineItems());
    setError(null);
    setIsLoading(true);
    const dealId = context.crm.objectId;

    const createdItems = [];
    const updatedItems = [];
    let validationError = false;

    const validatedLineItems = lineItems.map((item) => {
      const newItem = { ...item, isValid: true, validationMessage: "" };

      if (teamName === "Performance Marketing") {
        if (!item.name) {
          newItem.isValid = false;
          validationError = true;
        }
        if (!item.description) {
          newItem.isValid = false;
          validationError = true;
        }
        if (!item.price) {
          newItem.isValid = false;
          validationError = true;
        }
        if (!item.quantity) {
          newItem.isValid = false;
          validationError = true;
        }
        if (!item.rate_type) {
          newItem.isValid = false;
          validationError = true;
        }
      }
      return newItem;
    });

    setLineItems(validatedLineItems);

    if (validationError) {
      setError("Please fill out all required fields.");
      sendAlert({
        message: "Please fill out all required fields.",
        type: "danger",
      });
      setIsLoading(false);
      return;
    }

    try {
      await recalculateTotalNetPrice();

      const promises = lineItems.map((item) => {
        let departmentId;
        if (item.name === "") {
          departmentId = "";
        } else if (item.name === "Shopper Marketing") {
          departmentId = 45;
        } else {
          departmentId = 32;
        }

        let hs_sku_val;
        if (item.name === "Performance Marketing") {
          hs_sku_val = 971;
        } else if (item.name === "Performance Marketing Paid Placement") {
          hs_sku_val = 972;
        } else if (
          item.name === "Performance Marketing (tracked in aggregator)"
        ) {
          hs_sku_val = 1005;
        } else if (item.name === "Shopper Marketing") {
          hs_sku_val = 1072;
        }

        
        const params = {
          lineItemId: item.id,
          dealId: dealId,
          prodege_property: item.prodege_property,
          name: item.name,
          country: item.country,
          survey_language: item.survey_language,
          description: item.description,
          price: item.price,
          loi__target_: item.loi__target_,
          incidence____target_: item.incidence____target_,
          start_date: item.start_date,
          end_date: item.end_date,
          quantity: parseInt(item.quantity, 10),
          rate_type: item.rate_type,
          department: departmentId,
          offer: item.offer,
          hs_sku: hs_sku_val,
          vertical: item.vertical,

          currency: item.currency,
          netsuite_invoice__: item.netsuite_invoice__,
          invoice_date: item.invoice_date,
          status: item.status,
          system1_pricing: item.system1_pricing,
          system1_survey_path: item.system1_survey_path,
          sample_line_item_breakdown: item.sample_line_item_breakdown,
        };

        console.log("params --> ", params);

        if (item.id) {
          updatedItems.push(item.name);
          return runServerless({
            name: "createLineItem",
            parameters: params,
          });
        } else {
          createdItems.push(item.name);
          return runServerless({
            name: "createLineItem",
            parameters: params,
          });
        }
      });

      // Add delete requests for marked items
      markedForDeletion.forEach((item) => {
        console.log("Delete surverless function called", item.id);
        promises.push(
          runServerless({
            name: "deleteLineItem",
            parameters: { lineItemId: item.id },
          })
        );
      });

      console.log("All Line Items with IDs:");
      lineItems.forEach((item) => {
        console.log(`ID: ${item.id}, Name: ${item.name}`);
      });

      const responses = await Promise.all(promises);

      const hasError = responses.some((response) => response.error);
      if (hasError) {
        throw new Error(
          "An error occurred while creating/updating some Line Items."
        );
      }

      if (createdItems.length > 0) {
        sendAlert({
          message: `Line items created successfully`,
          type: "success",
        });
      } else if (updatedItems.length > 0) {
        sendAlert({
          message: `Line items updated successfully`,
          type: "success",
        });
      }
      setIsDirty(false);
      setMarkedForDeletion([]);
      setLineItems(await fetchLineItems());
    } catch (error) {
      setError(error.message);
      sendAlert({ message: error.message, type: "danger" });
    } finally {
      setTimeout(async () => {
        setLineItems(await fetchLineItems());
        setIsLoading(false);
      }, 100);
      setIsLoading(false);
    }
  };

  const getRateTypeValue = (id) => {
    const option = RateTypeOptions.find((opt) => opt.id === id);
    return option ? option.value : "";
  };

  const getSurveyLangValue = (id) => {
    const option = surveyLangOptions.find((opt) => opt.id === id);
    return option ? option.value : "";
  };

  const getProdegeValue = (id) => {
    id = id || DEFAULT_PRODEGE_ID;
    const option = ProdegeOptions.find((opt) => opt.id === id);
    return option ? option.label : "";
  };

  const getNameValue = (id) => {
    const option = NameOptions.find((opt) => opt.id === id);
    return option ? option.label : "";
  };

  const getDeptValue = (id) => {
    const option = DeptOptions.find((opt) => opt.id === id);
    return option ? option.value : "";
  };

  const getVerticalValue = (id) => {
    const option = VerticalOptions.find((opt) => opt.id === id);
    return option ? option.label : "";
  };

  const getCountryValue = (id) => {
    const option = CountryOptions.find((opt) => opt.id === id);
    return option ? option.label : "";
  };

  const getStatusValue = (id) => {
    const option = StatusOptions.find((opt) => opt.id === id);
    return option ? option.label : "";
  };

  const getSystem1PricingValue = (id) => {
    const option = System1PricingOptions.find((opt) => opt.id === id);
    return option ? option.label : "";
  };

  const getDateFieldObject = (date) => {
    console.log("date dfd", date)
    if (!date) return;

    const splittedDate = date.split('-');

    return {
      year: parseInt(splittedDate[0]),
      month: parseInt(splittedDate[1]) - 1,
      date: parseInt(splittedDate[2]),
      formattedDate: date
    }
  }

  const handleAddLineItem = async () => {
    if (lineItems.every(isRowComplete)) {
      // setLineItems([...lineItems, createEmptyLineItem()]);
      setLineItems([createEmptyLineItem(), ...lineItems]);
      setIsDirty(true);
      setError(null);

      await recalculateTotalNetPrice();
    } else {
      setError(
        "Please complete all fields in the current rows before adding a new Line Item."
      );
    }
  };

  const recalculateTotalNetPrice = async () => {
    const dealId = context.crm.objectId;

    // Calculate total net price
    let totalNetPrice = 0;
    lineItems.forEach((item) => {
      if (!item.markedForDeletion) {
        const netPrice = item.quantity * item.price;
        totalNetPrice += netPrice;
      }
    });

    // console.log("Total Net Price:", totalNetPrice);

    // Update the deal with the total amount
    try {
      const updatedDeal = await runServerless({
        name: "fetchDealData",
        parameters: {
          dealId,
          amount: totalNetPrice,
        },
      });
      console.log("Updated deal object:", updatedDeal);
      setDeal(updatedDeal);
    } catch (error) {
      console.error("Failed to update deal:", error);
      setError("Failed to update the deal amount.");
    }
  };

  return (
    <>
      <Flex direction={"row"} justify={"between"}>
        <Text></Text>
        <Button variant="primary" onClick={handleAddLineItem} align={"end"}>
          Add New Line Item
        </Button>
      </Flex>
      <Divider />
      <Table bordered={true}>
        <TableHead>
          <TableRow>
            {teamName === "Performance Marketing" && (
              <TableHeader width="min">PRODEGE PROPERTY</TableHeader>
            )}
            {(teamName === "Performance Marketing" ||
              teamName !== "Performance Marketing") && (
                <TableHeader width="min">ITEM</TableHeader>
              )}
            {(teamName === "Performance Marketing" ||
              teamName !== "Performance Marketing") && (
                <TableHeader width="min">DESCRIPTION</TableHeader>
              )}
            {(teamName === "Performance Marketing" ||
              teamName !== "Performance Marketing") && (
                <TableHeader width="min">UNIT PRICE</TableHeader>
              )}
            {teamName === "Performance Marketing" && (
              <TableHeader width="min">RATE TYPE</TableHeader>
            )}
            {(teamName === "Performance Marketing" ||
              teamName !== "Performance Marketing") && (
                <TableHeader width="min">QUANTITY</TableHeader>
              )}
            {teamName === "Performance Marketing" && (
              <TableHeader width="min">DEPARTMENT</TableHeader>
            )}
            {(teamName === "Performance Marketing" ||
              teamName !== "Performance Marketing") && (
                <TableHeader width="min">AMOUNT</TableHeader>
              )}
            {teamName === "Performance Marketing" && (
              <TableHeader width="min">OFFER</TableHeader>
            )}
            {teamName === "Performance Marketing" && (
              <TableHeader width="min">VERTICAL</TableHeader>
            )}
            {teamName !== "Performance Marketing" && (
              <TableHeader width="min">COUNTRY</TableHeader>
            )}
            {teamName !== "Performance Marketing" && (
              <TableHeader width="min">SURVEY LANGUAGE</TableHeader>
            )}
            {teamName !== "Performance Marketing" && (
              <TableHeader width="min">LOI</TableHeader>
            )}
            {teamName !== "Performance Marketing" && (
              <TableHeader width="min">IR</TableHeader>
            )}
            {teamName !== "Performance Marketing" && (
              <TableHeader width="min">START DATE</TableHeader>
            )}
            {teamName !== "Performance Marketing" && (
              <TableHeader width="min">END DATE</TableHeader>
            )}
            {teamName !== "Performance Marketing" && (
              <TableHeader width="min">CURRENCY</TableHeader>
            )}
            {teamName !== "Performance Marketing" && (
              <TableHeader width="min">NETSUITE INVOICE#</TableHeader>
            )}
            {teamName !== "Performance Marketing" && (
              <TableHeader width="min">
                INVOICE DATE (FOR NON-DMS ONLY)
              </TableHeader>
            )}
            {teamName !== "Performance Marketing" && (
              <TableHeader width="min">STATUS</TableHeader>
            )}
            {teamName !== "Performance Marketing" && (
              <TableHeader width="min">SYSTEM1 PRICING</TableHeader>
            )}
            {teamName !== "Performance Marketing" && (
              <TableHeader width="min">SYSTEM1 SURVEY PATH</TableHeader>
            )}
            {teamName !== "Performance Marketing" && (
              <TableHeader width="min">SAMPLE LINEITEM BREAKDOWN</TableHeader>
            )}

            <TableHeader width="min">ACTION</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {lineItems.map((lineItem, index) => {
            return (
              <TableRow key={index}>
                {teamName === "Performance Marketing" && (
                  <TableCell>
                    <Dropdown
                      options={ProdegeOptions.map((option) => ({
                        label: option.label,
                        onClick: () =>
                          handleTableInputChange(
                            option.id,
                            index,
                            "prodege_property"
                          ),
                      }))}
                      variant="secondary"
                      buttonSize="md"
                      buttonText={getProdegeValue(lineItem.prodege_property)}
                      required={true}
                      error={!lineItem.isValid && !lineItem.prodege_property}
                      validationMessage={
                        !lineItem.prodege_property
                          ? "Prodege Property is missing"
                          : ""
                      }
                    // disabled={true}
                    />
                  </TableCell>
                )}

                {(teamName === "Performance Marketing" ||
                  teamName !== "Performance Marketing") && (
                    <TableCell>
                      <Dropdown
                        options={NameOptions.map((option) => ({
                          label: option.label,
                          onClick: () =>
                            handleTableInputChange(option.id, index, "name"),
                        }))}
                        variant="secondary"
                        buttonSize="md"
                        buttonText={getNameValue(lineItem.name) || " "}
                        required={true}
                        error={!lineItem.isValid && !lineItem.name}
                        validationMessage={
                          !lineItem.name ? "Name is missing" : ""
                        }
                      />
                    </TableCell>
                  )}

                {(teamName === "Performance Marketing" ||
                  teamName !== "Performance Marketing") && (
                    <TableCell>
                      <TextArea
                        value={lineItem.description || ""}
                        onChange={(newValue) =>
                          handleTableInputChange(newValue, index, "description")
                        }
                        error={!lineItem.isValid && !lineItem.description}
                        validationMessage={lineItem.validationMessage}
                        onInput={(value) => {
                          if (value === "") {
                            setLineItems((prevItems) => {
                              const updatedItems = [...prevItems];
                              updatedItems[index].isValid = false;
                              updatedItems[index].validationMessage =
                                "Description is missing";
                              return updatedItems;
                            });
                          } else {
                            setLineItems((prevItems) => {
                              const updatedItems = [...prevItems];
                              updatedItems[index].isValid = true;
                              updatedItems[index].validationMessage = "";
                              return updatedItems;
                            });
                          }
                        }}
                      />
                    </TableCell>
                  )}

                {(teamName === "Performance Marketing" ||
                  teamName !== "Performance Marketing") && (
                    <TableCell>
                      <NumberInput
                        value={lineItem.price || ""}
                        onChange={(newValue) =>
                          handleTableInputChange(newValue, index, "price")
                        }
                        required={true}
                        error={!lineItem.isValid && !lineItem.price}
                        validationMessage={
                          !lineItem.price ? "Price is missing" : ""
                        }
                      />
                    </TableCell>
                  )}

                {teamName === "Performance Marketing" && (
                  <TableCell>
                    <Dropdown
                      options={RateTypeOptions.map((option) => ({
                        label: option.label,
                        onClick: () =>
                          handleTableInputChange(option.id, index, "rate_type"),
                      }))}
                      variant="secondary"
                      buttonSize="md"
                      buttonText={getRateTypeValue(lineItem.rate_type) || " "}
                      required={true}
                      error={!lineItem.isValid && !lineItem.rate_type}
                      validationMessage={
                        !lineItem.rate_type ? "Rate Type is missing" : ""
                      }
                    />
                  </TableCell>
                )}

                {(teamName === "Performance Marketing" ||
                  teamName !== "Performance Marketing") && (
                    <TableCell>
                      <NumberInput
                        value={lineItem.quantity || ""}
                        onChange={(newValue) =>
                          handleTableInputChange(newValue, index, "quantity")
                        }
                        required={true}
                        error={!lineItem.isValid && !lineItem.quantity}
                        validationMessage={
                          !lineItem.quantity ? "Quantity is missing" : ""
                        }
                      />
                    </TableCell>
                  )}

                {teamName === "Performance Marketing" && (
                  <TableCell>
                    <Dropdown
                      options={DeptOptions.map((option) => ({
                        label: option.label,
                        onClick: () =>
                          handleTableInputChange(
                            option.id,
                            index,
                            "department"
                          ),
                      }))}
                      variant="secondary"
                      buttonSize="md"
                      buttonText={getDeptValue(lineItem.department) || " "}
                      required={true}
                      disabled={true}
                      error={!lineItem.isValid && !lineItem.department}
                      validationMessage={
                        !lineItem.department ? "Department is missing" : ""
                      }
                    />
                  </TableCell>
                )}

                {(teamName === "Performance Marketing" ||
                  teamName !== "Performance Marketing") && (
                    <TableCell>$ {lineItem.quantity * lineItem.price}</TableCell>
                  )}

                {teamName === "Performance Marketing" && (
                  <TableCell>
                    <Input
                      value={lineItem.offer || ""}
                      onChange={(newValue) =>
                        handleTableInputChange(newValue, index, "offer")
                      }
                    // readOnly={superAdmin}
                    />
                  </TableCell>
                )}

                {teamName === "Performance Marketing" && (
                  <TableCell>
                    <Dropdown
                      options={VerticalOptions.map((option) => ({
                        label: option.label,
                        onClick: () =>
                          handleTableInputChange(option.id, index, "vertical"),
                      }))}
                      variant="secondary"
                      buttonSize="md"
                      buttonText={getVerticalValue(lineItem.vertical) || " "}
                      required
                    />
                  </TableCell>
                )}

                {teamName !== "Performance Marketing" && (
                  <TableCell>
                    <Dropdown
                      options={CountryOptions.map((option) => ({
                        label: option.label,
                        onClick: () =>
                          handleTableInputChange(option.id, index, "country"),
                      }))}
                      variant="secondary"
                      buttonSize="md"
                      buttonText={getCountryValue(lineItem.country) || " "}
                      required
                    />
                  </TableCell>
                )}

                {teamName !== "Performance Marketing" && (
                  <TableCell>
                    <Dropdown
                      options={surveyLangOptions.map((option) => ({
                        label: option.label,
                        onClick: () =>
                          handleTableInputChange(
                            option.id,
                            index,
                            "survey_language"
                          ),
                      }))}
                      variant="secondary"
                      buttonSize="md"
                      buttonText={
                        getSurveyLangValue(lineItem.survey_language) || " "
                      }
                      required
                    />
                  </TableCell>
                )}

                {teamName !== "Performance Marketing" && (
                  <TableCell>
                    <NumberInput
                      value={lineItem.loi__target_ || ""}
                      onChange={(newValue) =>
                        handleTableInputChange(newValue, index, "loi__target_")
                      }
                      required
                    />
                  </TableCell>
                )}

                {teamName !== "Performance Marketing" && (
                  <TableCell>
                    <NumberInput
                      value={lineItem.incidence____target_ || ""}
                      onChange={(newValue) =>
                        handleTableInputChange(
                          newValue,
                          index,
                          "incidence____target_"
                        )
                      }
                      required
                    />
                  </TableCell>
                )}

                {teamName !== "Performance Marketing" && (
                  <TableCell>
                    <DateInput
                      name="startDate"
                      onChange={(value) =>
                        handleDateChange(index, "start_date", value)
                      }
                      value={getDateFieldObject(lineItem.start_date)}
                      format="standard"
                    />
                  </TableCell>
                )}

                {teamName !== "Performance Marketing" && (
                  <TableCell>
                    <DateInput
                      name="endDate"
                      onChange={(value) =>
                        handleDateChange(index, "end_date", value)
                      }
                      value={getDateFieldObject(lineItem.end_date)}
                      format="standard"
                    />
                  </TableCell>
                )}

                {teamName !== "Performance Marketing" && (
                  <TableCell>
                    <Input
                      value={lineItem.currency || ""}
                      onChange={(newValue) =>
                        handleTableInputChange(newValue, index, "currency")
                      }
                    />
                  </TableCell>
                )}

                {teamName !== "Performance Marketing" && (
                  <TableCell>
                    <Input
                      value={lineItem.netsuite_invoice__ || ""}
                      onChange={(newValue) =>
                        handleTableInputChange(
                          newValue,
                          index,
                          "netsuite_invoice__"
                        )
                      }
                    />
                  </TableCell>
                )}

                {teamName !== "Performance Marketing" && (
                  <TableCell>
                    <DateInput
                      name="invoice_date"
                      onChange={(value) =>
                        handleDateChange(index, "invoice_date", value)
                      }
                      value={getDateFieldObject(lineItem.invoice_date)}
                      format="standard"
                    />
                  </TableCell>
                )}

                {teamName !== "Performance Marketing" && (
                  <TableCell>
                    <Dropdown
                      options={StatusOptions.map((option) => ({
                        label: option.label,
                        onClick: () =>
                          handleTableInputChange(option.id, index, "status"),
                      }))}
                      variant="secondary"
                      buttonSize="md"
                      buttonText={getStatusValue(lineItem.status) || " "}
                      required
                    />
                  </TableCell>
                )}

                {teamName !== "Performance Marketing" && (
                  <TableCell>
                    <Dropdown
                      options={System1PricingOptions.map((option) => ({
                        label: option.label,
                        onClick: () =>
                          handleTableInputChange(
                            option.id,
                            index,
                            "system1_pricing"
                          ),
                      }))}
                      variant="secondary"
                      buttonSize="md"
                      buttonText={
                        getSystem1PricingValue(lineItem.system1_pricing) || " "
                      }
                      required
                    />
                  </TableCell>
                )}

                {teamName !== "Performance Marketing" && (
                  <TableCell>
                    <Input
                      value={lineItem.system1_survey_path || ""}
                      onChange={(newValue) =>
                        handleTableInputChange(
                          newValue,
                          index,
                          "system1_survey_path"
                        )
                      }
                    />
                  </TableCell>
                )}

                {teamName !== "Performance Marketing" && (
                  <TableCell>
                    <TextArea
                      value={lineItem.sample_line_item_breakdown || ""}
                      onChange={(newValue) =>
                        handleTableInputChange(
                          newValue,
                          index,
                          "sample_line_item_breakdown"
                        )
                      }
                    />
                  </TableCell>
                )}

                <TableCell>
                  {isActionDisabled ? (
                    <LoadingSpinner label="Loading..." />
                  ) : (
                    <Dropdown
                      options={ActionOptions.map((option) => ({
                        label: option.label,
                        onClick: () => handleActionSelect(option.id, index),
                      }))}
                      disabled={isActionDisabled}
                      variant="secondary"
                      buttonSize="md"
                      buttonText="Action"
                    />
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <Flex direction={"row"} gap={"medium"}>
        <Button
          variant="primary"
          onClick={handleSubmitAll}
          disabled={!isDirty || isLoading}
        >
          Save
        </Button>
        <Button
          variant="danger"
          onClick={handleCancelEvent}
          disabled={isLoading}
        >
          Cancel
        </Button>
        {isLoading && <LoadingSpinner label="Loading..." />}
      </Flex>
      {error && (
        <Alert type="danger" title="Error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
    </>
  );
};

export default Extension;
