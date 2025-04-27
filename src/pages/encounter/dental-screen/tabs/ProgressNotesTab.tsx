import React from 'react';
import { ButtonToolbar, IconButton, Divider, Table, Input } from 'rsuite';
import * as icons from '@rsuite/icons';
import Translate from '@/components/Translate';
import {
  useSaveProgressNotesMutation,
  useDeleteProgressNoteMutation
} from '@/services/dentalService';

const { Column, HeaderCell, Cell } = Table;

const ProgressNotesTab = ({ progressNotes, setProgressNotes, currentChart, dispatch }) => {
  const [saveProgressNotes, saveProgressNotesMutation] = useSaveProgressNotesMutation();
  const [deleteProgressNote, deleteProgressNotesMutation] = useDeleteProgressNoteMutation();

  // Handle save progress notes response
  React.useEffect(() => {
    if (saveProgressNotesMutation.status === 'fulfilled') {
      setProgressNotes(saveProgressNotesMutation.data);
    } else if (saveProgressNotesMutation.status === 'rejected') {
      dispatch({ type: 'NOTIFY', payload: { msg: 'Save Failed', sev: 'error' } });
    }
  }, [saveProgressNotesMutation, setProgressNotes, dispatch]);

  // Handle delete progress note response
  React.useEffect(() => {
    if (deleteProgressNotesMutation.status === 'fulfilled') {
      // Filter out the deleted note from the progressNotes array
      const updatedProgressNotes = progressNotes.filter(
        note => note.key !== deleteProgressNotesMutation.data.key
      );
      setProgressNotes(updatedProgressNotes);
    } else if (deleteProgressNotesMutation.status === 'rejected') {
      dispatch({ type: 'NOTIFY', payload: { msg: 'Delete Failed', sev: 'error' } });
    }
  }, [deleteProgressNotesMutation, progressNotes, setProgressNotes, dispatch]);

  const handleProgressNoteChange = (value, index) => {
    const notesClone = [...progressNotes];
    const object = { ...notesClone[index] };
    object.note = value;
    notesClone[index] = object;
    setProgressNotes(notesClone);
  };

  return (
    <>
      <ButtonToolbar>
        <IconButton
          appearance="primary"
          icon={<icons.Plus />}
          onClick={() => {
            setProgressNotes([
              { key: null, chartKey: currentChart.key, note: '' },
              ...progressNotes
            ]);
          }}
        >
          <Translate>Add New</Translate>
        </IconButton>
        <Divider vertical />
        <IconButton
          style={{ margin: '5px' }}
          appearance="primary"
          color="green"
          icon={<icons.Check />}
          onClick={() => {
            saveProgressNotes(progressNotes).unwrap();
          }}
        >
          <Translate>Save Notes</Translate>
        </IconButton>
      </ButtonToolbar>

      <Table height={400} rowHeight={100} bordered data={progressNotes}>
        <Column flexGrow={6} align="center" fixed>
          <HeaderCell>
            <Translate>Progress Note</Translate>
          </HeaderCell>
          <Cell>
            {(rowData, rowIndex) => (
              <Input
                style={{ padding: '10px' }}
                as="textarea"
                rows={3}
                placeholder="Insert new note... "
                value={rowData.note}
                onChange={e => handleProgressNoteChange(e, rowIndex)}
              />
            )}
          </Cell>
        </Column>
        <Column flexGrow={3}>
          <HeaderCell>
            <Translate>Audit</Translate>
          </HeaderCell>
          <Cell>
            {rowData => (
              <small style={{ color: '#363636', fontSize: '75%' }}>
                {rowData.createAudit}
                <br />
                {rowData.updatedAudit && ' / '.concat(rowData.updatedAudit)}
              </small>
            )}
          </Cell>
        </Column>
        <Column flexGrow={1} align="center">
          <HeaderCell>
            <Translate>Delete</Translate>
          </HeaderCell>
          <Cell>
            {rowData => (
              <IconButton
                style={{ margin: '3px', position: 'absolute', right: '5%' }}
                size="xs"
                onClick={() => {
                  deleteProgressNote(rowData).unwrap();
                }}
                icon={<icons.Close />}
                appearance="ghost"
                color="red"
              />
            )}
          </Cell>
        </Column>
      </Table>
    </>
  );
};

export default ProgressNotesTab;
