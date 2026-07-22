import { useAppDispatch } from '@/hooks';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import {
  useLazyPreviewMergeQuery,
  useExecuteMergeMutation,
  useSummarizeMergeMutation,
  useGetMergeTransactionsQuery,
  useUndoMergeMutation
} from '@/services/patients/patientMergeService';
import { notify } from '@/utils/uiReducerActions';
import { Patient } from '@/types/model-types-new';
import { newPatient } from '@/types/model-types-constructor-new';
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { getHeight } from 'rsuite/esm/DOMHelper';

import MergePreviewModal from './MergePreviewModal';
import MergePatientsTab from './MergePatientsTab';
import MergeTransactionsTab from './MergeTransactionsTab';
import MyModal from '@/components/MyModal/MyModal';
import MyButton from '@/components/MyButton/MyButton';
import Translate from '@/components/Translate';
import MyTab from '@/components/MyTab';

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

  // ✅ APIs
  const [triggerPreviewMerge, { data: mergePreviewResponse, isLoading: previewLoading, isFetching: previewFetching }] =
    useLazyPreviewMergeQuery();
    console.log("Merge Preview Response:", mergePreviewResponse);
  const mergePreview = mergePreviewResponse?.preview ?? mergePreviewResponse;

  const [executeMerge, { isLoading: executeLoading }] = useExecuteMergeMutation();
  const [summarizeMerge, { isLoading: summarizeLoading }] = useSummarizeMergeMutation();

  const { data: transactions, isLoading: transactionsLoading, refetch: refetchTransactions } =
    useGetMergeTransactionsQuery();

  const [undoMerge, { isLoading: undoLoading }] = useUndoMergeMutation();


  // ✅ preview
  const handleMergeClick = async () => {

    if (!fromPatient.id || !toPatient.id) {
      dispatch(notify({ msg: 'Please select both patients to merge', sev: 'warning' }));
      return;
    }

    if (fromPatient.id === toPatient.id) {
      dispatch(notify({ msg: 'Cannot merge a patient with themselves', sev: 'error' }));
      return;
    }

    try {
      const result = await triggerPreviewMerge({
        fromPatientId: fromPatient.id,
        toPatientId: toPatient.id
      }).unwrap();

      const issues = Array.isArray(result?.issues) ? result.issues : [];

      if (result?.valid === false) {

        setShowMergeModal(false);
        setShowSummary(false);
        setSummaryData(null);
        setAutoTransfers([]);

        issues.forEach((issue: any) => {
          dispatch(notify({
            msg: issue?.message,
            sev: 'warning'
          }));
        });

        return;
      }

      setShowMergeModal(true);
      setShowSummary(false);
      setSummaryData(null);

    } catch (err: any) {
      dispatch(notify({
        msg: 'Failed to load merge preview',
        sev: 'error'
      }));
    }
  };


  // ✅ summary
  const handleReviewSummary = async (decisions: any[], reason: string) => {

    const request = {
      fromPatientId: fromPatient.id,
      toPatientId: toPatient.id,
      reason,
      decisions,
      autoTransfers
    };

    const result = await summarizeMerge(request).unwrap();

    setSummaryData(result);
    setShowSummary(true);
  };



  const handleConfirmMerge = async (
    decisions: any[],
    reason: string,
    ruleDecisions: Record<string, string>   // ✅ NEW
  ) => {

    try {

      const executeRequest = {
        fromPatientId: fromPatient.id,
        toPatientId: toPatient.id,
        reason,
        decisions,
        ruleDecisions  
      };

      const result = await executeMerge(executeRequest).unwrap();

      dispatch(notify({
        msg: `Merge completed successfully. Log Number : ${result.transactionNumber || 'N/A'}`,
        sev: 'success'
      }));

      setShowMergeModal(false);
      setShowSummary(false);
      setSummaryData(null);
      setRefetchData(!refetchData);

      handleClear();

    } catch (err: any) {
      dispatch(notify({
        msg: 'Failed to execute merge',
        sev: 'error'
      }));
    }
  };


  // ✅ undo
  const handleUndo = async (mergeLogId: number) => {

    await undoMerge({ mergeLogId }).unwrap();

    dispatch(notify({
      msg: 'Merge successfully undone',
      sev: 'success'
    }));

    setUndoConfirm({ show: false });
    await refetchTransactions();
  };


  const handleClear = () => {
    setFromPatient({ ...newPatient });
    setToPatient({ ...newPatient });
  };


  // ✅ auto transfers
  useEffect(() => {
    if (mergePreview?.autoTransfers) {
      setAutoTransfers(mergePreview.autoTransfers);
    }
  }, [mergePreview]);


  useEffect(() => {
    dispatch(setPageCode('Files_Merge'));
    dispatch(setDivContent('Files Merge'));

    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch, pathname]);


  return (
    <div>

      <MyTab
        activeTab={activeTab === 'merge-patients' ? '1' : '2'}
        setActiveTab={(key: string) =>
          setActiveTab(key === '1' ? 'merge-patients' : 'transactions')
        }
        data={[
          {
            title: 'Merge Patients',
            content: (
              <MergePatientsTab
                fromPatient={fromPatient}
                toPatient={toPatient}
                setFromPatient={setFromPatient}
                setToPatient={setToPatient}
                handleMergeClick={handleMergeClick}
                handleClear={handleClear}
                windowHeight={windowHeight}
              />
            )
          },
          {
            title: 'Transactions',
            content: (
              <MergeTransactionsTab
                transactions={transactions}
                transactionsLoading={transactionsLoading}
                onRequestUndo={(mergeLogId: number) =>
                  setUndoConfirm({ show: true, mergeLogId })
                }
              />
            )
          }
        ]}
      />

      {/* ✅ MODAL */}
      <MergePreviewModal
        open={showMergeModal}
        conflicts={mergePreview?.conflicts || []}
        autoTransfers={mergePreview?.autoTransfers || []}
        onReviewSummary={handleReviewSummary}

        // ✅ IMPORTANT
        onConfirmMerge={handleConfirmMerge}

        onCancel={() => setShowMergeModal(false)}

        loading={previewLoading || previewFetching || executeLoading || summarizeLoading}
        showSummary={showSummary}
       summaryData={summaryData}
       ruleConflicts={mergePreview?.ruleConflicts || []}
        onBackToConflicts={() => setShowSummary(false)}
      />

      {/* ✅ UNDO */}
      <MyModal
        open={undoConfirm.show}
        setOpen={(open: boolean) =>
          setUndoConfirm({ show: open })
        }
        size="sm"
        title="Confirm Undo"
        content="Undo this merge?"
        footerButtons={
          <>
            <MyButton onClick={() => setUndoConfirm({ show: false })}>
              <Translate>Cancel</Translate>
            </MyButton>

            <MyButton
              onClick={() =>
                undoConfirm.mergeLogId && handleUndo(undoConfirm.mergeLogId)
              }
              loading={undoLoading}
            >
              <Translate>Confirm</Translate>
            </MyButton>
          </>
        }
      />

    </div>
  );
};

export default PatientMergeFiles;
