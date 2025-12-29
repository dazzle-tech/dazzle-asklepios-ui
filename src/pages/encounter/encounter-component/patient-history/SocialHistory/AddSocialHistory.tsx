import React, { useEffect, useState } from "react";
import { Form } from "rsuite";
import MyInput from "@/components/MyInput";
import MyModal from "@/components/MyModal/MyModal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSmoking } from "@fortawesome/free-solid-svg-icons";
import { useGetLovValuesByCodeQuery } from "@/services/setupService";
import { useSavePatientSocialHistoryMutation } from "@/services/patientService";
import { useAppDispatch } from "@/hooks";
import { notify } from "@/utils/uiReducerActions";

const newRecordTemplate = {
  key: undefined,
  patientKey: undefined,

  currentSmoker: false,
  smokeStartDate: null,
  cigaretteAmount: 0,
  cigaretteType: "",

  previousSmoker: false,
  smokeQuitDate: null,

  exposureToSecondHandSmoke: false,

  alcoholConsumption: false,
  typeOfAlcohol: "",
  alcoholSinceWhen: null,

  substanceUse: false,
  routeLkey: null,
  frequencyLkey: null,

  physicalLimitationLkey: null,
  diagnosedEatingDisordersLkey: null,
};

const AddSocialHistory = ({ open, setOpen, initialData, patient }) => {
  const dispatch = useAppDispatch();
  const [record, setRecord] = useState(newRecordTemplate);

  const [openSmoker, setOpenSmoker] = useState({ open: false });
  const [openPrevSmoker, setOpenPrevSmoker] = useState({ open: false });
  const [openAlcohol, setOpenAlcohol] = useState({ open: false });
  const [openSubstance, setOpenSubstance] = useState({ open: false });

  const { data: routeLov } = useGetLovValuesByCodeQuery("MED_ROA");
  const { data: freqLov } = useGetLovValuesByCodeQuery("FREQUENT_USE");
  const { data: physicalLov } = useGetLovValuesByCodeQuery("PHYSICAL_LIMITATION");
  const { data: diagnoseLov } = useGetLovValuesByCodeQuery("EATING_DISORDERS");

  const [saveSocialHistory] = useSavePatientSocialHistoryMutation();

  const resetAll = () => {
    setRecord({
      ...newRecordTemplate,
      patientKey: patient?.key,
    });

    setOpenSmoker({ open: false });
    setOpenPrevSmoker({ open: false });
    setOpenAlcohol({ open: false });
    setOpenSubstance({ open: false });
  };

  useEffect(() => {
    if (initialData) {
      setRecord(initialData);

      setOpenSmoker({ open: initialData.currentSmoker });
      setOpenPrevSmoker({ open: initialData.previousSmoker });
      setOpenAlcohol({ open: initialData.alcoholConsumption });
      setOpenSubstance({ open: initialData.substanceUse });
    } else {
      resetAll();
    }
  }, [initialData, patient]);

  const handleSave = () => {
    const payload = {
      ...record,
      patientKey: patient?.key,

      currentSmoker: openSmoker.open,
      previousSmoker: openPrevSmoker.open,
      alcoholConsumption: openAlcohol.open,
      substanceUse: openSubstance.open,

      smokeStartDate: record.smokeStartDate ? new Date(record.smokeStartDate).getTime() : 0,
      smokeQuitDate: record.smokeQuitDate ? new Date(record.smokeQuitDate).getTime() : 0,
      alcoholSinceWhen: record.alcoholSinceWhen ? new Date(record.alcoholSinceWhen).getTime() : 0,
    };
    let errorMsg = "";
    // if(payload.con)
    saveSocialHistory(payload)
      .unwrap()
      .then(() => {
        dispatch(notify({ msg: "Saved successfully", sev: "success" }));
        setOpen(false);
        resetAll();
      })
      .catch(() => {
        dispatch(notify({ msg: "Save failed", sev: "error" }));
      });
  };

  const content = (
    <Form fluid layout="inline" className="fields-container">

      {/* CURRENT SMOKER */}
      <MyInput
        width={200}
        column
        fieldType="checkbox"
        fieldLabel="Current Smoker"
        fieldName="open"
        record={openSmoker}
        setRecord={setOpenSmoker}
      />

      {openSmoker.open && (
        <>
          <MyInput
            column
            width={200}
            fieldType="date"
            fieldLabel="Start date"
            fieldName="smokeStartDate"
            record={record}
            setRecord={setRecord}
          />

          <MyInput
            column
            width={110}
            fieldType="number"
            fieldLabel="Amount"
            fieldName="cigaretteAmount"
            record={record}
            setRecord={setRecord}
            rightAddon="pack/day"
            rightAddonwidth={80}
          />

          <MyInput
            column
            width={200}
            fieldLabel="Cigarette Type"
            fieldName="cigaretteType"
            record={record}
            setRecord={setRecord}
          />
        </>
      )}

      {/* PREVIOUS SMOKER */}
      <MyInput
        width={200}
        column
        fieldType="checkbox"
        fieldLabel="Previous smoker"
        fieldName="open"
        record={openPrevSmoker}
        setRecord={setOpenPrevSmoker}
      />

      {openPrevSmoker.open && (
        <MyInput
          width={200}
          column
          fieldType="date"
          fieldLabel="Quit date"
          fieldName="smokeQuitDate"
          record={record}
          setRecord={setRecord}
        />
      )}

      {/* EXPOSURE */}
      <MyInput
        width={200}
        column
        fieldType="checkbox"
        fieldLabel="Exposure to second-hand smoke"
        fieldName="exposureToSecondHandSmoke"
        record={record}
        setRecord={setRecord}
      />

      {/* ALCOHOL */}
      <MyInput
        width={200}
        column
        fieldType="checkbox"
        fieldLabel="Alcohol Consumption"
        fieldName="open"
        record={openAlcohol}
        setRecord={setOpenAlcohol}
      />

      {openAlcohol.open && (
        <MyInput
          width={200}
          column
          fieldLabel="Type of alcohol"
          fieldName="typeOfAlcohol"
          record={record}
          setRecord={setRecord}
        />
      )}

      <MyInput
        width={200}
        column
        fieldType="date"
        fieldLabel="Since when"
        fieldName="alcoholSinceWhen"
        record={record}
        setRecord={setRecord}
      />

      {/* SUBSTANCE USE */}
      <MyInput
        width={200}
        column
        fieldType="checkbox"
        fieldLabel="Substance Use"
        fieldName="open"
        record={openSubstance}
        setRecord={setOpenSubstance}
      />

      {openSubstance.open && (
        <>
          <MyInput
            width={200}
            column
            fieldLabel="Route"
            fieldName="routeLkey"
            fieldType="select"
            selectData={routeLov?.object ?? []}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            record={record}
            setRecord={setRecord}
          />

          <MyInput
            width={200}
            column
            fieldLabel="Frequency"
            fieldName="frequencyLkey"
            fieldType="select"
            selectData={freqLov?.object ?? []}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            record={record}
            setRecord={setRecord}
          />
        </>
      )}

      {/* PHYSICAL LIMITATION */}
      <MyInput
        width={200}
        column
        fieldLabel="Physical limitations"
        fieldName="physicalLimitationLkey"
        fieldType="select"
        selectData={physicalLov?.object ?? []}
        selectDataLabel="lovDisplayVale"
        selectDataValue="key"
        record={record}
        setRecord={setRecord}
      />

      {/* EATING DISORDER */}
      <MyInput
        width={200}
        column
        fieldLabel="Diagnosed eating disorders"
        fieldName="diagnosedEatingDisordersLkey"
        fieldType="select"
        selectData={diagnoseLov?.object ?? []}
        selectDataLabel="lovDisplayVale"
        selectDataValue="key"
        record={record}
        setRecord={setRecord}
      />

    </Form>
  );

  return (
    <MyModal
      open={open}
      setOpen={() => {
        setOpen(false);
        resetAll();
      }}
      title={initialData ? "Edit Social History" : "Add Social History"}
      steps={[{ title: "Social History", icon: <FontAwesomeIcon icon={faSmoking} /> }]}
      actionButtonFunction={handleSave}
      position="right"
      size="33vw"
      content={content}
    />
  );
};

export default AddSocialHistory;
