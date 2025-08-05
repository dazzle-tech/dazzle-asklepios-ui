import React, { useState, useEffect } from 'react';
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
import { useGetProgressNotesListQuery, useSaveProgressNotesMutation } from '@/services/encounterService';
import { initialListRequest, ListRequest } from '@/types/types';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';

const ProgressNotes = () => {
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [progressNotes, setProgressNotes] = useState<ApProgressNotes>({ ...newApProgressNotes });
  const [popupCancelOpen, setPopupCancelOpen] = useState(false);
  const [saveProgressNotes] = useSaveProgressNotesMutation();
  const [filterForm, setFilterForm] = useState({
    showCancelled: false,
    showAll: false,
    showNurseNotes: false,
    showPhysicianNotes: false
  });
  const dispatch = useAppDispatch();

  const location = useLocation();
  const { patient, encounter, edit } = location.state || {};

  // Initialize list request with default filters
  const [progressNotesListRequest, setProgressNotesListRequest] = useState<ListRequest>({
    ...initialListRequest,
    filters: [
      {
        fieldName: 'deleted_at',
        operator: 'isNull',
        value: undefined
      }
      , {
        fieldName: 'patient_key',
        operator: 'match',
        value: patient?.key
      },
      {
        fieldName: 'encounter_key',
        operator: 'match',
        value: encounter?.key
      }
    ],
  });

  // Fetch the list of Progress Notes based on the provided request, and provide a refetch function
  const { data: progressNotesResponse, refetch, isLoading } = useGetProgressNotesListQuery(progressNotesListRequest);

  // Check if the current row is selected by comparing keys, and return the 'selected-row' class if matched
  const isSelected = rowData => {
    if (rowData && progressNotes && progressNotes.key === rowData.key) {
      return 'selected-row';
    } else return '';
  };

  // Handle Cancel Progress Note Record
  const handleCancel = () => {
    //TODO convert key to code
    saveProgressNotes({ ...progressNotes, statusLkey: "3196709905099521", deletedAt: (new Date()).getTime() }).unwrap().then(() => {
      dispatch(notify({ msg: 'Progress Notes Canceled Successfully', sev: 'success' }));
      refetch();
    });
    setPopupCancelOpen(false);
  };
  // Handle Clear Fields
  const handleClearField = () => {
    setProgressNotes({ ...newApProgressNotes });
  };

  // Handle Add New Progress Notes Record
  const handleAddNewProgressNotes = () => {
    handleClearField();
    setOpenAddModal(true);
  };

  // Effects
  useEffect(() => {
    let updatedFilters = [
      {
        fieldName: 'patient_key',
        operator: 'match',
        value: patient?.key
      },
      {
        fieldName: 'encounter_key',
        operator: 'match',
        value: encounter?.key
      }
    ];

    if (!filterForm.showCancelled) {
      updatedFilters.push({
        fieldName: 'deleted_at',
        operator: 'isNull',
        value: undefined
      });
    }

    if (filterForm.showNurseNotes) {
      updatedFilters.push({
        fieldName: 'job_role_lkey',
        operator: 'match',
        value: '157153858530600'
      });
    }

    if (filterForm.showPhysicianNotes) {
      updatedFilters.push({
        fieldName: 'job_role_lkey',
        operator: 'match',
        value: '157153854130600'
      });
    }

    setProgressNotesListRequest(prev => ({
      ...prev,
      filters: updatedFilters
    }));
  }, [filterForm, patient?.key, encounter?.key]);

  // Table Column
  const columns = [
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
      render: rowData =>
        rowData?.jobRoleLvalue
          ? rowData.jobRoleLvalue.lovDisplayVale
          : rowData.jobRoleLkey,
    },
    {
      key: 'createdAt',
      title: 'CREATED AT/BY',
      render: (row: any) => row?.createdAt ? <>{row?.createdByUser?.fullName}<br /><span className='date-table-style'>{formatDateWithoutSeconds(row.createdAt)}</span> </> : ' '
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
      render: (row: any) => row?.updatedAt ? <>{row?.updatedByUser?.fullName}<br /><span className='date-table-style'>{formatDateWithoutSeconds(row.updatedAt)}</span> </> : ' '
    },
    {
      key: 'deletedAt',
      title: 'CANCELLED AT/BY',
      expandable: true,
      render: (row: any) => row?.deletedAt ? <>{row?.deletedByUser?.fullName}  <br /><span className='date-table-style'>{formatDateWithoutSeconds(row.deletedAt)}</span></> : ' '
    },
    {
      key: 'cancellationReason',
      title: 'CANCELLATION REASON',
      dataKey: 'cancellationReason',
      expandable: true,
    },
  ];
  // Pagination values
  const pageIndex = progressNotesListRequest.pageNumber - 1;
  const rowsPerPage = progressNotesListRequest.pageSize;
  const totalCount = progressNotesResponse?.extraNumeric ?? 0;

  return (
    <div>
      <AddProgressNotes open={openAddModal} setOpen={setOpenAddModal} progressNotesObj={progressNotes} patient={patient} encounter={encounter} edit={edit} refetch={refetch} />
      <div className="bt-div">
        <MyButton
          onClick={() => {
            setPopupCancelOpen(true);
          }}
          prefixIcon={() => <CloseOutlineIcon />}
          disabled={!progressNotes?.key}
        >
          <Translate>Cancel</Translate>
        </MyButton>
        <Form fluid layout='inline' >
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
            width={200}
            fieldLabel="Show Nurse Notes"
            fieldType="check"
            showLabel={false}
            fieldName="showNurseNotes"
            record={filterForm}
            setRecord={setFilterForm}
          />

          <MyInput
            column
            width={200}
            fieldLabel="Show Physician Notes"
            fieldType="check"
            fieldName="showPhysicianNotes"
            record={filterForm}
            showLabel={false}
            setRecord={setFilterForm}
          />

        </Form>
        <div className="bt-right">
          <MyButton onClick={handleAddNewProgressNotes} prefixIcon={() => <PlusIcon />}>
            Add{' '}
          </MyButton>
        </div>
      </div>
      <MyTable
        data={progressNotesResponse?.object ?? []}
        columns={columns}
        height={600}
        onRowClick={rowData => {
          setProgressNotes({ ...rowData });
        }}
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
