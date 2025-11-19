import React from 'react';
import { Col, Row, Stack } from 'rsuite';
import SectionContainer from '@/components/SectionsoContainer';
import ContactTab from './ContactTab';
import AddressTab from './AddressTab';
import BasicInfo from './BasicInfo';
import DocumentInfo from './DocumentInfo';
import Translate from '@/components/Translate';
import { Patient } from '@/types/model-types-new';
import MyButton from '@/components/MyButton/MyButton';
import './styles.less';

interface DemographicsTabProps {
  localPatient: Patient;
  setLocalPatient: (patient: Patient) => void;
  validationResult: any;
  genderEnum: any;
  docTypeLovQueryResponse: any;
  countryLovQueryResponse: any;
  patientClassLovQueryResponse: any;
  ageFormatType: { ageFormat: string };
  ageGroupValue: { ageGroup: string };
}

const DemographicsTab: React.FC<DemographicsTabProps> = ({
  localPatient,
  setLocalPatient,
  validationResult,
  genderEnum,
  docTypeLovQueryResponse,
  countryLovQueryResponse,
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
            <Row>
              <SectionContainer
                title={<Translate>Document</Translate>}
                content={
                  <DocumentInfo
                    validationResult={validationResult}
                    localPatient={localPatient}
                    setLocalPatient={setLocalPatient}
                    docTypeLovQueryResponse={docTypeLovQueryResponse}
                    countryLovQueryResponse={countryLovQueryResponse}
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
            <Row>
              <AddressTab
                localPatient={localPatient}
                setLocalPatient={setLocalPatient}
                validationResult={validationResult}
              />
            </Row>
          </Col>
        </Row>
      </Stack.Item>
    </Stack>
  );
};

export default DemographicsTab;
