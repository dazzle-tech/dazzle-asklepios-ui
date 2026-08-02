import ChatModal from '@/components/ChatModal';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { formatDateWithoutSeconds, formatEnumString } from '@/utils';
import {
  faArrowDown,
  faArrowUp,
  faCircleExclamation,
  faComment,
  faPrint,
  faTriangleExclamation
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { skipToken } from '@reduxjs/toolkit/query';
import React, { forwardRef, useEffect, useMemo, useState } from 'react';
import { Checkbox, Form, HStack, Message, Panel, Tooltip, useToaster, Whisper } from 'rsuite';

import {
  useFilterDiagnosticOrderTestResultsQuery
} from '@/services/setup/diagnosticTest/diagnosticOrderTestResultService';

import {
  useGetNotesByResultIdQuery
} from '@/services/diagnosic-order/diagnosticOrderTestResultTechnicianNoteService';

import {
  useFilterDiagnosticOrderTestsQuery
} from '@/services/diagnosic-order/diagnosticOrderTestService';

import {
  useFilterDiagnosticOrdersQuery
} from '@/services/diagnosic-order/diagnosticOrderService';

import { useGetAllDiagnosticTestProfilesQuery } from '@/services/setup/diagnosticTest/diagnosticTestProfileService';
import { useGetAllDiagnosticTestsQuery } from '@/services/setup/diagnosticTest/diagnosticTestService';
import {
  useGenerateLabResultsPdfMutation
} from '@/services/setup/resultReportApi';
import {
  useGetLovAllValuesQuery,
  useGetLovsQuery,
  useGetLovValuesByCodeQuery
} from '@/services/setupService';
import {
  initialListRequest,
  initialListRequestAllValues
} from '@/types/types';
import LaboratoryReportButton from './LaboratoryReportButton';

type Props = {
  patient: any;
};

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

const renderMarker = (marker?: string) => {
  const isCritical =
    marker === 'CRITICAL_UPPER' || marker === 'CRITICAL_LOWER';

  if (isCritical) {
    return (
      <Whisper
        placement="top"
        speaker={<Tooltip>Critical</Tooltip>}
      >
        <span
          style={{
            color: 'red',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          <FontAwesomeIcon icon={faTriangleExclamation} />
          <FontAwesomeIcon
            icon={marker === 'CRITICAL_UPPER' ? faArrowUp : faArrowDown}
          />
        </span>
      </Whisper>
    );
  }

  switch (marker) {
    case 'ABNORMAL_MARKER':
      return <FontAwesomeIcon icon={faCircleExclamation} />;
    case 'UPPER_LIMIT':
      return <FontAwesomeIcon icon={faArrowUp} />;
    case 'LOWER_LIMIT':
      return <FontAwesomeIcon icon={faArrowDown} />;
    default:
      return formatEnumString(marker);
  }
};

const ReviewedResults = forwardRef<any, Props>(({ patient }, ref) => {
  const patientId = patient?.id;

  const [pageIndex, setPageIndex] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedResultId, setSelectedResultId] = useState<number | null>(null);
  const [selectedResult, setSelectedResult] = useState<any>(null);
  const [showAbnormal, setShowAbnormal] = useState(false);
  const [dateFilter, setDateFilter] = useState<any>({
    fromDate: null,
    toDate: null
  });
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [openNotesModal, setOpenNotesModal] = useState(false);


  const ordersQueryParams = useMemo(() => {
    if (!patientId) return skipToken;

    return {
      patientId,
      page: 0,
      size: 1000,
      sort: 'id,desc'
    };
  }, [patientId]);

  const {
    data: ordersResponse,
    isFetching: isOrdersFetching
  } = useFilterDiagnosticOrdersQuery(ordersQueryParams);

  const orders = ordersResponse?.data ?? [];

  const orderIds = useMemo(
    () => orders.map((o: any) => o.id).filter(Boolean),
    [orders]
  );
  const queryParams = useMemo(() => {
    if (!patientId) return skipToken;

    if (isOrdersFetching) return skipToken;

    if (!orderIds.length) return skipToken;

    const params: any = {
      orderIdIn: orderIds,
      page: pageIndex,
      size: rowsPerPage,
      processingStatus: 'RESULT_APPROVED',
      sort: 'reviewDate,desc',
      reviewed: true
    };

    if (showAbnormal) {
      params.markerIn = [
        'UPPER_LIMIT',
        'LOWER_LIMIT',
        'ABNORMAL_MARKER',
        'CRITICAL_UPPER',
        'CRITICAL_LOWER'
      ];
    }

    if (dateFilter.fromDate) {
      params.approvedDateFrom = startOfDay(dateFilter.fromDate).toISOString();
    }

    if (dateFilter.toDate) {
      params.approvedDateTo = endOfDay(dateFilter.toDate).toISOString();
    }

    return params;
  }, [
    patientId,
    orderIds,
    pageIndex,
    rowsPerPage,
    showAbnormal,
    dateFilter,
    isOrdersFetching
  ]);

  const {
    data: response,
    isFetching: isResultsFetching
  } = useFilterDiagnosticOrderTestResultsQuery(queryParams);

  const { data: notesResponse } = useGetNotesByResultIdQuery(
    openNotesModal && selectedResultId ? selectedResultId : skipToken
  );

  const results = response?.data ?? [];
  const totalCount = response?.totalCount ?? 0;

  const { data: profilesResponse } = useGetAllDiagnosticTestProfilesQuery({
    page: 0,
    size: 10000
  });

  const profilesMap = useMemo(
    () => new Map(profilesResponse?.data?.map((p: any) => [p.id, p]) ?? []),
    [profilesResponse]
  );

  const { data: valueUnitLov } = useGetLovValuesByCodeQuery('VALUE_UNIT');

  const { data: allLovValues } =
    useGetLovAllValuesQuery({ ...initialListRequestAllValues });

  const { data: lovDefinitions } =
    useGetLovsQuery({ ...initialListRequest, pageSize: 1000 });

  const resolveLovDisplayValue = (lovId: any, key: any) => {
    const fallback = "—";


    if (!lovId || key == null || !lovDefinitions?.object || !allLovValues?.object) {
      return key;
    }

    const lovDef = lovDefinitions.object.find(
      (d: any) => String(d.key) === String(lovId)
    );

    if (!lovDef?.lovCode) return key;

    return (
      allLovValues.object.find(
        (v: any) =>
          String(v.lovCode) === String(lovDef.lovCode) &&
          String(v.key) === String(key)
      )?.lovDisplayVale ?? fallback
    );
  };

  const orderTestIds = useMemo(
    () => results.map((r: any) => r.orderTestId).filter(Boolean),
    [results]
  );

  const {
    data: orderTestsResponse,
    isFetching: isOrderTestsFetching
  } = useFilterDiagnosticOrderTestsQuery(
    patientId && orderTestIds.length
      ? { orderTestIdIn: orderTestIds, page: 0, size: 1000 }
      : skipToken
  );

  const orderTests = orderTestsResponse?.data ?? [];

  const orderTestMap = useMemo(
    () => new Map(orderTests.map((t: any) => [t.id, t])),
    [orderTests]
  );

  const {
    data: allTestsResponse,
    isFetching: isAllTestsFetching
  } = useGetAllDiagnosticTestsQuery(
    patientId ? { page: 0, size: 10000 } : skipToken
  );

  const allTests = allTestsResponse?.data ?? [];

  const testMap = useMemo(
    () => new Map(allTests.map((t: any) => [t.id, t])),
    [allTests]
  );



  const orderMap = useMemo(
    () => new Map(orders.map((o: any) => [o.id, o])),
    [orders]
  );

  const normalizedResults = useMemo(() => {
    return results.map((r: any) => {
      const orderTest = orderTestMap.get(r.orderTestId);
      const order = orderTest
        ? orderMap.get(String(orderTest.orderId))
        : null;
      const test = orderTest ? testMap.get(orderTest.testId) : null;
      const profile = profilesMap.get(r.profileTestId);
      const isLovTest = profile?.resultType?.toUpperCase() === 'LOV';

      let value = '';
      let unit = '';
      let normalRangeValue = ' ';

      if (isLovTest) {
        value = resolveLovDisplayValue(profile?.listOfValueId, r.resultValueText);

        normalRangeValue = resolveLovDisplayValue(
          profile?.listOfValueId,
          r.viewNormalRange
        );
      } else {
        value =
          r.resultValueNumber !== null && r.resultValueNumber !== undefined
            ? String(r.resultValueNumber)
            : '';

        unit =
          valueUnitLov?.object?.find(
            (u: any) => String(u.key) === String(test?.defaultProfileResultUnit)
          )?.lovDisplayVale ?? '';

        normalRangeValue = r.viewNormalRange ?? ' ';
      }
      console.log("Order ", order)
      return {
        ...r,
        orderId: orderTest?.orderId ?? '',
        orderNumber: order?.orderNumber ?? '',
        testName: profile?.name ?? ' ',
        resultValue: value,
        unit,
        normalRange: normalRangeValue
      };
    });
  }, [
    results,
    orderTestMap,
    orderMap,
    testMap,
    profilesMap,
    valueUnitLov,
    lovDefinitions,
    allLovValues
  ]);

  const allSelected =
    normalizedResults.length > 0 &&
    normalizedResults.every(row => selectedRows.includes(row.id));

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(normalizedResults.map(row => row.id));
    } else {
      setSelectedRows([]);
    }
  };

  const handleSelectRow = (rowId: number, checked: boolean) => {
    if (checked) {
      setSelectedRows(prev => [...prev, rowId]);
    } else {
      setSelectedRows(prev => prev.filter(id => id !== rowId));
    }
  };

  const columns = [
    {
      key: 'select',
      width: 60,
      align: 'center',
      title: (
        <Checkbox
          checked={allSelected}
          onChange={(_, checked) => handleSelectAll(checked)}
        />
      ),
      render: (row: any) => (
        <Checkbox
          checked={selectedRows.includes(row.id)}
          onChange={(_, checked) =>
            handleSelectRow(row.id, checked)
          }
        />
      )
    },
    {
      key: 'orderId',
      title: <Translate>ORDER ID</Translate>,
      render: (row: any) => row.orderNumber
    },
    {
      key: 'resultDate',
      title: <Translate>RESULT DATE</Translate>,
      render: (row: any) =>
        row.reviewDate ? formatDateWithoutSeconds(row.createdDate) : ' '
    },
    {
      key: 'testName',
      title: <Translate>TEST NAME</Translate>,
      render: (row: any) => row.testName
    },
    {
      key: 'result',
      title: <Translate>TEST RESULT, UNIT</Translate>,
      render: (row: any) => {
        const hasValue =
          row.resultValue !== null &&
          row.resultValue !== undefined &&
          row.resultValue !== '';

        return (
          <>
            <span>{row.resultValue}</span>
            {hasValue && row.unit && (
              <span style={{ marginLeft: 6, color: '#666' }}>
                {row.unit}
              </span>
            )}
          </>
        );
      }
    },
    {
      key: 'normalRange',
      title: <Translate>NORMAL RANGE</Translate>,
      render: (row: any) => row.normalRange ?? ' '
    },
    {
      key: 'marker',
      title: <Translate>MARKER</Translate>,
      align: 'center',
      render: (row: any) => renderMarker(row.marker)
    },
    {
      key: 'comments',
      title: <Translate>COMMENTS</Translate>,
      align: 'center',
      render: (row: any) => (
        <FontAwesomeIcon
          icon={faComment}
          className='icon-radiologist-worklist-size'
          style={{
            cursor: 'pointer',
            color: row.hasNote ? 'var(--primary-blue)' : 'gray'
          }}
          onClick={() => {
            setSelectedResultId(row.id);
            setOpenNotesModal(true);
          }}
        />
      )
    }
  ];

  const filters = (
    <Form fluid>
      <div className='diagnostics-result-filters-main-container'>
        <MyInput
          width={160}
          fieldType='date'
          fieldLabel='From Date'
          fieldName='fromDate'
          record={dateFilter}
          setRecord={setDateFilter}
        />

        <MyInput
          width={160}
          fieldType='date'
          fieldLabel='To Date'
          fieldName='toDate'
          record={dateFilter}
          setRecord={setDateFilter}
        />

        <div className='diagnostics-result-filters-check-box'>
          <Checkbox
            checked={showAbnormal}
            onChange={() => setShowAbnormal(!showAbnormal)}
          >
            Show Abnormal Result
          </Checkbox>
        </div>
      </div>
    </Form>
  );

  const tableButtons = (
    <LaboratoryReportButton resultIds={selectedRows} />
  );

  useEffect(() => {
    setPageIndex(0);
  }, [patientId, dateFilter, showAbnormal]);

  if (!patientId) {
    return null;
  }

  return (
    <Panel defaultExpanded ref={ref}>
      <MyTable
        filters={filters}
        columns={columns}
        data={normalizedResults}
        onRowClick={(row) => {
          setSelectedResult(row);
        }}
        rowClassName={(row) => (row?.id === selectedResult?.id ? "selected-row" : "")}
        loading={
          isOrdersFetching ||
          isResultsFetching ||
          isOrderTestsFetching ||
          isAllTestsFetching
        }
        page={pageIndex}
        tableButtons={tableButtons}
        rowsPerPage={rowsPerPage}
        totalCount={totalCount}
        onPageChange={(_, p) => setPageIndex(p)}
        onRowsPerPageChange={(e) => setRowsPerPage(Number(e.target.value))}
      />

      <ChatModal
        open={openNotesModal}
        setOpen={setOpenNotesModal}
        title='Comments'
        list={openNotesModal ? notesResponse ?? [] : []}
        fieldShowName='note'
        handleSendMessage={{}}
        disabled
      />
    </Panel>
  );
});

ReviewedResults.displayName = 'ReviewedResults';

export default ReviewedResults;