import React, { useEffect, useState } from 'react';
import {
  useGetBedListQuery,
  useGetLovValuesByCodeQuery,
  useSaveRoomServicesMutation,
  useDeactiveActivRoomServicesMutation,
  useGetRoomServicesListQuery
} from '@/services/setupService';
import MyInput from '@/components/MyInput';
import { faHospital } from '@fortawesome/free-solid-svg-icons';
import { Form } from 'rsuite';
import './styles.less';
import { MdDelete } from 'react-icons/md';
import ChildModal from '@/components/ChildModal';
import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { MdModeEdit } from 'react-icons/md';
import { initialListRequest, ListRequest } from '@/types/types';
import MyButton from '@/components/MyButton/MyButton';
import { ApBed, ApDepartment, ApRoomServices, ApService } from '@/types/model-types';
import { newApRoomServices, newApService } from '@/types/model-types-constructor';
import { newApFacility, newApDepartment } from '@/types/model-types-constructor';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { FaUndo } from 'react-icons/fa';
import { ApFacility } from '@/types/model-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBellConcierge } from '@fortawesome/free-solid-svg-icons';
import { useGetServicesQuery } from '@/services/setupService';
import { ApRoom } from '@/types/model-types';
import { newApRoom } from '@/types/model-types-constructor';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
const AddService = ({ open, setOpen, roomObj, setRoomObj }) => {
  const dispatch = useAppDispatch();
  const [room, setRoom] = useState<ApRoom>({ ...newApRoom });
  const [service, setService] = useState<any>({ service: newApService });
  const [selectedService, setSelectedService] = useState<ApService>({ ...newApService })
  const [roomService, setRoomService] = useState<ApRoomServices>({ ...newApRoomServices });
  const [hasBedSpecific, setHasBedSpecific] = useState({ bedSpecific: false });
  const [openChildModal, setOpenChildModal] = useState(false);
  const [facility, setFacility] = useState<ApFacility>({ ...newApFacility });
  const [departments, setDepartments] = useState<ApDepartment>({ ...newApDepartment });
  const [openConfirmDeleteServiceModal, setOpenConfirmDeleteServiceModal] = useState<boolean>(false);
  const [stateOfDeleteServiceModal, setStateOfDeleteServiceModal] = useState<string>('delete');
  const [serviceListRequest, setServiceListRequest] = useState<ListRequest>({
    ...initialListRequest,
    filters: [
      {
        fieldName: 'deleted_at',
        operator: 'isNull',
        value: undefined
      },
    ]
  });
  const [roomBedsListRequest, setRoomBedsListRequest] = useState<ListRequest>({
    ...initialListRequest,
    filters: [
      {
        fieldName: 'deleted_at',
        operator: 'isNull',
        value: undefined
      },
    ]
  });
  const [roomServicesListRequest, setRoomServicesListRequest] = useState<ListRequest>({
    ...initialListRequest,
    filters: [
      {
        fieldName: 'deleted_at',
        operator: 'isNull',
        value: undefined
      },
    ]
  });
  // Fetch service list response
  const { data: serviceListResponse } = useGetServicesQuery(serviceListRequest);
  // Fetch Bed list response
  const { data: fetchBedsListQueryResponce } = useGetBedListQuery(roomBedsListRequest, { skip: !room?.key });
  // Fetch Room Service list response
  const { data: fetchServicesListQueryResponce, isFetching: fetchingServicesList, refetch: refetchServices } = useGetRoomServicesListQuery(roomServicesListRequest, { skip: !room?.key });

  const servicesArray = serviceListResponse?.object?.map(service => ({
    key: service.key,
    name: service.name,
    object: service
  })) || [];
  // Fetch LOV data for various fields
  const { data: currencyLovQueryResponse } = useGetLovValuesByCodeQuery('CURRENCY');
  // save Service Mutation
  const [saveServices] = useSaveRoomServicesMutation();
  //Deactivate & Activate Room service Mutation
  const [deactiveActiveRoomService] = useDeactiveActivRoomServicesMutation();

  // class name for selected row in Services table
  const isSelectedBed = rowData => {
    if (rowData && roomService && roomService.key === rowData.key) {
      return 'selected-row';
    } else return '';
  };

  // Icons column (Edit, reactive/Deactivate)
  const iconsForServices = (rowData: ApBed) => (
    <div className="container-of-icons-bed">
      <MdModeEdit
        className="icons-vaccine"
        title="Edit"
        size={24}
        fill="var(--primary-gray)"
        onClick={() => {
          setOpenChildModal(true);
        }}
      />
      {rowData?.isValid ? (
        <MdDelete
          className="icons-room"
          title="Deactivate"
          size={24}
          fill="var(--primary-pink)"
          onClick={() => {
            setStateOfDeleteServiceModal('deactivate');
            setOpenConfirmDeleteServiceModal(true);
          }}
        />
      ) : (
        <FaUndo
          className="icons-room"
          title="Activate"
          size={24}
          fill="var(--primary-gray)"
          onClick={() => {
            setStateOfDeleteServiceModal('reactivate');
            setOpenConfirmDeleteServiceModal(true);
          }}
        />
      )}
    </div>
  );

  //Table  columns
  const tableServicesColumns = [
    {
      key: 'name',
      title: <Translate>Service Name</Translate>,
      flexGrow: 3,
      render: rowData => rowData?.apService?.name
    },
    {
      key: 'price',
      title: <Translate>Price</Translate>,
      flexGrow: 3
    },
    {
      key: 'currencyLkey',
      title: <Translate>Type</Translate>,
      flexGrow: 3,
      render: rowData => rowData.currencyLvalue
        ? rowData.currencyLvalue.lovDisplayVale
        : rowData.currencyLkey
    },
    {
      key: 'bedKey',
      title: <Translate>Has Spacific Bed</Translate>,
      flexGrow: 3,
      render: rowData => rowData.bedKey
        ? "YES"
        : "NO"
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
      flexGrow: 3,
      render: rowData => iconsForServices(rowData)
    }
  ];
  // handle Deactive Reactivate Service
  const handleDeactiveReactivateService = () => {
    deactiveActiveRoomService(roomService)
      .unwrap()
      .then(() => {
        refetchServices();
        if (roomService.isValid) {
          dispatch(notify('Room Service Deactived Successfully'));
        } else {
          dispatch(notify('Room Service Activated Successfully'));
        }
        setRoomService(newApRoomServices);
      });
    setOpenConfirmDeleteServiceModal(false);
  };
  // handle save Room Service Function
  const handleSave = () => {
    if (!selectedService?.key) {
      dispatch(notify('Please select a service before saving'));
      return;
    }

    saveServices({
      ...roomService,
      roomKey: room?.key,
      serviceKey: selectedService?.key,
      isValid: true,
      price: selectedService?.price,
      currencyLkey: selectedService?.currencyLkey
    })
      .unwrap()
      .then(() => {
        refetchServices();
        setRoomService({ ...newApRoomServices, currencyLkey: null, bedKey: undefined });
        setSelectedService({ ...newApService, currencyLkey: null });
        setService({ service: { ...newApService, currencyLkey: null } });
        setHasBedSpecific({ bedSpecific: false });
        if (roomService.key) {
          dispatch(notify('Room service updated successfully'));
        } else {
          dispatch(notify('Room service added successfully'));
        }
      })
      .catch(() => {
        dispatch(notify('Failed to save room service'));
      });
  };

  // Main modal content
  const conjureFormContentOfMainModal = stepNumber => {
    switch (stepNumber) {
      case 0:
        return (
          <Form fluid layout="inline">
            <div className='container-of-room-info'>
              <MyInput
                width={140}
                fieldLabel="Room Name"
                fieldName="name"
                record={room}
                setRecord={setRoom}
                disabled
              />
              <MyInput
                width={140}
                fieldLabel="facility"
                fieldName="facilityName"
                record={facility}
                setRecord={setFacility}
                disabled
              />
              <MyInput
                width={140}
                fieldLabel="Department"
                fieldName="name"
                record={departments}
                setRecord={setDepartments}
                disabled
              />
              <MyButton
                prefixIcon={() => <AddOutlineIcon />}
                color="var(--deep-blue)"
                onClick={() => {
                  setRoomService({ ...newApRoomServices, currencyLkey: null, bedKey: undefined });
                  setSelectedService({ ...newApService, currencyLkey: null });
                  setService({ service: { ...newApService, currencyLkey: null } });
                  setHasBedSpecific({ bedSpecific: false });
                  setOpenChildModal(true);
                }}
                width="90px"
              >
                Add
              </MyButton>
            </div>
            <MyTable
              height={400}
              data={fetchServicesListQueryResponce?.object ?? []}
              loading={fetchingServicesList}
              columns={tableServicesColumns}
              rowClassName={isSelectedBed}
              onRowClick={rowData => {
                setRoomService(rowData);
                setService({ service: rowData?.apService });
                setSelectedService(rowData?.apService);
                setHasBedSpecific({ bedSpecific: rowData?.bedKey ? true : false });
              }}
              sortColumn={roomServicesListRequest.sortBy}
              sortType={roomServicesListRequest.sortType}
              onSortChange={(sortBy, sortType) => {
                if (sortBy)
                  setRoomServicesListRequest({
                    ...roomServicesListRequest,
                    sortBy,
                    sortType
                  });
              }}
            />
          </Form>
        );
    };
  }
  // Child modal content
  const conjureFormContentOfChildModal = stepNumber => {
    switch (stepNumber) {
      case 0:
        return (
          <Form fluid layout="inline">
            <MyInput
              column
              width={350}
              fieldLabel="Service Name"
              fieldType="select"
              fieldName="service"
              selectData={servicesArray ?? []}
              selectDataLabel="name"
              selectDataValue="object"
              record={service}
              setRecord={setService}
              placeholder={service?.service?.name ? service?.service?.name : "Select Service"}
            />
            <div className='container-of-multi-fields-form'>
              <MyInput
                width={175}
                fieldName="price"
                fieldType="number"
                record={selectedService}
                setRecord={setSelectedService}
                disabled
              />
              <MyInput
                width={175}
                fieldName="currencyLkey"
                fieldType="select"
                selectData={currencyLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={selectedService}
                setRecord={setSelectedService}
                disabled
              />
            </div>
            <div className='container-of-multi-fields-form'>
              <MyInput
                column
                width={175}
                fieldLabel="Bed Specific"
                fieldType="checkbox"
                fieldName="bedSpecific"
                record={hasBedSpecific}
                setRecord={setHasBedSpecific}
              />
              <MyInput
                column
                width={175}
                fieldLabel="Bed Name"
                fieldType="select"
                selectData={fetchBedsListQueryResponce?.object ?? []}
                selectDataLabel="name"
                selectDataValue="key"
                fieldName="bedKey"
                record={{
                  ...roomService,
                  bedKey: roomService?.bedKey ? roomService?.bedKey : null
                }}
                setRecord={setRoomService}
                searchable={false}
                disabled={!hasBedSpecific?.bedSpecific}
              />
            </div>
            <MyInput
              width={350}
              fieldLabel="Rule"
              fieldName="rule"
              record={roomService}
              setRecord={setRoomService}
            />
          </Form>
        );
    };
  }

  // Effects
  useEffect(() => {
    setRoom({ ...roomObj });
    setDepartments(roomObj?.department);
    setFacility(roomObj?.facility);
  }, [roomObj]);
  useEffect(() => {
    setSelectedService(service?.service);
  }, [service]);
  useEffect(() => {
    if (room?.key) {
      setRoomBedsListRequest(prev => ({
        ...prev,
        filters: [
          ...prev.filters.filter(f => f.fieldName !== 'room_key'),
          {
            fieldName: 'room_key',
            operator: 'match',
            value: room.key
          }
        ]
      }));
    }
  }, [room?.key]);
  useEffect(() => {
    if (room?.key) {
      setRoomServicesListRequest(prev => ({
        ...prev,
        filters: [
          ...prev.filters.filter(f => f.fieldName !== 'room_key'),
          {
            fieldName: 'room_key',
            operator: 'match',
            value: room.key
          }
        ]
      }));
    }
  }, [room?.key]);
  return (<>
    <ChildModal
      open={open}
      setOpen={setOpen}
      showChild={openChildModal}
      setShowChild={setOpenChildModal}
      title="New Service"
      mainContent={conjureFormContentOfMainModal}
      childStep={[
        {
          title: 'Service',
          icon: <FontAwesomeIcon icon={faBellConcierge} />
        }
      ]}
      mainStep={[
        {
          title: 'Services',
          icon: <FontAwesomeIcon icon={faHospital} />
        }
      ]}
      childTitle={roomService?.key ? "Edit Service Info" : "Add Service"}
      childContent={conjureFormContentOfChildModal}
      mainSize="sm"
      actionChildButtonFunction={handleSave}
      hideActionBtn={true}
    />
    <DeletionConfirmationModal
      open={openConfirmDeleteServiceModal}
      setOpen={setOpenConfirmDeleteServiceModal}
      itemToDelete="Service"
      actionButtonFunction={handleDeactiveReactivateService}
      actionType={stateOfDeleteServiceModal}
    />
  </>
  );
};
export default AddService;