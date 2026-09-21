import AddOutlineIcon from '@rsuite/icons/AddOutline';
import React, { useState } from 'react';
import { MdDelete, MdEdit } from 'react-icons/md';

import MyButton from '@/components/MyButton/MyButton';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { useGetDiagnosticTestNormalRangesByProfileTestIdQuery } from '@/services/setup/diagnosticTest/diagnosticTestNormalRangeService';
import { useGetLovAllValuesQuery } from '@/services/setupService';
import { newDiagnosticTestNormalRange } from '@/types/model-types-constructor-new';
import { DiagnosticTestNormalRange } from '@/types/model-types-new';
import { initialListRequestAllValues } from '@/types/types';
import { formatEnumString } from '@/utils';

interface Props {
  profileId?: number;
  testId?: number;
  resultType?: string;
  onAdd: (range: DiagnosticTestNormalRange) => void;
  onEdit: (range: DiagnosticTestNormalRange) => void;
  onDelete: (range: DiagnosticTestNormalRange) => void;
}

const DiagnosticTestNormalRangeTable = ({
  profileId,
  testId,
  resultType,
  onAdd,
  onEdit,
  onDelete
}: Props) => {
  const [selectedRow, setSelectedRow] = useState<DiagnosticTestNormalRange>();
  const [pagination, setPagination] = useState({ page: 0, size: 5 });
  const { data: normalRangeResponse, isFetching } =
    useGetDiagnosticTestNormalRangesByProfileTestIdQuery(
      { profileTestId: profileId, page: pagination.page, size: pagination.size },
      { skip: !profileId }
    );
  const { data: lovValues } = useGetLovAllValuesQuery({ ...initialListRequestAllValues });

  const columns = [
    {
      key: 'gender',
      title: <Translate>Gender</Translate>,
      render: rowData => <span>{formatEnumString(rowData.gender)}</span>
    },
    {
      key: 'ageRange',
      title: <Translate>Age From - To</Translate>,
      render: rowData => (
        <span>
          {rowData.ageFrom ?? '-'} {formatEnumString(rowData.ageFromUnit)} - {rowData.ageTo ?? '-'}{' '}
          {formatEnumString(rowData.ageToUnit)}
        </span>
      )
    },
    {
      key: 'lovValues',
      title: <Translate>LOV Values</Translate>,
      render: rowData => {
        const names = (rowData.lovKeys ?? [])
          .map(key => lovValues?.object?.find(value => String(value.key) === String(key))?.lovDisplayVale)
          .filter(Boolean);
        return <span>{names.length ? names.join(', ') : '-'}</span>;
      }
    },
    {
      key: 'condition',
      title: <Translate>Condition</Translate>,
      render: rowData => <span>{formatEnumString(rowData.condition)}</span>
    },
    {
      key: 'actions',
      title: <Translate>Actions</Translate>,
      render: rowData => (
        <div className="container-of-icons" onClick={event => event.stopPropagation()}>
          <MdEdit
            size={22}
            className="icons-style"
            fill="var(--primary-gray)"
            onClick={() => onEdit({ ...newDiagnosticTestNormalRange, ...rowData })}
          />
          <MdDelete
            size={22}
            className="icons-style"
            fill="var(--primary-pink)"
            onClick={() => onDelete(rowData)}
          />
        </div>
      )
    }
  ];

  return (
    <div>
      <div className="container-of-add-new-button">
        <MyButton
          prefixIcon={() => <AddOutlineIcon />}
          width="109px"
          color="var(--deep-blue)"
          disabled={!profileId || resultType?.toUpperCase() === 'TEXT'}
          onClick={() =>
            onAdd({
              ...newDiagnosticTestNormalRange,
              testId,
              profileTestId: profileId,
              resultType
            })
          }
        >
          Add New
        </MyButton>
      </div>
      <MyTable
        height={380}
        data={normalRangeResponse?.data ?? []}
        loading={isFetching}
        columns={columns}
        rowClassName={rowData => (rowData.id === selectedRow?.id ? 'selected-row' : '')}
        page={pagination.page}
        rowsPerPage={pagination.size}
        totalCount={normalRangeResponse?.totalCount ?? 0}
        onRowClick={rowData => {
          setSelectedRow(rowData);
          onEdit({ ...newDiagnosticTestNormalRange, ...rowData });
        }}
        onPageChange={(_, page) => setPagination(previous => ({ ...previous, page }))}
        onRowsPerPageChange={event => setPagination({ page: 0, size: Number(event.target.value) })}
      />
    </div>
  );
};

export default DiagnosticTestNormalRangeTable;
