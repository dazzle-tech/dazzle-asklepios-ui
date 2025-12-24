import React, { useState } from 'react';
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

const OpenClaimModal = ({ claim }: OpenClaimModalProps) => {
  if (!claim) return null;

  const [sections, setSections] = useState(SECTION_CONFIG);
  const [localPatient] = useState({});
  const [approveModalOpen, setApproveModalOpen] = useState(false);

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
              <span className="value">{claim?.[key] ?? '-'}</span>
            </div>
          ))}
        </div>
      }
    />
  );

  return (<>
    <div className="open-claim-layout">
      <div className='modal-content-main-container'> 
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
                  <Draggable
                    key={section.id}
                    draggableId={section.id}
                    index={index}
                  >
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
          <MyButton
            appearance="primary"
            onClick={() => setApproveModalOpen(true)}
          >
            Approve
          </MyButton>


          <MyButton appearance="ghost" disabled>
            Approved Details
          </MyButton>

          <MyButton appearance="ghost" disabled>
            Generate Invoice
          </MyButton>

          <MyButton appearance="default">
            Show Invoices
          </MyButton>
        </div>
</div>
      <div className="patient-side-wrapper">
        <PatientSide patient={localPatient} encounter={localPatient} />
      </div>
    </div>

<MyModal
  open={approveModalOpen}
  setOpen={setApproveModalOpen}
  title={"Approval Information"}
  size="40vw"
  bodyheight="80vh"
  hideBack
  hideActionBtn
  content={<ApproveClaimModal />}
  footerButtons={
    <>
      <MyButton appearance="ghost">
        Load XML
      </MyButton>

      <MyButton appearance="default">
        Save
      </MyButton>

      <MyButton appearance="primary">
      Approve
      </MyButton>
    </>
  }
/>



  </>);
};

export default OpenClaimModal;
