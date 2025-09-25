import React, { useState } from "react";
import { useSelector } from "react-redux";
import SectionContainer from "@/components/SectionsoContainer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTruckMedical,faEye,faBrain,faBandage,faCheck } from "@fortawesome/free-solid-svg-icons";
import GlasgowComaScale from "../../../glasgow-coma-scale";
import { useGetLovValuesByCodeQuery } from "@/services/setupService";
import { Form } from "rsuite";
import MyInput from "@/components/MyInput";
import { Slider } from "rsuite";
import MyTable, { ColumnConfig } from "@/components/MyTable/MyTable";
import MyButton from "@/components/MyButton/MyButton";
import "./style.less";

// sample table data
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
  {
    id: 2,
    createdBy: "Nurse Layla",
    createdAt: "2025-09-22 08:45 AM",
    cancelledBy: "Dr. Ahmad",
    cancelledAt: "2025-09-22 09:00 AM",
    cancellationReason: "Entered by mistake",
    reactingtolight: "LeftEye/RightEye",
    pupilsize: 'Large',
    pupilsizeright: "Normal"
  },
];

const initialPainAssessmentRecords = [
  {
    id: 1,
    painLevel: 7,
    painDescription: "Severe headache after surgery",
    createdBy: "Dr. Sara",
    createdAt: "2025-09-23 14:20 PM",
  },
  {
    id: 2,
    painLevel: 3,
    painDescription: "Mild abdominal discomfort",
    createdBy: "Nurse Omar",
    createdAt: "2025-09-23 09:10 AM",
  },
];


