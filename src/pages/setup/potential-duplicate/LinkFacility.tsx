import React, { useEffect, useState } from 'react';
import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import { Input, Modal, Pagination, Panel, Table } from 'rsuite';
const { Column, HeaderCell, Cell } = Table;
import { Button, ButtonToolbar, IconButton,Checkbox } from 'rsuite';
import {
    useGetFacilitiesQuery,
    useGetLovValuesByCodeQuery,
    useSaveFacilityMutation
  } from '@/services/setupService';
const LinkFacility=({Candidate})=>{
    const [saveFacility, saveFacilityMutation] = useSaveFacilityMutation();
     const [listRequest, setListRequest] = useState<ListRequest>({ ...initialListRequest,
        filterLogic:'or',
        filters:[
          
              {
                fieldName: 'rool_key',
                operator: 'isNull',
                value: true
              },
              {
                fieldName: 'rool_key',
                operator: 'match',
                value: Candidate?.key
              },
        ]
      });
    const { data: facilityListResponse,refetch:fetchFaci } = useGetFacilitiesQuery(listRequest);
   return( <>
   <Table
                height={400}
                // sortColumn={listOrderRequest.sortBy}
                // sortType={listOrderRequest.sortType}
                // onSortColumn={(sortBy, sortType) => {
                //     if (sortBy)
                //         setListRequest({
                //             ...listOrderRequest,
                //             sortBy,
                //             sortType
                //         });
                // }}
                headerHeight={80}
                rowHeight={60}
                bordered
                cellBordered

                data={facilityListResponse?.object ?? []}
                // onRowClick={rowData => {
                //     setOrder(rowData);
                  
                // }}
                // rowClassName={isSelected}
            >
                <Column flexGrow={1}>
                    <HeaderCell align="center">

                        <Translate>#</Translate>
                    </HeaderCell>
                    <Cell>
                        {rowData => (
                            <Checkbox
                                key={rowData.id}
                                 checked={rowData.roolKey!==null?true:false}
                                onChange={(value, checked) => {
                                    if(checked){
                                        
                                    saveFacility({...rowData,roolKey:Candidate.key}).unwrap()
                                    .then(()=>{
                                        fetchFaci();
                                    })
                                }
                                    else{ 
                                        saveFacility({...rowData,roolKey:null}).unwrap().then(()=>{
                                            fetchFaci();
                                        })
                                    }
                                } }
                              
                            />
                        )}
                    </Cell>


                </Column>
             
                <Column flexGrow={2}>
                    <HeaderCell align="center">
                      
                        <Translate>ID</Translate>
                    </HeaderCell>
                    <Cell>
                        {rowData =>
                            rowData.facilityId
                        }

                    </Cell>
                </Column>
                <Column flexGrow={2}>
                    <HeaderCell align="center">
                      
                        <Translate>Name </Translate>
                    </HeaderCell>
                    <Cell dataKey="facilityName" />
                </Column>
                <Column flexGrow={2}>
                    <HeaderCell align="center">
                   
                        <Translate>Type</Translate>
                    </HeaderCell>
                    <Cell  >
                        {rowData => rowData.facilityType}
                    </Cell>
                </Column>
                
              
            </Table>
   </>);
}
export default LinkFacility;