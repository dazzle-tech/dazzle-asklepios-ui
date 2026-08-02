import AdvancedSearchFilters from '@/components/AdvancedSearchFilters';
import ChatModal from '@/components/ChatModal';
import MyInput from '@/components/MyInput';
import MyTable from '@/components/MyTable';
import { ColumnConfig } from '@/components/MyTable/MyTable';
import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import {
    useLazyFilterDiagnosticOrdersQuery,
    useLazyGetDiagnosticOrderByIdQuery
} from '@/services/diagnosic-order/diagnosticOrderService';
import {
    useLazyGetDiagnosticOrderTestByIdQuery
} from '@/services/diagnosic-order/diagnosticOrderTestService';
import { useLazyGetEncounterByIdQuery } from '@/services/encounters/patientEncounterService';
import { useGetBulkPatientBasicInfoMutation } from '@/services/patient/patientService';
import {
    useCreateReportCommentMutation,
    useGetReportCommentsByReportIdQuery
} from '@/services/setup/diagnosticTest/diagnosticOrderTestReportCommentsService';
import {
    useFilterRadiologyReportsQuery,
    useReviewRadiologyReportMutation
} from '@/services/setup/diagnosticTest/diagnosticOrderTestReportService';
import {
    useLazyGetDiagnosticTestByIdQuery
} from '@/services/setup/diagnosticTest/diagnosticTestService';
import { notify } from '@/utils/uiReducerActions';
import { faComment, faFileLines, faStar } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { skipToken } from '@reduxjs/toolkit/query';
import React, { useEffect, useMemo, useState } from 'react';
import { Checkbox, Form, Tooltip, Whisper } from 'rsuite';
import AddReportModal from './radiologist-worklist/AddReportModal';
import '@/pages/lab-module-new/ReviewResultsIcon.less';
import PatientSearch from '@/components/PatientSearch';
import { useGetAllDepartmentsWithoutPaginationQuery } from '@/services/security/departmentService';
import UserDateCell from '@/components/UserDateCell';
import './styles.less'
const startOfDay = (d: Date) => {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
};

const endOfDay = (d: Date) => {
    const x = new Date(d);
    x.setHours(23, 59, 59, 999);
    return x;
};

