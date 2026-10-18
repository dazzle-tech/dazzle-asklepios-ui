import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import BillingRuleSelect from '@/components/BillingRuleSelect/BillingRuleSelect';
import MyModal from '@/components/MyModal/MyModal';
import Translate from '@/components/Translate';
import SectionContainer from '@/components/SectionsoContainer';
import { useAppDispatch } from '@/hooks';
import AddEditUom from '@/pages/setup/uom-group/AddEditUom';
import {
  useGetLovValuesByCodeQuery,
  useGetUomGroupsQuery,
  useGetUomGroupsUnitsQuery
} from '@/services/setupService';
import { useGetAllUOMGroupsQuery, useGetAllUnitsByGroupIdQuery } from '@/services/setup/uom-group/uomGroupService';
import { useGetAllFacilitiesQuery } from '@/services/security/facilityService';
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
import { Form } from 'rsuite';
import './styles.less';
import { useEnumOptions } from '@/services/enumsApi';
import { uomGroup } from '@/types/model-types-new';
import { newUOMGroup } from '@/types/model-types-constructor-new';
const AddEditBrandMedication = ({
  open,
  setOpen,
  brandMedication,
  setBrandMedication,
  handleSave
}) => {
  const dispatch = useAppDispatch();


  const [rout, setRout] = useState({ roa: [] })

  const [uomGroupOpen, setUomGroupOpen] = useState(false);
  const [uomGroup, setUomGroup] = useState<uomGroup>({ ...newUOMGroup });

  const [width, setWidth] = useState<number>(window.innerWidth);

  const { data: brandMedicationLovQueryResponse } =
    useGetLovValuesByCodeQuery('GEN_MED_MANUFACTUR');
  const { data: categoryCostLovQueryResponse } = useGetLovValuesByCodeQuery('MED_COST_CATEGORIES');
  // Fetch doseage Form Lov  list response
  const { data: doseageFormLovQueryResponse } = useGetLovValuesByCodeQuery('DOSAGE_FORMS');
  // Fetch med Rout Lov  list response
  const roaEnumOptions = useEnumOptions('MedRoa');
  // Fetch unit Lov list response

  const units = useEnumOptions("Unit")


  const {
    data: uomGroupsListResponse,
    refetch: refetchUomGroups,
    isFetching
  } = useGetAllUOMGroupsQuery({ name: '' });

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
    useGetAllUnitsByGroupIdQuery(brandMedication?.uomGroupId);

  const medDistributeAreaOptions = useEnumOptions('MedDistributeArea');

  // Facilities (the brand medication currency is the facility's default currency)
  const { data: facilitiesResponse } = useGetAllFacilitiesQuery({});
  const facilities = facilitiesResponse ?? [];

  const handleFacilityChange = (updated: any) => {
    const facility = facilities.find((f: any) => f.id === updated?.facilityId);
    setBrandMedication({
      ...updated,
      currency: facility?.defaultCurrency ?? ''
    });
  };

  // The saved currency is shown as is; if it differs from the facility currency the user is warned
  // (saving sets it back to the facility currency in the backend)
  const selectedFacilityCurrency = facilities.find(
    (f: any) => f.id === brandMedication?.facilityId
  )?.defaultCurrency;
  const currencyMismatch =
    !!brandMedication?.id &&
    !!selectedFacilityCurrency &&
    !!brandMedication?.currency &&
    brandMedication.currency !== selectedFacilityCurrency;

  // Units belong to a UOM group, so changing the group clears Base UOM and Price Base Unit
  const handleUomGroupChange = (updated: any) => {
    if (updated?.uomGroupId !== brandMedication?.uomGroupId) {
      setBrandMedication({ ...updated, uomGroupUnitId: null, priceBaseUomId: null });
    } else {
      setBrandMedication(updated);
    }
  };


  // Main modal content
  const conjureFormContent = (stepNumber = 0) => {
    switch (stepNumber) {
      case 0:
        return (
          <Form fluid className="brand-medication-form">
            <SectionContainer
              title="Basic Information"
              content={
                <div className="brand-medication-grid">
                  <MyInput
                    required
                    width="100%"
                    fieldLabel="Brand Name"
                    fieldName="name"
                    record={brandMedication}
                    setRecord={setBrandMedication}
                  />
                  <MyInput
                    required
                    width="100%"
                    fieldLabel="Brand Code"
                    fieldName="code"
                    record={brandMedication}
                    setRecord={setBrandMedication}
                  />
                  <MyInput
                    required
                    width="100%"
                    fieldName="dosageForm"
                    fieldType="select"
                    selectData={doseageFormLovQueryResponse?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    disableByField="isValid"
                    selectDataValue="key"
                    record={brandMedication}
                    setRecord={setBrandMedication}
                    menuMaxHeight={250}
                  />
                  <MyInput
                    width="100%"
                    fieldName="manufacturer"
                    fieldType="select"
                    selectData={brandMedicationLovQueryResponse?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    disableByField="isValid"
                    selectDataValue="key"
                    record={brandMedication}
                    setRecord={setBrandMedication}
                    menuMaxHeight={250}
                  />
                  {/* Next to Manufacturer: whether the medication is manufactured locally */}
                  <MyInput
                    fieldLabel="Local Market"
                    fieldName="localMarket"
                    fieldType="checkbox"
                    record={brandMedication}
                    setRecord={setBrandMedication}
                  />
                  <MyInput
                    width="100%"
                    fieldLabel="Rout"
                    fieldType="checkPicker"
                    fieldName="roa"
                    selectData={roaEnumOptions ?? []}
                    selectDataLabel="label"
                    selectDataValue="value"
                    record={rout}
                    setRecord={setRout}
                  />
                </div>
              }
            />

            <SectionContainer
              title="Facility, Pricing & Distribution"
              content={
                <div className="brand-medication-grid">
                  <MyInput
                    required
                    width="100%"
                    fieldLabel="Facility"
                    fieldType="select"
                    fieldName="facilityId"
                    selectData={facilities}
                    selectDataLabel="name"
                    selectDataValue="id"
                    record={brandMedication}
                    setRecord={handleFacilityChange}
                    searchable={true}
                  />
                  <MyInput
                    required
                    width="100%"
                    fieldLabel="Price"
                    fieldName="price"
                    fieldType="number"
                    record={brandMedication}
                    setRecord={setBrandMedication}
                  />
                  {/* Read-only: shows the saved value as is (text, so any value is visible) */}
                  <div>
                    <MyInput
                      width="100%"
                      fieldLabel="Currency"
                      fieldName="currency"
                      record={brandMedication}
                      setRecord={setBrandMedication}
                      disabled
                    />
                    {currencyMismatch && (
                      <div className="brand-medication-currency-warning">
                        <Translate>Saved currency</Translate> ({brandMedication.currency}){' '}
                        <Translate>differs from the facility currency</Translate> ({selectedFacilityCurrency}).{' '}
                        <Translate>Saving will set it to the facility currency.</Translate>
                      </div>
                    )}
                  </div>
                  <BillingRuleSelect
                    billingItemType="MEDICATION"
                    record={brandMedication}
                    setRecord={setBrandMedication}
                  />
                  <MyInput
                    width="100%"
                    fieldName="costCategory"
                    fieldType="select"
                    selectData={categoryCostLovQueryResponse?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    disableByField="isValid"
                    selectDataValue="key"
                    record={brandMedication}
                    setRecord={setBrandMedication}
                    menuMaxHeight={250}
                  />
                  <MyInput
                    width="100%"
                    fieldLabel="Med Distribute Area"
                    fieldType="checkPicker"
                    fieldName="medDistributeArea"
                    selectData={medDistributeAreaOptions ?? []}
                    selectDataLabel="label"
                    selectDataValue="value"
                    record={brandMedication}
                    setRecord={setBrandMedication}
                    searchable={false}
                  />
                </div>
              }
            />

            <SectionContainer
              title="Codes"
              content={
                <div className="brand-medication-grid brand-medication-grid-4">
                  <MyInput
                    width="100%"
                    fieldLabel="Registration Number"
                    fieldName="registrationNumber"
                    record={brandMedication}
                    setRecord={setBrandMedication}
                  />
                  <MyInput
                    width="100%"
                    fieldLabel="Integration Code"
                    fieldName="integrationCode"
                    record={brandMedication}
                    setRecord={setBrandMedication}
                  />
                  <MyInput
                    width="100%"
                    fieldLabel="GTIN Code"
                    fieldName="gtinCode"
                    record={brandMedication}
                    setRecord={setBrandMedication}
                  />
                  <MyInput
                    width="100%"
                    fieldLabel="Description Code"
                    fieldName="descriptionCode"
                    record={brandMedication}
                    setRecord={setBrandMedication}
                  />
                </div>
              }
            />

            <SectionContainer
              title="Options"
              content={
                <>
                  <div className="brand-medication-toggles">
                    <MyInput
                      fieldName="useSinglePatient"
                      fieldType="checkbox"
                      record={brandMedication}
                      setRecord={setBrandMedication}
                    />
                    <MyInput
                      fieldName="highCostMedication"
                      fieldType="checkbox"
                      record={brandMedication}
                      setRecord={setBrandMedication}
                    />
                    <MyInput
                      fieldName="expiresAfterOpening"
                      fieldType="checkbox"
                      record={brandMedication}
                      setRecord={setBrandMedication}
                    />
                  </div>
                  {brandMedication?.expiresAfterOpening && (
                    <div className="brand-medication-grid">
                      <MyInput
                        width="100%"
                        fieldLabel="Expires After Opening Value"
                        fieldName="expiresAfterOpeningValue"
                        fieldType="number"
                        record={brandMedication}
                        setRecord={setBrandMedication}
                      />
                      <MyInput
                        width="100%"
                        fieldLabel="Expires After Opening Unit"
                        fieldName="expiresAfterOpeningUnit"
                        fieldType="select"
                        selectData={units ?? []}
                        selectDataLabel="label"
                        selectDataValue="value"
                        record={brandMedication}
                        setRecord={setBrandMedication}
                        menuMaxHeight={250}
                      />
                    </div>
                  )}
                </>
              }
            />

            <SectionContainer
              title="Usage & Storage"
              content={
                <div className="brand-medication-grid brand-medication-grid-2">
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
                </div>
              }
            />
          </Form>
        );
      case 1:
        return (
          <Form fluid>
            <MyInput
              required
              width="100%"
              fieldLabel="UOM Group"
              fieldName="uomGroupId"
              fieldType="select"
              selectData={uomGroupsListResponse?.data ?? []}
              selectDataLabel="name"
              selectDataValue="id"
              record={brandMedication}
              setRecord={handleUomGroupChange}
              searchable={true}
            />
            <MyInput
              required
              width="100%"
              fieldLabel="Base UOM"
              fieldName="uomGroupUnitId"
              fieldType="select"
              selectData={uomGroupsUnitsListResponse ?? []}
              selectDataLabel="uom"
              selectDataValue="id"
              record={brandMedication}
              setRecord={setBrandMedication}
            />
            {/* Same list as Base UOM: the units of the selected UOM group */}
            <MyInput
              required
              width="100%"
              fieldLabel="Price Base Unit"
              fieldName="priceBaseUomId"
              fieldType="select"
              selectData={uomGroupsUnitsListResponse ?? []}
              selectDataLabel="uom"
              selectDataValue="id"
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


    }
  };

  // Direction handling for RTL/LTR
  const direction = localStorage.getItem('direction') || 'LTR';
  const isRTL = direction === 'RTL';

  const dir = isRTL ? 'rtl' : 'ltr';


  return (
    <>
      <MyModal
        open={open}
        setOpen={setOpen}
        title={brandMedication?.id ? 'Edit Brand Medication' : 'New Brand Medication'}
        size="70vw"
        actionButtonFunction={handleSave}
        content={(stepNumber) => (<div dir={dir}>{conjureFormContent(stepNumber)}</div>)}
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
