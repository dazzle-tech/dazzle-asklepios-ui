import React, { useEffect, useState } from 'react';
import Translate from '@/components/Translate';
import {
  addFilterToListRequest,
  conjureValueBasedOnKeyFromList,
  fromCamelCaseToDBName
} from '@/utils';
import {
  useGetUsersQuery
} from '@/services/setupService';
import { DatePicker, Stack } from 'rsuite';
import { Input, Modal, Pagination, Panel, Table, TagPicker, Radio, RadioGroup, PanelGroup, Placeholder } from 'rsuite';
const { Column, HeaderCell, Cell } = Table;
import { initialListRequest, ListRequest } from '@/types/types';
const PatientAppointmentView = () => {
  const [listRequest, setListRequest] = useState<ListRequest>({ ...initialListRequest });
  const { data: userListResponse, refetch: refetchUsers } = useGetUsersQuery(listRequest);
  const handleFilterChange = (fieldName, value) => {
    if (value) {
      setListRequest(
        addFilterToListRequest(
          fromCamelCaseToDBName(fieldName),
          'containsIgnoreCase',
          value,
          listRequest
        )
      );
    } else {
      setListRequest({ ...listRequest, filters: [] });
    }
  };
    return (
     
        <div style={{ padding: '20px' }}>
            <PanelGroup>
                {/* First Panel with a title on the border */}
                <fieldset style={{ border: '2px solid #38d3e8',  marginBottom: '10px' }}>
                    <legend style={{ padding: '10px', fontWeight: 'bold', color: '#ffffff',fontSize:"20px" ,backgroundColor:"#38d3e8" }}>Search</legend>
                    <Panel style={{ height: '130px', display: 'flex', alignItems: 'center' }}>
            <label htmlFor="fromDate" style={{ margin: '0 5px', fontWeight: 'bold' ,fontSize:"17px" }}>From Date</label>
            <DatePicker id="fromDate" style={{ width: '240px' }} format="MM/dd/yyyy" />
             
            <label htmlFor="toDate" style={{ margin: '0 5px', fontWeight: 'bold',fontSize:"17px" }}>To Date</label>
            <DatePicker id="toDate" style={{ width: '240px' }} format="MM/dd/yyyy" />
                    </Panel>
                </fieldset>

                {/* Second Panel with a title on the border */}
                <fieldset style={{ border: '2px solid #38d3e8',  marginBottom: '10px' }}>
                    <legend  style={{ padding: '10px', fontWeight: 'bold', color: '#ffffff',fontSize:"20px" ,backgroundColor:"#38d3e8" }}>Patient's Appointment</legend>
                    <Panel>
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
                data={userListResponse?.object ?? []}
              
              
              >

                <Column sortable flexGrow={4}>
                  <HeaderCell>
                  <Input onChange={e => handleFilterChange('AppointmentDate', e)} />
                    <Translate>Appointment Date</Translate>
                  </HeaderCell>
                  <Cell dataKey="AppointmentDate " />
                </Column>

                <Column sortable flexGrow={3}>
                  <HeaderCell align="center">
                  <Input onChange={e => handleFilterChange('Status', e)} />
                    <Translate>Status</Translate>
                  </HeaderCell>
                  <Cell dataKey="Status" />
                </Column>

                <Column sortable flexGrow={4}>
                  <HeaderCell>
                  <Input onChange={e => handleFilterChange('Department', e)} />
                    <Translate>Department</Translate>
                  </HeaderCell>
                  <Cell dataKey="Department" />
                </Column>
                <Column sortable flexGrow={4}>
                  <HeaderCell>
                  <Input onChange={e => handleFilterChange('Physician', e)} />
                    <Translate>Physician</Translate>
                    
                  </HeaderCell>
                  <Cell dataKey="Physician" />
                </Column>

                <Column sortable flexGrow={4}>
                  <HeaderCell>
                  <Input onChange={e => handleFilterChange('BookingSource', e)} />
                    <Translate>Booking Source</Translate>
                    
                  </HeaderCell>
                  <Cell dataKey="BookingSource" />
                </Column>
                 <Column sortable flexGrow={4}>
                  <HeaderCell>
                    
                    
                    <Input onChange={e => handleFilterChange('Follow-up', e)} />
                    <Translate>Follow-up</Translate>
                  </HeaderCell>
                  <Cell dataKey="Follow-up" />
                </Column>
                 <Column sortable flexGrow={4}>
                  <HeaderCell>
                    
                    
                    <Input onChange={e => handleFilterChange('Bookingdate', e)} />
                    <Translate>Booking date</Translate>
                  </HeaderCell>
                  <Cell dataKey="Bookingdate" />
                </Column> 
                <Column sortable flexGrow={4}>
                  <HeaderCell>
                  <Input onChange={e => handleFilterChange('CompleteDate', e)} />
                    <Translate>Complete Date</Translate>
                    
                  </HeaderCell>
                  <Cell dataKey="CompleteDate" />
                </Column> 
                <Column sortable flexGrow={4}>
                  <HeaderCell>
                  <Input onChange={e => handleFilterChange('CancelDate', e)} />
                    <Translate>Cancel Date </Translate>
                    
                  </HeaderCell>
                  <Cell dataKey="CancelDate" />
                </Column> 
                <Column sortable flexGrow={4}>
                  <HeaderCell>
                  <Input onChange={e => handleFilterChange('CancellationReason', e)} />
                    <Translate>Cancellation Reason</Translate>
                    
                  </HeaderCell>
                  <Cell dataKey="CancellationReason" />
                </Column> 
                <Column sortable flexGrow={4}>
                  <HeaderCell>
                  <Input onChange={e => handleFilterChange('BookedBy', e)} />
                    <Translate>Booked By</Translate>
                    
                  </HeaderCell>
                  <Cell dataKey="BookedBy" />
                </Column> 
                <Column sortable flexGrow={4}>
                  <HeaderCell>
                  <Input onChange={e => handleFilterChange('CancelledBy ', e)} />
                    <Translate>Cancelled By </Translate>
                    
                  </HeaderCell>
                  <Cell dataKey="CancelledBy " />
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
                  total={userListResponse?.extraNumeric ?? 0}
                />
              </div>
                    </Panel>
                </fieldset>
            </PanelGroup>
        </div>
    );
};
export default PatientAppointmentView;