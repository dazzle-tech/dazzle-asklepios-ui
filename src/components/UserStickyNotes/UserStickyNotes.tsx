//imports
import UserSearch from '@/images/svgs/UserSearch';
import clsx from 'clsx';
import MyInput from '@/components/MyInput';
import MyButton from '../MyButton/MyButton';
import React, { useState, useMemo } from 'react';
import { FaArrowRight, FaX } from 'react-icons/fa6';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import { 
  Button, 
  Form, 
  Nav, 
  Panel, 
  Sidebar, 
  Sidenav, 
  RadioGroup, 
  DOMHelper
} from 'rsuite';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { useAppDispatch, useAppSelector } from '@/hooks';
import {
  conjureOrderBasedOnKeyFromListOfValues,
  conjureValueBasedOnKeyFromListOfValues,
  conjureValueBasedOnKeyFromList
} from '@/utils';
import './style.less';
import {
  useCreateUserStickyNotesMutation,
  useDeleteUserStickyNotesMutation,
  useGetAlluserStickyNotesByUserIdQuery
} from '@/services/setup/userStickyNotes/userStickyNotes';
import { UserStickyNotesCreateVM } from '@/types/model-types-new';
import { newUserStickyNotesCreateVM } from '@/types/model-types-constructor-new';
import { notify } from '@/utils/uiReducerActions';
import type { ApPatient } from '@/types/model-types';
import ProfileSidebar from '@/pages/patient/patient-profile/ProfileSidebar-new';
import { useGetPatientsQuery, useLazyGetPatientByIdQuery } from '@/services/patientService';
import { setPatient, setEncounter } from '@/reducers/patientSlice';
import { useNavigate } from 'react-router-dom';
import { ListRequest, initialListRequest } from '@/types/types';

interface StickyNote {
  id: number;
  note: string;
  createdDate: string;
  priority?: string;
  color?: string;
  patientId?: string;
  patientName?: string;
}

interface UserStickyNotesProps {
  expand: boolean;
  setExpand: (value: boolean) => void;
  windowHeight: number;
  title?: string;
  direction?: 'left' | 'right';
  showButton?: boolean;
}

const { getHeight } = DOMHelper;

