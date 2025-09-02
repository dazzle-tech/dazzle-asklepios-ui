import UserSearch from '@/images/svgs/UserSearch';
import clsx from 'clsx';
import MyInput from '@/components/MyInput';
import MyButton from '../MyButton/MyButton';
import React, { useState } from 'react';
import { FaArrowRight, FaX} from 'react-icons/fa6';
import { RadioGroup } from 'rsuite';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import './style.less';
import { Button, Form, Nav, Panel, Sidebar, Sidenav } from 'rsuite';
interface StickyNote {
  id: number;
  text: string;
  createdAt: string;
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
  const [noteInput, setNoteInput] = useState({
    note: '',
    level: '',
    color: ''
  });
  const [notes, setNotes] = useState<StickyNote[]>([]);

  const addNote = () => {
    if (!noteInput.trim()) return;
    const newNote: StickyNote = {
      id: Date.now(),
      text: noteInput,
      createdAt: new Date().toLocaleString()
    };
    setNotes([newNote, ...notes]);
    setNoteInput('');
  };
  const [modalOpen, setModalOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<StickyNote | null>(null);

  const colorOptions = [
    { label: 'Purple', value: '--note-purple' },
    { label: 'Red', value: '--note-red' },
    { label: 'Blue', value: '--note-blue' },
    { label: 'Green', value: '--note-green' },
    { label: 'Yellow', value: '--note-yellow' }
  ];

  const handleDeleteNote = (id: number) => {
    setNotes(notes.filter(note => note.id !== id));
  };

  const openDeleteModal = (note: StickyNote) => {
    setNoteToDelete(note);
    setModalOpen(true);
  };

  const confirmDelete = () => {
    if (noteToDelete) {
      setNotes(notes.filter(note => note.id !== noteToDelete.id));
      setNoteToDelete(null);
      setModalOpen(false);
    }
  };

  const userStickyNotes = () => {
    return (
      <Form fluid>
        <MyInput
          width={'350px'}
          fieldType="textarea"
          fieldLabel="Note"
          fieldName="note"
          height={120}
          record={noteInput}
          setRecord={setNoteInput}
        />

        <MyInput
          fieldLabel="Priority Level"
          fieldName="level"
          fieldType="select"
          selectData={[
            { key: 'low', Label: 'Low' },
            { key: 'mid', Label: 'Mid' },
            { key: 'high', Label: 'High' }
          ]}
          selectDataLabel="Label"
          selectDataValue="key"
          record={noteInput}
          setRecord={setNoteInput}
          width={350}
        />

        <div className="notes-container">
          <label style={{ fontWeight: 'bold' }}>Choose Color</label>
          <RadioGroup
            name="color"
            value={noteInput.color || ''}
            onChange={value => setNoteInput({ ...noteInput, color: value })}
            inline
          >
            {colorOptions.map(option => (
              <label
                key={option.value}
                style={{
                  display: 'inline-block',
                  marginRight: '12px',
                  cursor: 'pointer'
                }}
              >
                <input
                  type="radio"
                  value={option.value}
                  checked={noteInput.color === option.value}
                  onChange={() => setNoteInput({ ...noteInput, color: option.value })}
                  style={{ display: 'none' }}
                />
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: `var(${option.value})`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border:
                      noteInput.color === option.value ? '2px solid #000' : '2px solid transparent',
                    transition: 'border 0.2s ease-in-out',
                    marginTop: '0.5VW',
                    marginBottom: '0.5vw'
                  }}
                >
                  {noteInput.color === option.value && (
                    <span style={{ color: '#fff', fontSize: '14px' }}>✓</span>
                  )}
                </div>
              </label>
            ))}
          </RadioGroup>
        </div>

        <MyButton
          onClick={() => {
            if (!noteInput.note.trim()) return;
            const newNote = {
              id: Date.now(),
              text: noteInput.note,
              createdAt: new Date().toLocaleString(),
              level: noteInput.level || 'low',
              color: noteInput.color || '--primary-yellow'
            };
            setNotes([newNote, ...notes]);
            setNoteInput({ note: '', level: '', color: '' });
          }}
        >
          Save
        </MyButton>

        <div className="note-list-wrapper">
          {notes.map(note => (
            <div
              key={note.id}
              className="note-box"
              style={{
                backgroundColor: `var(${note.color})`,
                padding: '16px',
                borderRadius: '8px',
                marginTop: '20px',
                width: '330px',
                color: '#000',
                border: '1px solid #ccc',
                maxHeight: '200px',
                overflowY: 'auto',
                boxSizing: 'border-box'
              }}
            >
              <strong
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '15px'
                }}
              >
                {note.level}
              </strong>

              <div>{note.text}</div>

              <div
                style={{
                  fontSize: '12px',
                  marginTop: '8px',
                  color: '#555',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span>{note.createdAt}</span>
                <button
                  onClick={() => openDeleteModal(note)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#333',
                    padding: 0
                  }}
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
  };

  return (
    <div
      className={clsx('user-sticky-sidebar-wrapper', {
        expanded: expand,
        'not-expanded': !expand
      })}
    >
      <Sidebar width={expand ? 370 : 56} collapsible className="profile-sidebar">
        <Sidenav
          expanded={expand}
          appearance="subtle"
          defaultOpenKeys={['2', '3']}
          className="profile-sidenav"
        >
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
                <Button
                  onClick={() => {
                    setExpand(true);
                  }}
                  className="user-search-btn"
                >
                  <UserSearch />
                </Button>
              )}
            </Nav>
          </Sidenav.Body>
        </Sidenav>
      </Sidebar>

      <DeletionConfirmationModal
        open={modalOpen}
        setOpen={setModalOpen}
        itemToDelete={`note: "${noteToDelete?.text.substring(0, 20)}..."`}
        actionButtonFunction={confirmDelete}
        actionType="delete"
        confirmationQuestion={`Are you sure you want to delete this note?`}
        actionButtonLabel="Delete"
      />
    </div>
  );
};

export default UserStickyNotes;
