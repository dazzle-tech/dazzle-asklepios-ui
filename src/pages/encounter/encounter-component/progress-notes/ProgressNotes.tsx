import React, { useEffect, useMemo, useState } from 'react';
import { useAppDispatch } from '@/hooks';
import PlusIcon from '@rsuite/icons/Plus';
import MyButton from '@/components/MyButton/MyButton';
import Translate from '@/components/Translate';
import { notify } from '@/utils/uiReducerActions';
import CloseOutlineIcon from '@rsuite/icons/CloseOutline';
import CancellationModal from '@/components/CancellationModal';
import { MdModeEdit } from 'react-icons/md';
import MyTable from '@/components/MyTable';
import { formatDateWithoutSeconds } from '@/utils';
import AddProgressNotes from './AddProgressNotes';
import { useLocation } from 'react-router-dom';
import { newApProgressNotes } from '@/types/model-types-constructor';
import { ApProgressNotes } from '@/types/model-types';
import {
  useGetProgressNotesListQuery,
  useSaveProgressNotesMutation
} from '@/services/encounterService';
import { initialListRequest, ListRequest } from '@/types/types';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import ReactDOMServer from 'react-dom/server';

const NURSE_ROLE_KEY = '157153858530600';
const PHYSICIAN_ROLE_KEY = '157153854130600';

