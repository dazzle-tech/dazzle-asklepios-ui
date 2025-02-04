import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState } from 'react';

import { Input, Modal, Pagination, Panel, Table } from 'rsuite';
const { Column, HeaderCell, Cell } = Table;
import { addFilterToListRequest, fromCamelCaseToDBName } from '@/utils';
import { BlockUI } from 'primereact/blockui';
import {
    useGetCptListQuery,
} from '@/services/setupService';
const CPTSetup = () => {
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
    const { data: cptListResponseLoading } = useGetCptListQuery(listRequest);
    console.log(cptListResponseLoading?.object)
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
                    <Translate>CPT Diagnosis List</Translate>
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
                data={cptListResponseLoading?.object ?? []}>
                <Table.Column sortable flexGrow={2}>
                    <Table.HeaderCell align="center">
                        <Input onChange={value => handleFilterChange('cptCode', value)} />
                        <Translate>Code</Translate>
                    </Table.HeaderCell>
                    <Table.Cell>
                        {rowData => rowData?.cptCode ?? 'N/A'}
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
                        <Input onChange={value => handleFilterChange('description', value)} />
                        <Translate>Description</Translate>
                    </Table.HeaderCell>
                    <Table.Cell>
                        {rowData => rowData?.description ?? 'N/A'}
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
                    total={cptListResponseLoading?.extraNumeric ?? 0}
                />
            </div>

        </Panel>
    </>)
}
export default CPTSetup;