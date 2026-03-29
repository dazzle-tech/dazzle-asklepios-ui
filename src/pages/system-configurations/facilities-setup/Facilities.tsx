import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import {
  useAddFacilityMutation,
  useDeleteFacilityMutation,
  useGetAllFacilitiesQuery,
  useUpdateFacilityMutation
} from '@/services/security/facilityService';
import { ApAddresses, ApDepartment } from '@/types/model-types';
import { newApAddresses } from '@/types/model-types-constructor';
import { newCreateFacility, newFacility } from '@/types/model-types-constructor-new';
import { CreateFacility, Facility } from '@/types/model-types-new';
import { initialListRequest, ListRequest } from '@/types/types';
import { addFilterToListRequest, fromCamelCaseToDBName, formatEnumString } from '@/utils';
import { notify } from '@/utils/uiReducerActions';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import React, { useEffect, useState } from 'react';
import { FaUndo } from 'react-icons/fa';
import { MdDelete, MdModeEdit } from 'react-icons/md';
import { Form, Panel } from 'rsuite';
import MyTab from '@/components/MyTab';
import { Box } from '@mui/material';
import AddEditFacility from './AddEditFacility';
import DepartmentsTab from './tabs/DepartmentsTab';
import RolesTab from './tabs/RolesTab';
import UsersTab from './tabs/UsersTab';
import './styles.less';
import { useEnumOptions } from '@/services/enumsApi';
const Facilities = () => {
  const dispatch = useAppDispatch();
  const [facility, setFacility] = useState<Facility>({ ...newFacility });
  const [createFacility, setCreateFacility] = useState<CreateFacility>({ ...newCreateFacility });
  const [address, setAddress] = useState<ApAddresses>({ ...newApAddresses });
  const [departments, setDepartments] = useState<ApDepartment[]>([]);
  const [popupOpen, setPopupOpen] = useState(false);
  const [width, setWidth] = useState<number>(window.innerWidth);
  const [openConfirmDeleteModel, setOpenConfirmDeleteModel] = useState<boolean>(false);
  const [load, setLoad] = useState<boolean>(false);
  const [recordOfSearchForFacility, setRecordOfSearchForFacility] = useState({ name: '' });
  // Initialize list request with default filters
  const [listRequest, setListRequest] = useState<ListRequest>({ ...initialListRequest });
  // Fetch Facilities list response
  const {
    data: facilityListResponse,
    refetch: refetchFacility,
    isFetching
  } = useGetAllFacilitiesQuery({});
  // Save Facility
  const [saveFacility, saveFacilityMutation] = useAddFacilityMutation();
  // Update Facility
  const [updateFacility, updateFacilityMutation] = useUpdateFacilityMutation();
  // Remove Facility
  const [removeFacility] = useDeleteFacilityMutation();
  // To check if we are in edit mode
  const [isEditing, setIsEditing] = useState<boolean>(false);
  // Pagination values
  const pageIndex = listRequest.pageNumber - 1;
  const rowsPerPage = listRequest.pageSize;
  const totalCount = facilityListResponse?.extraNumeric ?? 0;
  const DayOfWeek = useEnumOptions('DayOfWeek');

  // Effects
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (saveFacilityMutation.data) {
      setListRequest({ ...listRequest, timestamp: new Date().getTime() });
    }
  }, [saveFacilityMutation.data]);

  useEffect(() => {
    handleFilterChange('facilityName', recordOfSearchForFacility['facilityName']);
  }, [recordOfSearchForFacility]);

  useEffect(() => {
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent('  '));
    };
  }, [location.pathname, dispatch]);

  // Page header setup
  const divContent = 'Facilities';
  dispatch(setPageCode('Facilities'));
  dispatch(setDivContent(divContent));

  // Handle click on Add New Button
  const handleNew = () => {
    setAddress(newApAddresses);
    setCreateFacility({ ...newCreateFacility });
    setDepartments([]);
    setIsEditing(false);
    setPopupOpen(true);
  };
  //icons column (Edit, Active/Deactivate)
  const iconsForActions = (rowData: Facility) => (
    <div className="container-of-icons">
      <MdModeEdit
        title="Edit"
        size={24}
        fill="var(--primary-gray)"
        onClick={() => {
          setFacility({ ...rowData });
          setIsEditing(true);
          setPopupOpen(true);
        }}
        className="icons-style"
      />
      {rowData?.isActive ? (
        <MdDelete
          title="Deactivate"
          size={24}
          fill="var(--primary-pink)"
          onClick={() => {
            setFacility(rowData);
            setOpenConfirmDeleteModel(true);
          }}
          className="icons-style"
        />
      ) : (
        // back to this function when update the filter(status) in back end
        <FaUndo
          className="icons-style"
          title="Activate"
          size={21}
          fill="var(--primary-gray)"
          onClick={() => {
            setFacility(rowData);
            handleActive(rowData);
          }}
        />
      )}
    </div>
  );


  const validateFacility = () => {
    const missingFields = [];

    if (!facility?.name?.trim()) missingFields.push('Name');
    if (!facility?.type) missingFields.push('Facility Type');
    if (!facility?.defaultCurrency) missingFields.push('Default Currency');

    if (missingFields.length) {
      return `${missingFields.join(', ')} ${missingFields.length > 1 ? 'are' : 'is'} required`;
    }

    return null;
  };

  const buildWorkingDaysPayload = (workingDays: Facility['workingDays']) => {
    if (!DayOfWeek || DayOfWeek.length === 0) return workingDays ?? [];

    const map: Record<string, boolean> = {};
    DayOfWeek.forEach(day => {
      map[day.value] = false;
    });

    (workingDays ?? []).forEach(day => {
      if (day?.dayOfWeek) {
        map[day.dayOfWeek] = day.isWorking !== false;
      }
    });

    return DayOfWeek.map(day => ({
      dayOfWeek: day.value,
      isWorking: !!map[day.value],
    }));
  };

  // Extract readable backend message when available.
  const extractErrorMessage = (response) => {
    try {
      const msg = response?.data?.message;
      if (typeof msg === 'string') return msg.replace(/^error\./i, '');
      return '';
    } catch {
      return '';
    }
  };
  // Handle click on Save Facility button