const ProgressNotes: React.FC = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const { patient, encounter, edit } = (location.state || {}) as {
    patient?: any;
    encounter?: any;
    edit?: boolean;
  };

  const [openAddModal, setOpenAddModal] = useState(false);
  const [progressNotes, setProgressNotes] = useState<ApProgressNotes>({ ...newApProgressNotes });
  const [popupCancelOpen, setPopupCancelOpen] = useState(false);
  const [saveProgressNotes] = useSaveProgressNotesMutation();

  const [filterForm, setFilterForm] = useState({
    showCancelled: false,
    showAll: false,
    showNurseNotes: false,
    showPhysicianNotes: false
  });

  // Header (page title) setup
  useEffect(() => {
    const header = (
      "Progress Notes"
    );
    dispatch(setPageCode('Progress_Notes'));
    dispatch(setDivContent(header));
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch]);

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
  const {
    data: progressNotesResponse,
    refetch,
    isLoading
  } = useGetProgressNotesListQuery(progressNotesListRequest);

  // Selected row highlight
  const isSelected = (rowData: any) =>
    rowData && progressNotes && progressNotes.key === rowData.key ? 'selected-row' : '';

  // Cancel current note
  const handleCancel = async () => {
    try {
      await saveProgressNotes({
        ...progressNotes,
        statusLkey: '3196709905099521', // cancelled
        deletedAt: Date.now()
      }).unwrap();
      dispatch(notify({ msg: 'Progress Notes Canceled Successfully', sev: 'success' }));
      await refetch();
    } catch (e) {
      dispatch(notify({ msg: 'Cancel failed', sev: 'error' }));
    } finally {
      setPopupCancelOpen(false);
    }
  };

  const handleClearField = () => setProgressNotes({ ...newApProgressNotes });

  const handleAddNewProgressNotes = () => {
    handleClearField();
    setOpenAddModal(true);
  };

  // Compose filters from form state
  useEffect(() => {
    const next: any[] = [
      { fieldName: 'patient_key', operator: 'match', value: patient?.key },
      { fieldName: 'encounter_key', operator: 'match', value: encounter?.key }
    ];

    // Cancelled / not-cancelled
    if (!filterForm.showCancelled) {
      next.push({ fieldName: 'deleted_at', operator: 'isNull', value: undefined });
    }

    // Roles
    if (!filterForm.showAll) {
      const wantNurse = filterForm.showNurseNotes;
      const wantPhysician = filterForm.showPhysicianNotes;

      if (wantNurse && wantPhysician) {
        // combine with IN when both checked
        next.push({
          fieldName: 'job_role_lkey',
          operator: 'in',
          value: [NURSE_ROLE_KEY, PHYSICIAN_ROLE_KEY].map(k => `(${k})`).join(' ')
        });
      } else if (wantNurse) {
        next.push({ fieldName: 'job_role_lkey', operator: 'match', value: NURSE_ROLE_KEY });
      } else if (wantPhysician) {
        next.push({ fieldName: 'job_role_lkey', operator: 'match', value: PHYSICIAN_ROLE_KEY });
      }
    }

    setProgressNotesListRequest(prev => ({ ...prev, pageNumber: 1, filters: next }));
  }, [filterForm, patient?.key, encounter?.key]);

  // Table columns (memoized)
  const columns = useMemo(
    () => [
      {
        key: 'progressNotes',
        title: 'Progress Notes',
        dataKey: 'progressNotes',
        render: (rowData: any) => rowData?.progressNotes
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
      },
      {
        key: 'details',
        title: <Translate>EDIT</Translate>,
        flexGrow: 2,
        render: (rowData: any) => (
          <MdModeEdit
            title="Edit"
            size={24}
            fill="var(--primary-gray)"
            onClick={() => {
              setProgressNotes(rowData);
              setOpenAddModal(true);
            }}
          />
        )
      },
      {
        key: 'updatedAt',
        title: 'UPDATED AT/BY',
        expandable: true,
        render: (row: any) =>
          row?.updatedAt ? (
            <>
              {row?.updatedByUser?.fullName}
              <br />
              <span className="date-table-style">{formatDateWithoutSeconds(row.updatedAt)}</span>
            </>
          ) : (
            ' '
          )
      },
      {
        key: 'deletedAt',
        title: 'CANCELLED AT/BY',
        expandable: true,
        render: (row: any) =>
          row?.deletedAt ? (
            <>
              {row?.deletedByUser?.fullName}
              <br />
              <span className="date-table-style">{formatDateWithoutSeconds(row.deletedAt)}</span>
            </>
          ) : (
            ' '
          )
      },
      {
        key: 'cancellationReason',
        title: 'CANCELLATION REASON',
        dataKey: 'cancellationReason',
        expandable: true
      }
    ],
    []
  );

  // Pagination values
  const pageIndex = (progressNotesListRequest.pageNumber ?? 1) - 1;
  const rowsPerPage = progressNotesListRequest.pageSize;
  const totalCount = progressNotesResponse?.extraNumeric ?? 0;

  return (
    <div>
      <AddProgressNotes
        open={openAddModal}
        setOpen={setOpenAddModal}
        progressNotesObj={progressNotes}
        patient={patient}
        encounter={encounter}
        edit={!!edit}
        refetch={refetch}
      />

      <div className="bt-div">
        <MyButton
          onClick={() => setPopupCancelOpen(true)}
          prefixIcon={() => <CloseOutlineIcon />}
          disabled={!progressNotes?.key}
        >
          <Translate>Cancel</Translate>
        </MyButton>

        <Form fluid layout="inline">
          <MyInput
            column
            showLabel={false}
            width={200}
            fieldLabel="Show Cancelled"
            fieldType="check"
            fieldName="showCancelled"
            record={filterForm}
            setRecord={setFilterForm}
          />
          <MyInput
            column
            width={200}
            fieldLabel="Show All"
            fieldType="check"
            showLabel={false}
            fieldName="showAll"
            record={filterForm}
            setRecord={setFilterForm}
          />
          <MyInput
            column
            width={220}
            fieldLabel="Show Nurse Notes"
            fieldType="check"
            showLabel={false}
            fieldName="showNurseNotes"
            record={filterForm}
            setRecord={setFilterForm}
          />
          <MyInput
            column
            width={240}
            fieldLabel="Show Physician Notes"
            fieldType="check"
            fieldName="showPhysicianNotes"
            showLabel={false}
            record={filterForm}
            setRecord={setFilterForm}
          />
        </Form>

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

      <CancellationModal
        title="Cancel Progress Notes"
        fieldLabel="Cancellation Reason"
        open={popupCancelOpen}
        setOpen={setPopupCancelOpen}
        object={progressNotes}
        setObject={setProgressNotes}
        handleCancle={handleCancel}
        fieldName="cancellationReason"
      />
    </div>
  );
};

export default ProgressNotes;
