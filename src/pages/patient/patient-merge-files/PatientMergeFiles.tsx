import { useAppDispatch } from '@/hooks';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { usePreviewMergeQuery, useExecuteMergeMutation, useSummarizeMergeMutation, useGetMergeTransactionsQuery, useUndoMergeMutation } from '@/services/patients/patientMergeService';
import { notify } from '@/utils/uiReducerActions';
import { Patient } from '@/types/model-types-new';
import { newPatient } from '@/types/model-types-constructor-new';
import { faCodeMerge } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Col, Grid, Panel, Row, Message, toaster, Tabs, Button, Modal } from 'rsuite';
import { getHeight } from 'rsuite/esm/DOMHelper';
import MergePreviewModal from './MergePreviewModal';
import MergePatientsTab from './MergePatientsTab';
import MergeTransactionsTab from './MergeTransactionsTab';

const PatientMergeFiles: React.FC = () => {
  const [, setExpand] = useState(false);
  const [windowHeight] = useState(getHeight(window));
  const [fromPatient, setFromPatient] = useState<Patient>({ ...newPatient });
  const [toPatient, setToPatient] = useState<Patient>({ ...newPatient });
  const [refetchData, setRefetchData] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [autoTransfers, setAutoTransfers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('merge-patients');
  const [undoConfirm, setUndoConfirm] = useState<{ show: boolean; mergeLogId?: number }>({ show: false });

  const dispatch = useAppDispatch();
  const { pathname } = useLocation();

  // API hooks
  const { data: mergePreview, isLoading: previewLoading, isFetching: previewFetching } = usePreviewMergeQuery(
    {
      fromPatientId: fromPatient.id || 0,
      toPatientId: toPatient.id || 0
    },
    { skip: !showMergeModal || !fromPatient.id || !toPatient.id }
  );

  const [executeMerge, { isLoading: executeLoading }] = useExecuteMergeMutation();
  const [summarizeMerge, { isLoading: summarizeLoading }] = useSummarizeMergeMutation();
  const { data: transactions, isLoading: transactionsLoading, refetch: refetchTransactions } = useGetMergeTransactionsQuery();
  const [undoMerge, { isLoading: undoLoading }] = useUndoMergeMutation();

  // Trigger merge flow
  const handleMergeClick = async () => {
    // Validation
    if (!fromPatient.id || !toPatient.id) {
      dispatch(notify({
        msg: 'Please select both patients to merge',
        sev: 'warning'
      }));
      return;
    }

    if (fromPatient.id === toPatient.id) {
      dispatch(notify({
        msg: 'Cannot merge a patient with themselves',
        sev: 'error'
      }));
      return;
    }

    // Show modal to load preview
    setShowMergeModal(true);
  };

  // Handle confirm merge
  const handleReviewSummary = async (decisions: any[], reason: string) => {
    try {
      const summaryRequest = {
        fromPatientId: fromPatient.id,
        toPatientId: toPatient.id,
        reason: reason || 'Duplicate patient record',
        decisions: decisions,
        autoTransfers: autoTransfers
      };

      const result = await summarizeMerge(summaryRequest).unwrap();
      setSummaryData(result);
      setShowSummary(true);
    } catch (err: any) {
      const errorMsg = err?.data?.detail || err?.data?.message || 'Failed to generate merge summary';
      dispatch(notify({
        msg: errorMsg,
        sev: 'error'
      }));
    }
  };

  // Handle confirm merge
  const handleConfirmMerge = async (decisions: any[], reason: string) => {
    try {
      const executeRequest = {
        fromPatientId: fromPatient.id,
        toPatientId: toPatient.id,
        reason: reason || 'Duplicate patient record',
        decisions: decisions,
      };

      const result = await executeMerge(executeRequest).unwrap();

      dispatch(notify({
        msg: `Merge completed successfully. Log ID: ${result.mergeLogId || 'N/A'}`,
        sev: 'success'
      }));

      // Close modal and clear
      setShowMergeModal(false);
      setShowSummary(false);
      setSummaryData(null);
      setRefetchData(!refetchData); // Trigger patient list refresh
      handleClear();
    } catch (err: any) {
      const errorMsg = err?.data?.detail || err?.data?.message || 'Failed to execute merge';
      dispatch(notify({
        msg: errorMsg,
        sev: 'error'
      }));
    }
  };

  // Handle undo merge
  const handleUndo = async (mergeLogId: number) => {
    try {
      await undoMerge({ mergeLogId }).unwrap();

      dispatch(notify({
        msg: 'Merge successfully undone',
        sev: 'success'
      }));

      setUndoConfirm({ show: false });
      await refetchTransactions();
      setRefetchData(!refetchData);
    } catch (err: any) {
      const errorMsg = err?.data?.detail || err?.data?.message || 'Failed to undo merge';
      dispatch(notify({
        msg: errorMsg,
        sev: 'error'
      }));
    }
  };

  const handleTabChange = (eventKey: string | number) => {
    setActiveTab(String(eventKey));
  };

  const handleClear = () => {
    setToPatient({ ...newPatient });
    setFromPatient({ ...newPatient });
  };

  useEffect(() => {
    const divContent = (
      "Files Merge"
    );

    dispatch(setPageCode('Files_Merge'));
    dispatch(setDivContent(divContent));

    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch, pathname]);

  // Update autoTransfers from preview data
  useEffect(() => {
    if (mergePreview?.autoTransfers) {
      setAutoTransfers(mergePreview.autoTransfers);
    }
  }, [mergePreview]);

  // Direction handling for RTL/LTR
  const direction = localStorage.getItem('direction') || 'LTR';
  const isRTL = direction === 'RTL';

  const dir = isRTL ? 'rtl' : 'ltr';

  return (
    <div dir={dir} style={{ padding: '20px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Header Section */}
      <div style={{
        backgroundColor: '#fff',
        padding: '20px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        marginBottom: '24px',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <FontAwesomeIcon icon={faCodeMerge} style={{ fontSize: '24px', color: '#3b82f6' }} />
          <h2 style={{ margin: 0, color: '#1e293b', fontSize: '24px', fontWeight: '600' }}>
            Patient Merge
          </h2>
        </div>
        <p style={{ margin: 0, color: '#64748b', fontSize: '14px', lineHeight: '1.5' }}>
          Select two patients to merge. The patient on the right will be the primary record, and data from the patient on the left will be merged into it.
        </p>
      </div>

      <Grid fluid dir={dir}>
        <Row gutter={24}>
          <Col xs={24}>
            <Tabs activeKey={activeTab} onSelect={handleTabChange} style={{ marginBottom: '20px' }}>
              <Tabs.Tab eventKey="merge-patients" title="Merge Patients">
                <MergePatientsTab
                  fromPatient={fromPatient}
                  toPatient={toPatient}
                  setFromPatient={setFromPatient}
                  setToPatient={setToPatient}
                  refetchData={refetchData}
                  setRefetchData={setRefetchData}
                  previewLoading={previewLoading}
                  previewFetching={previewFetching}
                  handleMergeClick={handleMergeClick}
                  handleClear={handleClear}
                  setExpand={setExpand}
                  windowHeight={windowHeight}
                />
              </Tabs.Tab>

              <Tabs.Tab eventKey="transactions" title="Transactions">
                <MergeTransactionsTab
                  transactions={transactions}
                  transactionsLoading={transactionsLoading}
                  onRequestUndo={(mergeLogId) => setUndoConfirm({ show: true, mergeLogId })}
                  undoLoading={undoLoading}
                />
              </Tabs.Tab>
            </Tabs>
          </Col>
        </Row>
      </Grid>

      {/* Merge Preview Modal */}
      <MergePreviewModal
        open={showMergeModal}
        conflicts={mergePreview?.conflicts || []}
        autoTransfers={mergePreview?.autoTransfers || []}
        fromPatientId={fromPatient.id}
        toPatientId={toPatient.id}
        onReviewSummary={handleReviewSummary}
        onConfirmMerge={handleConfirmMerge}
        onCancel={() => {
          setShowMergeModal(false);
          setShowSummary(false);
          setSummaryData(null);
        }}
        loading={previewLoading || previewFetching || executeLoading || summarizeLoading}
        showSummary={showSummary}
        summaryData={summaryData}
        onBackToConflicts={() => setShowSummary(false)}
      />

      {/* Undo Confirmation Modal */}
      <Modal open={undoConfirm.show} onClose={() => setUndoConfirm({ show: false })} size="sm">
        <Modal.Header>
          <Modal.Title>Confirm Undo</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to undo this merge transaction? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={() => setUndoConfirm({ show: false })} appearance="subtle">
            Cancel
          </Button>
          <Button
            onClick={() => undoConfirm.mergeLogId && handleUndo(undoConfirm.mergeLogId)}
            color="red"
            appearance="primary"
            loading={undoLoading}
          >
            Confirm Undo
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default PatientMergeFiles;

export const calculateAgeFormat = (dateOfBirth: string | Date) => {
  const today = new Date();
  const dob = new Date(dateOfBirth);

  if (isNaN(dob.getTime())) {
    return '';
  }

  let years = today.getFullYear() - dob.getFullYear();
  let months = today.getMonth() - dob.getMonth();
  let days = today.getDate() - dob.getDate();

  if (months < 0 || (months === 0 && days < 0)) {
    years--;
    months += 12;
  }
  if (days < 0) {
    const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    days += lastMonth.getDate();
    months--;
  }

  let ageString = '';
  if (years > 0) ageString += `${years}y `;
  if (months > 0) ageString += `${months}m `;
  if (days > 0) ageString += `${days}d`;

  return ageString.trim();
};
