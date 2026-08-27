import React, { useMemo, useState } from 'react';
import SectionContainer from '@/components/SectionsoContainer';
import MyInput from '@/components/MyInput';
import MyNestedTable from '@/components/MyNestedTable';
import MyButton from '@/components/MyButton/MyButton';
import './styles.less';
import { MdOutlineDescription } from 'react-icons/md';
import { Form } from 'rsuite';
import { useGetDiagnosticTestsByIdsQuery } from '@/services/setup/diagnosticTest/diagnosticTestService';
import { useGetDiagnosticOrderTestResultsPageQuery } from '@/services/setup/diagnosticTest/diagnosticOrderTestResultService';
import { useGetAllLaboratoriesQuery } from '@/services/setup/diagnosticTest/laboratoryService';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { formatDateWithoutSeconds } from '@/utils';
import ChatModal from '@/components/ChatModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faComment } from '@fortawesome/free-solid-svg-icons';
import { skipToken } from '@reduxjs/toolkit/query';
import {
    useGetNotesByResultIdQuery
} from '@/services/diagnosic-order/diagnosticOrderTestResultTechnicianNoteService';
import AdvancedSearchFilters from '@/components/AdvancedSearchFilters';

const getDefaultDateFilters = () => {
    const today = new Date();

    const weekAgo = new Date();
    weekAgo.setDate(today.getDate() - 7);

    return {
        resultDateFrom: weekAgo,
        resultDateTo: today
    };
};

