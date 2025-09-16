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

const [record, setRecord] = useState<any>({});
    const { data: testGroup } = useGetGroupTestsQuery(listRequest);
    const [pivotData, setPivotData] = useState({ tests: [] });

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

            testGroup.object.forEach(group => {
                group.results.forEach(result => {
                    const date = formatDateWithoutSeconds(result.createdAt);
                    const testName = group.test.testName;

                    if (!testsMap.has(testName)) {
                        testsMap.set(testName, {});
                    }

                    testsMap.get(testName)[date] = result;
                });
            });

            setPivotData({
                tests: Array.from(testsMap.entries())
            });
        }
    }, [testGroup]);

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
                column
                width={150}
                fieldType="date"
                fieldLabel="To Date"
                fieldName="toDate"
                record={dateFilter}
                setRecord={setDateFilter}
            />

                <MyInput
                    width={'100%'}
                    column
                    fieldLabel="Test Name"
                    fieldType="text"
                    fieldName="testName"
                    record={record}
                    setRecord={setRecord}
                />

        </Form>
    );

    return (<div style={{ overflowX: 'hidden' }}>
        <Row>
            <Col md={24}>
                {filters()}

                {pivotData.tests.map(([testName, results], index) => {
                    const dates = Object.keys(results).sort();
                    const columns = [
                        {
                            key: 'testName',
                            title: <Translate>Test name</Translate>,
                            render: () => testName
                        },
                        ...dates.map(date => ({
                            key: date,
                            title: date,
                            render: () => {
                                const result = results[date];
                                if (!result) return '-';
                                
                                if (result.normalRangeKey) {
                                    if (result.normalRange?.resultTypeLkey === "6209578532136054") {
                                        return result.resultLvalue?.lovDisplayVale || result?.resultLkey;

                                    } else if (result.normalRange?.resultTypeLkey === "6209569237704618") {
                                        return result.resultValueNumber;
                                    }
                                }
                                return result.resultText || '-';
                            }
                        }))
                    ];

                    const data = [{ testName, results }];

                    return (
                        <div key={index} style={{ marginBottom: 30 ,overflowX: 'auto'}}>
                           
                            <MyTable columns={columns} data={data} />
                        </div>
                    );
                })}
            </Col>
        </Row>
    </div>);
};

export default LaboratoryResultComparison;
