import React, { useMemo, useState } from 'react';
import { Form } from 'rsuite';
import { MdDelete, MdEdit } from 'react-icons/md';
import AddOutlineIcon from '@rsuite/icons/AddOutline';

import MyButton from '@/components/MyButton/MyButton';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';

import {
  useGetDiagnosticTestNormalRangesByProfileTestIdQuery
} from '@/services/setup/diagnosticTest/diagnosticTestNormalRangeService';

import { useGetLovAllValuesQuery } from '@/services/setupService';

import { initialListRequestAllValues } from '@/types/types';
import { formatEnumString } from '@/utils';
import { DiagnosticTestNormalRange } from '@/types/model-types-new';
import { newDiagnosticTestNormalRange } from '@/types/model-types-constructor-new';

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
  const [selectedRow, setSelectedRow] =
    useState<DiagnosticTestNormalRange>();

  const [pagination, setPagination] = useState({
    page: 0,
    size: 5
  });

  const {
    data: normalRangeResponse,
    isFetching
  } = useGetDiagnosticTestNormalRangesByProfileTestIdQuery(
    {
      profileTestId: profileId,
      page: pagination.page,
      size: pagination.size
    },
    {
      skip: !profileId
    }
  );

  const { data: lovValues } = useGetLovAllValuesQuery({
    ...initialListRequestAllValues
  });

  const rowClassName = (rowData: DiagnosticTestNormalRange) => {
    return rowData?.id === selectedRow?.id
      ? 'selected-row'
      : '';
  };

  const columns = useMemo(
    () => [
      {
        key: 'gender',
        title: <Translate>Gender</Translate>,
        render: rowData => (
          <span>{formatEnumString(rowData.gender)}</span>
        )
      },

      {
        key: 'ageRange',
        title: <Translate>Age From - To</Translate>,
        render: rowData => (
          <span>
            {rowData.ageFrom ?? '-'}{' '}
            {formatEnumString(rowData.ageFromUnit)}
            {' - '}
            {rowData.ageTo ?? '-'}{' '}
            {formatEnumString(rowData.ageToUnit)}
          </span>
        )
      },

      {
        key: 'lovValues',
        title: <Translate>LOV Values</Translate>,
        render: rowData => {
          if (!rowData.lovKeys?.length) {
            return '-';
          }

          const names = rowData.lovKeys
            .map(key =>
              lovValues?.object?.find(
                x => x.key === key
              )?.lovDisplayVale
            )
            .filter(Boolean);

          return names.join(', ') || '-';
        }
      },

      {
        key: 'condition',
        title: <Translate>Condition</Translate>,
        render: rowData => (
          <span>
            {formatEnumString(rowData.condition)}
          </span>
        )
      },

      {
        key: 'actions',
        title: <Translate>Actions</Translate>,
        render: rowData => (
          <div
            style={{
              display: 'flex',
              gap: 10,
              alignItems: 'center'
            }}
          >
            <MdEdit
              size={22}
              className="icons-style"
              fill="var(--primary-gray)"
              onClick={() => onEdit(rowData)}
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
    ],
    [lovValues, onEdit, onDelete]
  );

  return (
    <Form fluid>
      <div className="container-of-add-new-button">
        <MyButton
          prefixIcon={() => <AddOutlineIcon />}
          width="109px"
          color="var(--deep-blue)"
          disabled={
            !profileId ||
            resultType?.toUpperCase() === 'TEXT'
          }
          onClick={() =>
            onAdd({
              ...newDiagnosticTestNormalRange,
              testId,
              profileTestId: profileId
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
        rowClassName={rowClassName}
        page={pagination.page}
        rowsPerPage={pagination.size}
        totalCount={normalRangeResponse?.totalCount ?? 0}
        onRowClick={rowData => {
          setSelectedRow(rowData);
        }}
        onPageChange={(_, page) =>
          setPagination(prev => ({
            ...prev,
            page
          }))
        }
        onRowsPerPageChange={event =>
          setPagination({
            page: 0,
            size: Number(event.target.value)
          })
        }
      />
    </Form>
  );
};

export default DiagnosticTestNormalRangeTable;