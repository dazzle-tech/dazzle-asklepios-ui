import React, { useMemo, useState } from 'react';
import { Loader } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCloudArrowUp,
  faPaperPlane,
  faRotate,
  faShieldHalved
} from '@fortawesome/free-solid-svg-icons';

import MyButton from '@/components/MyButton/MyButton';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import {
  useGetClaimByInvoiceQuery,
  useRefreshClaimStatusMutation,
  useRefreshClaimUploadSummaryMutation,
  useSubmitClaimForInvoiceMutation
} from '@/services/waseel-integration/claimService';
import type { PatientFinancialInvoice } from '@/services/billing/invoiceGenerationService';
import type { WaseelClaimUploadResponse } from '@/types/model-types-new';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import ClaimUploadSummaryModal from '@/pages/billing-module/billingClaims/ClaimUploadSummaryModal';
import ClaimErrorsPanel from '@/pages/billing-module/billingClaims/ClaimErrorsPanel';
import { getStatusColor } from '@/pages/billing-module/billingClaims/utils';

type InvoiceWaseelClaimSectionProps = {
  invoice: PatientFinancialInvoice;
};

const InvoiceWaseelClaimSection: React.FC<InvoiceWaseelClaimSectionProps> = ({ invoice }) => {
  const dispatch = useAppDispatch();
  const [uploadSummary, setUploadSummary] = useState<WaseelClaimUploadResponse | null>(null);
  const [openUploadSummary, setOpenUploadSummary] = useState(false);

  const {
    data: claim,
    isFetching: loadingClaim,
    refetch: refetchClaim
  } = useGetClaimByInvoiceQuery(invoice.id, {
    skip: invoice.id == null
  });

  const [submitClaim, { isLoading: submitting }] = useSubmitClaimForInvoiceMutation();
  const [refreshUploadSummary, { isLoading: refreshingSummary }] =
    useRefreshClaimUploadSummaryMutation();
  const [refreshClaimStatus, { isLoading: refreshingStatus }] = useRefreshClaimStatusMutation();

  const claimStatus = String(claim?.status ?? '').toUpperCase();
  const canSubmit =
    !claim ||
    claim.canResubmit === true ||
    ['FAILED', 'DRAFT', 'REJECTED'].includes(claimStatus);

  const canRefreshSummary = !!claim?.uploadId && claim.canRefreshUpload !== false;

  const statusLabel = useMemo(() => {
    if (!claim) return 'Not submitted';
    return claim.status ?? 'Unknown';
  }, [claim]);

  const handleSubmit = async () => {
    try {
      const result = await submitClaim(invoice.id).unwrap();
      dispatch(
        notify({
          msg:
            String(result.status ?? '').toUpperCase() === 'FAILED'
              ? result.message || 'Claim submission failed'
              : `Claim submitted to Waseel${result.uploadId ? ` (upload #${result.uploadId})` : ''}`,
          sev: String(result.status ?? '').toUpperCase() === 'FAILED' ? 'error' : 'success'
        })
      );
      refetchClaim();
    } catch (error: any) {
      dispatch(
        notify({
          msg: error?.data?.detail || error?.data?.message || 'Failed to submit claim to Waseel',
          sev: 'error'
        })
      );
    }
  };

  const handleRefreshSummary = async () => {
    if (!claim?.uploadId) return;

    try {
      const summary = await refreshUploadSummary(claim.uploadId).unwrap();
      setUploadSummary(summary);
      setOpenUploadSummary(true);
      if (claim.id) {
        await refreshClaimStatus(claim.id).unwrap();
      } else {
        refetchClaim();
      }
    } catch (error: any) {
      dispatch(
        notify({
          msg: error?.data?.detail || error?.data?.message || 'Failed to load upload summary',
          sev: 'error'
        })
      );
    }
  };

  const handleRefreshStatus = async () => {
    if (!claim?.id) {
      refetchClaim();
      return;
    }

    try {
      await refreshClaimStatus(claim.id).unwrap();
      refetchClaim();
      dispatch(notify({ msg: 'Claim status refreshed from Waseel', sev: 'success' }));
    } catch (error: any) {
      dispatch(
        notify({
          msg: error?.data?.detail || error?.data?.message || 'Failed to refresh claim status',
          sev: 'error'
        })
      );
    }
  };

  return (
    <>
      <div className="invoice-detail__waseel-claim">
        <div className="invoice-detail__waseel-claim-head">
          <div className="invoice-detail__waseel-claim-icon">
            <FontAwesomeIcon icon={faShieldHalved} />
          </div>
          <div className="invoice-detail__waseel-claim-copy">
            <span className="invoice-detail__waseel-claim-eyebrow">Waseel integration</span>
            <h3 className="invoice-detail__waseel-claim-title">Insurance claim submission</h3>
            <p className="invoice-detail__waseel-claim-text">
              Insurance claims are submitted manually from the Claims screen after invoice generation.
              Select one or more finalized insurance invoices for the same payor and period, then
              submit them as one Waseel upload.
            </p>
          </div>
          <div className="invoice-detail__waseel-claim-status">
            {loadingClaim ? (
              <Loader size="xs" content="Loading…" />
            ) : (
              <MyBadgeStatus contant={statusLabel} color={getStatusColor(claim?.status)} />
            )}
          </div>
        </div>

        <div className="invoice-detail__waseel-claim-grid">
          <div className="invoice-detail__waseel-claim-field">
            <span>Local claim reference</span>
            <strong>{invoice.claimReference ?? '-'}</strong>
          </div>
          <div className="invoice-detail__waseel-claim-field">
            <span>Upload name</span>
            <strong>{claim?.uploadName ?? '-'}</strong>
          </div>
          <div className="invoice-detail__waseel-claim-field">
            <span>Waseel upload ID</span>
            <strong>{claim?.uploadId ?? '-'}</strong>
          </div>
          <div className="invoice-detail__waseel-claim-field">
            <span>Pre-auth ref</span>
            <strong>{claim?.preAuthRefNo ?? '-'}</strong>
          </div>
          <div className="invoice-detail__waseel-claim-field">
            <span>Outcome</span>
            <strong>{claim?.outcome ?? '-'}</strong>
          </div>
          <div className="invoice-detail__waseel-claim-field invoice-detail__waseel-claim-field--wide">
            <span>Status description</span>
            <strong>{claim?.statusDescription ?? claim?.message ?? 'No Waseel response yet.'}</strong>
          </div>
        </div>

        <div className="invoice-detail__waseel-claim-errors">
          <ClaimErrorsPanel
            errors={claim?.validationErrors}
            status={claim?.status}
            outcome={claim?.outcome}
            statusDescription={claim?.statusDescription ?? claim?.message}
          />
        </div>

        <div className="invoice-detail__waseel-claim-actions">
          <MyButton
            appearance="primary"
            loading={submitting}
            disabled={!canSubmit || submitting}
            onClick={handleSubmit}
          >
            <FontAwesomeIcon icon={faPaperPlane} />{' '}
            {claim ? 'Resubmit to Waseel' : 'Submit to Waseel'}
          </MyButton>

          <MyButton
            appearance="ghost"
            loading={refreshingSummary}
            disabled={!canRefreshSummary || refreshingSummary}
            onClick={handleRefreshSummary}
          >
            <FontAwesomeIcon icon={faRotate} /> Upload summary
          </MyButton>

          <MyButton appearance="subtle" onClick={handleRefreshStatus} disabled={loadingClaim || refreshingStatus}>
            <FontAwesomeIcon icon={faCloudArrowUp} /> Refresh status
          </MyButton>
        </div>
      </div>

      <ClaimUploadSummaryModal
        open={openUploadSummary}
        summary={uploadSummary}
        onClose={() => {
          setOpenUploadSummary(false);
          setUploadSummary(null);
        }}
      />
    </>
  );
};

export default InvoiceWaseelClaimSection;
