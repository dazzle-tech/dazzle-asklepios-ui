import {
  useCreateIntervalMutation,
  useGetIntervalsByVaccineIdQuery,
  useLazyGetNextDosesQuery,
  useToggleIntervalActiveMutation,
  useUpdateIntervalMutation
} from '@/services/vaccine/vaccineDosesIntervalService';
import React, { useEffect, useMemo, useState } from 'react';

import {
  useAddVaccineDoseMutation,
  useGetDoseNumbersUpToQuery,
  useGetVaccineDosesByVaccineIdQuery,
  useToggleVaccineDoseActiveMutation,
  useUpdateVaccineDoseMutation
} from '@/services/vaccine/vaccineDosesService';

import { newVaccineDosesInterval } from '@/types/model-types-constructor-new';
import { VaccineDose, VaccineDosesInterval } from '@/types/model-types-new';

import ChildModal from '@/components/ChildModal';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import { useEnumOptions } from '@/services/enumsApi';
import { newVaccineDose } from '@/types/model-types-constructor-new';
import { PaginationPerPage } from '@/utils/paginationPerPage';
import { notify } from '@/utils/uiReducerActions';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { FaSyringe, FaUndo } from 'react-icons/fa';
import { MdDelete, MdModeEdit, MdOutlineAccessTime } from 'react-icons/md';
import { Form } from 'rsuite';
import './styles.less';

/* ================== Helpers (labels) ================== */
const enumLabel = (options: any[] = [], value?: string | null) =>
  options?.find(o => o.value === value)?.label ?? value ?? '';

/* ================== Humanize backend errors ================== */
const toHumanBackendError = (err: any, fieldLabels: Record<string, string> = {}): string => {
  const data = err?.data ?? {};
  const props = data?.properties ?? {};
  const title = data?.title || '';
  const detail = data?.detail || '';
  const message = data?.message || props?.message || '';
  const fieldErrors: Array<any> = data?.fieldErrors ?? [];

  const traceId = data?.traceId || data?.requestId || data?.correlationId;
  const suffix = traceId ? `\nTrace ID: ${traceId}` : '';

  // ====== Validation with fieldErrors (Bean Validation / MethodArgumentNotValid) ======
  if (
    data?.message === 'error.validation' ||
    (typeof title === 'string' && title.toLowerCase().includes('argument not valid')) ||
    Array.isArray(fieldErrors)
  ) {
    const normalize = (m: string) => {
      const l = (m || '').toLowerCase();
      if (l.includes('must not be null') || l.includes('notnull')) return 'is required';
      if (l.includes('must not be blank') || l.includes('notblank')) return 'must not be blank';
      if (l.includes('greater than') || l.includes('positive')) return 'must not be zero or negative number';
      if (l.includes('less than')) return 'value is too large';
      if (l.includes('size must be between')) return 'length is out of range';
      return m || 'invalid value';
    };

    if (fieldErrors?.length) {
      const lines = fieldErrors.map((f: any) => {
        const label = fieldLabels[f.field] ?? f.field;
        return `• ${label}: ${normalize(f.message)}`;
      });
      return `Please fix the following fields:\n${lines.join('\n')}${suffix}`;
    }
  }

  // ====== JHipster-style errorKey mapping (from BadRequestAlertException / NotFoundAlertException) ======
  const errorKeyFromBackend: string | undefined = data?.errorKey;
  const errorKeyFromMessage: string | undefined = (message || '').startsWith('error.')
    ? message.slice(6)
    : undefined;
  const key = errorKeyFromBackend || errorKeyFromMessage;

  const keyMap: Record<string, string> = {
    // ===== VaccineDosesService (doses) =====
    'vaccine.required': 'Vaccine id is required. Please select or save the vaccine first.',
    'payload.required': 'Payload is required. Please fill in the form and try again.',
    'numberOfDoses.required': 'Number of doses is required.',
    'numberOfDoses.invalid': 'Invalid number of doses.',

    'unique.doseNumber.vaccineId':
      'This dose number already exists for this vaccine. Please edit or re-activate the existing dose.',
    'unique.doseNumber.vaccineId.ageWindow':
      'A dose with the same (dose number, age range & units) already exists for this vaccine.',
    'db.duplicate': 'Duplicate or unique constraint violation while saving vaccine dose.',
    'db.constraint':
      'Database constraint violated while saving vaccine dose/interval (check required/unique fields).',

    // ===== VaccineDosesIntervalService (intervals) =====
    'unique.vaccine.from.to': 'An interval with the same vaccine and dose range already exists',
    'interval.positive': 'Interval between doses must be greater than 0.',
    'from.ne.to': 'From Dose and To Dose must be different.',
    'fromDose.required': 'From Dose is required.',
    'fromDose.notFound': 'From Dose was not found.',
    'dose.fk.notfound': 'No From Dose and/or To Dose values were entered',

    // ===== Common not found =====
    notfound: 'Requested resource was not found.'
  };

  if (key && keyMap[key]) {
    return keyMap[key] + suffix;
  }

  // ====== Fallbacks ======
  const payloadText =
    [title, detail, message].filter(Boolean).join(' | ') || String(err?.error || '');
  if ((title || '').toLowerCase().includes('failed to read request')) {
    return (
      'Some fields have invalid format (e.g. empty value for enum or number). Please select valid options or clear numeric fields.' +
      suffix
    );
  }

  return (payloadText || 'Unexpected error') + suffix;
};

