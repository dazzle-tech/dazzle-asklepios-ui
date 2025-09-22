import React, { useState } from "react";
import SectionContainer from "@/components/SectionsoContainer";
import MyInput from "@/components/MyInput";
import { useGetLovValuesByCodeQuery } from "@/services/setupService";
import { Form } from 'rsuite';
import MyBadgeStatus from "@/components/MyBadgeStatus/MyBadgeStatus";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {faCircleInfo, faHeart} from '@fortawesome/free-solid-svg-icons';
import DynamicCard from "@/components/DynamicCard";
import MyButton from "@/components/MyButton/MyButton";
import VitalSignABG from "./VitalSignICU";
import MyModal from "@/components/MyModal/MyModal";
import PlusIcon from '@rsuite/icons/Plus';
import VitalSigns from '@/pages/medical-component/vital-signs';
import './style.less';

const ModalContent: React.FC = () => {
  const [record, setRecord] = useState<any>({});

  const [vital, setVital] = useState({
    bloodPressureSystolic: 0,
    bloodPressureDiastolic: 0,
    heartRate: 0,
    temperature: 0,
    oxygenSaturation: 0,
    measurementSiteLkey: '',
    respiratoryRate: 0
  });

  return (<> 
      <SectionContainer
title={
            <h5 className="h3-icu-screen-handle">
              <FontAwesomeIcon icon={faCircleInfo} style={{ color: 'var(--primary-blue)' }} />
              ICU Vitals
            </h5>
          }
        content={<><VitalSigns
                      object={vital}
                      setObject={setVital}
                      disabled={true}
                      width="40vw"
                      showNoteField={false}
                    />
<div className="vital-sign-icu-card">
<Form>
    <div className="icu-first-section-content-container"> 
            <MyInput
              width={"14vw"}
              fieldType="number"
              fieldLabel="pH"
              fieldName="ph"
              record={record}
              setRecord={setRecord}
            />
            <MyInput
              width={"14vw"}
              fieldType="number"
              fieldLabel="PaCO₂"
              fieldName="paco₂"
              rightAddon={'mmHg'}
              rightAddonwidth={'auto'}
              record={record}
              setRecord={setRecord}
            />

            <MyInput
              width={"14vw"}
              fieldType="number"
              fieldLabel="P/F Ratio"
              fieldName="pfratio"
              record={record}
              setRecord={setRecord}
            />

            <MyInput
              width={"14vw"}
              fieldType="number"
              fieldLabel="PaO₂"
              fieldName="pao₂"
              rightAddon={'mmHg'}
              rightAddonwidth={'auto'}
              record={record}
              setRecord={setRecord}
            />
            </div>
</Form> 
</div>

</>}/></>)

};

export default ModalContent;
