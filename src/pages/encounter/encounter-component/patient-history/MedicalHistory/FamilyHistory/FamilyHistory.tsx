import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import MyButton from '@/components/MyButton/MyButton';
import MyTable from '@/components/MyTable';
import SectionContainer from '@/components/SectionsoContainer';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import PlusIcon from '@rsuite/icons/Plus';
import React, { useState } from 'react';
import { MdDelete, MdModeEdit } from 'react-icons/md';
import AddFamilyHistory from './AddFamilyHistory';
import {
  useDeleteFamilyHistoryMutation,
  useGetFamilyHistoryQuery
} from '@/services/patients/familyHistoryService';
import { useEnumOptions } from '@/services/enumsApi';
import '../styles.less';
import './familyHistory.less';
import Translate from '@/components/Translate';
import { formatDateWithoutSeconds } from '@/utils';

const FamilyHistory = ({ patient, edit, toShowData = false }) => {
  const dispatch = useAppDispatch();

  const [open, setOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<any>(null);
  /*  PAGINATION  */

  const [page, setPage] = useState(0);
  const [size, setSize] = useState(15);

  /*  API  */

  const { data: familyHistoryData, isLoading } = useGetFamilyHistoryQuery({
    patientId: Number(patient?.id),
    page,
    size,
    sort: 'id,desc'
  });

  const [deleteFamilyHistory] = useDeleteFamilyHistoryMutation();

  /*  ENUM  */

  const relations = useEnumOptions('Relations');

  /*  ACTIONS  */


  const handleEdit = (row: any) => {
    setSelectedRow(row);
    setOpen(true);
  };

  /*  TABLE  */

  const columns = [
    {
      key: 'condition',
      title: 'CONDITION',
      flexGrow: 4,
      dataKey: 'condition'
    },
    {
      key: 'relation',
      title: 'RELATION',
      flexGrow: 3,
      render: row => relations?.find(r => r.value === row.relation)?.label ?? row.relation
    },
    {
          key: 'createdDate',
          title: <Translate>CREATED AT / BY</Translate>,
          expandable: true,
          render: (row: any) =>
            row?.createdDate ? (
              <>
                {row?.createdBy} <br />
                <span className="date-table-style">{formatDateWithoutSeconds(row.createdDate)}</span>
              </>
            ) : (
              ''
            )
    },

    {
      key: 'inheritedDiseases',
      title: 'INHERITED DISEASES',
      flexGrow: 3,
      render: row => (row.inheritedDiseases ? 'Yes' : 'No')
    },
    ...(!toShowData
      ? [
          {
            key: 'actions',
            title: '',
            flexGrow: 1,
            render: row => (
              <div className="family-history-actions">
                <MdModeEdit size={24} className="edit-icon" onClick={() => handleEdit(row)} />
              </div>
            )
          }
        ]
      : [])
  ];

  /*  PAGINATION HANDLERS  */

  const handlePageChange = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSize(parseInt(event.target.value, 10));
    setPage(0);
  };

  /*  RENDER  */

  return (
    <div className="medical-container-div">
      <SectionContainer
        action={
          !toShowData && (
            <MyButton disabled={edit} prefixIcon={() => <PlusIcon />} onClick={() => setOpen(true)}>
              Add
            </MyButton>
          )
        }
        title="Family History"
        content={
          <>
            <MyTable
              height={450}
              data={familyHistoryData?.data ?? []}
              loading={isLoading}
              columns={columns}
              page={page}
              rowsPerPage={size}
              totalCount={familyHistoryData?.totalCount ?? 0}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleRowsPerPageChange}
            />

            <AddFamilyHistory
              open={open}
              setOpen={() => {
                setSelectedRow(null);
                setOpen(false);
              }}
              initialData={selectedRow}
              patient={patient}
            />

          </>
        }
      />
    </div>
  );
};

export default FamilyHistory;
