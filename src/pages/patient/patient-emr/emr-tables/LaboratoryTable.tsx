import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { ColumnConfig } from '@/components/MyTable/MyTable';
import { formatDateWithoutSeconds, formatEnumString } from '@/utils';

import {
  useFilterDiagnosticOrderTestResultsQuery
} from '@/services/setup/diagnosticTest/diagnosticOrderTestResultService';

import {
  useFilterDiagnosticOrdersQuery,
  useLazyGetDiagnosticOrderByIdQuery
} from '@/services/diagnosic-order/diagnosticOrderService';

import {
  useLazyGetDiagnosticOrderTestByIdQuery
} from '@/services/diagnosic-order/diagnosticOrderTestService';

import {
  useGetBulkPatientBasicInfoMutation
} from '@/services/patient/patientService';

import {
  useGetAllDiagnosticTestProfilesQuery
} from '@/services/setup/diagnosticTest/diagnosticTestProfileService';

import { DiagnosticOrderTestStatus } from '@/types/model-types-new';

import React, { useEffect, useMemo, useState } from 'react';
import { skipToken } from '@reduxjs/toolkit/query';
import { useGetAllDiagnosticTestsQuery } from '@/services/setup/diagnosticTest/diagnosticTestService';
import { useGetAllLaboratoriesQuery } from '@/services/setup/diagnosticTest/laboratoryService';
import {
  useGetLovAllValuesQuery,
  useGetLovsQuery,
  useGetLovValuesByCodeQuery
} from '@/services/setupService';
import { initialListRequest, initialListRequestAllValues } from '@/types/types';
import { Tooltip, Whisper } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowDown, faArrowUp, faCircleExclamation, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';

interface Props {
  patient: any;
}

const isLovProfile = (profile?: any) =>
  profile?.resultType?.toUpperCase() === 'LOV';

const resolveLovDisplayValue = (
  profile: any,
  key: any,
  lovDefinitions: any,
  allLovValues: any
) => {
  if (
    !profile?.listOfValueId ||
    key == null ||
    !lovDefinitions?.object ||
    !allLovValues?.object
  ) {
    return key;
  }

  const normalizedKey = String(key);

  const lovDef = lovDefinitions.object.find(
    (d: any) => String(d.key) === String(profile.listOfValueId)
  );

  if (!lovDef?.lovCode) return key;

  return (
    allLovValues.object.find(
      (v: any) =>
        String(v.lovCode) === String(lovDef.lovCode) &&
        String(v.key) === normalizedKey
    )?.lovDisplayVale ?? key
  );
};

