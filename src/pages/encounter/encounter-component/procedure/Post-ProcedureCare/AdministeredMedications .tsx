import React, { useState } from "react";
import { useAppDispatch } from "@/hooks";
import { notify } from "@/utils/uiReducerActions";
import { initialListRequest, ListRequest } from "@/types/types";
import MyInput from "@/components/MyInput";
import MyButton from "@/components/MyButton/MyButton";
import MyTable from "@/components/MyTable";
import Translate from "@/components/Translate";
import { faPenToSquare } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Col, Divider, Form, Input, Row, SelectPicker, Text } from "rsuite";
import { useGetLovValuesByCodeQuery } from "@/services/setupService";
import { useGetActiveIngredientQuery } from "@/services/medicationsSetupService";

const GenericAdministeredMedications = ({
  parentKey,
  filterFieldName,
  medicationService,
  newMedicationTemplate,
  title,
  ...props
}) => {
  const dispatch = useAppDispatch();
  const [activeRowKey, setActiveRowKey] = useState(null);
  const [selectedIngredientList, setSelectedIngredientList] = useState<any>([]);
  const [medication, setMedication] = useState({
    ...newMedicationTemplate,
    [filterFieldName]: parentKey
  });

  const { data: unitLovQueryResponse } = useGetLovValuesByCodeQuery("UOM");
  const { data: activeIngredients } =useGetActiveIngredientQuery({...initialListRequest,pageSize:1000});
    const toSnakeCase = (str: string) =>
  str.replace(/([A-Z])/g, '_$1').toLowerCase();
   
  const [listRequest] = useState<ListRequest>({
    ...initialListRequest,
    filters: [
      {
        fieldName:toSnakeCase(filterFieldName)|| "",
        operator: "match",
        value: parentKey
      }
    ]
  });

  const { data: medicationsList, refetch } = medicationService.useGetQuery(listRequest, {
    skip: !parentKey
  });

  const [saveMedication] = medicationService.useSaveMutation();

  const isSelected = (rowData) =>
    rowData?.key === medication?.key ? "selected-row" : "";

  const handleSave = async () => {
    try {
      const selectedKeys = selectedIngredientList?.key;
      if (!Array.isArray(selectedKeys)) return;

      const promises = selectedKeys.map((key) => {
        return saveMedication({
          ...newMedicationTemplate,
          [filterFieldName]: parentKey,
          activeIngredientKey: key
        }).unwrap();
      });

      await Promise.all(promises);
      dispatch(notify({ msg: "Saved Successfully", sev: "success" }));
      refetch();
      setSelectedIngredientList([]);
    } catch (error) {
      console.error("Error saving medications:", error);
      dispatch(notify({ msg: "Failed to save medications", sev: "error" }));
    }
  };

  const columns = [
    {
      key: "name",
      title: <Translate>Active Ingredient</Translate>,
      render: (rowData) =>{
  
         const name =activeIngredients?.object.find(item=>item.key===rowData.activeIngredientKey)?.name
         return name;
      }
      //  <Text>{rowData?.activeIngredient?.name}</Text>
    },
    {
      key: "dose",
      title: <Translate>Dose</Translate>,
      render: (rowData) =>
        activeRowKey === rowData.key ? (
          <Input
            type="number"
            style={{ width: 100 }}
            onChange={(value) =>
              setMedication({ ...medication, dose: Number(value) })
            }
            onPressEnter={async () => {
              try {
                await saveMedication({ ...medication ,filterFieldName:parentKey}).unwrap();
                refetch();
                dispatch(notify({ msg: "Saved Successfully", sev: "success" }));
                setActiveRowKey(null);
              } catch {
                dispatch(notify({ msg: "Failed to save", sev: "error" }));
              }
            }}
          />
        ) : (
          <span>
            <FontAwesomeIcon
              icon={faPenToSquare}
              onClick={() => setActiveRowKey(rowData.key)}
              style={{ marginRight: "8px", cursor: "pointer" }}
            />
            {rowData?.dose}
          </span>
        )
    },
    {
      key: "route",
      title: <Translate>Unit</Translate>,
      render: (rowData) =>
        activeRowKey === rowData.key ? (
          <SelectPicker
            data={unitLovQueryResponse?.object ?? []}
            value={rowData.unitLkey}
            valueKey="key"
            labelKey="lovDisplayVale"
            onChange={async (value) => {
              await saveMedication({ ...rowData, unitLkey: value }).unwrap();
              refetch();
              dispatch(notify({ msg: "Saved Successfully", sev: "success" }));
              setActiveRowKey(null);
            }}
            style={{ width: 100 }}
          />
        ) : (
          <span>
            <FontAwesomeIcon
              icon={faPenToSquare}
              onClick={() => setActiveRowKey(rowData.key)}
              style={{ marginRight: "8px", cursor: "pointer" }}
            />
            {rowData?.unitLvalue?.lovDisplayVale}
          </span>
        )
    }
  ];

  return (
    <div style={{ ...((props?.noBorder) && { borderRadius: 'none',boxShadow: "none" })}} className="container-form">
      <div className="title-div">
        <Text>{title}</Text>
      </div>
      <Divider
      //  style={{ ...((props?.noBorder) && { display: 'none'})}}
        />
      <Row>
        <Col md={24}>
          <Row className="rows-gap">
            <Col md={10}>
              <Form fluid>
                <MyInput
                  width="100%"
                  menuMaxHeight="15vh"
                  placeholder="Select Ingredient"
                  showLabel={false}
                  selectData={activeIngredients?.object ?? []}
                  fieldType="multyPicker"
                  selectDataLabel="name"
                  selectDataValue="key"
                  fieldName="key"
                  record={selectedIngredientList}
                  setRecord={setSelectedIngredientList}
                />
              </Form>
            </Col>
            <Col md={11}></Col>
            <Col md={3}>
              <MyButton onClick={handleSave}>Save</MyButton>
            </Col>
          </Row>
          <Row>
            <Col md={24}>
              <MyTable
              height={200}
                data={medicationsList?.object || []}
                columns={columns}
                onRowClick={(rowData) => {
                  setMedication(rowData);
                }}
                rowClassName={isSelected}
              />
            </Col>
          </Row>
        </Col>
      </Row>
    </div>
  );
};

export default GenericAdministeredMedications;
