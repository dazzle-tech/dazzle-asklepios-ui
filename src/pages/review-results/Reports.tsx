import React, { useEffect, useMemo, useState } from 'react';
import { Checkbox, Form, HStack, Tooltip, Whisper } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faComment, faFileLines, faStar } from '@fortawesome/free-solid-svg-icons';
import MyInput from '@/components/MyInput';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import ChatModal from '@/components/ChatModal';
import { notify } from '@/utils/uiReducerActions';
import { useAppDispatch } from '@/hooks';
import {
    useFilterRadiologyReportsQuery,
    useReviewRadiologyReportMutation
} from '@/services/setup/diagnosticTest/diagnosticOrderTestReportService';
import {
    useLazyGetDiagnosticTestByIdQuery
} from '@/services/setup/diagnosticTest/diagnosticTestService';
import {
    useGetReportCommentsByReportIdQuery,
    useCreateReportCommentMutation
} from '@/services/setup/diagnosticTest/diagnosticOrderTestReportCommentsService';
import { skipToken } from '@reduxjs/toolkit/query';
import AddReportModal from '../rad-module/radiologist-worklist/AddReportModal';
import {
    useLazyGetDiagnosticOrderTestByIdQuery
} from '@/services/diagnosic-order/diagnosticOrderTestService';
import {
    useLazyGetDiagnosticOrderByIdQuery
} from '@/services/diagnosic-order/diagnosticOrderService';
import { useLazyGetPatientByIdQuery } from '@/services/patientService';
import {
  useLazyFilterDiagnosticOrdersQuery
} from '@/services/diagnosic-order/diagnosticOrderService';

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

const ReviewReport = ({ user }) => {
    const dispatch = useAppDispatch();
    const today = new Date();
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [approvalDate, setApprovalDate] = useState({
        fromDate: today,
        toDate: today
    });

    const [orderDate, setOrderDate] = useState({
        fromDate: null,
        toDate: null
    });

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
    const [fetchPatientById] = useLazyGetPatientByIdQuery();
    const [fetchDiagnosticTestById] = useLazyGetDiagnosticTestByIdQuery();
    const [fetchOrders] = useLazyFilterDiagnosticOrdersQuery();


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
    if (orderDate.fromDate || orderDate.toDate) {
    if (orderIdIn && orderIdIn.length > 0) {
        queryParams.orderIdIn = orderIdIn;
    } else {
        queryParams.orderIdIn = [-1];
    }
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

    const {
        data: comments,
        refetch: refetchComments
    } = useGetReportCommentsByReportIdQuery(
        openComments && selectedReport?.id
            ? selectedReport.id
            : skipToken
    );

    const [createComment] = useCreateReportCommentMutation();

    const handleSendComment = async (value: string) => {
        try {
            await createComment({
                reportId: selectedReport.id,
                orderTestId: selectedReport.orderTestId,
                note: value
            }).unwrap();

            dispatch(notify({ msg: 'Comment sent', sev: 'success' }));
            refetchComments();
        } catch {
            dispatch(notify({ msg: 'Send failed', sev: 'error' }));
        }
    };

    const closeModal = () => {
        setOpenReportModal(false);
        setSelectedReport(null);
    };

    const columns = useMemo(
        () => [
            {
                key: 'patient',
                title: <Translate>Patient</Translate>,
                render: row => {
                    const ot = orderTestsMap[String(row.orderTestId)];
                    if (!ot) return '—';

                    const order = ordersMap[String(ot.orderId)];
                    if (!order) return '—';

                    const patient = patientsMap[String(order.patientId)];
                    return patient?.fullName ?? '—';
                }
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
                        style={{ cursor: 'pointer' }}
                        onClick={() => {
                            setSelectedReport(row);
                            setOpenReportModal(true);
                        }}
                    />
                )
            },
            {
                key: 'comments',
                title: <Translate>Comments</Translate>,
                align: 'center',
                render: row => (
                    <FontAwesomeIcon
                        icon={faComment}
                        style={{ cursor: 'pointer' }}
                        onClick={() => {
                            setSelectedReport(row);
                            setOpenComments(true);
                        }}
                    />
                )
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
                                style={{
                                    cursor: isReviewed ? 'default' : 'pointer',
                                    color: isReviewed ? '#ffea00' : '#999',
                                    opacity: isReviewed ? 1 : 0.6
                                }}
                                onClick={() => {
                                    if (!isReviewed) {
                                        handleReview(row);
                                    }
                                }}
                            />
                        </Whisper>
                    );
                }
            }
        ],
        [orderTestsMap, ordersMap, patientsMap, testsMap]
    );

    const filters = (
        <Form fluid>
            <div className="report-review-results-filters-main-container">

                {/* ✅ Approval Date */}
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

                {/* ✅ Order Date */}
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

                <div style={{ marginTop: '1.4vw' }}>
                    <Checkbox
                        checked={showReviewed}
                        onChange={(_, checked) => setShowReviewed(checked)}
                    >
                        Show Reviewed Report
                    </Checkbox>
                </div>
            </div>
        </Form>
    );

    console.log('showReviewedOnly', showReviewed);

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
        patientIds.forEach(id => {
            if (patientsMap[id]) return;

            fetchPatientById(id)
                .unwrap()
                .then(patient => {
                    if (!patient) return;
                    setPatientsMap(prev => ({ ...prev, [id]: patient }));
                })
                .catch(() => { });
        });
    }, [patientIds]);

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
        .catch(() => {});
    });
    }, [orderTestsMap]);

    useEffect(() => {
    const { fromDate, toDate } = orderDate;
    if (!fromDate && !toDate) {
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
        page: 0,
        size: 10000
    })
        .unwrap()
        .then(res => {
        const ids = (res?.data ?? []).map((o: any) => o.id);
        setOrderIdIn(ids);
        })
        .catch(() => setOrderIdIn([]));
    }, [orderDate]);


    useEffect(() => {
    setPage(0);
    }, [approvalDate, orderDate, showReviewed]);


    return (
        <>
            <MyTable
                filters={filters}
                columns={columns}
                data={reports}
                loading={isFetching}
                page={page}
                rowsPerPage={rowsPerPage}
                totalCount={totalCount}
                onPageChange={(_, p) => setPage(p)}
                onRowsPerPageChange={e => {
                    setRowsPerPage(+e.target.value);
                    setPage(0);
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
                    orderTestId={selectedReport.orderTestId}
                    disableEdit
                    disableDefaultTemplate
                />

            )}

        </>
    );
};

export default ReviewReport;
