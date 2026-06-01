import ChatModal from '@/components/ChatModal';
import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import MyTable, { ColumnConfig } from '@/components/MyTable/MyTable';
import { useAppSelector } from '@/hooks';
import EncounterAttachment from '@/pages/patient/patient-profile/tabs/Attachment-new/EncounterAttachment';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useLazyGetDiagnosticOrderByIdQuery } from '@/services/diagnosic-order/diagnosticOrderService';
import { useLazyGetDiagnosticOrderTestByIdQuery } from '@/services/diagnosic-order/diagnosticOrderTestService';
import {
  useGetDepartmentByFacilityQuery,
  useLazyGetDepartmentByIdQuery
} from '@/services/security/departmentService';
import {
  useCreateReportCommentMutation,
  useGetReportCommentsByReportIdQuery
} from '@/services/setup/diagnosticTest/diagnosticOrderTestReportCommentsService';
import {
  useApproveRadiologyReportMutation,
  useFilterRadiologyReportsQuery,
  useSecondApproveRadiologyReportMutation
} from '@/services/setup/diagnosticTest/diagnosticOrderTestReportService';
import { useLazyGetDiagnosticTestByIdQuery } from '@/services/setup/diagnosticTest/diagnosticTestService';
import { newDiagnosticOrderTestReportResponseVM } from '@/types/model-types-constructor-new';
import { formatDateWithoutSeconds, formatEnumString } from '@/utils';
import { notify } from '@/utils/uiReducerActions';
import {
  faCheckCircle,
  faClipboardCheck,
  faComment,
  faEnvelope,
  faFileLines,
  faPrint,
  faSheetPlastic
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { skipToken } from '@reduxjs/toolkit/query';
import React, { useEffect, useMemo, useState } from 'react';
import { MdAttachFile } from 'react-icons/md';
import { useDispatch } from 'react-redux';
import { Form, Tooltip, Whisper } from 'rsuite';
import AddReportModal from './AddReportModal';
import RadiologyImageLogModal from './RadiologyImageLogModal';
import './style.less';
import { useGetBulkPatientBasicInfoMutation } from '@/services/patient/patientService';
import { useGetUserFullNameByLoginQuery } from '@/services/userService';

type Props = {
  refetchAllRadData: () => Promise<void>;
};

const notifyFromApiError = (dispatch: any, e: any, fallbackMsg = 'Operation failed') => {
  const status = e?.status || e?.originalStatus || e?.data?.status;

  const message = e?.data?.message || e?.data?.detail || e?.error || fallbackMsg;

  if (status === 400 || status === 409 || status === 422) {
    dispatch(
      notify({
        msg: message,
        sev: 'warning'
      })
    );
    return;
  }

  dispatch(
    notify({
      msg: message,
      sev: 'error'
    })
  );
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

const RadiologyImageList = ({ refetchAllRadData }: Props) => {
  const dispatch = useDispatch();

  const selectedFacility = useAppSelector(state => state.auth?.tenant?.selectedFacility);

  const facilityIdForDepartments = selectedFacility?.id;

  const today = new Date();

  const [dateFilter, setDateFilter] = useState({
    fromDate: today,
    toDate: today
  });

  const [secondApproveReport, { isLoading: secondApproving }] =
    useSecondApproveRadiologyReportMutation();

  const [openLogsModal, setOpenLogsModal] = useState(false);
  const [selectedReportForLogs, setSelectedReportForLogs] = useState<any>(null);
  const [openReportEditor, setOpenReportEditor] = useState(false);
  const [selectedReportRow, setSelectedReportRow] = useState<any>(null);
  const [openComments, setOpenComments] = useState(false);
  const [selectedReportForComments, setSelectedReportForComments] = useState<any>(null);
  const [orderTestReport, setOrderTestReport] = useState<any>({
    ...newDiagnosticOrderTestReportResponseVM
  });

  const [selectedRowId, setSelectedRowId] = useState<number | string | null>(null);
  const [orderTestsMap, setOrderTestsMap] = useState<Record<string, any>>({});
  const [ordersMap, setOrdersMap] = useState<Record<string, any>>({});
  const [localHasCommentIds, setLocalHasCommentIds] = useState<(number | string)[]>([]);
  const [patientsMap, setPatientsMap] = useState<Record<string, any>>({});
  const [getBulkPatientBasicInfo] = useGetBulkPatientBasicInfoMutation();
  const [fetchOrderTestById] = useLazyGetDiagnosticOrderTestByIdQuery();
  const [fetchOrderById] = useLazyGetDiagnosticOrderByIdQuery();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortColumn, setSortColumn] = useState('id');
  const [sortType, setSortType] = useState<'asc' | 'desc'>('desc');
  const [filterRecord, setFilterRecord] = useState<any>({
    searchCriteria: 'patientName',
    value: ''
  });

  const [attachmentsModalOpen, setAttachmentsModalOpen] = useState(false);
  const attachmentsLocked = attachmentsModalOpen;
  const [selectedReportForAttachments, setSelectedReportForAttachments] = useState<any>(null);

  const [fetchDiagnosticTestById] = useLazyGetDiagnosticTestByIdQuery();
  const [testsMap, setTestsMap] = useState<Record<string, any>>({});

  const [departmentFilter, setDepartmentFilter] = useState<{
    departmentIds?: number[];
  }>({
    departmentIds: []
  });

  const { data: departmentsResponse, isFetching: isDepartmentsFetching } =
    useGetDepartmentByFacilityQuery(
      facilityIdForDepartments
        ? { facilityId: facilityIdForDepartments, page: 0, size: 100 }
        : skipToken
    );

  const departmentOptions =
    departmentsResponse?.data?.map(d => ({
      label: d.name,
      value: d.id
    })) ?? [];

  useEffect(() => {
    dispatch(setPageCode('Radiology_Image_List'));
    dispatch(setDivContent('Radiology Image List'));
  }, [dispatch]);

  const [approveRadiologyReport, { isLoading: approving }] = useApproveRadiologyReportMutation();

  const searchCriteriaOptions = [
    { label: 'Patient Name', value: 'patientName' },
    { label: 'MRN', value: 'mrn' }
  ];

  const shouldSearch =
    Boolean(filterRecord.searchCriteria) && filterRecord.value.trim().length >= 3;

  const { data, isFetching, refetch } = useFilterRadiologyReportsQuery(
    attachmentsLocked
      ? skipToken
      : {
          page,
          size: rowsPerPage,
          sort: `${sortColumn},${sortType}`,
          params: {
            imageStatusIn: ['FINISHED'],
            createdDateFrom: startOfDay(dateFilter.fromDate).toISOString(),
            createdDateTo: endOfDay(dateFilter.toDate).toISOString(),
            ...(departmentFilter.departmentIds?.length
              ? { fromDepartmentIn: departmentFilter.departmentIds }
              : {}),
            ...(shouldSearch ? { [filterRecord.searchCriteria]: filterRecord.value.trim() } : {})
          }
        }
  );

  const totalCount = data?.totalCount ?? 0;
  const [departmentsMap, setDepartmentsMap] = useState<Record<string, any>>({});
  const [fetchDepartmentById] = useLazyGetDepartmentByIdQuery();

  const {
    data: commentsResponse,
    isFetching: isCommentsFetching,
    refetch: refetchComments
  } = useGetReportCommentsByReportIdQuery(selectedReportForComments?.id ?? skipToken);

  const [createComment, { isLoading: isSendingComment }] = useCreateReportCommentMutation();

  const handleSendComment = async (value: string) => {
    if (!selectedReportForComments?.id) {
      dispatch(notify({ msg: 'Select a report first', sev: 'warning' }));
      return;
    }

    try {
      await createComment({
        reportId: selectedReportForComments.id,
        orderTestId: selectedReportForComments.orderTestId,
        note: value
      }).unwrap();

      dispatch(notify({ msg: 'Comment added successfully', sev: 'success' }));
      setLocalHasCommentIds(prev =>
        prev.includes(selectedReportForComments.id) ? prev : [...prev, selectedReportForComments.id]
      );

      refetchComments();
    } catch (e: any) {
      notifyFromApiError(dispatch, e, 'Failed to add comment');
    }
  };

  const tableData = data?.data ?? [];

  const uniqueNumbers = (ids: any[] = []): number[] => {
    return Array.from(
      new Set(ids.map(id => Number(id)).filter(id => Number.isFinite(id) && id > 0))
    );
  };

  const departmentIds = useMemo<number[]>(() => {
    return uniqueNumbers(
      Object.values(ordersMap ?? {}).map((order: any) => order?.fromDepartmentId)
    );
  }, [ordersMap]);

  const orderTestIds = useMemo<number[]>(() => {
    return uniqueNumbers((tableData ?? []).map((r: any) => r?.orderTestId));
  }, [tableData]);

  const orderIds = useMemo<number[]>(() => {
    return uniqueNumbers(Object.values(orderTestsMap ?? {}).map((ot: any) => ot?.orderId));
  }, [orderTestsMap]);

  const patientIds = useMemo<number[]>(() => {
    return uniqueNumbers(Object.values(ordersMap ?? {}).map((o: any) => o?.patientId));
  }, [ordersMap]);

  useEffect(() => {
    if (!orderTestIds.length) return;

    orderTestIds.forEach((id: number) => {
      if (orderTestsMap?.[id]) return;

      fetchOrderTestById(id)
        .unwrap()
        .then(ot => {
          if (!ot) return;

          setOrderTestsMap(prev => ({
            ...prev,
            [id]: ot
          }));
        })
        .catch(() => {});
    });
  }, [orderTestIds, fetchOrderTestById, orderTestsMap]);

  useEffect(() => {
    if (!orderIds.length) return;

    orderIds.forEach((id: number) => {
      if (ordersMap?.[id]) return;

      fetchOrderById(id)
        .unwrap()
        .then(order => {
          if (!order) return;

          setOrdersMap(prev => ({
            ...prev,
            [id]: order
          }));
        })
        .catch(() => {});
    });
  }, [orderIds, fetchOrderById, ordersMap]);

  useEffect(() => {
    if (!patientIds.length) {
      setPatientsMap({});
      return;
    }

    getBulkPatientBasicInfo(patientIds)
      .unwrap()
      .then((res: any[]) => {
        const map: Record<number, any> = {};

        res.forEach((p: any) => {
          if (!p?.id) return;

          map[p.id] = p;
        });

        setPatientsMap(map);
      })
      .catch(err => {
        console.error('❌ Bulk patient error:', err);
      });
  }, [patientIds, getBulkPatientBasicInfo]);

  const FilterModel = (
    <Form fluid className="table-header-content">
      <div className="filter-radiologist-worklist-main-container">
        <MyInput
          fieldType="select"
          fieldLabel="Search By"
          fieldName="searchCriteria"
          width="180px"
          selectData={searchCriteriaOptions}
          selectDataLabel="label"
          selectDataValue="value"
          searchable={false}
          record={filterRecord}
          setRecord={setFilterRecord}
        />

        <MyInput
          width="220px"
          fieldLabel={filterRecord.searchCriteria === 'mrn' ? 'MRN' : 'Patient Name'}
          fieldName="value"
          placeholder={filterRecord.searchCriteria === 'mrn' ? 'Search by MRN' : 'Search by name'}
          record={filterRecord}
          setRecord={rec => {
            setPage(0);
            setFilterRecord(rec);
          }}
        />

        <MyInput
          width={160}
          fieldType="date"
          fieldLabel="From Date"
          fieldName="fromDate"
          record={dateFilter}
          setRecord={rec => {
            setPage(0);
            setDateFilter(rec);
          }}
        />

        <MyInput
          width={160}
          fieldType="date"
          fieldLabel="To Date"
          fieldName="toDate"
          record={dateFilter}
          setRecord={rec => {
            setPage(0);
            setDateFilter(rec);
          }}
        />

        <MyInput
          fieldType="checkPicker"
          fieldLabel="Department"
          fieldName="departmentIds"
          width="260px"
          loading={isDepartmentsFetching}
          selectData={departmentOptions}
          selectDataLabel="label"
          selectDataValue="value"
          placeholder="Select Department(s)"
          searchable
          record={departmentFilter}
          setRecord={rec => {
            setPage(0);
            setDepartmentFilter(rec);
          }}
        />
      </div>
    </Form>
  );

  const handleApprove = async (row: any) => {
    if (!row?.id) return;

    try {
      await approveRadiologyReport(row.id).unwrap();

      dispatch(
        notify({
          msg: 'Report Approved successfully',
          sev: 'success'
        })
      );

      await refetchAllRadData();
      await refetch();
    } catch (e: any) {
      notifyFromApiError(dispatch, e, 'Approve Failed');
    }
  };

  const handleSecondApprove = async (row: any) => {
    if (!row?.id) return;

    try {
      await secondApproveReport(row.id).unwrap();

      dispatch(
        notify({
          msg: 'Report Second Approved successfully',
          sev: 'success'
        })
      );

      await refetchAllRadData();
      await refetch();
    } catch (e: any) {
      const backendMsg = e?.data?.message || e?.data?.detail || '';
      if (
        backendMsg.includes('different user') ||
        backendMsg.includes('Second approve must be performed')
      ) {
        dispatch(
          notify({
            msg: 'Second approval must be done by another radiologist',
            sev: 'warning'
          })
        );
        return;
      }
      notifyFromApiError(dispatch, e, 'Second Approve Failed');
    }
  };

const UserFullNameCell = ({ login }: { login?: string | null }) => {
  const { data: fullName } = useGetUserFullNameByLoginQuery(login!, {
    skip: !login
  });

  if (!login) {
    return <span>-</span>;
  }

  return <span>{fullName || login}</span>;
};

const UserDateCell = ({
  login,
  date
}: {
  login?: string | null;
  date?: string | null;
}) => {
  if (!login && !date) {
    return <span>-</span>;
  }

  return (
    <>
      <UserFullNameCell login={login} />
      <br />
      <span className="date-table-style">
        {date ? formatDateWithoutSeconds(date) : '-'}
      </span>
    </>
  );
};

  const columns: ColumnConfig[] = useMemo(
    () => [
      {
        key: 'department',
        title: 'Department',
        width: 160,
        render: row => {
          const orderTestId = Number(row?.orderTestId);
          const ot = orderTestsMap?.[orderTestId];
          const order = ordersMap?.[ot?.orderId];
          const department = departmentsMap?.[order?.fromDepartmentId];

          return department?.name ?? ' ';
        }
      },
      {
        key: 'patientName',
        title: 'Patient Name',
        width: 180,
        render: row => {
          const orderTestId = Number(row?.orderTestId);
          const ot = orderTestsMap?.[orderTestId];
          const order = ordersMap?.[ot?.orderId];
          const patient = patientsMap[String(order?.patientId)];
          return patient
            ? [patient.firstName, patient.secondName, patient.lastName].filter(Boolean).join(' ')
            : ' ';
        }
      },
      {
        key: 'mrn',
        title: 'MRN',
        width: 120,
        render: row => {
          const orderTestId = Number(row?.orderTestId);
          const ot = orderTestsMap?.[orderTestId];
          const order = ordersMap?.[ot?.orderId];
          const patient = patientsMap?.[order?.patientId];

          return patient?.medicalRecordNumber ?? ' ';
        }
      },
      {
        key: 'testName',
        title: 'Test Name',
        width: 200,
        render: row => {
          const orderTestId = Number(row?.orderTestId);
          const ot = orderTestsMap?.[orderTestId];
          const test = testsMap?.[ot?.testId];

          return test?.name ?? ' ';
        }
      },
      {
        key: 'report',
        title: 'Report',
        width: 80,
        align: 'center',
        render: row => {
          const reportContent =
            row?.report ??
            row?.reportText ??
            row?.findings ??
            row?.impression ??
            row?.conclusion ??
            row?.reportHtml ??
            '';

          const hasReport =
            typeof reportContent === 'string'
              ? reportContent.replace(/<[^>]*>/g, '').trim().length > 0
              : !!reportContent;

          return (
            <Whisper speaker={<Tooltip>Add Report</Tooltip>}>
              <span style={{ cursor: 'pointer' }}>
                <FontAwesomeIcon
                  className="icon-radiologist-worklist-size"
                  icon={faSheetPlastic}
                  style={{
                    color: hasReport ? '#1675e0' : '#969fb0'
                  }}
                  onClick={() => {
                    const ot = orderTestsMap[String(row.orderTestId)];

                    setSelectedReportRow(row);

                    setOrderTestReport({
                      ...newDiagnosticOrderTestReportResponseVM,
                      ...row,
                      diagnosticTestId: ot?.diagnosticTestId
                    });

                    setOpenReportEditor(true);
                  }}
                />
              </span>
            </Whisper>
          );
        }
      },
      {
        key: 'attachments',
        title: 'ATTACHMENTS',
        width: 90,
        align: 'center',
        render: (row: any) => {
          const ot = orderTestsMap[String(row.orderTestId)];

          return (
            <MdAttachFile
              size={20}
              fill={'var(--primary-gray)'}
              style={{ cursor: 'pointer' }}
              onClick={async () => {
                try {
                  let orderTest = ot;
                  if (!orderTest) {
                    orderTest = await fetchOrderTestById(row.orderTestId).unwrap();
                    setOrderTestsMap(prev => ({
                      ...prev,
                      [row.orderTestId]: orderTest
                    }));
                  }

                  if (!orderTest?.orderId) {
                    dispatch(notify({ msg: 'Order not found', sev: 'warning' }));
                    return;
                  }

                  let order = ordersMap[String(orderTest.orderId)];
                  if (!order) {
                    order = await fetchOrderById(orderTest.orderId).unwrap();
                    setOrdersMap(prev => ({
                      ...prev,
                      [orderTest.orderId]: order
                    }));
                  }

                  if (!order?.encounterId) {
                    dispatch(notify({ msg: 'Encounter not found', sev: 'warning' }));
                    return;
                  }

                  setSelectedReportForAttachments({
                    id: row.id,
                    orderTestId: row.orderTestId,
                    orderId: orderTest.orderId,
                    encounterId: order.encounterId
                  });

                  setAttachmentsModalOpen(true);
                } catch (e) {
                  notifyFromApiError(dispatch, e, 'Failed to load attachment data');
                }
              }}
            />
          );
        }
      },
      {
        key: 'comment',
        title: 'COMMENTS',
        width: 100,
        align: 'center',
        render: (row: any) => {
          const hasComment = !!row?.hasNote || localHasCommentIds.includes(row.id);
          return (
            <Whisper speaker={<Tooltip>Comments</Tooltip>}>
              <span style={{ cursor: 'pointer' }}>
                <FontAwesomeIcon
                  className="icon-radiologist-worklist-size"
                  icon={faComment}
                  style={{
                    color: hasComment ? '#1675e0' : '#999'
                  }}
                  onClick={() => {
                    setSelectedReportForComments(row);
                    setOpenComments(true);
                  }}
                />
              </span>
            </Whisper>
          );
        }
      },
      {
        key: 'status',
        title: 'Status',
        width: 120,
        render: row => formatEnumString(row.processingStatus)
      },
      {
        key: 'orderByAt',
        title: 'Order By / At',
        width: 200,
        render: row => (
          <UserDateCell
            login={row.createdBy}
            date={row.createdDate}
          />
        )
      },
      {
        key: 'icons',
        title: '',
        width: 160,
        align: 'center',
        render: row => {
          const canApprove = row.processingStatus === 'RESULT_READY';

          const canSecondApprove = row.processingStatus === 'RESULT_APPROVED';

          const isSecondApproved = !!row.secondApprovedDate;

          return (
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <Whisper speaker={<Tooltip>Approve</Tooltip>}>
                <span>
                  <FontAwesomeIcon
                    className="icon-radiologist-worklist-size"
                    icon={faCheckCircle}
                    style={{
                      cursor: canApprove ? 'pointer' : 'not-allowed',
                      opacity: canApprove ? 1 : 0.4,
                      color: canApprove ? '#969fb0' : '#999'
                    }}
                    onClick={() => {
                      if (!canApprove || approving) return;
                      handleApprove(row);
                    }}
                  />
                </span>
              </Whisper>
              <Whisper speaker={<Tooltip>Send by Email</Tooltip>}>
                <FontAwesomeIcon icon={faEnvelope} className="icon-radiologist-worklist-size" />
              </Whisper>
              <Whisper speaker={<Tooltip>Second Approval</Tooltip>}>
                <span>
                  <FontAwesomeIcon
                    icon={faClipboardCheck}
                    className="icon-radiologist-worklist-size"
                    style={{
                      cursor: canSecondApprove && !isSecondApproved ? 'pointer' : 'not-allowed',

                      opacity: isSecondApproved ? 1 : canSecondApprove ? 1 : 0.4,

                      color: isSecondApproved ? '#1675e0' : canSecondApprove ? '#969fb0' : '#999'
                    }}
                    onClick={() => {
                      if (!canSecondApprove || isSecondApproved || secondApproving) return;
                      handleSecondApprove(row);
                    }}
                  />
                </span>
              </Whisper>
              <Whisper speaker={<Tooltip>Print</Tooltip>}>
                <FontAwesomeIcon className="icon-radiologist-worklist-size" icon={faPrint} />
              </Whisper>
              <Whisper speaker={<Tooltip>Logs</Tooltip>}>
                <span>
                  <FontAwesomeIcon
                    icon={faFileLines}
                    className="icon-radiologist-worklist-size"
                    style={{ cursor: 'pointer', opacity: 0.8 }}
                    onClick={() => {
                      setSelectedReportForLogs(row);
                      setOpenLogsModal(true);
                    }}
                  />
                </span>
              </Whisper>
            </div>
          );
        }
      }
    ],
    [
      orderTestsMap,
      ordersMap,
      patientsMap,
      departmentsMap,
      testsMap,
      localHasCommentIds,
      approving,
      secondApproving
    ]
  );

  useEffect(() => {
    departmentIds.forEach(id => {
      if (departmentsMap[id]) return;

      fetchDepartmentById(id)
        .unwrap()
        .then(dep => {
          if (!dep) return;
          setDepartmentsMap(prev => ({
            ...prev,
            [id]: dep
          }));
        })
        .catch(() => {});
    });
  }, [departmentIds, fetchDepartmentById, departmentsMap]);

  useEffect(() => {
    setPage(0);
  }, [dateFilter.fromDate, dateFilter.toDate]);

  const selectedOrderTest = selectedReportRow
    ? orderTestsMap[String(selectedReportRow.orderTestId)]
    : undefined;

  const selectedOrder = selectedOrderTest
    ? ordersMap[String(selectedOrderTest.orderId)]
    : undefined;

  const selectedEncounter = useMemo(() => {
    return selectedReportForAttachments?.encounterId
      ? { id: Number(selectedReportForAttachments.encounterId) }
      : undefined;
  }, [selectedReportForAttachments]);

  useEffect(() => {
    orderTestIds.forEach(id => {
      const ot = orderTestsMap[id];
      if (!ot?.testId || testsMap[ot.testId]) return;

      fetchDiagnosticTestById(ot.testId)
        .unwrap()
        .then(response => {
          if (!response?.data) return;

          setTestsMap(prev => ({
            ...prev,
            [ot.testId]: response.data
          }));
        })
        .catch(() => {});
    });
  }, [orderTestsMap]);

  const isSelected = (rowData: any) =>
    rowData && selectedReportRow && rowData.id === selectedReportRow.id
      ? 'selected-row'
      : '';

  // Direction handling for RTL/LTR
  const direction = localStorage.getItem('direction') || 'LTR';
  const isRTL = direction === 'RTL';

  const dir = isRTL ? 'rtl' : 'ltr';

  return (

    <div dir={dir} className='radiologist-worklist-table-size'>
      <MyTable
        data={tableData}
        columns={columns}
        loading={isFetching}
        filters={FilterModel}
        page={page}
        rowsPerPage={rowsPerPage}
        totalCount={totalCount}
        sortColumn={sortColumn}
        sortType={sortType}
        rowClassName={isSelected}
        onRowClick={(rowData: any) => {
          setSelectedReportRow(rowData);
          setOrderTestReport({
            ...newDiagnosticOrderTestReportResponseVM,
            ...rowData
          });
        }}
        onSortChange={(col, type) => {
          setSortColumn(col);
          setSortType(type);
        }}
        onPageChange={(_, newPage) => setPage(newPage)}
        onRowsPerPageChange={e => {
          setRowsPerPage(Number(e.target.value));
          setPage(0);
        }}
      />

      {openReportEditor && (
        <AddReportModal
          open={openReportEditor}
          setOpen={setOpenReportEditor}
          report={orderTestReport}
          orderTest={selectedOrderTest}
          order={selectedOrder}
          setReport={setOrderTestReport}
          resultFetch={refetchAllRadData}
          attachmentRefetch={refetchAllRadData}
        />
      )}

      <ChatModal
        open={openComments}
        setOpen={setOpenComments}
        title="Report Comments"
        list={commentsResponse ?? []}
        fieldShowName="note"
        handleSendMessage={handleSendComment}
      />

      <RadiologyImageLogModal
        open={openLogsModal}
        setOpen={setOpenLogsModal}
        report={selectedReportForLogs}
      />

      <MyModal
        open={attachmentsModalOpen && !!selectedEncounter}
        setOpen={setAttachmentsModalOpen}
        title="Attachments - Report"
        size="lg"
        hideActionBtn
        content={
          selectedEncounter && (
            <div dir={dir}>
              <EncounterAttachment
                localEncounter={selectedEncounter}
                source="RADIOLOGIST_WORKLIST_ATTACHMENT"
                sourceId={Number(selectedReportForAttachments?.id)}
                refetchAttachmentList={false}
                setRefetchAttachmentList={() => {}}
              />
            </div>
          )
        }
      />
    </div>
  );
};

export default RadiologyImageList;
