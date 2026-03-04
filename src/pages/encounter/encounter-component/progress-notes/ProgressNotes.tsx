import React, { useEffect, useMemo, useState } from 'react';
import { useAppDispatch } from '@/hooks';
import PlusIcon from '@rsuite/icons/Plus';
import CloseOutlineIcon from '@rsuite/icons/CloseOutline';
import { MdModeEdit } from 'react-icons/md';
import { Form } from 'rsuite';
import { useLocation } from 'react-router-dom';

import MyButton from '@/components/MyButton/MyButton';
import MyTable from '@/components/MyTable';
import MyInput from '@/components/MyInput';
import CancellationModal from '@/components/CancellationModal';
import AddProgressNotes from './AddProgressNotes';
import Translate from '@/components/Translate';
import { notify } from '@/utils/uiReducerActions';
import { formatDateWithoutSeconds } from '@/utils';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import {
  useFindByEncounterNotCancelledQuery,
  useFindByEncounterAllQuery,
  useCancelMutation
} from '@/services/patients/progressNoteService';

import { ProgressNote } from '@/types/model-types-new';
import { newProgressNote } from '@/types/model-types-constructor-new';
import ExpandableText from '@/components/ExpandMore/ExpandableText';
import { MdHistory } from 'react-icons/md';
import ProgressNoteLogsModal from './ProgressNoteLogsModal';

const ProgressNotes: React.FC = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const { patient, encounter, edit } = (location.state || {}) as {
    patient?: any;
    encounter?: any;
    edit?: boolean;
  };

  const [openAddModal, setOpenAddModal] = useState(false);
  const [popupCancelOpen, setPopupCancelOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<ProgressNote>({ ...newProgressNote });

  const [filterForm, setFilterForm] = useState({
    showCancelled: false
  });

  const [openLogsModal, setOpenLogsModal] = useState(false);
  const [logNoteId, setLogNoteId] = useState<number | null>(null);

  useEffect(() => {
    dispatch(setPageCode('Progress_Notes'));
    dispatch(setDivContent('Progress Notes'));
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch]);

  const queryHook = filterForm.showCancelled
    ? useFindByEncounterAllQuery
    : useFindByEncounterNotCancelledQuery;

  const { data, isLoading, refetch } = queryHook(
    {
      encounterId: encounter?.id
    },
    {
      skip: !encounter?.id
    }
  );

  const notes = data?.data ?? [];
  const totalCount = data?.totalCount ?? 0;

  const [cancelNote] = useCancelMutation();

  const handleCancel = async () => {
    try {
      await cancelNote({
        id: selectedNote.id,
        cancellationReason: selectedNote.cancellationReason!
      }).unwrap();

      dispatch(
        notify({
          msg: 'Progress Note cancelled successfully',
          sev: 'success'
        })
      );

      setPopupCancelOpen(false);
      refetch();
    } catch {
      dispatch(notify({ msg: 'Cancel failed', sev: 'error' }));
    }
  };

  const isSelected = (row: ProgressNote) => (selectedNote?.id === row.id ? 'selected-row' : '');

  const columns = useMemo(
    () => [
      {
        key: 'noteText',
        title: 'Progress Notes',
        dataKey: 'noteText',
        flexGrow: 2,
        render: (row: ProgressNote) => <ExpandableText text={row.noteText} lines={3} />
      },
      {
        key: 'created',
        title: 'CREATED AT / BY',
        render: (row: ProgressNote) =>
          row.createdDate ? (
            <>
              {row.createdBy}
              <br />
              <span className="date-table-style">{formatDateWithoutSeconds(row.createdDate)}</span>
            </>
          ) : null
      },

      {
        key: 'cancelled',
        title: 'CANCELLED AT / BY',
        expandable: true,
        render: (row: ProgressNote) =>
          row.cancelledDate ? (
            <>
              {row.cancelledBy}
              <br />
              <span className="date-table-style">
                {formatDateWithoutSeconds(row.cancelledDate)}
              </span>
            </>
          ) : null
      },
      {
        key: 'cancellationReason',
        title: 'CANCELLATION REASON',
        dataKey: 'cancellationReason',
        expandable: true
      },
      {
        key: 'lastModified',
        title: 'LAST MODIFIED AT / BY',
        expandable: true,
        render: (row: ProgressNote) =>
          row.lastModifiedDate ? (
            <>
              {row.lastModifiedBy}
              <br />
              <span className="date-table-style">
                {formatDateWithoutSeconds(row.lastModifiedDate)}
              </span>
            </>
          ) : null
      },
      {
        key: 'edit',
        title: 'ACTIONS',
        width: 120,
        render: (row: ProgressNote) => (
          <div style={{ display: 'flex', gap: 8 }}>
            <MdModeEdit
              size={22}
              onClick={() => {
                setSelectedNote(row);
                setOpenAddModal(true);
              }}
              style={{ cursor: 'pointer', color: 'gray' }}
            />

            <MdHistory
              size={22}
              title="View History"
              onClick={() => {
                setLogNoteId(row.id);
                setOpenLogsModal(true);
              }}
              style={{ cursor: 'pointer', color: '#4C6EF5' }}
            />
          </div>
        )
      }
    ],
    []
  );

  return (
    <div>
      <AddProgressNotes
        open={openAddModal}
        setOpen={setOpenAddModal}
        progressNote={selectedNote}
        patient={patient}
        encounter={encounter}
        edit={!!edit}
        refetch={refetch}
      />

      <div className="bt-div-3">
        <MyButton
          onClick={() => setPopupCancelOpen(true)}
          prefixIcon={() => <CloseOutlineIcon />}
          disabled={!selectedNote?.id || selectedNote?.cancelledDate}
        >
          <Translate>Cancel</Translate>
        </MyButton>

        <Form>
          <MyInput
            column
            width={220}
            fieldLabel="Show Cancelled"
            fieldType="check"
            showLabel={false}
            fieldName="showCancelled"
            record={filterForm}
            setRecord={setFilterForm}
          />
        </Form>

        <div className="bt-right-3">
          <MyButton
            onClick={() => {
              setSelectedNote({ ...newProgressNote });
              setOpenAddModal(true);
            }}
            prefixIcon={() => <PlusIcon />}
          >
            Add
          </MyButton>
        </div>
      </div>

      <MyTable
        data={notes}
        columns={columns}
        height={600}
        loading={isLoading}
        onRowClick={row => setSelectedNote(row)}
        rowClassName={isSelected}
        totalCount={totalCount}
      />

      <CancellationModal
        title="Cancel Progress Note"
        fieldLabel="Cancellation Reason"
        open={popupCancelOpen}
        setOpen={setPopupCancelOpen}
        object={selectedNote}
        setObject={setSelectedNote}
        handleCancle={handleCancel}
        fieldName="cancellationReason"
        required
      />

      <ProgressNoteLogsModal
        open={openLogsModal}
        setOpen={open => {
          setOpenLogsModal(open);
          if (!open) setLogNoteId(null);
        }}
        progressNoteId={logNoteId}
      />
    </div>
  );
};

export default ProgressNotes;
