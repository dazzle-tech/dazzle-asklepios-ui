import MyCard from '@/components/MyCard';
import {
  useGetEncounterReviewOfSystemsQuery,
  useGetPatientDiagnosisQuery
} from '@/services/encounterService';
import { newApPatientDiagnose } from '@/types/model-types-constructor';
import { initialListRequest } from '@/types/types';
import React, { useEffect, useState } from 'react';
import { Col, Row } from 'rsuite';
const DiagnosisAndFindings = ({ encounter, patient }) => {
  const [selectedDiagnose, setSelectedDiagnose] = useState<any>({
    ...newApPatientDiagnose,
    visitKey: encounter.key,
    patientKey: patient.key,
    createdBy: 'Administrator'
  });
  const [listRequest, setListRequest] = useState({
    ...initialListRequest,

    timestamp: new Date().getMilliseconds(),
    sortBy: 'createdAt',
    sortType: 'desc',
    filters: [
      {
        fieldName: 'patient_key',
        operator: 'match',
        value: patient.key
      },
      {
        fieldName: 'visit_key',
        operator: 'match',
        value: encounter.key
      }
    ]
  });
  const patientDiagnoseListResponse = useGetPatientDiagnosisQuery(listRequest);
  const { data: encounterReviewOfSystemsSummaryResponse, refetch } =
    useGetEncounterReviewOfSystemsQuery(encounter.key);
  const summaryText =
    encounterReviewOfSystemsSummaryResponse?.object
      ?.map((item, index) => {
        const systemDetail = item.systemDetailLvalue
          ? item.systemDetailLvalue.lovDisplayVale
          : item.systemDetailLkey;
        return `${index + 1} : ${systemDetail}\n note: ${item.notes}`;
      })
      .join('\n') + (encounter?.physicalExamNote ?? '');
  useEffect(() => {
    if (patientDiagnoseListResponse.data?.object?.length > 0) {
      setSelectedDiagnose(patientDiagnoseListResponse?.data?.object[0]?.diagnosisObject);
    }
  }, [patientDiagnoseListResponse.data]);
  return (
    <>
      <Row>
        <Col md={24}>
          <MyCard
            title="Diagnosis"
            contant={
              selectedDiagnose && selectedDiagnose.icdCode && selectedDiagnose.description
                ? `${selectedDiagnose.icdCode}, ${selectedDiagnose.description}`
                : ''
            }
          ></MyCard>
        </Col>
      </Row>
      <Row>
        <Col md={24}>
          <MyCard title={'Physical Examination'} contant={summaryText}></MyCard>
        </Col>
      </Row>
    </>
  );
};
export default DiagnosisAndFindings;
