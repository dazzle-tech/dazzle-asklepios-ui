import React, { useState } from 'react';
import MyTable from '@/components/MyTable';
import { ColumnConfig } from '@/components/MyTable/MyTable';
import { formatDateWithoutSeconds } from '@/utils';
import Translate from '@/components/Translate';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';

const sampleNurseAssessments = [
  {
    date: '2024-01-15T00:00:00Z',
    nurse: 'RN Sarah Miller',
    assessmentType: 'Admission Assessment',
    score: 'Low Risk',
    vitals: 'Stable',
    notes: 'Patient alert and oriented x3'
  },
  {
    date: '2024-01-10T00:00:00Z',
    nurse: 'RN Mike Johnson',
    assessmentType: 'Fall Risk Assessment',
    score: 'Medium Risk',
    vitals: 'BP 140/90',
    notes: 'History of falls'
  },
  {
    date: '2024-01-05T00:00:00Z',
    nurse: 'RN Lisa Chen',
    assessmentType: 'Pain Assessment',
    score: '3/10',
    vitals: 'Normal',
    notes: 'Arthritis pain manageable'
  }
];

const columns: ColumnConfig[] = [
  {
    key: 'date',
    title: <Translate>Date</Translate>,
    dataKey: 'date',
    render: (row: any) =>
      row?.date ? (
        <span className="date-table-style">{formatDateWithoutSeconds(row.date)}</span>
      ) : (
        '-'
      )
  },
  {
    key: 'nurse',
    title: <Translate>Nurse</Translate>,
    dataKey: 'nurse'
  },
  {
    key: 'assessmentType',
    title: <Translate>Assessment Type</Translate>,
    dataKey: 'assessmentType'
  },
{
  key: 'score',
  title: <Translate>Score</Translate>,
  dataKey: 'score',
  width: 200,
  render: (row: any) => {
    const score = row.score;

    // Check if it's a pain score like "3/10"
    const painMatch = /^(\d+)\/10$/.exec(score);
    let bgColor = 'var(--light-gray)';
    let color = 'var(--dark-gray)';

    if (painMatch) {
      const value = parseInt(painMatch[1], 10);

      if (value <= 3) {
        bgColor = 'var(--light-green)';
        color = 'var(--primary-green)';
      } else if (value <= 6) {
        bgColor = 'var(--light-orange)';
        color = 'var(--primary-orange)';
      } else {
        bgColor = 'var(--light-red)';
        color = 'var(--primary-red)';
      }
    } else {
      bgColor =
        score === 'Low Risk'
          ? 'var(--light-green)'
          : score === 'Medium Risk'
          ? 'var(--light-orange)'
          : score === 'High Risk'
          ? 'var(--light-red)'
          : 'var(--light-gray)';

      color =
        score === 'Low Risk'
          ? 'var(--primary-green)'
          : score === 'Medium Risk'
          ? 'var(--primary-orange)'
          : score === 'High Risk'
          ? 'var(--primary-red)'
          : 'var(--dark-gray)';
    }

    return <MyBadgeStatus backgroundColor={bgColor} color={color} contant={score} />;
  }
},
  {
    key: 'vitals',
    title: <Translate>Vitals</Translate>,
    dataKey: 'vitals'
  },
  {
    key: 'notes',
    title: <Translate>Notes</Translate>,
    dataKey: 'notes'
  }
];

const NurseAssessmentsTable = () => {
  const [sortColumn, setSortColumn] = useState('date');
  const [sortType, setSortType] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [tableData, setTableData] = useState(sampleNurseAssessments);

  const sortedData = [...tableData].sort((a, b) => {
    const aValue = a[sortColumn];
    const bValue = b[sortColumn];
    if (aValue === bValue) return 0;
    return sortType === 'asc' ? (aValue > bValue ? 1 : -1) : aValue < bValue ? 1 : -1;
  });

  const paginatedData = sortedData.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

  return (
    <MyTable
      data={paginatedData}
      columns={columns}
      loading={false}
      sortColumn={sortColumn}
      sortType={sortType}
      onSortChange={(col, type) => {
        setSortColumn(col);
        setSortType(type);
      }}
      page={page}
      rowsPerPage={rowsPerPage}
      totalCount={tableData.length}
      onPageChange={(_, newPage) => setPage(newPage)}
      onRowsPerPageChange={e => {
        setRowsPerPage(parseInt(e.target.value, 10));
        setPage(0);
      }}
    />
  );
};

export default NurseAssessmentsTable;
