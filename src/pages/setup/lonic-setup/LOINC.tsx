import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState } from 'react';

import { Input, Modal, Pagination, Panel, Table } from 'rsuite';
const { Column, HeaderCell, Cell } = Table;
import { addFilterToListRequest, fromCamelCaseToDBName } from '@/utils';
import { BlockUI } from 'primereact/blockui';
import {
    useGetLoincListQuery
} from '@/services/setupService';
const LOINCSetup = () => {
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
    const { data:loincListResponseLoading } =  useGetLoincListQuery(listRequest);

    console.log(loincListResponseLoading ?.object)
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
                ...listRequest, filters: [
                    {
                        fieldName: 'deleted_at',
                        operator: 'isNull',
                        value: undefined
                    }
                ],
                pageSize: 15
            });
        }
    };

    return (<>
        <Panel
            header={
                <h3 className="title">
                    <Translate>LOINC List</Translate>
                </h3>
            }
        >
            <Table
                height={400}
                sortColumn={listRequest.sortBy}
                sortType={listRequest.sortType}
                onSortColumn={(sortBy, sortType) => {
                    if (sortBy)
                        setListRequest({
                            ...listRequest,
                            sortBy,
                            sortType
                        });
                }}
                headerHeight={80}
                rowHeight={60}
                bordered
                cellBordered
                data={loincListResponseLoading ?.object ?? []}>
                <Table.Column sortable flexGrow={2}>
                    <Table.HeaderCell align="center">
                        <Input onChange={value => handleFilterChange('loincCode', value)} />
                        <Translate>Code</Translate>
                    </Table.HeaderCell>
                    <Table.Cell>
                        {rowData => rowData?.loincCode ?? ' '}
                    </Table.Cell>
                </Table.Column>

                <Table.Column sortable flexGrow={2}>
                    <Table.HeaderCell align="center">
                        <Input onChange={value => handleFilterChange('categoryLvalue.lovDisplayVale', value)} />
                        <Translate>Category</Translate>
                    </Table.HeaderCell>
                    <Table.Cell>
                        
                                {rowData =>
                          rowData.categoryLvalue
                            ? rowData.categoryLvalue.lovDisplayVale
                            : rowData.categoryLkey
                        }
                    </Table.Cell>
                </Table.Column>

                <Table.Column sortable flexGrow={2}>
                    <Table.HeaderCell align="center">
                        <Input onChange={value => handleFilterChange('name', value)} />
                        <Translate>Name</Translate>
                    </Table.HeaderCell>
                    <Table.Cell>
                        {rowData => rowData?.name ?? ' '}
                    </Table.Cell>
                </Table.Column>
            </Table>

            <div style={{ padding: 20 }}>
                <Pagination
                    prev
                    next
                    first
                    last
                    ellipsis
                    boundaryLinks
                    maxButtons={5}
                    size="xs"
                    layout={['limit', '|', 'pager']}
                    limitOptions={[5, 15, 30]}
                    limit={listRequest.pageSize}
                    activePage={listRequest.pageNumber}
                    onChangePage={pageNumber => {
                        setListRequest({ ...listRequest, pageNumber });
                    }}
                    onChangeLimit={pageSize => {
                        setListRequest({ ...listRequest, pageSize });
                    }}
                    total={loincListResponseLoading ?.extraNumeric ?? 0}
                />
            </div>

        </Panel>
    </>)
}
export default LOINCSetup;