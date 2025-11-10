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

const lovLabel = (lov: any, fallback?: any) =>
  lov?.lovDisplayValue ?? lov?.lovDisplayVale ?? lov?.display ?? lov?.label ?? fallback ?? '';

type Props = {
  open: boolean;
  setOpen: (v: boolean) => void;
  vaccine: any;
  setVaccine: (v: any) => void;
  refetch: () => void;
};

const DoesSchedule: React.FC<Props> = ({ open, setOpen, vaccine, setVaccine, refetch }) => {
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

  const { data: fetchDoseNumbersListQueryResponce, isFetching } = useGetDoseNumbersListQuery(
    { key: numDisplayValue },
    { skip: !numDisplayValue }
  );

  // Fetch LOVs
  const { data: numofDossLovQueryResponse } = useGetLovValuesByCodeQuery('NUMBERS');
  const { data: ageUnitLovQueryResponse } = useGetLovValuesByCodeQuery('AGE_UNITS');
  const { data: unitLovQueryResponse } = useGetLovValuesByCodeQuery('TIME_UNITS');

  // Lists
  const {
    data: vaccineDosesIntervalListResponseLoading,
    refetch: refetchVaccineDosesInterval,
    isFetching: isFetchingIntervalList
  } = useGetVaccineDosesIntervalListQuery(vaccineDosesIntevalListRequest);

  const { data: vaccineDosesListResponseLoading, refetch: refetchVaccineDoses } =
    useGetVaccineDosesListQuery(vaccineDosesListRequest);

  // Mutations
  const [removeVaccineDosesInterval] = useRemoveVaccineDoseIntervalMutation();
  const [saveVaccineDosesInterval] = useSaveVaccineDosesIntervalMutation();
  const [saveVaccineDose] = useSaveVaccineDoseMutation();
  const [saveVaccine, saveVaccineMutation] = useSaveVaccineMutation();

  // class names
  const isSelectedDoseInterval = (rowData: any) =>
    rowData && vaccineDoseInterval && vaccineDoseInterval.key === rowData.key ? 'selected-row' : '';

  const isSelectedDose = (rowData: any) =>
    rowData && vaccineDose && vaccineDose.key === rowData.key ? 'selected-row' : '';

  const dosesList =
    (vaccineDosesListResponseLoading?.object ?? []).map((item: any) => ({
      value: item?.key,
      label: lovLabel(item?.doseNameLvalue, item?.doseNameLkey)
    })) ?? [];

  const dosesNameList =
    (fetchDoseNumbersListQueryResponce?.apLovValues ?? []).map((item: any) => ({
      value: item?.key,
      label: lovLabel(item, item?.key) 
    })) ?? [];

  const selectedValue =
    numofDossLovQueryResponse?.object?.find(
      (item: any) => item?.key === vaccine?.numberOfDosesLkey
    ) ?? null;

  // Effects
  useEffect(() => {
    setNumDisplayValue(lovLabel(selectedValue, numDisplayValue));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedValue?.key]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saveVaccineMutation?.status]);

  // حذف Interval
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
          vaccineKey: vaccine?.key,
          intervalBetweenDoses: 0,
          fromDoseKey: null,
          toDoseKey: null,
          unitLkey: null
        });
      });
  };

  const iconsForActionsInterval = () => (
    <div className="container-of-icons">
      <MdModeEdit
        className="icons-style"
        title="Edit"
        size={24}
        fill="var(--primary-gray)"
        onClick={() => {
          setChildStep(1);
          setOpenChildModal(true);
        }}
      />
      <MdDelete
        className="icons-style"
        title="Deactivate"
        size={24}
        fill="var(--primary-pink)"
        onClick={() => setOpenConfirmRemoveVaccineDosesInterval(true)}
      />
    </div>
  );

  const iconsForDoses = () => (
    <div className="container-of-icons">
      <MdModeEdit
        className="icons-style"
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
      render: (rowData: any) => lovLabel(rowData?.unitLvalue, rowData?.unitLkey)
    },
    {
      key: 'betweenDose',
      title: <Translate>Between Dose</Translate>,
      flexGrow: 3,
      render: (rowData: any) =>
        lovLabel(rowData?.fromDose?.doseNameLvalue, rowData?.fromDose?.doseNameLkey)
    },
    {
      key: 'andDose',
      title: <Translate>And Dose</Translate>,
      flexGrow: 3,
      render: (rowData: any) =>
        lovLabel(rowData?.toDose?.doseNameLvalue, rowData?.toDose?.doseNameLkey)
    },
    {
      key: 'isValid',
      title: <Translate>Status</Translate>,
      flexGrow: 3,
      render: (rowData: any) => (rowData?.isValid ? 'Valid' : 'InValid')
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
      flexGrow: 3,
      render: () => iconsForActionsInterval()
    }
  ];

  const tableDosesColumns = [
    {
      key: 'doseName',
      title: <Translate>Dose Number</Translate>,
      flexGrow: 3,
      render: (rowData: any) => lovLabel(rowData?.doseNameLvalue, rowData?.doseNameLkey)
    },
    {
      key: 'age',
      title: <Translate>Age</Translate>,
      flexGrow: 3,
      render: (rowData: any) => (rowData?.fromAge === 0 ? ' ' : rowData?.fromAge ?? '')
    },
    {
      key: 'ageUnit',
      title: <Translate>Age Unit</Translate>,
      flexGrow: 3,
      render: (rowData: any) => lovLabel(rowData?.fromAgeUnitLvalue, rowData?.fromAgeUnitLkey)
    },
    {
      key: 'ageUntil',
      title: <Translate>Age Until</Translate>,
      flexGrow: 3,
      render: (rowData: any) => (rowData?.toAge === 0 ? ' ' : rowData?.toAge ?? '')
    },
    {
      key: 'Age Until Unit',
      title: <Translate>Age Until Unit</Translate>,
      flexGrow: 3,
      render: (rowData: any) => lovLabel(rowData?.toAgeUnitLvalue, rowData?.toAgeUnitLkey)
    },
    {
      key: 'isBooster',
      title: <Translate>Is Booster</Translate>,
      flexGrow: 3,
      render: (rowData: any) => (rowData?.isBooster ? 'Yes' : 'No')
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
      flexGrow: 3,
      render: () => iconsForDoses()
    }
  ];

  const handleSaveVaccineDosesInterval = async () => {
    await saveVaccineDosesInterval({ ...vaccineDoseInterval, vaccineKey: vaccine?.key }).unwrap();
    dispatch(notify('Vaccine Doses Interval Added Successfully'));
    refetchVaccineDosesInterval();
    setVaccineDoseInterval({
      ...newApVaccineDosesInterval,
      vaccineKey: vaccine?.key,
      intervalBetweenDoses: 0,
      fromDoseKey: null,
      toDoseKey: null,
      unitLkey: null
    });
  };

  const handleSaveVaccineDoses = async () => {
    await saveVaccineDose({
      ...vaccineDose,
      vaccineKey: vaccine?.key,
      isBooster: !!vaccineDose.isBooster 
    }).unwrap();
    saveVaccine({ ...vaccine });
    dispatch(notify('Vaccine Dose Added Successfully'));
    refetchVaccineDoses();
    setVaccineDose({
      ...newApVaccineDose,
      vaccineKey: vaccine?.key,
      fromAge: 0,
      toAge: 0,
      doseNameLkey: null,
      fromAgeUnitLkey: null,
      toAgeUnitLkey: null,
      isBooster: false
    });
  };

  const conjureFormContentOfMainModal = (stepNumber: number) => {
    switch (stepNumber) {
      case 0:
        return (
          <Form fluid layout="inline">
            <div className="container-of-vaccine-info">
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
                placeholder={'Medical Component'}
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
                  !!(
                    vaccine?.numberOfDosesLkey &&
                    (vaccineDosesListResponseLoading?.object?.length ?? 0) > 0
                  )
                }
                setRecord={(newRecord: any) => {
                  setVaccine(newRecord);
                  const sel =
                    numofDossLovQueryResponse?.object?.find(
                      (item: any) => item?.key === newRecord?.numberOfDosesLkey
                    ) ?? null;
                  setNumDisplayValue(lovLabel(sel, ''));
                }}
              />
              <MyButton
                prefixIcon={() => <AddOutlineIcon />}
                color="var(--deep-blue)"
                onClick={() => {
                  setVaccineDose({ ...newApVaccineDose, isBooster: false });
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
              data={vaccine?.key ? vaccineDosesListResponseLoading?.object ?? [] : []}
              loading={isFetching}
              columns={tableDosesColumns}
              rowClassName={isSelectedDose}
              onRowClick={(rowData: any) => {
                setVaccineDose(rowData);
              }}
              sortColumn={vaccineDosesIntevalListRequest.sortBy}
              sortType={vaccineDosesIntevalListRequest.sortType}
              onSortChange={(sortBy: any, sortType: any) => {
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
            <div className="container-of-add-new-button">
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
              data={vaccine?.key ? vaccineDosesIntervalListResponseLoading?.object ?? [] : []}
              loading={isFetchingIntervalList}
              columns={tableIntervalBetweenDosesColumns}
              rowClassName={isSelectedDoseInterval}
              onRowClick={(rowData: any) => {
                setVaccineDoseInterval(rowData);
              }}
              sortColumn={vaccineDosesIntevalListRequest.sortBy}
              sortType={vaccineDosesIntevalListRequest.sortType}
              onSortChange={(sortBy: any, sortType: any) => {
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
      default:
        return null;
    }
  };

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
      default:
        return null;
    }
  };

  return (
    <ChildModal
      actionButtonLabel={vaccine?.key ? 'Save' : 'Create'}
      actionButtonFunction={() => setOpen(false)}
      actionChildButtonFunction={
        childStep === 1 ? handleSaveVaccineDosesInterval : handleSaveVaccineDoses
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
          disabledNext: !vaccine?.key
        },
        {
          title: 'Interval Between Doses',
          icon: <MdOutlineAccessTime />
        }
      ]}
      childTitle={childStep === 1 ? 'Add Interval' : 'Add Dose'}
      childContent={conjureFormContentOfChildModal}
      mainSize="sm"
    />
  );
};

export default DoesSchedule;
