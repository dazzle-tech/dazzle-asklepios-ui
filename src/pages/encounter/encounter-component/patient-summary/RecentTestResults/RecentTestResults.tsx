import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { formatEnumString } from '@/utils';
import {
  faArrowDown,
  faArrowUp,
  faCircleExclamation,
  faTriangleExclamation
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { skipToken } from '@reduxjs/toolkit/query';
import React, { forwardRef, useMemo, useState } from 'react';
import { HStack } from 'rsuite';

import { useFilterDiagnosticOrderTestResultsQuery } from '@/services/setup/diagnosticTest/diagnosticOrderTestResultService';

import { ColumnConfig } from '@/components/MyTable/MyTable';
import Section from '@/components/Section';
import { useGetNotesByResultIdQuery } from '@/services/diagnosic-order/diagnosticOrderTestResultTechnicianNoteService';
import { useFilterDiagnosticOrderTestsQuery } from '@/services/diagnosic-order/diagnosticOrderTestService';
import { useGetAllDiagnosticTestProfilesQuery } from '@/services/setup/diagnosticTest/diagnosticTestProfileService';
import { useGetAllDiagnosticTestsQuery } from '@/services/setup/diagnosticTest/diagnosticTestService';
import {
  useGetLovAllValuesQuery,
  useGetLovsQuery,
  useGetLovValuesByCodeQuery
} from '@/services/setupService';
import { initialListRequest, initialListRequestAllValues } from '@/types/types';
import FullViewTable from './FullViewTable';

import { useFilterDiagnosticOrdersQuery } from '@/services/diagnosic-order/diagnosticOrderService';
type Props = {
  patient: any;
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

const RecentTestResults = forwardRef<any, Props>(({ patient }, ref) => {
  void ref;

  const [pageIndex, setPageIndex] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedResultId, setSelectedResultId] = useState<number | null>(null);

  const [openNotesModal, setOpenNotesModal] = useState(false);
  const [open, setOpen] = useState<boolean>(false);
  const patientId = patient?.id;
  const ordersQueryParams = useMemo(() => {
    if (!patientId) return skipToken;

    return {
      patientId,
      page: 0,
      size: 1000,
      sort: 'id,desc'
    };
  }, [patientId]);

  const { data: ordersResponse, isFetching: isOrdersFetching } =
    useFilterDiagnosticOrdersQuery(ordersQueryParams);
  const diagnosticOrders = ordersResponse?.data ?? [];
  const orderIds = useMemo(
    () => diagnosticOrders.map((order: any) => order.id).filter(Boolean),
    [diagnosticOrders]
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

    return params;
  }, [patientId, orderIds, pageIndex, rowsPerPage, isOrdersFetching]);

  const { data: testResultsResponse, isFetching } = useFilterDiagnosticOrderTestResultsQuery(
    queryParams ?? skipToken
  );

  const { data: notesResponse } = useGetNotesByResultIdQuery(
    openNotesModal && selectedResultId ? selectedResultId : skipToken
  );

  const testResults = testResultsResponse?.data ?? [];
  const totalCount = testResultsResponse?.totalCount ?? 0;

  const { data: profilesResponse } = useGetAllDiagnosticTestProfilesQuery({
    page: 0,
    size: 10000
  });

  const diagnosticTestProfileMap = useMemo(
    () => new Map(profilesResponse?.data?.map((profile: any) => [profile.id, profile]) ?? []),
    [profilesResponse]
  );
  const { data: valueUnitOptionsResponse } = useGetLovValuesByCodeQuery('VALUE_UNIT');

  const { data: allLovValuesResponse } = useGetLovAllValuesQuery({
    ...initialListRequestAllValues
  });

  const { data: lovDefinitionsResponse } = useGetLovsQuery({
    ...initialListRequest,
    pageSize: 1000
  });

  const resolveLovDisplayValue = (lovId: any, key: any) => {
    if (!lovId || key == null || !lovDefinitionsResponse?.object || !allLovValuesResponse?.object)
      return key;

    const lovDefinitionItem = lovDefinitionsResponse.object.find(
      (lovDefinitionItem: any) => String(lovDefinitionItem.key) === String(lovId)
    );

    if (!lovDefinitionItem?.lovCode) return key;

    return (
      allLovValuesResponse.object.find(
        (lovValue: any) =>
          String(lovValue.lovCode) === String(lovDefinitionItem.lovCode) &&
          String(lovValue.key) === String(key)
      )?.lovDisplayVale ?? key
    );
  };

  const orderTestRecordIds = useMemo(
    () => testResults.map((testResult: any) => testResult.orderTestId).filter(Boolean),
    [testResults]
  );

  const { data: orderTestsResponse, isFetching: isOrderTestsFetching } =
    useFilterDiagnosticOrderTestsQuery(
      orderTestRecordIds.length
        ? { orderTestIdIn: orderTestRecordIds, page: 0, size: 100 }
        : skipToken
    );
  const orderTestRecords = orderTestsResponse?.data ?? [];

  const orderTestRecordMap = useMemo(
    () => new Map(orderTestRecords.map((orderTest: any) => [orderTest.id, orderTest])),
    [orderTestRecords]
  );

  const { data: allTestsResponse, isFetching: isAllTestsFetching } = useGetAllDiagnosticTestsQuery({
    page: 0,
    size: 10000
  });

  const allDiagnosticTests = allTestsResponse?.data ?? [];

  const diagnosticTestMap = useMemo(
    () => new Map(allDiagnosticTests.map((diagnosticTest: any) => [diagnosticTest.id, diagnosticTest])),
    [allDiagnosticTests]
  );

  const normalizedResults = useMemo(() => {
    return testResults.map((testResult: any) => {
      const orderTest = orderTestRecordMap.get(testResult.orderTestId);

      const testId =
        orderTest?.testId ??
        testResult.testId ??
        testResult.diagnosticTestId ??
        testResult.test?.id;

      const diagnosticTest = testId ? diagnosticTestMap.get(testId) : null;

     const profile =
  diagnosticTestProfileMap.get(
    testResult.profileTestId
  );

const resultType =
  profile?.resultType?.toUpperCase()?.trim();

let value = '';
let unit = '';
let normalRangeValue = ' ';

if (resultType === 'LOV') {

  value = resolveLovDisplayValue(
    profile?.listOfValueId,
    testResult.resultValueText
  );

  normalRangeValue = resolveLovDisplayValue(
    profile?.listOfValueId,
    testResult.viewNormalRange
  );

} else if (resultType === 'TEXT') {

  value =
    testResult.resultValueText ?? '';

  normalRangeValue = ' ';

} else {

  value =
    testResult.resultValueNumber !== null &&
    testResult.resultValueNumber !== undefined
      ? String(testResult.resultValueNumber)
      : '';

  unit =
    valueUnitOptionsResponse?.object?.find(
      (valueUnit: any) =>
        String(valueUnit.key) ===
        String(
          profile?.resultUnit ??
          profile?.defaultResultUnit ??
          diagnosticTest?.defaultProfileResultUnit
        )
    )?.lovDisplayVale ?? '';

  normalRangeValue =
    testResult.viewNormalRange ?? ' ';
}

      const testName =
        profile?.name ??
        profile?.testName ??
        profile?.profileTestName ??
        profile?.diagnosticTestName ??
        diagnosticTest?.name ??
        orderTest?.testName ??
        orderTest?.diagnosticTestName ??
        testResult.testName ??
        testResult.diagnosticTestName ??
        testResult.test?.name ??
        '-';

      return {
        ...testResult,
        orderId: orderTest?.orderId ?? testResult.orderId ?? ' ',
        testName,
        resultValue: value,
        unit,
        normalRange: normalRangeValue
      };
    });
  }, [
    testResults,
    orderTestRecordMap,
    diagnosticTestMap,
    diagnosticTestProfileMap,
    valueUnitOptionsResponse,
    lovDefinitionsResponse,
    allLovValuesResponse
  ]);

  const columns: ColumnConfig[] = [
    {
      key: 'testName',
      title: <Translate>TEST NAME</Translate>,
      render: (testResultRow: any) => testResultRow.testName
    },
    {
  key: 'result',
  title: <Translate>TEST RESULT, UNIT</Translate>,
  render: (testResultRow: any) => {

    const resultType =
      testResultRow?.profile?.resultType
        ?.toUpperCase()
        ?.trim();

    const displayValue =
      testResultRow.resultValue ?? '';

    const hasValue =
      displayValue !== null &&
      displayValue !== undefined &&
      displayValue !== '';

    const showUnit =
      resultType === 'NUMBER';

    return (
      <>
        <span>{displayValue}</span>

        {hasValue &&
          showUnit &&
          testResultRow.unit && (
            <span
              style={{
                marginLeft: 6,
                color: '#666'
              }}
            >
              {testResultRow.unit}
            </span>
          )}
      </>
    );
  }
},
    {
      key: 'marker',
      title: <Translate>MARKER</Translate>,
      align: 'center',
      render: (testResultRow: any) => renderMarker(testResultRow.marker ?? testResultRow.marker)
    }
  ];

  return (
    <Section
      isContainOnlyTable
      title={<Translate>Recent Test Results</Translate>}
      content={
        <MyTable
          columns={columns}
          data={normalizedResults}
          loading={isFetching || isOrderTestsFetching || isAllTestsFetching}
          page={pageIndex}
          rowsPerPage={rowsPerPage}
          totalCount={totalCount}
          onPageChange={(_, p) => setPageIndex(p)}
          onRowsPerPageChange={e => setRowsPerPage(Number(e.target.value))}
        />
      }
      rightLink="Full view"
      setOpen={setOpen}
      openedContent={
        <FullViewTable
          open={open}
          setOpen={setOpen}
          results={normalizedResults}
          notesResponse={notesResponse}
          openNotesModal={openNotesModal}
          setOpenNotesModal={setOpenNotesModal}
        />
      }
    />
  );
});
export default RecentTestResults;
