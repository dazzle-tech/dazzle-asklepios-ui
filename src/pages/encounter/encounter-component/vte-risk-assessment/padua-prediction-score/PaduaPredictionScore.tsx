import React, { useState } from 'react';
import MyTable from '@/components/MyTable';
import { ColumnConfig } from '@/components/MyTable/MyTable';
import { Checkbox, Form } from 'rsuite';
import MyButton from '@/components/MyButton/MyButton';
import PaduaPredictionScoreModal from './PaduaPredictionScoreModal';
import PlusIcon from '@rsuite/icons/Plus';
import CloseOutlineIcon from '@rsuite/icons/CloseOutline';
import './style.less';

// Sample data
const initialSampleData = [
  {
    id: 1,
    totalScore: 12,
    riskLevel: 'High Risk',
    createdBy: 'Dr. Rami',
    createdAt: '2025-07-29 10:30 AM',
    cancelled: false
  },
  {
    id: 2,
    totalScore: 5,
    riskLevel: 'High Risk',
    createdBy: 'Nurse Layla',
    createdAt: '2025-07-25 01:15 PM',
    cancelled: false
  },
  {
    id: 3,
    totalScore: 3,
    riskLevel: 'Low Risk',
    createdBy: 'Dr. Ahmad',
    createdAt: '2025-07-10 08:45 AM',
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
    width: 180
  },
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

const PaduaPredictionScore = () => {
  const [sortColumn, setSortColumn] = useState('totalScore');
  const [sortType, setSortType] = useState<'asc' | 'desc'>('asc');

  //select row
  const [selectedRowId, setSelectedRowId] = useState<number | null>(null);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [modalOpen, setModalOpen] = useState(false);
  const [sampleData, setSampleData] = useState(initialSampleData);

  const sortedData = [...sampleData].sort((a, b) => {
    const aVal = a[sortColumn];
    const bVal = b[sortColumn];
    if (aVal === bVal) return 0;
    return sortType === 'asc' ? (aVal > bVal ? 1 : -1) : aVal < bVal ? 1 : -1;
  });

  const paginatedData = sortedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

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

  const filters = (
    <div className="table-buttons-container">
      <div className="left-group">
        <MyButton prefixIcon={() => <CloseOutlineIcon />}>Cancel</MyButton>
        <Checkbox>Show Cancelled</Checkbox>
      </div>
      <div className="right-group">
        <MyButton prefixIcon={() => <PlusIcon />} onClick={() => setModalOpen(true)}>
          Add
        </MyButton>
      </div>
    </div>
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
        sortColumn={sortColumn}
        //select row
        rowClassName={isSelectedRow}
        onRowClick={rowData => {
          setSelectedRowId(rowData.id);
        }}
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
        tableButtons={filters}
      />

      <PaduaPredictionScoreModal open={modalOpen} setOpen={setModalOpen} onSave={handleSave} />
    </div>
  );
};

export default PaduaPredictionScore;
