import React from 'react';
import type { ApPatient } from '@/types/model-types';
import { Col, Row, Stack, Text } from 'rsuite';
import SectionContainer from '@/components/SectionsoContainer';
import ContactTab from './ContactTab';
import AddressTab from './AddressTab';
import BasicInfo from './BasicInfo';
import DocumentInfo from './DocumentInfo';

interface DemographicsTabProps {
  localPatient: ApPatient;
  setLocalPatient: (patient: ApPatient) => void;
  validationResult: any;
  genderLovQueryResponse: any;
  docTypeLovQueryResponse: any;
  countryLovQueryResponse: any;
  bloodGroupLovQueryResponse: any;
  patientClassLovQueryResponse: any;
  ageFormatType: { ageFormat: string };
  ageGroupValue: { ageGroup: string };
}

const DemographicsTab: React.FC<DemographicsTabProps> = ({
  localPatient,
  setLocalPatient,
  validationResult,
  genderLovQueryResponse,
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
                title={<Text>Basic Information</Text>}
                content={
                  <BasicInfo
                    validationResult={validationResult}
                    localPatient={localPatient}
                    setLocalPatient={setLocalPatient}
                    genderLovQueryResponse={genderLovQueryResponse}
                    ageFormatType={ageFormatType}
                    ageGroupValue={ageGroupValue}
                    patientClassLovQueryResponse={patientClassLovQueryResponse}
                  />
                }
              />
            </Row>
            <Row>
              <SectionContainer
                title={<Text>Document</Text>}
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
                title={<Text>Contact</Text>}
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
              <SectionContainer
                title={<Text>Address</Text>}
                content={
                  <AddressTab
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
