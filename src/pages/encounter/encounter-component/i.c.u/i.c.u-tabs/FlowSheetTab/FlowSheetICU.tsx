import React, { useState } from "react";
import { useSelector } from "react-redux";
import SectionContainer from "@/components/SectionsoContainer";
import IntraoperativeMonitoring from "@/pages/operation-module/StartedDetails/IntraoperativeMonitoring";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeartbeat } from "@fortawesome/free-solid-svg-icons";
import "./style.less";

const dummyEncounter = {
  id: "ENC-12345",
  patientName: "John Doe",
  editable: true,
  vitals: {
    hr: 85,
    spo2: 97,
    bp: "120/80",
  },
};

const FlowSheetICU: React.FC = () => {
  const mode = useSelector((state: any) => state.ui.mode);

  return (
    <div
      className={`flow-sheet-icu ${mode === "dark" ? "dark" : "light"}`}
      style={{ margin: "0.5vw" }}
    >
      <SectionContainer
        title={
          <span className="icu-title-flow-sheet">
            <FontAwesomeIcon
              icon={faHeartbeat}
              className="title-icon-main-title"
              color={mode === "dark" ? "#ff4d4f" : "#d9363e"}
            />
            Monitoring
          </span>
        }
        content={
          <IntraoperativeMonitoring
            operation={dummyEncounter}
            editable={dummyEncounter.editable}
          />
        }
      />
    </div>
  );
};

export default FlowSheetICU;
