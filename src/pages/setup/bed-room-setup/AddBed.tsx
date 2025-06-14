import React, { useEffect, useState } from 'react';
import {
  useGetBedListQuery,
  useGetLovValuesByCodeQuery,
  useSaveBedMutation,
  useDeactiveActivBedMutation
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
import { ApBed, ApDepartment } from '@/types/model-types';
import { newApBed } from '@/types/model-types-constructor';
import { newApFacility, newApDepartment } from '@/types/model-types-constructor';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { FaUndo } from 'react-icons/fa';
import { ApFacility } from '@/types/model-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBedPulse } from '@fortawesome/free-solid-svg-icons'
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
const AddBed = ({ open, setOpen, room, setRoom }) => {
  const dispatch = useAppDispatch();
  const [facility, setFacility] = useState<ApFacility>({ ...newApFacility });
  const [departments, setDepartments] = useState<ApDepartment>({ ...newApDepartment });
  const [bed, setBed] = useState<ApBed>({ ...newApBed });
  const [openChildModal, setOpenChildModal] = useState(false);
  const [openConfirmDeleteBedModal, setOpenConfirmDeleteBedModal] = useState<boolean>(false);
  const [stateOfDeleteBedModal, setStateOfDeleteBedModal] = useState<string>('delete');
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

  // Fetch LOV data for various fields
  const { data: fetchBedsListQueryResponce, isFetching, refetch } = useGetBedListQuery(roomBedsListRequest, { skip: !room?.key });
  const { data: bedTypeQueryResponse } = useGetLovValuesByCodeQuery('BED_TYPES');

  // save Bed Mutation
  const [saveBed] = useSaveBedMutation();
  //Deactivate & Activate Bed Mutation
  const [deactiveActiveBed] = useDeactiveActivBedMutation();

  // class name for selected row in beds table
  const isSelectedBed = rowData => {
    if (rowData && bed && bed.key === rowData.key) {
      return 'selected-row';
    } else return '';
  };

  // Icons column (Edit, reactive/Deactivate)
  const iconsForBeds = (rowData: ApBed) => (
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
            setStateOfDeleteBedModal('deactivate');
            setOpenConfirmDeleteBedModal(true);
          }}
        />
      ) : (
        <FaUndo
          className="icons-room"
          title="Activate"
          size={24}
          fill="var(--primary-gray)"
          onClick={() => {
            setStateOfDeleteBedModal('reactivate');
            setOpenConfirmDeleteBedModal(true);
          }}
        />
      )}
    </div>
  );

  //Table  columns
  const tableBedsColumns = [
    {
      key: 'name',
      title: <Translate>Bed Name</Translate>,
      flexGrow: 3,
    },
    {
      key: 'locationDetails',
      title: <Translate>Location Details</Translate>,
      flexGrow: 3
    },
    {
      key: 'bedTypeLkey',
      title: <Translate>Type</Translate>,
      flexGrow: 3,
      render: rowData => rowData.bedTypeLvalue
        ? rowData.bedTypeLvalue.lovDisplayVale
        : rowData.bedTypeLkey
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
      flexGrow: 3,
      render: rowData => iconsForBeds(rowData)
    }
  ];
  // handle Deactive Reactivate Bed
  const handleDeactiveReactivateBed = () => {
    deactiveActiveBed(bed)
      .unwrap()
      .then(() => {
        refetch();
        if (bed.isValid) {
          dispatch(notify('Bed Deactived Successfully'));
        } else {
          dispatch(notify('Bed Activated Successfully'));
        }
        setBed(newApBed);
      });
    setOpenConfirmDeleteBedModal(false);
  };
  // handle save Bed Function
  const handleSave = () => {
    saveBed({
      ...bed,
      roomKey: room?.key,
      isValid: true
    })
      .unwrap()
      .then(() => {
        if (bed.key) {
          dispatch(notify('Bed Updated Successfully'));
        } else {
          dispatch(notify('Bed Added Successfully'));
        }
        refetch();
        setBed({ ...newApBed, bedTypeLkey: null });
      }).catch(() => {
        dispatch(notify('Failed to Save Bed'));
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
                  setBed({ ...newApBed });
                  setOpenChildModal(true);
                }}
                width="90px"
              >
                Add
              </MyButton>
            </div>
            <MyTable
              height={400}
              data={fetchBedsListQueryResponce?.object ?? []}
              loading={isFetching}
              columns={tableBedsColumns}
              rowClassName={isSelectedBed}
              onRowClick={rowData => {
                setBed(rowData);
              }}
              sortColumn={roomBedsListRequest.sortBy}
              sortType={roomBedsListRequest.sortType}
              onSortChange={(sortBy, sortType) => {
                if (sortBy)
                  setRoomBedsListRequest({
                    ...roomBedsListRequest,
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
              width={350}
              fieldLabel="Bed Name"
              fieldName="name"
              record={bed}
              setRecord={setBed}
            />
            <MyInput
              column
              width={350}
              fieldLabel="Bed Type"
              fieldType="select"
              fieldName="bedTypeLkey"
              selectData={bedTypeQueryResponse?.object ?? []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              record={bed}
              setRecord={setBed}
            />
            <MyInput
              width={350}
              fieldType="textarea"
              fieldLabel="Location"
              fieldName="locationDetails"
              record={bed}
              setRecord={setBed}
            />
          </Form>
        );
    };
  }

  // Effects
  useEffect(() => {
    setDepartments(room?.department);
    setFacility(room?.facility)
  }, [room]);

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
  return (<>
    <ChildModal
      open={open}
      setOpen={setOpen}
      showChild={openChildModal}
      setShowChild={setOpenChildModal}
      title="New Bed"
      mainContent={conjureFormContentOfMainModal}
      childStep={[
        {
          title: 'Bed',
          icon: <FontAwesomeIcon icon={faBedPulse} />
        }
      ]}
      mainStep={[
        {
          title: 'Beds',
          icon: <FontAwesomeIcon icon={faHospital} />
        }
      ]}
      childTitle={bed?.key ? "Edit Bed Info" : "Add Bed"}
      childContent={conjureFormContentOfChildModal}
      mainSize="sm"
      actionChildButtonFunction={handleSave}
      hideActionBtn={true}
    />
    <DeletionConfirmationModal
      open={openConfirmDeleteBedModal}
      setOpen={setOpenConfirmDeleteBedModal}
      itemToDelete="Bed"
      actionButtonFunction={handleDeactiveReactivateBed}
      actionType={stateOfDeleteBedModal}
    />
  </>
  );
};
export default AddBed;