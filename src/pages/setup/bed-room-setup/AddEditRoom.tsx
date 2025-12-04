import React, { useEffect, useMemo, useState } from 'react';
import { Form } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDoorOpen } from '@fortawesome/free-solid-svg-icons';
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { newApRoom } from '@/types/model-types-constructor';
import { useEnumOptions } from '@/services/enumsApi';
import {
  useGetLovValuesByCodeQuery,
  useSaveRoomMutation
} from '@/services/setupService';
import { useGetAllFacilitiesQuery } from '@/services/security/facilityService';
import { useGetDepartmentByTypeAndFacilityQuery } from '@/services/security/departmentService';

const PAGE_SIZE = 20;

const AddEditRoom = ({
  open,
  setOpen,
  room,
  setRoom,
  refetch
}) => {
  const dispatch = useAppDispatch();

  const DepartmentTypeEnum = useEnumOptions('DepartmentType', {
    exclude: [
      'OUTPATIENT_CLINIC',
      'REGISTRATION',
      'LABORATORY',
      'RADIOLOGY',
      'PATHOLOGY',
      'GENETIC_LAB',
      'OPTIC_LAB',
      'PHARMACY',
      'BLOOD_BANK',
      'DIALYSIS_ROOM',
      'PHYSIOTHERAPY_ROOM',
      'STERILIZATION_ROOM',
      'MAINTENANCE',
      'LAUNDRY',
      'KITCHEN',
      'MORGUE'
    ]
  });

  const { data: roomTypesLovQueryResponse } = useGetLovValuesByCodeQuery('ROOM_TYPES');
  const { data: genderLovQueryResponse } = useGetLovValuesByCodeQuery('GNDR');

  const [saveRoom] = useSaveRoomMutation();
  const { data: facilitiesResponse } = useGetAllFacilitiesQuery({});

  // Department type dropdown (enum / filter)
  const [departmentType, setDepartmentType] = useState<{ value?: string } | null>({
    value: ''
  });

  const [deptPage, setDeptPage] = useState(0);
  const [departmentOptions, setDepartmentOptions] = useState<any[]>([]);

  const [isGenderSpecific, setGenderSpecific] = useState<{ genderSpecific: boolean }>({
    genderSpecific: false
  });

  const isEdit = !!(room?.id ?? room?.key);

  // Normalize facilityKey / departmentKey to string in form
  useEffect(() => {
    if (!room) return;

    setRoom((prev: any) => {
      if (!prev) return prev;
      return {
        ...prev,
        facilityKey:
          prev.facilityKey !== undefined &&
          prev.facilityKey !== null &&
          prev.facilityKey !== ''
            ? String(prev.facilityKey)
            : '',
        departmentKey:
          prev.departmentKey !== undefined &&
          prev.departmentKey !== null &&
          prev.departmentKey !== ''
            ? String(prev.departmentKey)
            : ''
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.id]);

  // Fetch departments whenever there is a facilityKey (optionally filtered by DepartmentType)
  const shouldFetchDepartments = Boolean(room?.facilityKey);

  const {
    data: departmentsPage,
    isFetching: isFetchingDepartments
  } = useGetDepartmentByTypeAndFacilityQuery(
    shouldFetchDepartments
      ? {
          type: departmentType?.value || '',
          facilityId: Number(room.facilityKey),
          page: deptPage,
          size: PAGE_SIZE,
          sort: 'name,asc'
        }
      : { type: '', facilityId: '', page: 0, size: PAGE_SIZE },
    {
      skip: !shouldFetchDepartments
    }
  );

  // Reset pagination when facility or department type changes
  useEffect(() => {
    setDeptPage(0);
    setDepartmentOptions([]);
  }, [room?.facilityKey, departmentType?.value]);

  // Merge department pages
  useEffect(() => {
    if (departmentsPage?.data) {
      setDepartmentOptions(prev =>
        deptPage === 0
          ? departmentsPage.data
          : [
              ...prev,
              ...departmentsPage.data.filter(d => !prev.some(p => p.id === d.id))
            ]
      );
    }
  }, [departmentsPage, deptPage]);

  const hasMoreDepartments =
    !!departmentsPage?.links?.next ||
    (departmentsPage?.totalCount ?? 0) > departmentOptions.length;

  const handleFetchMoreDepartments = () => {
    if (hasMoreDepartments && !isFetchingDepartments) {
      setDeptPage(prev => prev + 1);
    }
  };

  // Auto-pagination to reach departmentKey when editing
  useEffect(() => {
    if (!isEdit) return;
    if (!room?.departmentKey) return;
    if (!hasMoreDepartments) return;
    if (isFetchingDepartments) return;

    const exists = departmentOptions.some(
      d => String(d.id) === String(room.departmentKey)
    );
    if (!exists && hasMoreDepartments) {
      setDeptPage(prev => prev + 1);
    }
  }, [
    isEdit,
    room?.departmentKey,
    departmentOptions,
    hasMoreDepartments,
    isFetchingDepartments
  ]);

  // CLEAR
  const handleClearField = () => {
    setRoom({
      ...newApRoom,
      typeLkey: null,
      genderLkey: null,
      facilityKey: '',
      departmentKey: ''
    });
    setDepartmentType({ value: '' });
    setDeptPage(0);
    setDepartmentOptions([]);
    setGenderSpecific({ genderSpecific: false });
  };

  // SAVE
  const handleSave = () => {
    if (!room) return;

    saveRoom({
      ...room,
      isValid: true
    })
      .unwrap()
      .then(() => {
        if (room.id || room.key) {
          dispatch(notify('Room Updated Successfully'));
        } else {
          dispatch(notify('Room Added Successfully'));
        }
        refetch();
        setOpen(false);
      })
      .catch(() => {
        dispatch(notify('Failed to Save Room'));
      });
  };

  // genderSpecific derived from room.genderLkey
  useEffect(() => {
    setGenderSpecific({ genderSpecific: !!room?.genderLkey });
  }, [room]);

  // Normalize IDs to string for facility / department select
  const normalizedFacilities = useMemo(
    () =>
      (facilitiesResponse ?? []).map((f: any) => ({
        ...f,
        id: String(f.id)
      })),
    [facilitiesResponse]
  );

  const normalizedDepartments = useMemo(
    () =>
      (departmentOptions ?? []).map((d: any) => ({
        ...d,
        id: String(d.id)
      })),
    [departmentOptions]
  );

  // Selected department based on departmentKey
  const selectedDepartment = useMemo(
    () =>
      normalizedDepartments.find(
        d => d.id === (room?.departmentKey != null ? String(room.departmentKey) : '')
      ),
    [normalizedDepartments, room?.departmentKey]
  );

  // Infer DepartmentType from department when editing and DepartmentType not manually set
  useEffect(() => {
    if (!selectedDepartment) return;
    if (departmentType?.value) return;

    const typeFromDept =
      selectedDepartment.departmentType ||
      selectedDepartment.type ||
      selectedDepartment.departmentTypeKey ||
      '';

    if (typeFromDept) {
      setDepartmentType({ value: typeFromDept });
    }
  }, [selectedDepartment, departmentType?.value]);

  // Displayable department type name from department object
  const selectedDepartmentTypeName =
    selectedDepartment?.departmentTypeName ||
    selectedDepartment?.typeName ||
    selectedDepartment?.departmentType ||
    selectedDepartment?.type ||
    '';

  const content = (
    <Form fluid layout="inline">
      {/* Facility */}
      <MyInput
        width={250}
        column
        fieldLabel="Facility"
        fieldName="facilityKey"
        required
        fieldType="select"
        selectData={normalizedFacilities}
        selectDataLabel="name"
        selectDataValue="id"
        record={room}
        setRecord={setRoom}
        disabled={room?.facilityKey && room?.key}
      />

      {/* Department type (enum / filter, can be auto-filled) */}
      <MyInput
        column
        fieldName="value"
        fieldLabel="Department type"
        fieldType="select"
        selectData={DepartmentTypeEnum ?? []}
        selectDataLabel="label"
        selectDataValue="value"
        record={departmentType}
        setRecord={setDepartmentType}
        menuMaxHeight={200}
        width={250}
        searchable={false}
      />

      {/* Department with pagination */}
      <MyInput
        width={250}
        column
        fieldType="selectPagination"
        fieldLabel="Department"
        fieldName="departmentKey"
        selectData={normalizedDepartments}
        selectDataLabel="name"
        selectDataValue="id"
        record={room}
        setRecord={setRoom}
        loading={isFetchingDepartments}
        hasMore={hasMoreDepartments}
        onFetchMore={handleFetchMoreDepartments}
        menuMaxHeight={240}
      />

      {/* Department type from department object (display only) */}
      <MyInput
        width={250}
        column
        fieldLabel="Department Type (from Department)"
        fieldName="departmentTypeName"
        fieldType="text"
        record={{ departmentTypeName: selectedDepartmentTypeName }}
        setRecord={() => {}}
        disabled
      />

      <MyInput
        width={250}
        fieldLabel="Name"
        column
        fieldName="name"
        record={room}
        setRecord={setRoom}
      />
      <MyInput
        width={250}
        fieldLabel="Floor"
        column
        fieldName="floor"
        record={room}
        setRecord={setRoom}
      />
      <MyInput
        width={250}
        column
        fieldLabel="Location Details"
        fieldType="textarea"
        fieldName="locationDetails"
        record={room}
        setRecord={setRoom}
      />
      <MyInput
        column
        width={250}
        fieldLabel="Type"
        fieldType="select"
        fieldName="typeLkey"
        selectData={roomTypesLovQueryResponse?.object ?? []}
        selectDataLabel="lovDisplayVale"
        selectDataValue="key"
        record={room}
        setRecord={setRoom}
      />
      <MyInput
        column
        width={250}
        fieldLabel="Gender Specific"
        fieldType="checkbox"
        fieldName="genderSpecific"
        record={isGenderSpecific}
        setRecord={setGenderSpecific}
      />
      <MyInput
        column
        width={250}
        fieldLabel="Gender"
        fieldType="select"
        fieldName="genderLkey"
        selectData={genderLovQueryResponse?.object ?? []}
        selectDataLabel="lovDisplayVale"
        selectDataValue="key"
        record={room}
        setRecord={setRoom}
        disabled={!isGenderSpecific?.genderSpecific}
      />
    </Form>
  );

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={isEdit ? 'Edit Room Information' : 'Add New Room'}
      actionButtonFunction={handleSave}
      position="right"
      size="38vw"
      steps={[
        {
          title: 'Room',
          icon: <FontAwesomeIcon icon={faDoorOpen} />,
          footer: (
            <MyButton appearance="ghost" onClick={handleClearField}>
              Clear
            </MyButton>
          )
        }
      ]}
      content={content}
    />
  );
};

export default AddEditRoom;
