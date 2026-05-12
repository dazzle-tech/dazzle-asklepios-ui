import SectionContainer from '@/components/SectionsoContainer';
import Translate from '@/components/Translate';
import { Patient } from '@/types/model-types-new';
import React from 'react';
import { Col, Row, Stack } from 'rsuite';
import BasicInfo from './BasicInfo';
import ContactTab from './ContactTab';
import './styles.less';

interface DemographicsTabProps {
  localPatient: Patient;
  setLocalPatient: (patient: Patient) => void;
  validationResult: any;
  genderEnum: any;
  patientDocumentEnum: any;
  patientClassLovQueryResponse: any;
  ageFormatType: { ageFormat: string };
  ageGroupValue: { ageGroup: string };
}

const DemographicsTab: React.FC<DemographicsTabProps> = ({
  localPatient,
  setLocalPatient,
  validationResult,
  genderEnum,
  patientClassLovQueryResponse,
  ageFormatType,
  ageGroupValue
}) => {


  return (
    <Stack>
      <Stack.Item grow={1}></Stack.Item>
      <Stack.Item grow={15}>
        <Row gutter={15} className="d">
          <Col md={12}>
            <Row>
              <SectionContainer
                title={<Translate>Basic Information</Translate>}
                content={
                  <BasicInfo
                    validationResult={validationResult}
                    localPatient={localPatient}
                    setLocalPatient={setLocalPatient}
                    genderEnum={genderEnum}
                    ageFormatType={ageFormatType}
                    ageGroupValue={ageGroupValue}
                    patientClassLovQueryResponse={patientClassLovQueryResponse}
                  />
                }
              />
            </Row>
          </Col>
          <Col md={12}>
            <Row>
              <SectionContainer
                title={<Translate>Contact</Translate>}
                content={
                  <ContactTab
                    localPatient={localPatient}
                    setLocalPatient={setLocalPatient}
                    validationResult={validationResult}
                  />
                }
              />
            </Row>
          </Col>
        </Row>
      </Stack.Item>
    </Stack>
  );
};

export default DemographicsTab;
