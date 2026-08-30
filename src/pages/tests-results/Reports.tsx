import React, { useEffect, useMemo, useState } from 'react';
import { Form } from 'rsuite';
import {
    useGetLovValuesByCodeQuery
} from '@/services/setupService';
import SectionContainer from '@/components/SectionsoContainer';
import MyInput from '@/components/MyInput';
import MyNestedTable from '@/components/MyNestedTable';
import MyButton from '@/components/MyButton/MyButton';
import AdvancedSearchFilters from '@/components/AdvancedSearchFilters';
import { useGetDiagnosticTestsByIdsQuery } from '@/services/setup/diagnosticTest/diagnosticTestService';
import {
    useFilterRadiologyReportResultsQuery
} from '@/services/setup/diagnosticTest/diagnosticOrderTestReportService';
import { useGetAllRadiologiesQuery } from '@/services/setup/diagnosticTest/radiologyTestService';
import './styles.less';
import { formatDateWithoutSeconds } from '@/utils';
import ChatModal from '@/components/ChatModal';
import AddReportModal from '@/pages/rad-module/radiologist-worklist/AddReportModal';
import {
    useGetReportCommentsByReportIdQuery
} from '@/services/setup/diagnosticTest/diagnosticOrderTestReportCommentsService';
import { skipToken } from '@reduxjs/toolkit/query';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faComment, faFileLines } from '@fortawesome/free-solid-svg-icons';
import { useGetEncountersByIdsQuery } from '@/services/encounters/patientEncounterService';


const getDefaultDateFilters = () => {
    const today = new Date();

    const weekAgo = new Date();
    weekAgo.setDate(today.getDate() - 7);

    return {
        resultDateFrom: weekAgo,
        resultDateTo: today
    };
};

