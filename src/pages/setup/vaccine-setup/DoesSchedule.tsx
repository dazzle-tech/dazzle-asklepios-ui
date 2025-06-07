import React, { useEffect, useState } from 'react';
import {
  useGetDoseNumbersListQuery,
  useGetLovValuesByCodeQuery,
  useGetVaccineDosesIntervalListQuery,
  useGetVaccineDosesListQuery,
  useRemoveVaccineDoseIntervalMutation,
  useSaveVaccineDoseMutation,
  useSaveVaccineDosesIntervalMutation,
  useSaveVaccineMutation
} from '@/services/setupService';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import './styles.less';
import ChildModal from '@/components/ChildModal';
import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { MdModeEdit } from 'react-icons/md';
import { MdDelete } from 'react-icons/md';
import { initialListRequest, ListRequest } from '@/types/types';
import MyButton from '@/components/MyButton/MyButton';
import { ApVaccineDose, ApVaccineDosesInterval } from '@/types/model-types';
import { newApVaccineDose, newApVaccineDosesInterval } from '@/types/model-types-constructor';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import { FaSyringe } from 'react-icons/fa';
import { MdOutlineAccessTime } from 'react-icons/md';
const DoesSchedule = ({ open, setOpen, vaccine, setVaccine, refetch }) => {
  const dispatch = useAppDispatch();
  const [vaccineDose, setVaccineDose] = useState<ApVaccineDose>({ ...newApVaccineDose });
  const [openConfirmRemoveVaccineDosesInterval, setOpenConfirmRemoveVaccineDosesInterval] =
    useState<boolean>(false);
  const [openChildModal, setOpenChildModal] = useState<boolean>(false);
  const [childStep, setChildStep] = useState<number>(-1);
  const [vaccineDoseInterval, setVaccineDoseInterval] = useState<ApVaccineDosesInterval>({
    ...newApVaccineDosesInterval
  });
  const [numDisplayValue, setNumDisplayValue] = useState('');
  const [vaccineDosesIntevalListRequest, setVaccineDosesIntervalListRequest] =
    useState<ListRequest>({
      ...initialListRequest,
      filters: [
        {
          fieldName: 'deleted_at',
          operator: 'isNull',
          value: undefined
        }
      ]
    });
  const [vaccineDosesListRequest, setVaccineDosesListRequest] = useState<ListRequest>({
    ...initialListRequest,
    filters: [
      {
        fieldName: 'deleted_at',
        operator: 'isNull',
        value: undefined
      }
    ]
  });
  // Fetch Dose Numbers  list response
  const { data: fetchDoseNumbersListQueryResponce, isFetching } = useGetDoseNumbersListQuery(
    { key: numDisplayValue },
    { skip: !numDisplayValue }
  );
  // Fetch number of Doses Lov list response
  const { data: numofDossLovQueryResponse } = useGetLovValuesByCodeQuery('NUMBERS');
  // Fetch age UnitLov list response
  const { data: ageUnitLovQueryResponse } = useGetLovValuesByCodeQuery('AGE_UNITS');
  // Fetch vaccine Doses Interval list response
  const {
    data: vaccineDosesIntervalListResponseLoading,
    refetch: refetchVaccineDosesInterval,
    isFetching: isFetchingIntervalList
  } = useGetVaccineDosesIntervalListQuery(vaccineDosesIntevalListRequest);
  // Fetch unitLov list response
  const { data: unitLovQueryResponse } = useGetLovValuesByCodeQuery('TIME_UNITS');
  // Fetch vaccine Doses list response
  const { data: vaccineDosesListResponseLoading, refetch: refetchVaccineDoses } =
    useGetVaccineDosesListQuery(vaccineDosesListRequest);
  // remove Vaccine Doses Interval
  const [removeVaccineDosesInterval] = useRemoveVaccineDoseIntervalMutation();
  // save Vaccine Doses Interval
  const [saveVaccineDosesInterval] = useSaveVaccineDosesIntervalMutation();
  // save Vaccine Dose
  const [saveVaccineDose] = useSaveVaccineDoseMutation();
  // save vaccine
  const [saveVaccine, saveVaccineMutation] = useSaveVaccineMutation();

  // class name for selected row in Dose Interval table
  const isSelectedDoseInterval = rowData => {
    if (rowData && vaccineDoseInterval && vaccineDoseInterval.key === rowData.key) {
      return 'selected-row';
    } else return '';
  };
  // class name for selected row in Doses table
  const isSelectedDose = rowData => {
    if (rowData && vaccineDose && vaccineDose.key === rowData.key) {
      return 'selected-row';
    } else return '';
  };
  // list of vaccine Doses that used in select dose
  const dosesList = (vaccineDosesListResponseLoading?.object ?? []).map(item => ({
    value: item.key,
    label: item.doseNameLvalue.lovDisplayVale
  }));
  const dosesNameList = (fetchDoseNumbersListQueryResponce?.apLovValues ?? []).map(item => ({
    value: item.key,
    label: item.lovDisplayVale
  }));
  const selectedValue = numofDossLovQueryResponse?.object?.find(
    item => item.key === vaccine.numberOfDosesLkey
  );

  // Effects
  useEffect(() => {
    setNumDisplayValue(selectedValue?.lovDisplayVale || numDisplayValue);
  }, [selectedValue, vaccine]);
  // update list of vaccine Doses and vaccine Doses Interval when vaccine is changed
  useEffect(() => {
    setVaccineDosesListRequest(prev => ({
      ...prev,
      filters: [
        {
          fieldName: 'deleted_at',
          operator: 'isNull',
          value: undefined
        },
        ...(vaccine?.key
          ? [
              {
                fieldName: 'vaccine_key',
                operator: 'match',
                value: vaccine.key
              }
            ]
          : [])
      ]
    }));

    setVaccineDosesIntervalListRequest(prev => ({
      ...prev,
      filters: [
        {
          fieldName: 'deleted_at',
          operator: 'isNull',
          value: undefined
        },
        ...(vaccine?.key
          ? [
              {
                fieldName: 'vaccine_key',
                operator: 'match',
                value: vaccine.key
              }
            ]
          : [])
      ]
    }));
  }, [vaccine?.key]);
   useEffect(() => {
    if (saveVaccineMutation && saveVaccineMutation.status === 'fulfilled') {
      setVaccine(saveVaccineMutation.data);
      refetch();
    }
  }, [saveVaccineMutation]);

  // handle delete vaccine Doses Interval
  const handleDeleteVaccineDosesInterval = () => {
    removeVaccineDosesInterval(vaccineDoseInterval)
      .unwrap()
      .then(() => {
        setVaccineDoseInterval(newApVaccineDosesInterval);
        setOpenConfirmRemoveVaccineDosesInterval(false);
        dispatch(notify('Vaccine Doses Interval Deleted Successfully' + vaccineDoseInterval.key));
        refetchVaccineDosesInterval();
        setVaccineDoseInterval({
          ...newApVaccineDosesInterval,
          vaccineKey: vaccine.key,
          intervalBetweenDoses: 0,
          fromDoseKey: null,
          toDoseKey: null,
          unitLkey: null
        });
      });
  };
  // Icons column (Edite, delete)
  const iconsForActionsInterval = () => (
    <div className="container-of-icons-vaccine">
      <MdModeEdit
        className="icons-vaccine"
        title="Edit"
        size={24}
        fill="var(--primary-gray)"
        onClick={() => {
          setChildStep(1);
          setOpenChildModal(true);
        }}
      />
      <MdDelete
        className="icons-vaccine"
        title="Deactivate"
        size={24}
        fill="var(--primary-pink)"
        onClick={() => setOpenConfirmRemoveVaccineDosesInterval(true)}
      />
    </div>
  );
  // Icons column (Edite, reactive/Deactivate)
  const iconsForDoses = () => (
    <div className="container-of-icons-vaccine">
      <MdModeEdit
        className="icons-vaccine"
        title="Edit"
        size={24}
        fill="var(--primary-gray)"
        onClick={() => {
          setChildStep(0);
          setOpenChildModal(true);
        }}
      />
    </div>
  );
  //TableIntervalBetweenDosesColumns
  const tableIntervalBetweenDosesColumns = [
    {
      key: 'intervalBetweenDoses',
      title: <Translate>Interval Between Doses</Translate>,
      flexGrow: 2
    },
    {
      key: 'unit',
      title: <Translate>Unit</Translate>,
      flexGrow: 3,
      render: rowData => (rowData.unitLvalue ? rowData.unitLvalue.lovDisplayVale : rowData.unitLkey)
    },
    {
      key: 'betweenDose',
      title: <Translate>Between Dose</Translate>,
      flexGrow: 3,
      render: rowData =>
        rowData.fromDose.doseNameLvalue
          ? rowData.fromDose.doseNameLvalue.lovDisplayVale
          : rowData.doseNameLkey
    },
    {
      key: 'andDose',
      title: <Translate>And Dose</Translate>,
      flexGrow: 3,
      render: rowData =>
        rowData.toDose?.doseNameLvalue
          ? rowData.toDose?.doseNameLvalue.lovDisplayVale
          : rowData.doseNameLkey
    },
    {
      key: 'isValid',
      title: <Translate>Status</Translate>,
      flexGrow: 3,
      render: rowData => (rowData.isValid ? 'Valid' : 'InValid')
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
      flexGrow: 3,
      render: () => iconsForActionsInterval()
    }
  ];
  //TableDosescolumns
  const tableDosesColumns = [
    {
      key: 'doseName',
      title: <Translate>Dose Number</Translate>,
      flexGrow: 3,
      render: rowData =>
        rowData?.doseNameLvalue ? rowData?.doseNameLvalue.lovDisplayVale : rowData.doseNameLkey
    },
    {
      key: 'age',
      title: <Translate>Age</Translate>,
      flexGrow: 3,
      render: rowData => (rowData.fromAge === 0 ? ' ' : rowData.fromAge)
    },
    {
      key: 'ageUnit',
      title: <Translate>Age Unit</Translate>,
      flexGrow: 3,
      render: rowData =>
        rowData.fromAgeUnitLvalue
          ? rowData.fromAgeUnitLvalue.lovDisplayVale
          : rowData.fromAgeUnitLkey
    },
    {
      key: 'ageUntil',
      title: <Translate>Age Until</Translate>,
      flexGrow: 3,
      render: rowData => (rowData.toAge === 0 ? ' ' : rowData.toAge)
    },
    {
      key: 'Age Until Unit',
      title: <Translate>Age Until Unit</Translate>,
      flexGrow: 3,
      render: rowData =>
        rowData.toAgeUnitLvalue ? rowData.toAgeUnitLvalue.lovDisplayVale : rowData.toAgeUnitLkey
    },
    {
      key: 'isBoostert',
      title: <Translate>Is Boostert</Translate>,
      flexGrow: 3,
      render: rowData => (rowData.isBooster ? 'Yes' : 'No')
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
      flexGrow: 3,
      render: () => iconsForDoses()
    }
  ];
  // handle Save Vaccine Doses Interval
  const handleSaveVaccineDosesInterval = async () => {
    await saveVaccineDosesInterval({ ...vaccineDoseInterval, vaccineKey: vaccine.key }).unwrap();
    dispatch(notify('Vaccine Doses Interval Added Successfully'));
    refetchVaccineDosesInterval();
    setVaccineDoseInterval({
      ...newApVaccineDosesInterval,
      vaccineKey: vaccine.key,
      intervalBetweenDoses: 0,
      fromDoseKey: null,
      toDoseKey: null,
      unitLkey: null
    });
  };
  // handle save Vaccine Doses
  const handleSaveVaccineDoses = async () => {
    await saveVaccineDose({ ...vaccineDose, vaccineKey: vaccine.key }).unwrap();
    saveVaccine({ ...vaccine });
    dispatch(notify('Vaccine Dose Added Successfully'));
    refetchVaccineDoses();
    setVaccineDose({
      ...newApVaccineDose,
      vaccineKey: vaccine.key,
      fromAge: 0,
      toAge: 0,
      doseNameLkey: null,
      fromAgeUnitLkey: null,
      toAgeUnitLkey: null
    });
  };
  // Main modal content
  const conjureFormContentOfMainModal = stepNumber => {
    switch (stepNumber) {
      case 0:
        return (
          <Form fluid layout="inline">
            <div style={{ display: 'flex', gap: '5px', alignItems: 'flex-end' }}>
              <MyInput
                width={140}
                fieldLabel="Vaccine Code"
                fieldName="vaccineCode"
                record={vaccine}
                setRecord={setVaccine}
                disabled
              />
              <MyInput
                width={140}
                fieldLabel="Vaccine Name"
                fieldName="vaccineName"
                record={vaccine}
                setRecord={setVaccine}
                plachplder={'Medical Component'}
                disabled
              />
              <MyInput
                width={140}
                fieldType="select"
                fieldLabel="Number of Doses"
                selectData={numofDossLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                fieldName="numberOfDosesLkey"
                record={vaccine}
                disabled={
                  vaccine.numberOfDosesLkey && vaccineDosesListResponseLoading?.object?.length > 0
                }
                setRecord={newRecord => {
                  setVaccine(newRecord);
                  const selectedValue = numofDossLovQueryResponse?.object?.find(
                    item => item.key === newRecord.numberOfDosesLkey
                  );
                  setNumDisplayValue(selectedValue?.lovDisplayVale || '');
                }}
              />
              <MyButton
                prefixIcon={() => <AddOutlineIcon />}
                color="var(--deep-blue)"
                onClick={() => {
                  setVaccineDose({ ...newApVaccineDose });
                  setChildStep(0);
                  setOpenChildModal(true);
                }}
                width="90px"
              >
                Add
              </MyButton>
            </div>
            <MyTable
              height={250}
              data={vaccine.key ? vaccineDosesListResponseLoading?.object ?? [] : []}
              loading={isFetching}
              columns={tableDosesColumns}
              rowClassName={isSelectedDose}
              onRowClick={rowData => {
                setVaccineDose(rowData);
              }}
              sortColumn={vaccineDosesIntevalListRequest.sortBy}
              sortType={vaccineDosesIntevalListRequest.sortType}
              onSortChange={(sortBy, sortType) => {
                if (sortBy)
                  setVaccineDosesIntervalListRequest({
                    ...vaccineDosesIntevalListRequest,
                    sortBy,
                    sortType
                  });
              }}
            />
          </Form>
        );
      case 1:
        return (
          <Form>
            <div className="container-of-add-new-button-vaccine">
              <MyButton
                prefixIcon={() => <AddOutlineIcon />}
                color="var(--deep-blue)"
                onClick={() => {
                  setVaccineDoseInterval({
                    ...newApVaccineDosesInterval
                  });
                  setChildStep(1);
                  setOpenChildModal(true);
                }}
                width="109px"
              >
                Add New
              </MyButton>
            </div>
            <MyTable
              height={450}
              data={vaccine.key ? vaccineDosesIntervalListResponseLoading?.object ?? [] : []}
              loading={isFetchingIntervalList}
              columns={tableIntervalBetweenDosesColumns}
              rowClassName={isSelectedDoseInterval}
              onRowClick={rowData => {
                setVaccineDoseInterval(rowData);
              }}
              sortColumn={vaccineDosesIntevalListRequest.sortBy}
              sortType={vaccineDosesIntevalListRequest.sortType}
              onSortChange={(sortBy, sortType) => {
                if (sortBy)
                  setVaccineDosesIntervalListRequest({
                    ...vaccineDosesIntevalListRequest,
                    sortBy,
                    sortType
                  });
              }}
            />
            <DeletionConfirmationModal
              open={openConfirmRemoveVaccineDosesInterval}
              setOpen={setOpenConfirmRemoveVaccineDosesInterval}
              itemToDelete="Vaccine Doses Interval"
              actionButtonFunction={handleDeleteVaccineDosesInterval}
              actionType={'delete'}
            />
          </Form>
        );
    }
  };
  // Child modal content
  const conjureFormContentOfChildModal = () => {
    switch (childStep) {
      case 0:
        return (
          <Form>
            <MyInput
              required
              width={350}
              fieldType="select"
              fieldLabel="Dose Number"
              fieldName="doseNameLkey"
              selectData={dosesNameList}
              selectDataLabel="label"
              selectDataValue="value"
              record={vaccineDose}
              setRecord={setVaccineDose}
            />
            <div className="container-of-two-fields-vaccine">
              <MyInput
                required
                width={170}
                fieldLabel="Age"
                fieldType="number"
                fieldName="fromAge"
                record={vaccineDose}
                setRecord={setVaccineDose}
              />
              <MyInput
                required
                width={170}
                fieldType="select"
                fieldLabel="Age Unit"
                selectData={ageUnitLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                fieldName="fromAgeUnitLkey"
                record={vaccineDose}
                setRecord={setVaccineDose}
              />
            </div>
            <div className="container-of-two-fields-vaccine">
              <MyInput
                width={170}
                fieldLabel="Age Until"
                fieldType="number"
                fieldName="toAge"
                record={vaccineDose}
                setRecord={setVaccineDose}
              />
              <MyInput
                width={170}
                fieldType="select"
                fieldLabel="Age Unit"
                selectData={ageUnitLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                fieldName="toAgeUnitLkey"
                record={vaccineDose}
                setRecord={setVaccineDose}
              />
            </div>
            <MyInput
              fieldType="checkbox"
              fieldName="isBooster"
              fieldLabel="Is Booster"
              record={vaccineDose}
              setRecord={setVaccineDose}
            />
          </Form>
        );
      case 1:
        return (
          <Form layout="inline" fluid>
            <div className="container-of-two-fields-vaccine">
              <MyInput
                width={170}
                required
                fieldType="number"
                column
                fieldLabel="Interval Between Doses"
                fieldName="intervalBetweenDoses"
                record={vaccineDoseInterval}
                setRecord={setVaccineDoseInterval}
              />
              <MyInput
                required
                width={170}
                column
                fieldType="select"
                fieldLabel="Unit"
                fieldName="unitLkey"
                selectData={unitLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={vaccineDoseInterval}
                setRecord={setVaccineDoseInterval}
              />
            </div>
            
              <MyInput
                required
                width={350}
                column
                fieldLabel="Between Dose"
                fieldType="select"
                fieldName="fromDoseKey"
                selectData={dosesList}
                selectDataLabel="label"
                selectDataValue="value"
                record={vaccineDoseInterval}
                setRecord={setVaccineDoseInterval}
                menuMaxHeight={200}
              />
              <MyInput
                required
                width={350}
                column
                fieldLabel="To Dose"
                fieldType="select"
                fieldName="toDoseKey"
                selectData={dosesList}
                selectDataLabel="label"
                selectDataValue="value"
                record={vaccineDoseInterval}
                setRecord={setVaccineDoseInterval}
                menuMaxHeight={200}
              />
          </Form>
        );
    }
  };
  return (
    <ChildModal
      actionButtonLabel={vaccine?.key ? 'Save' : 'Create'}
      actionButtonFunction={() => setOpen(false)}
      actionChildButtonFunction={
        childStep == 1 ? handleSaveVaccineDosesInterval : handleSaveVaccineDoses
      }
      open={open}
      setOpen={setOpen}
      showChild={openChildModal}
      setShowChild={setOpenChildModal}
      title="Dose Schedule"
      mainContent={conjureFormContentOfMainModal}
      mainStep={[
        {
          title: 'Doses',
          icon: <FaSyringe />,
          disabledNext: !vaccine?.key,
        },
        {
          title: 'Interval Between Doses',
          icon: <MdOutlineAccessTime />
        }
      ]}
      childTitle="Add Dose"
      childContent={conjureFormContentOfChildModal}
      mainSize="sm"
    />
  );
};
export default DoesSchedule;
