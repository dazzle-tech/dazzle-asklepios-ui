import MyInput from '@/components/MyInput';
import MyLabel from '@/components/MyLabel';
import Translate from '@/components/Translate';
import type { Patient } from '@/types/model-types-new';
import {
  useLazyGetPatientsByAnyDocumentNumberQuery,
  useLazyGetPatientsByArchivingNumberQuery,
  useLazyGetPatientsByDateOfBirthQuery,
  useLazyGetPatientsByFullNameQuery,
  useLazyGetPatientsByMedicalRecordNumberQuery,
  useLazyGetPatientsByPrimaryPhoneQuery
} from '@/services/patient/patientService';
import React, { useEffect, useMemo, useState } from 'react';
import { DatePicker, Form, Input } from 'rsuite';
import { FaXmark } from 'react-icons/fa6';
import { useSelector } from 'react-redux';

type PatientSearchCriterion =
  | 'patientMrn'
  | 'documentNo'
  | 'fullName'
  // | 'archivingNumber'
  // | 'phoneNumber'
  // | 'dob';

type PatientSearchCriterionOrEmpty = PatientSearchCriterion | '';

type PatientSearchProps = {
  value: any | null;
  onChange: (patient: any | null) => void;
  minChars?: number;
  debounceMs?: number;
  width?: number | string;
  criteriaWidthPx?: number;
  inputHeightPx?: number;
  fieldLabel?: string;
  showLabel?: boolean;
  showClear?: boolean;
  /**
   * When this value changes, the component clears its internal search input/DOB and selection.
   * Useful when the parent has a global "Clear" button.
   */
  resetToken?: number;
  /**
   * Controls which criteria appear in the dropdown.
   * Default: full set of supported criteria.
   */
  criteriaOptions?: PatientSearchCriterion[];
  /** Min width of the outer wrapper; lower (e.g. 0) for dense filter toolbars. @default 320 */
  containerMinWidth?: number | string;
};