const NeurologicalICU: React.FC = () => {
  const mode = useSelector((state: any) => state.ui.mode);
  const { data: sizeLovQueryResponse } = useGetLovValuesByCodeQuery("SIZE");
  const [record, setRecord] = useState({});
  const [pupilRecords] = useState(initialPupilRecords);
  const [painLevel, setPainLevel] = useState(0);
  const [painRecords] = useState(initialPainAssessmentRecords);

  const [intracranialRecord, setIntracranialRecord] = useState({});
  const [intracranialRecords, setIntracranialRecords] = useState<
    { id: number; icp: number; cpp: number; evdLevel: number }[]
  >([]);



  const getTrackColor = (value: number): string => {
    if (value === 0) return "transparent";
    if (value >= 1 && value <= 3) return "#28a745";
    if (value >= 4 && value <= 7) return "orange";
    return "red";
  };




  // columns config
  const pupilTableColumns: ColumnConfig[] = [
    {
      key: "pupilsizeright",
      title: "Pupil Size Right",
      dataKey: "pupilsizeright",
      width: 220,
    },

    {
      key: "pupilsizeleft",
      title: "Pupil Size Left",
      dataKey: "pupilsizeleft",
      width: 220,
    },

    {
      key: "reactingtolight",
      title: "Reacting to light",
      dataKey: "reactingtolight",
      width: 220,
    },
    {
      key: "createdByAt",
      title: "Created By\\At",
      dataKey: "createdByAt",
      width: 220,
      render: (row) => (
        <>
          {row.createdBy}
          <br />
          <span className="date-table-style">{row.createdAt}</span>
        </>
      ),
    },
    {
      key: "cancelledByAt",
      title: "Cancelled By\\At",
      dataKey: "cancelledByAt",
      width: 220,
      render: (row) =>
        row.cancelledBy ? (
          <>
            {row.cancelledBy}
            <br />
            <span className="date-table-style">{row.cancelledAt}</span>
          </>
        ) : (
          <span className="no-cancel">-</span>
        ),
    },
    {
      key: "cancellationReason",
      title: "Cancellation Reason",
      dataKey: "cancellationReason",
      width: 250,
      render: (row) => row.cancellationReason || <span className="no-cancel">-</span>,
    },
  ];

  const painAssessmentColumns: ColumnConfig[] = [
    {
      key: "painLevel",
      title: "Pain Level",
      dataKey: "painLevel",
      width: 120,
      render: (row) => (
        <span style={{ fontWeight: "bold", color: getTrackColor(row.painLevel) }}>
          {row.painLevel}/10
        </span>
      ),
    },
    {
      key: "painDescription",
      title: "Description",
      dataKey: "painDescription",
      width: 300,
    },
    {
      key: "createdByAt",
      title: "Created By\\At",
      dataKey: "createdByAt",
      width: 220,
      render: (row) => (
        <>
          {row.createdBy}
          <br />
          <span className="date-table-style">{row.createdAt}</span>
        </>
      ),
    },
  ];

  const intracranialColumns: ColumnConfig[] = [
    {
      key: "icp",
      title: "ICP (mmHg)",
      dataKey: "icp",
      width: 120,
      render: (row) => (
        <span style={{ color: getICPColor(row.icp), fontWeight: "bold" }}>{row.icp}</span>
      ),
    },
    {
      key: "cpp",
      title: "CPP (mmHg)",
      dataKey: "cpp",
      width: 120,
      render: (row) => (
        <span style={{ color: getCPPColor(row.cpp), fontWeight: "bold" }}>{row.cpp}</span>
      ),
    },
    {
      key: "evdLevel",
      title: "EVD Level (cmH₂O)",
      dataKey: "evdLevel",
      width: 150,
      render: (row) => (
        <span style={{ color: getEVDColor(row.evdLevel), fontWeight: "bold" }}>{row.evdLevel}</span>
      ),
    },
  ];


  return (
    <div
      className={`flow-sheet-icu ${mode === "dark" ? "dark" : "light"}`}
      style={{ margin: "0.5vw" }}
    >
      
      <SectionContainer
        title={<>
          <span className="icu-title-flow-sheet">
            <FontAwesomeIcon
              icon={faTruckMedical}
              className="title-icon-main-title"
              color={mode === "dark" ? "#dfdfdfff" : "#7d7d7dff"}
            />
            Glasgow coma scale
          </span>
                    <div className="add-button-for-neurological-view">
                      <MyButton
                        prefixIcon={() => <FontAwesomeIcon icon={faCheck} />}                      >
                        Save
                      </MyButton>
                    </div>
        </>}
        content={<GlasgowComaScale />}
      />

        <SectionContainer
          title={<><span className="icu-title-flow-sheet">
            <FontAwesomeIcon
              icon={faEye}
              className="title-icon-main-title"
              color={mode === "dark" ? "#dfdfdfff" : "#7d7d7dff"}
            />
            Pupil size and Reactivity
          </span>
                              <div className="add-button-for-neurological-view">
                      <MyButton
                        prefixIcon={() => <FontAwesomeIcon icon={faCheck} />}
                      >
                        Save
                      </MyButton>
                    </div>
        </>}
          
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
                          searchable={false}
                        />
                      </div>
                    </Form>
                  }
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
                          searchable={false}
                        />
                      </div>
                    </Form>
                  }
                />
              </div>

              {/* table under eye inputs */}
              <div style={{ marginTop: "1vw" }}>
                <MyTable
                  data={pupilRecords}
                  columns={pupilTableColumns}
                  loading={false}
                  sortColumn={null}
                  sortType={null}
                  page={0}
                  rowsPerPage={10}
                  totalCount={pupilRecords.length}
                  onPageChange={() => { }}
                  onRowsPerPageChange={() => { }}
                />
              </div>
            </>
          }
        />

      <SectionContainer
        title={<>
          <span className="icu-title-flow-sheet">
            <FontAwesomeIcon
              icon={faBandage}
              className="title-icon-main-title"
              color={mode === "dark" ? "#dfdfdfff" : "#7d7d7dff"}
            />
            Pain Assessment
          </span>
                              <div className="add-button-for-neurological-view">
                      <MyButton
                        prefixIcon={() => <FontAwesomeIcon icon={faCheck} />}                      >
                        Save
                      </MyButton>
                    </div>
        </>}

        content={<><Form fluid>
          <div className="pain-assessment-inputs-container-handle">
            <div className="pain-assessment-container">

              <label>Pain Level ({painLevel}-10)</label>
              <div className="slider-class" style={{ position: "relative", width: "300px" }}>
                <Slider
                  value={painLevel}
                  onChange={(value) => setPainLevel(value)}
                  min={0}
                  max={10}
                  step={1}
                  progress
                />
                <div
                  style={{
                    position: "absolute",
                    top: "52%",
                    left: 0,
                    height: "7px",
                    width: `${(painLevel / 10) * 100}%`,
                    backgroundColor: getTrackColor(painLevel),
                    transform: "translateY(-50%)",
                    zIndex: 1,
                    transition: "background-color 0.2s ease",
                    borderRadius: "4px",
                  }}
                />
              </div>
            </div>
            <MyInput
              width={200}
              fieldLabel="Pain Description"
              fieldType="textarea"
              fieldName="paindescription"
              record={record}
              setRecord={setRecord}
            />
          </div>
        </Form>


          <div style={{ marginTop: "1vw" }}>
            <MyTable
              data={painRecords}
              columns={painAssessmentColumns}
              loading={false}
              sortColumn={null}
              sortType={null}
              page={0}
              rowsPerPage={10}
              totalCount={painRecords.length}
              onPageChange={() => { }}
              onRowsPerPageChange={() => { }}
            />
          </div></>}
      />

      <SectionContainer
        title={<>
          <span className="icu-title-flow-sheet">
            <FontAwesomeIcon
              icon={faBrain}
              className="title-icon-main-title"
              color={mode === "dark" ? "#dfdfdfff" : "#7d7d7dff"}
            />
            Intracranial Dynamics
          </span>
                            <div className="add-button-for-neurological-view">
                      <MyButton
                        prefixIcon={() => <FontAwesomeIcon icon={faCheck} />}                      >
                        Save
                      </MyButton>
                    </div>
        </>}
        content={
          <>
            <Form fluid style={{ display: "flex", gap: "1vw", marginBottom: "1vw" }}>
              <MyInput
                fieldName="icp"
                fieldLabel="ICP"
                fieldType="number"
                record={intracranialRecord}
                setRecord={setIntracranialRecord}
                rightAddon={"mmHg"}
                rightAddonwidth={"auto"}
                inputColor={
                  intracranialRecord.icp > 25
                    ? "red"
                    : "black"
                }
              />

              {/* CPP */}
              <MyInput
                fieldName="cpp"
                fieldLabel="CPP"
                fieldType="number"
                record={intracranialRecord}
                setRecord={setIntracranialRecord}
                rightAddon={"mmHg"}
                rightAddonwidth={"auto"}
                inputColor={
                  intracranialRecord.cpp >= 60 && intracranialRecord.cpp <= 70
                    ? "green"
                    : "black"
                }
              />

              {/* EVD Level */}
              <MyInput
                fieldName="evdLevel"
                fieldLabel="END LEVEL"
                fieldType="number"
                record={intracranialRecord}
                setRecord={setIntracranialRecord}
                rightAddon={"cmH₂O"}
                rightAddonwidth={"auto"}
                inputColor={
                  intracranialRecord.evdLevel < 0 || intracranialRecord.evdLevel > 30
                    ? "red"
                    : "black"
                }
              />
            </Form>

            <div style={{ marginTop: "1vw" }}>
              <MyTable
                data={intracranialRecords}
                columns={intracranialColumns}
                loading={false}
                sortColumn={null}
                sortType={null}
                page={0}
                rowsPerPage={10}
                totalCount={intracranialRecords.length}
                onPageChange={() => { }}
                onRowsPerPageChange={() => { }}
              />
            </div>
          </>
        }
      />

    </div>
  );
};

export default NeurologicalICU;
