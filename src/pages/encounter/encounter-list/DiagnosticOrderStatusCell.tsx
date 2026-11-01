import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader, Tooltip, Whisper } from 'rsuite';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import { useLazyGetOrdersByEncounterQuery } from '@/services/diagnosic-order/diagnosticOrderService';
import { useLazyGetTestsByOrderIdQuery } from '@/services/diagnosic-order/diagnosticOrderTestService';
import { useLazyGetDiagnosticTestsByIdsQuery } from '@/services/setup/diagnosticTest/diagnosticTestService';
import { formatDateWithoutSeconds, formatEnumString } from '@/utils';

import './DiagnosticOrderStatusCell.less';

const ORDERS_PAGE_SIZE = 50;
const TESTS_PAGE_SIZE = 50;

const formatOrderType = (orderType?: string | null) => {
  const value = String(orderType ?? '').toUpperCase();
  if (value === 'LAB' || value === 'LABORATORY') return 'Laboratory';
  if (value === 'RAD' || value === 'RADIOLOGY') return 'Radiology';
  return formatEnumString(orderType ?? '') || '-';
};

const stopCellEvent = (event: React.SyntheticEvent) => {
  event.stopPropagation();
};

const toTimestamp = (value?: string | null) => {
  if (value == null || value === '') return null;
  const ts = Date.parse(String(value));
  return Number.isNaN(ts) ? null : ts;
};

/**
 * Mirrors backend DiagnosticOrderService.findLatestOrderStatusByEncounterIds:
 * max(createdDate nullsLast, then id nullsLast); ignore orders with null status.
 */
export const selectLatestDiagnosticOrder = <T extends { id?: number | string | null; createdDate?: string | null; status?: string | null }>(
  orders: T[]
): T | null => {
  let latest: T | null = null;

  for (const order of orders) {
    if (order == null || order.status == null || order.status === '') continue;

    if (latest == null) {
      latest = order;
      continue;
    }

    const orderCreated = toTimestamp(order.createdDate);
    const latestCreated = toTimestamp(latest.createdDate);

    if (orderCreated == null && latestCreated != null) {
      continue;
    }
    if (orderCreated != null && latestCreated == null) {
      latest = order;
      continue;
    }
    if (orderCreated != null && latestCreated != null && orderCreated !== latestCreated) {
      if (orderCreated > latestCreated) latest = order;
      continue;
    }

    // createdDate equal (including both null): tie-break by id asc, nulls last
    if (order.id == null && latest.id != null) continue;
    if (order.id != null && latest.id == null) {
      latest = order;
      continue;
    }
    if (order.id == null && latest.id == null) continue;

    try {
      if (BigInt(String(order.id)) > BigInt(String(latest.id))) {
        latest = order;
      }
    } catch {
      if (String(order.id) > String(latest.id)) {
        latest = order;
      }
    }
  }

  return latest;
};

export interface DiagnosticOrderStatusCellProps {
  status?: string | null;
  encounterId?: number | string | null;
}

