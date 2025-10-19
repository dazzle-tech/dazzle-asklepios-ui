import React, { useEffect } from 'react';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import './styles.less';
import { FaSearch } from 'react-icons/fa';

interface SearchPatientCriteriaProps {
  record: any;
  setRecord: (value: any) => void;
  onSearchClick?: () => void;
}

const SearchPatientCriteria: React.FC<SearchPatientCriteriaProps> = ({ record, setRecord, onSearchClick }) => {

useEffect(() => {
  if (record?.searchByField === undefined) {
    setRecord({ ...record, searchByField: 'fullName' });
  }
}, []);

  return (
    <div className='search-patient-criteria-handle-position-row'>
        <div style={{marginTop:'0.9vw'}}>
      <MyInput
        width="9vw"
        column
        fieldType="select"
        fieldName="searchByField"
        showLabel={false}
        record={record}
        setRecord={setRecord}
        selectData={[
          { label: 'MRN', value: 'patientMrn' },
          { label: 'Document Number', value: 'documentNo' },
          { label: 'Full Name', value: 'fullName' },
          { label: 'Archiving Number', value: 'archivingNumber' },
          { label: 'Primary Phone Number', value: 'phoneNumber' },
          { label: 'Date of Birth', value: 'dob' },
        ]}
        selectDataLabel="label"
        selectDataValue="value"
      /></div>
        <div style={{marginTop:'0.9vw'}}>
      <MyInput
        width="100%"
        column
        fieldLabel="Search Patients"
        fieldType={record?.searchByField === 'dob' ? 'date' : 'text'}
        fieldName="patientName"
        placeholder="Search Patients"
        showLabel={false}
        rightAddon={
          <FaSearch
            className="icons-style-2"
            onClick={onSearchClick}
          />
        }
        record={record}
        setRecord={setRecord}
      /></div>
    </div>
  );
};

export default SearchPatientCriteria;