const Results = props => {

    const { data: categoriesLovResponse } =
        useGetLovValuesByCodeQuery('LAB_CATEGORIES');


    const [selectedResultId, setSelectedResultId] =
        useState<number | null>(null);

    const [openNotesModal, setOpenNotesModal] =
        useState(false);

    const categoriesMap = useMemo(() => {
        const map = new Map<string, string>();

        (categoriesLovResponse?.object ?? []).forEach((item: any) => {
            map.set(String(item.key), item.lovDisplayVale);
        });

        return map;
    }, [categoriesLovResponse]);


    const defaultDates = getDefaultDateFilters();

    const [filterRecord, setFilterRecord] = useState({
        testName: '',
        resultDateFrom: defaultDates.resultDateFrom,
        resultDateTo: defaultDates.resultDateTo,
        showAbnormalOnly: false
    });

    const [searchRecord, setSearchRecord] = useState(filterRecord);
    const [filterKey, setFilterKey] = useState(0);
    const [pageIndex, setPageIndex] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(15);

    const testColumns = [
        {
            key: 'testName',
            title: 'Test Name',
            minWidth: 250
        },
        {
            key: 'category',
            title: 'Category',
            minWidth: 150,
            render: (row: any) => { return (row.category); }
        },
        {
            key: 'defaultProfileResultUnit',
            title: 'Result Unit',
            minWidth: 140,
            render: (row: any) => { return (row.defaultProfileResultUnit); }
        },
        {
            key: 'normalRange',
            title: 'Normal Range',
            minWidth: 180,
            render: (row: any) => { return (row.normalRange); }

        }
    ];

    const resultColumns = [
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
            key: 'resultValue',
            title: 'Result Value',
            minWidth: 130,

            render: (row: any) => {
                console.log('RESULT ROW:', row);

                if (row.isRadiology) {
                    return (
                        <MyButton
                            appearance="subtle"
                            size="sm"
                            title="View Report"
                            onClick={() => {
                                // TODO: open report
                            }}
                        >
                            <MdOutlineDescription size={20} />
                        </MyButton>
                    );
                }

                return (
                    row.resultValue ??
                    row.resultValueNumber ??
                    row.resultValueText ??
                    '-'
                );
            }
        },
        {
            key: 'resultDate',
            title: 'Result Date',
            minWidth: 170,
            render: (row: any) =>
                row.resultDate
                    ? formatDateWithoutSeconds(row.resultDate)
                    : '-'
        },
        {
            key: 'marker',
            title: 'Marker',
            minWidth: 100,

            render: (row: any) =>
                row.marker || '-'
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
            key: 'encounterId',
            title: 'Encounter ID',
            minWidth: 130
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
                        setSelectedResultId(row.id);
                        setOpenNotesModal(true);
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

                <MyInput
                    fieldName="showAbnormalOnly"
                    fieldType="checkbox"
                    fieldLabel="Show Abnormal Only"
                    record={filterRecord}
                    setRecord={setFilterRecord}
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
                            resultDateTo: defaultDates.resultDateTo,
                            showAbnormalOnly: false
                        };

                        setFilterRecord(clearedRecord);
                        setSearchRecord(clearedRecord);

                        setFilterKey(prev => prev + 1);
                    }}
            hideSearchBtn={false}
        />
        
        </>
    );


    const {
        data,
        isLoading,
        isFetching
    } = useGetDiagnosticOrderTestResultsPageQuery({
        page: pageIndex,
        size: rowsPerPage,
        sort: 'createdDate,desc',
        resultDateFrom: searchRecord.resultDateFrom
            ? (() => {
                const date = new Date(searchRecord.resultDateFrom);
                date.setHours(0, 0, 0, 0);
                return date.toISOString();
            })()
            : undefined,

        resultDateTo: searchRecord.resultDateTo
            ? (() => {
                const date = new Date(searchRecord.resultDateTo);
                date.setHours(23, 59, 59, 999);
                return date.toISOString();
            })()
            : undefined,

        showAbnormalOnly: searchRecord.showAbnormalOnly
    });

    const results = data?.data ?? [];
    const totalCount = data?.totalCount ?? 0;

    const testIds = useMemo(
        () =>
            Array.from(
                new Set(
                    results
                        .map((result: any) => result.testId)
                        .filter(Boolean)
                )
            ),
        [results]
    );

    const { data: notesResponse } =
        useGetNotesByResultIdQuery(
            openNotesModal && selectedResultId
                ? selectedResultId
                : skipToken
        );

    const { data: tests = [], isLoading: isTestsLoading } =
        useGetDiagnosticTestsByIdsQuery(
            { ids: testIds },
            {
                skip: testIds.length === 0
            }
        );

    console.log('TESTS:', tests);


    const testsMap = useMemo(() => {
        const map = new Map<number, any>();

        tests.forEach((test: any) => {
            map.set(test.id, test);
        });

        return map;
    }, [tests]);


    const { data: laboratoriesData, isLoading: isLaboratoriesLoading } =
        useGetAllLaboratoriesQuery({
            page: 0,
            size: 1000,
            sort: 'id,asc'
        });

    const laboratories = laboratoriesData?.data ?? [];

    const laboratoriesMap = useMemo(() => {
        const map = new Map<number, any>();

        laboratories.forEach((laboratory: any) => {
            if (laboratory.testId != null) {
                map.set(laboratory.testId, laboratory);
            }
        });

        return map;
    }, [laboratories]);


    console.log('================ RESULTS API ================');
    console.log(results);
    console.log('==============================================');

    const filteredResults = useMemo(() => {

        if (!searchRecord.testName?.trim()) {
            return results;
        }

        const search = searchRecord.testName
            .trim()
            .toLowerCase();

        return results.filter((result: any) => {
            const test = testsMap.get(result.testId);

            return test?.name
                ?.toLowerCase()
                .includes(search);
        });

    }, [results, testsMap, searchRecord.testName]);


    const testGroups = useMemo(() => {

        const groups = new Map<number, any>();

        filteredResults.forEach((result: any) => {

            const test = testsMap.get(result.testId);
            const laboratory = laboratoriesMap.get(result.testId);

            const testKey = result.testId;

            if (!groups.has(testKey)) {

                groups.set(testKey, {
                    testId: result.testId,

                    testName: test?.name || '-',

                    category:
                        categoriesMap.get(String(laboratory?.category)) || '-',

                    defaultProfileResultUnit:
                        test?.defaultProfileResultUnit || '-',

                    normalRange:
                        result.viewNormalRange || '-',

                    results: []
                });
            }

            groups.get(testKey).results.push({
                ...result,

                resultValue:
                    result.resultValueNumber ??
                    result.resultValueText ??
                    '-',

                resultDate:
                    result.resultDate || '-',

                marker:
                    result.viewMarker ??
                    result.marker ??
                    '-'
            });
        });

        return Array.from(groups.values());

    }, [
        filteredResults,
        testsMap,
        laboratoriesMap,
        categoriesMap
    ]);


    return (<>
        <SectionContainer
            title=""
            content={(
                <>
                    {tableFilters}

                    <MyNestedTable
                        autoHeight
                        data={testGroups}
                        columns={testColumns}
                        loading={isLoading || isFetching}
                        page={pageIndex}
                        rowsPerPage={rowsPerPage}
                        totalCount={totalCount}
                        onPageChange={(_, p) => setPageIndex(p)}
                        onRowsPerPageChange={(e) => {
                            setRowsPerPage(Number(e.target.value));
                            setPageIndex(0);
                        }}
                        getNestedTable={(row: any) => ({
                            columns: resultColumns,
                            data: row.results || []
                        })}
                    />
                </>
            )}
        />

        <ChatModal
            open={openNotesModal}
            setOpen={setOpenNotesModal}
            title="Comments"
            list={openNotesModal ? notesResponse ?? [] : []}
            fieldShowName="note"
            handleSendMessage={{}}
            disabled
        />
    </>);
};

export default Results;