import React, { useState } from "react";
import SectionContainer from "@/components/SectionsoContainer";
import MyInput from "@/components/MyInput";
import { useGetLovValuesByCodeQuery } from "@/services/setupService";
import { Form } from 'rsuite';
import MyBadgeStatus from "@/components/MyBadgeStatus/MyBadgeStatus";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleInfo, faHeart } from '@fortawesome/free-solid-svg-icons';
import DynamicCard from "@/components/DynamicCard";
import MyButton from "@/components/MyButton/MyButton";
import VitalSignICU from "./VitalSignICU";
import MyModal from "@/components/MyModal/MyModal";
import Repositioning from "../repositioning";
import PlusIcon from '@rsuite/icons/Plus';
import ModalContent from './ModalContent';
import { Tabs } from 'rsuite';
import AbgICU from "./AbgICU";
import './style.less';
import ICUTabs from "./ICUTabs";
import VitalsignGraphs from "./VitalsignGraphs";
import ABGGraphs from "./ABGGraphs";


const ICU: React.FC = () => {
  const [record, setRecord] = useState<any>({});
  const [edit, setEdit] = useState(false);
  const [patient, setPatient] = useState<any>(null);
  const [encounter, setEncounter] = useState<any>(null);
  const [activeKey, setActiveKey] = useState<string | number>('1');
  const [openVitalModal, setOpenVitalModal] = useState(false);
  const [openVitalGraphModal, setOpenVitalGraphModal] = useState(false);
  const [openABGGraphModal, setOpenABGGraphModal] = useState(false);

  const [selectedABGMetric, setSelectedABGMetric] = useState<string | null>(null);


  // isolation precautions LOV
  const { data: isolationPrecautionLovResponse } =
    useGetLovValuesByCodeQuery("ISOLATION_PRECAUT");

  const getColor = (val: string | undefined) => {
    switch (val) {
      case "Contact":
        return "#FFA500"; // orange
      case "Droplet":
        return "#007BFF"; // blue
      case "Airborne":
        return "#DC3545"; // red
      default:
        return "#6c757d"; // gray
    }
  };



  return (<div className="icu-main-container">
    <div className="icu-first-section-container">
      <SectionContainer
        title={
          <h5 className="h3-icu-screen-handle">
            <FontAwesomeIcon icon={faCircleInfo} style={{ color: 'var(--primary-blue)' }} />
            Admission Information
          </h5>
        } content={
          <Form>
            <div className="icu-first-section-content-container">
              <MyInput
                width={"12vw"}
                fieldType="select"
                fieldLabel="Source"
                fieldName="source"
                record={record}
                setRecord={setRecord}
                selectData={[
                  { key: "emergency", lovDisplayVale: "Emergency" },
                  { key: "day_case", lovDisplayVale: "Day Case" },
                  { key: "inpatient", lovDisplayVale: "Inpatient" },
                ]}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
              />

              <MyInput
                width={"12vw"}
                fieldType="text"
                fieldLabel="Primary ICU Diagnosis"
                fieldName="primaryIcuDiagnosis"
                record={record}
                setRecord={setRecord}
              />

              <MyInput
                width={"12vw"}
                fieldType="text"
                fieldLabel="Reason for ICU"
                fieldName="icuReason"
                record={record}
                setRecord={setRecord}
              />
              <MyInput
                width={"12vw"}
                fieldType="select"
                fieldLabel="Isolation Precautions"
                fieldName="isolationPrecautionLkey"
                record={record}
                setRecord={setRecord}
                selectData={isolationPrecautionLovResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
              />
              <div style={{ marginTop: '2vw' }}>

                {record.isolationPrecautionLkey && (
                  <MyBadgeStatus
                    contant={
                      isolationPrecautionLovResponse?.object?.find(
                        (item) => item.key === record.isolationPrecautionLkey
                      )?.lovDisplayVale
                    }
                    color={getColor(
                      isolationPrecautionLovResponse?.object?.find(
                        (item) => item.key === record.isolationPrecautionLkey
                      )?.lovDisplayVale
                    )}
                  />
                )}
              </div>


              <MyInput
                width={"12vw"}
                fieldType="number"
                fieldLabel="ICU Day Count"
                fieldName="icuDayCount"
                record={record}
                setRecord={setRecord}
              /></div>
          </Form>}
      />
    </div>

    <div className="icu-second-section-container">
      <SectionContainer
        title={
          <h5 className="h3-icu-screen-handle">
            <FontAwesomeIcon icon={faCircleInfo} style={{ color: 'var(--primary-blue)' }} />
            Vital Signs
          </h5>
        }
        content={<>
          <div className="second-section-add-button">
            <MyButton
              prefixIcon={() => <PlusIcon />}
              onClick={() => setOpenVitalModal(true)}
            >
              Add
            </MyButton>

            <MyButton
              prefixIcon={() => <PlusIcon />}
              onClick={() => setOpenVitalGraphModal(true)}
            >
              Show Graphs
            </MyButton>
          </div>
          <VitalSignICU />
          <div className="second-section-abgs-handle">
            <SectionContainer
              title={<h5 className="h3-icu-screen-handle">
                <FontAwesomeIcon icon={faCircleInfo} style={{ color: 'var(--primary-blue)' }} />
                ABGS
              </h5>
              }
              content={<>        <div className="second-section-add-button">
                <MyButton
                  prefixIcon={() => <PlusIcon />}
                  onClick={() => setOpenABGGraphModal(true)}
                >
                  Show Graphs
                </MyButton>
              </div>

                <AbgICU /></>} />
          </div>
        </>} />
    </div>


    <div className="icu-first-section-container">
      <SectionContainer
        title={
          <h5 className="h3-icu-screen-handle">
            <FontAwesomeIcon icon={faCircleInfo} style={{ color: 'var(--primary-blue)' }} />
            Repositioning
          </h5>}
        content={<Repositioning
          edit={edit}
          patient={patient}
          encounter={encounter}
        />}
      />
    </div>

    <ICUTabs />

    <MyModal
      open={openVitalModal}
      setOpen={setOpenVitalModal}
      title="Vital Signs"
      position="right"
      content={<ModalContent />}
      actionButtonLabel="Save"
      actionButtonFunction={() => alert("Saved vitals")}
      size="50vw"
    />

    <MyModal
      open={openVitalGraphModal}
      setOpen={setOpenVitalGraphModal}
      title="Vital Signs"
      position="right"
      content={<VitalsignGraphs />}
      actionButtonLabel="Save"
      actionButtonFunction={() => alert("Saved vitals")}
      size="50vw"
    />

    <MyModal
      open={openABGGraphModal}
      setOpen={setOpenABGGraphModal}
      title="Vital Signs"
      position="right"
      content={<ABGGraphs />}
      actionButtonLabel="Save"
      actionButtonFunction={() => alert("Saved vitals")}
      size="50vw"
    />
  </div>);
};

export default ICU;
