import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState } from 'react';
import { Input, Pagination, Panel, Table } from 'rsuite';
const { Column, HeaderCell, Cell } = Table;
import {
    useGetIcdListQuery,
} from '@/services/setupService';
import { addFilterToListRequest, fromCamelCaseToDBName } from '@/utils';
import { BlockUI } from 'primereact/blockui';

const ICD10Setup = () => {

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

    const { data: icdListResponseLoading } = useGetIcdListQuery(listRequest);

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
            setListRequest({ ...listRequest, filters: [] });
        }
    };

    return (
        <Panel
            header={
                <h3 className="title">
                    <Translate>ICD-10 Diagnosis List</Translate>
                </h3>
            }
        >
            <BlockUI
                template={
                    <h3 style={{ textAlign: 'center', color: 'white', top: '10%', position: 'absolute' }}>
                        <Translate>Loading...</Translate>
                    </h3>
                }
            >
                <Table
                    height={550}
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
                    data={icdListResponseLoading?.object ?? []}

                >
                    <Column sortable flexGrow={1}>
                        <HeaderCell align="center">
                            <Input onChange={e => handleFilterChange('icdCode', e)} />
                            <Translate>Code</Translate>
                        </HeaderCell>
                        <Cell dataKey="icdCode" />
                    </Column>
                    <Column sortable flexGrow={5}>
                        <HeaderCell align="center">
                            <Input onChange={e => handleFilterChange('description', e)} />
                            <Translate>Short Description</Translate>
                        </HeaderCell>
                        <Cell dataKey="description" />
                    </Column>
                    <Column sortable flexGrow={5}>
                        <HeaderCell align="center">
                            <Input onChange={e => handleFilterChange('description', e)} />
                            <Translate>Full Description</Translate>
                        </HeaderCell>
                        <Cell dataKey="fulldescription" />
                    </Column>
                </Table>
            </BlockUI>
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
                    total={icdListResponseLoading?.extraNumeric ?? 0}
                />
            </div>


        </Panel>
    );
};

export default ICD10Setup;