const handleSave = async () => {
  setLoad(true);

  const missingFields = [];

  if (!createFacility.name?.trim()) missingFields.push('Facility Name');
  if (!createFacility.type) missingFields.push('Facility Type');
  if (!createFacility.defaultCurrency) missingFields.push('Default Currency');
  if (!createFacility.code) missingFields.push('Code');

  if (missingFields.length) {
    dispatch(
      notify({
        msg: `• ${missingFields.join(', ')} ${
          missingFields.length > 1 ? 'are' : 'is'
        } required`,
        sev: 'error'
      })
    );

    setLoad(false);
    return;
  }

  try {
    const workingDaysPayload = buildWorkingDaysPayload(createFacility.workingDays);
    await saveFacility({ ...createFacility, workingDays: workingDaysPayload }).unwrap();
    setPopupOpen(false);
    dispatch(
      notify({
        msg: 'The Facility has been saved successfully',
        sev: 'success'
      })
    );

    refetchFacility();
  } catch(error) {
    const errorMsg = extractErrorMessage(error) || 'Failed to save this Facility';
    dispatch(notify({ msg: errorMsg, sev: 'warning' }));
  }

  setLoad(false);
};

  // Handle click on Update Facility button
  const handleUpdate = async () => {
    setLoad(true);

    const missingFields = [];

    if (!facility.name?.trim()) missingFields.push('Facility Name');
    if (!facility.type) missingFields.push('Facility Type');
    if (!facility.defaultCurrency) missingFields.push('Default Currency');
    if (!facility.code) missingFields.push('Code');

    if (missingFields.length) {
      dispatch(
        notify({
          msg: `• ${missingFields.join(', ')} ${
            missingFields.length > 1 ? 'are' : 'is'
          } required`,
          sev: 'error'
        })
      );

      setLoad(false);
      return;
    }

  try {
    const workingDaysPayload = buildWorkingDaysPayload(facility.workingDays);
    await updateFacility({ ...facility, workingDays: workingDaysPayload }).unwrap();
      setPopupOpen(false);
    dispatch(
      notify({
        msg: 'Facility has been updated successfully',
        sev: 'success'
        })
      );

      refetchFacility();
    } catch(error) {
     const errorMsg = extractErrorMessage(error) || 'Failed to updateu this Facility';
    dispatch(notify({ msg: errorMsg, sev: 'warning' }));
    }

    setLoad(false);
  };

  // Handle remove Facility
  const handleRemove = async () => {
    setPopupOpen(false);
    setLoad(true);
    await updateFacility({ ...facility, isActive: false })
      .unwrap()
      .then(() => {
        refetchFacility();
        dispatch(notify({ msg: 'The Facility was deactivated successfully', sev: 'success' }));
      })
      .catch(() => {
        dispatch(notify({ msg: 'Failed to deactivate this Facility', sev: 'error' }));
      });
    setLoad(false);
    setOpenConfirmDeleteModel(false);
  };
  // back to this function when update the filter in back end
  // Handle Activation Facility
  const handleActive = async (rowData: Facility) => {
    setLoad(true);
    await updateFacility({ ...rowData, isActive: true })
      .unwrap()
      .then(() => {
        refetchFacility();
        dispatch(notify({ msg: 'The Facility was activated successfully', sev: 'success' }));
      })
      .catch(() => {
        dispatch(notify({ msg: 'Failed to activate this Facility', sev: 'error' }));
      });
    setLoad(false);
  };
  // Handle page change in navigation
  const handlePageChange = (_: unknown, newPage: number) => {
    setListRequest({ ...listRequest, pageNumber: newPage + 1 });
  };
  // Handle change rows per page in navigation
  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setListRequest({
      ...listRequest,
      pageSize: parseInt(event.target.value, 10),
      pageNumber: 1
    });
  };
  // ClassName for selected row
  const isSelected = rowData => {
    if (rowData && facility && rowData.id === facility.id) {
      return 'selected-row';
    } else return '';
  };
  // Filter table by Facility Name
  const handleFilterChange = (fieldName, value) => {
    if (value) {
      setListRequest(
        addFilterToListRequest(
          fromCamelCaseToDBName(fieldName),
          'startsWithIgnoreCase',
          value,
          listRequest
        )
      );
    } else {
      setListRequest({ ...listRequest, filters: [] });
    }
  };
  //Table columns
  const tableColumns = [
    {
      key: 'code',
      title: <Translate>Code</Translate>,
      flexGrow: 1,
      dataKey: 'code'
    },
    {
      key: 'name',
      title: <Translate>Facility Name</Translate>,
      flexGrow: 4,
      dataKey: 'name'
    },
    {
      key: 'type',
      title: <Translate>Facility Type</Translate>,
      flexGrow: 4,
      render: rowData => <p>{formatEnumString(rowData?.type)}</p>
    },
    {
      key: 'emailAddress',
      title: <Translate>Email Address</Translate>,
      flexGrow: 4,
      dataKey: 'emailAddress'
    },
    {
      key: 'isActive',
      title: <Translate>Status</Translate>,
      flexGrow: 4,
      render: rowData => {
        return <p>{rowData?.isActive ? 'Active' : 'Inactive'}</p>;
      }
    },
    {
      key: 'actions',
      title: <Translate></Translate>,
      flexGrow: 3,
      render: rowData => iconsForActions(rowData)
    }
  ];

  return (
    <div>
      <div>
        <Panel>
          <MyTable
            height={450}
            data={facilityListResponse ?? []}
            loading={isFetching || load}
            columns={tableColumns}
            rowClassName={isSelected}
            onRowClick={rowData => {
              setFacility(rowData);
              setAddress(rowData.address || newApAddresses);
              setDepartments(Array.isArray(rowData.department) ? rowData.department : []);
            }}
            sortColumn={listRequest.sortBy}
            sortType={listRequest.sortType}
            onSortChange={(sortBy, sortType) => {
              if (sortBy) setListRequest({ ...listRequest, sortBy, sortType });
            }}
            page={pageIndex}
            rowsPerPage={rowsPerPage}
            totalCount={totalCount}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
            tableButtons={
              <div className="container-of-add-new-button">
                <MyButton
                  prefixIcon={() => <AddOutlineIcon />}
                  color="var(--deep-blue)"
                  width="109px"
                  height="32px"
                  onClick={handleNew}
                >
                  Add New
                </MyButton>
              </div>
            }
            filters={
              <div className="container-of-header-actions-facility">
                <Form layout="inline">
                  <MyInput
                    fieldName="facilityName"
                    fieldType="text"
                    record={recordOfSearchForFacility}
                    setRecord={setRecordOfSearchForFacility}
                    showLabel={false}
                    placeholder="Search by Facility Name"
                    width={'220px'}
                  />
                </Form>
              </div>
            }
          />
          <AddEditFacility
            open={popupOpen}
            setOpen={setPopupOpen}
            facility={isEditing ? facility : createFacility}
            setFacility={isEditing ? setFacility : setCreateFacility}
            address={address}
            setAddress={setAddress}
            handleSave={isEditing ? handleUpdate : handleSave}
            width={width}
          />
          <DeletionConfirmationModal
            open={openConfirmDeleteModel}
            setOpen={setOpenConfirmDeleteModel}
            itemToDelete="Facility"
            actionButtonFunction={handleRemove}
          />
        </Panel>
      </div>

      {/* Facility-related tabs (similar behavior to Users tabs) */}
      {facility?.id && (
        <Box mt={3}>
          <MyTab
            data={[
              {
                title: 'Departments',
                content: <DepartmentsTab facility={facility} width={width} />,
                disabled: !facility?.id
              },
              {
                title: 'Roles',
                content: <RolesTab facility={facility} />,
                disabled: !facility?.id
              },
              {
                title: 'Users',
                content: <UsersTab facility={facility} />,
                disabled: !facility?.id
              }
            ]}
          />
        </Box>
      )}
    </div>
  );
};

export default Facilities;
