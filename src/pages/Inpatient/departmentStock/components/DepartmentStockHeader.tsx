import React from 'react';
import { Form } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileExport, faRotateLeft } from '@fortawesome/free-solid-svg-icons';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';

/**
 * DepartmentStockHeader Component
 *
 * Header section containing department/stock selectors and action buttons
 */
const DepartmentStockHeader = ({ onExportXLS, onRefillRequest }: any) => {
  // Department options - realistic hospital departments
  const departmentOptions = [
    { key: '1', name: 'Emergency Department' },
    { key: '2', name: 'Intensive Care Unit (ICU)' },
    { key: '3', name: 'Operating Room' },
    { key: '4', name: 'Cardiology Department' },
    { key: '5', name: 'Pediatrics Department' },
    { key: '6', name: 'Orthopedics Department' },
    { key: '7', name: 'Neurology Department' },
    { key: '8', name: 'Oncology Department' },
    { key: '9', name: 'Radiology Department' },
    { key: '10', name: 'Laboratory Department' },
    { key: '11', name: 'Pharmacy Department' },
    { key: '12', name: 'General Surgery' },
    { key: '13', name: 'Internal Medicine' },
    { key: '14', name: 'Obstetrics & Gynecology' },
    { key: '15', name: 'Dental Department' }
  ];

  // Stock options - different types of medical stock locations
  const stockOptions = [
    { key: '1', name: 'Main Pharmacy Stock' },
    { key: '2', name: 'Emergency Stock' },
    { key: '3', name: 'ICU Stock' },
    { key: '4', name: 'Operating Room Stock' },
    { key: '5', name: 'Central Medical Supply' },
    { key: '6', name: 'Laboratory Stock' },
    { key: '7', name: 'Radiology Stock' },
    { key: '8', name: 'Pediatric Stock' },
    { key: '9', name: 'Surgical Instruments Stock' },
    { key: '10', name: 'Emergency Trauma Stock' },
    { key: '11', name: 'Critical Care Stock' },
    { key: '12', name: 'Outpatient Stock' },
    { key: '13', name: 'Inpatient Stock' },
    { key: '14', name: 'Specialty Equipment Stock' },
    { key: '15', name: 'Consumables Stock' }
  ];

  return (
    <div className="head-of-page">
      <Form fluid className="table-buttons-left">
        <MyInput
          fieldType="select"
          fieldName="departmentName"
          fieldLabel="Department Name"
          placeholder="Select Department Name"
          width="210px"
          record={{}}
          selectData={departmentOptions}
          selectDataLabel="name"
          selectDataValue="key"
        />
        <MyInput
          fieldType="select"
          fieldName="stock"
          fieldLabel="Stock"
          placeholder="Select Stock"
          width="140px"
          record={{}}
          selectData={stockOptions}
          selectDataLabel="name"
          selectDataValue="key"
        />
      </Form>
      <div className="table-buttons-right">
        <MyButton
          color="var(--deep-blue)"
          width="120px"
          onClick={onExportXLS}
          icon={<FontAwesomeIcon icon={faFileExport} />}
        >
          Export XLS
        </MyButton>
        <MyButton
          color="var(--deep-blue)"
          width="120px"
          onClick={onRefillRequest}
          icon={<FontAwesomeIcon icon={faRotateLeft} />}
        >
          Refill Request
        </MyButton>
      </div>
    </div>
  );
};

export default DepartmentStockHeader;
