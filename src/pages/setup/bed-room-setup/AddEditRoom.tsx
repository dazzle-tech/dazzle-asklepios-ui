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
import {
  useGetAllDepartmentsWithoutPaginationQuery,
  useGetDepartmentByTypeAndFacilityQuery
} from '@/services/security/departmentService';
import { Department } from '@/types/model-types-new';
import { newDepartment } from '@/types/model-types-constructor-new';

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
  const genders =useEnumOptions('Gender')
  const [department, setDepartment] = useState<Department>({ ...newDepartment });
  const { data: allDepartments } = useGetAllDepartmentsWithoutPaginationQuery({});
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

    const facilityNeedsNormalization =
      room.facilityKey !== undefined &&
      room.facilityKey !== null &&
      room.facilityKey !== '' &&
      typeof room.facilityKey !== 'string';

    const departmentNeedsNormalization =
      room.departmentKey !== undefined &&
      room.departmentKey !== null &&
      room.departmentKey !== '' &&
      typeof room.departmentKey !== 'string';

    if (!facilityNeedsNormalization && !departmentNeedsNormalization) return;

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
  }, [room?.id, room?.key]);

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

  useEffect(() => {
    if (open && room && (room.id || room.key)) {
      const allDepts = [
        ...(allDepartments ?? []),
        ...(departmentOptions ?? [])
      ];

      if (room.departmentKey) {
        const found = allDepts.find(
          (d: any) => String(d.id) === String(room.departmentKey)
        );

        if (found) {
          if (department.id !== found.id) {
            setDepartment(found as Department);
          }

          const typeFromDept =
            (found as any).type ||
            (found as any).departmentType ||
            (found as any).departmentTypeKey ||
            '';

          if (typeFromDept && departmentType?.value !== typeFromDept) {
            setDepartmentType({ value: typeFromDept });
          }
        }
      }

      const shouldBeChecked = !!room.genderLkey;
      if (isGenderSpecific.genderSpecific !== shouldBeChecked) {
        setGenderSpecific({ genderSpecific: shouldBeChecked });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, room?.id, room?.key, room?.departmentKey, room?.genderLkey]);

  // CLEAR
  const handleClearField = () => {
    setRoom({
      ...newApRoom,
      typeLkey: null,
      genderLkey: null,
      facilityKey: '',
      departmentKey: 0
    });
    setDepartment({ ...newDepartment });
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

  useEffect(() => {
    const shouldBeChecked = !!room?.genderLkey;
    if (isGenderSpecific.genderSpecific !== shouldBeChecked) {
      setGenderSpecific({ genderSpecific: shouldBeChecked });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.genderLkey]);

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


  useEffect(() => {
    if (!room?.departmentKey) {
      if (department.id) {
        setDepartment({ ...newDepartment });
      }
      return;
    }

    const allDepts = [
      ...(allDepartments ?? []),
      ...(departmentOptions ?? [])
    ];

    const found = allDepts.find(
      (d: any) => String(d.id) === String(room.departmentKey)
    );

    if (found) {
      if (department.id !== found.id) {
        setDepartment(found as Department);
      }
    } else {
      if (department.id) {
        setDepartment({ ...newDepartment });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.departmentKey]);

  useEffect(() => {
    if (!department) return;

    const typeFromDept =
      (department as any).type ||
      (department as any).departmentType ||
      (department as any).departmentTypeKey ||
      '';

    if (typeFromDept) {
      if (departmentType?.value !== typeFromDept) {
        setDepartmentType({ value: typeFromDept });
      }
    } else {
      if (departmentType?.value !== '') {
        setDepartmentType({ value: '' });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [department?.id]);

  const handleRoomChangeAndDepartment = (updater: any) => {
    setRoom((prev: any) => {
      const next =
        typeof updater === 'function' ? updater(prev) : updater;

      const allDepts = [
        ...(allDepartments ?? []),
        ...(departmentOptions ?? [])
      ];

      if (next?.departmentKey) {
        const found = allDepts.find(
          (d: any) => String(d.id) === String(next.departmentKey)
        );
        if (found) {
          setDepartment(found as Department);
        } else {
          setDepartment({ ...newDepartment });
        }
      } else {
        setDepartment({ ...newDepartment });
      }

      return next;
    });
  };

  const content = (
    <Form fluid layout="inline">
      {/* Facility */}
      <MyInput
        width={'13vw'}
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
        width={'13vw'}
        searchable={false}
      />

      {
        !isEdit ? (
          <MyInput
            width={'13vw'}
            column
            fieldType="selectPagination"
            fieldLabel="Department"
            fieldName="departmentKey"
            selectData={normalizedDepartments}
            selectDataLabel="name"
            selectDataValue="id"
            record={room}
            setRecord={handleRoomChangeAndDepartment}
            loading={isFetchingDepartments}
            hasMore={hasMoreDepartments}
            onFetchMore={handleFetchMoreDepartments}
            menuMaxHeight={240}
          />
        ) : (
          normalizedDepartments === undefined ? (
            <MyInput
              width={'13vw'}
              column
              fieldType="selectPagination"
              fieldLabel="Department"
              fieldName="departmentKey"
              selectData={normalizedDepartments}
              selectDataLabel="name"
              selectDataValue="id"
              record={room}
              setRecord={handleRoomChangeAndDepartment}
              loading={isFetchingDepartments}
              hasMore={hasMoreDepartments}
              onFetchMore={handleFetchMoreDepartments}
              menuMaxHeight={240}
            />
          ) : (
            <MyInput
              width={'13vw'}
              column
              fieldType="select"
              fieldLabel="Department"
              fieldName="departmentKey"
              selectData={
                departmentType?.value && normalizedDepartments.length > 0
                  ? normalizedDepartments
                  : allDepartments
              }
              selectDataLabel="name"
              selectDataValue="id"
              record={room}
              setRecord={handleRoomChangeAndDepartment}
              loading={isFetchingDepartments}
              hasMore={hasMoreDepartments}
              onFetchMore={handleFetchMoreDepartments}
              menuMaxHeight={240}
            />
          )
        )
      }

      <MyInput
        width={'13vw'}
        fieldLabel="Name"
        column
        fieldName="name"
        record={room}
        setRecord={setRoom}
      />
      <MyInput
        width={'13vw'}
        fieldLabel="Floor"
        column
        fieldName="floor"
        record={room}
        setRecord={setRoom}
      />
      <MyInput
        width={'13vw'}
        column
        fieldLabel="Location Details"
        fieldType="textarea"
        fieldName="locationDetails"
        record={room}
        setRecord={setRoom}
      />
      <MyInput
        column
        width={'13vw'}
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
        width={'13vw'}
        fieldLabel="Gender Specific"
        fieldType="checkbox"
        fieldName="genderSpecific"
        record={isGenderSpecific}
        setRecord={setGenderSpecific}
      />
      <MyInput
        column
        width={'13vw'}
        fieldLabel="Gender"
        fieldType="select"
        fieldName="genderLkey"
        selectData={genders ?? []}
        selectDataLabel="label"
        selectDataValue="value"
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