import React, { useState } from "react";
import { Form } from "rsuite";
import { useSelector } from "react-redux";
import SectionContainer from "@/components/SectionsoContainer";
import MyButton from "@/components/MyButton/MyButton";
import MyInput from "@/components/MyInput";
import MyTable from "@/components/MyTable/MyTable";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBrain, faCheck } from "@fortawesome/free-solid-svg-icons";

const IntracranialDynamicsICU: React.FC = () => {
  const mode = useSelector((state: any) => state.ui.mode);
  const [record, setRecord] = useState({});
  const [records] = useState([
    { id: 1, icp: 22, cpp: 65, evdLevel: 10 },
    { id: 2, icp: 30, cpp: 50, evdLevel: 35 },
  ]);

  const getICPColor = (value: number) => (value > 25 ? "red" : "black");
  const getCPPColor = (value: number) => (value >= 60 && value <= 70 ? "green" : "black");
  const getEVDColor = (value: number) => (value < 0 || value > 30 ? "red" : "black");

  return (
    <SectionContainer
      title={
        <>
          <span className="icu-title-flow-sheet">
            <FontAwesomeIcon icon={faBrain} className="title-icon-main-title" color={mode === "dark" ? "#dfdfdfff" : "#7d7d7dff"} />
            Intracranial Dynamics
          </span>
          <div className="add-button-for-neurological-view">
            <MyButton prefixIcon={() => <FontAwesomeIcon icon={faCheck} />}>Save</MyButton>
          </div>
        </>
      }
      content={
        <>
          <Form fluid layout="inline">
            <MyInput
              fieldName="icp"
              fieldLabel="ICP"
              fieldType="number"
              record={record}
              setRecord={setRecord}
              rightAddon="mmHg"
              rightAddonwidth={'auto'}
              inputColor={getICPColor(record.icp)}
            />
            <MyInput
              fieldName="cpp"
              fieldLabel="CPP"
              fieldType="number"
              record={record}
              setRecord={setRecord}
              rightAddon="mmHg"
              rightAddonwidth={'auto'}
              inputColor={getCPPColor(record.cpp)}
            />
            <MyInput
              fieldName="evdLevel"
              fieldLabel="EVD Level"
              fieldType="number"
              record={record}
              setRecord={setRecord}
              rightAddonwidth={'auto'}
              rightAddon="cmH₂O"
              inputColor={getEVDColor(record.evdLevel)}
            />
          </Form>

          <MyTable
            data={records}
            columns={[
              {
                key: "icp",
                title: "ICP",
                dataKey: "icp",
                render: (row) => <span style={{ color: getICPColor(row.icp), fontWeight: "bold" }}>{row.icp}</span>,
              },
              {
                key: "cpp",
                title: "CPP",
                dataKey: "cpp",
                render: (row) => <span style={{ color: getCPPColor(row.cpp), fontWeight: "bold" }}>{row.cpp}</span>,
              },
              {
                key: "evdLevel",
                title: "EVD Level",
                dataKey: "evdLevel",
                render: (row) => <span style={{ color: getEVDColor(row.evdLevel), fontWeight: "bold" }}>{row.evdLevel}</span>,
              },
            ]}
            loading={false}
            page={0}
            rowsPerPage={10}
            totalCount={records.length}
          />
        </>
      }
    />
  );
};

export default IntracranialDynamicsICU;
