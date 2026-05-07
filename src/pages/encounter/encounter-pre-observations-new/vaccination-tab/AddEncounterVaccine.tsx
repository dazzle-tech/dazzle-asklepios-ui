import React, { useEffect, useMemo, useState } from 'react';
import AdvancedModal from '@/components/AdvancedModal';
import MyInput from '@/components/MyInput';
import MyLabel from '@/components/MyLabel';
import MyButton from '@/components/MyButton/MyButton';
import InfoCardList from '@/components/InfoCardList';
import { InputGroup, Form, Input, Dropdown } from 'rsuite';
import SearchIcon from '@rsuite/icons/Search';
import clsx from 'clsx';
import './styles.less';

import {
  useAddEncounterVaccinationMutation,
  useUpdateEncounterVaccinationMutation
} from '@/services/encounterMedical/encounterVaccinationService';

import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { useLazyGetActiveVaccinesByNameQuery } from '@/services/vaccine/vaccineService';
import {
  useGetVaccineDosesByVaccineIdQuery,
  useGetNextVaccineDoseQuery
} from '@/services/vaccine/vaccineDosesService';
import { useGetIntervalByFromDoseIdOneQuery } from '@/services/vaccine/vaccineDosesIntervalService';
import { useGetVaccineBrandsByVaccineQuery } from '@/services/vaccine/vaccineBrandsService';

import { useEnumOptions } from '@/services/enumsApi';

import type {
  Vaccine,
  VaccineBrand,
  VaccineDose,
  VaccineDosesInterval,
  EncounterVaccination
} from '@/types/model-types-new';

import {
  newEncounterVaccination,
  newVaccine,
  newVaccineBrand,
  newVaccineDose,
  newVaccineDosesInterval
} from '@/types/model-types-constructor-new';

import { useAppDispatch, useAppSelector } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { extractPaginationFromLink } from '@/utils/paginationHelper';
import Translate from '@/components/Translate';

const ENCOUNTER_VACCINATION_ERROR_MAP: Record<string, string> = {
  'patient.notfound': 'Patient not found.',
  'patient.invalid': 'Invalid patient.',
  'patient.dose.duplicate.active':
    'This patient already has the same vaccine dose recorded (non-cancelled).',
  'vaccine.invalid': 'Invalid vaccine.',
  'dose.invalid': 'Invalid vaccine dose.',
  'brand.invalid': 'Invalid vaccine brand.',
  'cancelledBy.invalid': 'Invalid cancelled-by user.',
  'cancelledBy.required': 'Cancelled-by is required when status is CANCELLED.',
  'cancellationReason.required': 'Cancellation reason is required when status is CANCELLED.',
  'cancelledAt.required': 'Cancelled-at date is required when status is CANCELLED.',
  'reviewedAt.required': 'Reviewed-at date is required when status is REVIEW.',
  'reviewedBy.required': 'Reviewed-by is required when status is REVIEW.',
  'externalFacilityName.required':
    'External facility name is required when "Is External Facility" is enabled.',
  'user.notfound': 'Current user session not found. Please re-login.',
  'id.notfound': 'Encounter vaccination record not found.',
  notfound: 'Encounter vaccination record not found.',
  'db.constraint': 'Database constraint violated while saving encounter vaccination.'
};

const ENCOUNTER_VACCINATION_FIELD_LABELS: Record<string, string> = {
  patientId: 'Patient',
  encounterId: 'Encounter',
  vaccineId: 'Vaccine',
  vaccineBrandId: 'Used Brand',
  vaccineDoseId: 'Dose Number',
  vaccineLotNumber: 'Vaccine Lot Number',
  dateAdministered: 'Date Administered',
  status: 'Status',
  administeredLocation: 'Administered Location',
  administrationReactions: 'Administration Reactions',
  isExternalFacility: 'Is External Facility',
  externalFacilityName: 'External Facility Name',
  cancellationReason: 'Cancellation Reason',
  cancelledAt: 'Cancelled At',
  cancelledBy: 'Cancelled By',
  reviewedAt: 'Reviewed At',
  reviewedById: 'Reviewed By',
  notes: 'Notes'
};

