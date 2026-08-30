import React, { useEffect, useMemo, useRef, useState } from 'react';

import MyTab from '@/components/MyTab';
import DetailsCard from '@/components/DetailsCard';
import PatientSide from '@/pages/encounter/encounter-main-info-section/PatienSide';

import { useAppDispatch } from '@/hooks';
import { setDivContent, setPageCode } from '@/reducers/divSlice';

import { useGetBulkPatientBasicInfoMutation } from '@/services/patient/patientService';
import { useLazyGetEncounterByIdQuery } from '@/services/encounters/patientEncounterService';

import { newApDiagnosticOrders, newApDiagnosticOrderTests } from '@/types/model-types-constructor';
import { newPatient, newPatientEncounter } from '@/types/model-types-constructor-new';

import { DiagnosticOrderTestStatus } from '@/types/model-types-new';
import MyModal from '@/components/MyModal/MyModal';
import {
    faClock,
    faRectangleList,
    faTriangleExclamation,
    faVialCircleCheck,
    faPrint
} from '@fortawesome/free-solid-svg-icons';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import Orders from './Orders';
import SampleModal from '@/pages/lab-module-new/SampleModal';
import PrintSampleLabelAction from '@/pages/lab-module-new/PrintSampleLabelAction';

import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';

import { useFilterDiagnosticOrderTestsQuery } from '@/services/diagnosic-order/diagnosticOrderTestService';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';

import { useGetDiagnosticTestsByIdsQuery } from '@/services/setup/diagnosticTest/diagnosticTestService';
import { useGetAllLaboratoriesQuery } from '@/services/setup/diagnosticTest/laboratoryService';
import { skipToken } from '@reduxjs/toolkit/query';

import '@/pages/appointments-new/scheduling-screen/styles.less';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import PatientSearch from '@/components/PatientSearch';
import { useGetDepartmentByTypeAndFacilityAndActiveQuery } from '@/services/security/departmentService';
import { extractPaginationFromLink } from '@/utils/paginationHelper';

type CollectSambleModalProps = {
    open: boolean;
    setOpen: React.Dispatch<React.SetStateAction<boolean>>;
    facilityId?: number | string;
};

