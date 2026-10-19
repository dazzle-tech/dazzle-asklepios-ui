import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, SelectPicker, Tooltip, Whisper } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBed,
  faChevronLeft,
  faChevronRight
} from '@fortawesome/free-solid-svg-icons';
import { useDispatch } from 'react-redux';

import MyModal from '@/components/MyModal/MyModal';
import MyButton from '@/components/MyButton/MyButton';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import MyInput from '@/components/MyInput';
import MyTable from '@/components/MyTable';
import type { ColumnConfig } from '@/components/MyTable/MyTable';
import Translate from '@/components/Translate';
import {
  useGetRegistrationPendingItemChangesQuery,
  useSearchRegistrationPendingItemsQuery
} from '@/services/billing/billingTransactionService';
import type {
  RegistrationPendingPaymentEncounter,
  RegistrationPendingPaymentItem
} from '@/services/billing/billingTransactionService';
import { formatMoney } from '@/pages/billing-module/accounting/utils/billingAccountingUtils';
import { notify } from '@/utils/uiReducerActions';

import './styles.less';

interface RegistrationPendingPaymentModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  facilityId?: number | null;
}

const EMPTY_ENCOUNTERS: RegistrationPendingPaymentEncounter[] = [];
const POLL_INTERVAL_MS = 20000;
const PATIENT_NAME_DEBOUNCE_MS = 300;

const statusColor = (status?: string) => {
  switch (status) {
    case 'AWAITING_FINANCIAL_CALCULATION':
      return '#d97706';
    case 'PARTIALLY_PAID':
      return '#2563eb';
    case 'SKIPPED_PENDING_PRE_AUTH':
    case 'INSURANCE_PENDING':
      return '#7c3aed';
    default:
      return '#ea580c';
  }
};

const statusLabel = (status?: string) => {
  if (!status) return '—';
  if (status === 'AWAITING_FINANCIAL_CALCULATION') {
    return 'Awaiting financial calculation';
  }
  return status.replaceAll('_', ' ');
};

const formatAmount = (
  item: RegistrationPendingPaymentItem,
  field:
    | 'patientShareAmount'
    | 'insuranceShareAmount'
    | 'patientRemainingAmount'
) => {
  if (!item?.amountsAvailable || item?.[field] == null) {
    return '—';
  }

  return formatMoney(item[field], item.currency ?? 'SAR');
};

const isEncounterCollectible = (
  encounter: RegistrationPendingPaymentEncounter
) => (encounter.items ?? []).some(item => item.collectible);

const SERVICE_COLUMNS: ColumnConfig[] = [
  {
    key: 'itemName',
    title: 'Service / Investigation',
    width: 320,
  render: (row: RegistrationPendingPaymentItem) => {
    console.log('Service row:', row);
    return row.itemName || '—';
  }
  },
  {
    key: 'patientShareAmount',
    title: 'Patient Co-payment',
    width: 150,
    render: (row: RegistrationPendingPaymentItem) => (
      <MyBadgeStatus
        color="#2563eb"
        contant={formatAmount(row, 'patientShareAmount')}
      />
    )
  },
  {
    key: 'insuranceShareAmount',
    title: 'Insurance Share',
    width: 150,
    render: (row: RegistrationPendingPaymentItem) => (
      <MyBadgeStatus
        color="#7c3aed"
        contant={formatAmount(row, 'insuranceShareAmount')}
      />
    )
  },
  {
    key: 'patientRemainingAmount',
    title: 'Patient Remaining Amount',
    width: 170,
    render: (row: RegistrationPendingPaymentItem) => (
      <MyBadgeStatus
        color="#45b887"
        contant={formatAmount(row, 'patientRemainingAmount')}
      />
    )
  },
  {
    key: 'paymentStatus',
    title: 'Payment Status',
    width: 180,
    render: (row: RegistrationPendingPaymentItem) => {
      const status = row.displayPaymentStatus || row.paymentStatus;

      return (
        <MyBadgeStatus
          color={statusColor(status)}
          contant={statusLabel(status)}
        />
      );
    }
  }
];

const RegistrationPendingPaymentModal: React.FC<
  RegistrationPendingPaymentModalProps
