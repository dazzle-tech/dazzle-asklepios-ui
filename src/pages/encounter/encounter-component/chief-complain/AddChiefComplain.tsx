import React, { useEffect, useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/hooks';
import { Form } from 'rsuite';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { useSaveChiefComplainMutation } from '@/services/encounterService';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import { newApInpatientChiefComplain } from '@/types/model-types-constructor';
import { ApInpatientChiefComplain } from '@/types/model-types';
import { notify } from '@/utils/uiReducerActions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import MyModal from '@/components/MyModal/MyModal';
import { faFaceFrownOpen } from '@fortawesome/free-solid-svg-icons';
import { faCommentMedical } from '@fortawesome/free-solid-svg-icons';
import './styles.less';
import clsx from 'clsx';
const AddChiefComplain = ({
  open,
  setOpen,
  patient,
  encounter,
  chiefComplainObj,
  refetch,
  edit
}) => {
  const authSlice = useAppSelector(state => state.auth);
  const [chiefComplain, setChiefComplain] = useState<ApInpatientChiefComplain>({
    ...newApInpatientChiefComplain
  });
  const [isDisabledField, setIsDisabledField] = useState(false);
  const [isEncounterChiefComplainStatusClose, setIsEncounterChiefComplainStatusClose] =
    useState(false);
  const [isEncounterStatusClosed, setIsEncounterStatusClosed] = useState(false);
  const [saveChiefComplain] = useSaveChiefComplainMutation();
  const dispatch = useAppDispatch();

  // Fetch LOV data for various fields

  const { data: bodyPartsLovQueryResponse } = useGetLovValuesByCodeQuery('BODY_PARTS');
  const { data: painPatternLovQueryResponse } = useGetLovValuesByCodeQuery('PAIN_PATTERN');
  const { data: severityLovQueryResponse } = useGetLovValuesByCodeQuery('SEVERITY');

  // Handle Save Chief Complain
  const handleSave = async () => {
    //  TODO convert key to code
    try {
      if (chiefComplain.key === undefined) {
        await saveChiefComplain({
          ...chiefComplain,
          patientKey: patient.key,
          encounterKey: encounter.key,
          statusLkey: '9766169155908512',
          createdBy: authSlice.user.key,
          onsetDateTime: chiefComplain.onsetDateTime
            ? new Date(chiefComplain?.onsetDateTime)?.getTime()
            : null
        }).unwrap();

        dispatch(notify({ msg: 'Chief Complain Added Successfully', sev: 'success' }));
        //TODO convert key to code
        setChiefComplain({ ...chiefComplain, statusLkey: '9766169155908512' });
        setOpen(false);
      } else {
        await saveChiefComplain({
          ...chiefComplain,
          patientKey: patient.key,
          encounterKey: encounter.key,
          updatedBy: authSlice.user.key,
          onsetDateTime: chiefComplain.onsetDateTime
            ? new Date(chiefComplain?.onsetDateTime)?.getTime()
            : null
        }).unwrap();
        dispatch(notify({ msg: 'Chief Complain Updated Successfully', sev: 'success' }));
        setOpen(false);
      }
      await refetch();
      handleClearField();
    } catch (error) {
      console.error('Error saving Chief Complain:', error);
      dispatch(notify({ msg: 'Failed to Save Chief Complain', sev: 'error' }));
    }
  };

  // Handle Clear Fields
  const handleClearField = () => {
    setChiefComplain({
      ...newApInpatientChiefComplain,
      qualityLkey: null,
      regionLkey: null,
      severityLkey: null
    });
  };

  // Effects
  useEffect(() => {
    setChiefComplain({ ...chiefComplainObj });
  }, [chiefComplainObj]);
  useEffect(() => {
    // TODO update status to be a LOV value
    if (chiefComplain?.statusLkey === '3196709905099521') {
      setIsEncounterChiefComplainStatusClose(true);
    } else {
      setIsEncounterChiefComplainStatusClose(false);
    }
  }, [chiefComplain?.statusLkey]);
  useEffect(() => {
    // TODO update status to be a LOV value
    if (encounter?.encounterStatusLkey === '91109811181900' || encounter?.discharge) {
      setIsEncounterStatusClosed(true);
    }
  }, [encounter?.encounterStatusLkey]);
  useEffect(() => {
    if (isEncounterStatusClosed || isEncounterChiefComplainStatusClose) {
      setIsDisabledField(true);
    } else {
      setIsDisabledField(false);
    }
  }, [isEncounterStatusClosed, isEncounterChiefComplainStatusClose]);

  // Modal Content
  const content = (
    <div className={clsx('', { 'disabled-panel': edit })}>
      <Form fluid layout="inline" disabled={edit}>
        <MyInput
          column
          width={200}
          fieldLabel="Chief Complain"
          fieldType="textarea"
          fieldName="chiefComplaint"
          record={chiefComplain}
          setRecord={setChiefComplain}
          disabled={isDisabledField}
          searchable={false}
        />
        <MyInput
          column
          width={200}
          fieldLabel="Provocation"
          fieldName="provocation"
          record={chiefComplain}
          setRecord={setChiefComplain}
          disabled={isDisabledField}
          searchable={false}
        />
        <MyInput
          column
          width={200}
          fieldLabel="Palliation"
          fieldName="palliation"
          record={chiefComplain}
          setRecord={setChiefComplain}
          disabled={isDisabledField}
          searchable={false}
        />
        <MyInput
          column
          width={200}
          fieldLabel="Quality"
          fieldType="select"
          fieldName="qualityLkey"
          selectData={painPatternLovQueryResponse?.object ?? []}
          selectDataLabel="lovDisplayVale"
          selectDataValue="key"
          record={chiefComplain}
          setRecord={setChiefComplain}
          disabled={isDisabledField}
          searchable={false}
        />
        <MyInput
          column
          width={200}
          fieldLabel="Region"
          fieldType="select"
          fieldName="regionLkey"
          selectData={bodyPartsLovQueryResponse?.object ?? []}
          selectDataLabel="lovDisplayVale"
          selectDataValue="key"
          record={chiefComplain}
          setRecord={setChiefComplain}
          disabled={isDisabledField}
          searchable={false}
        />
        <MyInput
          column
          width={200}
          fieldLabel="Severity"
          fieldType="select"
          fieldName="severityLkey"
          selectData={severityLovQueryResponse?.object ?? []}
          selectDataLabel="lovDisplayVale"
          selectDataValue="key"
          record={chiefComplain}
          setRecord={setChiefComplain}
          disabled={isDisabledField}
          searchable={false}
        />
        <MyInput
          column
          width={200}
          fieldLabel="Onset"
          disabled={isDisabledField}
          fieldName="onsetDateTime"
          fieldType="datetime"
          record={chiefComplain}
          setRecord={setChiefComplain}
        />
        <MyInput
          column
          width={200}
          fieldLabel="Understanding"
          fieldName="understanding"
          record={chiefComplain}
          setRecord={setChiefComplain}
          disabled={isDisabledField}
        />
      </Form>
    </div>
  );
  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Add/Edit Chief Complain"
      actionButtonFunction={handleSave}
      position="right"
      isDisabledActionBtn={!edit ? isDisabledField : true}
      size="32vw"
      steps={[
        {
          title: 'Chief Complain',
          icon: <FontAwesomeIcon icon={faCommentMedical} />,
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
export default AddChiefComplain;
