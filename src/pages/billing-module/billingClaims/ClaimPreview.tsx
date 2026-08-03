import React, { useEffect, useMemo, useState } from 'react';
import { Col, Form, Panel, Row, Table } from 'rsuite';

import MyInput from '@/components/MyInput';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import SectionContainer from '@/components/SectionsoContainer';
import type { ClaimTrackingResponse } from '@/types/model-types-new';
import { formatDateWithoutSeconds } from '@/utils';

import { formatMoney, getClaimItems, getStatusColor } from './utils';

type ClaimPreviewProps = {
  open: boolean;
  claim: ClaimTrackingResponse | null;
  patient?: any;
  encounter?: any;
  onClose: () => void;
};

const ClaimPreview: React.FC<ClaimPreviewProps> = ({
  open,
  claim,
  patient,
  encounter,
  onClose
}) => {
  const [previewData, setPreviewData] = useState<Record<string, any>>({});

  useEffect(() => {
    if (!claim) return;

    const firstName = String(patient?.firstName ?? '').trim();
    const secondName = String(patient?.secondName ?? '').trim();
    const thirdName = String(patient?.thirdName ?? '').trim();
    const lastName = String(patient?.lastName ?? '').trim();
    const patientName =
      [firstName, secondName, thirdName, lastName].filter(Boolean).join(' ') || '-';

    setPreviewData({
      claimReference: claim.claimReference ?? '-',
      provClaimNo: claim.provClaimNo ?? '-',
      uploadName: claim.uploadName ?? '-',
      uploadId: claim.uploadId ?? '-',
      financialDocumentId: claim.financialDocumentId ?? '-',
      preAuthorizationId: claim.preAuthorizationId ?? '-',
      preAuthRefNo: claim.preAuthRefNo ?? '-',
      approvalResponseId: claim.approvalResponseId ?? '-',
      encounterNo: encounter?.encounterNumber ?? claim.encounterId ?? '-',
      patientName,
      mrn: patient?.medicalRecordNumber ?? '-',
      totalNet: formatMoney(claim.totalNet),
      outcome: claim.outcome ?? '-',
      message: claim.message ?? '-',
      status: claim.status ?? '-',
      submittedAt: claim.submittedAt
        ? formatDateWithoutSeconds(claim.submittedAt)
        : '-',
      createdDate: claim.createdDate
        ? formatDateWithoutSeconds(claim.createdDate)
        : '-'
    });
  }, [claim, patient, encounter]);

  const items = useMemo(() => (claim ? getClaimItems(claim) : []), [claim]);

  if (!open || !claim) return null;

  return (
    <Panel
      bordered
      className="claims-preview-panel"
      header={
        <div className="claims-preview-header">
          <div>
            <div className="claims-preview-eyebrow">Insurance Claim</div>
            <div className="claims-preview-title">
              {claim.claimReference || claim.provClaimNo || `Claim #${claim.id}`}
            </div>
          </div>
          <button className="claims-preview-close" onClick={onClose} type="button">
            ✕
          </button>
        </div>
      }
    >
      <div className="claims-preview-body">
        <div className="claims-status-banner">
          <span className="claims-status-label">Status</span>
          <MyBadgeStatus
            contant={String(claim.status ?? '-')}
            color={getStatusColor(claim.status)}
          />
        </div>

        <SectionContainer
          title="Claim Information"
          content={
            <Form fluid>
              <Row gutter={16}>
                <Col md={8}>
                  <MyInput
                    fieldType="text"
                    fieldLabel="Claim Reference"
                    record={previewData}
                    fieldName="claimReference"
                    disabled
                  />
                </Col>
                <Col md={8}>
                  <MyInput
                    fieldType="text"
                    fieldLabel="Provider Claim No"
                    record={previewData}
                    fieldName="provClaimNo"
                    disabled
                  />
                </Col>
                <Col md={8}>
                  <MyInput
                    fieldType="text"
                    fieldLabel="Total Net"
                    record={previewData}
                    fieldName="totalNet"
                    disabled
                  />
                </Col>
              </Row>
              <Row gutter={16}>
                <Col md={8}>
                  <MyInput
                    fieldType="text"
                    fieldLabel="Upload Name"
                    record={previewData}
                    fieldName="uploadName"
                    disabled
                  />
                </Col>
                <Col md={8}>
                  <MyInput
                    fieldType="text"
                    fieldLabel="Upload ID"
                    record={previewData}
                    fieldName="uploadId"
                    disabled
                  />
                </Col>
                <Col md={8}>
                  <MyInput
                    fieldType="text"
                    fieldLabel="Invoice Document ID"
                    record={previewData}
                    fieldName="financialDocumentId"
                    disabled
                  />
                </Col>
              </Row>
            </Form>
          }
        />

        <SectionContainer
          title="Patient & Encounter"
          content={
            <Form fluid>
              <Row gutter={16}>
                <Col md={8}>
                  <MyInput
                    fieldType="text"
                    fieldLabel="Patient"
                    record={previewData}
                    fieldName="patientName"
                    disabled
                  />
                </Col>
                <Col md={8}>
                  <MyInput
                    fieldType="text"
                    fieldLabel="MRN"
                    record={previewData}
                    fieldName="mrn"
                    disabled
                  />
                </Col>
                <Col md={8}>
                  <MyInput
                    fieldType="text"
                    fieldLabel="Encounter"
                    record={previewData}
                    fieldName="encounterNo"
                    disabled
                  />
                </Col>
              </Row>
            </Form>
          }
        />

        <SectionContainer
          title="Authorization Link"
          content={
            <Form fluid>
              <Row gutter={16}>
                <Col md={8}>
                  <MyInput
                    fieldType="text"
                    fieldLabel="Pre-Auth ID"
                    record={previewData}
                    fieldName="preAuthorizationId"
                    disabled
                  />
                </Col>
                <Col md={8}>
                  <MyInput
                    fieldType="text"
                    fieldLabel="Pre-Auth Ref No"
                    record={previewData}
                    fieldName="preAuthRefNo"
                    disabled
                  />
                </Col>
                <Col md={8}>
                  <MyInput
                    fieldType="text"
                    fieldLabel="Approval Response ID"
                    record={previewData}
                    fieldName="approvalResponseId"
                    disabled
                  />
                </Col>
              </Row>
            </Form>
          }
        />

        <SectionContainer
          title="Submission Details"
          content={
            <Form fluid>
              <Row gutter={16}>
                <Col md={8}>
                  <MyInput
                    fieldType="text"
                    fieldLabel="Outcome"
                    record={previewData}
                    fieldName="outcome"
                    disabled
                  />
                </Col>
                <Col md={8}>
                  <MyInput
                    fieldType="text"
                    fieldLabel="Submitted At"
                    record={previewData}
                    fieldName="submittedAt"
                    disabled
                  />
                </Col>
                <Col md={8}>
                  <MyInput
                    fieldType="text"
                    fieldLabel="Created"
                    record={previewData}
                    fieldName="createdDate"
                    disabled
                  />
                </Col>
              </Row>
              <Row gutter={16}>
                <Col md={24}>
                  <MyInput
                    fieldType="textarea"
                    fieldLabel="Message"
                    record={previewData}
                    fieldName="message"
                    disabled
                  />
                </Col>
              </Row>
            </Form>
          }
        />

        <SectionContainer
          title="Claim Items"
          content={
            items.length === 0 ? (
              <div className="claims-empty-items">No claim items available.</div>
            ) : (
              <Table data={items} autoHeight rowHeight={46} headerHeight={42}>
                <Table.Column width={70} align="center">
                  <Table.HeaderCell>Seq</Table.HeaderCell>
                  <Table.Cell dataKey="sequence" />
                </Table.Column>
                <Table.Column width={110}>
                  <Table.HeaderCell>Type</Table.HeaderCell>
                  <Table.Cell dataKey="itemType" />
                </Table.Column>
                <Table.Column width={130}>
                  <Table.HeaderCell>Code</Table.HeaderCell>
                  <Table.Cell dataKey="itemCode" />
                </Table.Column>
                <Table.Column flexGrow={2}>
                  <Table.HeaderCell>Description</Table.HeaderCell>
                  <Table.Cell dataKey="itemDescription" />
                </Table.Column>
                <Table.Column width={120}>
                  <Table.HeaderCell>Invoice</Table.HeaderCell>
                  <Table.Cell dataKey="invoiceNo" />
                </Table.Column>
                <Table.Column width={100} align="right">
                  <Table.HeaderCell>Net</Table.HeaderCell>
                  <Table.Cell>
                    {(rowData: any) => formatMoney(rowData.net)}
                  </Table.Cell>
                </Table.Column>
                <Table.Column width={110} align="right">
                  <Table.HeaderCell>Payer Share</Table.HeaderCell>
                  <Table.Cell>
                    {(rowData: any) => formatMoney(rowData.payerShare)}
                  </Table.Cell>
                </Table.Column>
              </Table>
            )
          }
        />
      </div>
    </Panel>
  );
};

export default ClaimPreview;