type Props = {
  open: boolean;
  setOpen: (v: boolean) => void;
  vaccine: any;
};

const DoesSchedule: React.FC<Props> = ({ open, setOpen, vaccine }) => {
  const dispatch = useAppDispatch();

  // ====== Core state
  const [vaccineDose, setVaccineDose] = useState<VaccineDose>({ ...newVaccineDose });
  const [openChildModal, setOpenChildModal] = useState<boolean>(false);
  const [childStep, setChildStep] = useState<number>(-1);

  // Interval state (new model)
  const [vaccineDoseInterval, setVaccineDoseInterval] = useState<VaccineDosesInterval>({
    ...newVaccineDosesInterval
  });

  // Confirm modals
  const [openDoseConfirm, setOpenDoseConfirm] = useState(false);
  const [doseConfirmMode, setDoseConfirmMode] = useState<'deactivate' | 'reactivate'>('deactivate');

  const [openIntervalConfirm, setOpenIntervalConfirm] = useState(false);
  const [intervalConfirmMode, setIntervalConfirmMode] = useState<'deactivate' | 'reactivate'>(
    'deactivate'
  );

  // ====== Pagination/Sorting (Doses)
  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 5,
    sort: 'id,asc',
    timestamp: Date.now()
  });
  const { sortColumn, sortType } = useMemo(() => {
    const [col, dir] = String(paginationParams.sort).split(',');
    return {
      sortColumn: col || 'id',
      sortType: (dir === 'desc' ? 'desc' : 'asc') as 'asc' | 'desc'
    };
  }, [paginationParams.sort]);

  // ====== Pagination/Sorting (Intervals)
  const [intervalPage, setIntervalPage] = useState(0);
  const [intervalSize, setIntervalSize] = useState(5);
  const [intervalSort, setIntervalSort] = useState<'asc' | 'desc'>('asc');
  const [intervalSortBy, setIntervalSortBy] = useState<string>('id');

  // ====== Enums
  const AgeUnit = useEnumOptions('AgeUnit');
  const DoseNumber = useEnumOptions('DoseNumber', {
    labelOverrides: {
      FIRST: '1st',
      SECOND: '2nd',
      THIRD: '3rd',
      FOURTH: '4th',
      FIFTH: '5th',
      SIXTH: '6th',
      SEVENTH: '7th',
      EIGHTH: '8th',
      NINTH: '9th',
      TENTH: '10th'
    }
  });
  const numOfDosesEnum = useEnumOptions('NumberOfDoses', {
    labelOverrides: {
      ONE: '1',
      TWO: '2',
      THREE: '3',
      FOUR: '4',
      FIVE: '5',
      SIX: '6',
      SEVEN: '7',
      EIGHT: '8',
      NINE: '9',
      TEN: '10'
    }
  });

  // ====== Doses list by vaccineId
  const skipDoses = !vaccine?.id;
  const {
    data: dosesPaged,
    isFetching: isFetchingDoses,
    refetch: refetchDoses
  } = useGetVaccineDosesByVaccineIdQuery(
    {
      vaccineId: vaccine?.id,
      page: paginationParams.page,
      size: paginationParams.size,
      sort: paginationParams.sort,
      timestamp: paginationParams.timestamp
    },
    { skip: skipDoses }
  );
  const dosesData = dosesPaged?.data ?? [];
  const dosesTotal = dosesPaged?.totalCount ?? 0;
  const dosesLinks = dosesPaged?.links || {};

  // Dose names for selects
  const dosesList =
    (dosesData ?? []).map((item: any) => ({
      value: item?.id,
      label: enumLabel(DoseNumber, item?.doseNumber)
    })) ?? [];

  const existingDoseNumbers: Set<string> = useMemo(
    () => new Set((dosesData ?? []).map((d: any) => d?.doseNumber).filter(Boolean)),
    [dosesData]
  );

  // ====== Intervals (new service)
  const {
    data: intervalsPaged,
    isFetching: isFetchingIntervals,
    refetch: refetchIntervals
  } = useGetIntervalsByVaccineIdQuery(
    {
      vaccineId: vaccine?.id,
      page: intervalPage,
      size: intervalSize,
      sort: `${intervalSortBy},${intervalSort}`
    },
    { skip: !vaccine?.id }
  );
  const intervalsData = intervalsPaged?.data ?? [];
  const intervalsTotal = intervalsPaged?.totalCount ?? 0;
  const intervalsLinks = intervalsPaged?.links || {};

  const [triggerGetNextDoses, nextDosesResult] = useLazyGetNextDosesQuery();

  // ====== Mutations
  const [addVaccineDose] = useAddVaccineDoseMutation();
  const [updateVaccineDose] = useUpdateVaccineDoseMutation();
  const [toggleVaccineDoseActive] = useToggleVaccineDoseActiveMutation();

  const [createInterval] = useCreateIntervalMutation();
  const [updateInterval] = useUpdateIntervalMutation();
  const [toggleIntervalActive] = useToggleIntervalActiveMutation();

  // ====== DoseNumber options via API getDoseNumbersUpTo
  const numberOfDoses = vaccine?.numberOfDoses as string | undefined;
  const { data: upToDoseNumbers = [], isFetching: isFetchingUpTo } = useGetDoseNumbersUpToQuery(
    { numberOfDoses: numberOfDoses as string },
    { skip: !numberOfDoses }
  );

  const doseNumberOptions = useMemo(
    () =>
      (upToDoseNumbers ?? [])
        .filter(code => (vaccineDose?.id ? true : !existingDoseNumbers.has(code)))
        .map(code => ({ value: code, label: enumLabel(DoseNumber, code) })),
    [upToDoseNumbers, DoseNumber, existingDoseNumbers, vaccineDose?.id]
  );

  useEffect(() => {
    if (!vaccineDose?.doseNumber) return;
    const stillAllowed = (upToDoseNumbers ?? []).includes(vaccineDose.doseNumber);
    if (!stillAllowed) setVaccineDose(prev => ({ ...prev, doseNumber: undefined as any }));
  }, [upToDoseNumbers, vaccineDose?.doseNumber]);

  useEffect(() => {
    if (vaccine?.id && vaccineDoseInterval?.fromDoseId) {
      triggerGetNextDoses({ vaccineId: vaccine.id, fromDoseId: vaccineDoseInterval.fromDoseId });
    }
  }, [vaccine?.id, vaccineDoseInterval?.fromDoseId, triggerGetNextDoses]);

  const nextDosesOptions =
    (nextDosesResult.data ?? []).map((dose: VaccineDose) => ({
      value: dose.id,
      label: enumLabel(DoseNumber, dose.doseNumber)
    })) ?? [];

  // ====== Toggle active (Dose) + confirm wrapper
  const handleToggleDoseActive = async (row: VaccineDose) => {
    if (!row?.id) return;
    try {
      const res = await toggleVaccineDoseActive({ id: row.id }).unwrap();
      dispatch(
        notify({
          msg: res?.isActive
            ? 'Vaccine Dose Activated Successfully'
            : 'Vaccine Dose Deactivated Successfully',
          sev: 'success'
        })
      );
      setPaginationParams(prev => ({ ...prev, timestamp: Date.now() }));
      await refetchDoses();
    } catch (err) {
      const msg = toHumanBackendError(err, { id: 'Dose Id' });
      dispatch(notify({ msg, sev: 'error' } as any));
    }
  };
  const handleConfirmToggleDose = async () => {
    try {
      await handleToggleDoseActive(vaccineDose);
    } finally {
      setOpenDoseConfirm(false);
    }
  };

  // ====== Toggle active (Interval) + confirm wrapper
  const handleToggleInterval = async (row: VaccineDosesInterval) => {
    if (!row?.id) return;
    try {
      const res = await toggleIntervalActive({ id: row.id }).unwrap();
      dispatch(
        notify({
          msg: res?.isActive
            ? 'Interval Activated Successfully'
            : 'Interval Deactivated Successfully',
          sev: 'success'
        })
      );
      await refetchIntervals();
    } catch (err) {
      const msg = toHumanBackendError(err, { id: 'Interval Id' });
      dispatch(notify({ msg, sev: 'error' } as any));
    }
  };
  const handleConfirmToggleInterval = async () => {
    try {
      await handleToggleInterval(vaccineDoseInterval);
    } finally {
      setOpenIntervalConfirm(false);
    }
  };

  // ====== Columns
  const tableIntervalBetweenDosesColumns = [
    {
      key: 'intervalBetweenDoses',
      title: <Translate>Interval Between Doses</Translate>,
      flexGrow: 2
    },
    {
      key: 'unit',
      title: <Translate>Unit</Translate>,
      flexGrow: 2,
      render: (row: VaccineDosesInterval) => enumLabel(AgeUnit, row?.unit) || row?.unit || ''
    },
    {
      key: 'betweenDose',
      title: <Translate>Between Dose</Translate>,
      flexGrow: 3,
      render: (row: any) => {
        const dn = dosesData.find(d => d.id === row?.fromDoseId)?.doseNumber;
        return enumLabel(DoseNumber, dn) || dn || '';
      }
    },
    {
      key: 'andDose',
      title: <Translate>And Dose</Translate>,
      flexGrow: 3,
      render: (row: any) => {
        const dn = dosesData.find(d => d.id === row?.toDoseId)?.doseNumber;
        return enumLabel(DoseNumber, dn) || dn || '';
      }
    },
    {
      key: 'isActive',
      title: <Translate>Status</Translate>,
      width: 120,
      render: rowData =>
        rowData.isActive ? (
          <MyBadgeStatus contant="Active" color="#45b887" />
        ) : (
          <MyBadgeStatus contant="Inactive" color="#969fb0" />
        )
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
      flexGrow: 2,
      render: (row: VaccineDosesInterval) => (
        <div className="container-of-icons">
          <MdModeEdit
            className="icons-style"
            title="Edit"
            size={24}
            fill="var(--primary-gray)"
            onClick={() => {
              setVaccineDoseInterval(row);
              setChildStep(1);
              setOpenChildModal(true);
            }}
          />
          {row?.isActive ? (
            <MdDelete
              className="icons-style"
              title="Deactivate Interval"
              size={24}
              fill="var(--primary-pink)"
              onClick={() => {
                setVaccineDoseInterval(row);
                setIntervalConfirmMode('deactivate');
                setOpenIntervalConfirm(true);
              }}
            />
          ) : (
            <FaUndo
              className="icons-style"
              title="Activate Interval"
              size={22}
              fill="var(--primary-gray)"
              onClick={() => {
                setVaccineDoseInterval(row);
                setIntervalConfirmMode('reactivate');
                setOpenIntervalConfirm(true);
              }}
            />
          )}
        </div>
      )
    }
  ];

  const tableDosesColumns = [
    {
      key: 'doseNumber',
      title: <Translate>Dose Number</Translate>,
      flexGrow: 3,
      render: (rowData: any) => enumLabel(DoseNumber, rowData?.doseNumber)
    },
    {
      key: 'age',
      title: <Translate>Age</Translate>,
      flexGrow: 2,
      render: (r: any) => (r?.fromAge === 0 ? ' ' : r?.fromAge ?? '')
    },
    {
      key: 'ageUnit',
      title: <Translate>Age Unit</Translate>,
      flexGrow: 2,
      render: (r: any) => enumLabel(AgeUnit, r?.fromAgeUnit)
    },
    {
      key: 'ageUntil',
      title: <Translate>Age Until</Translate>,
      flexGrow: 2,
      render: (r: any) => (r?.toAge === 0 ? ' ' : r?.toAge ?? '')
    },
    {
      key: 'Age Until Unit',
      title: <Translate>Age Until Unit</Translate>,
      flexGrow: 2,
      render: (r: any) => enumLabel(AgeUnit, r?.toAgeUnit)
    },
    {
      key: 'isBooster',
      title: <Translate>Is Booster</Translate>,
      flexGrow: 2,
      render: (r: any) => (r?.isBooster ? 'Yes' : 'No')
    },
    {
      key: 'isActive',
      title: <Translate>Is Active</Translate>,
      flexGrow: 2,
      render: (r: any) => (r?.isActive ? 'Yes' : 'No')
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
      flexGrow: 2,
      render: (row: VaccineDose) => (
        <div className="container-of-icons">
          <MdModeEdit
            className="icons-style"
            title="Edit"
            size={24}
            fill="var(--primary-gray)"
            onClick={() => {
              setVaccineDose({
                ...row,
                vaccineId: row?.vaccineId ?? vaccine?.id,
                doseNumber: row?.doseNumber,
                fromAgeUnit: row?.fromAgeUnit,
                toAgeUnit: row?.toAgeUnit
              } as VaccineDose);
              setChildStep(0);
              setOpenChildModal(true);
            }}
          />
          {row?.isActive ? (
            <MdDelete
              className="icons-style"
              title="Deactivate Dose"
              size={24}
              fill="var(--primary-pink)"
              onClick={() => {
                setVaccineDose(row);
                setDoseConfirmMode('deactivate');
                setOpenDoseConfirm(true);
              }}
            />
          ) : (
            <FaUndo
              className="icons-style"
              title="Activate Dose"
              size={22}
              fill="var(--primary-gray)"
              onClick={() => {
                setVaccineDose(row);
                setDoseConfirmMode('reactivate');
                setOpenDoseConfirm(true);
              }}
            />
          )}
        </div>
      )
    }
  ];

  // ====== Intervals handlers (Create/Update)
  const handleSaveInterval = async () => {
    if (!vaccine?.id) {
      dispatch(notify({ msg: 'Vaccine is missing an id', sev: 'error' } as any));
      return;
    }
    const payload: VaccineDosesInterval = {
      ...vaccineDoseInterval,
      vaccineId: vaccine.id,
      isActive: vaccineDoseInterval?.isActive ?? true
    } as any;

    try {
      if (payload.id) {
        await updateInterval({
          id: payload.id,
          vaccineId: payload?.vaccineId,
          data: payload
        }).unwrap();
        dispatch(notify({ msg: 'Interval Updated Successfully', sev: 'success' }));
      } else {
        await createInterval({ vaccineId: vaccine.id, data: payload }).unwrap();
        dispatch(notify({ msg: 'Interval Added Successfully', sev: 'success' }));
      }
      setVaccineDoseInterval({ ...newVaccineDosesInterval });
      await refetchIntervals();
    } catch (err) {
      const msg = toHumanBackendError(err, {
        intervalBetweenDoses: 'Interval Between Doses',
        unit: 'Unit',
        fromDoseId: 'Between Dose',
        toDoseId: 'To Dose'
      });
      dispatch(notify({ msg, sev: 'error' } as any));
    }
  };

  // ====== Doses handlers (Create/Update)
  const handleSaveVaccineDoses = async () => {
    const vaccineId = vaccine?.id;
    if (!vaccineId) {
      dispatch(notify('Vaccine is missing an id'));
      return;
    }
    if (!vaccineDose?.id && existingDoseNumbers.has(vaccineDose?.doseNumber as any)) {
      dispatch(
        notify({
          msg: 'This dose number already exists for this vaccine. Edit it or choose another dose.',
          sev: 'error'
        } as any)
      );
      return;
    }

    const payload: VaccineDose = {
      id: vaccineDose.id,
      vaccineId,
      doseNumber: vaccineDose.doseNumber,
      fromAge: vaccineDose.fromAge,
      toAge: vaccineDose.toAge,
      fromAgeUnit: vaccineDose.fromAgeUnit ?? null,
      toAgeUnit: vaccineDose.toAgeUnit ?? null,
      isBooster: !!vaccineDose.isBooster,
      isActive: vaccineDose.isActive ?? true
    };

    try {
      if (payload.id) {
        await updateVaccineDose({ id: payload.id, data: payload }).unwrap();
        dispatch(notify({ msg: 'Vaccine Dose Updated Successfully', sev: 'success' }));
      } else {
        await addVaccineDose({ vaccineId, data: payload }).unwrap();
        dispatch(notify({ msg: 'Vaccine Dose Added Successfully', sev: 'success' }));
      }
    } catch (err: any) {
      const msg = toHumanBackendError(err, {
        id: 'Dose Id',
        doseNumber: 'Dose Number',
        fromAge: 'Age',
        fromAgeUnit: 'Age Unit',
        toAge: 'Age Until',
        toAgeUnit: 'Age Until Unit',
        isBooster: 'Is Booster',
        isActive: 'Active'
      });
      dispatch(notify({ msg, sev: 'error' } as any));
      return;
    }

    setPaginationParams(prev => ({ ...prev, page: 0, timestamp: Date.now() }));
    await refetchDoses();

    setVaccineDose({
      ...newVaccineDose,
      vaccineId,
      fromAge: 0,
      toAge: 0,
      isBooster: false
    });
  };

  // ====== Sorting/Paging (Doses)
  const handleDoseSortChange = (column: string, type: 'asc' | 'desc') => {
    if (!column) return;
    const nextSort = `${column},${type ?? 'asc'}`;
    setPaginationParams(prev => ({ ...prev, sort: nextSort, page: 0, timestamp: Date.now() }));
  };

  const handleDosePageChange = (_: unknown, newPage: number) => {
    const currentPage = paginationParams.page;
    const linksMap = dosesLinks || {};
    let targetLink: string | null | undefined = null;

    if (newPage > currentPage && linksMap.next) targetLink = linksMap.next;
    else if (newPage < currentPage && linksMap.prev) targetLink = linksMap.prev;
    else if (newPage === 0 && linksMap.first) targetLink = linksMap.first;
    else if (newPage > currentPage + 1 && linksMap.last) targetLink = linksMap.last;

    if (targetLink && (PaginationPerPage as any).extractPaginationFromLink) {
      try {
        const { page, size } = (PaginationPerPage as any).extractPaginationFromLink(targetLink);
        setPaginationParams(prev => ({ ...prev, page, size, timestamp: Date.now() }));
        return;
      } catch {}
    }

    PaginationPerPage.handlePageChange(
      _,
      newPage,
      { page: paginationParams.page, size: paginationParams.size },
      linksMap,
      (updater: any) => {
        const next =
          typeof updater === 'function'
            ? updater({ page: paginationParams.page, size: paginationParams.size })
            : updater;
        setPaginationParams(prev => ({
          ...prev,
          page: next.page ?? 0,
          size: next.size ?? prev.size,
          timestamp: Date.now()
        }));
      }
    );
  };

  const handleDoseRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSize = parseInt(event.target.value, 10) || 5;
    setPaginationParams(prev => ({ ...prev, size: newSize, page: 0, timestamp: Date.now() }));
  };

  // ====== Sorting/Paging (Intervals)
  const handleIntervalSortChange = (col: string, type: 'asc' | 'desc') => {
    if (!col) return;
    setIntervalSortBy(col);
    setIntervalSort(type ?? 'asc');
  };
  const handleIntervalPageChange = (_: unknown, newPage: number) => {
    const currentPage = intervalPage;
    const linksMap = intervalsLinks || {};
    let targetLink: string | null | undefined = null;

    if (newPage > currentPage && linksMap.next) targetLink = linksMap.next;
    else if (newPage < currentPage && linksMap.prev) targetLink = linksMap.prev;
    else if (newPage === 0 && linksMap.first) targetLink = linksMap.first;
    else if (newPage > currentPage + 1 && linksMap.last) targetLink = linksMap.last;

    if (targetLink && (PaginationPerPage as any).extractPaginationFromLink) {
      try {
        const { page, size } = (PaginationPerPage as any).extractPaginationFromLink(targetLink);
        setIntervalPage(page);
        setIntervalSize(size);
        return;
      } catch {}
    }

    setIntervalPage(newPage);
  };
  const handleIntervalRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setIntervalSize(parseInt(event.target.value, 10) || 5);
    setIntervalPage(0);
  };

  // ====== UI
  const conjureFormContentOfMainModal = (stepNumber: number) => {
    switch (stepNumber) {
      case 0:
        return (
          <Form fluid layout="inline">
            <div className="container-of-vaccine-info">
              <div className="left-fields">
                <MyInput
                  width={160}
                  fieldLabel="Vaccine Name"
                  fieldName="name"
                  record={vaccine}
                  placeholder="Medical Component"
                  disabled
                />
                <MyInput
                  width={160}
                  fieldType="select"
                  fieldLabel="Number of Doses"
                  selectData={numOfDosesEnum ?? []}
                  selectDataLabel="label"
                  selectDataValue="value"
                  fieldName="numberOfDoses"
                  record={vaccine}
                  disabled
                />
              </div>

              <MyButton
                prefixIcon={() => <AddOutlineIcon />}
                color="var(--deep-blue)"
                onClick={() => {
                  setVaccineDose({
                    ...newVaccineDose,
                    isBooster: false,
                    vaccineId: vaccine?.id ?? 0
                  });
                  setChildStep(0);
                  setOpenChildModal(true);
                }}
                width="90px"
                disabled={
                  !vaccine?.id ||
                  !numberOfDoses ||
                  isFetchingUpTo ||
                  (upToDoseNumbers ?? []).every(code => existingDoseNumbers.has(code))
                }
              >
                Add
              </MyButton>
            </div>

            <MyTable
              height={250}
              data={vaccine?.id ? dosesData : []}
              totalCount={dosesTotal}
              loading={isFetchingDoses}
              columns={tableDosesColumns}
              rowClassName={(rowData: any) =>
                rowData && vaccineDose && vaccineDose.id === rowData.id ? 'selected-row' : ''
              }
              onRowClick={(rowData: any) => {
                setVaccineDose({
                  ...rowData,
                  vaccineId: rowData?.vaccineId ?? vaccine?.id,
                  doseNumber: rowData?.doseNumber,
                  fromAgeUnit: rowData?.fromAgeUnit,
                  toAgeUnit: rowData?.toAgeUnit
                });
              }}
              sortColumn={sortColumn}
              sortType={sortType}
              onSortChange={handleDoseSortChange}
              page={paginationParams.page}
              rowsPerPage={paginationParams.size}
              onPageChange={handleDosePageChange}
              onRowsPerPageChange={handleDoseRowsPerPageChange}
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
                    ...newVaccineDosesInterval,
                    vaccineId: vaccine?.id,
                    isActive: true
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
              data={vaccine?.id ? intervalsData : []}
              totalCount={intervalsTotal}
              loading={isFetchingIntervals}
              columns={tableIntervalBetweenDosesColumns}
              rowClassName={(rowData: any) =>
                rowData && vaccineDoseInterval && vaccineDoseInterval.id === rowData.id
                  ? 'selected-row'
                  : ''
              }
              onRowClick={(rowData: any) => setVaccineDoseInterval(rowData)}
              sortColumn={intervalSortBy}
              sortType={intervalSort}
              onSortChange={handleIntervalSortChange}
              page={intervalPage}
              rowsPerPage={intervalSize}
              onPageChange={handleIntervalPageChange}
              onRowsPerPageChange={handleIntervalRowsPerPageChange}
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
              fieldName="doseNumber"
              selectData={doseNumberOptions}
              selectDataLabel="label"
              selectDataValue="value"
              record={vaccineDose}
              setRecord={setVaccineDose}
              loading={isFetchingUpTo}
              disabled={!numberOfDoses}
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
                selectData={AgeUnit ?? []}
                selectDataLabel="label"
                selectDataValue="value"
                fieldName="fromAgeUnit"
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
                selectData={AgeUnit ?? []}
                selectDataLabel="label"
                selectDataValue="value"
                fieldName="toAgeUnit"
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
                fieldName="unit"
                selectData={AgeUnit ?? []}
                selectDataLabel="label"
                selectDataValue="value"
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
              fieldName="fromDoseId"
              selectData={dosesList}
              selectDataLabel="label"
              selectDataValue="value"
              record={vaccineDoseInterval}
              setRecord={rec => {
                setVaccineDoseInterval(rec);
                if (vaccine?.id && rec?.fromDoseId) {
                  triggerGetNextDoses({ vaccineId: vaccine.id, fromDoseId: rec.fromDoseId });
                }
              }}
              menuMaxHeight={200}
            />
            <MyInput
              required
              width={350}
              column
              fieldLabel="To Dose"
              fieldType="select"
              fieldName="toDoseId"
              selectData={nextDosesOptions}
              selectDataLabel="label"
              selectDataValue="value"
              record={vaccineDoseInterval}
              setRecord={setVaccineDoseInterval}
              menuMaxHeight={200}
              disabled={!nextDosesOptions?.length}
            />
          </Form>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <ChildModal
        actionButtonLabel={vaccine?.id ? 'Save' : 'Create'}
        actionChildButtonFunction={childStep === 1 ? handleSaveInterval : handleSaveVaccineDoses}
        open={open}
        setOpen={setOpen}
        showChild={openChildModal}
        setShowChild={setOpenChildModal}
        title="Dose Schedule"
        mainContent={conjureFormContentOfMainModal}
        mainStep={[
          { title: 'Doses', icon: <FaSyringe />, disabledNext: !vaccine?.id },
          { title: 'Interval Between Doses', icon: <MdOutlineAccessTime /> }
        ]}
        childTitle={childStep === 1 ? 'Add / Edit Interval' : 'Add / Edit Dose'}
        childContent={conjureFormContentOfChildModal}
        mainSize="sm"
        hideActionBtn={true}
      />

      {/* Confirm Dose Activate/Deactivate */}
      <DeletionConfirmationModal
        open={openDoseConfirm}
        setOpen={setOpenDoseConfirm}
        itemToDelete="Dose"
        actionButtonFunction={handleConfirmToggleDose}
        actionType={doseConfirmMode}
      />

      {/* Confirm Interval Activate/Deactivate */}
      <DeletionConfirmationModal
        open={openIntervalConfirm}
        setOpen={setOpenIntervalConfirm}
        itemToDelete="Interval"
        actionButtonFunction={handleConfirmToggleInterval}
        actionType={intervalConfirmMode}
      />
    </>
  );
};

export default DoesSchedule;
