import Translate from '@/components/Translate';
import { useAppDispatch, useAppSelector } from '@/hooks';
import React, { useState } from 'react';
import { ButtonToolbar, IconButton, Input, Panel, Table, Pagination } from 'rsuite';
const { Column, HeaderCell, Cell } = Table;
import 'react-tabs/style/react-tabs.css';
import * as icons from '@rsuite/icons';
import { initialListRequest, ListRequest } from '@/types/types';
import { addFilterToListRequest, fromCamelCaseToDBName } from '@/utils';
import { useGetEncounterAppliedServicesQuery } from '@/services/encounterService';
import { notify } from '@/utils/uiReducerActions';
const EncounterServices = () => {
  const patientSlice = useAppSelector(state => state.patient);
  const dispatch = useAppDispatch();

  const [listRequest, setListRequest] = useState<ListRequest>({
    ...initialListRequest,
    filters: [
      {
        fieldName: 'encounter_key',
        operator: 'match',
        value: patientSlice.encounter ? patientSlice.encounter.key : '-1'
      }
    ]
  });
  const { data: encounterServicesListResponse } = useGetEncounterAppliedServicesQuery(listRequest);

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
    <>
      <Panel>
        <ButtonToolbar>
          <IconButton
            onClick={() => {
              dispatch(notify({ msg: 'Only dental services allowed', sev: 'warn' }));
            }}
            appearance="primary"
            color="green"
            icon={<icons.Plus />}
          >
            <Translate>Add New Service</Translate>
          </IconButton>
          <IconButton
            onClick={() => {
              setListRequest({
                ...listRequest,
                timestamp: new Date().getMilliseconds()
              });
            }}
            appearance="primary"
            color="blue"
            icon={<icons.Reload />}
          >
            <Translate>Refresh</Translate>
          </IconButton>
        </ButtonToolbar>
      </Panel>
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
        data={encounterServicesListResponse?.object ?? []}
      >
        <Column sortable flexGrow={4}>
          <HeaderCell>
            <Input onChange={e => handleFilterChange('serviceKey', e)} />
            <Translate>Service</Translate>
          </HeaderCell>
          <Cell>
            {rowData => (rowData.serviceObject ? rowData.serviceObject.name : rowData.serviceKey)}
          </Cell>
        </Column>
        <Column sortable flexGrow={4}>
          <HeaderCell>
            <Input onChange={e => handleFilterChange('categoryLkey', e)} />
            <Translate>Category</Translate>
          </HeaderCell>
          <Cell>
            {rowData =>
              rowData.categoryLvalue ? rowData.categoryLvalue.lovDisplayVale : rowData.categoryLkey
            }
          </Cell>
        </Column>
        <Column sortable flexGrow={2}>
          <HeaderCell>
            <Input onChange={e => handleFilterChange('extraDetails', e)} />
            <Translate>Remarks</Translate>
          </HeaderCell>
          <Cell dataKey="extraDetails" />
        </Column>
        <Column sortable flexGrow={2}>
          <HeaderCell>
            <Input onChange={e => handleFilterChange('price', e)} />
            <Translate>Price</Translate>
          </HeaderCell>
          <Cell dataKey="price" />
        </Column>
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
          total={encounterServicesListResponse?.extraNumeric ?? 0}
        />
      </div>
    </>
  );
};

export default EncounterServices;
