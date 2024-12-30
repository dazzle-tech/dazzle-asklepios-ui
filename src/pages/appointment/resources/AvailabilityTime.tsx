import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState, useEffect } from 'react';
import { Input, Modal, Pagination, Panel, Table, Checkbox, PanelGroup } from 'rsuite';
const { Column, HeaderCell, Cell } = Table;
import {
  useGetDepartmentsQuery,
  useGetFacilitiesQuery,
  useGetLovValuesByCodeQuery
} from '@/services/setupService';
import { Button, ButtonToolbar, IconButton } from 'rsuite';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import EditIcon from '@rsuite/icons/Edit';
import TrashIcon from '@rsuite/icons/Trash';
import { ApResources, ApResourcesAvailabilityTime } from '@/types/model-types';
import { newApResources, newApResourcesAvailabilityTime } from '@/types/model-types-constructor';
import { Form, Stack, Divider, DatePicker, Text} from 'rsuite';
import MyInput from '@/components/MyInput';
import { addFilterToListRequest, conjureValueBasedOnKeyFromList, fromCamelCaseToDBName } from '@/utils';
import { useGetResourcesAvailabilityTimeQuery, useGetResourcesQuery, useGetResourceTypeQuery, useSaveResourcesAvailabilityTimeMutation, useSaveResourcesMutation } from '@/services/appointmentService';
import { notify } from '@/utils/uiReducerActions';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { DateRangePicker } from 'rsuite';
import { FaCalendar, FaClock } from 'react-icons/fa';
import { BsCalendar2MonthFill } from 'react-icons/bs';
import ArrowDownLineIcon from '@rsuite/icons/ArrowDownLine';
import CollaspedOutlineIcon from '@rsuite/icons/CollaspedOutline';
import ExpandOutlineIcon from '@rsuite/icons/ExpandOutline';

