import React, { useState, useEffect } from "react";
import { useGetGroupTestsQuery } from '@/services/labService';
import { initialListRequest, ListRequest } from "@/types/types";
import { formatDateWithoutSeconds, addFilterToListRequest } from '@/utils';
import { Col, Form, Row } from "rsuite";
import Translate from "@/components/Translate";
import MyInput from "@/components/MyInput";
import MyTable from "@/components/MyTable";

const LaboratoryResultComparison = ({ patient, testKey = null }) => {
    const [dateFilter, setDateFilter] = useState({ fromDate: null, toDate: null });
    const [listRequest, setListRequest] = useState<ListRequest>({
        ...initialListRequest,
        filters: [
            { fieldName: "patient_key", operator: 'match', value: patient?.key },
            { fieldName: "approved_at", operator: "notMatch", value: 0 }
        ]
    });

    const { data: testGroup } = useGetGroupTestsQuery(listRequest);
    const [pivotData, setPivotData] = useState({ dates: [], tests: [] });

    useEffect(() => {
        if (dateFilter.fromDate && dateFilter.toDate) {
            const fromTimestamp = new Date(dateFilter.fromDate).setHours(0, 0, 0, 0);
            const toTimestamp = new Date(dateFilter.toDate).setHours(23, 59, 59, 999);
            setListRequest(
                addFilterToListRequest('created_at', 'between', `${fromTimestamp}_${toTimestamp}`, listRequest)
            );
        } else {
            setListRequest({
                ...initialListRequest,
                filters: [
                    { fieldName: "patient_key", operator: 'match', value: patient?.key },
                    { fieldName: "approved_at", operator: "notMatch", value: 0 }
                ]
            });
        }
    }, [dateFilter]);

    useEffect(() => {
        if (testKey) {
            setListRequest(prev => ({
                ...prev,
                filters: [...prev.filters, { fieldName: "medical_test_key", operator: 'match', value: testKey }]
            }));
        }
    }, [testKey]);

    useEffect(() => {
        if (testGroup?.object) {
            const testsMap = new Map();
            const datesSet = new Set();

            testGroup.object.forEach(group => {
                group.results.forEach(result => {
                    const date = formatDateWithoutSeconds(result.createdAt);
                    datesSet.add(date);

                    const testName = group.test.testName;
                    if (!testsMap.has(testName)) {
                        testsMap.set(testName, {});
                    }
                    testsMap.get(testName)[date] = result;
                });
            });

            setPivotData({
                dates: Array.from(datesSet).sort(),
                tests: Array.from(testsMap.entries())
            });
        }
    }, [testGroup]);

    const columns = [
        {
            key: 'testName',
            title: <Translate>Test name</Translate>,
            render: (row) => row.testName
        },
        ...pivotData.dates.map(date => ({
            key: date,
            title: date,
            render: (row) => {
                const result = row.results[date];
                if (!result) return '-';

                if (result.normalRangeKey) {
                    if (result.normalRange?.resultTypeLkey === "6209578532136054") {
                        return result.resultLvalue ? result.resultLvalue.lovDisplayVale : result?.resultLkey;
                    } else if (result.normalRange?.resultTypeLkey === "6209569237704618") {
                        return result.resultValueNumber;
                    }
                } else {
                    return result.resultText;
                }
            }
        }))
    ];

    const data = pivotData.tests.map(([testName, results]) => ({
        testName,
        results
    }));

    const filters = () => (
        <Form layout="inline" fluid className="date-filter-form">
            <MyInput
                column
                width={150}
                fieldType="date"
                fieldLabel="From Date"
                fieldName="fromDate"
                record={dateFilter}
                setRecord={setDateFilter}
            />

            <MyInput
                width={150}
                column
                fieldType="date"
                fieldLabel="To Date"
                fieldName="toDate"
                record={dateFilter}
                setRecord={setDateFilter}
            />
        </Form>
    );

    return (
        <Row>
            <Col md={24}>
                <MyTable
                    filters={filters()}
                    columns={columns}
                    data={data}
                />
            </Col>
        </Row>
    );
}

export default LaboratoryResultComparison;
