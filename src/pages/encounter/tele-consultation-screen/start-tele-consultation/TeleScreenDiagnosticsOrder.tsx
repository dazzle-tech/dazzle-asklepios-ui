// TeleScreenSelectTests.tsx

import React, { useState } from 'react';
import MyModal from '@/components/MyModal/MyModal';
import TransferTestList from '../../encounter-component/diagnostics-order/TransferTestList';

const dummyTestsList = [
  { key: '1', testName: 'Complete Blood Count (CBC)' },
  { key: '2', testName: 'Blood Glucose' },
  { key: '3', testName: 'Liver Function Test (LFT)' },
  { key: '4', testName: 'Kidney Function Test (KFT)' },
  { key: '5', testName: 'Thyroid Panel' },
  { key: '6', testName: 'Urinalysis' },
  { key: '7', testName: 'COVID-19 PCR' },
  { key: '8', testName: 'Vitamin D Test' },
  { key: '9', testName: 'Lipid Profile' },
  { key: '10', testName: 'HbA1c' }
];

const TeleScreenSelectTests = ({ open, onClose }) => {
  const [leftItems, setLeftItems] = useState(dummyTestsList);
  const [selectedTestsList, setSelectedTestsList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const handleSaveTests = () => {
    onClose();
  };

  return (
    <MyModal
      open={open}
      setOpen={onClose}
      title="Select Tests"
      actionButtonFunction={handleSaveTests}
      size="50vw"
      content={
        <TransferTestList
          leftItems={leftItems}
          rightItems={selectedTestsList}
          setLeftItems={setLeftItems}
          setRightItems={setSelectedTestsList}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />
      }
    />
  );
};

export default TeleScreenSelectTests;
