import React, { useMemo, useState } from 'react';
import Translate from '@/components/Translate';
import Section from '@/components/Section';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import './styles.less';
import PatientSide from '@/pages/encounter/encounter-main-info-section/PatienSide';
import MyButton from '@/components/MyButton/MyButton';
import MyModal from '@/components/MyModal/MyModal';
import ApproveClaimModal from './ApproveClaimModal';

interface OpenClaimModalProps {
  claim: any;
  patient: any;
  encounter: any;
}

const SECTION_CONFIG = [
  {
    id: 'visit-info',
    title: 'Visit Information',
    fields: [
      ['Encounter ID', 'encounterId'],
      ['Mode of Admission', 'modeOfAdmission'],
      ['Discharge Type', 'dischargeType'],
      ['Admission Date / Time', 'admissionDateTime'],
      ['Discharge Date / Time', 'dischargeDateTime'],
      ['Triage Date / Time', 'triageDateTime'],
      ['Start Treatment Date / Time', 'startTreatmentDateTime'],
      ['Patient Status', 'patientStatus'],
      ['Encounter Referral Number', 'encounterReferralNumber'],
      ['HIO Visit ID', 'hioVisitId']
    ]
  },
  {
    id: 'coding-details',
    title: 'Visit Coding Details',
    fields: [
      ['Claim ID', 'claimId'],
      ['Encounter Type', 'encounterType'],
      ['Suggested Coding Mode', 'suggestedCodingMode'],
      ['Payment Type', 'paymentType'],
      ['Insurance Name', 'insuranceName'],
      ['Advance Balance', 'advanceBalance'],
      ['Outstanding Balance', 'outstandingBalance']
    ]
  },
  {
    id: 'financial-summary',
    title: 'Encounter Services & Financial Summary',
    fields: [
      ['Service Code', 'serviceCode'],
      ['Service Name', 'serviceName'],
      ['Beneficiary Coverage Amount', 'beneficiaryCoverageAmount'],
      ['Personal Contribution Amount', 'personalContributionAmount'],
      ['Total Claim Reimbursement Amount', 'totalClaimReimbursementAmount'],
      ['Paid Amount', 'paidAmount']
    ]
  }
];

// -------------------- helpers: seeded random (stable per claim) --------------------
const hashToInt = (str: string) => {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
};

const seededPick = <T,>(seed: string, arr: T[]) => {
  if (!arr?.length) return undefined as any;
  return arr[hashToInt(seed) % arr.length];
};

const seededFloat = (seed: string, min: number, max: number, decimals = 2) => {
  const x = hashToInt(seed) % 100000;
  const rnd = x / 100000;
  const val = min + rnd * (max - min);
  return Number(val.toFixed(decimals));
};

const seededInt = (seed: string, min: number, max: number) => {
  const x = hashToInt(seed) % 100000;
  const rnd = x / 100000;
  return Math.floor(min + rnd * (max - min + 1));
};

const parseDateSafe = (v?: string) => {
  if (!v) return null;
  const normalized = String(v).includes('T') ? String(v) : String(v).replace(' ', 'T');
  const d = new Date(normalized);
  return isNaN(d.getTime()) ? null : d;
};

