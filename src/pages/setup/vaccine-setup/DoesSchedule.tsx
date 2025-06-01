import React, { useEffect, useState } from 'react';
import {
  useGetDoseNumbersListQuery,
  useGetLovValuesByCodeQuery,
  useGetVaccineDosesIntervalListQuery,
  useGetVaccineDosesListQuery,
  useSaveVaccineDoseMutation,
  useSaveVaccineDosesIntervalMutation,
  useSaveVaccineMutation
} from '@/services/setupService';
import MyInput from '@/components/MyInput';
import { Form, SelectPicker } from 'rsuite';
import './styles.less';
import ChildModal from '@/components/ChildModal';
import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import clsx from 'clsx';
import { MdVaccines } from 'react-icons/md';
import { MdMedication } from 'react-icons/md';
import { FaUndo } from 'react-icons/fa';
import { MdModeEdit } from 'react-icons/md';
import { MdDelete } from 'react-icons/md';
import { initialListRequest, ListRequest } from '@/types/types';
import MyButton from '@/components/MyButton/MyButton';
import { ApVaccineDose, ApVaccineDosesInterval } from '@/types/model-types';
import { newApVaccineDose, newApVaccineDosesInterval } from '@/types/model-types-constructor';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import { render } from 'react-dom';
import { FaSyringe } from 'react-icons/fa';
import { MdOutlineAccessTime } from 'react-icons/md';
import MyLabel from '@/components/MyLabel';
const DoesSchedule = ({
  open,
  setOpen,
  vaccine,
  setVaccine,
  refetch
  // vaccineDose,
  // setVaccineDose
  //   width,
  //   handleSave
}) => {
  const dispatch = useAppDispatch();
  const [vaccineDose, setVaccineDose] = useState<ApVaccineDose>({ ...newApVaccineDose });
  const [vaccineDoseInterval, setVaccineDoseInterval] = useState<ApVaccineDosesInterval>({
    ...newApVaccineDosesInterval
  });
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
    const [numDisplayValue, setNumDisplayValue] = useState('');
    const {
        data: fetchDoseNumbersListQueryResponce,
        error,
        isLoading,
        isFetching,
        isSuccess,
        refetch: refetchNumberDoses
      } = useGetDoseNumbersListQuery({ key: numDisplayValue }, { skip: !numDisplayValue });
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
  const [openChildModal, setOpenChildModal] = useState<boolean>(false);
  const [childStep, setChildStep] = useState<number>(-1);
  const { data: numofDossLovQueryResponse } = useGetLovValuesByCodeQuery('NUMBERS');
  const { data: ageUnitLovQueryResponse } = useGetLovValuesByCodeQuery('AGE_UNITS');
  const {
    data: vaccineDosesIntervalListResponseLoading,
    refetch: refetchVaccineDosesInterval,
    isFetching: isFetchingIntervalList
  } = useGetVaccineDosesIntervalListQuery(vaccineDosesIntevalListRequest);
  const { data: unitLovQueryResponse } = useGetLovValuesByCodeQuery('TIME_UNITS');

  const { data: vaccineDosesListResponseLoading, refetch: refetchVaccineDoses } =
    useGetVaccineDosesListQuery(vaccineDosesListRequest);

  const isSelectedDoseInterval = rowData => {
    if (rowData && vaccineDoseInterval && vaccineDoseInterval.key === rowData.key) {
      return 'selected-row';
    } else return '';
  };

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

    useEffect(() => {
    // ارجع اشوف لايش هي بس هي السبب في انه يضل يعمل لودينج كل ما اختار سطر
    setNumDisplayValue(selectedValue?.lovDisplayVale || numDisplayValue);
  }, [selectedValue, vaccine]);

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
  }, [vaccine?.key]);
  useEffect(() => {
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

  //Table columns
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
      render: rowData => (rowData.unitLvalue ? rowData.unitLvalue.lovDisplayVale : rowData.unitLkey)
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
    }
    // {
    //   key: 'icons',
    //   title: <Translate></Translate>,
    //   flexGrow: 3,
    //   render: rowData => iconsForActions(rowData)
    // }
  ];

  //Table columns
  const tableDosesColumns = [
    {
      key: 'doseName',
      title: <Translate>Dose Name</Translate>,
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
    }
    // {
    //   key: 'icons',
    //   title: <Translate></Translate>,
    //   flexGrow: 3,
    //   render: rowData => iconsForActions(rowData)
    // }
  ];
  const [saveVaccineDosesInterval, saveVaccineDosesIntervalMutation] =
    useSaveVaccineDosesIntervalMutation();
    const [saveVaccineDose, saveVaccineDoseMutation] = useSaveVaccineDoseMutation();

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
const [saveVaccine, saveVaccineMutation] = useSaveVaccineMutation();
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
useEffect(() => {
    if (saveVaccineMutation && saveVaccineMutation.status === 'fulfilled') {
      setVaccine(saveVaccineMutation.data);
      refetch();
    }
  }, [saveVaccineMutation]);
  // Main modal content
  const conjureFormContentOfMainModal = stepNumber => {
    switch (stepNumber) {
      case 0:
        return (
          <Form layout="inline" fluid>
            <div className="container-of-add-new-button-practitioners">
              <MyButton
                prefixIcon={() => <AddOutlineIcon />}
                color="var(--deep-blue)"
                onClick={() => {
                  setChildStep(0);
                  setOpenChildModal(true);
                }}
                width="109px"
              >
                Add New
              </MyButton>
            </div>
            <MyInput
              width={170}
              column
              fieldLabel="Vaccine Code"
              fieldName="vaccineCode"
              record={vaccine}
              setRecord={setVaccine}
              disabled
            />
            <MyInput
              width={170}
              column
              fieldLabel="Vaccine Name"
              fieldName="vaccineName"
              record={vaccine}
              setRecord={setVaccine}
              plachplder={'Medical Component'}
              disabled
            />
            <MyInput
              width={170}
              column
              fieldType="select"
              fieldLabel="Number of Doses"
              selectData={numofDossLovQueryResponse?.object ?? []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              fieldName="numberOfDosesLkey"
              record={vaccine}
              disabled={vaccine.numberOfDosesLkey}
              setRecord={newRecord => {
                setVaccine(newRecord);
                const selectedValue = numofDossLovQueryResponse?.object?.find(
                  item => item.key === newRecord.numberOfDosesLkey
                );
                setNumDisplayValue(selectedValue?.lovDisplayVale || '');
              }}
            />

            <MyTable
              height={250}
              data={vaccine.key ? vaccineDosesListResponseLoading?.object ?? [] : []}
              loading={isFetching}
              columns={tableDosesColumns}
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
          </Form>
        );
      case 1:
        return (
          <Form>
            <div className="container-of-add-new-button-practitioners">
              <MyButton
                prefixIcon={() => <AddOutlineIcon />}
                color="var(--deep-blue)"
                onClick={() => {
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
              // data={vaccine.key ? vaccineDosesIntervalListResponseLoading?.object ?? [] : []}
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
              fieldLabel="Dose Name"
              fieldName="doseNameLkey"
              selectData={dosesNameList}
              selectDataLabel="label"
              selectDataValue="value"
              record={vaccineDose}
              setRecord={setVaccineDose}
            />
            <MyInput
              required
              width={350}
              fieldLabel="Age"
              fieldType="number"
              fieldName="fromAge"
              record={vaccineDose}
              setRecord={setVaccineDose}
            />
            <MyInput
              required
              width={350}
              fieldType="select"
              fieldLabel="Age Unit"
              selectData={ageUnitLovQueryResponse?.object ?? []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              fieldName="fromAgeUnitLkey"
              record={vaccineDose}
              setRecord={setVaccineDose}
            />
            <MyInput
              width={350}
              fieldLabel="Age Until"
              fieldType="number"
              fieldName="toAge"
              record={vaccineDose}
              setRecord={setVaccineDose}
            />
            <MyInput
              width={350}
              fieldType="select"
              fieldLabel="Age Unit"
              selectData={ageUnitLovQueryResponse?.object ?? []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              fieldName="toAgeUnitLkey"
              record={vaccineDose}
              setRecord={setVaccineDose}
            />
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
            <MyInput
              width={350}
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
              width={350}
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
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                paddingTop: '6px'
              }}
            >
              {/* <div>
            <span style={{ color: 'red', marginLeft: 2 }}>*</span> <MyLabel label="Between Dose" />
          </div> */}
              {/* <SelectPicker
            data={dosesList}
            value={vaccineDoseInterval.fromDoseKey === null ? ' ' : dosesList.key}
            onChange={value => {
              // const selectedItem = dosesNameList.find(item => item.value === value);
              setVaccineDoseInterval({ ...vaccineDoseInterval, fromDoseKey: value });
            }}
            style={{ width: 350 }}
            placeholder="Select "
            labelKey="label"
            valueKey="value"
          /> */}
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
                // disabled={!edit_new}
                menuMaxHeight={200}
              />
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                paddingTop: '6px'
              }}
            >
              {/* <div>
                <span style={{ color: 'red', marginLeft: 2 }}>*</span> <MyLabel label="To Dose" />
              </div> */}
              {/* <SelectPicker
                data={dosesList}
                value={vaccineDoseInterval.toDoseKey === null ? ' ' : dosesList.key}
                onChange={value => {
                  // const selectedItem = dosesNameList.find(item => item.value === value);
                  setVaccineDoseInterval({ ...vaccineDoseInterval, toDoseKey: value });
                }}
                style={{ width: 180 }}
                placeholder="Select "
                labelKey="label"
                valueKey="value"
              /> */}

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
                // disabled={!edit_new}
                menuMaxHeight={200}
              />
            </div>
          </Form>
        );
    }
  };
  return (
    <ChildModal
      actionButtonLabel={vaccine?.key ? 'Save' : 'Create'}
      actionButtonFunction={() => setOpen(false)}
      actionChildButtonFunction={childStep == 1 ? handleSaveVaccineDosesInterval : handleSaveVaccineDoses}
      open={open}
      setOpen={setOpen}
      showChild={openChildModal}
      setShowChild={setOpenChildModal}
      title='Dose Schedule'
      mainContent={conjureFormContentOfMainModal}
      //   mainStep={[{ title: 'Vaccine Details', icon: <FontAwesomeIcon icon={faUserNurse} /> }]}
      mainStep={[
        {
          title: 'Doses',
          icon: <FaSyringe />,
          disabledNext: !vaccine?.key,
          footer: (
            <MyButton
            //   onClick={handleSave}
            >
              Save
            </MyButton>
          )
        },
        {
          title: 'Interval Between Doses',
          icon: <MdOutlineAccessTime />
        }
      ]}
      childTitle={'xl.x,x.x...;.;.'}
      childContent={conjureFormContentOfChildModal}
      //   mainSize = {width > 600 ? '570px' : '300px'}
      mainSize="sm"
    />
  );
};
export default DoesSchedule;
