import React, { useEffect, useState } from 'react';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import './styles.less';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { MdOutlineMedicationLiquid } from 'react-icons/md';
import { GiMedicines } from 'react-icons/gi';
import { HiOutlineSwitchHorizontal } from 'react-icons/hi';
import MyButton from '@/components/MyButton/MyButton';
import {
  useGetActiveIngredientQuery,
  useGetGenericMedicationActiveIngredientQuery,
  useGetGenericMedicationWithActiveIngredientQuery,
  useGetLinkedBrandQuery,
  useSaveGenericMedicationActiveIngredientMutation,
  useSaveLinkedBrandMedicationMutation
} from '@/services/medicationsSetupService';
import { notify } from '@/utils/uiReducerActions';
import { useAppDispatch } from '@/hooks';
import Translate from '@/components/Translate';
import { conjureValueBasedOnKeyFromList } from '@/utils';
import MyTable from '@/components/MyTable';
import { initialListRequest, ListRequest } from '@/types/types';
import ChildModal from '@/components/ChildModal';
import {
  newApBrandMedicationSubstitutes,
  newApGenericMedication,
  newApGenericMedicationActiveIngredient
} from '@/types/model-types-constructor';
import { ApGenericMedication, ApGenericMedicationActiveIngredient } from '@/types/model-types';
import { FaUndo } from 'react-icons/fa';
import { MdDelete } from 'react-icons/md';
import { isEmpty } from 'lodash';
const AddEditBrandMedication = ({
  open,
  setOpen,
  genericMedication,
  setGenericMedication,
  handleSave
}) => {
  const dispatch = useAppDispatch();
  const [activeIngredientsListRequest] = useState<ListRequest>({
    ...initialListRequest
  });
  const [selectedGeneric, setSelectedGeneric] = useState({
    key: ''
  });
  const [modifiedMedicationList, setModifiedMedicationList] = useState();
  const [openAddEditActiveIngredientsPopup, setOpenAddEditActiveIngredientsPopup] =
    useState<boolean>(false);
  const [listRequest, setListRequest] = useState({
    ...initialListRequest,
    pageSize: 100,
    timestamp: new Date().getMilliseconds(),
    sortBy: 'createdAt',
    sortType: 'desc',
    filters: [
      {
        fieldName: 'deleted_at',
        operator: 'isNull',
        value: undefined
      },
      {
        fieldName: 'generic_medication_key',
        operator: 'match',
        value: genericMedication.key || undefined
      }
    ]
  });
  const [brand, setBrand] = useState<ApGenericMedication>({ ...newApGenericMedication });
  const [genericActive, setGenericActive] = useState<ApGenericMedicationActiveIngredient>({
    ...newApGenericMedicationActiveIngredient
  });
  // Fetch generic Medication  list response
  const { data: genericMedicationListResponse } =
    useGetGenericMedicationWithActiveIngredientQuery('');
  // Fetch Generic Medication Lov  list response
  const { data: GenericMedicationLovQueryResponse } =
    useGetLovValuesByCodeQuery('GEN_MED_MANUFACTUR');
  // Fetch doseage Form Lov  list response
  const { data: doseageFormLovQueryResponse } = useGetLovValuesByCodeQuery('DOSAGE_FORMS');
  // Fetch med Rout Lov  list response
  const { data: medRoutLovQueryResponse } = useGetLovValuesByCodeQuery('MED_ROA');
  // Fetch UOM Lov list response
  const { data: UOMLovResponseData } = useGetLovValuesByCodeQuery('VALUE_UNIT');
  // Fetch Linked Brand  list response
  const {
    data: lisOfLinkedBrand,
    refetch: fetchB,
    isFetching: isFetchingBrand
  } = useGetLinkedBrandQuery(genericMedication?.key, { skip: genericMedication?.key == null });
  // Save Generic Medication
  const [saveGenericMedicationActiveIngredient, saveGenericMedicationActiveIngredientMutation] =
    useSaveGenericMedicationActiveIngredientMutation();
  // Fetch active Ingredient  list response
  const { data: activeIngredientListResponseData } = useGetActiveIngredientQuery(
    activeIngredientsListRequest
  );
  // save Link Brand Medication
  const [saveLinkBrandMedication] = useSaveLinkedBrandMedicationMutation();
  // Fetch generic Medication Active Ingredien  list response
  const { data: genericMedicationActiveIngredientListResponseData } =
    useGetGenericMedicationActiveIngredientQuery(listRequest);

  // Effects
  // to display genericName, dosageForm, manufacturer, roaLvalue, activeIngredients on add substitutes
  useEffect(() => {
    setModifiedMedicationList(
      (genericMedicationListResponse?.object ?? []).map(item => ({
        ...item,
        customLabel: [
          [
            item.genericName,
            item.dosageFormLvalue?.lovDisplayVale,
            item.manufacturerLvalue?.lovDisplayVale,
            item.roaLvalue?.lovDisplayVale
          ]
            .filter(Boolean)
            .join(', '),
          item.activeIngredients
        ]
          .filter(Boolean)
          .join('   ')
      }))
    );
  }, [genericMedicationListResponse]);
  // update list when genericMedication is changed
  useEffect(() => {
    setListRequest({
      ...initialListRequest,
      pageSize: 100,
      timestamp: new Date().getMilliseconds(),
      sortBy: 'createdAt',
      sortType: 'desc',
      filters: [
        {
          fieldName: 'deleted_at',
          operator: 'isNull',
          value: undefined
        },
        {
          fieldName: 'generic_medication_key',
          operator: 'match',
          value: genericMedication.key || undefined
        }
      ]
    });
  }, [genericMedication]);
  // update list when save Generic Medication Active Ingredient
  useEffect(() => {
    if (saveGenericMedicationActiveIngredientMutation) {
      setListRequest({
        ...listRequest,
        timestamp: new Date().getMilliseconds()
      });
      setGenericActive({
        ...newApGenericMedicationActiveIngredient,
        activeIngredientKey: null,
        unitLkey: null
      });
    }
  }, [saveGenericMedicationActiveIngredientMutation]);

  // class name for selected row in substitutes table
  const isSelectedBrand = rowData => {
    if (rowData && brand && rowData.key === brand.key) {
      return 'selected-row';
    } else return '';
  };
  // class name for selected row in active ingredients table
  const isSelectedGenericActive = rowData => {
    if (rowData && rowData.key === genericActive.key) {
      return 'selected-row';
    } else return '';
  };
  // handle save Active Ingredient
  const saveActiveIngredient = () => {
    saveGenericMedicationActiveIngredient({
      ...genericActive,
      genericMedicationKey: genericMedication.key,
      createdBy: 'Administrator'
    })
      .unwrap()
      .then(() => {
        dispatch(notify({ msg: 'The A.I has been saved successfully', sev: 'success' }));
      })
      .catch(() => {
        dispatch(notify({ msg: 'Failed to save this A.I', sev: 'error' }));
      });
  };
  // handle save substitues
  const handleSaveSubstitues = () => {
    setBrand({ ...newApGenericMedication });
    if (!isEmpty(selectedGeneric.key)) {
      if (genericMedication?.key !== selectedGeneric?.key) {
        saveLinkBrandMedication({
          ...newApBrandMedicationSubstitutes,
          brandKey: genericMedication.key,
          alternativeBrandKey: selectedGeneric.key
        })
          .then(() => {
            fetchB();
            dispatch(
              notify({ msg: 'The Substitutes has been saved successfully', sev: 'success' })
            );
          })
          .catch(() => {
            dispatch(notify({ msg: 'Failed to save this Substitutes', sev: 'error' }));
          });
      } else {
        dispatch(notify('This medication is no different '));
      }
    } else {
      dispatch(notify({ msg: 'You don`t select a medication', sev: 'error' }));
    }
    setSelectedGeneric(null);
  };
  // Icons column (Edite, reactive/Deactivate)
  console.log('modifiedMedicationList-->', modifiedMedicationList);
  const iconsForActions = (rowData: ApGenericMedicationActiveIngredient) => (
    <div className="container-of-icons">
      {/* deactivate/activate  when click on one of these icon */}
      {!rowData?.deletedAt ? (
        <MdDelete
          className="icons-style"
          title="Deactivate"
          size={24}
          fill="var(--primary-pink)"
        />
      ) : (
        <FaUndo
          className="icons-style"
          title="Activate"
          size={20}
          fill="var(--primary-gray)"
        />
      )}
    </div>
  );
  //Table Active Ingredient columns
  const tableActiveIngredientColumns = [
    {
      key: 'activeIngredientName',
      title: <Translate>Active Ingredient Name</Translate>,
      flexGrow: 4,
      render: rowData => (
        <span>
          {conjureValueBasedOnKeyFromList(
            activeIngredientListResponseData?.object ?? [],
            rowData.activeIngredientKey,
            'name'
          )}
        </span>
      )
    },
    {
      key: 'activeIngredientATCCode',
      title: <Translate>Active Ingredient ATC Code</Translate>,
      flexGrow: 4,
      render: rowData => (
        <span>
          {conjureValueBasedOnKeyFromList(
            activeIngredientListResponseData?.object ?? [],
            rowData.activeIngredientKey,
            'atc_code'
          )}
        </span>
      )
    },
    {
      key: 'strength',
      title: <Translate>Strength</Translate>,
      flexGrow: 4,
      render: rowData => (
        <span>
          {rowData.strength}{' '}
          {rowData.unitLvalue ? rowData.unitLvalue.lovDisplayVale : rowData.unitLkey}
        </span>
      )
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
      flexGrow: 3,
      render: rowData => iconsForActions(rowData)
    }
  ];

  //Table Substitutes columns
  const tableSubstitutesColumns = [
    {
      key: 'code',
      title: <Translate>Code</Translate>,
      flexGrow: 4
    },
    {
      key: 'genericName',
      title: <Translate>Brand Name</Translate>,
      flexGrow: 4
    },
    {
      key: 'manufacturerLkey',
      title: <Translate>Manufacturer</Translate>,
      flexGrow: 4,
      render: rowData =>
        rowData.manufacturerLvalue
          ? rowData.manufacturerLvalue.lovDisplayVale
          : rowData.manufacturerLkey
    },
    {
      key: 'dosageFormLkey',
      title: <Translate>Dosage Form</Translate>,
      flexGrow: 4,
      render: rowData =>
        rowData.dosageFormLvalue ? rowData.dosageFormLvalue.lovDisplayVale : rowData.dosageFormLkey
    },
    {
      key: 'usageInstructions',
      title: <Translate>Usage Instructions</Translate>,
      flexGrow: 4
    },
    {
      key: 'roaList',
      title: <Translate>ROA</Translate>,
      flexGrow: 4,
      render: rowData =>
        rowData.roaList?.map((item, index) => {
          const value = conjureValueBasedOnKeyFromList(
            medRoutLovQueryResponse?.object ?? [],
            item,
            'lovDisplayVale'
          );
          return (
            <span key={index}>
              {value}
              {index < rowData.roaList.length - 1 && ', '}
            </span>
          );
        })
    },
    {
      key: 'expiresAfterOpening',
      title: <Translate>Expires After Opening</Translate>,
      flexGrow: 4,
      render: rowData => (rowData.expiresAfterOpening ? 'Yes' : 'No')
    },
    {
      key: 'singlePatientUse',
      title: <Translate>Single Patient Use</Translate>,
      flexGrow: 4,
      render: rowData => (rowData.singlePatientUse ? 'Yes' : 'No')
    },
    {
      key: 'deleted_at',
      title: <Translate>Status</Translate>,
      flexGrow: 4,
      render: rowData => (rowData.deletedAt === null ? 'Active' : 'InActive')
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
      flexGrow: 3,
      render: rowData => iconsForActions(rowData)
    }
  ];
  // Main modal content
  const conjureFormContent = (stepNumber = 0) => {
    switch (stepNumber) {
      case 0:
        return (
          <Form fluid>
            <div className="container-of-two-fields-generic-medication">
              <MyInput
                width={250}
                fieldName="code"
                record={genericMedication}
                setRecord={setGenericMedication}
              />
              <MyInput
                width={250}
                fieldLabel="Brand Name"
                fieldName="genericName"
                record={genericMedication}
                setRecord={setGenericMedication}
              />
            </div>
            <br />
            <div className="container-of-two-fields-generic-medication">
              <MyInput
                width={250}
                fieldName="manufacturerLkey"
                fieldType="select"
                selectData={GenericMedicationLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={genericMedication}
                setRecord={setGenericMedication}
                menuMaxHeight={250}
              />
              <MyInput
                width={250}
                fieldName="dosageFormLkey"
                fieldType="select"
                selectData={doseageFormLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={genericMedication}
                setRecord={setGenericMedication}
                menuMaxHeight={250}
              />
            </div>
            <br />
            <div className="container-of-two-fields-generic-medication">
              <MyInput
                width={250}
                fieldLabel="Rout"
                selectData={medRoutLovQueryResponse?.object ?? []}
                fieldType="checkPicker"
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                fieldName="roaList"
                record={genericMedication}
                setRecord={setGenericMedication}
              />
              <MyInput
                width={250}
                fieldName="marketingAuthorizationHolder"
                record={genericMedication}
                setRecord={setGenericMedication}
              />
            </div>
            <br />
            <MyInput
              width={520}
              fieldName="usageInstructions"
              fieldType="textarea"
              record={genericMedication}
              setRecord={setGenericMedication}
            />
            <MyInput
              width={520}
              fieldName="storageRequirements"
              fieldType="textarea"
              record={genericMedication}
              setRecord={setGenericMedication}
            />
            <div className="container-of-two-fields-generic-medication">
              <MyInput
                width={250}
                fieldName="expiresAfterOpening"
                fieldType="checkbox"
                record={genericMedication}
                setRecord={setGenericMedication}
              />
              {genericMedication?.expiresAfterOpening && (
                <MyInput
                  width={250}
                  fieldName="expiresAfterOpeningValue"
                  fieldType="text"
                  record={genericMedication}
                  setRecord={setGenericMedication}
                />
              )}
            </div>
            <br />
            <MyInput
              fieldName="singlePatientUse"
              fieldType="checkbox"
              record={genericMedication}
              setRecord={setGenericMedication}
            />
          </Form>
        );
      case 1:
        return (
          <Form>
            <div className="container-of-add-new-button">
              <MyButton
                prefixIcon={() => <AddOutlineIcon />}
                color="var(--deep-blue)"
                onClick={() => {
                  setOpenAddEditActiveIngredientsPopup(true);
                  setGenericActive({
                    ...newApGenericMedicationActiveIngredient
                  });
                }}
                width="109px"
              >
                Add New
              </MyButton>
            </div>
            <MyTable
              height={450}
              data={genericMedicationActiveIngredientListResponseData?.object}
              columns={tableActiveIngredientColumns}
              rowClassName={isSelectedGenericActive}
              onRowClick={rowData => {
                setGenericActive(rowData);
              }}
            />
          </Form>
        );
      case 2:
        return (
          <div>
            <div className="container-of-header-brand-medication">
              <Form layout="inline" fluid>
                <MyInput
                  showLabel={false}
                  width={250}
                  fieldLabel="Medication Name"
                  selectData={modifiedMedicationList}
                  fieldType="select"
                  selectDataLabel="customLabel"
                  selectDataValue="key"
                  fieldName="key"
                  record={selectedGeneric}
                  setRecord={setSelectedGeneric}
                  menuMaxHeight={250}
                  placeholder="select Medication Name"
                />
              </Form>
              <MyButton
                prefixIcon={() => <AddOutlineIcon />}
                color="var(--deep-blue)"
                onClick={handleSaveSubstitues}
                width="100px"
              >
                Add New
              </MyButton>
            </div>
            <MyTable
              height={450}
              data={lisOfLinkedBrand?.object ?? []}
              loading={isFetchingBrand}
              columns={tableSubstitutesColumns}
              onRowClick={rowData => {
                setBrand(rowData);
              }}
              rowClassName={isSelectedBrand}
            />
          </div>
        );
    }
  };
  // child modal content
  const conjureFormChildContent = (stepNumber = 0) => {
    switch (stepNumber) {
      case 0:
        return (
          <Form>
            <MyInput
              placeholder="Select A.I"
              selectDataValue="key"
              selectDataLabel="name"
              selectData={activeIngredientListResponseData?.object ?? []}
              fieldName="activeIngredientKey"
              fieldType="select"
              record={genericActive}
              setRecord={setGenericActive}
              searchable={false}
              menuMaxHeight={200}
              width={350}
            />
            <MyInput
              fieldType="number"
              fieldName="strength"
              record={genericActive}
              setRecord={setGenericActive}
              width={350}
            />
            <MyInput
              fieldType="select"
              fieldName="unitLkey"
              record={genericActive}
              setRecord={setGenericActive}
              selectDataValue="key"
              selectDataLabel="lovDisplayVale"
              placeholder="Unit"
              selectData={UOMLovResponseData?.object ?? []}
              menuMaxHeight={200}
              width={350}
            />
          </Form>
        );
    }
  };
  return (
    <ChildModal
      open={open}
      setOpen={setOpen}
      showChild={openAddEditActiveIngredientsPopup}
      setShowChild={setOpenAddEditActiveIngredientsPopup}
      title={genericMedication?.key ? 'Edit Brand Medication' : 'New Brand Medication'}
      childTitle="New Active Ingredients"
      mainContent={conjureFormContent}
      childContent={conjureFormChildContent}
      actionButtonLabel={genericMedication?.key ? 'Save' : 'Create'}
      actionButtonFunction={() => setOpen(false)}
      actionChildButtonFunction={saveActiveIngredient}
      mainStep={[
        {
          title: 'Information',
          icon: <MdOutlineMedicationLiquid />,
          disabledNext: !genericMedication?.key,
          footer: <MyButton onClick={handleSave}>Save</MyButton>
        },
        {
          title: 'Active Ingredient',
          icon: <GiMedicines />
        },
        {
          title: 'Substitute',
          icon: <HiOutlineSwitchHorizontal />
        }
      ]}
      mainSize="sm"
    />
  );
};
export default AddEditBrandMedication;