const PatientSearch: React.FC<PatientSearchProps> = ({
  value,
  onChange,
  minChars = 3,
  debounceMs = 300,
  width = '26vw',
  criteriaWidthPx = 190,
  inputHeightPx = 30,
  fieldLabel = 'Search patient',
  showLabel = true,
  showClear = true,
  resetToken = 0,
  criteriaOptions,
  containerMinWidth = 320
}) => {
  const mode = useSelector((state: any) => state.ui.mode);
  // Default should be the first option in the allowed criteria; if none exist, keep it empty.
  const [selectedCriterion, setSelectedCriterion] = useState<PatientSearchCriterionOrEmpty>('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [dobValue, setDobValue] = useState<Date | null>(null);
  const [results, setResults] = useState<any[]>([]);
  const [isFetchingPatients, setIsFetchingPatients] = useState(false);

  const [fetchByMrn] = useLazyGetPatientsByMedicalRecordNumberQuery();
  const [fetchByArchiving] = useLazyGetPatientsByArchivingNumberQuery();
  const [fetchByPrimaryPhone] = useLazyGetPatientsByPrimaryPhoneQuery();
  const [fetchByDob] = useLazyGetPatientsByDateOfBirthQuery();
  const [fetchByFullName] = useLazyGetPatientsByFullNameQuery();
  const [fetchByDocumentNo] = useLazyGetPatientsByAnyDocumentNumberQuery();

  const toDisplayPatient = (p: Patient) => {
    const first = String((p as any)?.firstName ?? '').trim();
    const second = String((p as any)?.secondName ?? '').trim();
    const third = String((p as any)?.thirdName ?? '').trim();
    const last = String((p as any)?.lastName ?? '').trim();
    const fullName = [first, second, third, last].filter(Boolean).join(' ').trim() || '-';
    const mrn = (p as any)?.medicalRecordNumber ?? (p as any)?.patientMrn ?? undefined;

    return {
      ...(p as any),
      id: (p as any)?.id,
      key: (p as any)?.id,
      fullName,
      patientMrn: mrn,
      medicalRecordNumber: mrn
    };
  };

  const effectiveCriteriaOptions = useMemo<PatientSearchCriterion[]>(() => {
    const defaults: PatientSearchCriterion[] = [
      'fullName',
      'patientMrn',
      'documentNo',
      // 'archivingNumber',
      // 'phoneNumber',
      // 'dob'
    ];
    const list = (criteriaOptions?.length ? criteriaOptions : defaults).filter(Boolean);
    // de-dupe
    return Array.from(new Set(list));
  }, [criteriaOptions]);

  const searchCriteriaOptions = useMemo(() => {
    const mapLabel = (value: PatientSearchCriterion) => {
      switch (value) {
        case 'patientMrn':
          return <Translate>MRN</Translate>;
        case 'documentNo':
          return <Translate>Document Number</Translate>;
        case 'fullName':
          return <Translate>Full Name</Translate>;
        // case 'archivingNumber':
        //   return <Translate>Archiving Number</Translate>;
        // case 'phoneNumber':
        //   return <Translate>Primary Phone Number</Translate>;
        // case 'dob':
        //   return <Translate>Date Of Birth</Translate>;
      }
    };

    return effectiveCriteriaOptions
      .map(v => ({ label: mapLabel(v), value: v }))
      .map(option => ({
        ...option,
        label: <span style={{ textTransform: 'capitalize' }}>{option.label}</span>
      }));
  }, [effectiveCriteriaOptions]);

  useEffect(() => {
    // Default to the first available option; if the current selection is no longer valid, reset.
    setSelectedCriterion(prev => {
      if (prev && effectiveCriteriaOptions.includes(prev as PatientSearchCriterion)) return prev;
      return effectiveCriteriaOptions[0] ?? '';
    });
  }, [effectiveCriteriaOptions]);

  useEffect(() => {
    // reset local inputs when criterion changes; also clear selection in parent
    setSearchKeyword('');
    setDobValue(null);
    onChange(null);
    setResults([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCriterion]);

  useEffect(() => {
    // external reset (e.g. page-level Clear button)
    setSearchKeyword('');
    setDobValue(null);
    onChange(null);
    setResults([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetToken]);

  useEffect(() => {
    // if (selectedCriterion === 'dob') return;
    if (selectedCriterion && !effectiveCriteriaOptions.includes(selectedCriterion as PatientSearchCriterion)) {
      setSelectedCriterion(effectiveCriteriaOptions[0] ?? '');
    }
  }, [effectiveCriteriaOptions, selectedCriterion]);

  useEffect(() => {
    // once a patient is selected, stop searching
    if (value) {
      setResults([]);
    }
  }, [value]);

  useEffect(() => {
    // auto-search patients when typing >= minChars (debounced)
    if (value) return;
    // if (selectedCriterion === 'dob') return;
    if (!selectedCriterion) return;

    if (!searchKeyword || searchKeyword.length < minChars) {
      setResults([]);
      return;
    }

    const t = setTimeout(() => {
      const run = async () => {
        setIsFetchingPatients(true);
        try {
          const common = { page: 0, size: 20, sort: 'id,asc', timestamp: Date.now() };
          let res: any = null;

          switch (selectedCriterion) {
            case 'patientMrn':
              res = await fetchByMrn({ medicalRecordNumber: searchKeyword, ...common } as any).unwrap();
              break;
            case 'documentNo':
              res = await fetchByDocumentNo({ number: searchKeyword, ...common } as any).unwrap();
              break;
            // case 'archivingNumber':
            //   res = await fetchByArchiving({ archivingNumber: searchKeyword, ...common } as any).unwrap();
            //   break;
            // case 'phoneNumber':
            //   res = await fetchByPrimaryPhone({ phone: searchKeyword, ...common } as any).unwrap();
            //   break;
            case 'fullName':
            default:
              res = await fetchByFullName({ keyword: searchKeyword, ...common } as any).unwrap();
              break;
          }

          const rows = (res?.data ?? res?.content ?? []) as Patient[];
          setResults((rows ?? []).map(toDisplayPatient));
        } catch (e) {
          setResults([]);
        } finally {
          setIsFetchingPatients(false);
        }
      };

      run();
    }, debounceMs);

    return () => clearTimeout(t);
  }, [searchKeyword, selectedCriterion, value, minChars, debounceMs, effectiveCriteriaOptions]);

  useEffect(() => {
    // auto-search patients when picking DOB
    if (value) return;
    // if (selectedCriterion !== 'dob') return;

    if (!dobValue) {
      setResults([]);
      return;
    }

    try {
      const year = dobValue.getFullYear();
      const month = String(dobValue.getMonth() + 1).padStart(2, '0');
      const day = String(dobValue.getDate()).padStart(2, '0');
      const searchValue = `${year}-${month}-${day}`;

      const run = async () => {
        setIsFetchingPatients(true);
        try {
          const res = await fetchByDob({
            date: searchValue,
            page: 0,
            size: 20,
            sort: 'id,asc',
            timestamp: Date.now()
          } as any).unwrap();

          const rows = (res?.data ?? res?.content ?? []) as Patient[];
          setResults((rows ?? []).map(toDisplayPatient));
        } catch (e) {
          setResults([]);
        } finally {
          setIsFetchingPatients(false);
        }
      };

      run();
    } catch (e) {
      console.error('Invalid date:', e);
      setResults([]);
    }
  }, [dobValue, selectedCriterion, value]);

  // const showPatientResults =
  //   !value && (selectedCriterion === 'dob' ? !!dobValue : searchKeyword.length >= minChars);
  const showPatientResults =
    !value && (searchKeyword.length >= minChars);

  return (
    <Form.Group
      className={`my-input-container patient-search ${mode === 'light' ? 'light' : 'dark'}`}
      style={{ position: 'relative', width, minWidth: containerMinWidth }}
    >
      {showLabel ? (
        <Form.ControlLabel style={{ marginBottom: 2 }}>
          <MyLabel
            label={fieldLabel}
            color={mode === 'light' ? 'var(--black)' : 'var(--white)'}
          />
        </Form.ControlLabel>
      ) : null}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'nowrap' }}>
        <div style={{ flex: `0 0 ${criteriaWidthPx}px`, minWidth: criteriaWidthPx }}>
          <MyInput
            fieldType="select"
            fieldName="searchCriteria"
            selectData={searchCriteriaOptions}
            selectDataLabel="label"
            selectDataValue="value"
            showLabel={false}
            searchable={false}
            cleanable={false}
            width="100%"
            height={inputHeightPx}
            record={{ searchCriteria: selectedCriterion }}
            setRecord={r => {
              const newValue = r?.searchCriteria;
              if (!newValue) return;
              setSelectedCriterion(newValue);
            }}
            placeholder="Select Search Criteria"
          />
        </div>

        {value ? (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flex: 1, minWidth: 0 }}>
            <div
              style={{
                flex: 1,
                minWidth: 0,
                fontSize: 12,
                border: '1px solid var(--rs-border-primary)',
                borderRadius: 6,
                height: inputHeightPx,
                padding: '0 8px',
                background: 'var(--rs-bg-overlay)',
                color: mode === 'light' ? 'var(--black)' : 'var(--white)'
              }}
            >
              <div
                style={{
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis'
                }}
              >
                <strong style={{ overflow: 'hidden', textOverflow: 'ellipsis'}}>
                  {value?.fullName ?? ''}
                </strong>
                <span style={{ marginLeft: 6, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {value?.patientMrn ? `(MRN: ${value.patientMrn})` : ''}
                </span>
              </div>
            </div>
            {showClear && (
              <span
                role="button"
                tabIndex={0}
                aria-label="Clear selected patient"
                title="Clear"
                onClick={() => {
                  onChange(null);
                  setSearchKeyword('');
                  setDobValue(null);
                  setResults([]);
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onChange(null);
                    setSearchKeyword('');
                    setDobValue(null);
                    setResults([]);
                  }
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: inputHeightPx,
                  height: inputHeightPx,
                  borderRadius: 6,
                  border: 'none',
                  color: '#ff4d4f',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                <FaXmark />
              </span>
            )}
          </div>
        ) 
        // : selectedCriterion === 'dob' ? (
        //   <div style={{ flex: 1, minWidth: 0 }}>
        //     <DatePicker
        //       format="yyyy-MM-dd"
        //       placeholder="DOB"
        //       value={dobValue}
        //       onChange={v => setDobValue(v)}
        //       oneTap
        //       style={{ width: '100%', height: inputHeightPx }}
        //     />
        //   </div>
        // )
         : (
          <div style={{ flex: 1, minWidth: 0 }}>
            <Input
              placeholder="Search Patients"
              value={searchKeyword}
              onChange={v => setSearchKeyword(v)}
              disabled={!selectedCriterion}
              style={{ width: '100%', height: inputHeightPx }}
            />
          </div>
        )}
      </div>

      {showPatientResults && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            width: '100%',
            background: 'var(--rs-bg-overlay)',
            border: '1px solid var(--rs-border-primary)',
            borderRadius: 6,
            marginTop: 6,
            zIndex: 2000,
            maxHeight: 260,
            overflowY: 'auto'
          }}
        >
          {isFetchingPatients ? (
            <div style={{ padding: 10, fontSize: 12 }}>
              <Translate>Searching...</Translate>
            </div>
          ) : results.length ? (
            results.slice(0, 20).map((p: any) => (
              <div
                key={p?.key ?? p?.id ?? p?.medicalRecordNumber ?? p?.patientMrn ?? Math.random()}
                style={{
                  padding: '8px 10px',
                  cursor: 'pointer',
                  borderBottom: '1px solid var(--rs-border-primary)'
                }}
                onClick={() => {
                  onChange(p);
                  setResults([]);
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, color: mode === 'light' ? 'var(--black)' : 'var(--white)' }}>{p?.fullName ?? ''}</div>
                <div style={{ fontSize: 12, opacity: 0.8, color: mode === 'light' ? 'var(--black)' : 'var(--white)' }}>
                  {p?.patientMrn ? `MRN: ${p.patientMrn}` : ''}
                  {p?.documentNo ? ` • Doc: ${p.documentNo}` : ''}
                </div>
              </div>
            ))
          ) : (
            <div style={{ padding: 10, fontSize: 12, color: mode === 'light' ? 'var(--black)' : 'var(--white)' }}>
              <Translate>No patients found.</Translate>
            </div>
          )}
        </div>
      )}
    </Form.Group>
  );
};

export default PatientSearch;