const AvailabilityTime = ({resource}) => {
  const [resources, setResources] = useState<ApResources>({ ...newApResources });
  const [resourcesAvailabilityTime, setResourcesAvailabilityTime] = useState<ApResourcesAvailabilityTime>({ ...newApResourcesAvailabilityTime })
  const [popupOpen, setPopupOpen] = useState(false);
  const dispatch = useAppDispatch();
  const [listRequest, setListRequest] = useState<ListRequest>({ ...initialListRequest });
  const [resourcesAvailabilityTimeListRequest, setResourcesAvailabilityTimeListRequest] = useState<ListRequest>({ ...initialListRequest });
  const [departmentListRequest, setDepartmentListRequest] = useState<ListRequest>({ ...initialListRequest });
  const [saveResourcesAvailabilityTime, saveResourcesAvailabilityTimeMutation] = useSaveResourcesAvailabilityTimeMutation();
  const [selectedRows, setSelectedRows] = useState([]);

  const { data: resourceAvailabilityTimeListResponse } = useGetResourcesAvailabilityTimeQuery(resourcesAvailabilityTimeListRequest);
  const { data: resourcesListResponse } = useGetResourcesQuery(listRequest);
  const { data: facilityListResponse } = useGetFacilitiesQuery(listRequest);
  const { data: departmentListResponse } = useGetDepartmentsQuery(departmentListRequest);
  const { data: dayLovQueryResponse } = useGetLovValuesByCodeQuery('DAYS_OF_WEEK');

  

  const handleNew = () => {
    setResources({ ...newApResources,
      resourceTypeLkey: null,
      facilityKey: null,
      resourceKey: null,
     })
     setResourcesAvailabilityTime({
      ...newApResourcesAvailabilityTime,
     })
    setPopupOpen(true);
  };

  useEffect(() => {
    const updatedFilters =[
      {
        fieldName: 'resource_key',
        operator: 'match',
        value: resource.key || undefined
      },
      {
        fieldName: 'deleted_at',
        operator: 'isNull',
        value: undefined
      }
    ];
    setResourcesAvailabilityTimeListRequest((prevRequest) => ({
      ...prevRequest,
      filters: updatedFilters,
    }));
  }, [resource.key]);

  useEffect(() => {
    if (resource) {
      setResourcesAvailabilityTime(prevState => ({
        ...prevState,
        resourceKey: resource.key
      }));
    }
  }, [resource]);

  const handleClose = () => {
    setPopupOpen(false);
  };

  useEffect(() => {
    if (saveResourcesAvailabilityTimeMutation.data) {
      setListRequest({ ...listRequest, timestamp: new Date().getTime() });
      dispatch(notify({ msg: 'Added Successfully'}));
    }
  }, [saveResourcesAvailabilityTimeMutation.data]);

  const isSelected = rowData => {
    if (rowData && resources && rowData.key === resources.key) {
      return 'selected-row';
    } else return '';
  };

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

  function convertTimeToSeconds(time) {
    const [hours, minutes] = time.split(':').map(Number);
    return (hours * 3600) + (minutes * 60);
  }

  const handleSave = () => {
    setPopupOpen(false);
    saveResourcesAvailabilityTime(resourcesAvailabilityTime).unwrap();
  };

  const handleRowClick = (patient) => {
    if (resourcesAvailabilityTime?.key === patient.key) {
      setResourcesAvailabilityTime(null);
    } else {
      setResourcesAvailabilityTime(patient);
    }
  };

  const convertSecondsToTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600); 
    const minutes = Math.floor((seconds % 3600) / 60); 
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };



  const groupDataByDay = (data: ApResourcesAvailabilityTime[]) => {
    if (!Array.isArray(data)) {
      console.error("Input data is not an array");
      return [];
    }
    const grouped = data.reduce((acc, item) => {
      if (!acc[item.dayLkey]) {
        acc[item.dayLkey] = [];
      }
      acc[item.dayLkey].push(item); 
      return acc;
    }, {});
  
    return Object.keys(grouped).map(dayLkey => ({
      dayLkey,
      children: grouped[dayLkey]
    }));
  };



  const handleExpanded = (rowData) => {
    let open = false;
    const nextExpandedRowKeys = [];

    expandedRowKeys.forEach(key => {
      if (key === rowData) {
        open = true;
      } else {
        nextExpandedRowKeys.push(key);
      }
    });

    if (!open) {
      nextExpandedRowKeys.push(rowData);
    }



  console.log("Iam the next expand key" + nextExpandedRowKeys)
    setExpandedRowKeys(nextExpandedRowKeys);
  };
  const [expandedRowKeys, setExpandedRowKeys] = React.useState([]);

  console.log("i am in expand key" + expandedRowKeys)
  const ExpandCell = ({ rowData, dataKey, expandedRowKeys, onChange, ...props }) => (
    <Cell {...props} style={{ padding: 5 }}>
      <IconButton
        appearance="subtle"
        onClick={() => {
          onChange(rowData);
        }}
        icon={
          expandedRowKeys.some(key => key === rowData["dayLKey"]) ? (
            <CollaspedOutlineIcon />
          ) : (
            <ExpandOutlineIcon />
          )
        }
      />
    </Cell>
  );












  const [startTime, setStartTime] = useState(convertSecondsToTime(resourcesAvailabilityTime.startTime));
  const [endTime, setEndTime] = useState(convertSecondsToTime(resourcesAvailabilityTime.endTime));
  const [breakFrom, setBreakFrom] = useState(convertSecondsToTime(resourcesAvailabilityTime.breakFrom));
  const [breakTo, setBreakTo] = useState(convertSecondsToTime(resourcesAvailabilityTime.breakTo));


  const handleTimeChange = (field: string, value: string) => {
    const timeInSeconds = convertTimeToSeconds(value);
    console.log(timeInSeconds);
    setResourcesAvailabilityTime((prev) => ({
      ...prev,
      [field]: timeInSeconds,  // Update the time in seconds
    }));
  };