const Reports = props => {
    const { data: radCategoriesLovQueryResponse } =
        useGetLovValuesByCodeQuery('RAD_CATEGORIES');

    const radCategories =
        radCategoriesLovQueryResponse?.object ?? [];

    const radCategoriesMap = useMemo(() => {
        const map = new Map<string, any>();

        radCategories.forEach((category: any) => {
            map.set(String(category.key), category);
        });

        return map;
    }, [radCategories]);

    const patient = props.patient;

    const defaultDates = getDefaultDateFilters();

    const [filterRecord, setFilterRecord] = useState({
        testName: '',
        resultDateFrom: defaultDates.resultDateFrom,
        resultDateTo: defaultDates.resultDateTo
    });

    const { data: radiologiesData, isLoading: isRadiologiesLoading } =
        useGetAllRadiologiesQuery({
            page: 0,
            size: 1000,
            sort: 'id,asc'
        });

    const radiologies = radiologiesData?.data ?? [];

    const radiologiesMap = useMemo(() => {
        const map = new Map<number, any>();

        radiologies.forEach((radiology: any) => {
            if (radiology.testId != null) {
                map.set(radiology.testId, radiology);
            }
        });

        return map;
    }, [radiologies]);


    const [searchRecord, setSearchRecord] = useState(filterRecord);

    const [filterKey, setFilterKey] = useState(0);
    const [selectedReport, setSelectedReport] = useState<any>(null);
    const [openReportModal, setOpenReportModal] = useState(false);
    const [openNoteResultModal, setOpenNoteResultModal] = useState(false);
    const [pageIndex, setPageIndex] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(15);

    const { data: comments } = useGetReportCommentsByReportIdQuery(
        openNoteResultModal && selectedReport?.id
            ? selectedReport.id
            : skipToken
    );

    const testColumns = [
        {
            key: 'testName',
            title: 'Test Name',
            minWidth: 250
        },
        {
            key: 'category',
            title: 'Category',
            minWidth: 150
        },
    ];

    const reportColumns = [
        {
            key: 'patientName',
            title: 'Patient Name',
            minWidth: 180
        },
        {
            key: 'mrn',
            title: 'MRN',
            minWidth: 130
        },
        {
            key: 'report',
            title: 'Report',
            minWidth: 100,
            render: (row: any) => {
                const isSelected = selectedReport?.id === row.id;

                return (
                    <MyButton
                        appearance="subtle"
                        size="sm"
                        title="View Report"
                        onClick={() => {
                            setSelectedReport(row);
                            setOpenReportModal(true);
                        }}
                    >
                        <FontAwesomeIcon
                            icon={faFileLines}
                            className="icon-radiologist-worklist-size"
                            style={{
                                color: isSelected
                                    ? 'var(--primary-blue)'
                                    : undefined
                            }}
                        />
                    </MyButton>
                );
            }
        },
        {
            key: 'reportDate',
            title: 'Report Date',
            minWidth: 170,
            render: (row: any) => (<div>{formatDateWithoutSeconds(row.reportDate || '-')}</div>)
        },
        {
            key: 'orderedByAt',
            title: 'Ordered By / At',
            minWidth: 190,
            render: (row: any) => (
                <>
                    <div>
                        {row.orderedBy || '-'}
                    </div>

                    <div
                        style={{
                            fontSize: 12,
                            opacity: 0.7
                        }}
                    >
                        {formatDateWithoutSeconds(row.orderedAt || '-')}
                    </div>
                </>
            )
        },
        {
            key: 'encounterNumber',
            title: 'Encounter Number',
            minWidth: 150,
            render: (row: any) => {
                const encounter = encountersMap.get(row.encounterId);

                return encounter?.encounterNumber ?? '-';
            }
        },
        {
            key: 'comments',
            title: 'Comments',
            width: 90,
            align: 'center',
            render: (row: any) => (
                <FontAwesomeIcon
                    icon={faComment}
                    className="icon-radiologist-worklist-size"
                    style={{
                        cursor: 'pointer',
                        color: row.hasNote
                            ? 'var(--primary-blue)'
                            : 'gray'
                    }}
                    onClick={() => {
                        setSelectedReport(row);
                        setOpenNoteResultModal(true);
                    }}
                />
            )
        }
    ];

    const tableFilters = (<>
        <Form fluid key={filterKey}>
            <div className="results-filters-handle-position">

                <MyInput
                    fieldName="testName"
                    fieldType="text"
                    fieldLabel="Test Name"
                    record={filterRecord}
                    setRecord={setFilterRecord}
                    placeholder="Search Test Name"
                    width="100%"
                />

                <MyInput
                    fieldName="resultDateFrom"
                    fieldType="date"
                    fieldLabel="Result Date From"
                    record={filterRecord}
                    setRecord={setFilterRecord}
                    width="100%"
                />

                <MyInput
                    fieldName="resultDateTo"
                    fieldType="date"
                    fieldLabel="Result Date To"
                    record={filterRecord}
                    setRecord={setFilterRecord}
                    width="100%"
                />

            </div>
        </Form>

        <AdvancedSearchFilters
            searchOnClick={() => {
                setSearchRecord(filterRecord);
            }}

            clearOnClick={() => {
                const defaultDates = getDefaultDateFilters();

                const clearedRecord = {
                    testName: '',
                    resultDateFrom: defaultDates.resultDateFrom,
                    resultDateTo: defaultDates.resultDateTo
                };

                setFilterRecord(clearedRecord);
                setSearchRecord(clearedRecord);

                setFilterKey(prev => prev + 1);
            }}
        />
    </>);

    const {
        data,
        isLoading,
        isFetching
    } = useFilterRadiologyReportResultsQuery({
        page: pageIndex,
        size: rowsPerPage,
        sort: 'createdDate,desc',
        params: {
            patientId: patient?.id ?? patient?.key,

            fromDate: searchRecord.resultDateFrom
                ? (() => {
                    const date = new Date(
                        searchRecord.resultDateFrom
                    );

                    date.setHours(0, 0, 0, 0);

                    return date.toISOString();
                })()
                : undefined,

            toDate: searchRecord.resultDateTo
                ? (() => {
                    const date = new Date(
                        searchRecord.resultDateTo
                    );

                    date.setHours(23, 59, 59, 999);

                    return date.toISOString();
                })()
                : undefined
        }
    });

    const reports = data?.data ?? [];
    const totalCount = data?.totalCount ?? 0;

    const testIds = useMemo(
        () =>
            Array.from(
                new Set(
                    reports
                        .map((report: any) => report.testId)
                        .filter(Boolean)
                )
            ),
        [reports]
    );

    const encounterIds = useMemo(
        () =>
            Array.from(
                new Set(
                    reports
                        .map((report: any) => report.encounterId)
                        .filter(Boolean)
                )
            ),
        [reports]
    );

    const { data: encounters = [] } =
        useGetEncountersByIdsQuery(
            { ids: encounterIds },
            {
                skip: encounterIds.length === 0
            }
        );

    const {
        data: tests = [],
        isLoading: isTestsLoading
    } = useGetDiagnosticTestsByIdsQuery(
        {
            ids: testIds
        },
        {
            skip: testIds.length === 0
        }
    );

    const testsMap = useMemo(() => {
        const map = new Map<number, any>();

        tests.forEach((test: any) => {
            map.set(test.id, test);
        });

        return map;
    }, [tests]);

    const encountersMap = useMemo(() => {
        const map = new Map<number | string, any>();

        encounters.forEach((encounter: any) => {
            map.set(encounter.id, encounter);
        });

        return map;
    }, [encounters]);

    const filteredReports = useMemo(() => {
        if (!searchRecord.testName?.trim()) {
            return reports;
        }

        const search = searchRecord.testName
            .trim()
            .toLowerCase();

        return reports.filter((report: any) => {
            const test = testsMap.get(report.testId);

            return test?.name
                ?.toLowerCase()
                .includes(search);
        });
    }, [
        reports,
        testsMap,
        searchRecord.testName
    ]);

    const testGroups = useMemo(() => {
        const groups = new Map<number, any>();

        filteredReports.forEach((report: any) => {
            const test = testsMap.get(report.testId);
            const radiology = radiologiesMap.get(report.testId);

            if (!test) {
                return;
            }

            const testKey = report.testId;

            if (!groups.has(testKey)) {
                groups.set(testKey, {
                    testId: test.id,
                    testName: test.name || '-',
                    category: radCategoriesMap.get(String(radiology?.category))?.lovDisplayVale || '-',
                    resultUnit: test.defaultProfileResultUnit || '-',
                    normalRange: '-',
                    results: []
                });
            }

            groups.get(testKey).results.push({
                ...report,

                patientName: report.patientName || '-',
                mrn: report.mrn || '-',

                reportDate:
                    report.reportDate ||
                    report.createdDate ||
                    '-',

                marker:
                    report.severity ||
                    '-',

                orderedBy:
                    report.orderedBy ||
                    '-',

                orderedAt:
                    report.orderedAt ||
                    '-',

                encounterId:
                    report.encounterId ||
                    '-'
            });
        });

        return Array.from(groups.values());
    }, [
        filteredReports,
        testsMap,
        radiologiesMap
    ]);


    useEffect(() => {
        setPageIndex(0);
    }, [
        patient?.id,
        patient?.key,
        searchRecord.testName,
        searchRecord.resultDateFrom,
        searchRecord.resultDateTo
    ]);

    return (
        <SectionContainer
            title=""
            content={
                <>
                    {tableFilters}

                    <MyNestedTable
                        autoHeight
                        data={testGroups}
                        columns={testColumns}
                        loading={
                            isLoading ||
                            isFetching ||
                            isTestsLoading
                        }
                        page={pageIndex}
                        rowsPerPage={rowsPerPage}
                        totalCount={totalCount}
                        onPageChange={(_, p) => setPageIndex(p)}
                        onRowsPerPageChange={(e) =>
                            setRowsPerPage(Number(e.target.value))
                        }
                        getNestedTable={(row: any) => ({
                            columns: reportColumns,
                            data: row.results || []
                        })}
                    />


                    <ChatModal
                        open={openNoteResultModal}
                        setOpen={setOpenNoteResultModal}
                        handleSendMessage={() => { }}
                        title="Comments"
                        list={comments ?? []}
                        fieldShowName="note"
                        disabled
                    />


                    {openReportModal && selectedReport && (
                        <AddReportModal
                            key={selectedReport.id}
                            open={openReportModal}
                            setOpen={() => {
                                setOpenReportModal(false);
                                setSelectedReport(null);
                            }}
                            report={selectedReport}
                            setReport={setSelectedReport}
                            disableEdit
                            disableDefaultTemplate
                        />
                    )}
                </>
            }
        />
    );
};

export default Reports;