const DiagnosticOrderStatusCell: React.FC<DiagnosticOrderStatusCellProps> = ({
  status,
  encounterId
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasRequested, setHasRequested] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [order, setOrder] = useState<any | null>(null);
  const [orderTests, setOrderTests] = useState<any[]>([]);
  const [testNameMap, setTestNameMap] = useState<Map<number, string>>(new Map());

  const [fetchOrdersByEncounter] = useLazyGetOrdersByEncounterQuery();
  const [fetchTestsByOrderId] = useLazyGetTestsByOrderIdQuery();
  const [fetchDiagnosticTestsByIds] = useLazyGetDiagnosticTestsByIdsQuery();

  const resolvedEncounterId = useMemo(() => {
    if (encounterId == null || encounterId === '') return null;
    const numeric = Number(encounterId);
    return Number.isFinite(numeric) ? numeric : null;
  }, [encounterId]);

  const loadDetails = useCallback(
    async (preferCache = true) => {
      if (resolvedEncounterId == null) {
        setHasRequested(true);
        setLoadError(true);
        setIsLoadingDetails(false);
        return;
      }

      setHasRequested(true);
      setIsLoadingDetails(true);
      setLoadError(false);

      try {
        const allOrders: any[] = [];
        let page = 0;
        let totalCount = Infinity;

        while (allOrders.length < totalCount) {
          const pageResult = await fetchOrdersByEncounter(
            { encounterId: resolvedEncounterId, page, size: ORDERS_PAGE_SIZE },
            preferCache
          ).unwrap();

          const pageData = pageResult?.data ?? [];
          totalCount = Number(pageResult?.totalCount ?? 0);
          allOrders.push(...pageData);

          if (pageData.length === 0) break;
          page += 1;
        }

        const latestOrder = selectLatestDiagnosticOrder(allOrders);
        if (!latestOrder?.id) {
          setOrder(null);
          setOrderTests([]);
          setTestNameMap(new Map());
          return;
        }

        setOrder(latestOrder);

        const numericOrderId = Number(latestOrder.id);
        if (!Number.isFinite(numericOrderId)) {
          throw new Error('Invalid order id');
        }

        const allTests: any[] = [];
        let testPage = 0;
        let testTotal = Infinity;

        while (allTests.length < testTotal) {
          const pageResult = await fetchTestsByOrderId(
            { orderId: numericOrderId, page: testPage, size: TESTS_PAGE_SIZE },
            preferCache
          ).unwrap();

          const pageData = pageResult?.data ?? [];
          testTotal = Number(pageResult?.totalCount ?? 0);
          allTests.push(...pageData);

          if (pageData.length === 0) break;
          testPage += 1;
        }

        setOrderTests(allTests);

        const testIds = Array.from(
          new Set(
            allTests
              .map((test: any) => test?.testId ?? test?.diagnosticTestId)
              .filter((id: any) => id !== null && id !== undefined)
              .map((id: any) => Number(id))
              .filter((id: number) => Number.isFinite(id))
          )
        );

        if (testIds.length === 0) {
          setTestNameMap(new Map());
          return;
        }

        const diagnosticTests = await fetchDiagnosticTestsByIds(
          { ids: testIds },
          preferCache
        ).unwrap();

        const nextMap = new Map<number, string>();
        (diagnosticTests ?? []).forEach((test: any) => {
          if (test?.id == null) return;
          nextMap.set(Number(test.id), String(test.name ?? '').trim());
        });
        setTestNameMap(nextMap);
      } catch {
        setLoadError(true);
        setOrder(null);
        setOrderTests([]);
        setTestNameMap(new Map());
      } finally {
        setIsLoadingDetails(false);
      }
    },
    [
      resolvedEncounterId,
      fetchOrdersByEncounter,
      fetchTestsByOrderId,
      fetchDiagnosticTestsByIds
    ]
  );

  useEffect(() => {
    if (!isOpen || hasRequested) return;
    loadDetails(true);
  }, [isOpen, hasRequested, loadDetails]);

  useEffect(() => {
    setHasRequested(false);
    setOrder(null);
    setOrderTests([]);
    setTestNameMap(new Map());
    setLoadError(false);
    setIsLoadingDetails(false);
  }, [resolvedEncounterId, status]);

  if (!status) return <span>-</span>;

  const displayStatus = formatEnumString(status) || status;
  const orderNumber =
    order?.orderNumber ?? (order?.id != null ? `#${order.id}` : '-');
  const orderStatusLabel =
    formatEnumString(order?.status ?? status) || order?.status || status || '-';
  const submittedAt = order?.submittedDate
    ? formatDateWithoutSeconds(order.submittedDate)
    : null;
  const showLoading = isLoadingDetails || (isOpen && !hasRequested && !loadError);

  const tooltipContent = (
    <div
      className="diagnostic-order-status-tooltip"
      dir={localStorage.getItem('direction') === 'RTL' ? 'rtl' : 'ltr'}
      onClick={stopCellEvent}
      onMouseDown={stopCellEvent}
      onKeyDown={stopCellEvent}
    >
      {showLoading && (
        <div className="diagnostic-order-status-tooltip__state">
          <Loader size="xs" />
          <span>Loading order details...</span>
        </div>
      )}

      {!showLoading && loadError && (
        <div className="diagnostic-order-status-tooltip__state">
          <span>Failed to load order details.</span>
          <button
            type="button"
            className="diagnostic-order-status-tooltip__retry"
            onClick={event => {
              stopCellEvent(event);
              loadDetails(false);
            }}
          >
            Retry
          </button>
        </div>
      )}

      {!showLoading && !loadError && !order && (
        <div className="diagnostic-order-status-tooltip__empty">
          No matching diagnostic order found.
        </div>
      )}

      {!showLoading && !loadError && order && (
        <>
          <div className="diagnostic-order-status-tooltip__row">
            <span className="diagnostic-order-status-tooltip__label">Order #</span>
            <span>{orderNumber}</span>
          </div>
          <div className="diagnostic-order-status-tooltip__row">
            <span className="diagnostic-order-status-tooltip__label">Status</span>
            <span>{orderStatusLabel}</span>
          </div>
          {submittedAt ? (
            <div className="diagnostic-order-status-tooltip__row">
              <span className="diagnostic-order-status-tooltip__label">Submitted</span>
              <span>{submittedAt}</span>
            </div>
          ) : null}

          <div className="diagnostic-order-status-tooltip__tests-title">Tests</div>
          {orderTests.length === 0 ? (
            <div className="diagnostic-order-status-tooltip__empty">No tests in this order.</div>
          ) : (
            <div className="diagnostic-order-status-tooltip__tests">
              {orderTests.map((test: any, index: number) => {
                const testId = Number(test?.testId ?? test?.diagnosticTestId);
                const testName =
                  (Number.isFinite(testId) ? testNameMap.get(testId) : undefined) ||
                  test?.testName ||
                  test?.diagnosticTestName ||
                  test?.name ||
                  '-';
                const processingLabel =
                  formatEnumString(test?.processingStatus ?? test?.status) ||
                  test?.processingStatus ||
                  test?.status ||
                  '-';

                return (
                  <div
                    key={test?.id ?? `${testId}-${index}`}
                    className="diagnostic-order-status-tooltip__test"
                  >
                    <div className="diagnostic-order-status-tooltip__test-name">{testName}</div>
                    <div className="diagnostic-order-status-tooltip__test-meta">
                      <span>{formatOrderType(test?.orderType)}</span>
                      <span aria-hidden="true">·</span>
                      <span>{processingLabel}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );

  return (
    <Whisper
      trigger={['hover', 'focus']}
      placement="autoVerticalStart"
      enterable
      delayOpen={150}
      delayClose={150}
      onOpen={() => setIsOpen(true)}
      onClose={() => setIsOpen(false)}
      speaker={<Tooltip className="diagnostic-order-status-tooltip-speaker">{tooltipContent}</Tooltip>}
    >
      <span
        className="diagnostic-order-status-cell"
        tabIndex={0}
        role="button"
        aria-label={`Diagnostic order status ${displayStatus}`}
        onClick={stopCellEvent}
        onMouseDown={stopCellEvent}
        onKeyDown={event => {
          if (event.key === 'Enter' || event.key === ' ') {
            stopCellEvent(event);
          }
        }}
      >
        <MyBadgeStatus color="#969fb0" contant={displayStatus} />
      </span>
    </Whisper>
  );
};

export default DiagnosticOrderStatusCell;
