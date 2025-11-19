import MyButton from "@/components/MyButton/MyButton";
import MyModal from "@/components/MyModal/MyModal";
import MyTable from "@/components/MyTable";
import MyInput from "@/components/MyInput"; // ← تمت إضافته
import { newBrandMedicationActiveIngredient } from "@/types/model-types-constructor-new";
import React, { useState } from "react";
import { Form, Row, Col } from "rsuite";
import AddOutlineIcon from "@rsuite/icons/AddOutline";

import {
  useGetActiveIngredientsByBrandQuery,
  useCreateActiveIngredientMutation,
  useDeleteActiveIngredientMutation,
} from "@/services/setup/brandmedication/BrandMedicationActiveIngredientService";

import { useGetLovValuesByCodeQuery } from "@/services/setupService";
import { conjureValueBasedOnIDFromList, conjureValueBasedOnKeyFromList } from "@/utils";
import { MdDelete } from "react-icons/md";
import Translate from "@/components/Translate";

import { useGetActiveIngredientsQuery } from "@/services/setup/activeIngredients/activeIngredientsService";

const AddActiveIngredient = ({ open, setOpen, brandMedication }) => {
  const [BrandActive, setBrandActive] = useState({
    ...newBrandMedicationActiveIngredient,
  });

  const { data: BrandActiveIngrediant } = useGetActiveIngredientsByBrandQuery(
    brandMedication?.id,
    { skip: !brandMedication?.id }
  );
    const [paginationParams, setPaginationParams] = useState({
      page: 0,
      size: 5,
      sort: "id,asc",
      timestamp: Date.now(),
    });
  
  const {data:activeIngredientList}=useGetActiveIngredientsQuery(paginationParams)
  const { data: unitLov } = useGetLovValuesByCodeQuery("VALUE_UNIT");

  const [createActive] = useCreateActiveIngredientMutation();
  const [deleteActive] = useDeleteActiveIngredientMutation();

  const isSelected = (rowData) =>
    rowData?.id === BrandActive?.id ? "selected-row" : "";

  // Save (Create)
const handleSave = async () => {
  try {
    await createActive({
      ...BrandActive,
      brandId: brandMedication?.id
    }).unwrap();

    setBrandActive({ ...newBrandMedicationActiveIngredient });

  } catch (error) {
    console.error("❌ Error while saving Active Ingredient:", error);
  }
};

const handleDelete = async (id) => {
  try {
    await deleteActive(id).unwrap();  
    setBrandActive({ ...newBrandMedicationActiveIngredient });

  } catch (error) {
    console.error("❌ Delete Error:", error);
  }
};

  // Icons
  const iconsForActions = (rowData) => (
    <div className="container-of-icons">
      <MdDelete
        className="icons-style"
        size={24}
        fill="var(--primary-pink)"
        title="Delete"
         onClick={() => handleDelete(rowData.id)}
      />
    </div>
  );

  // Table columns
  const tableActiveIngredientColumns = [
    {
      key: "activeIngredientId",
      title: <Translate>Active Ingredient</Translate>,
      flexGrow: 3,
    render: (rowData) => (
        <span>
         
          {conjureValueBasedOnIDFromList(
            activeIngredientList?.data ?? [],
            rowData.activeIngredientId,
            "name"
          )}
        </span>
      ),
    },
    {
      key: "strength",
      title: <Translate>Strength</Translate>,
      flexGrow: 3,
      render: (rowData) => (
        <span>
          {rowData.strength}{" "}
          {conjureValueBasedOnKeyFromList(
            unitLov?.object ?? [],
            rowData.unit,
            "lovDisplayVale"
          )}
        </span>
      ),
    },
    {
      key: "icons",
      title: "",
      flexGrow: 1,
      render: (rowData) => iconsForActions(rowData),
    },
  ];

  return (
    <MyModal
      title={"Add Active Ingredient"}
      open={open}
      setOpen={setOpen}
      hideActionBtn={true}
      content={
        <>
          <Form fluid>

            
            <Row>
              <Col md={8}>
                <MyInput
                  required
                  width="100%"
                  fieldType="select"
                  selectDataLabel="name"
                  selectDataValue="id"
                  selectData={activeIngredientList?.data??[]}
                  fieldLabel="Active Ingredient ID"
                  fieldName="activeIngredientId"
                  record={BrandActive}
                  setRecord={setBrandActive}
                />
              </Col>

              <Col md={8}>
                <MyInput
                  required
                  width="100%"
                  fieldLabel="Strength"
                  fieldName="strength"
                  fieldType="number"
                  record={BrandActive}
                  setRecord={setBrandActive}
                />
              </Col>

              <Col md={8}>
                <MyInput
                  required
                  width="100%"
                  fieldLabel="Unit"
                  fieldName="unit"
                  fieldType="select"
                  selectData={unitLov?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={BrandActive}
                  setRecord={setBrandActive}
                />
              </Col>
            </Row>

            <div style={{ marginTop: "16px" }}>
              <MyButton
                color="var(--primary-green)"
                width="120px"
                onClick={handleSave}
              >
                Save
              </MyButton>
            </div>

         
            <MyTable
              height={450}
              data={BrandActiveIngrediant ?? []}
              columns={tableActiveIngredientColumns}
              rowClassName={isSelected}
              onRowClick={(rowData) => setBrandActive(rowData)}
            />
          </Form>
        </>
      }
      size="70vh"
    />
  );
};

export default AddActiveIngredient;
