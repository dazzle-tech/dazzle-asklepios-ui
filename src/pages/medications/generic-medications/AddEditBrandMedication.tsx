import MyModal from '@/components/MyModal/MyModal';
import React, { useEffect, useState } from 'react';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
// import './styles.less';
import { useGetResourceTypeQuery } from '@/services/appointmentService';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { GrScheduleNew } from 'react-icons/gr';
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
  useSaveGenericMedicationMutation
} from '@/services/medicationsSetupService';
import { notify } from '@/utils/uiReducerActions';
import { useAppDispatch } from '@/hooks';
import Translate from '@/components/Translate';
import { conjureValueBasedOnKeyFromList } from '@/utils';
import MyTable from '@/components/MyTable';
import { initialListRequest, ListRequest } from '@/types/types';
import ChildModal from '@/components/ChildModal';
import {
  newApGenericMedication,
  newApGenericMedicationActiveIngredient
} from '@/types/model-types-constructor';
import { ApGenericMedication, ApGenericMedicationActiveIngredient } from '@/types/model-types';
import { MdModeEdit } from 'react-icons/md';
import { FaUndo } from 'react-icons/fa';
import { MdDelete } from 'react-icons/md';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
const AddEditBrandMedication = ({
  open,
  setOpen,
  //   width,
  genericMedication,
  setGenericMedication,
  handleSave
}) => {
  const dispatch = useAppDispatch();
  const { data: GenericMedicationLovQueryResponse } =
    useGetLovValuesByCodeQuery('GEN_MED_MANUFACTUR');
  const { data: doseageFormLovQueryResponse } = useGetLovValuesByCodeQuery('DOSAGE_FORMS');
  const { data: medRoutLovQueryResponse } = useGetLovValuesByCodeQuery('MED_ROA');
  const [activeIngredientsListRequest, setActiveIngredientsListRequest] = useState<ListRequest>({
    ...initialListRequest
  });
  const [genericActive, setGenericActive] = useState<ApGenericMedicationActiveIngredient>({
    ...newApGenericMedicationActiveIngredient
  });
  const [openAddEditActiveIngredientsPopup, setOpenAddEditActiveIngredientsPopup] =
    useState<boolean>(false);
  const { data: genericMedicationListResponse } =
    useGetGenericMedicationWithActiveIngredientQuery('');

  const [modifiedMedicationList, setModifiedMedicationList] = useState(
    (genericMedicationListResponse?.object ?? []).map(item => ({
      ...item,
       customLabel: `${item.genericName}  , ${item.dosageFormLvalue?.lovDisplayVale} ${item.manufacturerLvalue?.lovDisplayVale} , ${item.roaLvalue?.lovDisplayVale}`
    }))
  );

  useEffect(() => {
    setModifiedMedicationList(
      (genericMedicationListResponse?.object ?? []).map(item => ({
        ...item,
        customLabel: `${item.genericName} - ${item.strength} ${item.form}`
      }))
    );
  }, [genericMedicationListResponse]);

  const { data: UOMLovResponseData } = useGetLovValuesByCodeQuery('VALUE_UNIT');
  const [saveGenericMedication, saveGenericMedicationMutation] = useSaveGenericMedicationMutation();
  const {
    data: lisOfLinkedBrand,
    refetch: fetchB,
    isFetching: isFetchingBrand
  } = useGetLinkedBrandQuery(genericMedication.key);
  const [saveGenericMedicationActiveIngredient, saveGenericMedicationActiveIngredientMutation] =
    useSaveGenericMedicationActiveIngredientMutation();
  const { data: activeIngredientListResponseData } = useGetActiveIngredientQuery(
    activeIngredientsListRequest
  );

  const [brand, setBrand] = useState<ApGenericMedication>({ ...newApGenericMedication });
  console.log('activeIngredientListResponseData: ' + activeIngredientListResponseData?.object);

  const isSelectedBrand = rowData => {
    if (rowData && brand && rowData.key === brand.key) {
      return 'selected-row';
    } else return '';
  };

  const [openAddConfirm, setOpenAddConfirm] = useState<boolean>(false);

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

  const { data: genericMedicationActiveIngredientListResponseData } =
    useGetGenericMedicationActiveIngredientQuery(listRequest);

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

  const saveActiveIngredient = () => {
    saveGenericMedicationActiveIngredient({
      ...genericActive,
      genericMedicationKey: genericMedication.key,
      createdBy: 'Administrator'
    }).unwrap();
    dispatch(notify('A.I Saved Successfully'));
  };

  //    const handleSave = async () => {
  //       try {
  //     //   setEnableAddActive(true);
  //     //   setEditing(true);
  //       const response = await saveGenericMedication({ genericMedication}).unwrap();
  //         dispatch(notify('Brand Medication Saved Successfully'));
  //         setGenericMedication(response);
  //         // setPreKey(response?.key);
  //       } catch (error) {
  //         console.error("Error saving Brand Medication:", error);
  //     }
  //     };

  // Icons column (Edite, reactive/Deactivate)
  const iconsForActions = (rowData: ApGenericMedicationActiveIngredient) => (
    <div className="container-of-icons-resources">
      {/* open edit brand when click on this icon */}
      <MdModeEdit
        className="icons-resources"
        title="Edit"
        size={24}
        fill="var(--primary-gray)"
        //   onClick={() => setOpenAddEditPopup(true)}
      />
      {/* deactivate/activate  when click on one of these icon */}
      {!rowData?.deletedAt ? (
        <MdDelete
          className="icons-resources"
          title="Deactivate"
          size={24}
          fill="var(--primary-pink)"
          // onClick={() => {
          //   setStateOfDeleteUserModal('deactivate');
          //   setOpenConfirmDeleteUserModal(true);
          // }}
        />
      ) : (
        <FaUndo
          className="icons-resources"
          title="Activate"
          size={20}
          fill="var(--primary-gray)"
          // onClick={() => {
          //   setStateOfDeleteUserModal('reactivate');
          //   setOpenConfirmDeleteUserModal(true);
          // }}
        />
      )}
    </div>
  );

  //Table columns
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

  //Table columns
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

  // Modal content
  const conjureFormContent = (stepNumber = 0) => {
    switch (stepNumber) {
      case 0:
        return (
          <Form fluid>
            <div className="container-of-two-fields-lov">
              <div className="container-of-my-input-lov">
                <MyInput
                  width="100%"
                  fieldName="code"
                  record={genericMedication}
                  setRecord={setGenericMedication}
                />
              </div>
              <div className="container-of-my-input-lov">
                <MyInput
                  width="100%"
                  fieldLabel="Brand Name"
                  fieldName="genericName"
                  record={genericMedication}
                  setRecord={setGenericMedication}
                />
              </div>
            </div>
            <br />
            <div className="container-of-two-fields-lov">
              <div className="container-of-my-input-lov">
                <MyInput
                  width="100%"
                  fieldName="manufacturerLkey"
                  fieldType="select"
                  selectData={GenericMedicationLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={genericMedication}
                  setRecord={setGenericMedication}
                />
              </div>
              <div className="container-of-my-input-lov">
                <MyInput
                  width="100%"
                  fieldName="dosageFormLkey"
                  fieldType="select"
                  selectData={doseageFormLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={genericMedication}
                  setRecord={setGenericMedication}
                />
              </div>
            </div>
            <br />
            <div className="container-of-two-fields-lov">
              <div className="container-of-my-input-lov">
                <MyInput
                  width="100%"
                  fieldLabel="Rout"
                  selectData={medRoutLovQueryResponse?.object ?? []}
                  fieldType="multyPicker"
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  fieldName="roaList"
                  record={genericMedication}
                  setRecord={setGenericMedication}
                />
              </div>
              <div className="container-of-my-input-lov">
                <MyInput
                  width="100%"
                  fieldName="marketingAuthorizationHolder"
                  record={genericMedication}
                  setRecord={setGenericMedication}
                />
              </div>
            </div>
            <br />
            <MyInput
              width="100%"
              fieldName="usageInstructions"
              fieldType="textarea"
              record={genericMedication}
              setRecord={setGenericMedication}
            />
            <MyInput
              width="100%"
              fieldName="storageRequirements"
              fieldType="textarea"
              record={genericMedication}
              setRecord={setGenericMedication}
            />
            <div className="container-of-two-fields-lov">
              <div className="container-of-my-input-lov">
                <MyInput
                  width="100%"
                  fieldName="expiresAfterOpening"
                  fieldType="checkbox"
                  record={genericMedication}
                  setRecord={setGenericMedication}
                />
              </div>

              {genericMedication?.expiresAfterOpening && (
                <div className="container-of-my-input-lov">
                  <MyInput
                    width="100%"
                    fieldName="expiresAfterOpeningValue"
                    fieldType="text"
                    record={genericMedication}
                    setRecord={setGenericMedication}
                  />
                </div>
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
            <div className="container-of-add-new-button-resources">
              <MyButton
                prefixIcon={() => <AddOutlineIcon />}
                color="var(--deep-blue)"
                onClick={() => {
                  setOpenAddEditActiveIngredientsPopup(true);
                }}
                width="109px"
              >
                Add New
              </MyButton>
            </div>
            <MyTable
              height={450}
              data={genericMedicationActiveIngredientListResponseData?.object}
              //   loading={isFetching}
              columns={tableActiveIngredientColumns}
              //   rowClassName={isSelected}
              //   filters={filters()}
              //   onRowClick={rowData => {
              //     setGenericMedication(rowData);
              //   }}
              //   sortColumn={listRequest.sortBy}
              //   sortType={listRequest.sortType}
              //   onSortChange={(sortBy, sortType) => {
              //     if (sortBy) setListRequest({ ...listRequest, sortBy, sortType });
              //   }}
              //   page={pageIndex}
              //   rowsPerPage={rowsPerPage}
              //   totalCount={totalCount}
              //   onPageChange={handlePageChange}
              //   onRowsPerPageChange={handleRowsPerPageChange}
            />
          </Form>
        );
      case 2:
        return (
          <Form>
            <MyButton
              prefixIcon={() => <AddOutlineIcon />}
              color="var(--deep-blue)"
              onClick={() => {
                setOpenAddConfirm(true);
              }}
              width="109px"
            >
              Add New
            </MyButton>

            <MyInput
              width={350}
              fieldLabel="Medication Name"
              selectData={modifiedMedicationList}
              fieldType="select"
              selectDataLabel="customLabel"
              selectDataValue="key"
              fieldName="genericName"
              record={genericMedication}
              setRecord={setGenericMedication}
              menuMaxHeight={250}
            />

            {/* <MyInput
              //  width="100%"
              width={250}
              fieldLabel="Medication Name"
              selectData={genericMedicationListResponse?.object ?? []}
              fieldType="select"
              selectDataLabel="genericName"
              selectDataValue="key"
              fieldName="genericName"
              record={genericMedication}
              setRecord={setGenericMedication}
              menuMaxHeight={250}
            /> */}
            <MyTable
              height={450}
              data={lisOfLinkedBrand?.object ?? []}
              loading={isFetchingBrand}
              columns={tableSubstitutesColumns}
              onRowClick={rowData => {
                setBrand(rowData);
              }}
              rowClassName={isSelectedBrand}
              //   filters={filters()}

              //   sortColumn={listRequest.sortBy}
              //   sortType={listRequest.sortType}
              //   onSortChange={(sortBy, sortType) => {
              //     if (sortBy) setListRequest({ ...listRequest, sortBy, sortType });
              //   }}
              //   page={pageIndex}
              //   rowsPerPage={rowsPerPage}
              //   totalCount={totalCount}
              //   onPageChange={handlePageChange}
              //   onRowsPerPageChange={handleRowsPerPageChange}
            />
            <DeletionConfirmationModal
              open={openAddConfirm}
              setOpen={setOpenAddConfirm}
              itemToDelete="Sub"
              // actionButtonFunction={stateOfDeleteUserModal == 'deactivate' ? handleDeactiveResource : handleReactiveResource}
              actionType={'Add'}
            />
          </Form>
        );
    }
  };

  // Modal content
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
              // labelKey="name"
              // valueKey="key"
              record={genericActive}
              setRecord={setGenericActive}
              //   showLabel={true}
              //   placeholder="Select Filter"
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
      // back to add edit
      childTitle="New Active Ingredients"
      //   position="right"
      mainContent={conjureFormContent}
      childContent={conjureFormChildContent}
      actionButtonLabel={genericMedication?.key ? 'Save' : 'Create'}
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
          //   disabledNext: !openNextDocument,
          //   footer: <MyButton onClick={handleSave}>Save</MyButton>
        },
        {
          title: 'Substitute',
          icon: <HiOutlineSwitchHorizontal />
          //   footer: <MyButton onClick={handleSave}>Save</MyButton>
        }
      ]}
      //   size={width > 600 ? '36vw' : '70vw'}
      mainSize="sm"
    />
  );
};
export default AddEditBrandMedication;