const TimePanel = ({ day, times }) => (
  <Panel header={day}>
    <Table data={times} 
           autoHeight
           rowKey="key"  
           onRowClick={rowData => {
              setResourcesAvailabilityTime(rowData);
            }}
            rowClassName={isSelected}
           >
             <Column flexGrow={6} width={300} align="center" resizable>
               <HeaderCell >Facility</HeaderCell>
               <Cell>
                    {rowData => (
                      <span>
                        {conjureValueBasedOnKeyFromList(
                          facilityListResponse?.object ?? [],
                          rowData.facilityKey,
                          'facilityName'
                        )}
                      </span>
                    )}
                  </Cell>
             </Column>
     
             <Column flexGrow={6} width={300} align="center" resizable>
               <HeaderCell >Department</HeaderCell>
               <Cell>
                    {rowData => (
                      <span>
                        {conjureValueBasedOnKeyFromList(
                          departmentListResponse?.object ?? [],
                          rowData.departmentKey,
                          'name'
                        )}
                      </span>
                    )}
                  </Cell>
             </Column>
     
             <Column flexGrow={4} width={300} align="center" resizable>
               <HeaderCell>Start Time</HeaderCell>
               <Cell >{(rowData) => convertSecondsToTime(rowData.startTime)}</Cell>
             </Column>
     
             <Column flexGrow={5} width={300} align="center" resizable>
               <HeaderCell>End Time</HeaderCell>
               <Cell>{(rowData) => convertSecondsToTime(rowData.endTime)}</Cell>
             </Column>

             <Column flexGrow={4} width={300} align="center" resizable>
               <HeaderCell>Break From</HeaderCell>
               <Cell >{(rowData) => convertSecondsToTime(rowData.breakFrom)}</Cell>
             </Column>
     
             <Column flexGrow={5} width={300} align="center" resizable>
               <HeaderCell>Break To</HeaderCell>
               <Cell>{(rowData) => convertSecondsToTime(rowData.breakTo)}</Cell>
             </Column>
           </Table>
  </Panel>
);