const LaboratoryTable: React.FC<Props> = ({ patient }) => {
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);

  const [ordersMap, setOrdersMap] = useState<Record<string, any>>({});
  const [orderTestsMap, setOrderTestsMap] = useState<Record<string, any>>({});
  const [patientsMap, setPatientsMap] = useState<Record<string, any>>({});

  const [fetchOrderById] = useLazyGetDiagnosticOrderByIdQuery();
  const [fetchOrderTestById] = useLazyGetDiagnosticOrderTestByIdQuery();
  const [getBulkPatientBasicInfo] = useGetBulkPatientBasicInfoMutation();

  const { data: profilesResponse } = useGetAllDiagnosticTestProfilesQuery({
    page: 0,
    size: 10000,
    sort: 'id,asc'
  });

  const { data: allTestsResponse } = useGetAllDiagnosticTestsQuery({
    page: 0,
    size: 10000
  });

  const { data: labsResponse } = useGetAllLaboratoriesQuery({
    page: 0,
    size: 10000
  });

  const { data: valueUnitLov } = useGetLovValuesByCodeQuery('VALUE_UNIT');
  const { data: labCatLovQueryResponse } =
    useGetLovValuesByCodeQuery('LAB_CATEGORIES');

  const { data: allLovValues } = useGetLovAllValuesQuery({
    ...initialListRequestAllValues
  });

  const { data: lovDefinitions } = useGetLovsQuery({
    ...initialListRequest,
    pageSize: 1000
  });

  const profilesMap = useMemo(
    () => new Map(profilesResponse?.data?.map((p: any) => [p.id, p]) ?? []),
    [profilesResponse]
  );

  const testsMap = useMemo(
    () => new Map(allTestsResponse?.data?.map((t: any) => [t.id, t]) ?? []),
    [allTestsResponse]
  );

  const labs = labsResponse?.data ?? [];

  const labByTestIdMap = useMemo(
    () => new Map(labs.map((lab: any) => [lab.testId, lab])),
    [labs]
  );

  const resolveCategoryLabel = (key?: any) =>
    labCatLovQueryResponse?.object?.find(
      (c: any) => String(c.key) === String(key)
    )?.lovDisplayVale ?? key ?? '-';

  const resolveUnitDisplay = (row: any) => {
    const profile = row._profile;
    if (!profile || isLovProfile(profile)) return null;

    const unit = valueUnitLov?.object?.find(
      (u: any) => String(u.key) === String(profile.resultUnit)
    )?.lovDisplayVale;

    return unit || null;
  };

  const ordersQueryParams = useMemo(() => {
    if (!patient?.id) return skipToken;

    return {
      patientId: patient.id,
      page: 0,
      size: 1000,
      sort: 'id,desc'
    };
  }, [patient?.id]);

  const { data: ordersResponse } = useFilterDiagnosticOrdersQuery(
    ordersQueryParams
  );

  const orders = ordersResponse?.data ?? [];

  const orderIds = useMemo(
    () => orders.map((o: any) => o.id).filter(Boolean),
    [orders]
  );

  const queryParams = useMemo(() => {
    if (!orderIds.length) return skipToken;

    return {
      page,
      size,
      sort: 'id,desc',
      processingStatus: DiagnosticOrderTestStatus.RESULT_APPROVED,
      orderIdIn: orderIds
    };
  }, [orderIds, page, size]);

  const { data: resultsResponse, isFetching } =
    useFilterDiagnosticOrderTestResultsQuery(queryParams);

  const results = resultsResponse?.data ?? [];
  const totalCount = resultsResponse?.totalCount ?? 0;

  useEffect(() => {
    results.forEach((r: any) => {
      if (r.orderTestId && !orderTestsMap[String(r.orderTestId)]) {
        fetchOrderTestById(r.orderTestId)
          .unwrap()
          .then((test) => {
            setOrderTestsMap((prev) => ({
              ...prev,
              [String(test.id)]: test
            }));
          })
          .catch(() => {});
      }
    });
  }, [results, orderTestsMap, fetchOrderTestById]);

  useEffect(() => {
    Object.values(orderTestsMap).forEach((test: any) => {
      const orderId = test?.orderId;

      if (orderId && !ordersMap[String(orderId)]) {
        fetchOrderById(orderId)
          .unwrap()
          .then((order) => {
            setOrdersMap((prev) => ({
              ...prev,
              [String(order.id)]: order
            }));
          })
          .catch(() => {});
      }
    });
  }, [orderTestsMap, ordersMap, fetchOrderById]);

  const patientIds = useMemo(() => {
    return Object.values(ordersMap)
      .map((o: any) => o?.patientId)
      .filter(Boolean)
      .map(String)
      .filter((id, i, arr) => arr.indexOf(id) === i);
  }, [ordersMap]);

  useEffect(() => {
    if (!patientIds.length) return;

    const numericIds = patientIds.map((id) => Number(id));

    getBulkPatientBasicInfo(numericIds)
      .unwrap()
      .then((res: any[]) => {
        const map: Record<string, any> = {};

        res.forEach((p: any, index: number) => {
          const originalId = numericIds[index];
          map[String(originalId)] = p;
        });

        setPatientsMap(map);
      })
      .catch(() => {});
  }, [patientIds, getBulkPatientBasicInfo]);

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

  const normalizedResults = useMemo(() => {
    return results.map((r: any) => {
      const orderTest = orderTestsMap[String(r.orderTestId)];
      const order = ordersMap[String(orderTest?.orderId)];
      const patientInfo = patientsMap[String(order?.patientId)];
      const profile = profilesMap.get(r.profileTestId);

      const test = testsMap.get(Number(orderTest?.testId));
      const lab = labByTestIdMap.get(Number(orderTest?.testId));

      return {
        ...r,
        _patientName: patientInfo
            ? [patientInfo.firstName, patientInfo.secondName, patientInfo.lastName].filter(Boolean).join(' ')
            : '—',
        _profile: profile,
        _test: test,
        _lab: lab,
        _visitId: order?.encounterId
      };
    });
  }, [
    results,
    orderTestsMap,
    ordersMap,
    patientsMap,
    profilesMap,
    testsMap,
    labByTestIdMap
  ]);

  const columns: ColumnConfig[] = [
    {
      key: 'visitId',
      title: <Translate>VISIT ID</Translate>,
      width: 120,
      render: (row: any) => row._visitId ?? '-'
    },
    {
      key: 'patient',
      title: <Translate>PATIENT</Translate>,
      render: (row: any) => row._patientName
    },
    {
      key: 'created',
      title: <Translate>CREATED BY / AT</Translate>,
      render: (row: any) => (
        <>
          {row.createdBy}
          <br />
          <span style={{ fontSize: 11, color: '#777' }}>
            {formatDateWithoutSeconds(row.createdDate)}
          </span>
        </>
      )
    },
    {
      key: 'resultDate',
      title: <Translate>RESULT DATE</Translate>,
      width: 150,
      render: (row: any) => formatDateWithoutSeconds(row.approvedDate)
    },
    {
      key: 'category',
      title: <Translate>CATEGORY</Translate>,
      width: 150,
      render: (row: any) => resolveCategoryLabel(row._lab?.category)
    },
    {
      key: 'testName',
      title: <Translate>TEST NAME</Translate>,
      render: (row: any) => (
        <>
          {row._profile?.name ?? '-'}
          <br />
          <span style={{ fontSize: 10, color: '#666' }}>
            {row._profile?.testName ?? ''}
          </span>
        </>
      )
    },
    {
      key: 'marker',
      title: <Translate>MARKER</Translate>,
      align: 'center',
      render: (row: any) => renderMarker(row.marker)
    },
    {
      key: 'result',
      title: <Translate>RESULT</Translate>,
      render: (row: any) => {
        const profile = row._profile;
        const value = row.resultValueNumber ?? row.resultValueText ?? '';
        if (isLovProfile(profile)) {
          return resolveLovDisplayValue(
            profile,
            value,
            lovDefinitions,
            allLovValues
          );
        }

        const unit = resolveUnitDisplay(row);
        const resultText = `${value ?? ''}${unit ? ` ${unit}` : ''}`;

        return resultText || '-';
      }
    },
    {
      key: 'normalRange',
      title: <Translate>NORMAL RANGE</Translate>,
      render: (row: any) => {
        const profile = row._profile;

        const hasViewRange =
          row.viewNormalRange != null &&
          String(row.viewNormalRange).trim() !== '';

        const hasMinMaxRange =
          row.minValue !== null &&
          row.minValue !== undefined &&
          row.maxValue !== null &&
          row.maxValue !== undefined;

        if (hasViewRange) {
          if (isLovProfile(profile)) {
            return resolveLovDisplayValue(
              profile,
              String(row.viewNormalRange),
              lovDefinitions,
              allLovValues
            );
          }

          const unit = resolveUnitDisplay(row);
          return `${row.viewNormalRange}${unit ? ` ${unit}` : ''}`;
        }

        if (hasMinMaxRange) {
          const unit = resolveUnitDisplay(row);
          return `${row.minValue} - ${row.maxValue}${unit ? ` ${unit}` : ''}`;
        }

        return '-';
      }
    }
  ];

  return (
    <MyTable
      columns={columns}
      data={normalizedResults}
      loading={isFetching}
      page={page}
      rowsPerPage={size}
      totalCount={totalCount}
      onPageChange={(_, p) => setPage(p)}
      onRowsPerPageChange={(e) => {
        setSize(Number(e.target.value));
        setPage(0);
      }}
      height={350}
    />
  );
};

export default LaboratoryTable;