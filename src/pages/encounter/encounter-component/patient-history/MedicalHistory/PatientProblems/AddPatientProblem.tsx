import React, { useEffect, useState } from 'react';
import { Form } from 'rsuite';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLungsVirus } from '@fortawesome/free-solid-svg-icons';
import { newApPatientProblems } from '@/types/model-types-constructor';
import { useSavePatientProblemMutation } from '@/services/patientService';
import { notify } from '@/utils/uiReducerActions';
import { useAppDispatch } from '@/hooks';

const AddPatientProblem = ({ open, setOpen, initialData, patient
  
 }) => {

  const dispatch = useAppDispatch();
  const [formData, setFormData] = useState(newApPatientProblems);

  // -----------------------------
  // LOAD DATA ON OPEN
  // -----------------------------
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({ ...newApPatientProblems, patientKey: patient?.key });
    }
  }, [initialData, open]);

  // -----------------------------
  // LOV VALUES
  // -----------------------------
  const { data: statusLov } = useGetLovValuesByCodeQuery('ALLERGY_RES_STATUS');
  const { data: typeLov } = useGetLovValuesByCodeQuery('DIAGNOSIS_STATUS');
  const { data: sourceLov } = useGetLovValuesByCodeQuery('RELATION');

  // -----------------------------
  // SAVE API
  // -----------------------------
  const [savePatientProblem] = useSavePatientProblemMutation();

const normalizePayload = (data) => ({
  ...data,
  dateOfDiagnosis:
    data.dateOfDiagnosis ? new Date(data.dateOfDiagnosis).getTime() : null,

  dateOfResolution:
    data.dateOfResolution ? new Date(data.dateOfResolution).getTime() : null,
  sourceOfInformationLkey: data.byPatient ? "By-Patient" : data.sourceOfInformationLkey,
});


const save = () => {
  const payload = normalizePayload(formData);

  console.log("PAYLOAD SENT >>>", payload);

  savePatientProblem(payload)
    .unwrap()
    .then(() => {
      dispatch(notify({ msg: "Saved successfully", sev: "success" }));
      setOpen(false);
    })
    .catch((err) => {
      console.error("SAVE ERROR:", err);
      dispatch(notify({ msg: "Saving failed", sev: "error" }));
    });
};


  // -----------------------------
  // CONTENT
  // -----------------------------
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
        fieldLabel="Date of diagnosis"
        fieldType="date"
        fieldName="dateOfDiagnosis"
        record={formData}
        setRecord={setFormData}
        required
      />

      <MyInput
        width={200}
        column
        fieldLabel="Status"
        fieldType="select"
        fieldName="statusLkey"
        selectData={statusLov?.object ?? []}
        selectDataValue="key"
        selectDataLabel="lovDisplayVale"
        record={formData}
        setRecord={setFormData}
        searchable={false}
      />

      <MyInput
        width={200}
        column
        fieldLabel="Type"
        fieldType="select"
        fieldName="typeLkey"
        selectData={typeLov?.object ?? []}
        selectDataValue="key"
        selectDataLabel="lovDisplayVale"
        record={formData}
        setRecord={setFormData}
        searchable={false}
      />

      <MyInput
        width={200}
        column
        fieldLabel="Date of resolution"
        fieldType="date"
        fieldName="dateOfResolution"
        record={formData}
        setRecord={setFormData}
      />

      <MyInput
        width={200}
        column
        fieldLabel="Source of information"
        fieldType="select"
        fieldName="sourceOfInformationLkey"
        selectData={sourceLov?.object ?? []}
        selectDataValue="key"
        selectDataLabel="lovDisplayVale"
        record={formData}
        setRecord={setFormData}
        searchable={false}
        disabled={formData.byPatient === true}
      />


      <MyInput
        width={200}
        column
        fieldLabel="By Patient"
        fieldType="checkbox"
        fieldName="byPatient"
        record={formData}
        setRecord={setFormData}
        required
      />

    </Form>
  );
  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Add/Edit Patient Problem"
      steps={[{ title: "Patient Problem", icon: <FontAwesomeIcon icon={faLungsVirus} /> }]}
      actionButtonFunction={save}
      position="right"
      size="33vw"
      content={content}
    />
  );
};

export default AddPatientProblem;
