import Icd10DiagnosisSearch from '@/components/Icd10DiagnosisSearch';
import MyInput from '@/components/MyInput';
import SectionContainer from '@/components/SectionsoContainer';
import { useGetIcdDiagnosesByIdsQuery } from '@/services/setup/icdTreeService';
import React from 'react';
import { Col, Form, Row, Tag, TagGroup, Text } from 'rsuite';
import '../styles.less';

type DiagnosisProps = {
  record: any;
  setRecord: (record: any) => void;
};

const Diagnosis: React.FC<DiagnosisProps> = ({ record, setRecord }) => {
  const diagnosisIds: number[] = record?.diagnosisIcdIds ?? [];
  const { data: diagnoses = [] } = useGetIcdDiagnosesByIdsQuery(
    { ids: diagnosisIds },
    { skip: !diagnosisIds.length }
  );

  const labelOf = (id: number) => {
    const diagnosis = diagnoses.find(item => item.id === id);
    if (!diagnosis) return 'Loading...';
    const description = diagnosis.icdShortDescription ?? diagnosis.icdFullDescription;
    return [diagnosis.icdCode, description].filter(Boolean).join(' - ');
  };

  const addDiagnosis = (id: number | null) => {
    if (id && !diagnosisIds.includes(id)) {
      setRecord({ ...record, diagnosisIcdIds: [...diagnosisIds, id] });
    }
  };

  const removeDiagnosis = (id: number) =>
    setRecord({ ...record, diagnosisIcdIds: diagnosisIds.filter(item => item !== id) });

  return (
    <SectionContainer
      title={<Text>Procedure Care</Text>}
      content={
        <Row>
          <Col md={12}>
            <Icd10DiagnosisSearch hideSelected setDiagnosisId={addDiagnosis} />
            {diagnosisIds.length > 0 && (
              <TagGroup className="procedure-diagnosis-tags">
                {diagnosisIds.map(id => (
                  <Tag key={id} closable onClose={() => removeDiagnosis(id)}>
                    {labelOf(id)}
                  </Tag>
                ))}
              </TagGroup>
            )}
          </Col>
          <Col md={12}>
            <Form fluid>
              <MyInput
                width="100%"
                fieldType="textarea"
                fieldName="patientCondition"
                record={record}
                setRecord={setRecord}
              />
            </Form>
          </Col>
        </Row>
      }
    />
  );
};
export default Diagnosis;
