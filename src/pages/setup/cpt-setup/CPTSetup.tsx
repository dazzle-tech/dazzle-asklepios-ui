import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState ,useEffect } from 'react';

import { Input, Modal, Pagination, Panel, Table } from 'rsuite';
const { Column, HeaderCell, Cell } = Table;
import { addFilterToListRequest, fromCamelCaseToDBName } from '@/utils';
import { BlockUI } from 'primereact/blockui';
import {
    useGetCptListQuery,
} from '@/services/setupService';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import ReactDOMServer from 'react-dom/server';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useAppDispatch } from '@/hooks';
const CPTSetup = () => {
    const dispatch = useAppDispatch();
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
        const divElement = useSelector((state: RootState) => state.div?.divElement);
        const divContent = (
          <div style={{ display: 'flex' }}>
            <h5>CPT Diagnosis List</h5>
          </div>
        );
        const divContentHTML = ReactDOMServer.renderToStaticMarkup(divContent);
        dispatch(setPageCode('CPT'));
        dispatch(setDivContent(divContentHTML));
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
    useEffect(() => {
        return () => {
          dispatch(setPageCode(''));
          dispatch(setDivContent("  "));
        };
      }, [location.pathname, dispatch])
    return (<>
        <Panel
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