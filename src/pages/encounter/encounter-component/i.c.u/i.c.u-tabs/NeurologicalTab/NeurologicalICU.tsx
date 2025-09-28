import React, { useState } from "react";
import { useSelector } from "react-redux";
import SectionContainer from "@/components/SectionsoContainer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTruckMedical, faEye, faBrain, faBandage, faCheck } from "@fortawesome/free-solid-svg-icons";
import GlasgowComaScale from "../../../glasgow-coma-scale";
import { useGetLovValuesByCodeQuery } from "@/services/setupService";
import { Form } from "rsuite";
import MyInput from "@/components/MyInput";
import { Slider } from "rsuite";
import MyTable, { ColumnConfig } from "@/components/MyTable/MyTable";
import MyButton from "@/components/MyButton/MyButton";
import "./style.less";
import GlasgowComaScaleICU from "./GlasgowComaScaleICU";
import PupilSizeReactivityICU from "./PupilSizeReactivityICU";
import IntracranialDynamicsICU from "./IntracranialDynamicsICU";
import PainAssessmentICU from "./PainAssessmentICU";

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

      <GlasgowComaScaleICU></GlasgowComaScaleICU>

      <PupilSizeReactivityICU></PupilSizeReactivityICU>

      <PainAssessmentICU></PainAssessmentICU>

      <IntracranialDynamicsICU></IntracranialDynamicsICU>

    </div>
  );
};

export default NeurologicalICU;
