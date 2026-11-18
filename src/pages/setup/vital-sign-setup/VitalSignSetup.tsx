import React, { useEffect, useMemo, useState } from 'react';
import { Form, Panel } from 'rsuite';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { MdModeEdit } from 'react-icons/md';
import { FaHeartPulse } from 'react-icons/fa6';
import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';
import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import MyButton from '@/components/MyButton/MyButton';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { hideSystemLoader, notify, showSystemLoader } from '@/utils/uiReducerActions';
import { extractErrorMessage } from '@/utils/extractErrorMessage';
import {
  VitalSignRange,
  useCreateVitalSignRangeMutation,
  useGetVitalSignRangesQuery,
  useGetVitalSignTypesQuery,
  useUpdateVitalSignRangeMutation
} from '@/services/setup/vital-sign-range/vitalSignRangeService';

// Display names for the measurement keys the Vital Signs form already uses.
export const VITAL_SIGN_LABELS: Record<string, string> = {
  bloodPressureSystolic: 'Blood Pressure Systolic',
  bloodPressureDiastolic: 'Blood Pressure Diastolic',
  heartRate: 'Heart Rate',
  temperature: 'Temperature',
  oxygenSaturation: 'Oxygen Saturation',
  respiratoryRate: 'Respiratory Rate'
};

const ageUnitOptions = [
  { label: 'Months', value: 'MONTHS' },
  { label: 'Years', value: 'YEARS' }
];

type AgeUnit = 'MONTHS' | 'YEARS';

/** Form state of the modal; ages are typed in months or years and stored as whole months. */
type RangeForm = {
  id?: number;
  vitalSignKey?: string;
  ageFrom?: number | string | null;
  ageFromUnit: AgeUnit;
  ageTo?: number | string | null;
  ageToUnit: AgeUnit;
  normalMin?: number | string | null;
  normalMax?: number | string | null;
};

type Row = Partial<VitalSignRange> & { vitalSignKey: string; unit?: string | null };

const emptyForm: RangeForm = { ageFromUnit: 'YEARS', ageToUnit: 'YEARS', ageFrom: 0 };

const isBlank = (value: unknown) =>
  value === null || value === undefined || (typeof value === 'string' && value.trim() === '');

/** Blank → null (not configured). Anything else must be a finite number, otherwise NaN. */
const parseLimit = (value: unknown): number | null => {
  if (isBlank(value)) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : NaN;
};

/** Blank → null. Otherwise a whole number of months/years ≥ 0 converted to months; invalid → NaN. */
const parseAgeMonths = (value: unknown, unit: AgeUnit): number | null => {
  if (isBlank(value)) return null;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0) return NaN;
  return unit === 'YEARS' ? n * 12 : n;
};

const formatAge = (months?: number | null) => {
  if (months === null || months === undefined) return '-';
  return months > 0 && months % 12 === 0 ? `${months / 12} years` : `${months} months`;
};

const formToMonths = (months?: number | null): { value: number | null; unit: AgeUnit } => {
  if (months === null || months === undefined) return { value: null, unit: 'YEARS' };
  return months > 0 && months % 12 === 0
    ? { value: months / 12, unit: 'YEARS' }
    : { value: months, unit: 'MONTHS' };
};

const emptyIfNull = (value?: number | null) => (value === null || value === undefined ? '-' : value);

