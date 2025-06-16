import MyTable from "@/components/MyTable";
import Translate from "@/components/Translate";
import { initialListRequest, ListRequest } from "@/types/types";
import React, { useState, useEffect } from "react";
import { useGetGroupTestsQuery } from '@/services/labService';
import { formatDateWithoutSeconds, addFilterToListRequest } from '@/utils';
import { Col, Form, Row } from "rsuite";
import { newApDiagnosticTest } from "@/types/model-types-constructor";
import MyInput from "@/components/MyInput";
const LaboratoryResultComparison = ({ patient }) => {
    const [selectedTest, setSelectedTest] = useState({ ...newApDiagnosticTest })
    const [dateFilter, setDateFilter] = useState({
        fromDate: null,
        toDate: null
    });
    const [listRequest, setListRequest] = useState<ListRequest>({
        ...initialListRequest,
        filters: [
            {
                fieldName: "patient_key",
                operator: 'match',
                value: patient?.key,
            }
        ]
    });
    
    const { data: testGroup } = useGetGroupTestsQuery(listRequest);
    const [testList, setTestList] = useState([]);
    const [resultList, setResultList] = useState([]);
    const isSelected = rowData => {
        if (rowData && selectedTest && rowData.key === selectedTest.key) {
            return 'selected-row';
        } else return '';
    };
    useEffect(() => {
        const list = testGroup?.object?.map(item => { return item.test })
        setTestList(list)
    }, [testGroup])
    useEffect(() => {
        if (selectedTest?.key && testGroup?.object?.length > 0) {
            const selected = testGroup.object.find(item => item.test?.key === selectedTest.key);
            setResultList(selected?.results || []);
        } else {
            setResultList([]);
        }
    }, [selectedTest, testGroup]);
   useEffect(() => {
    if (dateFilter.fromDate && dateFilter.toDate) {
        const fromDate = new Date(dateFilter.fromDate);
        fromDate.setHours(0, 0, 0, 0);
        const fromTimestamp = fromDate.getTime(); 

        const toDate = new Date(dateFilter.toDate);
        toDate.setHours(23, 59, 59, 999);
        const toTimestamp = toDate.getTime();
      
        setListRequest(
            addFilterToListRequest(
                'created_at',
                'between',
                `${fromTimestamp}_${toTimestamp}`,
                listRequest
            )
        );
    } else if (dateFilter.fromDate) {
        const fromDate = new Date(dateFilter.fromDate);
        fromDate.setHours(0, 0, 0, 0);
        const fromTimestamp = fromDate.getTime();

        setListRequest(
            addFilterToListRequest('created_at', 'gte', fromTimestamp, listRequest)
        );
    } else if (dateFilter.toDate) {
        const toDate = new Date(dateFilter.toDate);
        toDate.setHours(23, 59, 59, 999);
        const toTimestamp = toDate.getTime();

        setListRequest(
            addFilterToListRequest('created_at', 'lte', toTimestamp, listRequest)
        );
    } else {
        setListRequest({
            ...listRequest,
            filters: [
                {
                    fieldName: "patient_key",
                    operator: 'match',
                    value: patient?.key,
                }
            ]
        });
    }
}, [dateFilter?.fromDate, dateFilter?.toDate]);


    const testColumns = [
        {
            key: "",
            title: <Translate>Test name</Translate>,
            render: (rowData: any) => {
                return rowData.testName
            }
        }]
    const resultColumns = [

        {
            key: "",
            title: <Translate>Normal Range</Translate>,
            render: (rowData: any) => {
                return rowData.normalRangeValue
            }

        },
        {
            key: "",
            title: <Translate>Result</Translate>,
            render: rowData => {
                if (rowData.normalRangeKey) {

                    if (rowData.normalRange?.resultTypeLkey === "6209578532136054") {

                        return (
                            <span>
                                {rowData.resultLvalue ? rowData.resultLvalue.lovDisplayVale : rowData?.resultLkey}
                            </span>
                        );
                    }
                    else if (rowData.normalRange?.resultTypeLkey == "6209569237704618") {

                        return rowData.resultValueNumber;

                    }
                }
                else {

                    return rowData.resultText;

                }
            }
        }
        ,
        {
            key: "",
            title: <Translate>date</Translate>,
            render: (rowData: any) => {
                return (<>
                    <span>{rowData.createdBy}</span>
                    <br />
                    <span className='date-table-style'>{formatDateWithoutSeconds(rowData.createdAt)}</span>
                </>)
            }
        }
    ]
    return (<>
        <Row>
            <Row>

                <Form fluid>
                   
                    <Col md={5}>
                        <MyInput
                      
                            width="100%"
                            fieldType="date"
                            fieldLabel="From Date"
                            fieldName="fromDate"
                            record={dateFilter}
                            setRecord={setDateFilter}
                        />
                    </Col>
                    <Col md={5}>
                        <MyInput
                            width="100%"
                          
                            fieldType="date"
                            fieldLabel=" To Date"
                            fieldName="toDate"
                            record={dateFilter}
                            setRecord={setDateFilter}
                        /></Col>
                </Form>
            </Row>
            <Col md={10}>
                <MyTable
                    columns={testColumns}
                    data={testList || []}
                    onRowClick={rowData => {
                        setSelectedTest(rowData)
                    }}
                    rowClassName={isSelected} />
            </Col>
            <Col md={14}>
                <MyTable
                    columns={resultColumns}
                    data={resultList || []} />
            </Col>

        </Row>
    </>)
}
export default LaboratoryResultComparison