const normalizeFieldErrorMessage = (message: string): string => {
  const lower = (message || '').toLowerCase();
  if (lower.includes('must not be null')) return 'is required';
  if (lower.includes('must not be blank')) return 'must not be blank';
  if (lower.includes('size')) return 'length is out of range';
  if (lower.includes('greater')) return 'value is too small';
  if (lower.includes('less')) return 'value is too large';
  return message || 'invalid value';
};

const getFieldLabel = (field: string): string => ENCOUNTER_VACCINATION_FIELD_LABELS[field] ?? field;

const toHumanEncounterVaccinationError = (error: any): string => {
  const responseData = error?.data ?? error ?? {};
  const traceId = responseData?.traceId || responseData?.requestId || responseData?.correlationId;
  const traceSuffix = traceId ? `\nTrace ID: ${traceId}` : '';

  if (Array.isArray(responseData?.fieldErrors) && responseData.fieldErrors.length > 0) {
    const lines = responseData.fieldErrors.map(
      (fe: any) => `• ${getFieldLabel(fe.field)}: ${normalizeFieldErrorMessage(fe.message)}`
    );
    return `Please fix the following fields:\n${lines.join('\n')}` + traceSuffix;
  }

  const messageProp: string = responseData?.message || '';
  const errorKey: string | undefined =
    (messageProp.startsWith('error.') ? messageProp.substring(6) : undefined) ??
    responseData?.errorKey;

  if (errorKey && ENCOUNTER_VACCINATION_ERROR_MAP[errorKey]) {
    return ENCOUNTER_VACCINATION_ERROR_MAP[errorKey] + traceSuffix;
  }

  const fallback =
    responseData?.detail ||
    responseData?.title ||
    responseData?.message ||
    'Unexpected error occurred.';

  return fallback + traceSuffix;
};

// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  setOpen: (v: boolean) => void;
  patient: any;
  encounter: any;
  encounterVaccination: EncounterVaccination;
  setEncounterVaccination: React.Dispatch<React.SetStateAction<EncounterVaccination>>;
  vaccineObject: Vaccine;
  vaccineDoseObjet: VaccineDose;
  vaccineBrandObject: VaccineBrand;
  refetch: () => void;
  isDisabled?: boolean;
  edit?: boolean;
}

const PAGE_SIZE = 5;