const notifyFromApiError = (dispatch: any, e: any, fallbackMsg = 'Operation failed') => {
    const status =
        e?.status ||
        e?.originalStatus ||
        e?.data?.status;

    const message =
        e?.data?.message ||
        e?.data?.detail ||
        e?.error ||
        fallbackMsg;

    if (
        status === 400 ||
        status === 409 ||
        status === 422
    ) {
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

const ReviewReport = ({ user, setEncounter, setPatient }) => {
    const dispatch = useAppDispatch();
    const today = new Date();
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [approvalDate, setApprovalDate] = useState({
        fromDate: today,
        toDate: today
    });
    const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
    const [orderDate, setOrderDate] = useState({
        fromDate: null,
        toDate: null
    });
    const [getBulkPatientBasicInfo] = useGetBulkPatientBasicInfoMutation();
    const [orderIdIn, setOrderIdIn] = useState<number[] | null>(null);
    const [selectedReport, setSelectedReport] = useState<any>(null);
    const [openComments, setOpenComments] = useState(false);
    const [openReportModal, setOpenReportModal] = useState(false);
    const [orderTestsMap, setOrderTestsMap] = useState<Record<string, any>>({});
    const [ordersMap, setOrdersMap] = useState<Record<string, any>>({});
    const [patientsMap, setPatientsMap] = useState<Record<string, any>>({});
    const [testsMap, setTestsMap] = useState<Record<string, any>>({});
    const [showReviewed, setShowReviewed] = useState(false);
    const [fetchOrderTestById] = useLazyGetDiagnosticOrderTestByIdQuery();
    const [fetchOrderById] = useLazyGetDiagnosticOrderByIdQuery();
    const [fetchDiagnosticTestById] = useLazyGetDiagnosticTestByIdQuery();
    const [fetchOrders] = useLazyFilterDiagnosticOrdersQuery();
    const [fetchEncounterById] = useLazyGetEncounterByIdQuery();
    const [localHasCommentIds, setLocalHasCommentIds] = useState<(number | string)[]>([]);
    const [filtersKey, setFiltersKey] = useState(0);

    const [selectedPatient, setSelectedPatient] = useState<any>(null);

    const [departmentFilter, setDepartmentFilter] = useState<any>({
    fromDepartmentIdIn: null
    });

    const [orderIdFilter, setOrderIdFilter] = useState('');
        
    const [
        createComment, { isLoading: isSendingComment }] = useCreateReportCommentMutation();

    const isSelected = (row: any) =>
        selectedReportId === row.id ? 'selected-row' : '';

    const queryParams: any = {
        processingStatus: 'RESULT_APPROVED',
        reviewed: showReviewed,
        ...(approvalDate.fromDate
            ? { approvedDateFrom: startOfDay(approvalDate.fromDate).toISOString() }
            : {}),
        ...(approvalDate.toDate
            ? { approvedDateTo: endOfDay(approvalDate.toDate).toISOString() }
            : {})
    };

if (
    selectedPatient?.id ||
    departmentFilter?.fromDepartmentIdIn ||
    orderDate.fromDate ||
    orderDate.toDate
) {
    queryParams.orderIdIn =
        orderIdIn && orderIdIn.length > 0 ? orderIdIn : [-1];
}

const orderIdNumber = Number(orderIdFilter);

if (
  orderIdFilter.trim() &&
  Number.isFinite(orderIdNumber)
) {
  queryParams.orderNumber = orderIdNumber;
}

    const { data, isFetching, refetch } =
        useFilterRadiologyReportsQuery({
            page,
            size: rowsPerPage,
            sort: 'id,desc',
            params: queryParams
        });

    const reports = data?.data ?? [];
    const totalCount = data?.totalCount ?? 0;

        const normalizedReports = useMemo(() => {
            return reports.map(report => {
                const orderTest =
                    orderTestsMap[String(report.orderTestId)];

                const order =
                    ordersMap[String(orderTest?.orderId)];

                const patient =
                    patientsMap[String(order?.patientId)];

                console.log({
                    reportId: report.id,
                    orderTestId: report.orderTestId,
                    orderId: order?.id,
                    patientId: order?.patientId,
                    patientName: patient?.fullName
                });

                return {
                    ...report,
                    _patientName: patient
                        ? [
                            patient.firstName,
                            patient.secondName,
                            patient.lastName
                        ]
                            .filter(Boolean)
                            .join(' ')
                        : '—',
                    _order: order,
                    _orderTest: orderTest
                };
            });
        }, [
            reports,
            orderTestsMap,
            ordersMap,
            patientsMap
        ]);


    const [reviewReport] = useReviewRadiologyReportMutation();

    const handleReview = async (row: any) => {
        try {
            await reviewReport({
                orderTestId: row.orderTestId
            }).unwrap();

            dispatch(notify({ msg: 'Reviewed successfully', sev: 'success' }));

            refetch();
        } catch {
            dispatch(notify({ msg: 'Review failed', sev: 'error' }));
        }
    };

    const orderTestIds = useMemo(
        () =>
            reports
                .map(r => r.orderTestId)
                .filter(Boolean)
                .map(String)
                .filter((id, i, arr) => arr.indexOf(id) === i),
        [reports]
    );

    const testIds = useMemo(
        () =>
            Object.values(orderTestsMap)
                .map((ot: any) => ot?.testId)
                .filter(Boolean)
                .map(String)
                .filter((id, i, arr) => arr.indexOf(id) === i),
        [orderTestsMap]
    );

    const patientIds = useMemo(
        () =>
            Object.values(ordersMap)
                .map((o: any) => o?.patientId)
                .filter(Boolean)
                .map(String)
                .filter((id, i, arr) => arr.indexOf(id) === i),
        [ordersMap]
    );

    const { data: departmentsList = [] } =
    useGetAllDepartmentsWithoutPaginationQuery();

    const {
        data: comments,
        refetch: refetchComments
    } = useGetReportCommentsByReportIdQuery(
        selectedReport?.id ?? skipToken
    );

    const closeModal = () => {
        setOpenReportModal(false);
        setSelectedReport(null);
    };

    const handleSendComment = async (value: string) => {
        if (!selectedReport?.id) {
            dispatch(notify({ msg: 'Select a report first', sev: 'warning' }));
            return;
        }

        try {
            await createComment({
                reportId: selectedReport.id,
                orderTestId: selectedReport.orderTestId,
                note: value
            }).unwrap();

            dispatch(
                notify({ msg: 'Comment added successfully', sev: 'success' })
            );

            setLocalHasCommentIds(prev =>
                prev.includes(selectedReport.id)
                    ? prev
                    : [...prev, selectedReport.id]
            );

            refetchComments();

        } catch (e: any) {
            notifyFromApiError(dispatch, e, 'Failed to add comment');
        }
    };

    useEffect(() => {
        if (!patientIds.length) return;

        const numericIds = patientIds.map(id => Number(id));

        getBulkPatientBasicInfo(numericIds)
            .unwrap()
            .then((res: any[]) => {
                const map: Record<string, any> = {};

                res.forEach((patient: any) => {
                    map[String(patient.id)] = patient;
                });

                setPatientsMap(map);
            })
            .catch(err => {
                console.error("❌ Bulk patient error:", err);
            });

    }, [patientIds]);

    const columns: ColumnConfig[] = useMemo(
        () => [
            {
                key: 'patient',
                title: <Translate>PATIENT NAME</Translate>,
                render: (row: any) => row._patientName
            },
            {
                key: 'test',
                title: <Translate>Test</Translate>,
                render: row => {
                    const ot = orderTestsMap[String(row.orderTestId)];
                    if (!ot) return '—';

                    const test = testsMap[String(ot.testId)];
                    return test?.name ?? test?.testName ?? '—';
                }
            },
            {
                key: 'report',
                title: <Translate>Report</Translate>,
                align: 'center',
                render: row => (
                    <FontAwesomeIcon
                        icon={faFileLines}
                        className='icon-radiologist-worklist-size'
                        style={{ cursor: 'pointer' }}
                        onClick={() => {
                            setSelectedReport(row);
                            setOpenReportModal(true);
                        }}
                    />
                )
            },
            {
                key: 'comment',
                title: 'COMMENTS',
                width: 100,
                align: 'center',
                render: (row: any) => {
                    const hasComment =
                        !!row?.hasNote || localHasCommentIds.includes(row.id);

                    return (
                        <Whisper speaker={<Tooltip>Comments</Tooltip>}>
                            <span style={{ cursor: 'pointer' }}>
                                <FontAwesomeIcon
                                    className='icon-radiologist-worklist-size'
                                    icon={faComment}
                                    style={{
                                        color: hasComment ? '#1675e0' : '#999'
                                    }}
                                    onClick={() => {
                                        setSelectedReport(row);
                                        setOpenComments(true);
                                    }}
                                />
                            </span>
                        </Whisper>
                    );
                }
            },
            {
                key: 'review',
                title: <Translate>Review</Translate>,
                align: 'center',
                render: row => {
                    const isReviewed = !!(row.reviewed || row.reviewDate);

                    return (
                        <Whisper speaker={<Tooltip>Review</Tooltip>}>
                            <FontAwesomeIcon
                                icon={faStar}
                                className={`review-icon-base ${isReviewed ? 'review-icon-reviewed' : 'review-icon-unreviewed'
                                    }`}
                                onClick={() => {
                                    handleReview(row);
                                }} />
                        </Whisper>
                    );
                }
            },
            {
                key: 'reviewDate',
                title: <Translate>Review Date</Translate>,
                render: row => {
                    if (!row.reviewDate) return '—';
                    const date = new Date(row.reviewDate);
                    return date.toLocaleString();
                }
            },
            {
                key: 'reviewDate',
                title: 'Review By/At',
                expandable: true,
                flexGrow: 2,
                render: (row: any) => (
                    <UserDateCell
                        login={row.reviewBy}
                        date={row.reviewDate}
                    />
                )
            },
        ],
        [orderTestsMap, ordersMap, patientsMap, testsMap, localHasCommentIds]
    );

    const resetFilters = () => {
        const today = new Date();

        setApprovalDate({
            fromDate: new Date(today),
            toDate: new Date(today)
        });

        setOrderDate({
            fromDate: null,
            toDate: null
        });

        setShowReviewed(false);
        setOrderIdIn(null);
        setPage(0);
        setSelectedPatient(null);

        setDepartmentFilter({
        fromDepartmentIdIn: null
        });

        setOrderIdFilter('');
        setFiltersKey(prev => prev + 1);
    };

    const filters = (
        <Form fluid key={filtersKey}>
            <div className="report-review-results-filters-main-container">
                <MyInput
                    fieldType="date"
                    fieldLabel="Approval From Date"
                    fieldName="fromDate"
                    record={approvalDate}
                    setRecord={setApprovalDate}
                />

                <MyInput
                    fieldType="date"
                    fieldLabel="Approval To Date"
                    fieldName="toDate"
                    record={approvalDate}
                    setRecord={setApprovalDate}
                />

                <MyInput
                    fieldType="date"
                    fieldLabel="Order From Date"
                    fieldName="fromDate"
                    record={orderDate}
                    setRecord={setOrderDate}
                />

                <MyInput
                    fieldType="date"
                    fieldLabel="Order To Date"
                    fieldName="toDate"
                    record={orderDate}
                    setRecord={setOrderDate}
                />
                <div className="reviewed-reports-filters" style={{ marginTop: '1.4vw' }}>

                    <PatientSearch
                    value={selectedPatient}
                    onChange={setSelectedPatient}
                    showLabel={false}
                    width="22vw"
                    containerMinWidth={250}
                    />

                    <MyInput
                    width="12vw"
                    placeholder="Department Name"
                    fieldType="select"
                    fieldName="fromDepartmentIdIn"
                    record={departmentFilter}
                    setRecord={setDepartmentFilter}
                    selectData={departmentsList}
                    selectDataLabel="name"
                    selectDataValue="id"
                    showLabel={false}
                    cleanable
                    />

                    <MyInput
                    fieldType="text"
                    fieldName="orderId"
                    placeholder="Order ID"
                    showLabel={false}
                    record={{ orderId: orderIdFilter }}
                    setRecord={(record: any) => {
                        setOrderIdFilter(record.orderId ?? '');
                        setPage(0);
                    }}
                    />
                </div>

                <div style={{ marginTop: '1.4vw' }}>
                    <Checkbox
                        checked={showReviewed}
                        onChange={(_, checked) => setShowReviewed(checked)}
                    >
                        <Translate>Show Reviewed Report</Translate>
                    </Checkbox>
                </div>
            </div>

            <AdvancedSearchFilters
                searchFilter={false}
                showAdvancedButton={false}
                clearOnClick={resetFilters}
            />
        </Form>
    );

    useEffect(() => {
        orderTestIds.forEach(id => {
            if (orderTestsMap[id]) return;

            fetchOrderTestById(Number(id))
                .unwrap()
                .then(ot => {
                    if (!ot) return;
                    setOrderTestsMap(prev => ({ ...prev, [id]: ot }));
                })
                .catch(() => { });
        });
    }, [orderTestIds]);

    useEffect(() => {
        testIds.forEach(id => {
            if (testsMap[id]) return;

            fetchDiagnosticTestById(Number(id))
                .unwrap()
                .then(res => {
                    const test = res?.data;
                    if (!test) return;

                    setTestsMap(prev => ({ ...prev, [id]: test }));
                }).catch(() => { });
        });
    }, [testIds]);

    useEffect(() => {
        Object.values(orderTestsMap).forEach((ot: any) => {
            const orderId = ot?.orderId;
            if (!orderId) return;
            if (ordersMap[orderId]) return;

            fetchOrderById(Number(orderId))
                .unwrap()
                .then(order => {
                    if (!order) return;
                    setOrdersMap(prev => ({
                        ...prev,
                        [String(order.id)]: order
                    }));
                })
                .catch(() => { });
        });
    }, [orderTestsMap]);

        console.log('Radiology queryParams', queryParams);


    useEffect(() => {
        const { fromDate, toDate } = orderDate;
        if (
            !fromDate &&
            !toDate &&
            !selectedPatient?.id &&
            !departmentFilter?.fromDepartmentIdIn
        ) {
            setOrderIdIn(null);
            return;
        }

            fetchOrders({
            submittedDateFrom: fromDate
                ? startOfDay(fromDate).toISOString()
                : undefined,

            submittedDateTo: toDate
                ? endOfDay(toDate).toISOString()
                : undefined,

            ...(selectedPatient?.id
                ? { patientIdIn: [selectedPatient.id] }
                : {}),

            ...(departmentFilter?.fromDepartmentIdIn
                ? {
                    fromDepartmentIdIn: [
                    Number(departmentFilter.fromDepartmentIdIn)
                    ]
                }
                : {}),

            page: 0,
            size: 10000
            })
            .unwrap()
            .then(res => {
                const ids = (res?.data ?? [])
                    .map((order: any) => Number(order.id))
                    .filter((id: number) => Number.isFinite(id));

                setOrderIdIn(ids);
            })
            .catch(() => setOrderIdIn([]));
    }, [
  orderDate,
  selectedPatient?.id,
  departmentFilter?.fromDepartmentIdIn
]);

    useEffect(() => {
        setPage(0);
    }, [
        approvalDate,
        orderDate,
        showReviewed,
        selectedPatient?.id,
        departmentFilter?.fromDepartmentIdIn,
        orderIdFilter
        ]);


    // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';


    return (
        <div dir={dir}>
            <MyTable
                filters={filters}
                columns={columns}
                data={normalizedReports}
                loading={isFetching}
                page={page}
                rowsPerPage={rowsPerPage}
                totalCount={totalCount}
                rowClassName={isSelected}
                onPageChange={(_, p) => setPage(p)}
                onRowsPerPageChange={e => {
                    setRowsPerPage(+e.target.value);
                    setPage(0);
                }}
                onRowClick={async (row: any) => {
                    setSelectedReportId(row.id);

                    const order = row._order;
                    if (!order) return;

                    const rawPatient = patientsMap[String(order.patientId)];
                    if (!rawPatient) return;

                    setPatient(rawPatient);

                    const encounterId = order?.encounterId;
                    if (!encounterId) {
                        setEncounter(null);
                        return;
                    }

                    try {
                        const encounter = await fetchEncounterById({ id: encounterId }).unwrap();
                        setEncounter(encounter);
                    } catch (err) {
                        console.error('Failed to fetch encounter', err);
                        setEncounter(null);
                    }
                }}
            />

            <ChatModal
                open={openComments}
                setOpen={setOpenComments}
                title="Comments"
                list={comments ?? []}
                fieldShowName="note"
                handleSendMessage={handleSendComment}
            />

            {openReportModal && selectedReport && (
                <AddReportModal
                    key={selectedReport.id}
                    open={openReportModal}
                    setOpen={closeModal}
                    report={selectedReport}
                    setReport={setSelectedReport}
                    disableEdit
                    disableDefaultTemplate
                />
            )}
        </div>
    );
};

export default ReviewReport;