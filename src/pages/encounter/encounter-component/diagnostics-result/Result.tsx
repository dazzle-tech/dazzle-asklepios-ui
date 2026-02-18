import React, { forwardRef, useEffect, useMemo, useState } from 'react';
import MyTable from '@/components/MyTable';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import Translate from '@/components/Translate';
import ChatModal from '@/components/ChatModal';
import { Panel, HStack, Checkbox, Form, Message, useToaster } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowDown,
  faArrowUp,
  faCircleExclamation,
  faTriangleExclamation,
  faComment,
  faPrint
} from '@fortawesome/free-solid-svg-icons';
import { skipToken } from '@reduxjs/toolkit/query';
import { formatDateWithoutSeconds, formatEnumString } from '@/utils';

import {
  useFilterDiagnosticOrderTestResultsQuery
} from '@/services/setup/diagnosticTest/diagnosticOrderTestResultService';

import {
  useGenerateLabResultsPdfMutation
} from '@/services/setup/resultReportApi';
import { useFilterDiagnosticOrderTestsQuery } from '@/services/diagnosic-order/diagnosticOrderTestService';
import { useGetAllDiagnosticTestsQuery } from '@/services/setup/diagnosticTest/diagnosticTestService';
import {
  useGetLovValuesByCodeQuery,
  useGetLovAllValuesQuery,
  useGetLovsQuery
} from '@/services/setupService';
import {
  initialListRequestAllValues,
  initialListRequest
} from '@/types/types';
import { useGetAllDiagnosticTestProfilesQuery } from '@/services/setup/diagnosticTest/diagnosticTestProfileService';
import {
  useGetNotesByResultIdQuery,
} from '@/services/diagnosic-order/diagnosticOrderTestResultTechnicianNoteService';


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
  switch (marker) {
    case 'ABNORMAL_MARKER':
      return <FontAwesomeIcon icon={faCircleExclamation} />;
    case 'UPPER_LIMIT':
      return <FontAwesomeIcon icon={faArrowUp} />;
    case 'LOWER_LIMIT':
      return <FontAwesomeIcon icon={faArrowDown} />;
    case 'CRITICAL_UPPER':
      return (
        <HStack spacing={6}>
          <FontAwesomeIcon icon={faTriangleExclamation} />
          <FontAwesomeIcon icon={faArrowUp} />
        </HStack>
      );
    case 'CRITICAL_LOWER':
      return (
        <HStack spacing={6}>
          <FontAwesomeIcon icon={faTriangleExclamation} />
          <FontAwesomeIcon icon={faArrowDown} />
        </HStack>
      );
    default:
      return formatEnumString(marker);
  }
};

const ReviewedResults = forwardRef<any, Props>(({ patient }) => {

  const toaster = useToaster();

  const [pageIndex, setPageIndex] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedResultId, setSelectedResultId] = useState<number | null>(null);

  const [showAbnormal, setShowAbnormal] = useState(false);
  const [dateFilter, setDateFilter] = useState<any>({
    fromDate: null,
    toDate: null
  });

  const [openNotesModal, setOpenNotesModal] = useState(false);
  const [selectedResult, setSelectedResult] = useState<any>(null);

  const [generatePdf, { isLoading: isGeneratingPdf }] =
    useGenerateLabResultsPdfMutation();

  /* ================= QUERY ================= */

  const queryParams = useMemo(() => {
    const patientId = patient?.id ?? patient?.key;
    if (!patientId) return null;

    const params: any = {
      patientId,
      page: pageIndex,
      size: rowsPerPage,
      processingStatus: 'RESULT_APPROVED',
      sort: 'reviewDate,desc'
    };

    params.reviewed = true;

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
      params.approvedDateFrom =
        startOfDay(dateFilter.fromDate).toISOString();
    }

    if (dateFilter.toDate) {
      params.approvedDateTo =
        endOfDay(dateFilter.toDate).toISOString();
    }

    return params;
  }, [patient, pageIndex, rowsPerPage, showAbnormal, dateFilter]);
  const { data: response, isFetching } =
    useFilterDiagnosticOrderTestResultsQuery(
      queryParams ?? skipToken
    );

