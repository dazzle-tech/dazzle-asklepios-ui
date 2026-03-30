import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import MyButton from '@/components/MyButton/MyButton';
import { Form, Panel } from 'rsuite';
import 'react-tabs/style/react-tabs.css';
import * as icons from '@rsuite/icons';
import { formatDateWithoutSeconds } from '@/utils';
import { addFilterToListRequest } from '@/utils';
import { initialListRequest, ListRequest } from '@/types/types';
import { useGetBedTransactionsListQuery } from '@/services/encounterService';
import { useDispatch } from 'react-redux';
import { hideSystemLoader, showSystemLoader } from '@/utils/uiReducerActions';
import MyTable from '@/components/MyTable';
import { useGetBulkPatientBasicInfoMutation } from '@/services/patient/patientService';

const BedTransactionsSecondTab = ({ departmentKey }) => {
  const dispatch = useDispatch();
  const [manualSearchTriggered, setManualSearchTriggered] = useState(false);

  const patientBulkIdsRef = useRef<string[]>([]);
  const [
    getBulkPatientBasicInfo,
    { data: patientsBasicInfo, isLoading: patientsBulkLoading }
  ] = useGetBulkPatientBasicInfoMutation();

  const [listRequest, setListRequest] = useState<ListRequest>({
    ...initialListRequest,
    filters: [
      {
        fieldName: 'department_key',
        operator: 'match',
        value: departmentKey
      }
    ]
  });

  const [dateFilter, setDateFilter] = useState({
    fromDate: new Date(),
    toDate: new Date()
  });

  const { data: bedTransactionsListResponse, isFetching, isLoading } =
    useGetBedTransactionsListQuery(listRequest);

  const tableData = bedTransactionsListResponse?.object ?? [];

const patientIdsForBulk = useMemo(() => {
  const ids = tableData
    .map((row: any) => row?.patientKey)
    .filter(v => v !== null && v !== undefined && String(v).trim() !== '')
    .map(v => String(v));

  return Array.from(new Set(ids));
}, [tableData]);

  useEffect(() => {
    if (patientIdsForBulk.length === 0) return;

    patientBulkIdsRef.current = patientIdsForBulk;

    getBulkPatientBasicInfo(patientIdsForBulk as any)
      .unwrap()
      .catch(() => {});
  }, [patientIdsForBulk, getBulkPatientBasicInfo]);

  const patientMap = useMemo(() => {
    const map = new Map<string, any>();
    const ids = patientBulkIdsRef.current;

    (patientsBasicInfo ?? []).forEach((patient: any, index: number) => {
      const key = patient?.id ?? ids[index];
      if (!key) return;
      map.set(String(key), patient);
    });

    return map;
  }, [patientsBasicInfo]);

const enrichedTableData = useMemo(() => {
  return tableData.map((row: any) => {
    const patientId = row?.patientKey ?? null;
    const patient = patientId ? patientMap.get(String(patientId)) : null;

    const fullName =
      [
        patient?.firstName,
        patient?.secondName,
        patient?.thirdName,
        patient?.lastName
      ]
        .filter(Boolean)
        .join(' ')
        .trim() || '-';

    return {
      ...row,
      patientObject: {
        id: patientId,
        fullName,
        medicalRecordNumber: patient?.medicalRecordNumber ?? '-'
      }
    };
  });
}, [tableData, patientMap]);
useEffect(() => {
  console.log('bedTransactionsListResponse =>', bedTransactionsListResponse);
  console.log('tableData first row =>', tableData?.[0]);
  console.log('patientIdsForBulk =>', patientIdsForBulk);
  console.log('patientsBasicInfo =>', patientsBasicInfo);
}, [bedTransactionsListResponse, tableData, patientIdsForBulk, patientsBasicInfo]);
  const handleManualSearch = () => {
    setManualSearchTriggered(true);

    const fromDate = dateFilter.fromDate ? new Date(dateFilter.fromDate) : null;
    const toDate = dateFilter.toDate ? new Date(dateFilter.toDate) : null;

    if (fromDate) fromDate.setHours(0, 0, 0, 0);
    if (toDate) toDate.setHours(23, 59, 59, 999);

    if (fromDate && toDate) {
      setListRequest(
        addFilterToListRequest(
          'created_at',
          'between',
          `${fromDate.getTime()}_${toDate.getTime()}`,
          listRequest
        )
      );
    } else if (fromDate) {
      setListRequest(
        addFilterToListRequest('created_at', 'gte', fromDate.getTime().toString(), listRequest)
      );
    } else if (toDate) {
      setListRequest(
        addFilterToListRequest('created_at', 'lte', toDate.getTime().toString(), listRequest)
      );
    } else {
      setListRequest({
        ...listRequest,
        filters: [
          {
            fieldName: 'department_key',
            operator: 'match',
            value: departmentKey
          }
        ]
      });
    }
  };

  useEffect(() => {
    if (!isFetching && manualSearchTriggered) {
      setManualSearchTriggered(false);
    }
  }, [isFetching, manualSearchTriggered]);

  useEffect(() => {
    handleManualSearch();
  }, []);

  useEffect(() => {
    if (isLoading || (manualSearchTriggered && isFetching) || patientsBulkLoading) {
      dispatch(showSystemLoader());
    } else {
      dispatch(hideSystemLoader());
    }

    return () => {
      dispatch(hideSystemLoader());
    };
  }, [isLoading, isFetching, manualSearchTriggered, patientsBulkLoading, dispatch]);

  const tableColumns = [
    {
      key: 'queueNumber',
      title: <Translate>#</Translate>,
      dataKey: 'queueNumber',
      render: (rowData: any) => rowData?.patientObject?.medicalRecordNumber
    },
    {
      key: 'patientFullName',
      title: <Translate>PATIENT NAME</Translate>,
      render: (rowData: any) => rowData?.patientObject?.fullName
    },
    {
      key: 'fromBed',
      title: <Translate>FROM BED</Translate>,
      render: (rowData: any) => rowData?.fromBed?.name
    },
    {
      key: 'fromRoom',
      title: <Translate>ROOM</Translate>,
      render: (rowData: any) => rowData?.fromRoom?.name
    },
    {
      key: 'toBed',
      title: <Translate>TO BED</Translate>,
      render: (rowData: any) => rowData?.toBed?.name
    },
    {
      key: 'toRoom',
      title: <Translate>ROOM</Translate>,
      render: (rowData: any) => rowData?.toRoom?.name
    },
    {
      key: 'movedByAt',
      title: <Translate>Moved By\At</Translate>,
      render: (rowData: any) => {
        return (
          <>
            <span>{rowData?.createdBy}</span>
            <br />
            <span className="date-table-style">{formatDateWithoutSeconds(rowData?.createdAt)}</span>
          </>
        );
      }
    }
  ];

  const pageIndex = listRequest.pageNumber - 1;
  const rowsPerPage = listRequest.pageSize;
  const totalCount = bedTransactionsListResponse?.extraNumeric ?? 0;

  const handlePageChange = (_: unknown, newPage: number) => {
    setManualSearchTriggered(true);
    setListRequest({ ...listRequest, pageNumber: newPage + 1 });
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setManualSearchTriggered(true);
    setListRequest({
      ...listRequest,
      pageSize: parseInt(event.target.value, 10),
      pageNumber: 1
    });
  };

  const filters = () => {
    return (
      <Form layout="inline" fluid className="date-filter-form">
        <MyInput
          column
          width={180}
          fieldType="date"
          fieldLabel="From Date"
          fieldName="fromDate"
          record={dateFilter}
          setRecord={setDateFilter}
        />
        <MyInput
          width={180}
          column
          fieldType="date"
          fieldLabel="To Date"
          fieldName="toDate"
          record={dateFilter}
          setRecord={setDateFilter}
        />
        <div className="search-btn">
          <MyButton onClick={handleManualSearch}>
            <icons.Search />
          </MyButton>
        </div>
      </Form>
    );
  };

            // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';

  return (
    <Panel dir={dir}>
      <MyTable
        filters={filters()}
        height={600}
        data={enrichedTableData}
        columns={tableColumns}
        loading={isLoading || (manualSearchTriggered && isFetching) || patientsBulkLoading}
        sortColumn={listRequest.sortBy}
        sortType={listRequest.sortType}
        onSortChange={(sortBy, sortType) => {
          setListRequest({ ...listRequest, sortBy, sortType });
        }}
        page={pageIndex}
        rowsPerPage={rowsPerPage}
        totalCount={totalCount}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
      />
    </Panel>
  );
};

export default BedTransactionsSecondTab;