const UserStickyNotes: React.FC<UserStickyNotesProps> = ({
  expand,
  setExpand,
  windowHeight,
  title = 'User Sticky Notes',
  showButton = true
}) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const mode = useAppSelector((state: any) => state.ui.mode);
  const user = JSON.parse(localStorage.getItem('user'));
  const [userStickyNotesCreateVM, setUserStickyNotesCreateVM] = useState<UserStickyNotesCreateVM>({
    ...newUserStickyNotesCreateVM
  });
  const { data: getUserStickyNotes, refetch } = useGetAlluserStickyNotesByUserIdQuery(user?.id);
  const [createUserStickyNotes] = useCreateUserStickyNotesMutation();
  const [deleteUserStickyNotes] = useDeleteUserStickyNotesMutation();

  const [modalOpen, setModalOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<StickyNote | null>(null);
  const [patientSidebarExpand, setPatientSidebarExpand] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<ApPatient | null>(null);
  const [refetchPatientData, setRefetchPatientData] = useState(false);
  const [fetchPatientById] = useLazyGetPatientByIdQuery();

  const { data: lowMidHighLovQueryResponse } = useGetLovValuesByCodeQuery('LOW_MOD_HIGH');

  // Extract unique patient IDs from notes
  const uniquePatientIds = useMemo(
    () =>
      getUserStickyNotes
        ?.filter(note => note.patientId)
        .map(note => String(note.patientId))
        .filter((id, index, self) => self.indexOf(id) === index) || [],
    [getUserStickyNotes]
  );

  // Fetch all patients in one query, filtered by sticky note patient IDs
  const { data: allPatientsResponse } = useGetPatientsQuery(
    {
      ...initialListRequest,
      pageSize: 10000,
      filters:
        uniquePatientIds.length > 0
          ? [
              {
                fieldName: 'key',
                operator: 'in',
                value: uniquePatientIds.map(id => `(${id})`).join(' ')
              }
            ]
          : []
    },
    {
      skip: uniquePatientIds.length === 0
    }
  );

  // Patients returned from query already filtered by IDs
  const patientsList = useMemo(() => {
    if (!allPatientsResponse?.object) {
      return [];
    }

    return allPatientsResponse.object.map((patient: ApPatient) => ({
      ...patient,
      key: patient.key ? String(patient.key) : String(patient.key)
    }));
  }, [allPatientsResponse]);

  const handleOpenEmrFromNote = async (note: any) => {
    if (!note.patientId) {
      return;
    }

    try {
      const patient = await fetchPatientById(String(note.patientId)).unwrap();
      if (patient) {
        dispatch(setPatient(patient));
        dispatch(setEncounter(null));
        navigate('/patient-EMR', {
          state: {
            patient,
            fromPage: 'UserStickyNotes',
            inModal: true
          }
        });
      }
    } catch (e) {
      dispatch(
        notify({
          msg: 'Unable to open EMR for this patient.',
          sev: 'error'
        })
      );
    }
  };

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

  const handlePatientSelect = (patient: ApPatient) => {
    setSelectedPatient(patient);
    setUserStickyNotesCreateVM({
      ...userStickyNotesCreateVM,
      patientId: patient?.key || undefined
    });
    setPatientSidebarExpand(false);
  };

  // Render main sticky notes form and list
  const userStickyNotes = () => (
    <Form fluid>
      {/* Patient selection */}
      <div style={{ marginBottom: '16px' }}>
        <label className="label" style={{ display: 'block', marginBottom: '8px' }}>
          Patient (Optional)
        </label>
        {selectedPatient ? (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            padding: '8px 12px',
            border: '1px solid var(--rs-border-primary)',
            borderRadius: '6px',
            backgroundColor: 'var(--rs-gray-50)',
            marginBottom: '8px'
          }}>
            <span>{selectedPatient.fullName} - {selectedPatient.patientMrn}</span>
            <Button
              size="sm"
              onClick={() => {
                setSelectedPatient(null);
                setUserStickyNotesCreateVM({
                  ...userStickyNotesCreateVM,
                  patientId: undefined
                });
              }}
            >
              <FaX />
            </Button>
          </div>
        ) : null}
        <Button
          onClick={() => setPatientSidebarExpand(true)}
          appearance="ghost"
          style={{ width: '100%' }}
        >
          {selectedPatient ? 'Change Patient' : 'Select Patient'}
        </Button>
      </div>

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
          const toCreate = { 
            ...userStickyNotesCreateVM, 
            userId: user?.id, 
            priorityOrder: order_value,
            patientId: selectedPatient?.key || userStickyNotesCreateVM.patientId || undefined
          };
          createUserStickyNotes(toCreate)
            .unwrap()
            .then(() => {
              setUserStickyNotesCreateVM({...newUserStickyNotesCreateVM})
              setSelectedPatient(null);
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

          const patientIdStr = note.patientId ? String(note.patientId) : null;
          const patientFullName = patientIdStr 
            ? conjureValueBasedOnKeyFromList(patientsList, patientIdStr, 'fullName')
            : null;

          return (
            <div
              key={note.id}
              className="note-box"
              style={{ backgroundColor: `var(${note.color})` }}
            >
              <strong className="note-level">{priorityDisplayValue}</strong>
              <div>{note.note}</div>
              {patientIdStr && (
                <div style={{ marginTop: '8px' }}>
                  <span
                    style={{
                      color: 'var(--primary-blue)',
                      textDecoration: 'underline',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: 500
                    }}
                    onClick={() => handleOpenEmrFromNote(note)}
                    title="Click to open patient EMR"
                  >
                    {patientFullName && patientFullName !== patientIdStr ? patientFullName : `Patient ID: ${patientIdStr}`}
                  </span>
                </div>
              )}
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
    <>
      {/* Patient Search Sidebar - Only render when needed */}
      {patientSidebarExpand && (
        <ProfileSidebar
          expand={true}
          setExpand={setPatientSidebarExpand}
          windowHeight={windowHeight || getHeight(window)}
          setLocalPatient={handlePatientSelect}
          refetchData={refetchPatientData}
          setRefetchData={setRefetchPatientData}
          title="Search Patient"
          direction="right"
          showButton={true}
        />
      )}

      {/* Main Sticky Notes Sidebar */}
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
    </>
  );
};

export default UserStickyNotes;
