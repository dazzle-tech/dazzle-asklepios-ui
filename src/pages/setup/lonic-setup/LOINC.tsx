import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState, useEffect } from 'react';
import MyTable from '@/components/MyTable';
import { Form } from 'rsuite';
import { addFilterToListRequest, fromCamelCaseToDBName } from '@/utils';
import { useGetLoincListQuery } from '@/services/setupService';
import MyInput from '@/components/MyInput';
import ReactDOMServer from 'react-dom/server';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useAppDispatch } from '@/hooks';
import Translate from '@/components/Translate';

const LOINCSetup = () => {
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

    // Fetch the Loinc list data based on current filters
    const { data: loincListResponseLoading,isFetching,isLoading } = useGetLoincListQuery(listRequest);

    // Header setup
    const divContent = (
        <div className='page-title'>
            <h5><Translate>LOINC List</Translate></h5>
        </div>
    );
    dispatch(setPageCode('LOINC'));
    dispatch(setDivContent(divContent));

    // Handle changes in filter fields
    const handleFilterChange = (fieldName, value) => {
        if (value) {
            setListRequest(
                addFilterToListRequest(
                    fromCamelCaseToDBName(fieldName),
                    'startsWithIgnoreCase',
                    value,
                    listRequest
                )
            );
        } else {
            setListRequest({
                ...listRequest,
                filters: [
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
            pageNumber: 1
        });
    };

    // Table columns definition
    const columns = [
        {
            key: 'loincCode',
            title: 'Code',
            render: (rowData) => rowData?.loincCode ?? 'N/A',
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
            key: 'name',
            title: 'Name',
            render: (rowData) => rowData?.name ?? 'N/A',
        }
    ];

    // Available fields for filtering
    const filterFields = [
        { label: 'Code', value: 'loincCode' },
        { label: 'Category', value: 'categoryLvalue.lovDisplayVale' },
        { label: 'Name', value: 'name' }
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
                        value: ''
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
    const totalCount = loincListResponseLoading?.extraNumeric ?? 0;

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
            data={loincListResponseLoading?.object ?? []}
            columns={columns}
            filters={filters()}
            page={pageIndex}
            loading={isFetching || isLoading}
            rowsPerPage={rowsPerPage}
            totalCount={totalCount}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
        />
    );
};

export default LOINCSetup;
