// Imports required components and libraries
import React, { useState } from 'react';
import MyTable from '@/components/MyTable';
import { ColumnConfig } from '@/components/MyTable/MyTable';
import { Checkbox, Form } from 'rsuite';
import MyButton from '@/components/MyButton/MyButton';
import CapriniRiskAssessmentModal from './CapriniRiskAssessmentModal';
import PlusIcon from '@rsuite/icons/Plus';
import CloseOutlineIcon from '@rsuite/icons/CloseOutline';
import './style.less';

// Initial sample data for testing or demo purposes
const initialSampleData = [
  {
    id: 1,
    totalScore: 9,
    riskLevel: 'High Risk',
    recommendedAction: 'LMWH or mechanical prophylaxis',
    createdBy: 'Dr. Nada',
    createdAt: '2025-07-20 09:10 AM',
    cancelled: false
  },
  {
    id: 2,
    totalScore: 3,
    riskLevel: 'Moderate Risk',
    recommendedAction: 'LMWH or mechanical prophylaxis',
    createdBy: 'Nurse Omar',
    createdAt: '2025-07-18 11:25 AM',
    cancelled: false
  },
  {
    id: 3,
    totalScore: 1,
    riskLevel: 'Low Risk',
    recommendedAction: 'Mechanical prophylaxis',
    createdBy: 'Dr. Salma',
    createdAt: '2025-07-10 02:45 PM',
    cancelled: true
  }
];

// Table column configuration
const columns: ColumnConfig[] = [
  {
    key: 'totalScore',
    title: 'Total Score',
    dataKey: 'totalScore',
    width: 100
  },
  {
    key: 'riskLevel',
    title: 'Risk Level',
    dataKey: 'riskLevel',
    width: 160
  },
  {
    key: 'recommendedAction',
    title: 'Recommended Action',
    dataKey: 'recommendedAction',
    width: 280
  },
  {
    key: 'createdByAt',
    title: 'Created By\\At',
    dataKey: 'createdBy',
    width: 240,
    // Combines createdBy and createdAt in one column
    render: row => (
      <>
        {row.createdBy}
        <br />
        <span className="date-table-style">{row.createdAt}</span>
      </>
    )
  }
];

const CapriniRiskAssessment = () => {
  // State for sorting
  const [sortColumn, setSortColumn] = useState('totalScore');
  const [sortType, setSortType] = useState<'asc' | 'desc'>('asc');

  //select row
    const [selectedRowId, setSelectedRowId] = useState<number | null>(null);


  // State for pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Modal open state
  const [modalOpen, setModalOpen] = useState(false);

  // Table data state
  const [sampleData, setSampleData] = useState(initialSampleData);

  // Sort the data based on selected column and direction
  const sortedData = [...sampleData].sort((a, b) => {
    const aVal = a[sortColumn];
    const bVal = b[sortColumn];
    if (aVal === bVal) return 0;
    return sortType === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
  });

  // Apply pagination to sorted data
  const paginatedData = sortedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  // Handle save from modal
  const handleSave = newRecord => {
    const newData = {
      id: sampleData.length + 1,
      totalScore: newRecord.totalScore,
      riskLevel: newRecord.riskLevel,
      recommendedAction: newRecord.recommendedAction,
      createdBy: 'Current User', // Can be dynamic later
      createdAt: new Date().toLocaleString(),
      cancelled: false
    };

    // Add new record to the top of the list
    setSampleData(prev => [newData, ...prev]);
    setModalOpen(false);
  };

  // Filters section above the table
  const filters = (
    <Form fluid>
      <div className="bt-div">
        <MyButton prefixIcon={() => <CloseOutlineIcon />}>Cancel</MyButton>
        <Checkbox>Show Cancelled</Checkbox> {/* Not implemented yet */}
        <div className="bt-right">
          <MyButton prefixIcon={() => <PlusIcon />} onClick={() => setModalOpen(true)}>
            Add
          </MyButton>
        </div>
      </div>
    </Form>
  );
//select row
  const isSelectedRow = rowData => {
    return rowData.id === selectedRowId ? 'selected-row' : '';
  };

  return (
    <div>
      <MyTable
        data={paginatedData}
        columns={columns}
        loading={false}
        filters={filters}
//select row
        rowClassName={isSelectedRow}
        onRowClick={(rowData) => {
          setSelectedRowId(rowData.id);
        }}

        sortColumn={sortColumn}
        sortType={sortType}
        onSortChange={(col, type) => {
          setSortColumn(col);
          setSortType(type);
        }}
        page={page}
        rowsPerPage={rowsPerPage}
        totalCount={sortedData.length}
        onPageChange={(_, newPage) => setPage(newPage)}
        onRowsPerPageChange={e => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0); // Reset to first page
        }}
      />

      {/* Modal for adding new risk assessment */}
      <CapriniRiskAssessmentModal open={modalOpen} setOpen={setModalOpen} onSave={handleSave} />
    </div>
  );
};

export default CapriniRiskAssessment;