> = ({ open, setOpen, facilityId }) => {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(15);
  const [filterRecord, setFilterRecord] = useState({ patientName: '' });
  const [debouncedPatientName, setDebouncedPatientName] = useState('');
  const [listPollingInterval, setListPollingInterval] = useState(0);

  useEffect(() => {
    setPage(0);
    setFilterRecord({ patientName: '' });
    setDebouncedPatientName('');
  }, [open, facilityId]);

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedPatientName(filterRecord.patientName.trim());
    }, PATIENT_NAME_DEBOUNCE_MS);

    return () => clearTimeout(handle);
  }, [filterRecord.patientName]);

  useEffect(() => {
    setPage(0);
  }, [debouncedPatientName]);

  useEffect(() => {
    if (!open) {
      setListPollingInterval(0);
      return;
    }

    const syncVisibility = () => {
      setListPollingInterval(document.hidden ? 0 : POLL_INTERVAL_MS);
    };

    syncVisibility();
    document.addEventListener('visibilitychange', syncVisibility);

    return () => {
      document.removeEventListener('visibilitychange', syncVisibility);
    };
  }, [open]);

  const {
    currentData: pendingItemsData,
    isLoading,
    isFetching,
    isError,
    refetch
  } = useSearchRegistrationPendingItemsQuery(
    {
      facilityId: Number(facilityId),
      patientName: debouncedPatientName || undefined,
      page,
      size,
      sort: 'id,desc'
    },
    {
      skip: !open || !facilityId,
      pollingInterval: listPollingInterval,
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
      refetchOnReconnect: true
    }
  );

  const encounters = pendingItemsData?.data ?? EMPTY_ENCOUNTERS;
  const totalCount = Number(pendingItemsData?.totalCount ?? 0);
  const pageCount = Math.max(1, Math.ceil(totalCount / size));
  const direction =
    localStorage.getItem('direction') === 'RTL' ? 'rtl' : 'ltr';

  useEffect(() => {
    if (pendingItemsData && page > 0 && page >= pageCount) {
      setPage(pageCount - 1);
    }
  }, [pendingItemsData, page, pageCount]);

  const handleOpenAccounting = (
    encounter: RegistrationPendingPaymentEncounter
  ) => {
    if (
      !isEncounterCollectible(encounter) ||
      !encounter?.patient ||
      encounter?.encounterId == null
    ) {
      return;
    }

    setOpen(false);

    navigate('/billing-accounting', {
      state: {
        fromPage: 'RegistrationPendingPayment',
        patient: encounter.patient,
        encounterId: Number(encounter.encounterId)
      }
    });
  };

  const content = (
    <div className="registration-pending-payment" dir={direction}>
      <div className="registration-pending-payment-toolbar">
        <div className="registration-pending-payment-toolbar__summary">
          <span className="registration-pending-payment-toolbar__icon">
            <FontAwesomeIcon icon={faBed} />
          </span>

          <div>
            <div className="registration-pending-payment-toolbar__title">
              <Translate>Pending Payments</Translate>
            </div>

            <div className="registration-pending-payment-toolbar__subtitle">
              <Translate>
                Encounters with services or investigations awaiting payment
              </Translate>
            </div>
          </div>

          <MyBadgeStatus
            color="#45b887"
            contant={String(totalCount)}
          />
        </div>

        <div className="registration-pending-payment-toolbar__actions">
          <div className="registration-pending-payment-toolbar__filters">
          <Form>
            <MyInput
              column
              fieldType="text"
              fieldName="patientName"
              fieldLabel="Patient Name"
              placeholder="Search Patient"
              record={filterRecord}
              setRecord={setFilterRecord}
              width="100%"
            />
          </Form>
          </div>

          <MyButton
            onClick={() => refetch()}
            disabled={isFetching || !facilityId}
          >
            <Translate>{isFetching ? 'Refreshing...' : 'Refresh'}</Translate>
          </MyButton>
        </div>
      </div>

      {isError && facilityId ? (
        <div className="registration-pending-payment-message" role="alert">
          <Translate>Unable to load pending payment items</Translate>
        </div>
      ) : null}

      <div
        className="registration-pending-payment-body"
        aria-busy={isLoading || isFetching}
      >
        {!facilityId ? (
          <div className="registration-pending-payment-empty">
            <FontAwesomeIcon icon={faBed} />
            <Translate>Select a facility to view pending encounters</Translate>
          </div>
        ) : !pendingItemsData && (isLoading || isFetching) ? (
          <div className="registration-pending-payment-empty" role="status">
            <Translate>Loading pending payments...</Translate>
          </div>
        ) : encounters.length === 0 && !isError ? (
          <div className="registration-pending-payment-empty">
            <span className="registration-pending-payment-empty__icon">
              <FontAwesomeIcon icon={faBed} />
            </span>
            <strong>
              <Translate>No pending payments</Translate>
            </strong>
            <span>
              <Translate>New pending services will appear here</Translate>
            </span>
          </div>
        ) : (
          <div className="registration-pending-payment-cards">
            {encounters.map(encounter => {
              const items = encounter.items ?? [];
              if (items.length === 0) return null;

              const collectible = isEncounterCollectible(encounter);
              const pendingCount = items.length;

              return (
                <article
                  className="registration-pending-payment-card"
                  key={encounter.encounterId}
                >
                  <div className="registration-pending-payment-card__header">
                    <div className="registration-pending-payment-card__header-main">
                      <h4 className="registration-pending-payment-card__patient">
                        {encounter.patientName || '—'}
                      </h4>

                      <div className="registration-pending-payment-card__metadata">
                        <div>
                          <span className="registration-pending-payment-card__label">
                            <Translate>Encounter Number</Translate>
                          </span>
                          <strong>{encounter.encounterNumber || '—'}</strong>
                        </div>

                        <div>
                          <span className="registration-pending-payment-card__label">
                            <FontAwesomeIcon icon={faBed} />
                            <Translate>Bed</Translate>
                          </span>
                          <strong>{encounter.bedName || '—'}</strong>
                        </div>
                      </div>
                    </div>

                    <span
                      className="registration-pending-payment-card__count"
                      title={`${pendingCount} pending services`}
                      aria-label={`${pendingCount} pending services`}
                    >
                      <MyBadgeStatus
                        color="#45b887"
                        contant={String(pendingCount)}
                      />
                    </span>
                  </div>

                  <div className="registration-pending-payment-card__services">
                    <MyTable
                      data={items}
                      columns={SERVICE_COLUMNS}
                      height={280}
                      loading={false}
                      dontTranslateData
                    />
                  </div>

                  <div className="registration-pending-payment-card__footer">
                    {!collectible ? (
                      <span className="registration-pending-payment-card__note">
                        <Translate>
                          Payment is available when financial processing is complete
                        </Translate>
                      </span>
                    ) : null}

                    <MyButton
                      disabled={
                        !collectible ||
                        !encounter.patient ||
                        encounter.encounterId == null
                      }
                      onClick={() => handleOpenAccounting(encounter)}
                    >
                      <Translate>Open Accounting</Translate>
                    </MyButton>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {facilityId && totalCount > 0 ? (
        <div className="registration-pending-payment-pagination">
      <div className="registration-pending-payment-pagination__size">
        <span>
          <Translate>Encounters per page</Translate>
        </span>

        <SelectPicker
          data={[9, 15, 30, 45].map(value => ({
            label: String(value),
            value
          }))}
          value={size}
          disabled={isFetching}
          cleanable={false}
          searchable={false}
          placement="topStart"
          menuStyle={{ zIndex: 2000 }}
          style={{ width: 90 }}
          aria-label="Encounters per page"
          onChange={value => {
            if (value == null) return;
            setSize(value);
            setPage(0);
          }}
        />
      </div>

      <div className="registration-pending-payment-pagination__navigation">
        <Whisper
          trigger="hover"
          placement="top"
          speaker={<Tooltip>Previous page</Tooltip>}
        >
          <div>
            <MyButton
              disabled={page === 0 || isFetching}
              onClick={() => setPage(value => Math.max(0, value - 1))}
            >
              <FontAwesomeIcon
                icon={direction === 'rtl' ? faChevronRight : faChevronLeft}
              />
            </MyButton>
          </div>
        </Whisper>

        <span aria-live="polite">
          {page + 1} / {pageCount}
        </span>

        <Whisper
          trigger="hover"
          placement="top"
          speaker={<Tooltip>Next page</Tooltip>}
        >
          <div>
            <MyButton
              disabled={page >= pageCount - 1 || isFetching}
              onClick={() =>
                setPage(value => Math.min(pageCount - 1, value + 1))
              }
            >
              <FontAwesomeIcon
                icon={direction === 'rtl' ? faChevronLeft : faChevronRight}
              />
            </MyButton>
          </div>
        </Whisper>
      </div>
      
        </div>
      ) : null}
    </div>
  );

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Notification and Payment Tracking"
      size="90vw"
      bodyheight="85vh"
      content={content}
      hideActionBtn={true}
      cancelButtonLabel="Close"
    />
  );
};

export const RegistrationPendingPaymentFab: React.FC<{
  facilityId?: number | null;
  onClick: () => void;
}> = ({ facilityId, onClick }) => {
  const dispatch = useDispatch();
  const [pollingInterval, setPollingInterval] = useState(POLL_INTERVAL_MS);
  const [cursor, setCursor] = useState({
    facilityId,
    afterId: 0
  });

  const baselineReadyRef = useRef(false);
  const notifiedIdsRef = useRef<Set<number>>(new Set());
  const facilityRef = useRef(facilityId);

  const afterId = cursor.facilityId === facilityId ? cursor.afterId : 0;

  useEffect(() => {
    const syncVisibility = () => {
      setPollingInterval(document.hidden ? 0 : POLL_INTERVAL_MS);
    };

    syncVisibility();
    document.addEventListener('visibilitychange', syncVisibility);

    return () => {
      document.removeEventListener('visibilitychange', syncVisibility);
    };
  }, []);

  useEffect(() => {
    facilityRef.current = facilityId;
    baselineReadyRef.current = false;
    notifiedIdsRef.current = new Set();
  }, [facilityId]);

  const skip = !facilityId;

  const { currentData: changes } = useGetRegistrationPendingItemChangesQuery(
    {
      facilityId: Number(facilityId),
      afterId
    },
    {
      skip,
      pollingInterval: skip ? 0 : pollingInterval,
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
      refetchOnReconnect: true
    }
  );

  useEffect(() => {
    if (!changes || skip || facilityRef.current !== facilityId) return;

    const latestId = Number(changes.latestId ?? 0);
    const newIds: number[] = Array.isArray(changes.newItemIds)
      ? changes.newItemIds
          .map(Number)
          .filter((id: number) => Number.isFinite(id) && id > 0)
      : [];

    if (!baselineReadyRef.current) {
      baselineReadyRef.current = true;
      notifiedIdsRef.current = new Set(newIds);

      if (latestId > afterId) {
        setCursor({ facilityId, afterId: latestId });
      }
      return;
    }

    const unseen = newIds.filter(id => !notifiedIdsRef.current.has(id));

    if (unseen.length > 0) {
      unseen.forEach(id => notifiedIdsRef.current.add(id));

      dispatch(
        notify({
          sev: 'info',
          msg:
            unseen.length === 1
              ? 'A new service or investigation is pending payment'
              : `${unseen.length} new services or investigations are pending payment`,
          life: 4000
        })
      );
    }

    if (latestId > afterId) {
      setCursor({ facilityId, afterId: latestId });
    }
  }, [changes, dispatch, skip, afterId, facilityId]);

  const pendingCount = skip ? 0 : Number(changes?.totalCount ?? 0);
  const label = 'Notification and Payment Tracking';
  const badgeText =
    pendingCount > 99 ? '99+' : pendingCount > 0 ? String(pendingCount) : null;

  return (
    <Whisper
      placement="top"
      trigger="hover"
      speaker={
        <Tooltip>
          <Translate>{label}</Translate>
        </Tooltip>
      }
    >
      <button
        type="button"
        className="registration-pending-payment-fab"
        onClick={onClick}
        disabled={!facilityId}
        aria-label={label}
      >
        <FontAwesomeIcon icon={faBed} size="2x" aria-hidden="true" />
        {badgeText ? (
          <span className="registration-pending-payment-fab__badge">
            {badgeText}
          </span>
        ) : null}
      </button>
    </Whisper>
  );
};

export default RegistrationPendingPaymentModal;