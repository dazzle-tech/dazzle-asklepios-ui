import React, { useEffect, useState } from 'react';
import { Box, InputBase, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal/DeletionConfirmationModal';
import { FaCheck } from 'react-icons/fa6';
import { Panel } from 'rsuite';
import {
  useSaveProgressNotesMutation,
  useDeleteProgressNoteMutation
} from '@/services/dentalService';

interface ProgressNotesTabProps {
  progressNotes: any[];
  setProgressNotes: (notes: any[]) => void;
  currentChart: any;
  dispatch: (action: any) => void;
}

const AddProgressNotes: React.FC<ProgressNotesTabProps> = ({
  progressNotes,
  setProgressNotes,
  currentChart,
  dispatch
}) => {
  const [saveProgressNotes, saveProgressNotesMutation] = useSaveProgressNotesMutation();
  const [deleteProgressNote, deleteProgressNotesMutation] = useDeleteProgressNoteMutation();
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<any>(null);

  useEffect(() => {
    if (saveProgressNotesMutation.status === 'fulfilled') {
      setProgressNotes(saveProgressNotesMutation.data);
    } else if (saveProgressNotesMutation.status === 'rejected') {
      dispatch({ type: 'NOTIFY', payload: { msg: 'Save Failed', sev: 'error' } });
    }
  }, [saveProgressNotesMutation.status]);

  useEffect(() => {
    if (deleteProgressNotesMutation.status === 'fulfilled') {
      setProgressNotes(prev => prev.filter(note => note.key !== noteToDelete?.key));
      setNoteToDelete(null);
    } else if (deleteProgressNotesMutation.status === 'rejected') {
      dispatch({ type: 'NOTIFY', payload: { msg: 'Delete Failed', sev: 'error' } });
    }
  }, [deleteProgressNotesMutation.status]);

  const handleNoteChange = (value: string, index: number) => {
    const updatedNotes = [...progressNotes];
    updatedNotes[index] = { ...updatedNotes[index], note: value };
    setProgressNotes(updatedNotes);
  };

  const columns = [
    {
      key: 'note',
      title: <Translate>Progress Note</Translate>,
      render: (row: any, index: number) => (
        <InputBase
          multiline
          fullWidth
          value={row.note}
          onChange={e => handleNoteChange(e.target.value, index)}
          sx={{ padding: 1, border: '1px solid #ccc', borderRadius: 1 }}
        />
      )
    },
    {
      key: 'audit',
      title: <Translate>Audit</Translate>,
      render: (row: any) => (
        <Box sx={{ color: '#444' }}>
          {row.createAudit}
          {row.updatedAudit && ` / ${row.updatedAudit}`}
        </Box>
      )
    },
    {
      key: 'actions',
      title: <Translate>Delete</Translate>,
      align: 'center' as const,
      render: (row: any) => (
        <IconButton
          size="small"
          onClick={() => {
            setNoteToDelete(row);
            setConfirmDeleteOpen(true);
          }}
        >
          <DeleteIcon color="error" />
        </IconButton>
      )
    }
  ];

  return (
    <Panel
      header={
        <Box display={'flex'} justifyContent={'space-between'} gap={2} my={1}>
          <Translate>Progress Notes</Translate>
          <Box display="flex" gap={2} justifyContent={'flex-end'}>
            <MyButton
              onClick={() =>
                setProgressNotes([
                  { key: null, chartKey: currentChart.key, note: '' },
                  ...progressNotes
                ])
              }
            >
              <AddIcon /> Add New
            </MyButton>
            <MyButton
              onClick={() => saveProgressNotes(progressNotes).unwrap()}
              disabled={saveProgressNotesMutation.isLoading}
            >
              <FaCheck /> Save Notes
            </MyButton>
          </Box>
        </Box>
      }
    >
      <MyTable
        data={progressNotes}
        columns={columns}
        height={400}
        loading={saveProgressNotesMutation.isLoading}
      />

      <DeletionConfirmationModal
        open={confirmDeleteOpen}
        setOpen={setConfirmDeleteOpen}
        itemToDelete="note"
        actionButtonFunction={() => {
          if (noteToDelete) {
            deleteProgressNote(noteToDelete).unwrap();
          }
          setConfirmDeleteOpen(false);
        }}
        actionType="delete"
      />
    </Panel>
  );
};

export default AddProgressNotes;
