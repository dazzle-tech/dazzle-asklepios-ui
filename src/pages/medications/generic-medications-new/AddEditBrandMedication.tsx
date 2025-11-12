import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import { useAppDispatch } from '@/hooks';
import AddEditUom from '@/pages/setup/uom-group/AddEditUom';
import {
  useGetLovValuesByCodeQuery,
  useGetUomGroupsQuery,
  useGetUomGroupsUnitsQuery
} from '@/services/setupService';
import {
  ApUomGroups
} from '@/types/model-types';
import {
  newApUomGroups
} from '@/types/model-types-constructor';
import { initialListRequest, ListRequest } from '@/types/types';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import React, { useEffect, useState } from 'react';
import { FaUnity } from 'react-icons/fa6';
import { MdOutlineMedicationLiquid } from 'react-icons/md';
import { Col, Form, Row } from 'rsuite';
import './styles.less';
const AddEditBrandMedication = ({
  open,
  setOpen,
  brandMedication,
  setBrandMedication,
  handleSave
}) => {
  const dispatch = useAppDispatch();


 const [rout,setRout]=useState({roa:[]})

  const [uomGroupOpen, setUomGroupOpen] = useState(false);
  const [uomGroup, setUomGroup] = useState<ApUomGroups>({ ...newApUomGroups });

  const [width, setWidth] = useState<number>(window.innerWidth);

  const { data: brandMedicationLovQueryResponse } =
    useGetLovValuesByCodeQuery('GEN_MED_MANUFACTUR');
  const { data: categoryCostLovQueryResponse } = useGetLovValuesByCodeQuery('MED_COST_CATEGORIES');
  // Fetch doseage Form Lov  list response
  const { data: doseageFormLovQueryResponse } = useGetLovValuesByCodeQuery('DOSAGE_FORMS');
  // Fetch med Rout Lov  list response
  const { data: medRoutLovQueryResponse } = useGetLovValuesByCodeQuery('MED_ROA');
  // Fetch unit Lov list response
  const  {data:unitListResponse}=useGetLovValuesByCodeQuery('TIME_UNITS')


  const [UOMListRequest, setUOMListRequest] = useState<ListRequest>({
    ...initialListRequest
  });
  const {
    data: uomGroupsListResponse,
    refetch: refetchUomGroups,
    isFetching
  } = useGetUomGroupsQuery(UOMListRequest);
  const [unitListRequest, setUnitListRequest] = useState<ListRequest>({
    ...initialListRequest,
    filters: [
      {
        fieldName: 'deleted_at',
        operator: 'isNull',
        value: undefined
      },
      {
        fieldName: 'uom_group_key',
        operator: 'match',
        value: brandMedication?.uomGroupKey
      }
    ]
  });
  useEffect(() => {
    setUnitListRequest({
      ...initialListRequest,
      filters: [
        {
          fieldName: 'deleted_at',
          operator: 'isNull',
          value: undefined
        },
        {
          fieldName: 'uom_group_key',
          operator: 'match',
          value: brandMedication?.uomGroupKey
        }
      ]
    });
  }, [brandMedication?.uomGroupKey]);
 
useEffect(() => {
  if (rout?.roa?.length) {
    const joined = rout.roa.join(',');
    if (brandMedication.roa !== joined) {
      setBrandMedication(prev => ({ ...prev, roa: joined }));
    }
  } else if (brandMedication.roa !== '') {
    setBrandMedication(prev => ({ ...prev, roa: '' }));
  }
}, [rout]);

useEffect(() => {
  if (typeof brandMedication.roa === "string") {
    const arr = brandMedication.roa ? brandMedication.roa.split(',').map(v => v.trim()) : [];
    if (JSON.stringify(rout.roa) !== JSON.stringify(arr)) {
      setRout({ roa: arr });
    }
  } else if (Array.isArray(brandMedication.roa)) {
    if (JSON.stringify(rout.roa) !== JSON.stringify(brandMedication.roa)) {
      setRout({ roa: brandMedication.roa });
    }
  }
}, [brandMedication.roa]);


  const { data: uomGroupsUnitsListResponse, refetch: refetchUomGroupsUnit } =
    useGetUomGroupsUnitsQuery(unitListRequest);







  // Main modal content
  const conjureFormContent = (stepNumber = 0) => {
    switch (stepNumber) {
      case 0:
        return (
          <Form fluid>
            <Row>
             
              <Col md={12}>
                <MyInput
                  required
                  width="100%"
                  fieldLabel="Brand Name"
                  fieldName="name"
                  record={brandMedication}
                  setRecord={setBrandMedication}
                />
              </Col>
                 <Col md={12}>
                <MyInput
                  required
                  width="100%"
                  fieldName="dosageForm"
                  fieldType="select"
                  selectData={doseageFormLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={brandMedication}
                  setRecord={setBrandMedication}
                  menuMaxHeight={250}
                />
              </Col>
            </Row>
            <br />
            <Row>
              <Col md={12}>
                <MyInput
                  width="100%"
                  fieldName="manufacturer"
                  fieldType="select"
                  selectData={brandMedicationLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={brandMedication}
                  setRecord={setBrandMedication}
                  menuMaxHeight={250}
                />
              </Col>
              <Col md={12}>
                <MyInput
                  width="100%"
                  fieldLabel="Rout"
                  selectData={medRoutLovQueryResponse?.object ?? []}
                  fieldType="checkPicker"
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  fieldName="roa"
                  record={rout}
                  setRecord={setRout}
                />
              </Col>
             
           
            </Row>
           
            <br />
            <MyInput
              width="100%"
              fieldName="usageInstructions"
              fieldType="textarea"
              record={brandMedication}
              setRecord={setBrandMedication}
            />
            <MyInput
              width="100%"
              fieldName="storageRequirements"
              fieldType="textarea"
              record={brandMedication}
              setRecord={setBrandMedication}
            />
            <Row>
              <Col md={12}>
                <MyInput
                  width="100%"
                  fieldName="expiresAfterOpening"
                  fieldType="checkbox"
                  record={brandMedication}
                  setRecord={setBrandMedication}
                />
              </Col>
              {brandMedication?.expiresAfterOpening && (
                <>
                <Col md={6}>
                  <MyInput
                    width="100%"
                    fieldLabel='Value'
                    fieldName="expiresAfterOpeningValue"
                    fieldType="number"
                    record={brandMedication}
                    setRecord={setBrandMedication}
                  />
                </Col>
                <Col md={6}>
                 <MyInput
                  width="100%"
                  fieldLabel='Unit'
                  fieldName="expiresAfterOpeningUnit"
                  fieldType="select"
                  selectData={unitListResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={brandMedication}
                  setRecord={setBrandMedication}
                  menuMaxHeight={250}
                />
                </Col></>
              )}
            </Row>
            <br />
            <Row>
              <Col md={8}>
                <MyInput
                  fieldName="useSinglePatient"
                  fieldType="checkbox"
                  record={brandMedication}
                  setRecord={setBrandMedication}
                />
              </Col>
              <Col md={8}>
                <MyInput
                  fieldName="highCostMedication"
                  fieldType="checkbox"
                  record={brandMedication}
                  setRecord={setBrandMedication}
                />
              </Col>
               <Col md={8}>
                <MyInput
                  width="100%"
                  fieldName="costCategory"
                  fieldType="select"
                  selectData={categoryCostLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={brandMedication}
                  setRecord={setBrandMedication}
                  menuMaxHeight={250}
                />
              </Col>
            </Row>
           
          </Form>
        );
      case 1:
        return (
          <Form fluid>
            <MyInput
            required
              width="100%"
              fieldLabel="UOM Group"
              fieldName="uomGroupKey"
              fieldType="select"
              selectData={uomGroupsListResponse?.object ?? []}
              selectDataLabel="name"
              selectDataValue="key"
              record={brandMedication}
              setRecord={setBrandMedication}
              searchable={true}
            />
            <MyInput
            required
              width="100%"
              fieldLabel="Base UOM"
              fieldName="baseUomKey"
              fieldType="select"
              selectData={uomGroupsUnitsListResponse?.object ?? []}
              selectDataLabel="units"
              selectDataValue="key"
              record={brandMedication}
              setRecord={setBrandMedication}
            />
            <div className="container-of-add-new-button">
              <MyButton
                prefixIcon={() => <AddOutlineIcon />}
                color="var(--deep-blue)"
                onClick={() => {
                  setUomGroupOpen(true);
                }}
                width="109px"
              >
                Add New UOM
              </MyButton>
            </div>
          </Form>
        );
      // case 2:
      //   return (
      //     <Form>
      //       <div className="container-of-add-new-button">
      //         <MyButton
      //           prefixIcon={() => <AddOutlineIcon />}
      //           color="var(--deep-blue)"
      //           onClick={() => {
      //             setOpenAddEditActiveIngredientsPopup(true);
      //             setChildStep(0);
      //             setGenericActive({
      //               ...newApbrandMedicationActiveIngredient
      //             });
      //           }}
      //           width="109px"
      //         >
      //           Add New
      //         </MyButton>
      //       </div>
      //       <MyTable
      //         height={450}
      //         data={brandMedicationActiveIngredientListResponseData?.object}
      //         columns={tableActiveIngredientColumns}
      //         rowClassName={isSelectedGenericActive}
      //         onRowClick={rowData => {
      //           setGenericActive(rowData);
      //         }}
      //       />
      //     </Form>
      //   );
      // case 3:
      //   return (
      //     <div>
      //       <div className="container-of-header-brand-medication">
      //         <Form layout="inline" fluid>
      //           <MyInput
      //             showLabel={false}
      //             width={250}
      //             fieldLabel="Medication Name"
      //             selectData={modifiedMedicationList}
      //             fieldType="select"
      //             selectDataLabel="customLabel"
      //             selectDataValue="key"
      //             fieldName="key"
      //             record={selectedGeneric}
      //             setRecord={setSelectedGeneric}
      //             menuMaxHeight={250}
      //             placeholder="select Medication Name"
      //           />
      //         </Form>
      //         <MyButton
      //           prefixIcon={() => <AddOutlineIcon />}
      //           color="var(--deep-blue)"
      //           onClick={handleSaveSubstitues}
      //           width="100px"
      //         >
      //           Add New
      //         </MyButton>
      //       </div>
      //       <MyTable
      //         height={450}
      //         data={lisOfLinkedBrand?.object ?? []}
      //         loading={isFetchingBrand}
      //         columns={tableSubstitutesColumns}
      //         onRowClick={rowData => {
      //           setBrand(rowData);
      //         }}
      //         rowClassName={isSelectedBrand}
      //       />
      //     </div>
      //   );

    }
  };
  // // child modal content
  // const conjureFormChildContent = stepNumber => {
  //   switch (stepNumber) {
  //     case 0:
  //       return (
  //         <Form fluid>
  //           <MyInput
  //             placeholder="Select A.I"
  //             selectDataValue="key"
  //             selectDataLabel="name"
  //             selectData={activeIngredientListResponseData?.object ?? []}
  //             fieldName="activeIngredientKey"
  //             fieldType="select"
  //             record={genericActive}
  //             setRecord={setGenericActive}
  //             searchable={false}
  //             menuMaxHeight={200}
  //             width="100%"
  //           />
  //           <MyInput
  //             fieldType="number"
  //             fieldName="strength"
  //             record={genericActive}
  //             setRecord={setGenericActive}
  //             width="100%"
  //           />
  //           <MyInput
  //             fieldType="select"
  //             fieldName="unit"
  //             record={genericActive}
  //             setRecord={setGenericActive}
  //             selectDataValue="key"
  //             selectDataLabel="lovDisplayVale"
  //             placeholder="Unit"
  //             selectData={UOMLovResponseData?.object ?? []}
  //             menuMaxHeight={200}
  //             width="100%"
  //           />
  //         </Form>
  //       );
  //   }
  // };
  return (
    <>
      <MyModal
        open={open}
        setOpen={setOpen}
        title={brandMedication?.id ? 'Edit Brand Medication' : 'New Brand Medication'}
        actionButtonFunction={handleSave}
        content={conjureFormContent}
         steps={[
          {
            title: 'Information',
            icon: <MdOutlineMedicationLiquid />,


          },
          {
            title: 'UOM',
            icon: <FaUnity />,
           
          }

        ]}

      />
 
      <AddEditUom
        open={uomGroupOpen}
        setOpen={setUomGroupOpen}
        uom={uomGroup}
        setUom={setUomGroup}
        width={width}
      />
    </>
  );
};
export default AddEditBrandMedication;