const { data: notesResponse, isFetching: isNotesFetching } =
  useGetNotesByResultIdQuery(
    openNotesModal && selectedResultId
      ? selectedResultId
      : skipToken
  );


  const results = response?.data ?? [];
  const totalCount = response?.totalCount ?? 0;

  const { data: profilesResponse } =
    useGetAllDiagnosticTestProfilesQuery({
      page: 0,
      size: 10000
    });

  const profilesMap = useMemo(
    () => new Map(profilesResponse?.data?.map(p => [p.id, p]) ?? []),
    [profilesResponse]
  );


  const { data: valueUnitLov } =
    useGetLovValuesByCodeQuery('VALUE_UNIT');

  const { data: allLovValues } =
    useGetLovAllValuesQuery({ ...initialListRequestAllValues });

  const { data: lovDefinitions } =
    useGetLovsQuery({ ...initialListRequest, pageSize: 1000 });


  const isLovResult = (row: any) =>
    !!row.resultValueText && row.resultValueNumber == null;

  const resolveLovDisplayValue = (
    lovId: any,
    key: any
  ) => {
    if (!lovId || key == null || !lovDefinitions?.object || !allLovValues?.object)
      return key;

    const lovDef = lovDefinitions.object.find(
      (d: any) => String(d.key) === String(lovId)
    );

    if (!lovDef?.lovCode) return key;

    return (
      allLovValues.object.find(
        (v: any) =>
          String(v.lovCode) === String(lovDef.lovCode) &&
          String(v.key) === String(key)
      )?.lovDisplayVale ?? key
    );
  };


  /* ================= ORDER TESTS ================= */

  const orderTestIds = useMemo(
    () => results.map(r => r.orderTestId).filter(Boolean),
    [results]
  );

  const { data: orderTestsResponse } =
    useFilterDiagnosticOrderTestsQuery(
      orderTestIds.length
        ? { orderTestIdIn: orderTestIds, page: 0, size: 100 }
        : skipToken
    );

  const orderTests = orderTestsResponse?.data ?? [];

  const orderTestMap = useMemo(
    () => new Map(orderTests.map(t => [t.id, t])),
    [orderTests]
  );

  /* ================= ALL TESTS ================= */

  const { data: allTestsResponse } =
    useGetAllDiagnosticTestsQuery({ page: 0, size: 10000 });

  const allTests = allTestsResponse?.data ?? [];

  const testMap = useMemo(
    () => new Map(allTests.map(t => [t.id, t])),
    [allTests]
  );


  /* ================= PDF ================= */

  const handleGeneratePdf = async () => {
    try {
      const pdfData = {
        patientInfo: {
          name: patient?.fullName,
          mrn: patient?.patientMrn,
          dob: patient?.dob,
          gender: patient?.gender
        },
        results
      };

      const file = await generatePdf(pdfData).unwrap();

      const blob = new Blob([file], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Lab_Results_${Date.now()}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);

      toaster.push(
        <Message type="success" showIcon>
          Report Generated Successfully
        </Message>
      );
    } catch {
      toaster.push(
        <Message type="error" showIcon>
          Failed To Generate Report
        </Message>
      );
    }
  };


  const normalizedResults = useMemo(() => {
    if (!orderTests.length || !allTests.length) return [];

    return results.map((r: any) => {
      const orderTest = orderTestMap.get(r.orderTestId);
      const test = orderTest ? testMap.get(orderTest.testId) : null;

      const profile = profilesMap.get(r.profileTestId);
      const isLovTest = profile?.resultType?.toUpperCase() === 'LOV';

      let value = '';
      let unit = '';
      let normalRangeValue = ' ';

      if (isLovTest) {
        value = resolveLovDisplayValue(
          profile?.listOfValueId,
          r.resultValueText
        );

        normalRangeValue = resolveLovDisplayValue(
          profile?.listOfValueId,
          r.viewNormalRange
        );
      } else {
        value =
          r.resultValueNumber !== null &&
            r.resultValueNumber !== undefined
            ? String(r.resultValueNumber)
            : '';

        unit =
          valueUnitLov?.object?.find(
            (u: any) =>
              String(u.key) === String(test?.defaultProfileResultUnit)
          )?.lovDisplayVale ?? '';

        normalRangeValue = r.viewNormalRange ?? ' ';
      }

      return {
        ...r,
        orderId: orderTest?.orderId ?? ' ',
        testName: test?.name ?? ' ',
        resultValue: value,
        unit,
        normalRange: normalRangeValue
      };
    });
  }, [
    results,
    orderTestMap,
    testMap,
    valueUnitLov,
    lovDefinitions,
    allLovValues
  ]);



  console.log("normalizedResults", normalizedResults);

  const columns = [
    {
      key: 'orderId',
      title: <Translate>ORDER ID</Translate>,
      render: (row: any) => row.orderId
    },
    {
      key: 'resultDate',
      title: <Translate>RESULT DATE</Translate>,
      render: (row: any) =>
        row.reviewDate
          ? formatDateWithoutSeconds(row.reviewDate)
          : ' '
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
      render: (row: any) =>
        renderMarker(row.marker ?? row.marker)
    },
    {
      key: 'comments',
      title: <Translate>COMMENTS</Translate>,
      align: 'center',
      render: (row: any) => (
        <FontAwesomeIcon
          icon={faComment}
          style={{
            cursor: 'pointer',
            color: row.hasNote ? '#1675e0' : 'gray'
          }}
          onClick={() => {
            setSelectedResult(row);
            setSelectedResultId(row.id);
            setOpenNotesModal(true);
          }}
        />
      )
    }
  ];

  /* ================= FILTER UI ================= */

  const filters = (
    <Form fluid>
      <div className='diagnostics-result-filters-main-container'>
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


  const tableButtons = (<>
    <MyButton
      onClick={handleGeneratePdf}
      loading={isGeneratingPdf}
      disabled={!results.length}
      appearance='ghost'
      prefixIcon={() => (
        <FontAwesomeIcon icon={faPrint} style={{ marginRight: 8 }} />
      )}
      style={{ marginLeft: 'auto' }}>
      Generate Complete Report
    </MyButton></>)
  console.log("normalizedResults", normalizedResults);


  useEffect(() => {
    setPageIndex(0);
  }, [dateFilter, showAbnormal]);

  return (
    <Panel defaultExpanded>
      <MyTable
        filters={filters}
        columns={columns}
        data={normalizedResults}
        loading={
          isFetching ||
          !orderTestsResponse ||
          !allTestsResponse ||
          isGeneratingPdf
        }
        page={pageIndex}
        tableButtons={tableButtons}
        rowsPerPage={rowsPerPage}
        totalCount={totalCount}
        onPageChange={(_, p) => setPageIndex(p)}
        onRowsPerPageChange={e =>
          setRowsPerPage(Number(e.target.value))
        }
      />

      <ChatModal
        open={openNotesModal}
        setOpen={setOpenNotesModal}
        title="Comments"
        list={openNotesModal ? notesResponse ?? [] : []}
        fieldShowName="note"
        handleSendMessage={{}}
        disabled
      />

    </Panel>
  );
});

export default ReviewedResults;
