//imports
import UserSearch from '@/images/svgs/UserSearch';
import clsx from 'clsx';
import MyInput from '@/components/MyInput';
import MyButton from '../MyButton/MyButton';
import React, { useState } from 'react';
import { FaArrowRight, FaX } from 'react-icons/fa6';
import { RadioGroup } from 'rsuite';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import { Button, Form, Nav, Panel, Sidebar, Sidenav } from 'rsuite';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { useAppSelector } from '@/hooks';
import './style.less';

interface StickyNote {
  id: number;
  text: string;
  createdAt: string;
  level?: string;
  color?: string;
}

interface UserStickyNotesProps {
  expand: boolean;
  setExpand: (value: boolean) => void;
  windowHeight: number;
  title?: string;
  direction?: 'left' | 'right';
  showButton?: boolean;
}

const UserStickyNotes: React.FC<UserStickyNotesProps> = ({
  expand,
  setExpand,
  windowHeight,
  title = 'User Sticky Notes',
  direction = 'left',
  showButton = true
}) => {
  const mode = useAppSelector((state: any) => state.ui.mode);
  const [noteInput, setNoteInput] = useState({
    note: '',
    level: '',
    color: ''
  });

  const [notes, setNotes] = useState<StickyNote[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<StickyNote | null>(null);

  const { data: lowMidHighLovQueryResponse } = useGetLovValuesByCodeQuery('LOW_MOD_HIGH');

  const colorOptions = [
    { label: 'Purple', value: '--note-purple' },
    { label: 'Red', value: '--note-red' },
    { label: 'Blue', value: '--note-blue' },
    { label: 'Green', value: '--note-green' },
    { label: 'Yellow', value: '--note-yellow' }
  ];

  // Open delete confirmation modal
  const openDeleteModal = (note: StickyNote) => {
    setNoteToDelete(note);
    setModalOpen(true);
  };

  // Confirm delete
  const confirmDelete = () => {
    if (noteToDelete) {
      setNotes(notes.filter(note => note.id !== noteToDelete.id));
      setNoteToDelete(null);
      setModalOpen(false);
    }
  };

  // Render main sticky notes form and list
  const userStickyNotes = () => (
    <Form fluid>
      {/* Note input */}
      <MyInput
        width="346px"
        fieldType="textarea"
        fieldLabel="Note"
        fieldName="note"
        height={120}
        record={noteInput}
        setRecord={setNoteInput}
      />

      {/* Priority select */}
      <MyInput
        fieldLabel="Priority Level"
        fieldName="level"
        fieldType="select"
        selectData={lowMidHighLovQueryResponse?.object ?? []}
        selectDataLabel="lovDisplayVale"
        selectDataValue="key"
        searchable={false}
        record={noteInput}
        setRecord={setNoteInput}
        width={350}
      />

      {/* Color selector */}
      <div className="color-radio-wrapper">
        <label className="label">Choose Color</label>
        <RadioGroup
          name="color"
          value={noteInput.color || ''}
          onChange={value => setNoteInput({ ...noteInput, color: value })}
          inline
        >
          {colorOptions.map(option => (
            <label key={option.value} className="color-radio">
              <input
                type="radio"
                value={option.value}
                checked={noteInput.color === option.value}
                onChange={() => setNoteInput({ ...noteInput, color: option.value })}
                style={{ display: 'none' }}
              />
              <div
                className={`color-circle ${noteInput.color === option.value ? 'active' : ''}`}
                style={{ backgroundColor: `var(${option.value})` }}
              >
                {noteInput.color === option.value && <span className="checkmark">✓</span>}
              </div>
            </label>
          ))}
        </RadioGroup>
      </div>

      {/* Save button */}
      <MyButton
        onClick={() => {
          if (!noteInput.note.trim()) return;
          const newNote = {
            id: Date.now(),
            text: noteInput.note,
            createdAt: new Date().toLocaleString(),
            level: noteInput.level || 'low',
            color: noteInput.color || '--note-yellow'
          };
          setNotes([newNote, ...notes]);
          setNoteInput({ note: '', level: '', color: '' });
        }}
      >
        Save
      </MyButton>
      {/* Notes list */}
      <div className="note-list-wrapper">
        {notes.map(note => (
          <div key={note.id} className="note-box" style={{ backgroundColor: `var(${note.color})` }}>
            <strong className="note-level">{note.level}</strong>
            <div>{note.text}</div>
            <div className="note-footer">
              <span>{note.createdAt}</span>
              <button
                onClick={() => openDeleteModal(note)}
                className="delete-note-btn"
                title="Delete Note"
              >
                <FaX />
              </button>
            </div>
          </div>
        ))}
      </div>
    </Form>
  );

  return (
    <div
      className={clsx(`user-sticky-sidebar-wrapper ${mode === 'light' ? 'light' : 'dark'}`, {
        expanded: expand,
        'not-expanded': !expand
      })}
    >
      <Sidebar width={expand ? 370 : 56} collapsible className="profile-sidebar">
        <Sidenav expanded={expand} appearance="subtle" className="profile-sidenav">
          <Sidenav.Body>
            <Nav>
              {expand ? (
                <Panel header={title} className="sidebar-panel">
                  {showButton && (
                    <Button onClick={() => setExpand(false)} className="expand-sidebar">
                      <FaArrowRight />
                    </Button>
                  )}
                  {userStickyNotes()}
                </Panel>
              ) : (
                <Button onClick={() => setExpand(true)} className="user-search-btn">
                  <UserSearch />
                </Button>
              )}
            </Nav>
          </Sidenav.Body>
        </Sidenav>
      </Sidebar>

      {/* Modal for delete confirmation */}
      <DeletionConfirmationModal
        open={modalOpen}
        setOpen={setModalOpen}
        itemToDelete={`note: "${noteToDelete?.text.substring(0, 20)}..."`}
        actionButtonFunction={confirmDelete}
        actionType="delete"
        confirmationQuestion="Are you sure you want to delete this note?"
        actionButtonLabel="Delete"
      />
    </div>
  );
};

export default UserStickyNotes;
