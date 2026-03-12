import MyCard from '@/components/MyCard';
import { useLazyGetPrimaryPatientDiagnosisByEncounterIdQuery } from '@/services/medicalsheetsEncounter/clinicalVisit/patientDiagnosisService';
import { useLazyGetIcdDiagnosesByIdsQuery } from '@/services/setup/icdTreeService';
import { useGetReviewOfSystemByEncounterQuery } from '@/services/medicalsheetsEncounter/ReviewOfSystemService';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import React, { useEffect, useState } from 'react';
import { Col, Row } from 'rsuite';

const DiagnosisAndFindings = ({ encounter, patient }) => {
  const [primaryDiagnosis, setPrimaryDiagnosis] = useState<any>(null);
  const [icdInfo, setIcdInfo] = useState<any>(null);

  const encounterId = encounter?.id ? Number(encounter.id) : null;

  const [triggerGetPrimaryDiagnosis] = useLazyGetPrimaryPatientDiagnosisByEncounterIdQuery();
  const [fetchIcdByIds] = useLazyGetIcdDiagnosesByIdsQuery();

  const { data: reviewOfSystemsData } = useGetReviewOfSystemByEncounterQuery(encounterId, {
    skip: !encounterId
  });

  // ✅ نفس الكودات المستخدمة في ReviewOfSystems.tsx بالضبط
  const { data: bodySystemLov } = useGetLovValuesByCodeQuery('BODY_SYS');
  const { data: bodySystemDetailLov } = useGetLovValuesByCodeQuery('BODY_SYS_DETAIL');

  useEffect(() => {
    if (!encounterId) return;

    const load = async () => {
      try {
        const diagResp = await triggerGetPrimaryDiagnosis({
          encounterId,
          timestamp: Date.now()
        }).unwrap();

        setPrimaryDiagnosis(diagResp ?? null);

        const diagnosisId = Number(diagResp?.diagnosisId);
        if (Number.isFinite(diagnosisId) && diagnosisId > 0) {
          const icdResp = await fetchIcdByIds({
            ids: [diagnosisId],
            timestamp: Date.now()
          }).unwrap();

          setIcdInfo(icdResp?.[0] ?? null);
        }
      } catch {
        setPrimaryDiagnosis(null);
        setIcdInfo(null);
      }
    };

    load();
  }, [encounterId]);

  const diagnosisText = (() => {
    const code = icdInfo?.icdCode ?? '';
    const desc = icdInfo?.icdShortDescription || icdInfo?.icdFullDescription || '';
    if (code && desc) return `${code} - ${desc}`;
    if (code) return code;
    if (desc) return desc;
    return '';
  })();

  const findingsSummaryText = (() => {
    const lines =
      reviewOfSystemsData
        ?.map((item: any, index: number) => {
          // ✅ نفس منطق Summary: system?.object?.find(i => i.key === item.bodySystem)
          const bodySystemText =
            bodySystemLov?.object?.find((i: any) => i.key === item.bodySystem)?.lovDisplayVale ??
            '';

          // ✅ نفس منطق Summary: bodySystemsDetailLovQueryResponse?.object.find(i => i.key === item.systemDetail)
          const systemDetailText =
            bodySystemDetailLov?.object?.find((i: any) => i.key === item.systemDetail)
              ?.lovDisplayVale ?? '';

          const note = item.note ? ` — Note: ${item.note}` : '';

          return `${index + 1}. ${bodySystemText}${
            systemDetailText ? ` / ${systemDetailText}` : ''
          }${note}`;
        })
        .join('\n') ?? '';

    const physicalNote = encounter?.physicalExamNote ?? '';
    return [lines, physicalNote].filter(Boolean).join('\n');
  })();

  return (
    <>
      <Row>
        <Col md={24}>
          <MyCard
            title="Primary Diagnosis"
            contant={diagnosisText || 'No primary diagnosis recorded'}
          />
        </Col>
      </Row>
      <Row>
        <Col md={24}>
          <MyCard
            title="Physical Examination - Findings Summary"
            contant={findingsSummaryText || 'No findings recorded'}
          />
        </Col>
      </Row>
    </>
  );
};

export default DiagnosisAndFindings;
