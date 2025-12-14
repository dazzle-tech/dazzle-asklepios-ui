import Translate from '@/components/Translate';
import { notify } from '@/reducers/uiSlice';
import { initialListRequest, ListRequest } from '@/types/types';
import { fromCamelCaseToDBName } from '@/utils';
import WavePoint from '@rsuite/icons/lib/icons/WavePoint';
import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { IconButton, Input, Pagination, Panel, Table } from 'rsuite';
const { Column, HeaderCell, Cell } = Table;
import { useGetPatientsQuery } from '@/services/patientService';
import { setPatient } from '@/reducers/patientSlice';

const PatientList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [listRequest, setListRequest] = useState<ListRequest>({ ...initialListRequest });

  const {
    data: patientListResponse,
    isLoading: isGettingPatients,
    isFetching: isFetchingPatients
  } = useGetPatientsQuery(listRequest);

  const [sortColumn, setSortColumn] = useState();
  const [sortType, setSortType] = useState();

  return (
    <Panel
      header={
        <h3 className="title">
          <Translate>Patient List</Translate>
        </h3>
      }
    >
      <Table
        height={600}
        sortColumn={listRequest.sortBy}
        sortType={listRequest.sortType}
        onSortColumn={(sortBy, sortType) => {
          if(sortBy)
          setListRequest({
            ...listRequest,
            sortBy,
            sortType
          })
        }}
        headerHeight={80}
        rowHeight={60}
        bordered
        cellBordered
        data={patientListResponse?.object ?? []} 
      >
        <Column sortable flexGrow={1}>
          <HeaderCell align="center">
            <Input />
            <Translate>Key</Translate>
          </HeaderCell>
          <Cell dataKey="key" />
        </Column>
        <Column sortable flexGrow={4}>
          <HeaderCell>
            <Input />
            <Translate>Patient Name</Translate>
          </HeaderCell>
          <Cell dataKey="fullName">
            {rowData => (
              <a style={{cursor: 'pointer'}}
                onClick={() => {
                  dispatch(setPatient(rowData));
                  navigate('/patient-profile')
                }}
              >
                {rowData.fullName}
              </a>
            )}
          </Cell>
        </Column>
        <Column sortable flexGrow={4}>
          <HeaderCell>
            <Input />
            <Translate>Mobile Number</Translate>
          </HeaderCell>
          <Cell dataKey="mobileNumber" />
        </Column>
        <Column sortable flexGrow={4}>
          <HeaderCell>
            <Input />
            <Translate>Gender</Translate>
          </HeaderCell>
          <Cell dataKey="genderLvalue.lovDisplayVale" />
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
          onChangePage={(pageNumber) => {setListRequest({...listRequest, pageNumber})}}
          onChangeLimit={(pageSize) => {setListRequest({...listRequest, pageSize})}}
          total={patientListResponse?.extraNumeric ?? 0} 
        />
      </div>
    </Panel>
  );
};

export default PatientList;
