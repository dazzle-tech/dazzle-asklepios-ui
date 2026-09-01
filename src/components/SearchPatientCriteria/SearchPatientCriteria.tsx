import React, { useCallback, useEffect, useMemo } from 'react';
import MyInput from '../MyInput';
import './styles.less';
import { FaSearch } from 'react-icons/fa';

interface SearchPatientCriteriaProps {
  record: any;
  setRecord: (value: any) => void;
  onSearchClick?: () => void;
  searchMarginTop?: string | number;
  searchOnIconClickOnly?: boolean;
  liveSearchMinLength?: number;
}

const SearchPatientCriteria: React.FC<SearchPatientCriteriaProps> = ({
  record,
  setRecord,
  onSearchClick,
  searchMarginTop = '0.9vw',
  searchOnIconClickOnly = false,
  liveSearchMinLength = 3
}) => {

  const commit = useCallback(
    (patch: any) => {
      setRecord((prev: any) => ({
        ...(prev ?? {}),
        ...(record ?? {}),
        ...(patch ?? {})
      }));
    },
    [setRecord, record]
  );

  useEffect(() => {
    if (record?.searchByField === undefined || record?.searchByField === null || record?.searchByField === '') {
      commit({ searchByField: 'fullName' });
    }
  }, [record?.searchByField, commit]);

  const searchOptions = useMemo(
    () => [
      { label: 'Full Name', value: 'fullName' },
      { label: 'MRN', value: 'patientMrn' }
    ],
    []
  );

  const searchByField = String(record?.searchByField ?? 'fullName');
  const patientName = record?.patientName ?? '';

  const handleSelectChange = useCallback(
    (upd: any) => {
      const next =
        upd?.searchByField ??
        upd?.value ??
        upd?.searchText ??
        searchByField ??
        'fullName';

      commit({ searchByField: next });
    },
    [commit, searchByField]
  );

  const handleTextChange = useCallback(
    (upd: any) => {
      const next =
        upd?.patientName ??
        upd?.value ??
        upd?.text ??
        '';

      commit({ patientName: next });
    },
    [commit]
  );

  const applySearch = useCallback(() => {
    onSearchClick?.();
  }, [onSearchClick]);

const handleSearchEnter = useCallback(
  (e: React.KeyboardEvent) => {
    if (searchOnIconClickOnly) return;

    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      applySearch();
    }
  },
  [applySearch, searchOnIconClickOnly]
);

useEffect(() => {
  if (!liveSearchMinLength) return;

  const value = String(patientName ?? '').trim();

  if (value.length >= liveSearchMinLength || value.length === 0) {
    const timer = setTimeout(() => {
      onSearchClick?.();
    }, 300); // debounce

    return () => clearTimeout(timer);
  }
}, [patientName, liveSearchMinLength, onSearchClick]);

  return (
    <div className="search-patient-criteria-handle-position-row">
      <div style={{ marginTop: searchMarginTop }}>
        <MyInput
          width="9vw"
          column
          fieldType="select"
          fieldName="searchByField"
          showLabel={false}
          record={{ searchByField }}
          setRecord={handleSelectChange}
          selectData={searchOptions}
          selectDataLabel="label"
          selectDataValue="value"
        />
      </div>

      <div style={{ marginTop: searchMarginTop }} onKeyDown={handleSearchEnter}>
        <MyInput
          width="100%"
          column
          fieldLabel="Search Patients"
          fieldType={searchByField === 'dob' ? 'date' : 'text'}
          fieldName="patientName"
          placeholder="Search Patients"
          showLabel={false}
          rightAddon={<FaSearch className="icons-style-2" onClick={applySearch} />}
          record={{ patientName, searchByField }}
          setRecord={handleTextChange}
        />
      </div>
    </div>
  );
};

export default SearchPatientCriteria;