import React, { useState } from 'react';
import { Panel } from 'rsuite';
import MyButton from '@/components/MyButton/MyButton';
import UrgentCareList from './UrgentCareList';
import MedicationRecord from './MedicationRecord';

const UrgentCareListMain = () => {
  const [activeTab, setActiveTab] = useState<'ENCOUNTERS' | 'MEDICATION_RECORD'>(
    'ENCOUNTERS'
  );

  const direction = localStorage.getItem('direction') || 'LTR';
  const dir = direction === 'RTL' ? 'rtl' : 'ltr';

  return (
    <Panel dir={dir}>
      {/* 🔥 Tabs */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 15 }}>
        <MyButton
          appearance={activeTab === 'ENCOUNTERS' ? 'primary' : 'ghost'}
          onClick={() => setActiveTab('ENCOUNTERS')}
        >
          Encounters
        </MyButton>

        <MyButton
          appearance={activeTab === 'MEDICATION_RECORD' ? 'primary' : 'ghost'}
          onClick={() => setActiveTab('MEDICATION_RECORD')}
        >
          Medication Record
        </MyButton>
      </div>

      {/* 🔥 Content */}
      {activeTab === 'ENCOUNTERS' && <UrgentCareList />}

      {activeTab === 'MEDICATION_RECORD' && <MedicationRecord    />}
    </Panel>
  );
};

export default UrgentCareListMain;