const groupedData = groupDataByDay(resourceAvailabilityTimeListResponse?.object?? []);



  return (
    <Panel
      header={
        <h3 className="title">
          <Translate>Availability Time</Translate>
        </h3>
      }
    >
      <ButtonToolbar>
        <IconButton appearance="primary" icon={<AddOutlineIcon />} onClick={handleNew} disabled={!resource.key}>
          Add New
        </IconButton>
        <IconButton
          disabled={!resourcesAvailabilityTime.key}
          appearance="primary"
          onClick={() => setPopupOpen(true)}
          color="green"
          icon={<EditIcon />}
        >
          Edit Selected
        </IconButton>
        <IconButton
          disabled={true || !resourcesAvailabilityTime.key}
          appearance="primary"
          color="red"
          icon={<TrashIcon />}
        >
          Delete Selected
        </IconButton>
      </ButtonToolbar>
      <hr />
      <PanelGroup accordion bordered>
      {groupedData.map((dayData, index) => (
        <TimePanel key={index} day={dayData.dayLkey} times={dayData.children} />
      ))}
    </PanelGroup>
    
      {/* <Table
      height={600}
  data={groupDataByDay(resourceAvailabilityTimeListResponse?.object ?? [])}
  rowKey="dayLkey"
  expandedRowKeys={expandedRowKeys} // Ensure expanded row state is correctly handled
  renderRowExpanded={renderRowExpanded} // This is the function rendering the expanded child table
  shouldUpdateScroll={false}
  bordered
    > */}
         {/* <Column width={70} align="center">
        <HeaderCell>#</HeaderCell>
        <ExpandCell rowData={rowData => rowData.dayLkey} dataKey="dayLkey" expandedRowKeys={expandedRowKeys} onChange={handleExpanded} /> 
      </Column> */}
       {/* <Column flexGrow={1}>
                <HeaderCell>#</HeaderCell>
                <Cell>
                {rowData => ( 
                   <IconButton
                     icon={<ArrowDownLineIcon/>}
                   />
                  )}
            
                </Cell>
              </Column> 
            <Column flexGrow={500}>
          <HeaderCell align="center">
            <Translate>Day</Translate>
          </HeaderCell>
          <Cell>
            {rowData =>
              rowData.dayTypeLvalue ? rowData.dayLvalue.lovDisplayVale : rowData.dayLkey
            }
          </Cell>
        </Column>
      </Table> */}


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
          total={resourcesListResponse?.extraNumeric ?? 0}
        />
      </div>

      <Modal open={popupOpen} overflow>
        <Modal.Title>
          <Translate>New/Edit Availability Time</Translate>
        </Modal.Title>
        <Modal.Body>
          <Form fluid>
            <MyInput
              fieldName="facilityKey"
              fieldType="select"
              selectData={facilityListResponse?.object ?? []}
              selectDataLabel="facilityName"
              selectDataValue="key"
              record={resourcesAvailabilityTime}
              setRecord={setResourcesAvailabilityTime}
            />
            <MyInput
              fieldName="departmentKey"
              fieldType="select"
              selectData={departmentListResponse?.object ?? []}
              selectDataLabel="name"
              selectDataValue="key"
              record={resourcesAvailabilityTime}
              setRecord={setResourcesAvailabilityTime}
            />
            <MyInput
              fieldName="dayLkey"
              // fieldType="multyPicker"
              fieldType="select"
              selectData={dayLovQueryResponse?.object ?? []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              record={resourcesAvailabilityTime}
              setRecord={setResourcesAvailabilityTime}
            />
             <Form fluid layout='inline'>
             {/* <MyInput
                  width={165}
                  column
                  fieldType="time"
                  fieldLabel="Start Time"
                  fieldName="startTime"
                  record={resourcesAvailabilityTime}
                  setRecord={setResourcesAvailabilityTime}
                /> */}
                          <MyInput
              width={165}
              column
              fieldType="time"
              fieldLabel="Start Time"
              fieldName="value"
              record={resourcesAvailabilityTime}
              setRecord={setResourcesAvailabilityTime}
              value={startTime}
              onChange={(value) => handleTimeChange('startTime', value)}
            />
           
             {/* <Text>Start Time</Text>
              <DatePicker
                format="HH:mm"
                caretAs={FaClock}
                placeholder="Select Start Time"
                value={selectFromTime}
                onChange={handleTimeChange}
              /> */}
             
             {/* <Text>Start Time</Text>
              <DatePicker
                format="HH:mm"
                placeholder="Select Start Time"
                label={convertSecondsToTime(resourcesAvailabilityTime.startTime)}
                onChange={e =>
                  convertTimeToSeconds(e),
                }
              /> */}

                 <MyInput
                  width={165}
                  column
                  fieldType="time"
                  fieldLabel="End Time"
                  fieldName="value"
                  record={resourcesAvailabilityTime}
                  setRecord={setResourcesAvailabilityTime}
                  value={endTime}
                  onChange={(value) => handleTimeChange('endTime', value)}
                />
                 
             </Form>
             <Form fluid layout='inline'>
             <MyInput
                  width={165}
                  column
                  fieldType="time"
                  fieldLabel="Break From"
                  fieldName="value"
                  record={resourcesAvailabilityTime}
                  setRecord={setResourcesAvailabilityTime}
                  value={breakFrom}
                  onChange={(value) => handleTimeChange('breakFrom', value)}
                />
                 <MyInput
                  width={165}
                  column
                  fieldType="time"
                  fieldLabel="Breake To"
                  fieldName="value"
                  record={resourcesAvailabilityTime}
                  setRecord={setResourcesAvailabilityTime}
                  value={breakTo}
                  onChange={(value) => handleTimeChange('breakTo', value)}
                />
             </Form>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Stack spacing={2} divider={<Divider vertical />}>
            <Button appearance="primary" onClick={handleSave}>
              Save
            </Button>
            <Button appearance="primary" color="red" onClick={handleClose}>
              Cancel
            </Button>
          </Stack>
        </Modal.Footer>
      </Modal>
    </Panel>
  );
};

export default AvailabilityTime;