const VitalSignSetup = () => {
  const dispatch = useAppDispatch();
  // Same source as the menu: the user's screens with their operations (VIEW / EDIT) from /api/setup/menu.
  // View-only users can read the ranges but get no Add / Edit controls (the backend also refuses their writes).
  const menu = useAppSelector(state => state.auth.menu);
  const canEdit = (menu ?? []).some(
    (item: any) => item?.screen === 'VITAL_SIGN_SETUP' && (item?.operations ?? []).includes('EDIT')
  );
  const [form, setForm] = useState<RangeForm>({ ...emptyForm });
  const [popupOpen, setPopupOpen] = useState(false);
  const [width, setWidth] = useState<number>(window.innerWidth);

  const { data: ranges = [], isFetching } = useGetVitalSignRangesQuery();
  const { data: vitalSignTypes = [] } = useGetVitalSignTypesQuery();
  const [createRange] = useCreateVitalSignRangeMutation();
  const [updateRange] = useUpdateVitalSignRangeMutation();

  useEffect(() => {
    dispatch(setPageCode('Vital_Sign_Setup'));
    dispatch(setDivContent('Vital Sign Setup'));
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch]);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Saved age rules, plus one empty row for each vital sign that has none yet (so it stays selectable).
  const rows: Row[] = useMemo(() => {
    const configuredKeys = new Set(ranges.map(r => r.vitalSignKey));
    const placeholders: Row[] = vitalSignTypes
      .filter(t => !configuredKeys.has(t.vitalSignKey))
      .map(t => ({ vitalSignKey: t.vitalSignKey, unit: t.unit }));
    return [...ranges, ...placeholders].sort(
      (a, b) =>
        Object.keys(VITAL_SIGN_LABELS).indexOf(a.vitalSignKey) -
          Object.keys(VITAL_SIGN_LABELS).indexOf(b.vitalSignKey) ||
        (a.ageFromMonths ?? 0) - (b.ageFromMonths ?? 0)
    );
  }, [ranges, vitalSignTypes]);

  const vitalSignOptions = vitalSignTypes.map(t => ({
    label: VITAL_SIGN_LABELS[t.vitalSignKey] ?? t.vitalSignKey,
    value: t.vitalSignKey
  }));

  const openNew = (vitalSignKey?: string) => {
    setForm({ ...emptyForm, vitalSignKey });
    setPopupOpen(true);
  };

  const openEdit = (row: Row) => {
    if (!row.id) {
      openNew(row.vitalSignKey);
      return;
    }
    const from = formToMonths(row.ageFromMonths);
    const to = formToMonths(row.ageToMonths);
    setForm({
      id: row.id,
      vitalSignKey: row.vitalSignKey,
      ageFrom: from.value,
      ageFromUnit: from.unit,
      ageTo: to.value,
      ageToUnit: to.unit,
      normalMin: row.normalMin ?? null,
      normalMax: row.normalMax ?? null
    });
    setPopupOpen(true);
  };

  const handleSave = async () => {
    const warn = (msg: string) => dispatch(notify({ msg, sev: 'warning' }));

    if (!form.id && !form.vitalSignKey) {
      warn('Vital Sign is required');
      return;
    }
    if (isBlank(form.ageFrom)) {
      warn('Age From is required');
      return;
    }
    const ageFromMonths = parseAgeMonths(form.ageFrom, form.ageFromUnit);
    if (ageFromMonths === null || Number.isNaN(ageFromMonths)) {
      warn('Age From must be a whole number, 0 or more');
      return;
    }
    const ageToMonths = parseAgeMonths(form.ageTo, form.ageToUnit);
    if (Number.isNaN(ageToMonths)) {
      warn('Age To must be a whole number, 0 or more');
      return;
    }
    if (ageToMonths !== null && ageToMonths <= ageFromMonths) {
      warn('Age To must be greater than Age From');
      return;
    }
    const normalMin = parseLimit(form.normalMin);
    const normalMax = parseLimit(form.normalMax);
    if (Number.isNaN(normalMin)) {
      warn('Normal Min must be a number');
      return;
    }
    if (Number.isNaN(normalMax)) {
      warn('Normal Max must be a number');
      return;
    }
    if (normalMin !== null && normalMax !== null && normalMin > normalMax) {
      warn('Normal Min must be less than or equal to Normal Max');
      return;
    }

    const body = { ageFromMonths, ageToMonths, normalMin, normalMax };
    try {
      dispatch(showSystemLoader());
      if (form.id) {
        await updateRange({ id: form.id, body }).unwrap();
      } else {
        await createRange({ vitalSignKey: form.vitalSignKey as string, ...body }).unwrap();
      }
      dispatch(notify({ msg: 'Vital sign range saved successfully', sev: 'success' }));
      setPopupOpen(false);
    } catch (err) {
      dispatch(
        notify({ msg: extractErrorMessage(err) || 'Failed to save vital sign range', sev: 'error' })
      );
    } finally {
      dispatch(hideSystemLoader());
    }
  };

  const isSelected = (rowData: Row) =>
    rowData && rowData.id && rowData.id === form.id ? 'selected-row' : '';

  const tableColumns = [
    {
      key: 'vitalSignKey',
      title: <Translate>Vital Sign</Translate>,
      flexGrow: 3,
      render: (rowData: Row) => (
        <Translate>{VITAL_SIGN_LABELS[rowData.vitalSignKey] ?? rowData.vitalSignKey}</Translate>
      )
    },
    { key: 'unit', title: <Translate>Unit</Translate>, flexGrow: 1 },
    {
      key: 'ageFromMonths',
      title: <Translate>Age From</Translate>,
      flexGrow: 1,
      render: (rowData: Row) => (rowData.id ? formatAge(rowData.ageFromMonths) : '-')
    },
    {
      key: 'ageToMonths',
      title: <Translate>Age To</Translate>,
      flexGrow: 1,
      render: (rowData: Row) =>
        rowData.id ? (
          rowData.ageToMonths === null || rowData.ageToMonths === undefined ? (
            <Translate>No upper limit</Translate>
          ) : (
            formatAge(rowData.ageToMonths)
          )
        ) : (
          '-'
        )
    },
    {
      key: 'normalMin',
      title: <Translate>Normal Min</Translate>,
      flexGrow: 1,
      render: (rowData: Row) => emptyIfNull(rowData.normalMin)
    },
    {
      key: 'normalMax',
      title: <Translate>Normal Max</Translate>,
      flexGrow: 1,
      render: (rowData: Row) => emptyIfNull(rowData.normalMax)
    },
    ...(canEdit
      ? [
    {
      key: 'icons',
      title: <Translate>Actions</Translate>,
      flexGrow: 1,
      render: (rowData: Row) => (
        <div className="container-of-icons">
          <MdModeEdit
            className="icons-style"
            title="Edit"
            size={24}
            fill="var(--primary-gray)"
            onClick={() => openEdit(rowData)}
          />
        </div>
      )
    }
        ]
      : [])
  ];

  const direction = localStorage.getItem('direction') || 'LTR';
  const dir = direction === 'RTL' ? 'rtl' : 'ltr';

  const ageField = (
    label: string,
    valueField: 'ageFrom' | 'ageTo',
    unitField: 'ageFromUnit' | 'ageToUnit'
  ) => (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
      <div style={{ flex: 2 }}>
        <MyInput
          width="100%"
          fieldName={valueField}
          fieldLabel={label}
          fieldType="number"
          record={form}
          setRecord={setForm}
        />
      </div>
      <div style={{ flex: 1 }}>
        <MyInput
          width="100%"
          fieldName={unitField}
          fieldLabel={`${label} (unit)`}
          showLabel={false}
          fieldType="select"
          selectData={ageUnitOptions}
          selectDataLabel="label"
          selectDataValue="value"
          record={form}
          setRecord={setForm}
          searchable={false}
          cleanable={false}
        />
      </div>
    </div>
  );

  return (
    <Panel dir={dir}>
      <MyTable
        data={rows}
        totalCount={rows.length}
        loading={isFetching}
        columns={tableColumns}
        rowClassName={isSelected}
        tableButtons={
          canEdit && (
          <div className="container-of-add-new-button">
            <MyButton
              prefixIcon={() => <AddOutlineIcon />}
              color="var(--deep-blue)"
              onClick={() => openNew()}
              width="109px"
            >
              Add New
            </MyButton>
          </div>
          )
        }
      />

      <MyModal
        open={popupOpen}
        setOpen={setPopupOpen}
        title={form.id ? 'Edit Vital Sign Range' : 'Add Vital Sign Range'}
        position="right"
        content={() => (
          <Form fluid dir={dir}>
            <MyInput
              width="100%"
              fieldName="vitalSignKey"
              fieldLabel="Vital Sign"
              fieldType="select"
              selectData={vitalSignOptions}
              selectDataLabel="label"
              selectDataValue="value"
              record={form}
              setRecord={setForm}
              searchable={false}
              cleanable={false}
              disabled={!!form.id}
            />
            {ageField('Age From', 'ageFrom', 'ageFromUnit')}
            {ageField('Age To', 'ageTo', 'ageToUnit')}
            <p style={{ fontSize: 12, color: 'var(--primary-gray)', margin: '8px 0' }}>
              Age From is inclusive and Age To is exclusive. Leave Age To empty for no upper limit.
              Ranges of the same vital sign cannot overlap.
            </p>
            <MyInput
              width="100%"
              fieldName="normalMin"
              fieldLabel="Normal Min"
              fieldType="number"
              allowDecimal
              record={form}
              setRecord={setForm}
            />
            <MyInput
              width="100%"
              fieldName="normalMax"
              fieldLabel="Normal Max"
              fieldType="number"
              allowDecimal
              record={form}
              setRecord={setForm}
            />
          </Form>
        )}
        actionButtonLabel="Save"
        actionButtonFunction={handleSave}
        steps={[{ title: 'Vital Sign Setup', icon: <FaHeartPulse /> }]}
        size={width > 900 ? '36vw' : width > 600 ? '60vw' : '92vw'}
      />
    </Panel>
  );
};

export default VitalSignSetup;
