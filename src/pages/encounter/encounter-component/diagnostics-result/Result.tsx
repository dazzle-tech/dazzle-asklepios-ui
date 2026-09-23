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

import { useGetDiagnosticTestProfilesByIdsMutation } from '@/services/setup/diagnosticTest/diagnosticTestProfileService';
import { useGetDiagnosticTestsByIdsQuery } from '@/services/setup/diagnosticTest/diagnosticTestService';

import LaboratoryReportButton from './LaboratoryReportButton';
import LabInterpretationAI from './LabInterpretationAI';
import LovValueCell from '@/components/LovValueCell';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
type Props = {
  patient: any;
};
const isLovProfile = (profile?: any) =>
  profile?.resultType?.toUpperCase() === 'LOV';

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
    const { data: valueUnitLov } = useGetLovValuesByCodeQuery('VALUE_UNIT');

  const { data: notesResponse } = useGetNotesByResultIdQuery(
    openNotesModal && selectedResultId ? selectedResultId : skipToken
  );

  const results = response?.data ?? [];
  const totalCount = response?.totalCount ?? 0;

  const profileIds = useMemo(
    () =>
      Array.from(
        new Set(
          results
            .map((result: any) => result.profileTestId)
            .filter((id: any) => id !== null && id !== undefined)
            .map((id: any) => Number(id))
        )
      ),
    [results]
  );

  const [fetchProfilesByIds, { data: profilesResponse }] =
    useGetDiagnosticTestProfilesByIdsMutation();

  useEffect(() => {
    if (profileIds.length > 0) {
      fetchProfilesByIds(profileIds);
    }
  }, [profileIds, fetchProfilesByIds]);

  const profilesMap = useMemo(
    () => new Map(profilesResponse?.map((profile: any) => [profile.id, profile]) ?? []),
    [profilesResponse]
  );

    const resolveUnitDisplay = (row: any) => {
      const profile = row.profile;
      if (!profile || isLovProfile(profile)) return null;

      if (!profile.resultUnit) return null;

      const unit = valueUnitLov?.object?.find(
        (u: any) => String(u.key) === String(profile.resultUnit)
      )?.lovDisplayVale;

      return unit || null;
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

  const testIds = useMemo(
    () =>
      Array.from(
        new Set(
          orderTests
            .map((orderTest: any) => orderTest.testId)
            .filter((id: any) => id !== null && id !== undefined)
            .map((id: any) => Number(id))
        )
      ),
    [orderTests]
  );

  const {
    data: diagnosticTests = [],
    isFetching: isAllTestsFetching
  } = useGetDiagnosticTestsByIdsQuery(
    { ids: testIds },
    {
      skip: testIds.length === 0
    }
  );

  const testMap = useMemo(
    () => new Map(diagnosticTests.map((test: any) => [test.id, test])),
    [diagnosticTests]
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

    const test = orderTest
      ? testMap.get(orderTest.testId)
      : null;

    const profile = profilesMap.get(r.profileTestId);


    return {
      ...r,
      orderId: orderTest?.orderId ?? '',
      orderNumber: order?.orderNumber ?? '',
      testName: profile?.name ?? ' ',
      profile,
    };
  });
}, [
  results,
  orderTestMap,
  orderMap,
  testMap,
  profilesMap

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
              key: 'resultValue',
              title: <Translate>RESULT VALUE</Translate>,
              render: (row: any) => {
                const profile = row.profile;
    
                const value = row.resultValueNumber ?? row.resultValueText ?? '';
    
                if (isLovProfile(profile)) {
                  return (
                    <LovValueCell
                      valueKey={value}
                    />
                  );
                }
    
                const unit = resolveUnitDisplay(row);
    
                return `${value ?? ''}${unit ? ` ${unit}` : ''}`;
              }
            },

    {
              key: 'normalRange',
              title: <Translate>NORMAL RANGE</Translate>,
              render: (row: any) => {
                const profile = row.profile;
                const hasViewRange =
                  row.normalRangeValue && row.normalRangeValue.trim() !== '';
    
                const hasMinMaxRange =
                  row.minValue !== null &&
                  row.minValue !== undefined &&
                  row.maxValue !== null &&
                  row.maxValue !== undefined;
    
                if (hasViewRange) {
                  if (isLovProfile(profile)) {
                    return (
                      <LovValueCell
                        valueKey={String(row.normalRangeValue)}
                      />
                    );
                  }
    
                  const unit = resolveUnitDisplay(row);
                  return `${row.normalRangeValue}${unit ? ` ${unit}` : ''}`;
                }
    
                if (hasMinMaxRange) {
                  const unit = resolveUnitDisplay(row);
                  return `${row.minValue} - ${row.maxValue}${unit ? ` ${unit}` : ''}`;
                }
    
                return ' ';
              }
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
    <Form fluid className="filter-form-disable-fix">
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
       <LabInterpretationAI patientId={patientId} />
    </Panel>
  );
});

ReviewedResults.displayName = 'ReviewedResults';

export default ReviewedResults;