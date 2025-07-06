import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState, useEffect } from 'react';
import MyTable from '@/components/MyTable';
import { Form } from 'rsuite';
import { addFilterToListRequest, fromCamelCaseToDBName } from '@/utils';
import { useGetCptListQuery } from '@/services/setupService';
import MyInput from '@/components/MyInput';
import ReactDOMServer from 'react-dom/server';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useAppDispatch } from '@/hooks';

const CPTSetup = () => {
    const dispatch = useAppDispatch();

    // Initial table request with default filter (excluding deleted records)
    const [listRequest, setListRequest] = useState<ListRequest>({
        ...initialListRequest,
        filters: [
            {
                fieldName: 'deleted_at',
                operator: 'isNull',
                value: undefined
            }
        ],
        pageSize: 15
    });

    // State to handle the filter form inputs
    const [record, setRecord] = useState({ filter: '', value: '' });

    // Fetch the CPT list data based on current filters
    const { data: cptListResponseLoading ,isFetching,isLoading} = useGetCptListQuery(listRequest);

    // Header page setUp
    const divContent = (
        <div className='page-title'>
            <h5>CPT Diagnosis List</h5>
        </div>
    );
    const divContentHTML = ReactDOMServer.renderToStaticMarkup(divContent);
    dispatch(setPageCode('CPT')); // Set page code in Redux
    dispatch(setDivContent(divContentHTML)); // Set header content in Redux

    // Handle changes in filter fields
    const handleFilterChange = (fieldName, value) => {
        if (value) {
            // Add new filter to the list request
            setListRequest(
                addFilterToListRequest(
                    fromCamelCaseToDBName(fieldName),
                    'startsWithIgnoreCase',
                    value,
                    listRequest
                )
            );
        } else {
            // Reset to default filter if value is empty
            setListRequest({
                ...listRequest, filters: [
                    {
                        fieldName: 'deleted_at',
                        operator: 'isNull',
                        value: undefined
                    }
                ],
            });
        }
    };

    // Change page event handler
    const handlePageChange = (_: unknown, newPage: number) => {
        setListRequest({ ...listRequest, pageNumber: newPage + 1 });
    };
    // Change number of rows per page
    const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setListRequest({
            ...listRequest,
            pageSize: parseInt(event.target.value, 10),
            pageNumber: 1 // Reset to first page
        });
    };
    // Table columns definition
    const columns = [
        {
            key: 'cptCode',
            title: 'Code',
            render: (rowData) => rowData?.cptCode ?? 'N/A',
        },
        {
            key: 'category',
            title: 'Category',
            render: (rowData) =>
                rowData.categoryLvalue
                    ? rowData.categoryLvalue.lovDisplayVale
                    : rowData.categoryLkey,
        },
        {
            key: 'description',
            title: 'Description',
            render: (rowData) => rowData?.description ?? 'N/A',
        }
    ];

    // Available fields for filtering
    const filterFields = [
        { label: 'Code', value: 'cptCode' },
        { label: 'Category', value: 'category' },
        { label: 'Description', value: 'description' }
    ];

    // Filter form rendered above the table
    const filters = () => (
        <Form layout="inline" fluid>
            <MyInput
                selectDataValue="value"
                selectDataLabel="label"
                selectData={filterFields}
                fieldName="filter"
                fieldType="select"
                record={record}
                setRecord={(updatedRecord) => {
                    setRecord({
                        ...record,
                        filter: updatedRecord.filter,
                        value: '' // Clear the text input whenever filter is changed
                    });
                }}
                showLabel={false}
                placeholder="Select Filter"
                searchable={false}
            />

            <MyInput
                fieldName="value"
                fieldType="text"
                record={record}
                setRecord={setRecord}
                showLabel={false}
                placeholder="Search"
            />
        </Form>
    );

    // Pagination values
    const pageIndex = listRequest.pageNumber - 1;
    const rowsPerPage = listRequest.pageSize;
    const totalCount = cptListResponseLoading?.extraNumeric ?? 0;

    // Effects
    // Trigger filter logic when filter form changes
    useEffect(() => {
        if (record['filter']) {
            handleFilterChange(record['filter'], record['value']);
        } else {
            // reset the listRequest if filter is cleared
            setListRequest({
                ...initialListRequest,
                filters: [
                    {
                        fieldName: 'deleted_at',
                        operator: 'isNull',
                        value: undefined
                    }
                ],
                pageSize: listRequest.pageSize,
                pageNumber: 1
            });
        }
    }, [record]);
    

    // Clear page info on component unmount
    useEffect(() => {
        return () => {
            dispatch(setPageCode(''));
            dispatch(setDivContent("  "));
        };
    }, [location.pathname, dispatch]);

    return (
        <MyTable
            data={cptListResponseLoading?.object ?? []}
            columns={columns}
            filters={filters()}
            page={pageIndex}
            loading={isFetching || isLoading}
            rowsPerPage={rowsPerPage}
            totalCount={totalCount}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
        />
    )
}

export default CPTSetup;
