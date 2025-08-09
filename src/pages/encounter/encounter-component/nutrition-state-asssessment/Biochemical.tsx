import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import React, { useState } from 'react';
const Biochemical = () => {
  const [test, setTest] = useState({});

  // class name for selected row
  const isSelected = rowData => {
    if (rowData && test && test?.key === rowData?.key) {
      return 'selected-row';
    } else {
      return '';
    }
  };

  // dummy data
  const data = [
    { key: '0', testName: 'Albumin', lastResult: '4.2 g/dL' },
    { key: '1', testName: 'Prealbumin', lastResult: '22 mg/dL' },
    { key: '2', testName: 'Hemoglobin', lastResult: '13.8 g/dL' },
    { key: '3', testName: 'CRP', lastResult: '3.5 mg/L' },
    { key: '4', testName: 'Electrolytes', lastResult: 'Na 140 mmol/L, K 4.2 mmol/L' }
  ];

  // table columns
  const tableColumns = [
    {
      key: 'testName',
      title: <Translate>Test Name</Translate>
    },
    {
      key: 'lastResult',
      title: <Translate>Last Result</Translate>
    }
  ];

  return (
    <div>
      <MyTable
        height={450}
        data={data}
        columns={tableColumns}
        rowClassName={isSelected}
        onRowClick={rowData => {
          setTest(rowData);
        }}
      />
    </div>
  );
};
export default Biochemical;
