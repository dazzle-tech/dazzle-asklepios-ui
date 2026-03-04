
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

import {
  useFilterDiagnosticOrderTestResultsQuery
} from '@/services/setup/diagnosticTest/diagnosticOrderTestResultService';

import {
  useGetNotesByResultIdQuery,
} from '@/services/diagnosic-order/diagnosticOrderTestResultTechnicianNoteService';
import { useFilterDiagnosticOrderTestsQuery } from '@/services/diagnosic-order/diagnosticOrderTestService';
import { useGetAllDiagnosticTestProfilesQuery } from '@/services/setup/diagnosticTest/diagnosticTestProfileService';
import { useGetAllDiagnosticTestsQuery } from '@/services/setup/diagnosticTest/diagnosticTestService';
import {
  useGetLovAllValuesQuery,
  useGetLovsQuery,
  useGetLovValuesByCodeQuery
} from '@/services/setupService';
import {
  initialListRequest,
  initialListRequestAllValues
} from '@/types/types';
import Section from '@/components/Section';
import FullViewTable from './FullViewTable';
import { ColumnConfig } from '@/components/MyTable/MyTable';


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

const RecentTestResults = forwardRef<any, Props>(({ patient }) => {


  const [pageIndex, setPageIndex] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedResultId, setSelectedResultId] = useState<number | null>(null);

  const [openNotesModal, setOpenNotesModal] = useState(false);
  const [open, setOpen] = useState<boolean>(false);

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


    return params;
  }, [patient, pageIndex, rowsPerPage]);
  const { data: response, isFetching } =
    useFilterDiagnosticOrderTestResultsQuery(
      queryParams ?? skipToken
    );

  const { data: notesResponse } =
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


  const { data: allTestsResponse } =
    useGetAllDiagnosticTestsQuery({ page: 0, size: 10000 });

  const allTests = allTestsResponse?.data ?? [];

  const testMap = useMemo(
    () => new Map(allTests.map(t => [t.id, t])),
    [allTests]
  );

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

  const columns: ColumnConfig[] = [{
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
    key: 'marker',
    title: <Translate>MARKER</Translate>,
    align: 'center',
    render: (row: any) =>
      renderMarker(row.marker ?? row.marker)
  }
  ];

  return (
    <Section
      isContainOnlyTable
      title="Recent Test Results"
      content={
        <MyTable
          columns={columns}
          data={normalizedResults}
          loading={
            isFetching ||
            !orderTestsResponse ||
            !allTestsResponse
          }
          page={pageIndex}
          rowsPerPage={rowsPerPage}
          totalCount={totalCount}
          onPageChange={(_, p) => setPageIndex(p)}
          onRowsPerPageChange={e =>
            setRowsPerPage(Number(e.target.value))
          }
        />
      }
      rightLink="Full view"
      setOpen={setOpen}
      openedContent={
        <FullViewTable open={open} setOpen={setOpen} results={normalizedResults} notesResponse={notesResponse} openNotesModal={openNotesModal} setOpenNotesModal={setOpenNotesModal} />
      }
    />
  );
});

export default RecentTestResults;
