import React, { useState } from "react";
import SectionContainer from "@/components/SectionsoContainer";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {faCircleInfo, faHeart} from '@fortawesome/free-solid-svg-icons';
import VitalSigns from '@/pages/medical-component/vital-signs';
import './styles.less';

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

        // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';

  return (<div dir={dir}>
      <SectionContainer
title={
            <h5 className="h3-icu-screen-handle">
              <FontAwesomeIcon icon={faCircleInfo} style={{ color: 'var(--primary-blue)' }} />
              ICU Vitals
            </h5>
          }
        content={<div dir={dir}><VitalSigns
                      object={vital}
                      setObject={setVital}
                      disabled={true}
                      width="40vw"
                      showNoteField={false}
                    />
</div>}/></div>)

};

export default ModalContent;
