import React, { useEffect, useState } from "react";
import { Form } from "rsuite";
import MyInput from "@/components/MyInput";
import MyModal from "@/components/MyModal/MyModal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBedPulse } from "@fortawesome/free-solid-svg-icons";
import { useGetLovValuesByCodeQuery } from "@/services/setupService";
import {
  useSavePatientSurgicalHistoryMutation,
} from "@/services/patientService";
import { newApPatientSurgicalHistory } from "@/types/model-types-constructor";
import { useAppDispatch } from "@/hooks";
import { notify } from "@/utils/uiReducerActions";

const AddSurgicalHistory = ({ open, setOpen, initialData, patient }) => {
  const dispatch = useAppDispatch();

  const [record, setRecord] = useState(newApPatientSurgicalHistory);

  const [openOtherField, setOpenOtherField] = useState({ open: false });
  const [openImplantsField, setOpenImplantsField] = useState({ open: false });

    useEffect(() => {
      if (initialData) {
        setRecord({
          ...initialData,
          adverseReactionsToAnesthesiaLkey:
            typeof initialData.adverseReactionsToAnesthesiaLkey === 'string'
              ? initialData.adverseReactionsToAnesthesiaLkey.split(',')
              : Array.isArray(initialData.adverseReactionsToAnesthesiaLkey)
                ? initialData.adverseReactionsToAnesthesiaLkey
                : []
        });

        setOpenOtherField({ open: initialData.other ?? false });
        setOpenImplantsField({ open: initialData.isImplantsOrDevices ?? false });
      } else {
        setRecord({
          ...newApPatientSurgicalHistory,
          patientKey: patient?.key,
          adverseReactionsToAnesthesiaLkey: []
        });

        setOpenOtherField({ open: false });
        setOpenImplantsField({ open: false });
      }
    }, [initialData, patient]);

  const { data: complicationsLov } = useGetLovValuesByCodeQuery("PROC_COMPLIC");
  const { data: anesthesiaLov } = useGetLovValuesByCodeQuery("ANESTH_TYPES");
  const { data: adverseLov } = useGetLovValuesByCodeQuery("MED_ADVERS_EFFECTS");

  const [saveSurgicalHistory] = useSavePatientSurgicalHistoryMutation();

const handleSave = () => {
  const payload = {
    ...record,
    patientKey: patient?.key,
    dateOfSurgery: record.dateOfSurgery
      ? new Date(record.dateOfSurgery).getTime()
      : null,
    other: openOtherField.open,
    isImplantsOrDevices: openImplantsField.open,
    otherDesc: openOtherField.open ? record.otherDesc : "",
    implantsOrDevicesDescription: openImplantsField.open
      ? record.implantsOrDevicesDescription
      : "",
    anesthesiaTypeLkey: record.anesthesiaTypeLkey || null,
    complicationsLkey: record.complicationsLkey || null,
adverseReactionsToAnesthesiaLkey:
  record.adverseReactionsToAnesthesiaLkey?.length
    ? record.adverseReactionsToAnesthesiaLkey.join(',')
    : null,

  };

  console.log("PayLoad",payload);

  saveSurgicalHistory(payload)
    .unwrap()
    .then(() => {
      dispatch(notify({ msg: "Saved successfully", sev: "success" }));


      setRecord({
        ...newApPatientSurgicalHistory,
        patientKey: patient?.key,
      });

      setOpenOtherField({ open: false });
      setOpenImplantsField({ open: false });

      setOpen(false);
    })
    .catch(() => {
      dispatch(notify({ msg: "Save failed", sev: "error" }));
    });
};

  const content = (
    <Form fluid layout="inline" className="fields-container">
      <MyInput
        width={200}
        column
        fieldLabel="Surgery"
        fieldName="surgery"
        record={record}
        setRecord={setRecord}
        required
      />

      <MyInput
        width={200}
        column
        fieldLabel="Date of surgery"
        fieldType="date"
        fieldName="dateOfSurgery"
        record={record}
        setRecord={setRecord}
        required
      />

      <MyInput
        width={200}
        column
        fieldLabel="Facility"
        fieldName="facility"
        record={record}
        setRecord={setRecord}
        required
      />

      <MyInput
        width={200}
        column
        fieldLabel="Anesthesia Type"
        fieldType="select"
        fieldName="anesthesiaTypeLkey"
        selectData={anesthesiaLov?.object ?? []}
        selectDataLabel="lovDisplayVale"
        selectDataValue="key"
        record={record}
        setRecord={setRecord}
        searchable={false}
        required
      />

      <MyInput
        width={200}
        column
        fieldLabel="Complications"
        fieldType="select"
        fieldName="complicationsLkey"
        selectData={complicationsLov?.object ?? []}
        selectDataLabel="lovDisplayVale"
        selectDataValue="key"
        record={record}
        setRecord={setRecord}
      />

        <MyInput
          width={200}
          column
          fieldLabel="Adverse Reactions"
          fieldType="checkPicker"
          fieldName="adverseReactionsToAnesthesiaLkey"
          selectData={adverseLov?.object ?? []}
          selectDataLabel="lovDisplayVale"
          selectDataValue="key"
          record={record}
          setRecord={setRecord}
        />

      <MyInput
        width={200}
        column
        fieldLabel="Implants or Devices"
        fieldType="checkbox"
        fieldName="open"
        record={openImplantsField}
        setRecord={setOpenImplantsField}
      />

      <MyInput
        width={200}
        column
        fieldLabel="Implants/Devices Description"
        fieldName="implantsOrDevicesDescription"
        record={record}
        setRecord={setRecord}
        disabled={!openImplantsField.open}
      />
    </Form>
  );

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={initialData ? "Edit Surgical History" : "Add Surgical History"}
      steps={[
        { title: "Surgical History", icon: <FontAwesomeIcon icon={faBedPulse} /> },
      ]}
      actionButtonFunction={handleSave}
      position="right"
      size="33vw"
      content={content}
    />
  );
};

export default AddSurgicalHistory;
