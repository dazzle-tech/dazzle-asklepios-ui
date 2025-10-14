import React from 'react';
import MyInput from '@/components/MyInput';
import './styles.less'
interface SearchPatientCriteriaProps {
  record: any;
  setRecord: (value: any) => void;
}

const SearchPatientCriteria: React.FC<SearchPatientCriteriaProps> = ({ record, setRecord }) => {
  return (
    <div className='search-patient-criteria-handle-position-row'>
      <MyInput
        width="9vw"
        fieldLabel="Select Search Criteria"
        fieldType="select"
        fieldName="searchByField"
        column
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
      />

      <MyInput
        width="100%"
        column
        fieldLabel="Search Patients"
        fieldType={record?.searchByField === 'dob' ? 'date' : 'text'}
        fieldName="patientName"
        record={record}
        setRecord={setRecord}
      />
    </div>
  );
};

export default SearchPatientCriteria;
