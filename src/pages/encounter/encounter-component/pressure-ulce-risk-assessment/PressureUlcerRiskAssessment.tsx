import React, { useState } from 'react';
import MyTable from '@/components/MyTable';
import { Checkbox, Form } from 'rsuite';
import MyButton from '@/components/MyButton/MyButton';
import PressureUlcerRiskAssessmentModal from './PressureUlcerRiskAssessmentModal';
import PlusIcon from '@rsuite/icons/Plus';
import CloseOutlineIcon from '@rsuite/icons/CloseOutline';
import './Style.less';

// Initial sample data for the pressure ulcer risk assessment table
const initialSampleData = [
  {
    id: 1,
    totalScore: 21,
    riskLevel: 'No Risk',
    createdBy: 'Dr. Rami',
    createdAt: '2025-07-29 10:30 AM',
    cancelled: false
  },
  {
    id: 2,
    totalScore: 13,
    riskLevel: 'Moderate Risk',
    createdBy: 'Nurse Layla',
    createdAt: '2025-07-25 01:15 PM',
    cancelled: false
  },
  {
    id: 3,
    totalScore: 11,
    riskLevel: 'High Risk',
    createdBy: 'Dr. Ahmad',
    createdAt: '2025-07-10 08:45 AM',
    cancelled: true
  }
];

// Table columns config
const columns = [
  { key: 'totalScore', title: 'Total Score', dataKey: 'totalScore', width: 120 },
  { key: 'riskLevel', title: 'Risk Level', dataKey: 'riskLevel', width: 160 },
  {
    key: 'createdByAt',
    title: 'Created By\\At',
    dataKey: 'createdBy',
    width: 240,
    render: row => (
      <>
        {row.createdBy}
        <br />
        <span className="date-table-style">{row.createdAt}</span>
      </>
    )
  }
];

const PressureUlcerRiskAssessment = () => {
  // Sort states
  const [sortColumn, setSortColumn] = useState('totalScore');
  const [sortType, setSortType] = useState<'asc' | 'desc'>('asc');

  // Pagination states
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Modal visibility state
  const [modalOpen, setModalOpen] = useState(false);

  // Table data state
  const [sampleData, setSampleData] = useState(initialSampleData);

  const filteredData = sampleData;

  // Sort filtered data
  const sortedData = [...filteredData].sort((a, b) => {
    const aVal = a[sortColumn];
    const bVal = b[sortColumn];
    if (aVal === bVal) return 0;
    return sortType === 'asc' ? (aVal > bVal ? 1 : -1) : aVal < bVal ? 1 : -1;
  });

  // Pagination slice
  const paginatedData = sortedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  // Save handler for new record
  const handleSave = newRecord => {
    const newData = {
      id: sampleData.length + 1,
      totalScore: newRecord.totalScore,
      riskLevel: newRecord.riskLevel,
      createdBy: 'Current User',
      createdAt: new Date().toLocaleString(),
      cancelled: false
    };
    setSampleData(prev => [newData, ...prev]);
    setModalOpen(false);
  };

  // Filters UI - example with "Show Cancelled" checkbox
  const filters = (
    <Form fluid>
      <div>
        <div className="bt-div">
          <MyButton prefixIcon={() => <CloseOutlineIcon />}>Cancel</MyButton>
          <Checkbox>Show Cancelled</Checkbox>
          <div className="bt-right">
            <MyButton prefixIcon={() => <PlusIcon />} onClick={() => setModalOpen(true)}>
              Add
            </MyButton>
          </div>
        </div>
      </div>
    </Form>
  );

  return (
    <div>
      <MyTable
        data={paginatedData}
        columns={columns}
        loading={false}
        filters={filters}
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
          setPage(0);
        }}
      />

      <PressureUlcerRiskAssessmentModal
        open={modalOpen}
        setOpen={setModalOpen}
        onSave={handleSave}
      />
    </div>
  );
};

export default PressureUlcerRiskAssessment;
