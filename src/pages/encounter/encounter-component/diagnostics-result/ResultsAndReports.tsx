import AdvancedSearchFilters from '@/components/AdvancedSearchFilters';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import MyInput from '@/components/MyInput';
import MyTable from '@/components/MyTable';
import { ColumnConfig } from '@/components/MyTable/MyTable';
import Translate from '@/components/Translate';
import LovValueCell from '@/components/LovValueCell';
import AddReportModal from '@/pages/rad-module/radiologist-worklist/AddReportModal';
import StudyImageViewerModal from '@/pages/rad-module/radiologist-worklist/StudyImageViewrModal';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { useFilterDiagnosticOrdersQuery } from '@/services/diagnosic-order/diagnosticOrderService';
import { useFilterDiagnosticOrderTestsQuery } from '@/services/diagnosic-order/diagnosticOrderTestService';
import { useFilterDiagnosticOrderTestResultsQuery } from '@/services/setup/diagnosticTest/diagnosticOrderTestResultService';
import {
  PacsStudyDTO,
  useFilterRadiologyReportsQuery,
  useLazyGetStudyImageLinkByReportIdQuery
} from '@/services/setup/diagnosticTest/diagnosticOrderTestReportService';
import { useGetDiagnosticTestProfilesByIdsMutation } from '@/services/setup/diagnosticTest/diagnosticTestProfileService';
import { useGetDiagnosticTestsByIdsQuery } from '@/services/setup/diagnosticTest/diagnosticTestService';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { formatDateWithoutSeconds } from '@/utils';
import {
  faArrowDown,
  faArrowUp,
  faCircleExclamation,
  faFileLines,
  faImage,
  faTriangleExclamation
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { skipToken } from '@reduxjs/toolkit/query';
import React, { useEffect, useMemo, useState } from 'react';
import { Form, Tooltip, Whisper } from 'rsuite';

type RowType = 'RESULT' | 'REPORT';

type CombinedRow = {
  key: string;
  type: RowType;
  orderNumber: string | number;
  testName: string;
  date?: string;
  raw: any;
  profile?: any;
};

// both sources are merged client side, so each one is fetched in a single page
const FETCH_SIZE = 500;

const startOfDay = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfDay = (date: Date) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

const isLovProfile = (row: any, profile: any) =>
  (row?.resultTypeAtEntry ?? profile?.resultType)?.toUpperCase()?.trim() === 'LOV';

const renderMarker = (marker?: string) => {
  switch (marker) {
    case 'CRITICAL_UPPER':
    case 'CRITICAL_LOWER':
      return (
        <Whisper placement="top" speaker={<Tooltip>Critical</Tooltip>}>
          <span style={{ color: 'red', display: 'inline-flex', gap: 4 }}>
            <FontAwesomeIcon icon={faTriangleExclamation} />
            <FontAwesomeIcon icon={marker === 'CRITICAL_UPPER' ? faArrowUp : faArrowDown} />
          </span>
        </Whisper>
      );
    case 'ABNORMAL_MARKER':
      return <FontAwesomeIcon icon={faCircleExclamation} />;
    case 'UPPER_LIMIT':
      return <FontAwesomeIcon icon={faArrowUp} />;
    case 'LOWER_LIMIT':
      return <FontAwesomeIcon icon={faArrowDown} />;
    default:
      return null;
  }
};

const getDefaultDateFilter = () => {
  const toDate = new Date();
  const fromDate = new Date(toDate);
  fromDate.setDate(fromDate.getDate() - 3);
  return { fromDate, toDate };
};

const ResultsAndReports = ({ patient }) => {
  const patientId = patient?.id;

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [openReportModal, setOpenReportModal] = useState(false);
  const [openStudiesModal, setOpenStudiesModal] = useState(false);
  const [studies, setStudies] = useState<PacsStudyDTO[]>([]);
  const dispatch = useAppDispatch();
  const [fetchStudyImageLinkByReportId] = useLazyGetStudyImageLinkByReportIdQuery();

  const handleViewImage = async (reportId: number) => {
    try {
      const response = await fetchStudyImageLinkByReportId(reportId).unwrap();

      if (!response?.length) {
        dispatch(notify({ msg: 'No study found for this report', sev: 'warning' }));
        return;
      }

      if (response.length === 1) {
        window.open(response[0].link, '_blank', 'noopener,noreferrer');
        return;
      }

      setStudies(response);
      setOpenStudiesModal(true);
    } catch (e: any) {
      dispatch(
        notify({
          msg: e?.data?.message || e?.data?.detail || 'Failed to load radiology image',
          sev: 'error'
        })
      );
    }
  };
  const [dateFilter, setDateFilter] = useState<any>(getDefaultDateFilter);
  const [appliedDateFilter, setAppliedDateFilter] = useState<any>(dateFilter);

  // Orders are only needed to display the order number; results and reports are filtered by patient directly.
  const { data: ordersResponse } = useFilterDiagnosticOrdersQuery(
    patientId ? ({ patientId, page: 0, size: 1000, sort: 'id,desc' } as any) : skipToken
  );

  const orders = ordersResponse?.data ?? [];
  const orderMap = useMemo(() => new Map(orders.map((o: any) => [String(o.id), o])), [orders]);

  const baseParams = useMemo(() => {
    if (!patientId) return null;

    return {
      patientIdIn: [patientId],
      processingStatus: 'RESULT_APPROVED',
      reviewed: true,
      ...(appliedDateFilter.fromDate
        ? { approvedDateFrom: startOfDay(appliedDateFilter.fromDate).toISOString() }
        : {}),
      ...(appliedDateFilter.toDate
        ? { approvedDateTo: endOfDay(appliedDateFilter.toDate).toISOString() }
        : {})
    };
  }, [patientId, appliedDateFilter]);

  const {
    data: resultsResponse,
    isFetching: isResultsFetching,
    refetch: refetchResults
  } =
    useFilterDiagnosticOrderTestResultsQuery(
      baseParams
        ? ({ ...baseParams, page: 0, size: FETCH_SIZE, sort: 'reviewDate,desc' } as any)
        : skipToken
    );

  const {
    data: reportsResponse,
    isFetching: isReportsFetching,
    refetch: refetchReports
  } = useFilterRadiologyReportsQuery(
    baseParams ? { page: 0, size: FETCH_SIZE, sort: 'id,desc', params: baseParams } : skipToken
  );

  const results = resultsResponse?.data ?? [];
  const reports = Array.isArray(reportsResponse?.data) ? reportsResponse.data : [];

  // order tests for both results and reports -> order number + test name
  const orderTestIds = useMemo(
    () =>
      Array.from(
        new Set([...results, ...reports].map((r: any) => r.orderTestId).filter(Boolean))
      ),
    [results, reports]
  );

  const { data: orderTestsResponse, isFetching: isOrderTestsFetching } =
    useFilterDiagnosticOrderTestsQuery(
      orderTestIds.length ? { orderTestIdIn: orderTestIds, page: 0, size: 1000 } : skipToken
    );

  const orderTestMap = useMemo(
    () => new Map((orderTestsResponse?.data ?? []).map((t: any) => [t.id, t])),
    [orderTestsResponse]
  );

  const testIds = useMemo(
    () =>
      Array.from(
        new Set(
          (orderTestsResponse?.data ?? [])
            .map((t: any) => t.testId)
            .filter((id: any) => id !== null && id !== undefined)
            .map(Number)
        )
      ),
    [orderTestsResponse]
  );

  const { data: diagnosticTests = [], isFetching: isTestsFetching } =
    useGetDiagnosticTestsByIdsQuery({ ids: testIds }, { skip: testIds.length === 0 });

  const testMap = useMemo(
    () => new Map(diagnosticTests.map((test: any) => [test.id, test])),
    [diagnosticTests]
  );

  const profileIds = useMemo(
    () =>
      Array.from(
        new Set(
          results
            .map((r: any) => r.profileTestId)
            .filter((id: any) => id !== null && id !== undefined)
            .map(Number)
        )
      ),
    [results]
  );

  const [fetchProfilesByIds, { data: profilesResponse }] =
    useGetDiagnosticTestProfilesByIdsMutation();

  useEffect(() => {
    if (profileIds.length) fetchProfilesByIds(profileIds);
  }, [profileIds, fetchProfilesByIds]);

  const profilesMap = useMemo(
    () => new Map(profilesResponse?.map((p: any) => [p.id, p]) ?? []),
    [profilesResponse]
  );

  const { data: valueUnitLov } = useGetLovValuesByCodeQuery('VALUE_UNIT');

  const resolveUnit = (row: CombinedRow) => {
    if (!row.profile?.resultUnit || isLovProfile(row.raw, row.profile)) return '';
    return (
      valueUnitLov?.object?.find((u: any) => String(u.key) === String(row.profile.resultUnit))
        ?.lovDisplayVale ?? ''
    );
  };

  const rows: CombinedRow[] = useMemo(() => {
    const toBase = (r: any) => {
      const orderTest: any = orderTestMap.get(r.orderTestId);
      const order: any = orderTest ? orderMap.get(String(orderTest.orderId)) : null;
      const test: any = orderTest ? testMap.get(orderTest.testId) : null;
      return { orderTest, order, test };
    };

    const resultRows: CombinedRow[] = results.map((r: any) => {
      const { orderTest, order, test } = toBase(r);
      const profile = profilesMap.get(r.profileTestId);
      return {
        key: `RESULT-${r.id}`,
        type: 'RESULT',
        orderNumber: order?.orderNumber ?? orderTest?.orderId ?? '',
        testName: profile?.name ?? test?.name ?? '',
        date: r.createdDate,
        raw: r,
        profile
      };
    });

    const reportRows: CombinedRow[] = reports.map((r: any) => {
      const { orderTest, order, test } = toBase(r);
      return {
        key: `REPORT-${r.id}`,
        type: 'REPORT',
        orderNumber: order?.orderNumber ?? orderTest?.orderId ?? '',
        testName: test?.name ?? '',
        date: r.createdDate,
        raw: r
      };
    });

    return [...resultRows, ...reportRows].sort(
      (a, b) => new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime()
    );
  }, [results, reports, orderTestMap, orderMap, testMap, profilesMap]);

  const pagedRows = useMemo(
    () => rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [rows, page, rowsPerPage]
  );

  const renderResult = (row: CombinedRow) => {
    if (row.type === 'REPORT') {
      return (
        <Whisper placement="top" speaker={<Tooltip>View Report</Tooltip>}>
          <span
            style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            onClick={() => {
              setSelectedReport(row.raw);
              setOpenReportModal(true);
            }}
          >
            <FontAwesomeIcon icon={faFileLines} style={{ color: 'var(--primary-blue)' }} />
           
          </span>
        </Whisper>
      );
    }

    const value = row.raw.resultValueNumber ?? row.raw.resultValueText ?? '';
    const valueCell = isLovProfile(row.raw, row.profile) ? (
      <LovValueCell valueKey={value} />
    ) : (
      `${value}${resolveUnit(row) ? ` ${resolveUnit(row)}` : ''}`
    );

    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        {valueCell}
        {renderMarker(row.raw.marker)}
      </span>
    );
  };

  const renderNormalRange = (row: CombinedRow) => {
    if (row.type === 'REPORT') return '-';
    const { normalRangeValue, minValue, maxValue } = row.raw;
    const unit = resolveUnit(row);

    if (normalRangeValue && String(normalRangeValue).trim() !== '') {
      if (isLovProfile(row.raw, row.profile)) {
        return <LovValueCell valueKey={String(normalRangeValue)} />;
      }
      return `${normalRangeValue}${unit ? ` ${unit}` : ''}`;
    }

    if (minValue !== null && minValue !== undefined && maxValue !== null && maxValue !== undefined) {
      return `${minValue} - ${maxValue}${unit ? ` ${unit}` : ''}`;
    }

    return '-';
  };

  const columns: ColumnConfig[] = [
    {
      key: 'type',
      title: <Translate>TYPE</Translate>,
      width: 110,
      render: (row: CombinedRow) =>
        row.type === 'RESULT' ? (
          <MyBadgeStatus contant="Laboratory" color="#45b887" />
        ) : (
          <MyBadgeStatus contant="Radiology" color="#2264e5" />
        )
    },
    {
      key: 'orderNumber',
      title: <Translate>ORDER ID</Translate>,
      render: (row: CombinedRow) => row.orderNumber
    },
    {
      key: 'date',
      title: <Translate>DATE</Translate>,
      render: (row: CombinedRow) => formatDateWithoutSeconds(row.date) || '-'
    },
    {
      key: 'testName',
      title: <Translate>TEST NAME</Translate>,
      render: (row: CombinedRow) => row.testName
    },
    {
      key: 'result',
      title: <Translate>RESULT</Translate>,
      render: renderResult
    },
    {
      key: 'normalRange',
      title: <Translate>NORMAL RANGE</Translate>,
      render: renderNormalRange
    },
    {
      key: 'image',
      title: <Translate>IMAGE</Translate>,
      align: 'center',
      render: (row: CombinedRow) =>
        row.type === 'REPORT' ? (
          <Whisper placement="top" speaker={<Tooltip>View Study Image</Tooltip>}>
            <span>
              <FontAwesomeIcon
                icon={faImage}
                className="icon-radiologist-worklist-size"
                style={{ cursor: 'pointer', color: '#1675e0' }}
                onClick={() => handleViewImage(row.raw.id)}
              />
            </span>
          </Whisper>
        ) : (
          '-'
        )
    }
  ];

  const handleSearch = () => {
    setPage(0);
    if (
      dateFilter.fromDate?.valueOf() === appliedDateFilter.fromDate?.valueOf() &&
      dateFilter.toDate?.valueOf() === appliedDateFilter.toDate?.valueOf()
    ) {
      refetchResults();
      refetchReports();
      return;
    }
    setAppliedDateFilter({ ...dateFilter });
  };

  const handleClearFilters = () => {
    const defaults = getDefaultDateFilter();
    setDateFilter(defaults);
    setAppliedDateFilter(defaults);
    setPage(0);
  };

  const filters = (
    <Form fluid className="filter-form-disable-fix">
      <div className="diagnostics-result-filters-main-container">
        <MyInput
          width={160}
          fieldType="date"
          fieldLabel="From Date"
          fieldName="fromDate"
          record={dateFilter}
          setRecord={setDateFilter}
        />
        <MyInput
          width={160}
          fieldType="date"
          fieldLabel="To Date"
          fieldName="toDate"
          record={dateFilter}
          setRecord={setDateFilter}
        />
        <AdvancedSearchFilters
          showAdvancedButton={false}
          searchOnClick={handleSearch}
          clearOnClick={handleClearFilters}
        />
      </div>
    </Form>
  );

  useEffect(() => {
    setPage(0);
  }, [patientId, appliedDateFilter]);

  if (!patientId) return null;

  return (
    <>
      <MyTable
        filters={filters}
        columns={columns}
        data={pagedRows}
        loading={
          isResultsFetching ||
          isReportsFetching ||
          isOrderTestsFetching ||
          isTestsFetching
        }
        page={page}
        rowsPerPage={rowsPerPage}
        totalCount={rows.length}
        onPageChange={(_, p) => setPage(p)}
        onRowsPerPageChange={e => {
          setRowsPerPage(Number(e.target.value));
          setPage(0);
        }}
      />

      {openReportModal && selectedReport && (
        <AddReportModal
          key={selectedReport.id}
          open={openReportModal}
          setOpen={setOpenReportModal}
          report={selectedReport}
          setReport={setSelectedReport}
          disableEdit
          disableDefaultTemplate
        />
      )}

      <StudyImageViewerModal
        open={openStudiesModal}
        onClose={() => setOpenStudiesModal(false)}
        studies={studies}
      />
    </>
  );
};

export default ResultsAndReports;
