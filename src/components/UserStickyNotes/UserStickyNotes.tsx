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
import { useAppDispatch, useAppSelector } from '@/hooks';
import { conjureOrderBasedOnKeyFromListOfValues, conjureValueBasedOnKeyFromListOfValues } from '@/utils';
import './style.less';
import {
  useCreateUserStickyNotesMutation,
  useDeleteUserStickyNotesMutation,
  useGetAlluserStickyNotesByUserIdQuery
} from '@/services/setup/userStickyNotes/userStickyNotes';
import { UserStickyNotesCreateVM } from '@/types/model-types-new';
import { newUserStickyNotesCreateVM } from '@/types/model-types-constructor-new';
import { notify } from '@/utils/uiReducerActions';

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
  title = 'User Sticky Notes',
  showButton = true
}) => {
  const dispatch = useAppDispatch();
  const mode = useAppSelector((state: any) => state.ui.mode);
  const user = JSON.parse(localStorage.getItem('user'));
  const [userStickyNotesCreateVM, setUserStickyNotesCreateVM] = useState<UserStickyNotesCreateVM>({
    ...newUserStickyNotesCreateVM
  });
  console.log(user);
  console.log("user");
  const { data: getUserStickyNotes, refetch } = useGetAlluserStickyNotesByUserIdQuery(user?.id);
  const [createUserStickyNotes] = useCreateUserStickyNotesMutation();
  const [deleteUserStickyNotes] = useDeleteUserStickyNotesMutation();

  
  const [modalOpen, setModalOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<StickyNote | null>(null);

  const { data: lowMidHighLovQueryResponse } = useGetLovValuesByCodeQuery('LOW_MOD_HIGH');
  console.log(lowMidHighLovQueryResponse);
  console.log("lowMidHighLovQueryResponse");

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
      deleteUserStickyNotes(noteToDelete?.id)
        .unwrap()
        .then(() => {
          dispatch(
          notify({ msg: 'The Sticky Note has been deleted successfully', sev: 'success' })
          );
          refetch();
        }).catch(e => {
          dispatch(
          notify({ msg: e?.data?.fieldErrors[0]?.message, sev: 'error' })
          );
        });
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
        record={userStickyNotesCreateVM}
        setRecord={setUserStickyNotesCreateVM}
        required
      />

      {/* Priority select */}
      <MyInput
        fieldLabel="Priority Level"
        fieldName="priority"
        fieldType="select"
        selectData={lowMidHighLovQueryResponse?.object ?? []}
        selectDataLabel="lovDisplayVale"
        selectDataValue="key"
        searchable={false}
        record={userStickyNotesCreateVM}
        setRecord={setUserStickyNotesCreateVM}
        width={350}
        required
      />

      {/* Color selector */}
      <div className="color-radio-wrapper">
        <label className="label">Choose Color</label>
        <RadioGroup
          name="color"
          value={userStickyNotesCreateVM.color || ''}
          onChange={value =>
            setUserStickyNotesCreateVM({ ...userStickyNotesCreateVM, color: String(value) })
          }
          inline
        >
          {colorOptions.map(option => (
            <label key={option.value} className="color-radio">
              <input
                type="radio"
                value={option.value}
                checked={userStickyNotesCreateVM.color === option.value}
                onChange={() =>
                  setUserStickyNotesCreateVM({ ...userStickyNotesCreateVM, color: option.value })
                }
                style={{ display: 'none' }}
              />
              <div
                className={`color-circle ${
                  userStickyNotesCreateVM.color === option.value ? 'active' : ''
                }`}
                style={{ backgroundColor: `var(${option.value})` }}
              >
                {userStickyNotesCreateVM.color === option.value && (
                  <span className="checkmark">✓</span>
                )}
              </div>
            </label>
          ))}
        </RadioGroup>
      </div>

      {/* Save button */}
      <MyButton
        onClick={() => {
          const order_value = conjureOrderBasedOnKeyFromListOfValues(
            lowMidHighLovQueryResponse?.object ?? [],
            userStickyNotesCreateVM?.priority,
            'valueOrder'
          );
          const toCreate = { ...userStickyNotesCreateVM, userId: user?.id, priorityOrder: order_value };
          console.log("toCreate");
          console.log(toCreate);
          createUserStickyNotes(toCreate)
            .unwrap()
            .then(() => {
              setUserStickyNotesCreateVM({...newUserStickyNotesCreateVM})
              refetch();
              dispatch(
               notify({ msg: 'The Sticky Note has been saved successfully', sev: 'success' })
              );
            })
            .catch(e => {
              dispatch(
             notify({ msg: e?.data?.fieldErrors[0]?.message, sev: 'error' })
              );
            });
        }}
      >
        Save
      </MyButton>
      {/* Notes list */}
      <div className="note-list-wrapper">
        {getUserStickyNotes?.map(note => {
          // Get the display value for the priority level from LOV
          const priorityDisplayValue = conjureValueBasedOnKeyFromListOfValues(
            lowMidHighLovQueryResponse?.object ?? [],
            note?.priority,
            'lovDisplayVale'
          );

          return (
            <div
              key={note.id}
              className="note-box"
              style={{ backgroundColor: `var(${note.color})` }}
            >
              <strong className="note-level">{priorityDisplayValue}</strong>
              <div>{note.note}</div>
              <div className="note-footer">
                <span>{new Date(note.createdDate).toLocaleString()}</span>
                <button
                  onClick={() => openDeleteModal(note)}
                  className="delete-note-btn"
                  title="Delete Note"
                >
                  <FaX />
                </button>
              </div>
            </div>
          );
        })}
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
        itemToDelete={`note: "${noteToDelete?.note?.substring(0, 20)}..."`}
        actionButtonFunction={confirmDelete}
        actionType="delete"
        confirmationQuestion="Are you sure you want to delete this note?"
        actionButtonLabel="Delete"
      />
    </div>
  );
};

export default UserStickyNotes;
