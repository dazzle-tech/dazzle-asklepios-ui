import React, { useEffect, useState } from 'react';
import { Form } from 'rsuite';
import { initialListRequest, ListRequest } from '@/types/types';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import './styles.less';
import {
  useGetResourcesAvailabilityTimeQuery,
  useSaveResourcesAvailabilityTimeMutation
} from '@/services/appointmentService';
import { GrScheduleNew } from "react-icons/gr";
import { ApResourcesAvailabilityTime } from '@/types/model-types';
import { newApResourcesAvailabilityTime } from '@/types/model-types-constructor';
import { MdDelete } from 'react-icons/md';
import { MdModeEdit } from 'react-icons/md';
import { FaUndo } from 'react-icons/fa';
import {
  useGetDepartmentsQuery,
  useGetFacilitiesQuery,
  useGetLovValuesByCodeQuery
} from '@/services/setupService';
import { conjureValueBasedOnKeyFromList } from '@/utils';
import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import ChildModal from '@/components/ChildModal';
import { notify } from '@/utils/uiReducerActions';
import { useAppDispatch } from '@/hooks';
const AvailabilityTimeModal = ({
  open,
  setOpen,
  resource
}) => {
  const dispatch = useAppDispatch();
  const [selectedV, setSelectedV] = useState([]);
  const [record, setRecord] = useState({ selected: selectedV });
  const [dataOfDays, setDataOfDays] = useState([]);
  const [recordOfTimes, setRecordOfTimes] = useState({
    startTime: null,
    endTime: null,
    breakFrom: null,
    breakTo: null
  });
  const [openChildModal, setOpenChildModal] = useState<boolean>(false);
  const [arrOfTable, setArrOfTable] = useState([]);
  const [groupedData, setGroupedData] = useState([]);
  const [availabilityTime, setAvailabilityTime] = useState<ApResourcesAvailabilityTime>({ ...newApResourcesAvailabilityTime });
  const [resourcesAvailabilityTimeListRequest, setResourcesAvailabilityTimeListRequest] =
    useState<ListRequest>({ ...initialListRequest });
  const [listRequest, setListRequest] = useState<ListRequest>({ ...initialListRequest });
  const { data: resourceAvailabilityTimeListResponse, refetch: availabilityRefetch } =
    useGetResourcesAvailabilityTimeQuery(resourcesAvailabilityTimeListRequest);
  const [resourcesAvailabilityTime, setResourcesAvailabilityTime] =
    useState<ApResourcesAvailabilityTime>({ ...newApResourcesAvailabilityTime });
  const { data: dayLovQueryResponse } = useGetLovValuesByCodeQuery('DAYS_OF_WEEK');
  const [departmentListRequest] = useState<ListRequest>({ ...initialListRequest });
  const [saveResourcesAvailabilityTime] = useSaveResourcesAvailabilityTimeMutation();
  const { data: facilityListResponse } = useGetFacilitiesQuery(listRequest);
  const { data: departmentListResponse } = useGetDepartmentsQuery(departmentListRequest);

   // Class name of selected row
  const isSelected = rowData => {
    if (rowData && availabilityTime && rowData.key === availabilityTime.key) {
      return 'selected-row';
    } else return '';
  };

  // Effects
  useEffect(() => {
    // update filter of Availability Time ListRequest when resource change
    const updatedFilters = [
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
    setResourcesAvailabilityTimeListRequest(prevRequest => ({
      ...prevRequest,
      filters: updatedFilters
    }));
    availabilityRefetch();
  }, [resource]);
  // change groupedData when the Availability Time ListResponse updated
  useEffect(() => {
    setGroupedData(groupDataByDay(resourceAvailabilityTimeListResponse?.object ?? []));
  }, [resourceAvailabilityTimeListResponse]);
  // change data of days(list of days) when grouped data is updated
  useEffect(() => {
    setDataOfDays(createData());
  }, [groupedData]);
  // Select all days when the modal opens
  useEffect(() => {
    const arr = [];
    dataOfDays.forEach(element => {
      arr.push(element.value);
    });
    setSelectedV(arr);
  }, [dataOfDays]);
  useEffect(() => {
    setRecord({ selected: selectedV });
  }, [selectedV]);
  // update the table when selecting a day
  useEffect(() => {
    const arr = [];
    groupedData?.forEach(data => {
      const exist = record['selected'].find(item => item === data.dayLkey);
      if (exist) {
        data.children?.forEach(child => {
          const element = { ...child, day: handleNameOfDay(data.dayLkey) };
          arr.push(element);
        });
      }
    });
    setArrOfTable(arr);
  }, [record]);
  // Convert time to seconds and store it
  useEffect(() => {
    handleTimeChange('startTime', recordOfTimes.startTime);
  }, [recordOfTimes.startTime]);

  useEffect(() => {
    handleTimeChange('endTime', recordOfTimes.endTime);
  }, [recordOfTimes.endTime]);
  useEffect(() => {
    handleTimeChange('breakFrom', recordOfTimes.breakFrom);
  }, [recordOfTimes.breakFrom]);
  useEffect(() => {
    handleTimeChange('breakTo', recordOfTimes.breakTo);
  }, [recordOfTimes.breakTo]);

  // Groups data items by their day property
  function groupDataByDay(data: ApResourcesAvailabilityTime[]) {
    if (!Array.isArray(data)) {
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
  }
  // return the name of day according to its key
  const handleNameOfDay = day => {
    if (dayLovQueryResponse && Array.isArray(dayLovQueryResponse.object)) {
      const dayObject = dayLovQueryResponse.object.find(dayObj => dayObj.key === String(day));
      if (dayObject) {
        return dayObject.lovDisplayVale;
      } else {
        return null;
      }
    } else {
      return null;
    }
  };
  // Converts a time duration from seconds to a string formatted as "HH:MM"
  const convertSecondsToTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };
  // create list days
  function createData() {
    const dataTest = [];
    groupedData?.forEach(group => {
      const value = group.dayLkey;
      const label = handleNameOfDay(value);
      const obj = { label: label, value: value };
      dataTest.push(obj);
    });
    return dataTest;
  }
  // converts a duration in seconds to a Date object
  const convertSecondsToDate = (seconds: number): Date => {
    const date = new Date(0);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    date.setHours(hours);
    date.setMinutes(minutes);
    date.setSeconds(0);
    date.setFullYear(1970);
    date.setMonth(0); // January (0-based index)
    date.setDate(1); // First day of January
    return date;
  };
  // Icons column (Edit, reactive/Deactivate)
  const iconsForActions = rowData => (
    <div className="container-of-icons-resources">
      <MdModeEdit
        className="icons-resources"
        title="Edit"
        size={24}
        fill="var(--primary-gray)"
        onClick={() => {
          setResourcesAvailabilityTime(rowData);
          setRecordOfTimes({
            startTime: convertSecondsToDate(rowData.startTime),
            endTime: convertSecondsToDate(rowData.endTime),
            breakFrom: convertSecondsToDate(rowData.breakFrom),
            breakTo: convertSecondsToDate(rowData.breakTo)
          });
          setOpenChildModal(true);
        }}
      />
      {rowData?.isValid ? (
        <MdDelete
          className="icons-resources"
          title="Deactivate"
          size={24}
          fill="var(--primary-pink)"
        />
      ) : (
        <FaUndo
          className="icons-resources"
          title="Activate"
          size={24}
          fill="var(--primary-gray)"
        />
      )}
    </div>
  );
  // Converts a Date to the number of seconds
  const convertDateToSeconds = (date: Date): number => {
    const midnight = new Date(date);
    midnight.setHours(0, 0, 0, 0);
    const seconds = Math.floor((date.getTime() - midnight.getTime()) / 1000);

    return seconds;
  };
  // converts date to seconds and store it
  const handleTimeChange = (field, value) => {
    if (value) {
      const timeInSeconds = convertDateToSeconds(value);
      setResourcesAvailabilityTime(prev => ({
        ...prev,
        [field]: timeInSeconds
      }));
    }
  };

  // handle click on Add New button
  const handleNew = () => {
    setOpenChildModal(true);
    setResourcesAvailabilityTime({...newApResourcesAvailabilityTime});
  };
  // handle save availability time
  const handleSave = () => {
    setOpenChildModal(false);
    saveResourcesAvailabilityTime({
      ...resourcesAvailabilityTime,
      resourceKey: resource.key,
      createdBy: 'Administrator'
    })
      .unwrap()
      .then(() => {
        availabilityRefetch();
        dispatch(
          notify({ msg: 'The Availability time has been saved successfully', sev: 'success' })
        );
      })
      .catch(() => {
        dispatch(notify({ msg: 'Failed to save this Availability time', sev: 'error' }));
      });
  };
  //Table columns
  const tableColumns = [
    {
      key: 'day',
      title: <Translate>Day</Translate>,
      flexGrow: 4
    },
    {
      key: 'facility',
      title: <Translate>Facility</Translate>,
      flexGrow: 4,
      render: rowData => (
        <span>
          {conjureValueBasedOnKeyFromList(
            facilityListResponse?.object ?? [],
            rowData.facilityKey,
            'facilityName'
          )}
        </span>
      )
    },
    {
      key: 'departmentKey',
      title: <Translate>Department</Translate>,
      flexGrow: 4,
      render: rowData => (
        <span>
          {conjureValueBasedOnKeyFromList(
            departmentListResponse?.object ?? [],
            rowData.departmentKey,
            'department_key'
          )}
        </span>
      )
    },
    {
      key: 'startTime',
      title: <Translate>Start Time</Translate>,
      flexGrow: 4,
      render: rowData => convertSecondsToTime(rowData.startTime)
    },
    {
      key: 'endTime',
      title: <Translate>End Time</Translate>,
      flexGrow: 4,
      render: rowData => convertSecondsToTime(rowData.endTime)
    },
    {
      key: 'breakFrom',
      title: <Translate>Break From</Translate>,
      flexGrow: 4,
      render: rowData => convertSecondsToTime(rowData.breakFrom)
    },
    {
      key: 'breakTo',
      title: <Translate>Break To</Translate>,
      flexGrow: 4,
      render: rowData => convertSecondsToTime(rowData.breakTo)
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
      flexGrow: 3,
      render: rowData => iconsForActions(rowData)
    }
  ];
  
  // Main modal content
  const conjureFormMainContent = (stepNumber = 0) => {
    switch (stepNumber) {
      case 0:
        return (
          <div>
            <Form fluid layout="inline" className="container-of-header-availability-time">
              <MyInput
                showLabel={false}
                fieldType="checkPicker"
                fieldName={'selected'}
                selectData={dataOfDays}
                selectDataLabel="label"
                selectDataValue="value"
                record={record}
                setRecord={setRecord}
                width={250}
              />
              <MyButton
                prefixIcon={() => <AddOutlineIcon />}
                color="var(--deep-blue)"
                onClick={handleNew}
                width="109px"
              >
                Add New
              </MyButton>
            </Form>
            <MyTable
              height={450}
              data={arrOfTable}
              columns={tableColumns}
              rowClassName={isSelected}
              onRowClick={rowData => {
                setAvailabilityTime(rowData);
              }}
              sortColumn={listRequest.sortBy}
              sortType={listRequest.sortType}
              onSortChange={(sortBy, sortType) => {
                if (sortBy) setListRequest({ ...listRequest, sortBy, sortType });
              }}
            />
          </div>
        );
    }
  };
  // Child modal content
  const conjureFormChildContent = (stepNumber = 0) => {
    switch (stepNumber) {
      case 0:
        return (
          <Form fluid layout="inline">
            <MyInput
              column
              fieldName="facilityKey"
              fieldType="select"
              selectData={facilityListResponse?.object ?? []}
              selectDataLabel="facilityName"
              selectDataValue="key"
              record={resourcesAvailabilityTime}
              setRecord={setResourcesAvailabilityTime}
              width={350}
            />
            <MyInput
              column
              fieldName="departmentKey"
              fieldType="select"
              selectData={departmentListResponse?.object ?? []}
              selectDataLabel="name"
              selectDataValue="key"
              record={resourcesAvailabilityTime}
              setRecord={setResourcesAvailabilityTime}
              width={350}
            />
            <MyInput
              required
              column
              fieldName="dayLkey"
              fieldType="select"
              selectData={dayLovQueryResponse?.object ?? []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              record={resourcesAvailabilityTime}
              setRecord={setResourcesAvailabilityTime}
              width={350}
            />
            <MyInput
              column
              fieldName="startTime"
              fieldType="time"
              record={recordOfTimes}
              setRecord={setRecordOfTimes}
              width={350}
            />
            <MyInput
              column
              fieldName="endTime"
              fieldType="time"
              record={recordOfTimes}
              setRecord={setRecordOfTimes}
              width={350}
            />
            <MyInput
              column
              fieldName="breakFrom"
              fieldType="time"
              record={recordOfTimes}
              setRecord={setRecordOfTimes}
              width={350}
            />
            <MyInput
              column
              fieldName="breakTo"
              fieldType="time"
              record={recordOfTimes}
              setRecord={setRecordOfTimes}
              width={350}
            />
          </Form>
        );
    }
  };
  return (
    <ChildModal
      open={open}
      setOpen={setOpen}
      showChild={openChildModal}
      setShowChild={setOpenChildModal}
      title='Availability Time'
      mainContent={conjureFormMainContent}
      actionChildButtonFunction={handleSave}
      hideActionBtn
      childTitle={resource?.key ? 'Edit Availability Time' : 'New Availability Time'}
      childContent={conjureFormChildContent}
      mainSize="sm"
      mainStep={[{ title: 'Availability Time', icon:<GrScheduleNew />}]}
      childStep={[{ title: 'Availability Time', icon:<GrScheduleNew />}]}
    />
  );
};
export default AvailabilityTimeModal;
