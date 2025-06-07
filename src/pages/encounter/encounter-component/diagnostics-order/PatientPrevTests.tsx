import MyTable from "@/components/MyTable";
import Translate from "@/components/Translate";
import { useGetDiagnosticOrderTestQuery } from "@/services/encounterService";
import { initialListRequest, ListRequest } from "@/types/types";
import React, { useState, useEffect } from "react";
const PatientPrevTests = (patient) => {

    console
    const [listOrdersTestRequest, setListOrdersTestRequest] = useState<ListRequest>({
        ...initialListRequest,
        filters: [
            {
                fieldName: 'patient_key',
                operator: 'match',
                value: patient?.patient?.key
            }
        ]
    });

    const { data: orderTestList, refetch: orderTestRefetch, isLoading: loadTests } = useGetDiagnosticOrderTestQuery({ ...listOrdersTestRequest });
console.log("orderTestList", orderTestList?.object);

    const tableColumns = [
         {
            key: 'order Id',
            title: <Translate>ORDER ID</Translate>,
            flexGrow: 1,
            fullText: true,
            render: rowData => {

                return rowData.orderId ?? "";
            }
        },

        {
            key: 'orderTypeLkey',
            title: <Translate>ORDER TYPE</Translate>,
            flexGrow: 1,
            fullText: true,
            render: rowData => {

                return rowData.test?.testTypeLvalue?.lovDisplayVale ?? "";
            }
        },
        {
            key: 'test',
            title: <Translate>TEST NAME</Translate>,
            flexGrow: 2,
            fullText: true,
            render: rowData => rowData.test.testName // or wrap in <span> if needed
        }
        ,
        {
            key: "internalCode",
            dataKey: "internalCode",
            title: <Translate>INTERNAL CODE</Translate>,
            flexGrow: 2,
            fullText: true,
            render: rowData => rowData.test.internalCode

        }
        ,
        {
            key: "processingStatusLkey",
            dataKey: "processingStatusLkey",
            title: <Translate>PROCESSING STATUS</Translate>,
            flexGrow: 1,
            fullText: true,
            render: rowData => rowData.processingStatusLvalue ? rowData.processingStatusLvalue?.lovDisplayVale : rowData.processingStatusLkey

        }
    ];
    const pageIndex = listOrdersTestRequest.pageNumber - 1;

    // how many rows per page:
    const rowsPerPage = listOrdersTestRequest.pageSize;

    // total number of items in the backend:
    const totalCount = orderTestList?.extraNumeric ?? 0;

    // handler when the user clicks a new page number:
    const handlePageChange = (_: unknown, newPage: number) => {
        // MUI gives you a zero-based page, so add 1 for your API

        setListOrdersTestRequest({ ...listOrdersTestRequest, pageNumber: newPage + 1 });
    };

    // handler when the user chooses a different rows-per-page:
    const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {

        setListOrdersTestRequest({
            ...listOrdersTestRequest,
            pageSize: parseInt(event.target.value, 10),
            pageNumber: 1 // reset to first page
        });
    };
    return (<>
        <MyTable
            data={orderTestList?.object || []}
            columns={tableColumns}
            page={pageIndex}
            rowsPerPage={rowsPerPage}
            totalCount={totalCount}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
        />
    </>);
}
export default PatientPrevTests;