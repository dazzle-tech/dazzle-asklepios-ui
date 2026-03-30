// ProgressNotesSimple.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useAppDispatch } from '@/hooks';
import PlusIcon from '@rsuite/icons/Plus';
import MyButton from '@/components/MyButton/MyButton';
import MyTable from '@/components/MyTable';
import AddProgressNotes from '../../encounter-component/progress-notes/AddProgressNotes';
import { useGetProgressNotesListQuery } from '@/services/encounterService';
import { newApProgressNotes } from '@/types/model-types-constructor';
import { ApProgressNotes } from '@/types/model-types';
import { initialListRequest, ListRequest } from '@/types/types';
import { formatDateWithoutSeconds } from '@/utils';
import { useLocation } from 'react-router-dom';

const NURSE_ROLE_KEY = '157153858530600';
const PHYSICIAN_ROLE_KEY = '157153854130600';
interface ProgressNoteProps {
  patient: any;
  encounter: any;
}

const ProgressNote: React.FC<ProgressNoteProps> = ({ patient, encounter }) => {



  const [openAddModal, setOpenAddModal] = useState(false);
  const [progressNotes, setProgressNotes] = useState<ApProgressNotes>({ ...newApProgressNotes });

  // Initialize list request
  const [progressNotesListRequest, setProgressNotesListRequest] = useState<ListRequest>({
    ...initialListRequest,
    filters: [
      { fieldName: 'deleted_at', operator: 'isNull', value: undefined },
      { fieldName: 'patient_key', operator: 'match', value: patient?.key },
      { fieldName: 'encounter_key', operator: 'match', value: encounter?.key }
    ]
  });

  // Fetch list
  const skipQuery = !patient || !encounter;
  const { data: progressNotesResponse, refetch, isLoading } = useGetProgressNotesListQuery(
    progressNotesListRequest,
    { skip: skipQuery }
  );
  // Selected row highlight
  const isSelected = (rowData: any) =>
    rowData && progressNotes && progressNotes.key === rowData.key ? 'selected-row' : '';

  const handleAddNewProgressNotes = () => {
    setProgressNotes({ ...newApProgressNotes });
    setOpenAddModal(true);
  };

  // Table columns
  const columns = useMemo(
    () => [
      {
        key: 'progressNotes',
        title: 'Progress Notes',
        dataKey: 'progressNotes',
        render: (rowData: any) => <div className="progress-notes-text">{rowData?.progressNotes}</div>
      },
      {
        key: 'jobRoleLkey',
        title: 'JOB ROLE',
        dataKey: 'jobRoleLkey',
        render: (rowData: any) =>
          rowData?.jobRoleLvalue ? rowData.jobRoleLvalue.lovDisplayVale : rowData.jobRoleLkey
      },
      {
        key: 'createdAt',
        title: 'CREATED AT/BY',
        render: (row: any) =>
          row?.createdAt ? (
            <>
              {row?.createdByUser?.fullName}
              <br />
              <span className="date-table-style">{formatDateWithoutSeconds(row.createdAt)}</span>
            </>
          ) : (
            ' '
          )
      }
    ],
    []
  );

  // Pagination values
  const pageIndex = (progressNotesListRequest.pageNumber ?? 1) - 1;
  const rowsPerPage = progressNotesListRequest.pageSize;
  const totalCount = progressNotesResponse?.extraNumeric ?? 0;

  useEffect(() => {
    if (patient && encounter) {
      setProgressNotesListRequest({
        ...initialListRequest,
        filters: [
          { fieldName: 'deleted_at', operator: 'isNull', value: undefined },
          { fieldName: 'patient_key', operator: 'match', value: patient.key },
          { fieldName: 'encounter_key', operator: 'match', value: encounter.key }
        ]
      });
    }
  }, [patient, encounter]);


        // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';
  return (
    <div dir={dir}>
      <AddProgressNotes
        open={openAddModal}
        setOpen={setOpenAddModal}
        progressNotesObj={progressNotes}
        patient={patient}
        encounter={encounter}
        refetch={refetch}
        edit={false}
      />

      <div className="bt-div">
        <div className="bt-right">
          <MyButton onClick={handleAddNewProgressNotes} prefixIcon={() => <PlusIcon />}>
            Add
          </MyButton>
        </div>
      </div>

      <MyTable
        data={progressNotesResponse?.object ?? []}
        columns={columns}
        height={600}
        loading={isLoading}
        onRowClick={rowData => setProgressNotes({ ...rowData })}
        rowClassName={isSelected}
        page={pageIndex}
        rowsPerPage={rowsPerPage}
        totalCount={totalCount}
      />
    </div>
  );
};

export default ProgressNote;
