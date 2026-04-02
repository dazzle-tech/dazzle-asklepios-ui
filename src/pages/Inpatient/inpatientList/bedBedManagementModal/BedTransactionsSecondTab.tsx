import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import MyButton from '@/components/MyButton/MyButton';
import { Form, Panel, Tooltip, Whisper } from 'rsuite';
import 'react-tabs/style/react-tabs.css';
import * as icons from '@rsuite/icons';
import { formatDateWithoutSeconds, formatEnumString } from '@/utils';
import MyTable from '@/components/MyTable';
import { useGetBulkPatientBasicInfoMutation } from '@/services/patient/patientService';
import { useGetBedTransactionsByDepartmentAndDateRangeQuery } from '@/services/patients/emergency/encounterAssignToBedService';
import { useGetRoomsByIdsMutation } from '@/services/setup/room/roomService';
import { useGetBedsByIdsMutation } from '@/services/setup/room/bedService';

const BedTransactionsSecondTab = ({ departmentKey }) => {
  const [manualSearchTriggered, setManualSearchTriggered] = useState(false);

  const patientBulkIdsRef = useRef<string[]>([]);

  const [
    getBulkPatientBasicInfo,
    { data: patientsBasicInfo, isLoading: patientsBulkLoading }
  ] = useGetBulkPatientBasicInfoMutation();

  const [getRoomsByIds, { data: roomsByIds = [], isLoading: isRoomsByIdsLoading }] =
    useGetRoomsByIdsMutation();

  const [getBedsByIds, { data: bedsByIds = [], isLoading: isBedsByIdsLoading }] =
    useGetBedsByIdsMutation();

  const [pagination, setPagination] = useState({
    page: 0,
    size: 15
  });

  const [sortState, setSortState] = useState({
    sortBy: 'transactionDate',
    sortType: 'desc'
  });

  const [dateFilter, setDateFilter] = useState({
    fromDate: new Date(),
    toDate: new Date()
  });

  const [searchParams, setSearchParams] = useState({
    from: '',
    to: ''
  });

  const {
    data: bedTransactionsResponse,
    isFetching,
    isLoading
  } = useGetBedTransactionsByDepartmentAndDateRangeQuery(
    {
      departmentId: departmentKey,
      from: searchParams.from,
      to: searchParams.to,
      page: pagination.page,
      size: pagination.size,
      sort: `${sortState.sortBy},${sortState.sortType}`
    },
    {
      skip: !departmentKey || !searchParams.from || !searchParams.to
    }
  );

  const tableData = bedTransactionsResponse?.data ?? [];

  const patientIdsForBulk = useMemo(() => {
    const ids = tableData
      .map((row: any) => row?.patient?.id)
      .filter(v => v !== null && v !== undefined && String(v).trim() !== '')
      .map(v => String(v));

    return Array.from(new Set(ids));
  }, [tableData]);

  useEffect(() => {
    if (patientIdsForBulk.length === 0) return;

    patientBulkIdsRef.current = patientIdsForBulk;

    getBulkPatientBasicInfo(patientIdsForBulk as any)
      .unwrap()
      .catch(() => { });
  }, [patientIdsForBulk, getBulkPatientBasicInfo]);

  const roomIdsForBulk = useMemo(() => {
    const ids = tableData
      .flatMap((row: any) => [row?.fromRoomId, row?.toRoomId])
      .filter(v => v !== null && v !== undefined && String(v).trim() !== '');

    return Array.from(new Set(ids));
  }, [tableData]);

  const bedIdsForBulk = useMemo(() => {
    const ids = tableData
      .flatMap((row: any) => [row?.fromBedId, row?.toBedId])
      .filter(v => v !== null && v !== undefined && String(v).trim() !== '');

    return Array.from(new Set(ids));
  }, [tableData]);

  useEffect(() => {
    if (roomIdsForBulk.length === 0) return;
    getRoomsByIds({ ids: roomIdsForBulk }).catch(() => { });
  }, [roomIdsForBulk, getRoomsByIds]);

  useEffect(() => {
    if (bedIdsForBulk.length === 0) return;
    getBedsByIds({ ids: bedIdsForBulk }).catch(() => { });
  }, [bedIdsForBulk, getBedsByIds]);

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

  const roomsMap = useMemo(() => {
    const map = new Map<string, any>();
    (roomsByIds ?? []).forEach((room: any) => {
      if (!room?.id) return;
      map.set(String(room.id), room);
    });
    return map;
  }, [roomsByIds]);

  const bedsMap = useMemo(() => {
    const map = new Map<string, any>();
    (bedsByIds ?? []).forEach((bed: any) => {
      if (!bed?.id) return;
      map.set(String(bed.id), bed);
    });
    return map;
  }, [bedsByIds]);

  const enrichedTableData = useMemo(() => {
    return tableData.map((row: any) => {
      const patientId = row?.patient?.id ?? null;
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
          .trim() ||
        row?.patient?.fullName ||
        '-';

      const fromRoom = row?.fromRoomId ? roomsMap.get(String(row.fromRoomId)) : null;
      const toRoom = row?.toRoomId ? roomsMap.get(String(row.toRoomId)) : null;
      const fromBed = row?.fromBedId ? bedsMap.get(String(row.fromBedId)) : null;
      const toBed = row?.toBedId ? bedsMap.get(String(row.toBedId)) : null;

      return {
        ...row,
        patientObject: {
          id: patientId,
          fullName,
          medicalRecordNumber:
            patient?.medicalRecordNumber ??
            row?.patient?.medicalRecordNumber ??
            '-'
        },
        resolvedFromRoom: fromRoom,
        resolvedToRoom: toRoom,
        resolvedFromBed: fromBed,
        resolvedToBed: toBed
      };
    });
  }, [tableData, patientMap, roomsMap, bedsMap]);

  const handleManualSearch = () => {
    setManualSearchTriggered(true);

    const fromDate = dateFilter.fromDate ? new Date(dateFilter.fromDate) : null;
    const toDate = dateFilter.toDate ? new Date(dateFilter.toDate) : null;

    if (fromDate) fromDate.setHours(0, 0, 0, 0);
    if (toDate) toDate.setHours(23, 59, 59, 999);

    setPagination(prev => ({ ...prev, page: 0 }));

    setSearchParams({
      from: fromDate ? fromDate.toISOString() : '',
      to: toDate ? toDate.toISOString() : ''
    });
  };

  useEffect(() => {
    handleManualSearch();
  }, []);

  useEffect(() => {
    if (!isFetching && manualSearchTriggered) {
      setManualSearchTriggered(false);
    }
  }, [isFetching, manualSearchTriggered]);

  const tableLoading =
    isLoading ||
    (manualSearchTriggered && isFetching) ||
    patientsBulkLoading ||
    isRoomsByIdsLoading ||
    isBedsByIdsLoading;



  const tableColumns = [
    {
      key: 'medicalRecordNumber',
      title: <Translate>MRN</Translate>,
      render: (rowData: any) => rowData?.patientObject?.medicalRecordNumber ?? '-'
    },
    {
      key: 'patientFullName',
      title: 'PATIENT NAME',
      fullText: true,
      render: (row: any) => {
        const speaker = (
          <Tooltip>
            <div>MRN: {row?.patientObject?.medicalRecordNumber ?? '-'}</div>
            <div>Age: {row?.patientAge ?? '-'}</div>
            <div>Gender: {row?.patientObject?.sexAtBirth ?? '-'}</div>
          </Tooltip>
        );

        return (
          <Whisper trigger="hover" placement="top" speaker={speaker}>
            <div className="encounter-list__patient-name-cell">
              {row?.patientObject?.isPrivatePatient ? (
                <Badge color="blue" content="Private">
                  <p className="encounter-list__patient-name encounter-list__patient-name--clickable">
                    {row?.patientObject?.fullName}
                  </p>
                </Badge>
              ) : (
                <p className="encounter-list__patient-name encounter-list__patient-name--clickable">
                  {row?.patientObject?.fullName}
                </p>
              )}
            </div>
          </Whisper>
        );
      }
    },
    {
      key: 'transactionType',
      title: <Translate>TRANSACTION TYPE</Translate>,
      render: (rowData: any) => rowData?.transactionType ? formatEnumString(rowData?.transactionType) : '-'
    },
    {
      key: 'fromLocation',
      title: <Translate>FROM</Translate>,
      render: (rowData: any) => {
        const speaker = (
          <Tooltip>
            <div>Room: {rowData?.resolvedFromRoom?.name ?? '-'}</div>
            <div>Bed: {rowData?.resolvedFromBed?.name ?? '-'}</div>
            <div>Room ID: {rowData?.fromRoomId ?? '-'}</div>
            <div>Bed ID: {rowData?.fromBedId ?? '-'}</div>
          </Tooltip>
        );

        return (
          <Whisper trigger="hover" placement="top" speaker={speaker}>
            <span className="location-table-style">
              {rowData?.resolvedFromRoom?.name ?? '-'}
              <br />
              {rowData?.resolvedFromBed?.name ?? '-'}
            </span>
          </Whisper>
        );
      }
    },
    {
      key: 'toLocation',
      title: <Translate>TO</Translate>,
      render: (rowData: any) => {
        const speaker = (
          <Tooltip>
            <div>Room: {rowData?.resolvedToRoom?.name ?? '-'}</div>
            <div>Bed: {rowData?.resolvedToBed?.name ?? '-'}</div>
            <div>Room ID: {rowData?.toRoomId ?? '-'}</div>
            <div>Bed ID: {rowData?.toBedId ?? '-'}</div>
          </Tooltip>
        );

        return (
          <Whisper trigger="hover" placement="top" speaker={speaker}>
            <span className="location-table-style">
              {rowData?.resolvedToRoom?.name ?? '-'}
              <br />
              {rowData?.resolvedToBed?.name ?? '-'}
            </span>
          </Whisper>
        );
      }
    },
    {
      key: 'transactionDate',
      title: <Translate>TRANSACTION DATE</Translate>,
      render: (rowData: any) =>
        rowData?.transactionDate
          ? formatDateWithoutSeconds(rowData?.transactionDate)
          : '-'
    },
    {
      key: 'createdAt',
      title: 'CREATED BY/AT',
      expandable: true,
      render: (row: any) =>
        row?.createdDate ? (
          <>
            {row.createdBy}
            <br />
            <span className="date-table-style">{formatDateWithoutSeconds(row.createdDate)}</span>
          </>
        ) : (
          ' '
        )
    },
    {
      key: 'lastModified',
      title: 'LAST MODIFIED AT / BY',
      expandable: true,
      render: (row: any) =>
        row.lastModifiedDate ? (
          <>
            {row.lastModifiedBy}
            <br />
            <span className="date-table-style">
              {formatDateWithoutSeconds(row.lastModifiedDate)}
            </span>
          </>
        ) : null
    },
  ];

  const handlePageChange = (_: unknown, newPage: number) => {
    setManualSearchTriggered(true);
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setManualSearchTriggered(true);
    setPagination({
      page: 0,
      size: parseInt(event.target.value, 10)
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
        loading={tableLoading}
        sortColumn={sortState.sortBy}
        sortType={sortState.sortType as any}
        onSortChange={(sortBy, sortType) => {
          setSortState({
            sortBy,
            sortType
          });
          setPagination(prev => ({ ...prev, page: 0 }));
        }}
        page={pagination.page}
        rowsPerPage={pagination.size}
        totalCount={bedTransactionsResponse?.totalCount ?? 0}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
      />
    </Panel>
  );
};

export default BedTransactionsSecondTab;