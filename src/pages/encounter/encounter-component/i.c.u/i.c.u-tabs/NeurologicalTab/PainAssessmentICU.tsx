import React, { useState } from "react";
import { Form, Slider } from "rsuite";
import { useSelector } from "react-redux";
import SectionContainer from "@/components/SectionsoContainer";
import MyButton from "@/components/MyButton/MyButton";
import MyInput from "@/components/MyInput";
import MyTable from "@/components/MyTable/MyTable";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBandage, faCheck } from "@fortawesome/free-solid-svg-icons";
import "./style.less";

const initialPainRecords = [
  {
    id: 1,
    painLevel: 7,
    painDescription: "Severe headache",
    createdBy: "Dr. Sara",
    createdAt: "2025-09-23 14:20 PM",
  },
];

const PainAssessmentICU: React.FC = () => {
  const mode = useSelector((state: any) => state.ui.mode);
  const [painLevel, setPainLevel] = useState(0);
  const [record, setRecord] = useState({});
  const [painRecords] = useState(initialPainRecords);

  const getTrackColor = (value: number) => {
    if (value === 0) return "transparent";
    if (value <= 3) return "#28a745";
    if (value <= 7) return "orange";
    return "red";
  };

  return (
    <SectionContainer
      title={
        <>
          <span className="icu-title-flow-sheet">
            <FontAwesomeIcon
              icon={faBandage}
              className="title-icon-main-title"
              color={mode === "dark" ? "#dfdfdfff" : "#7d7d7dff"}
            />
            Pain Assessment
          </span>
          <div className="add-button-for-neurological-view">
            <MyButton prefixIcon={() => <FontAwesomeIcon icon={faCheck} />}>Save</MyButton>
          </div>
        </>
      }
      content={
        <>
          <Form fluid>
            <div className="pain-form-row">
              <div className="slider-container">
                <label>Pain Level ({painLevel}/10)</label>
                <div className="custom-slider">
                  <Slider
                    value={painLevel}
                    onChange={setPainLevel}
                    min={0}
                    max={10}
                    step={1}
                    progress
                  />
                  <div
                    className="slider-track-icu"
                    style={{
                      width: `${(painLevel / 10) * 100}%`,
                      backgroundColor: getTrackColor(painLevel),
                    }}
                  />
                </div>
              </div>

              <MyInput
                width={300}
                fieldLabel="Pain Description"
                fieldType="textarea"
                fieldName="painDescription"
                record={record}
                setRecord={setRecord}
              />
            </div>
          </Form>

          <div className="pain-table-container">
            <MyTable
              data={painRecords}
              columns={[
                {
                  key: "painLevel",
                  title: "Pain Level",
                  dataKey: "painLevel",
                  render: (row) => (
                    <span style={{ color: getTrackColor(row.painLevel), fontWeight: "bold" }}>
                      {row.painLevel}/10
                    </span>
                  ),
                },
                {
                  key: "painDescription",
                  title: "Description",
                  dataKey: "painDescription",
                },
                {
                  key: "createdByAt",
                  title: "Created By\\At",
                  dataKey: "createdByAt",
                  render: (row) => (
                    <>
                      {row.createdBy}
                      <br />
                      <span className="date-table-style">{row.createdAt}</span>
                    </>
                  ),
                },
              ]}
              loading={false}
              page={0}
              rowsPerPage={10}
              totalCount={painRecords.length}
            />
          </div>
        </>
      }
    />
  );
};

export default PainAssessmentICU;
