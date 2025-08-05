import React, { useState, useEffect } from 'react';
import { Form } from 'rsuite';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import MyModal from '@/components/MyModal/MyModal';
import { faFileLines } from '@fortawesome/free-solid-svg-icons';
import './styles.less';
import { ApProgressNotes, ApUser } from '@/types/model-types';
import { newApProgressNotes, newApUser } from '@/types/model-types-constructor';
import { useSaveProgressNotesMutation } from '@/services/encounterService';
import { useAppSelector, useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
const AddProgressNotes = ({ open, setOpen, patient, encounter, progressNotesObj, refetch, edit }) => {
  const [progressNotes, setProgressNotes] = useState<ApProgressNotes>({ ...newApProgressNotes });
  const [saveProgressNotes] = useSaveProgressNotesMutation();
  const authSlice = useAppSelector(state => state.auth);
  const [isEncounterProgressNotesStatusClose, setIsEncounterProgressNotesStatusClose] = useState(false);
  const [isEncounterStatusClosed, setIsEncounterStatusClosed] = useState(false);
  const [isDisabledField, setIsDisabledField] = useState(false);
  const [createdBy, setCreatedBy] = useState<ApUser>({ ...newApUser });

  const dispatch = useAppDispatch();


  const { data: jobRoleLovQueryResponse } = useGetLovValuesByCodeQuery('JOB_ROLE');
  // Handle Save Progress Notes
  const handleSave = async () => {
    try {
      //  TODO convert key to code
      if (progressNotes.key === undefined) {
        await saveProgressNotes({
          ...progressNotes,
          patientKey: patient.key,
          encounterKey: encounter.key,
          statusLkey: "9766169155908512",
          jobRoleLkey: authSlice.user.jobRoleLkey,
          createdBy: authSlice.user.key
        }).unwrap();

        dispatch(notify({ msg: 'Progress Notes Added Successfully', sev: 'success' }));
        //TODO convert key to code
        setProgressNotes({ ...newApProgressNotes, statusLkey: "9766169155908512" });
        setOpen(false);
      } else {
        await saveProgressNotes({
          ...progressNotes,
          patientKey: patient.key,
          encounterKey: encounter.key,
          jobRoleLkey: authSlice.user.jobRoleLkey,
          updatedBy: authSlice.user.key
        }).unwrap();
        dispatch(notify({ msg: 'Progress Notes Updated Successfully', sev: 'success' }));
        setOpen(false);
        handleClearField();
      }
      await refetch();
      handleClearField();
    } catch (error) {
      console.error("Error saving Progress Notes:", error);
      dispatch(notify({ msg: 'Failed to Save Progress Notes', sev: 'error' }));
    }
  };

  // Handle Clear Fields
  const handleClearField = () => {
    setProgressNotes({ ...newApProgressNotes });
  };

  // Effects
  useEffect(() => {
    if (!open) {
      handleClearField();
    }
  }, [open]);

  useEffect(() => {
    // TODO update status to be a LOV value
    if (progressNotes?.statusLkey === '3196709905099521') {
      setIsEncounterProgressNotesStatusClose(true);
    } else {
      setIsEncounterProgressNotesStatusClose(false);
    }
  }, [progressNotes?.statusLkey]);
  useEffect(() => {
    // TODO update status to be a LOV value
    if (encounter?.encounterStatusLkey === '91109811181900' || encounter?.discharge) {
      setIsEncounterStatusClosed(true);
    }
  }, [encounter?.encounterStatusLkey]);
  useEffect(() => {
    if (isEncounterStatusClosed || isEncounterProgressNotesStatusClose) {
      setIsDisabledField(true);
    } else {
      setIsDisabledField(false);
    }
  }, [isEncounterStatusClosed, isEncounterProgressNotesStatusClose]);
  useEffect(() => {
    setProgressNotes({ ...progressNotesObj });
    setCreatedBy(progressNotesObj?.createdByUser)
  }, [progressNotesObj]);
  // Modal Content
  const content = (
    <Form fluid layout="inline" disabled={edit} >
      <MyInput
        column
        width={400}
        fieldLabel="Progress Notes"
        fieldType="textarea"
        fieldName="progressNotes"
        record={progressNotes}
        setRecord={setProgressNotes}
        required
        height={200}
      />
      {progressNotes?.key && (
        <div className="additional-fields-container">
          <div className="fields-row">
            <MyInput
              column
              width={200}
              fieldLabel="Job Role"
              fieldType="select"
              fieldName="jobRoleLkey"
              selectData={jobRoleLovQueryResponse?.object ?? []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              record={progressNotes}
              setRecord={setProgressNotes}
              disabled={true}
              searchable={false}
            />
            <MyInput
              column
              width={200}
              fieldLabel="Created By"
              fieldType="text"
              fieldName="fullName"
              record={createdBy}
              setRecord={setCreatedBy}
              disabled={true}
            />
          </div>
          {/* Second row - Created At on its own */}
          <MyInput
            column
            width={200}
            fieldLabel="Created At"
            fieldType="datetime"
            fieldName="createdAt"
            record={progressNotes}
            setRecord={setProgressNotes}
            disabled={true}
          />
        </div>
      )}
    </Form>
  );

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Add/Edit Progress Notes"
      actionButtonFunction={handleSave}
      position="right"
      isDisabledActionBtn={!edit ? isDisabledField : true}
      size="32vw"
      steps={[
        {
          title: 'Progress Notes',
          icon: <FontAwesomeIcon icon={faFileLines} />,
          footer: (
            <MyButton appearance="ghost" onClick={handleClearField}>
              Clear
            </MyButton>
          )
        }
      ]}
      content={content}
    ></MyModal>
  );
};

export default AddProgressNotes;
