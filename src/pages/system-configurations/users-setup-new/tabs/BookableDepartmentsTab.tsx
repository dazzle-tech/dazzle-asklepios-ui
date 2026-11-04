import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Form } from 'rsuite';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import MyButton from '@/components/MyButton/MyButton';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { MdDelete } from 'react-icons/md';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import MyInput from '@/components/MyInput';
import {
  useAddUserBookableDepartmentMutation,
  useLazyGetActiveUserBookableDepartmentsByUserQuery,
  useDeleteUserBookableDepartmentMutation,
} from '@/services/security/userBookableDepartments';
import { useGetAllFacilitiesQuery } from '@/services/security/facilityService';
import { useGetDepartmentsQuery, useLazyGetActiveDepartmentByFacilityListQuery } from '@/services/security/departmentService';
import { UserBookableDepartmentResponseVM } from '@/types/model-types-new';
import { newUserBookableDepartment } from '@/types/model-types-constructor-new';
import { ApUser } from '@/types/model-types-new';

interface BookableDepartmentsTabProps {
  user: ApUser;
  width: number;
}

type BookableDepartmentFormRecord = {
  id?: number;
  userId?: number;
  facilityId?: string | null;
  departmentId?: number;
};

const BookableDepartmentsTab: React.FC<BookableDepartmentsTabProps> = ({ user, width }) => {
  const dispatch = useAppDispatch();
  const userId = user?.id;

  const [getBookableDepartmentsByUser, { data: bookableDepartmentsResponse }] =
    useLazyGetActiveUserBookableDepartmentsByUserQuery();

  const [bookableDepartment, setBookableDepartment] = useState<BookableDepartmentFormRecord>({
    ...newUserBookableDepartment,
  });

  const { data: facilityListResponse } = useGetAllFacilitiesQuery({});
  const facilities = useMemo(
    () =>
      (Array.isArray(facilityListResponse) ? facilityListResponse : []).map((facility: any) => ({
        ...facility,
        name: facility?.name ?? facility?.facilityName ?? '',
      })),
    [facilityListResponse]
  );

  const { data: departmentListResponse } = useGetDepartmentsQuery({ page: 0, size: 10000 });
  const departmentList = useMemo(
    () => departmentListResponse?.data ?? [],
    [departmentListResponse]
  );

  const [openConfirmDeleteModal, setOpenConfirmDeleteModal] = useState<boolean>(false);
  const [openForm, setOpenForm] = useState<boolean>(false);

  const selectedFacilityId = bookableDepartment?.facilityId;

  const [
    fetchActiveDepartments,
    { data: departmentsResponse, isFetching: deptLoading, isError: deptFetchError, error: deptFetchErrorData },
  ] = useLazyGetActiveDepartmentByFacilityListQuery();

  useEffect(() => {
    if (!openForm || selectedFacilityId == null || selectedFacilityId === '') return;
    fetchActiveDepartments({ facilityId: selectedFacilityId });
  }, [openForm, selectedFacilityId, fetchActiveDepartments]);

  useEffect(() => {
    if (!deptFetchError || !openForm) return;
    const message =
      (deptFetchErrorData as any)?.data?.message ||
      (deptFetchErrorData as any)?.data?.detail ||
      'Failed to load departments for the selected facility';
    dispatch(notify({ msg: message, sev: 'error' }));
  }, [deptFetchError, deptFetchErrorData, openForm, dispatch]);

  const departmentOptions = useMemo(() => {
    const fromApi = Array.isArray(departmentsResponse) ? departmentsResponse : [];
    if (fromApi.length > 0) return fromApi;

    if (!selectedFacilityId) return [];

    const facilityKey = String(selectedFacilityId);
    return departmentList
      .filter((dept: { facilityId?: string | number; isActive?: boolean }) =>
        String(dept.facilityId) === facilityKey && dept.isActive !== false
      )
      .map((dept: { id?: number; facilityId?: string | number; name?: string }) => ({
        id: dept.id,
        facilityId: dept.facilityId,
        name: dept.name ?? String(dept.id),
      }));
  }, [departmentsResponse, departmentList, selectedFacilityId]);

  const [deleteUserBookableDepartment] = useDeleteUserBookableDepartmentMutation();

  const [saveBookableDepartment] = useAddUserBookableDepartmentMutation();

  const [pageIndex, setPageIndex] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const isSelected = (rowData: UserBookableDepartmentResponseVM) =>
    rowData?.id === bookableDepartment?.id ? 'selected-row' : '';

  useEffect(() => {
    if (userId) {
      getBookableDepartmentsByUser(userId);
      setBookableDepartment({
        ...newUserBookableDepartment,
        userId,
      });
    } else {
      setBookableDepartment({ ...newUserBookableDepartment });
    }
  }, [userId, getBookableDepartmentsByUser]);

  const refetchBookableDepartments = useCallback(() => {
    if (userId) {
      getBookableDepartmentsByUser(userId);
    }
  }, [userId, getBookableDepartmentsByUser]);

  const handleFacilityChange = (next: BookableDepartmentFormRecord) => {
    setBookableDepartment(prev => {
      const facilityChanged = next.facilityId !== prev.facilityId;
      return {
        ...next,
        departmentId: facilityChanged ? undefined : next.departmentId,
      };
    });
  };

  const resetToAddMode = () => {
    setOpenForm(false);
    setBookableDepartment({
      ...newUserBookableDepartment,
      userId,
    });
  };

  const handleAddSave = () => {
    if (!bookableDepartment?.facilityId || !bookableDepartment?.departmentId) {
      dispatch(notify({ msg: 'Please select both Facility and Department', sev: 'error' }));
      return;
    }

    if (!userId) return;

    saveBookableDepartment({
      userId,
      departmentId: bookableDepartment.departmentId,
    })
      .unwrap()
      .then(() => {
        // resetToAddMode();
        dispatch(notify({ msg: 'The Bookable Department has been saved successfully', sev: 'success' }));
        refetchBookableDepartments();
      })
      .catch((err) => {
        let message =
          err?.data?.message ||
          err?.data?.detail ||
          err?.error ||
          'Something went wrong';

        if (typeof message === 'string' && message.startsWith('error.')) {
          message = message.replace('error.', '').replace(/\./g, ' ');
        }

        dispatch(notify({ msg: message, sev: 'error' }));
      });
  };

  const handleDeleteBookableDepartment = () => {
    if (!bookableDepartment.id) return;

    deleteUserBookableDepartment(bookableDepartment.id)
      .unwrap()
      .then(() => {
        setOpenConfirmDeleteModal(false);
        dispatch(notify({ msg: 'The bookable department was successfully deleted for this user', sev: 'success' }));
        refetchBookableDepartments();
      })
      .catch(() => {
        setOpenConfirmDeleteModal(false);
        dispatch(notify({ msg: 'Failed to delete bookable department for this User', sev: 'error' }));
      });
  };

  const tableColumns = [
    {
      key: 'facilityName',
      title: <Translate>Facility Name</Translate>,
      flexGrow: 4,
      render: (rowData: UserBookableDepartmentResponseVM) => (
        <span>{rowData?.facilityName ?? '-'}</span>
      ),
    },
    {
      key: 'departmentName',
      title: <Translate>Department Name</Translate>,
      flexGrow: 4,
      render: (rowData: UserBookableDepartmentResponseVM) => (
        <span>{rowData?.departmentName ?? '-'}</span>
      ),
    },
    {
      key: 'icon',
      title: <Translate></Translate>,
      flexGrow: 2,
      render: (rowData: UserBookableDepartmentResponseVM) => (
        <div className="container-of-icons">
          <MdDelete
            style={{ cursor: 'pointer' }}
            title="Delete"
            size={24}
            fill="var(--primary-pink)"
            onClick={() => {
              setBookableDepartment({
                id: rowData.id ?? undefined,
                userId: rowData.userId ?? undefined,
                facilityId: rowData.facilityId != null ? String(rowData.facilityId) : undefined,
                departmentId: rowData.departmentId ?? undefined,
              });
              setOpenConfirmDeleteModal(true);
            }}
          />
        </div>
      ),
    },
  ];

  const handlePageChange = (_: unknown, newPage: number) => {
    setPageIndex(newPage);
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPageIndex(0);
  };

  const paginatedData = useMemo(() => {
    const start = pageIndex * rowsPerPage;
    const end = start + rowsPerPage;
    return (bookableDepartmentsResponse ?? []).slice(start, end);
  }, [bookableDepartmentsResponse, pageIndex, rowsPerPage]);

  const totalCount = bookableDepartmentsResponse?.length ?? 0;

  const direction = localStorage.getItem('direction') || 'LTR';
  const isRTL = direction === 'RTL';
  const dir = isRTL ? 'rtl' : 'ltr';

  return (
    <div dir={dir}>
      {openForm && (
        <Form
          fluid
          layout="inline"
          style={{
            marginBottom: '20px',
            padding: '20px',
            border: '1px solid #ddd',
            borderRadius: '4px',
          }}
        >
          <MyInput
            column
            width={350}
            fieldLabel="Facility"
            fieldName="facilityId"
            required
            fieldType="select"
            selectData={facilities}
            selectDataLabel="name"
            selectDataValue="id"
            record={bookableDepartment}
            setRecord={handleFacilityChange}
            searchable
          />

          <MyInput
            column
            fieldLabel="Select Departments"
            fieldType="select"
            fieldName="departmentId"
            selectData={departmentOptions}
            selectDataLabel="name"
            selectDataValue="id"
            width={350}
            record={bookableDepartment}
            setRecord={setBookableDepartment}
            required
            disabled={!bookableDepartment?.facilityId || deptLoading}
          />

          <div style={{ display: 'flex', alignItems: 'flex-end', marginLeft: '10px' }}>
            <MyButton onClick={handleAddSave} appearance="primary">
              Save
            </MyButton>
            <MyButton
              onClick={resetToAddMode}
              appearance="subtle"
              style={{ marginLeft: '10px' }}
            >
              Cancel
            </MyButton>
          </div>
        </Form>
      )}

      {!openForm && (
        <div className="container-of-add-new-button" style={{ marginBottom: '20px' }}>
          <MyButton
            prefixIcon={() => <AddOutlineIcon />}
            color="var(--deep-blue)"
            onClick={() => {
              setBookableDepartment({
                ...newUserBookableDepartment,
                userId,
              });
              setOpenForm(true);
            }}
            width={width > 600 ? '200px' : '109px'}
            disabled={!userId}
          >
            New Bookable Department
          </MyButton>
        </div>
      )}

      <MyTable
        height={300}
        data={paginatedData}
        columns={tableColumns}
        onRowClick={(row: UserBookableDepartmentResponseVM) => {
          setBookableDepartment({
            id: row.id ?? undefined,
            userId: row.userId ?? undefined,
            facilityId: row.facilityId != null ? String(row.facilityId) : undefined,
            departmentId: row.departmentId ?? undefined,
          });
        }}
        rowClassName={isSelected}
        page={pageIndex}
        rowsPerPage={rowsPerPage}
        totalCount={totalCount}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
      />

      <DeletionConfirmationModal
        open={openConfirmDeleteModal}
        setOpen={setOpenConfirmDeleteModal}
        itemToDelete="bookable department"
        actionButtonFunction={handleDeleteBookableDepartment}
        actionType="delete"
      />
    </div>
  );
};

export default BookableDepartmentsTab;
