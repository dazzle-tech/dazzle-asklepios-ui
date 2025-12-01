import React, { useEffect, useState } from 'react';
import { Form } from 'rsuite';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPeopleRoof } from '@fortawesome/free-solid-svg-icons';
import { newApPatientFamilyHistory } from '@/types/model-types-constructor';
import { useSavePatientFamilyHistoryMutation } from '@/services/patientService';
import { notify } from '@/utils/uiReducerActions';
import { useAppDispatch } from '@/hooks';

const AddFamilyHistory = ({ open, setOpen, initialData, patient }) => {

  const dispatch = useAppDispatch();
  const [formData, setFormData] = useState(newApPatientFamilyHistory);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({ ...newApPatientFamilyHistory, patientKey: patient?.key });
    }
  }, [initialData, open]);

  const { data: relationLov } = useGetLovValuesByCodeQuery('RELATION');

  const [saveFamily] = useSavePatientFamilyHistoryMutation();

  const save = () => {
    saveFamily(formData)
      .unwrap()
      .then(() => {
        dispatch(notify({ msg: "Saved successfully", sev: "success" }));
        setOpen(false);
      })
      .catch(() =>
        dispatch(notify({ msg: "Saving failed", sev: "error" }))
      );
  };

  const content = (
    <Form fluid layout="inline" className="fields-container">

      <MyInput
        width={200}
        column
        fieldLabel="Condition"
        fieldName="condition"
        record={formData}
        setRecord={setFormData}
        required
      />

      <MyInput
        width={200}
        column
        fieldLabel="Relation"
        fieldType="select"
        selectData={relationLov?.object ?? []}
        selectDataLabel="lovDisplayVale"
        selectDataValue="key"
        fieldName="relationLkey"
        record={formData}
        setRecord={setFormData}
        searchable={false}
        required
      />

      <MyInput
        width={200}
        column
        fieldLabel="Inherited Diseases"
        fieldType="checkbox"
        fieldName="inheritedDiseases"
        record={formData}
        setRecord={setFormData}
      />

    </Form>
  );

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Add/Edit Family History"
      steps={[{ title: "Family History", icon: <FontAwesomeIcon icon={faPeopleRoof} /> }]}
      actionButtonFunction={save}
      position="right"
      size="33vw"
      content={content}
    />
  );
};

export default AddFamilyHistory;
