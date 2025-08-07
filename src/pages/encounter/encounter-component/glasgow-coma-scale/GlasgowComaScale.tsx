import React, { useState } from 'react';
import MyTable from '@/components/MyTable';
import { ColumnConfig } from '@/components/MyTable/MyTable';
import { Checkbox, Form } from 'rsuite';
import MyButton from '@/components/MyButton/MyButton';
import GlasgowComaScaleModal from './GlasgowComaScaleModal';
import PlusIcon from '@rsuite/icons/Plus';
import CloseOutlineIcon from '@rsuite/icons/CloseOutline';
import './Style.less';

// Initial sample data for the table
const initialSampleData = [
  {
    id: 1,
    gcsScore: 15,
    levelOfInjury: 'Mild brain injury',
    addedBy: 'Dr. Rami',
    addedAt: '2025-07-29 10:30 AM',
    cancelled: false
  },
  {
    id: 2,
    gcsScore: 8,
    levelOfInjury: 'Moderate brain injury',
    addedBy: 'Nurse Layla',
    addedAt: '2025-07-25 01:15 PM',
    cancelled: false
  },
  {
    id: 3,
    gcsScore: 4,
    levelOfInjury: 'Severe brain injury (coma)',
    addedBy: 'Dr. Ahmad',
    addedAt: '2025-07-10 08:45 AM',
    cancelled: true
  }
];

// Table columns configuration
const columns: ColumnConfig[] = [
  {
    key: 'gcsScore',
    title: 'GCS Score',
    dataKey: 'gcsScore',
    width: 100
  },
  {
    key: 'levelOfInjury',
    title: 'Level of Injury',
    dataKey: 'levelOfInjury',
    width: 180
  },
  {
    key: 'addedByAt',
    title: 'Added By\\At',
    dataKey: 'addedByAt',
    width: 220,
    render: row => (
      <>
        {row.addedBy}
        <br />
        <span className="date-table-style">{row.addedAt}</span>
      </>
    )
  }
];

const GlasgowComaScale = () => {
  // Sort states
  const [sortColumn, setSortColumn] = useState('gcsScore');
  const [sortType, setSortType] = useState<'asc' | 'desc'>('asc');

  // Pagination states
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Modal open state
  const [modalOpen, setModalOpen] = useState(false);

  // Data state to hold the GCS records
  const [sampleData, setSampleData] = useState(initialSampleData);

  // Sort the data based on sortColumn and sortType
  const sortedData = [...sampleData].sort((a, b) => {
    const aVal = a[sortColumn];
    const bVal = b[sortColumn];
    if (aVal === bVal) return 0;
    return sortType === 'asc' ? (aVal > bVal ? 1 : -1) : aVal < bVal ? 1 : -1;
  });

  // Pagination slice
  const paginatedData = sortedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  // Handle saving a new GCS record from the modal
  const handleSave = newRecord => {
    // Create a new record with unique id and current timestamp
    const newData = {
      id: sampleData.length + 1,
      gcsScore: newRecord.totalScore,
      levelOfInjury: newRecord.riskLevel,
      addedBy: 'Current User', // Replace with actual user
      addedAt: new Date().toLocaleString(),
      cancelled: false
    };

    // Add new record to the top of the list
    setSampleData(prev => [newData, ...prev]);
    setModalOpen(false);
  };

  // Filters UI with Cancel button, Show Cancelled checkbox, Add button
  const filters = (
    <Form fluid>
      <div className="bt-div">
        <MyButton prefixIcon={() => <CloseOutlineIcon />}>Cancel</MyButton>
        <Checkbox>Show Cancelled</Checkbox>
        <div className="bt-right">
          <MyButton prefixIcon={() => <PlusIcon />} onClick={() => setModalOpen(true)}>
            Add
          </MyButton>
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

      <GlasgowComaScaleModal open={modalOpen} setOpen={setModalOpen} onSave={handleSave} />
    </div>
  );
};

export default GlasgowComaScale;