const isoLike = (d: Date) => {
  // عرض بسيط منطقي، بدون ثواني
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}`;
};

const seededDateTime = (seed: string, daysBack = 30) => {
  const now = new Date();
  const d = new Date(now);
  d.setDate(now.getDate() - (hashToInt(seed) % daysBack));
  d.setHours((hashToInt(seed + '-h') % 12) + 8, hashToInt(seed + '-m') % 60, 0, 0);
  return isoLike(d);
};

const toMoney = (n: any) => {
  const num = Number(n);
  if (Number.isNaN(num)) return n ?? '-';
  return num.toFixed(2);
};

const OpenClaimModal = ({ claim, patient, encounter }: OpenClaimModalProps) => {
  if (!claim) return null;

  const [sections, setSections] = useState(SECTION_CONFIG);
  const [approveModalOpen, setApproveModalOpen] = useState(false);

  const viewModel = useMemo(() => {
    const seedBase = `${claim?.claimId || claim?.id || ''}-${encounter?.key || encounter?.visitId || ''}`;

    // read dates from encounter if exist
    const plannedStart =
      encounter?.plannedStartDate ||
      encounter?.planned_start_date ||
      encounter?.plannedStartDateTime ||
      encounter?.admissionDateTime;

    const discharge =
      encounter?.dischargeDateTime || encounter?.discharge_date_time || encounter?.dischargeDate;

    // make sure display is nice
    const plannedStartDisplay = plannedStart
      ? isoLike(parseDateSafe(plannedStart) || new Date(plannedStart))
      : seededDateTime(seedBase + '-admission', 60);

    const dischargeDisplay = discharge
      ? isoLike(parseDateSafe(discharge) || new Date(discharge))
      : seededDateTime(seedBase + '-discharge', 10);

    const triageDisplay =
      encounter?.triageDateTime
        ? isoLike(parseDateSafe(encounter.triageDateTime) || new Date(encounter.triageDateTime))
        : seededDateTime(seedBase + '-triage', 7);

    const startTreatDisplay =
      encounter?.startTreatmentDateTime
        ? isoLike(
            parseDateSafe(encounter.startTreatmentDateTime) ||
              new Date(encounter.startTreatmentDateTime)
          )
        : seededDateTime(seedBase + '-treat', 7);

    const encounterId =
      claim?.encounterId ||
      encounter?.visitId ||
      encounter?.encounterNumber ||
      encounter?.key ||
      claim?.encounterNumber ||
      '-';

    const claimId =
      claim?.claimId ||
      claim?.id ||
      `CLM-${String((hashToInt(seedBase) % 999999) + 1).padStart(6, '0')}`;

    const encounterType =
      claim?.encounterType ||
      encounter?.visitTypeLvalue?.lovDisplayVale ||
      encounter?.visitType ||
      seededPick(seedBase + '-encType', ['Urgent Visit', 'Consultation', 'Follow-up', 'ER Visit']);

    const modeOfAdmission =
      claim?.modeOfAdmission ||
      encounter?.modeOfAdmission ||
      seededPick(seedBase + '-moa', ['Clinic', 'ER', 'Referral']);

    const dischargeType =
      claim?.dischargeType ||
      encounter?.dischargeType ||
      seededPick(seedBase + '-disType', ['Normal', 'Transfer', 'Against Medical Advice']);

    const patientStatus =
      claim?.patientStatus ||
      encounter?.patientStatus ||
      seededPick(seedBase + '-patStatus', ['Stable', 'Under Observation', 'Critical']);

    const referralNo =
      claim?.encounterReferralNumber ||
      encounter?.referralNo ||
      encounter?.referralNumber ||
      `REF-${String((hashToInt(seedBase + '-ref') % 999999) + 1).padStart(6, '0')}`;

    const hioVisitId =
      claim?.hioVisitId ||
      encounter?.hioVisitId ||
      `HIO-${String((hashToInt(seedBase + '-hio') % 999999) + 1).padStart(6, '0')}`;

    const suggestedCodingMode =
      claim?.suggestedCodingMode ||
      claim?.codingMode ||
      seededPick(seedBase + '-codingMode', ['Auto', 'Manual', 'Hybrid']);

    const paymentType =
      claim?.paymentType ||
      seededPick(seedBase + '-pay', ['Insurance', 'Cash', 'Self Pay']);

    const insuranceName =
      claim?.insuranceName ||
      claim?.payerName ||
      seededPick(seedBase + '-ins', ['AXA', 'Bupa', 'Cigna', 'Allianz', 'None']);

    const advanceBalance =
      claim?.advanceBalance ??
      seededFloat(seedBase + '-adv', 0, 500, 2);

    const outstandingBalance =
      claim?.outstandingBalance ??
      seededFloat(seedBase + '-out', 0, 2000, 2);

    const serviceCode =
      claim?.serviceCode ||
      seededPick(seedBase + '-svcCode', ['CONSULTATION', 'COUNSELING', 'ERVISIT', 'XRAY', 'LAB-CBC']);

    const serviceName =
      claim?.serviceName ||
      seededPick(seedBase + '-svcName', ['Consultation', 'Counseling', 'ER Visit', 'X-Ray', 'CBC Test']);

    const beneficiaryCoverageAmount =
      claim?.beneficiaryCoverageAmount ??
      seededFloat(seedBase + '-cov', 50, 700, 2);

    const personalContributionAmount =
      claim?.personalContributionAmount ??
      seededFloat(seedBase + '-pc', 0, 250, 2);

    const totalClaimReimbursementAmount =
      claim?.totalClaimReimbursementAmount ??
      seededFloat(seedBase + '-total', 100, 1200, 2);

    const paidAmount =
      claim?.paidAmount ??
      Math.min(
        totalClaimReimbursementAmount,
        seededFloat(seedBase + '-paid', 0, totalClaimReimbursementAmount, 2)
      );

    // ---- final object used by UI (keys match your SECTION_CONFIG) ----
    return {
      // visit info
      encounterId,
      modeOfAdmission,
      dischargeType,
      admissionDateTime: claim?.admissionDateTime || plannedStartDisplay,
      dischargeDateTime: claim?.dischargeDateTime || dischargeDisplay,
      triageDateTime: claim?.triageDateTime || triageDisplay,
      startTreatmentDateTime: claim?.startTreatmentDateTime || startTreatDisplay,
      patientStatus,
      encounterReferralNumber: referralNo,
      hioVisitId,

      // coding details
      claimId,
      encounterType,
      suggestedCodingMode,
      paymentType,
      insuranceName,
      advanceBalance: toMoney(advanceBalance),
      outstandingBalance: toMoney(outstandingBalance),

      // financial summary
      serviceCode,
      serviceName,
      beneficiaryCoverageAmount: toMoney(beneficiaryCoverageAmount),
      personalContributionAmount: toMoney(personalContributionAmount),
      totalClaimReimbursementAmount: toMoney(totalClaimReimbursementAmount),
      paidAmount: toMoney(paidAmount),

      _raw: { claim, patient, encounter }
    };
  }, [claim, patient, encounter]);

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(sections);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);

    setSections(items);
  };

  const renderSection = (section: any) => (
    <Section
      key={section.id}
      title={<Translate>{section.title}</Translate>}
      setOpen={() => {}}
      rightLink={null}
      openedContent={null}
      content={
        <div className="section-grid">
          {section.fields.map(([label, key]: any) => (
            <div className="field-row" key={key}>
              <span className="label">{label}</span>

              <span className="value">{viewModel?.[key] ?? claim?.[key] ?? '-'}</span>
            </div>
          ))}
        </div>
      }
    />
  );

  return (
    <>
      <div className="open-claim-layout">
        <div className="modal-content-main-container">
          <div className="claim-content">
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="claim-sections" direction="horizontal">
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="claim-dashboard-dnd-wrapper"
                  >
                    {sections.map((section, index) => (
                      <Draggable key={section.id} draggableId={section.id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="claim-dashboard-dnd-item"
                          >
                            {renderSection(section)}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>

          <div className="claim-actions-bar">
            <MyButton appearance="primary" onClick={() => setApproveModalOpen(true)}>
              Approve
            </MyButton>

            <MyButton appearance="ghost" disabled>
              Approved Details
            </MyButton>

            <MyButton appearance="ghost" disabled>
              Generate Invoice
            </MyButton>

            <MyButton appearance="default">Show Invoices</MyButton>
          </div>
        </div>

        <div className="patient-side-wrapper">
          <PatientSide patient={patient} encounter={encounter} />
        </div>
      </div>

      <MyModal
        open={approveModalOpen}
        setOpen={setApproveModalOpen}
        title={'Approval Information'}
        size="40vw"
        bodyheight="80vh"
        hideBack
        hideActionBtn
        content={<ApproveClaimModal />}
        footerButtons={
          <>

            <MyButton appearance="default">Save</MyButton>

            <MyButton appearance="primary">Approve</MyButton>
          </>
        }
      />
    </>
  );
};

export default OpenClaimModal;
