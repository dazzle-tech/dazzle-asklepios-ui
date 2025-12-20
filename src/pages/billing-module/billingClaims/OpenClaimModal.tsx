import React, { useState } from 'react';
import Translate from '@/components/Translate';
import Section from '@/components/Section';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import './styles.less';
import PatientSide from '@/pages/encounter/encounter-main-info-section/PatienSide';

interface OpenClaimModalProps {
  claim: any;
}

const OpenClaimModal = ({ claim }: OpenClaimModalProps) => {
  if (!claim) return null;

  const [localPatient] = useState({});

  const [sections, setSections] = useState<string[]>([
    'visit-info',
    'coding-details',
    'financial-summary'
  ]);

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(sections);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);

    setSections(items);
  };

    const renderSection = (id: string) => {
      switch (id) {
        case 'visit-info':
          return (
            <Section
              title={<Translate>Visit Information</Translate>}
              setOpen={() => {}}
              rightLink={null}
              openedContent={null}
              content={
                <div className="section-grid">
                  <div className="field-row">
                    <span className="label">Encounter ID</span>
                    <span className="value">{claim.encounterId}</span>
                  </div>

                  <div className="field-row">
                    <span className="label">Mode of Admission</span>
                    <span className="value">{claim.modeOfAdmission}</span>
                  </div>

                  <div className="field-row">
                    <span className="label">Discharge Type</span>
                    <span className="value">{claim.dischargeType}</span>
                  </div>

                  <div className="field-row">
                    <span className="label">Admission Date / Time</span>
                    <span className="value">{claim.admissionDateTime}</span>
                  </div>

                  <div className="field-row">
                    <span className="label">Discharge Date / Time</span>
                    <span className="value">{claim.dischargeDateTime}</span>
                  </div>

                  <div className="field-row">
                    <span className="label">Triage Date / Time</span>
                    <span className="value">{claim.triageDateTime}</span>
                  </div>

                  <div className="field-row">
                    <span className="label">Start Treatment Date / Time</span>
                    <span className="value">{claim.startTreatmentDateTime}</span>
                  </div>

                  <div className="field-row">
                    <span className="label">Patient Status</span>
                    <span className="value">{claim.patientStatus}</span>
                  </div>

                  <div className="field-row">
                    <span className="label">Encounter Referral Number</span>
                    <span className="value">{claim.encounterReferralNumber}</span>
                  </div>

                  <div className="field-row">
                    <span className="label">HIO Visit ID</span>
                    <span className="value">{claim.hioVisitId}</span>
                  </div>
                </div>
              }
            />
          );

        case 'coding-details':
          return (
            <Section
              title={<Translate>Visit Coding Details</Translate>}
              setOpen={() => {}}
              rightLink={null}
              openedContent={null}
              content={
                <div className="section-grid">
                  <div className="field-row">
                    <span className="label">Claim ID</span>
                    <span className="value">{claim.claimId}</span>
                  </div>

                  <div className="field-row">
                    <span className="label">Encounter Type</span>
                    <span className="value">{claim.encounterType}</span>
                  </div>

                  <div className="field-row">
                    <span className="label">Suggested Coding Mode</span>
                    <span className="value">{claim.suggestedCodingMode}</span>
                  </div>

                  <div className="field-row">
                    <span className="label">Payment Type</span>
                    <span className="value">{claim.paymentType}</span>
                  </div>

                  <div className="field-row">
                    <span className="label">Insurance Name</span>
                    <span className="value">{claim.insuranceName}</span>
                  </div>

                  <div className="field-row">
                    <span className="label">Advance Balance</span>
                    <span className="value">{claim.advanceBalance}</span>
                  </div>

                  <div className="field-row">
                    <span className="label">Outstanding Balance</span>
                    <span className="value">{claim.outstandingBalance}</span>
                  </div>

                  <div className="field-row">
                    <span className="label">Encounter Details Report</span>
                    <span className="value">
                      {claim.encounterDetailsReport ? 'Available' : '-'}
                    </span>
                  </div>

                  <div className="field-row">
                    <span className="label">Encounter Summary Report</span>
                    <span className="value">
                      {claim.encounterSummaryReport ? 'Available' : '-'}
                    </span>
                  </div>
                </div>
              }
            />
          );

        case 'financial-summary':
          return (
            <Section
              title={<Translate>Encounter Services & Financial Summary</Translate>}
              setOpen={() => {}}
              rightLink={null}
              openedContent={null}
              content={
                <div className="section-grid">
                  <div className="field-row">
                    <span className="label">Service Code</span>
                    <span className="value">{claim.serviceCode}</span>
                  </div>

                  <div className="field-row">
                    <span className="label">Service Name</span>
                    <span className="value">{claim.serviceName}</span>
                  </div>

                  <div className="field-row">
                    <span className="label">Beneficiary Coverage Amount</span>
                    <span className="value">{claim.beneficiaryCoverageAmount}</span>
                  </div>

                  <div className="field-row">
                    <span className="label">Personal Contribution Amount</span>
                    <span className="value">{claim.personalContributionAmount}</span>
                  </div>

                  <div className="field-row">
                    <span className="label">Total Claim Reimbursement Amount</span>
                    <span className="value">{claim.totalClaimReimbursementAmount}</span>
                  </div>

                  <div className="field-row">
                    <span className="label">Paid Amount</span>
                    <span className="value balance">{claim.paidAmount}</span>
                  </div>
                </div>
              }
            />
          );

        default:
          return null;
      }
    };

  return (
    <div className="open-claim-layout">
      <div className="claim-content">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="claim-sections" direction="horizontal">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="claim-dashboard-dnd-wrapper"
              >
                {sections.map((id, index) => (
                  <Draggable draggableId={id} index={index} key={id}>
                    {(provided, snapshot) => {
                      const style = {
                        ...provided.draggableProps.style,
                        transition: snapshot.isDropAnimating
                          ? 'transform 0.15s ease-out'
                          : provided.draggableProps.style?.transition,
                      };

                      return (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="claim-dashboard-dnd-item"
                          style={style}
                        >
                          {renderSection(id)}
                        </div>
                      );
                    }}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      <div className="patient-side-wrapper">
        <PatientSide patient={localPatient} encounter={localPatient} />
      </div>
    </div>
  );
};

export default OpenClaimModal;
