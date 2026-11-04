import React, { useEffect, useState } from 'react';
import { Box, InputBase, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';

import {
  useGetProgressNotesByChartQuery,
  useSaveProgressNotesMutation,
  useDeleteProgressNoteMutation
} from '@/services/dental/dentalChartService';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal/DeletionConfirmationModal';
import MyButton from '@/components/MyButton/MyButton';
import { FaCheck } from 'react-icons/fa6';
import { Panel } from 'rsuite';

interface ProgressNotesTabProps {
  chartId: number;
  dispatch: (action: any) => void;
}

const ProgressNotesTab: React.FC<ProgressNotesTabProps> = ({ chartId, dispatch }) => {
  const { data: progressNotesData } = useGetProgressNotesByChartQuery(chartId, {
    skip: !chartId
  });

  const [progressNotes, setProgressNotes] = useState<any[]>([]);

  useEffect(() => {
    setProgressNotes(progressNotesData ?? []);
  }, [progressNotesData]);

  const [saveProgressNotes, saveProgressNotesMutation] = useSaveProgressNotesMutation();
  const [deleteProgressNote, deleteProgressNotesMutation] = useDeleteProgressNoteMutation();
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<any>(null);

  // Save notes effect
  useEffect(() => {
    if (saveProgressNotesMutation.status === 'fulfilled') {
      setProgressNotes(saveProgressNotesMutation.data);
    } else if (saveProgressNotesMutation.status === 'rejected') {
      dispatch({ type: 'NOTIFY', payload: { msg: 'Save Failed', sev: 'error' } });
    }
  }, [saveProgressNotesMutation.status]);

  // Delete note effect
  useEffect(() => {
    if (deleteProgressNotesMutation.status === 'fulfilled') {
      setProgressNotes(prev => prev.filter(note => note.id !== noteToDelete?.id));
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
          placeholder="Insert new note..."
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
        <Box>
          {row.createdBy}
          {row.createdDate && ` / ${row.createdDate}`}
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
              onClick={() => setProgressNotes([{ id: null, note: '' }, ...progressNotes])}
            >
              <AddIcon /> Add New
            </MyButton>
            <MyButton
              onClick={() =>
                saveProgressNotes({
                  chartId,
                  notes: progressNotes.map(n => ({ id: n.id, note: n.note }))
                }).unwrap()
              }
              disabled={saveProgressNotesMutation.isLoading || !chartId}
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
          if (noteToDelete?.id) {
            deleteProgressNote(noteToDelete.id).unwrap();
          } else if (noteToDelete) {
            setProgressNotes(prev => prev.filter(n => n !== noteToDelete));
          }
          setConfirmDeleteOpen(false);
        }}
        actionType="delete"
      />
    </Panel>
  );
};

export default ProgressNotesTab;