const CollectSambleModal = ({
    open,
    setOpen,
    facilityId
}: CollectSambleModalProps) => {

    const dispatch = useAppDispatch();

    const OrdersRef = useRef<any>(null);

    const [mainActiveTab, setMainActiveTab] = useState('1');

    const [order, setOrder] = useState<any>({
        ...newApDiagnosticOrders
    });

    const [test, setTest] = useState<any>({
        ...newApDiagnosticOrderTests
    });

    const [patient, setPatient] = useState({
        ...newPatient
    });

    const [encounter, setEncounter] = useState({
        ...newPatientEncounter
    });

    const [openCollectSample, setOpenCollectSample] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState<any>(null);
    const [orderNumberFilter, setOrderNumberFilter] = useState('');
    const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | null>(null);

    const today = new Date();

    const [dateFilter, setDateFilter] = useState({
        fromDate: today,
        toDate: today
    });

    const [paginationParams, setPaginationParams] = useState({
        page: 0,
        size: 5,
        sort: 'testId,asc'
    });

    const [deptPage, setDeptPage] = useState(0);

    const { data: departmentsResponse } =
        useGetDepartmentByTypeAndFacilityAndActiveQuery(
            facilityId
                ? {
                    type: 'LABORATORY',
                    facilityId,
                    page: deptPage,
                    size: 10
                }
                : skipToken
        );

    const departmentsList = departmentsResponse?.data ?? [];

    useEffect(() => {
        if (!departmentsList.length || selectedDepartmentId !== null) {
            return;
        }

        const laboratoryDepartment =
            departmentsList.find(
                (department: any) =>
                    department?.name?.toLowerCase() === 'laboratory'
            ) ?? departmentsList[0];

        if (laboratoryDepartment?.id != null) {
            setSelectedDepartmentId(Number(laboratoryDepartment.id));
        }
    }, [departmentsList, selectedDepartmentId]);


    const [getBulkPatientBasicInfo] =
        useGetBulkPatientBasicInfoMutation();

    const [getEncounterById] =
        useLazyGetEncounterByIdQuery();

    const fromDateParam = useMemo(() => {
        if (!dateFilter?.fromDate) return undefined;

        const d = new Date(dateFilter.fromDate);
        d.setHours(0, 0, 0, 0);

        return d.toISOString();
    }, [dateFilter?.fromDate]);

    const toDateParam = useMemo(() => {
        if (!dateFilter?.toDate) return undefined;

        const d = new Date(dateFilter.toDate);
        d.setHours(23, 59, 59, 999);

        return d.toISOString();
    }, [dateFilter?.toDate]);

    useEffect(() => {
        dispatch(setPageCode('CollectSamble'));
        dispatch(setDivContent('Collect Sample'));
    }, [dispatch]);

    useEffect(() => {
        if (!order?.patientId) {
            setPatient({
                ...newPatient
            });

            return;
        }

        getBulkPatientBasicInfo([Number(order.patientId)])
            .unwrap()
            .then((res: any[]) => {
                if (res?.length > 0) {
                    setPatient(res[0]);
                } else {
                    setPatient({
                        ...newPatient
                    });
                }
            })
            .catch(() => {
                setPatient({
                    ...newPatient
                });
            });
    }, [order?.patientId, getBulkPatientBasicInfo]);

    useEffect(() => {
        if (!order?.encounterId) {
            setEncounter({
                ...newPatientEncounter
            });

            return;
        }

        getEncounterById({
            id: order.encounterId
        })
            .unwrap()
            .then((res: any) => {
                setEncounter(
                    res ?? {
                        ...newPatientEncounter
                    }
                );
            })
            .catch(() => {
                setEncounter({
                    ...newPatientEncounter
                });
            });
    }, [order?.encounterId, getEncounterById]);

    const {
        data: testsResponse,
        isFetching: isTestsFetching,
        refetch: refetchTests
    } = useFilterDiagnosticOrderTestsQuery(
        order?.id && selectedDepartmentId
            ? {
                orderId: order.id,
                status: 'SUBMITTED',
                receivedDepartmentId: selectedDepartmentId,
                page: paginationParams.page,
                size: paginationParams.size,
                sort: paginationParams.sort,
                orderType: 'LABORATORY'
            }
            : skipToken
    );

    const orderTests = testsResponse?.data ?? [];


    const testIds = useMemo(() => {
        return Array.from(
            new Set(
                orderTests
                    .map((item: any) => item?.testId)
                    .filter((id: any) => id !== null && id !== undefined)
                    .map((id: any) => Number(id))
            )
        );
    }, [orderTests]);

    const {
        data: diagnosticTests = [],
        isFetching: isDiagnosticTestsFetching,
    } = useGetDiagnosticTestsByIdsQuery(
        { ids: testIds },
        {
            skip: testIds.length === 0,
        }
    );

    const testNameMap = useMemo(() => {
        const map = new Map<number, string>();

        diagnosticTests.forEach((item: any) => {
            if (item?.id != null) {
                map.set(Number(item.id), item.name ?? '');
            }
        });

        return map;
    }, [diagnosticTests]);

    const { data: labCatLovQueryResponse } =
        useGetLovValuesByCodeQuery('LAB_CATEGORIES');

    const { data: allLabsResponse } = useGetAllLaboratoriesQuery({
        page: 0,
        size: 10000
    });

    const allLabs = allLabsResponse?.data ?? [];

    const labByTestIdMap = useMemo(() => {
        return new Map(
            allLabs.map((lab: any) => [Number(lab.testId), lab])
        );
    }, [allLabs]);

    const resolveCategoryLabel = (key?: any) =>
        labCatLovQueryResponse?.object?.find(
            (c: any) => String(c.key) === String(key)
        )?.lovDisplayVale ?? key ?? '—';


    const collectableTests = useMemo(() => {
        return orderTests.filter(
            (item: any) =>
                item.status === DiagnosticOrderTestStatus.SUBMITTED &&
                item.processingStatus !== DiagnosticOrderTestStatus.REJECTED
        );
    }, [orderTests]);

    const sampleCollectedCount = useMemo(
        () =>
            orderTests.filter(
                (item: any) =>
                    item.processingStatus ===
                    DiagnosticOrderTestStatus.SAMPLE_COLLECTED
            ).length,
        [orderTests]
    );

    const newCount = useMemo(
        () =>
            orderTests.filter(
                (item: any) =>
                    item.processingStatus ===
                    DiagnosticOrderTestStatus.NEW
            ).length,
        [orderTests]
    );

    const totalCount = orderTests.length;

    const tablefilters = (
        <>
            <Form fluid className="filter-form-lab-filters">

                <MyInput
                    width="12vw"
                    placeholder="Department Name"
                    fieldType="selectPagination"
                    fieldLabel="Department Name"
                    fieldName="departmentId"
                    record={{
                        departmentId: selectedDepartmentId
                    }}
                    setRecord={(value: any) =>
                        setSelectedDepartmentId(
                            value?.departmentId
                                ? Number(value.departmentId)
                                : null
                        )
                    }
                    selectData={departmentsList}
                    selectDataLabel="name"
                    selectDataValue="id"
                    searchable
                    showLabel={false}
                    cleanable
                    hasMore={!!departmentsResponse?.links?.next}
                    onFetchMore={() => {
                        if (departmentsResponse?.links?.next) {
                            const { page } = extractPaginationFromLink(
                                departmentsResponse.links.next
                            );
                            setDeptPage(page);
                        }
                    }}
                />

                <MyInput
                    width={'8vw'}
                    placeholder="From Date"
                    fieldType="date"
                    fieldName="fromDate"
                    record={dateFilter}
                    setRecord={setDateFilter}
                    showLabel={false}
                />

                <MyInput
                    width={'8vw'}
                    placeholder="To Date"
                    fieldType="date"
                    fieldName="toDate"
                    record={dateFilter}
                    setRecord={setDateFilter}
                    showLabel={false}
                />

                <PatientSearch
                    value={selectedPatient}
                    onChange={setSelectedPatient}
                    showLabel={false}
                    width="22vw"
                    containerMinWidth={250}
                />

                <MyInput
                    width={'8vw'}
                    placeholder="Order ID"
                    fieldType="text"
                    fieldName="orderNumber"
                    record={{ orderNumber: orderNumberFilter }}
                    setRecord={(val: any) =>
                        setOrderNumberFilter(val.orderNumber ?? '')
                    }
                    showLabel={false}
                />

            </Form>
        </>
    );

    const testColumns = [
        {
            key: 'testName',
            title: <Translate>TEST NAME</Translate>,
            width: 180,
            align: 'center',
            render: (rowData: any) =>
                testNameMap.get(Number(rowData.testId)) ?? '—'
        },
        {
            key: 'category',
            title: <Translate>TEST CATEGORY</Translate>,
            width: 150,
            align: 'center',
            render: (rowData: any) => {
                const lab = labByTestIdMap.get(Number(rowData.testId));

                return resolveCategoryLabel(lab?.category);
            }
        },
        {
            key: 'status',
            title: <Translate>STATUS</Translate>,
            width: 150,
            align: 'center',
            render: (rowData: any) =>
                rowData.processingStatus ?? '—'
        },
        {
            key: 'collectSample',
            title: <Translate>COLLECT SAMPLE</Translate>,
            width: 110,
            align: 'center',
            render: (rowData: any) => {

                const canCollect =
                    rowData.status ===
                    DiagnosticOrderTestStatus.SUBMITTED &&
                    rowData.processingStatus !==
                    DiagnosticOrderTestStatus.REJECTED;

                return (
                    <FontAwesomeIcon
                        icon={faVialCircleCheck}
                        className="icon-laboratory-size"
                        style={{
                            cursor: canCollect
                                ? 'pointer'
                                : 'not-allowed',
                            opacity: canCollect ? 1 : 0.35
                        }}
                        onClick={e => {
                            e.stopPropagation();

                            if (!canCollect) return;

                            setTest(rowData);
                            setOpenCollectSample(true);
                        }}
                    />
                );
            }
        },
        {
            key: 'print',
            title: <Translate>PRINT</Translate>,
            width: 80,
            align: 'center',
            render: (rowData: any) => (
                <div
                    onClick={e => e.stopPropagation()}
                >
                    <PrintSampleLabelAction
                        rowData={rowData}
                    />
                </div>
            )
        }
    ];

    const tabData = [
        {
            title: 'Laboratory',

            content: (
                <div>

                    <div className="count-div-on-top-of-page">

                        <DetailsCard
                            title="Sample Collected"
                            number={sampleCollectedCount}
                            icon={faClock}
                            color="--primary-yellow"
                            backgroundClassName="sample-collected-section"
                            width="20vw"
                        />

                        <DetailsCard
                            title="New"
                            number={newCount}
                            icon={faRectangleList}
                            color="--primary-blue"
                            backgroundClassName="new-section"
                            width="20vw"
                        />

                        <DetailsCard
                            title="Total Test"
                            number={totalCount}
                            icon={faTriangleExclamation}
                            color="--gray-dark"
                            backgroundClassName="total-test-section"
                            width="20vw"
                        />

                    </div>

                    <div className="container">

                        <div className="left-boxs">

                            <Orders
                                ref={OrdersRef}
                                order={order}
                                setOrder={setOrder}
                                dateFilter={dateFilter}
                                orderNumberFilter={orderNumberFilter}
                                selectedPatient={selectedPatient}
                                filters={tablefilters}
                                departmentId={selectedDepartmentId}
                            />

                            <div className="laboratory-table-size-container">

                                <MyTable
                                    data={collectableTests}
                                    columns={testColumns}
                                    loading={isTestsFetching}
                                    height={300}
                                    totalCount={testsResponse?.totalCount ?? 0}
                                    page={paginationParams.page}
                                    rowsPerPage={paginationParams.size}
                                    onRowClick={(rowData: any) =>
                                        setTest(rowData)
                                    }
                                    rowClassName={(rowData: any) =>
                                        rowData.id === test?.id
                                            ? 'selected-row'
                                            : ''
                                    }
                                    onPageChange={(_, newPage) =>
                                        setPaginationParams(prev => ({
                                            ...prev,
                                            page: newPage
                                        }))
                                    }
                                    onRowsPerPageChange={e =>
                                        setPaginationParams(prev => ({
                                            ...prev,
                                            size: Number(e.target.value),
                                            page: 0
                                        }))
                                    }
                                    onSortChange={(column, type) => {
                                        if (
                                            [
                                                'collectSample',
                                                'print'
                                            ].includes(column)
                                        ) {
                                            return;
                                        }

                                        setPaginationParams(prev => ({
                                            ...prev,
                                            sort: `${column},${type}`,
                                            page: 0
                                        }));
                                    }}
                                />

                            </div>

                        </div>

                        <div className="right-boxs">

                            <PatientSide
                                patient={patient}
                                setPatient={setPatient}
                                encounter={encounter}
                                showDiagnosis={false}
                                showVisitDetails={false}
                                showBalance={false}
                                showCloseButton={false}
                            />

                        </div>

                    </div>

                </div>
            )
        }
    ];

    const direction =
        localStorage.getItem('direction') || 'LTR';

    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';

    return (
        <>
            <MyModal
                open={open}
                setOpen={setOpen}
                title={
                    <>
                        <FontAwesomeIcon
                            icon={faVialCircleCheck}
                            className="icon-title-modal"
                        />
                        <Translate>COLLECT SAMPLE</Translate>
                    </>
                }
                size="95vw"
                bodyheight="85vh"
                hideActionBtn
                customClassName="collect-sample-modal"
                content={
                    <div dir={dir}>
                        <MyTab
                            data={tabData}
                            activeTab={mainActiveTab}
                            setActiveTab={setMainActiveTab}
                            lazy
                        />

                        <SampleModal
                            open={openCollectSample}
                            setOpen={setOpenCollectSample}
                            orderTest={test}
                            onSuccess={async () => {
                                await refetchTests();
                                await OrdersRef.current?.refetchOrders?.();
                            }}
                        />
                    </div>
                }
            />
        </>
    );
};

export default CollectSambleModal;