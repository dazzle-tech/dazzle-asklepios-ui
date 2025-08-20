import React, { useEffect, useState } from 'react';
import { initialListRequest } from '@/types/types';
import { Col, Dropdown, Form, Row } from 'rsuite';
import MyInput from '@/components/MyInput';
import { useGetIcdListQuery } from '@/services/setupService';
import SearchIcon from '@rsuite/icons/Search';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import Icd10Search from '@/pages/medical-component/Icd10Search';
import './styles.less';
const Assessment = ({
  doctorRound,
  setDoctorRound,
  recordOfIndicationsDescription,
  setRecordOfIndicationsDescription,
  ...props
}) => {
  const [recordOfSearch, setRecordOfSearch] = useState({ searchKeyword: '' });
  const [secondlistIcdRequest, setSecondListIcdRequest] = useState({ ...initialListRequest });
  const [indicationsIcd, setIndicationsIcd] = useState({ indications: null });
  const [indicationsDescription, setindicationsDescription] = useState<string>('');
  // Fetch patient status Lov response
  const { data: patientStatusLovQueryResponse } = useGetLovValuesByCodeQuery('PATIENT_STATUS');
  // Fetch icd list Response
  const { data: secondIcdListResponseData } = useGetIcdListQuery(secondlistIcdRequest);
  // customise item appears on the selected secondary diagnosis
  const secondlistForICD10 = (secondIcdListResponseData?.object ?? []).map(item => ({
    ...item,
    combinedLabel: `${item.icdCode} - ${item.description}`
  }));

  // Effects
  useEffect(() => {
    if (recordOfSearch['searchKeyword'].trim() !== '') {
      setSecondListIcdRequest({
        ...initialListRequest,
        filterLogic: 'or',
        filters: [
          {
            fieldName: 'icd_code',
            operator: 'containsIgnoreCase',
            value: recordOfSearch['searchKeyword']
          },
          {
            fieldName: 'description',
            operator: 'containsIgnoreCase',
            value: recordOfSearch['searchKeyword']
          }
        ]
      });
    }
  }, [recordOfSearch['searchKeyword']]);

  useEffect(() => {
    if (indicationsIcd.indications != null) {
      const currentIcd = secondIcdListResponseData?.object?.find(
        item => item.key === indicationsIcd.indications
      );
      if (!currentIcd) return;
      const newEntry = `${currentIcd.icdCode}, ${currentIcd.description}.`;
      setindicationsDescription(prev => {
        const updated = prev ? `${prev}\n${newEntry}` : newEntry;
        setRecordOfIndicationsDescription({
          indicationsDescription: updated
        });
        return updated;
      });
    }
  }, [indicationsIcd.indications]);

  return (
    <div className="assessment-container">
      <Form className="assessment-container" fluid>
        <Row>
          <Col md={8}>
            <Icd10Search
              object={doctorRound}
              setOpject={setDoctorRound}
              label="Primary Diagnosis"
              fieldName="primaryDiagnosis"
              disabled={props?.view}
            />
          </Col>
          <Col md={8}>
            <MyInput
              width="100%"
              fieldLable="Clinical Impression "
              fieldName="clinicalImpression"
              record={doctorRound}
              setRecord={setDoctorRound}
              disabled={!doctorRound?.key || props?.view}
            />
          </Col>
          <Col md={8}>
            <MyInput
              width="100%"
              fieldLabel="Patient Status"
              fieldName="patientStatusLkey"
              fieldType="select"
              selectData={patientStatusLovQueryResponse?.object ?? []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              record={doctorRound}
              setRecord={setDoctorRound}
              disabled={!doctorRound?.key || props?.view}
              searchable={false}
            />
          </Col>
        </Row>
        <Row>
          <Col md={8} className="testtest">
            <MyInput
              width="100%"
              fieldLabel="Secondary Diagnoses"
              fieldName="searchKeyword"
              record={recordOfSearch}
              setRecord={setRecordOfSearch}
              rightAddon={<SearchIcon />}
              disabled={!doctorRound?.key || props?.view}
            />
            {recordOfSearch['searchKeyword'] && (
              <Dropdown.Menu className="menu-diagnostic">
                {secondlistForICD10?.map(mod => (
                  <Dropdown.Item
                    key={mod.key}
                    eventKey={mod.key}
                    onClick={() => {
                      setIndicationsIcd({
                        ...indicationsIcd,
                        indications: mod.key
                      });
                      setRecordOfSearch({ searchKeyword: '' });
                    }}
                  >
                    <span>{mod.icdCode} </span>
                    <span>{mod.description}</span>
                  </Dropdown.Item>
                ))}
              </Dropdown.Menu>
            )}
            <MyInput
              disabled={true}
              fieldType="textarea"
              record={recordOfIndicationsDescription}
              setRecord={setRecordOfIndicationsDescription}
              showLabel={false}
              fieldName="indicationsDescription"
              width="100%"
            />
          </Col>
          <Col md={8}>
            <MyInput
              disabled={!doctorRound?.key || props.view}
              fieldType="textarea"
              fieldLabel="Complications Noted"
              record={doctorRound}
              setRecord={setDoctorRound}
              fieldName="complicationsNoted"
              width="100%"
              height={102}
            />
          </Col>
          <Col md={8}>
            <MyInput
              disabled={!doctorRound?.key || props?.view}
              fieldType="textarea"
              record={doctorRound}
              setRecord={setDoctorRound}
              fieldLabel="Summary Statement"
              fieldName="summaryStatement"
              width="100%"
              height={102}
            />
          </Col>
        </Row>
        <Row className="hidden-class">
          <Col>
            <MyInput
              fieldLable="Major"
              fieldName="major"
              fieldType="checkbox"
              record={doctorRound}
              setRecord={setDoctorRound}
              disabled={!doctorRound?.key}
            />
          </Col>
          <Col>
            <MyInput
              fieldLable="Suspected"
              fieldName="suspected"
              fieldType="checkbox"
              record={doctorRound}
              setRecord={setDoctorRound}
              disabled={!doctorRound?.key}
            />
          </Col>
        </Row>
      </Form>
    </div>
  );
};
export default Assessment;
