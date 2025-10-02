import React, { useState } from "react";
import { Form } from "rsuite";
import { useSelector } from "react-redux";
import SectionContainer from "@/components/SectionsoContainer";
import MyButton from "@/components/MyButton/MyButton";
import MyInput from "@/components/MyInput";
import MyTable from "@/components/MyTable/MyTable";
import { useGetLovValuesByCodeQuery } from "@/services/setupService";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faCheck } from "@fortawesome/free-solid-svg-icons";

const initialPupilRecords = [
  {
    id: 1,
    createdBy: "Dr. Rami",
    createdAt: "2025-09-21 11:30 AM",
    cancelledBy: null,
    cancelledAt: null,
    cancellationReason: null,
    reactingtolight: "RightEye",
    pupilsizeleft: "Normal",
    pupilsizeright: "Medium"
  },
];

const PupilSizeReactivityICU: React.FC = () => {
  const mode = useSelector((state: any) => state.ui.mode);
  const { data: sizeLovQueryResponse } = useGetLovValuesByCodeQuery("SIZE");
  const [record, setRecord] = useState({});
  const [pupilRecords] = useState(initialPupilRecords);

  const pupilTableColumns = [
    {
      key: "pupilsizeright",
      title: "Pupil Size Right",
      dataKey: "pupilsizeright",
    },
    {
      key: "pupilsizeleft",
      title: "Pupil Size Left",
      dataKey: "pupilsizeleft",
    },
    {
      key: "reactingtolight",
      title: "Reacting to light",
      dataKey: "reactingtolight",
    },
  ];

  return (
    <SectionContainer
      title={
        <>
          <span className="icu-title-flow-sheet">
            <FontAwesomeIcon icon={faEye} className="title-icon-main-title" color={mode === "dark" ? "#dfdfdfff" : "#7d7d7dff"} />
            Pupil size and Reactivity
          </span>
          <div className="add-button-for-neurological-view">
            <MyButton prefixIcon={() => <FontAwesomeIcon icon={faCheck} />}>Save</MyButton>
          </div>
        </>
      }
      content={
        <>
          <div className="eye-direction-handle-neurological-main-container">
            <SectionContainer
              title="Right Eye"
              content={
                <Form fluid>
                  <div className="eye-direction-handle-neurological">
                    <MyInput
                      width={200}
                      fieldLabel="Reacting to light"
                      fieldType="checkbox"
                      fieldName="rightEyeLightResponse"
                      record={record}
                      setRecord={setRecord}
                    />
                    <MyInput
                      width={200}
                      fieldLabel="Pupil Size"
                      fieldType="select"
                      fieldName="rightEyePupilSizeLkey"
                      selectData={sizeLovQueryResponse?.object ?? []}
                      selectDataLabel="lovDisplayVale"
                      selectDataValue="key"
                      record={record}
                      setRecord={setRecord}
                    />
                  </div>
                </Form>
              }
              minHeight={"auto"}
            />

            <SectionContainer
              title="Left Eye"
              content={
                <Form fluid>
                  <div className="eye-direction-handle-neurological">
                    <MyInput
                      width={200}
                      fieldLabel="Reacting to light"
                      fieldType="checkbox"
                      fieldName="leftEyeLightResponse"
                      record={record}
                      setRecord={setRecord}
                    />
                    <MyInput
                      width={200}
                      fieldLabel="Pupil Size"
                      fieldType="select"
                      fieldName="leftEyePupilSizeLkey"
                      selectData={sizeLovQueryResponse?.object ?? []}
                      selectDataLabel="lovDisplayVale"
                      selectDataValue="key"
                      record={record}
                      setRecord={setRecord}
                    />
                  </div>
                </Form>
              }
              minHeight={"auto"}
            />
          </div>

          <div style={{ marginTop: "1vw" }}>
            <MyTable
              data={pupilRecords}
              columns={pupilTableColumns}
              loading={false}
              page={0}
              rowsPerPage={10}
              totalCount={pupilRecords.length}
            />
          </div>
        </>
      }
    />
  );
};

export default PupilSizeReactivityICU;