const AddEncounterVaccine = ({
  open,
  setOpen,
  patient,
  encounter,
  encounterVaccination,
  setEncounterVaccination,
  vaccineObject,
  vaccineDoseObjet,
  vaccineBrandObject,
  refetch,
  isDisabled = false,
  edit
}: Props) => {
  const authSlice = useAppSelector(state => state.auth);
  const dispatch = useAppDispatch();

  const [isEncounterStatusClosed, setIsEncounterStatusClosed] = useState(false);
  const [isEncounterVaccineStatusClose, setIsEncounterVacineStatusClose] = useState(false);
  const [isDisabledField, setIsDisabledField] = useState(false);

  const [inputValue, setInputValue] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [vaccinePage, setVaccinePage] = useState(0);
  const [vaccinesAccum, setVaccinesAccum] = useState<Vaccine[]>([]);
  const [hasMoreVaccines, setHasMoreVaccines] = useState(false);
  const [searchSession, setSearchSession] = useState(0);

  const [triggerSearchVaccines, vaccinesSearchState] = useLazyGetActiveVaccinesByNameQuery();

  const executeSearch = () => {
    const q = inputValue.trim();
    if (!q) return;
    setSearchSession(prev => prev + 1);
    setSearchKeyword(q);
    setVaccinePage(0);
    setVaccinesAccum([]);
    setHasMoreVaccines(false);
    triggerSearchVaccines({ name: q, page: 0, size: PAGE_SIZE, sort: 'id,asc' }, true);
  };

  const handleLoadMoreVaccines = () => {
    if (!searchKeyword) return;
    if (vaccinesSearchState.isFetching) return;
    if (!hasMoreVaccines) return;
    const nextPage = vaccinePage + 1;
    setVaccinePage(nextPage);
    triggerSearchVaccines(
      { name: searchKeyword, page: nextPage, size: PAGE_SIZE, sort: 'id,asc' },
      true
    );
  };

  const [vaccine, setVaccine] = useState<Vaccine>({ ...vaccineObject });
  const [vaccineBrand, setVaccineBrand] = useState<VaccineBrand>({ ...vaccineBrandObject });
  const [vaccineDose, setVaccineDose] = useState<VaccineDose>({ ...(newVaccineDose as VaccineDose) });
  const [vaccineToDose, setVaccineToDose] = useState<VaccineDose>({
    ...newVaccineDose,
    doseNumber: ''
  });
  const [intervalRecord, setIntervalRecord] = useState<VaccineDosesInterval>({
    ...(newVaccineDosesInterval as VaccineDosesInterval)
  });

  const [brandPicker, setBrandPicker] = useState<{ vaccineBrandId: number | null }>({
    vaccineBrandId: vaccineBrandObject?.id ?? null
  });
  const [dosePicker, setDosePicker] = useState<{ vaccineDoseId: number | null }>({
    vaccineDoseId: null
  });
  const [administrationReaction, setAdministrationReactions] = useState<{
    administrationReactionsLkey: string | null;
  }>({ administrationReactionsLkey: '' });
  const [externalFacilityToggle, setExternalFacilityToggle] = useState<{
    isExternalFacility: boolean;
  }>({ isExternalFacility: !!(encounterVaccination as any)?.isExternalFacility });

  const [brandPage, setBrandPage] = useState(0);
  const [allBrands, setAllBrands] = useState<VaccineBrand[]>([]);
  const [dosePage, setDosePage] = useState(0);
  const [allDoses, setAllDoses] = useState<VaccineDose[]>([]);

  const [addEncounterVaccination] = useAddEncounterVaccinationMutation();
  const [updateEncounterVaccination] = useUpdateEncounterVaccinationMutation();

  const typeEnumOptions = useEnumOptions('VaccineType');
  const roaEnumOptions = useEnumOptions('MedRoa');
  const numOfDosesEnumOptions = useEnumOptions('NumberOfDoses');
  const unitEnumOptions = useEnumOptions('DurationUnit');

  const { data: manufacturerLovQueryResponse } = useGetLovValuesByCodeQuery('GEN_MED_MANUFACTUR');
  const { data: medAdversLovQueryResponse } = useGetLovValuesByCodeQuery('MED_ADVERS_EFFECTS');

  const activeVaccineId = vaccine?.id as number | undefined;

  const { data: vaccineBrandsPage, refetch: refetchBrands } = useGetVaccineBrandsByVaccineQuery(
    { vaccineId: activeVaccineId, page: brandPage, size: PAGE_SIZE, sort: 'id,asc' },
    { skip: !activeVaccineId }
  );
  const { data: vaccineDosesPage, refetch: refetchDoses } = useGetVaccineDosesByVaccineIdQuery(
    { vaccineId: activeVaccineId, page: dosePage, size: PAGE_SIZE, sort: 'id,asc' },
    { skip: !activeVaccineId }
  );
  const { data: intervalOneData } = useGetIntervalByFromDoseIdOneQuery(
    { fromDoseId: vaccineDose?.id as number },
    { skip: !vaccineDose?.id }
  );
  const { data: nextDoseData } = useGetNextVaccineDoseQuery(
    { id: vaccineDose?.id as number },
    { skip: !vaccineDose?.id }
  );

  const handleClearField = () => {
    setEncounterVaccination({
      ...(newEncounterVaccination as EncounterVaccination),
      status: null
    } as any);
    setExternalFacilityToggle({ isExternalFacility: false });
    setVaccine({ ...(newVaccine as Vaccine) });
    setVaccineBrand({ ...(newVaccineBrand as VaccineBrand) });
    setVaccineDose({ ...(newVaccineDose as VaccineDose) });
    setVaccineToDose({ ...(newVaccineDose as VaccineDose), doseNumber: '' });
    setIntervalRecord({ ...(newVaccineDosesInterval as VaccineDosesInterval) });
    setBrandPicker({ vaccineBrandId: null });
    setDosePicker({ vaccineDoseId: null });
    setAdministrationReactions({ administrationReactionsLkey: null });
    setInputValue('');
    setSearchKeyword('');
    setVaccinePage(0);
    setVaccinesAccum([]);
    setHasMoreVaccines(false);
    setBrandPage(0);
    setAllBrands([]);
    setDosePage(0);
    setAllDoses([]);
  };

  const handleSaveEncounterVaccine = async () => {
    const errors: string[] = [];

    if (!patient?.id) errors.push('• Patient is required.');
    if (!encounter?.id) errors.push('• Encounter is required.');
    if (!vaccine?.id) errors.push('• Vaccine is required.');
    if (!vaccineBrand?.id) errors.push('• Used Brand is required.');
    if (!vaccineDose?.id) errors.push('• Dose Number is required.');
    if (!encounterVaccination?.dateAdministered) errors.push('• Date Administered is required.');

    if (errors.length > 0) {
      dispatch(
        notify({ msg: `Please fix the following fields:\n${errors.join('\n')}`, sev: 'warning' })
      );
      return;
    }

    const payload = {
      ...encounterVaccination,
      vaccineId: vaccine?.id,
      vaccineBrandId: vaccineBrand?.id,
      vaccineDoseId: vaccineDose?.id,
      patientId: Number(patient.id),
      encounterId: encounter.id
    };

    const normalizedPayload = {
      ...payload,
      isExternalFacility: !!(payload as any).isExternalFacility,
      externalFacilityName: (payload as any).isExternalFacility
        ? payload.externalFacilityName ?? ''
        : ''
    };

    try {
      if (!encounterVaccination?.id) {
        await addEncounterVaccination({ ...normalizedPayload, status: 'ACTIVE' }).unwrap();
        dispatch(notify({ msg: 'Encounter Vaccine Added Successfully', sev: 'success' }));
      } else {
        await updateEncounterVaccination({
          id: encounterVaccination.id,
          ...normalizedPayload
        }).unwrap();
        dispatch(notify({ msg: 'Encounter Vaccine Updated Successfully', sev: 'success' }));
      }
      refetch();
      handleClearField();
      setOpen(false);
    } catch (err) {
      const msg = toHumanEncounterVaccinationError(err);
      dispatch(notify({ msg, sev: 'warning' }));
    }
  };

  useEffect(() => {
    setIsEncounterStatusClosed(encounter?.encounterStatus === 'CANCELLED');
  }, [encounter?.encounterStatus]);

  useEffect(() => {
    setIsEncounterVacineStatusClose(encounterVaccination?.status === 'CANCELLED');
  }, [encounterVaccination?.status]);

  useEffect(() => {
    setIsDisabledField(isEncounterStatusClosed || isDisabled || isEncounterVaccineStatusClose);
  }, [isEncounterStatusClosed, isDisabled, isEncounterVaccineStatusClose]);

  const prevVaccineIdRef = React.useRef<number | string | undefined>(undefined);
  useEffect(() => {
    if (!vaccine?.id) return;
    prevVaccineIdRef.current = vaccine.id;
    setBrandPage(0);
    setAllBrands([]);
    setDosePage(0);
    setAllDoses([]);
    refetchBrands();
    refetchDoses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vaccine?.id, open]);

  useEffect(() => {
    const pageData = (vaccinesSearchState.data?.data ?? []) as Vaccine[];
    setVaccinesAccum(prev => {
      if (vaccinePage === 0) return pageData;
      const prevIds = new Set(prev.map(v => v.id));
      const merged = [...prev];
      for (const v of pageData) {
        if (!prevIds.has(v.id)) merged.push(v);
      }
      return merged;
    });
    const totalPages = (vaccinesSearchState.data as any)?.totalPages;
    if (typeof totalPages === 'number') {
      setHasMoreVaccines(vaccinePage + 1 < totalPages);
    } else {
      setHasMoreVaccines(pageData.length === PAGE_SIZE);
    }
  }, [vaccinesSearchState.data, vaccinePage, searchSession]);

  useEffect(() => {
    const pageData = (vaccineBrandsPage?.data ?? []) as VaccineBrand[];
    setAllBrands(prev => {
      if (brandPage === 0) return pageData;
      if (!pageData.length) return prev;
      const prevIds = new Set(prev.map(b => b.id));
      const merged = [...prev];
      for (const b of pageData) {
        if (!prevIds.has(b.id)) merged.push(b);
      }
      return merged;
    });
  }, [vaccineBrandsPage?.data, brandPage]);

  useEffect(() => {
    const pageData = (vaccineDosesPage?.data ?? []) as VaccineDose[];
    setAllDoses(prev => {
      if (dosePage === 0) return pageData;
      if (!pageData.length) return prev;
      const prevIds = new Set(prev.map(d => d.id));
      const merged = [...prev];
      for (const d of pageData) {
        if (!prevIds.has(d.id)) merged.push(d);
      }
      return merged;
    });
  }, [vaccineDosesPage?.data, dosePage]);

  // build administrationReactions string
  useEffect(() => {
    const key = administrationReaction.administrationReactionsLkey;
    if (!key) return;
    const foundItem =
      medAdversLovQueryResponse?.object?.find((item: any) => item.key === key)?.lovDisplayVale ??
      '';
    if (!foundItem) return;
    setEncounterVaccination(prev => {
      const current = (prev.administrationReactions ?? '').trim();
      if (!current) return { ...prev, administrationReactions: foundItem };
      const parts = current.split(',').map(s => s.trim());
      if (parts.includes(foundItem)) return prev;
      return { ...prev, administrationReactions: `${current}, ${foundItem}` };
    });
  }, [
    administrationReaction.administrationReactionsLkey,
    medAdversLovQueryResponse,
    setEncounterVaccination
  ]);

  // intervalRecord sync
  useEffect(() => {
    if (!vaccineDose?.id) {
      setIntervalRecord({ ...(newVaccineDosesInterval as VaccineDosesInterval) });
      return;
    }
    if (intervalOneData) {
      setIntervalRecord(intervalOneData as VaccineDosesInterval);
      return;
    }
    setIntervalRecord({ ...(newVaccineDosesInterval as VaccineDosesInterval) });
  }, [vaccineDose?.id, intervalOneData]);

  // next dose sync
  useEffect(() => {
    if (!vaccineDose?.id) {
      setVaccineToDose({ ...(newVaccineDose as VaccineDose), doseNumber: '' });
      return;
    }
    if (nextDoseData) {
      setVaccineToDose({ ...(newVaccineDose as VaccineDose), ...(nextDoseData as VaccineDose) });
      return;
    }
    if (!intervalOneData) {
      setVaccineToDose({ ...(newVaccineDose as VaccineDose), doseNumber: '' });
      return;
    }
    const interval = intervalOneData as VaccineDosesInterval;
    const toDose = (allDoses as VaccineDose[]).find(d => d.id === interval.toDoseId);
    setVaccineToDose(
      toDose
        ? ({ ...(newVaccineDose as VaccineDose), ...toDose } as VaccineDose)
        : ({ ...(newVaccineDose as VaccineDose), doseNumber: '' } as VaccineDose)
    );
  }, [vaccineDose?.id, nextDoseData, intervalOneData, allDoses]);

  useEffect(() => {
    const isExternal = !!externalFacilityToggle.isExternalFacility;
    setEncounterVaccination(
      prev =>
        ({
          ...prev,
          externalFacilityName: isExternal ? (prev as any).externalFacilityName ?? '' : ''
        } as any)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalFacilityToggle.isExternalFacility]);

  // Direction handling for RTL/LTR
  const direction = localStorage.getItem('direction') || 'LTR';
  const isRTL = direction === 'RTL';

  const dir = isRTL ? 'rtl' : 'ltr';

  // ── Form-safe records: replace null with '' so <input value> is never null ──
  const vaccineForForm = useMemo(
    () => ({ ...vaccine, postOpeningDuration: vaccine.postOpeningDuration ?? '' }),
    [vaccine]
  );
  const vaccineBrandForForm = useMemo(
    () => ({ ...vaccineBrand, volume: vaccineBrand?.volume ?? '' }),
    [vaccineBrand]
  );
  const evForForm = useMemo(
    () => ({
      ...(encounterVaccination as any),
      vaccineLotNumber: encounterVaccination.vaccineLotNumber ?? '',
      administeredLocation: (encounterVaccination as any).administeredLocation ?? '',
      externalFacilityName: (encounterVaccination as any).externalFacilityName ?? '',
      administrationReactions: encounterVaccination.administrationReactions ?? '',
      notes: encounterVaccination.notes ?? ''
    }),
    [encounterVaccination]
  );

  return (
    <AdvancedModal
      open={open}
      setOpen={setOpen}
      isDisabledActionBtn={edit}
      leftTitle={`${vaccine?.name || ''} Vaccine`}
      rightTitle="Add Vaccine"
      size="87vw"
      actionButtonFunction={handleSaveEncounterVaccine}
      footerButtons={
        <MyButton appearance="ghost" onClick={handleClearField}>
          Clear
        </MyButton>
      }
      rightContent={
        <div className={clsx('right-main-container', { 'disabled-panel': edit })} dir={dir}>
          {/* ── Vaccine Name Search ── */}
          <div className="search-list">
            <MyLabel label="Vaccine Name" />
            <InputGroup inside>
              <Input
                disabled={isDisabledField}
                placeholder="Search"
                value={inputValue}
                onChange={value => {
                  setInputValue(value);
                  if (searchKeyword && value.trim() !== searchKeyword) {
                    setVaccinesAccum([]);
                    setHasMoreVaccines(false);
                    setVaccinePage(0);
                    setSearchKeyword('');
                  }
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter') executeSearch();
                }}
              />
              <InputGroup.Button disabled={isDisabledField} onClick={executeSearch}>
                <SearchIcon />
              </InputGroup.Button>
            </InputGroup>

            {!!vaccinesAccum.length && (
              <Dropdown.Menu key={searchSession} className="dropdown-menuresult">
                {vaccinesAccum.map(v => (
                  <Dropdown.Item
                    key={v.id}
                    onClick={() => {
                      setVaccine({ ...(newVaccine as Vaccine), ...v });
                      setVaccineBrand({ ...(newVaccineBrand as VaccineBrand) });
                      setVaccineDose({ ...(newVaccineDose as VaccineDose) });
                      setVaccineToDose({ ...(newVaccineDose as VaccineDose), doseNumber: '' });
                      setIntervalRecord({ ...(newVaccineDosesInterval as VaccineDosesInterval) });
                      setBrandPicker({ vaccineBrandId: null });
                      setDosePicker({ vaccineDoseId: null });
                      prevVaccineIdRef.current = undefined;
                      setInputValue('');
                      setSearchKeyword('');
                      setVaccinesAccum([]);
                      setHasMoreVaccines(false);
                      setVaccinePage(0);
                    }}
                  >
                    {v.name}
                  </Dropdown.Item>
                ))}
                {hasMoreVaccines && (
                  <Dropdown.Item
                    disabled={vaccinesSearchState.isFetching}
                    onClick={e => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleLoadMoreVaccines();
                    }}
                  >
                    <strong>
                      {vaccinesSearchState.isFetching ? 'Loading...' : 'Load more...'}
                    </strong>
                  </Dropdown.Item>
                )}
              </Dropdown.Menu>
            )}
          </div>

          <Form layout="inline" fluid className="fields-container">
            {/* ── Row 2: Vaccin Name | ATC Code | Type | Number Of Doses | ROA ── */}
            <MyInput
              column
              disabled
              fieldType="text"
              fieldLabel="Vaccine Name"
              fieldName="name"
              record={vaccine}
              setRecord={setVaccine}
              required
            />
            <MyInput
              column
              disabled
              fieldType="text"
              fieldLabel="ATC Code"
              fieldName="atcCode"
              record={vaccine}
              setRecord={setVaccine}
            />
            <MyInput
              column
              disabled
              fieldLabel="Type"
              fieldType="select"
              fieldName="type"
              selectData={typeEnumOptions ?? []}
              selectDataLabel="label"
              selectDataValue="value"
              record={vaccine}
              setRecord={setVaccine}
            />
            <MyInput
              column
              disabled
              fieldLabel="Number Of Doses"
              fieldType="select"
              fieldName="numberOfDoses"
              selectData={numOfDosesEnumOptions ?? []}
              selectDataLabel="label"
              selectDataValue="value"
              record={vaccine}
              setRecord={setVaccine}
            />
            <MyInput
              column
              disabled
              fieldLabel="ROA"
              fieldType="select"
              fieldName="roa"
              selectData={roaEnumOptions ?? []}
              selectDataLabel="label"
              selectDataValue="value"
              record={vaccine}
              setRecord={setVaccine}
            />

            {/* ── Row 3: Site Of Administration | Used Brand | Volume | Unit | Vaccine Manufacturer ── */}
            <MyInput
              column
              disabled
              fieldLabel="Site Of Administration"
              fieldName="siteOfAdministration"
              record={vaccine}
              setRecord={setVaccine}
            />
            <MyInput
              column
              required
              fieldLabel="Used Brand"
              fieldType="selectPagination"
              fieldName="vaccineBrandId"
              selectData={allBrands}
              selectDataLabel="name"
              selectDataValue="id"
              record={brandPicker}
              setRecord={setBrandPicker}
              searchable
              cleanable
              hasMore={!!(vaccineBrandsPage as any)?.links?.next}
              onFetchMore={() => {
                const next = (vaccineBrandsPage as any)?.links?.next;
                if (!next) return;
                const { page } = extractPaginationFromLink(next);
                setBrandPage(page);
              }}
              onSelectItem={(item: VaccineBrand | null) => {
                if (!item) {
                  setVaccineBrand({ ...(newVaccineBrand as VaccineBrand) });
                  setBrandPicker({ vaccineBrandId: null });
                  return;
                }
                setVaccineBrand({
                  ...(newVaccineBrand as VaccineBrand),
                  ...(item as VaccineBrand)
                });
                setBrandPicker({ vaccineBrandId: item.id as number });
              }}
              placeholder={vaccineBrand?.name ? vaccineBrand.name : 'Select'}
              disabled={isDisabledField}
            />
            <MyInput
              column
              disabled
              fieldType="text"
              fieldLabel="Volume"
              fieldName="volume"
              record={vaccineBrandForForm}
              setRecord={setVaccineBrand}
            />
            <MyInput
              column
              disabled
              fieldLabel="Unit"
              fieldType="select"
              fieldName="unit"
              selectData={unitEnumOptions ?? []}
              selectDataLabel="label"
              selectDataValue="value"
              record={vaccineBrand}
              setRecord={setVaccineBrand}
            />
            <MyInput
              column
              disabled
              fieldLabel="Vaccine Manufacturer"
              fieldType="select"
              fieldName="manufacture"
              selectData={manufacturerLovQueryResponse?.object ?? []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              record={vaccineBrand}
              setRecord={setVaccineBrand}
            />

            {/* ── Row 4: Vaccine Lot Number | Dose Number | Next Dose | Next Dose Due Date | Administered Location ── */}
            <MyInput
              column
              disabled={isDisabledField}
              fieldType="text"
              fieldLabel="Vaccine Lot Number"
              fieldName="vaccineLotNumber"
              record={evForForm}
              setRecord={setEncounterVaccination}
            />
            <MyInput
              column
              required
              fieldLabel="Dose Number"
              fieldType="selectPagination"
              fieldName="vaccineDoseId"
              selectData={allDoses}
              selectDataLabel="doseNumber"
              selectDataValue="id"
              record={dosePicker}
              setRecord={setDosePicker}
              searchable
              cleanable
              hasMore={!!(vaccineDosesPage as any)?.links?.next}
              onFetchMore={() => {
                const next = (vaccineDosesPage as any)?.links?.next;
                if (!next) return;
                const { page } = extractPaginationFromLink(next);
                setDosePage(page);
              }}
              onSelectItem={(item: VaccineDose | null) => {
                if (!item) {
                  setVaccineDose({ ...(newVaccineDose as VaccineDose) });
                  setDosePicker({ vaccineDoseId: null });
                  return;
                }
                setVaccineDose({ ...(newVaccineDose as VaccineDose), ...(item as VaccineDose) });
                setDosePicker({ vaccineDoseId: item.id as number });
              }}
              placeholder="Select"
              disabled={isDisabledField}
            />
            <MyInput
              column
              disabled
              fieldLabel="Next Dose"
              fieldType="text"
              fieldName="doseNumber"
              record={vaccineToDose}
              setRecord={setVaccineToDose}
            />
            <MyInput
              column
              disabled
              fieldLabel="Next Dose Due Date"
              fieldType="text"
              fieldName="intervalBetweenDoses"
              record={intervalRecord}
              setRecord={setIntervalRecord}
            />
            <MyInput
              column
              disabled={isDisabledField}
              fieldType="text"
              fieldLabel="Administered Location"
              fieldName="administeredLocation"
              record={evForForm}
              setRecord={setEncounterVaccination}
            />

            {/* ── Row 5: Is External Facility | External Facility Name | Date Administered ── */}
            <MyInput
              column
              fieldLabel="Is External Facility"
              fieldType="checkbox"
              fieldName="isExternalFacility"
              record={externalFacilityToggle}
              setRecord={setExternalFacilityToggle}
              disabled={isDisabledField}
            />
            <MyInput
              column
              fieldType="text"
              fieldLabel="External Facility Name"
              fieldName="externalFacilityName"
              record={evForForm}
              setRecord={setEncounterVaccination}
              disabled={isDisabledField || !externalFacilityToggle.isExternalFacility}
            />
            <MyInput
              column
              required
              fieldLabel="Date Administered"
              fieldType="datetime"
              fieldName="dateAdministered"
              record={encounterVaccination}
              setRecord={setEncounterVaccination}
              disabled={isDisabledField}
            />
          </Form>

          {/* ── Row 6: Administration Reactions | Notes ── */}
          <Form layout="inline" fluid className="form-container">
            <div className="inputs-group">
              <MyInput
                column
                width={200}
                fieldLabel="Administration Reactions"
                fieldType="select"
                fieldName="administrationReactionsLkey"
                selectData={medAdversLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={administrationReaction}
                setRecord={setAdministrationReactions}
                disabled={isDisabledField}
              />
              <MyInput
                disabled={isDisabledField}
                showLabel={false}
                fieldType="textarea"
                fieldLabel="Administration Reactions"
                fieldName="administrationReactions"
                record={evForForm}
                setRecord={setEncounterVaccination}
                rows={4}
              />
            </div>
            <MyInput
              disabled={isDisabledField}
              column
              fieldType="textarea"
              fieldLabel="Notes"
              fieldName="notes"
              record={evForForm}
              setRecord={setEncounterVaccination}
              rows={6}
            />
          </Form>
        </div>
      }
      leftContent={
        <div className="left-main-container" dir={dir}>
          <Form layout="inline" fluid className="fields-container">
            <MyInput
              width={160}
              column
              disabled
              fieldLabel="ATC Code"
              fieldName="atcCode"
              record={vaccine}
              setRecord={setVaccine}
            />
            <MyInput
              width={160}
              column
              disabled
              fieldLabel="Post Opening Duration"
              fieldName="postOpeningDuration"
              record={vaccineForForm}
              setRecord={setVaccine}
            />
            <MyInput
              width={160}
              column
              disabled
              fieldLabel="Duration Unit"
              fieldType="select"
              fieldName="durationUnit"
              selectData={unitEnumOptions ?? []}
              selectDataLabel="label"
              selectDataValue="value"
              record={vaccine}
              setRecord={setVaccine}
            />
          </Form>

          <div>
            <h6>
              <Translate>Vaccine Brands</Translate>
            </h6>
            <InfoCardList
              list={vaccine?.id ? allBrands : []}
              fields={['manufacture', 'volume', 'unit', 'marketingAuthorizationHolder', 'isActive']}
              fieldLabels={{
                manufacture: 'Manufacturer',
                volume: 'Volume',
                unit: 'Unit',
                marketingAuthorizationHolder: 'MAH',
                isActive: 'isActive'
              }}
              computedFields={{
                manufacture: (item: any) =>
                  manufacturerLovQueryResponse?.object?.find((i: any) => i.key === item.manufacture)
                    ?.lovDisplayVale || ' ',
                isActive: (item: any) => {
                  const active = allBrands?.find((i: any) => i.id === item.id)?.isActive;
                  return active ? 'Yes' : 'No';
                }
              }}
              titleField="name"
            />
          </div>
        </div>
      }
    />
  );
};

export default AddEncounterVaccine;
