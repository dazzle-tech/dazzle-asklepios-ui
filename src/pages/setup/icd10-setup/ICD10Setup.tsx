import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState, useEffect } from 'react';
import MyTable from '@/components/MyTable';
import { Form } from 'rsuite';
import { addFilterToListRequest, fromCamelCaseToDBName } from '@/utils';
import { useGetIcdListQuery } from '@/services/setupService';
import MyInput from '@/components/MyInput';
import ReactDOMServer from 'react-dom/server';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useAppDispatch } from '@/hooks';
import Translate from '@/components/Translate';

const ICD10Setup = () => {
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

    // Fetch the ICD list data based on current filters
    const { data: icdListResponseLoading ,isLoading,isFetching } = useGetIcdListQuery(listRequest);

    // Header page setUp
    const divContent = (
        <div className='page-title'>
            <h5><Translate>ICD-10 Diagnosis List</Translate></h5>
        </div>
    );
    dispatch(setPageCode('ICD10'));
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
            key: 'icdCode',
            title: 'Code',
            render: (rowData) => rowData?.icdCode ?? 'N/A',
        },
        {
            key: 'description',
            title: 'Short Description',
            render: (rowData) => rowData?.description ?? 'N/A',
        },
        {
            key: 'fulldescription',
            title: 'Full Description',
            render: (rowData) => rowData?.fulldescription ?? 'N/A',
        }
    ];

    // Available fields for filtering
    const filterFields = [
        { label: 'Code', value: 'icdCode' },
        { label: 'Short Description', value: 'description' },
        { label: 'Full Description', value: 'fulldescription' }
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
    const totalCount = icdListResponseLoading?.extraNumeric ?? 0;

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
            data={icdListResponseLoading?.object ?? []}
            columns={columns}
            filters={filters()}
            loading={isFetching || isLoading}
            page={pageIndex}
            rowsPerPage={rowsPerPage}
            totalCount={totalCount}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
        />
    );
};

export default ICD10Setup;
