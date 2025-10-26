import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState, useEffect } from 'react';
import { Panel } from 'rsuite';
import { MdDelete } from 'react-icons/md';
import { IoSettingsSharp } from 'react-icons/io5';
import { MdModeEdit } from 'react-icons/md';
import { FaUndo } from 'react-icons/fa';
import { useGetAccessRolesQuery, useSaveAccessRoleMutation } from '@/services/setupService';
import { Carousel } from 'rsuite';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { ApAccessRole } from '@/types/model-types';
import { newApAccessRole } from '@/types/model-types-constructor';
import { Form } from 'rsuite';
import MyInput from '@/components/MyInput';
import Authorizations from './Authorizations';
import { addFilterToListRequest, fromCamelCaseToDBName } from '@/utils';
import AccessRoleScreenMatrix from './AccessRoleScreenMatrix';
import ReactDOMServer from 'react-dom/server';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useAppDispatch } from '@/hooks';
import MyButton from '@/components/MyButton/MyButton';
import './styles.less';
import MyTable from '@/components/MyTable';
import AddEditAccessRole from './AddEditAccessRole';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import { notify } from '@/utils/uiReducerActions';

const AccessRoles = () => {
  const [accessRole, setAccessRole] = useState<ApAccessRole>({ ...newApAccessRole });
  const [listRequest, setListRequest] = useState<ListRequest>({
    ...initialListRequest,
    pageSize: 15
  });
  const [popupOpen, setPopupOpen] = useState(false);
  const [carouselActiveIndex, setCarouselActiveIndex] = useState(0);
  const [subView, setSubView] = useState('');
  const [recordOfSearch, setRecordOfSearch] = useState({ screen: '' });
  const [width, setWidth] = useState<number>(window.innerWidth);
  const [load, setLoad] = useState<boolean>(false);
  const [openConfirmDeleteAccessRole, setOpenConfirmDeleteAccessRole] = useState<boolean>(false);
  const [stateOfDeleteAccessRole, setStateOfDeleteAccessRole] = useState<string>('delete');
  const dispatch = useAppDispatch();

  // Fetch accessRole list response
  const { data: accessRoleListResponse, refetch, isFetching } = useGetAccessRolesQuery(listRequest);
  // save AccessRole
  const [saveAccessRole, saveAccessRoleMutation] = useSaveAccessRoleMutation();


  // Pagination values
  const pageIndex = listRequest.pageNumber - 1;
  const rowsPerPage = listRequest.pageSize;
  const totalCount = accessRoleListResponse?.extraNumeric ?? 0;
  // Page header setup
  const divContent = (
    <div title="page-title">
      <h5><Translate>Access Roles</Translate></h5>
    </div>
  );
  dispatch(setPageCode('Access_Roles'));
  dispatch(setDivContent(divContent));

  // Effects
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  useEffect(() => {
    if (saveAccessRoleMutation.data) {
      setListRequest({ ...listRequest, timestamp: new Date().getTime() });
    }
  }, [saveAccessRoleMutation.data]);
  useEffect(() => {
    handleFilterChange('name', recordOfSearch['screen']);
  }, [recordOfSearch]);
  useEffect(() => {
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent('  '));
    };
  }, [location.pathname, dispatch]);

  // Handle click on Add New Button
  const handleNew = () => {
    setPopupOpen(true);
    setAccessRole({ ...newApAccessRole });
  };
  // ClassName for selected row
  const isSelected = rowData => {
    if (rowData && accessRole && rowData.key === accessRole.key) {
      return 'selected-row';
    } else return '';
  };
  // Filter table by screen name
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

  const toSubView = (subview: string) => {
    setCarouselActiveIndex(1);
    setSubView(subview);
  };
  // Navigation between pages
  const conjureSubViews = () => {
    if (carouselActiveIndex === 0) {
      return null;
    }
    switch (subView) {
      case 'authorizations':
        return (
          <Authorizations
            accessRole={accessRole}
            goBack={() => {
              setCarouselActiveIndex(0);
            }}
          />
        );
      case 'screen-matrix':
        return (
          <AccessRoleScreenMatrix
            accessRole={accessRole}
            goBack={() => {
              setCarouselActiveIndex(0);
            }}
          />
        );
    }
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

  // Icons column for
  const iconsForActions = (rowData: ApAccessRole) => (
    <div className="container-of-icons">
      <IoSettingsSharp
        title="Screen Access Matrix"
        size={24}
        fill="var(--primary-gray)"
        onClick={() => toSubView('screen-matrix')}
        className="icons-style"
      />
      <MdModeEdit
        title="Edit"
        size={24}
        fill="var(--primary-gray)"
        onClick={() => {
          setAccessRole(rowData);
          setPopupOpen(true);
        }}
        className="icons-style"
      />
      {rowData?.isValid ? (
        <MdDelete
          className="icons-style"
          title="Deactivate"
          size={24}
          fill="var(--primary-pink)"
          onClick={() => {
            setStateOfDeleteAccessRole('deactivate');
            setOpenConfirmDeleteAccessRole(true);
          }}
        />
      ) : (
        <FaUndo
          className="icons-style"
          title="Activate"
          size={21}
          fill="var(--primary-gray)"
          onClick={() => {
            setStateOfDeleteAccessRole('reactivate');
            setOpenConfirmDeleteAccessRole(true);
          }}
        />
      )}
    </div>
  );

   // handle deactivate AccessRole
    const handleDeactivate = () => {
      setOpenConfirmDeleteAccessRole(false);
      saveAccessRole({ ...accessRole, isValid: false })
        .unwrap()
        .then(() => {
          refetch();
          dispatch(
            notify({
              msg: 'The Access Role was successfully Deactivated',
              sev: 'success'
            })
          );
        })
        .catch(() => {
          dispatch(
            notify({
              msg: 'Faild to Deactivate this Access Role',
              sev: 'error'
            })
          );
        });
    };
    // handle reactivate AccessRole
    const handleReactivate = () => {
      setOpenConfirmDeleteAccessRole(false);
      saveAccessRole({ ...accessRole, isValid: true })
        .unwrap()
        .then(() => {
          refetch();
          dispatch(
            notify({
              msg: 'The Access Role was successfully Reactivated',
              sev: 'success'
            })
          );
        })
        .catch(() => {
          dispatch(
            notify({
              msg: 'Faild to Reactivate this Access Role',
              sev: 'error'
            })
          );
        });
    };
    
  //table columns
  const tableColumns = [
    {
      key: 'name',
      title: <Translate>Name</Translate>
    },
    {
      key: 'description',
      title: <Translate>Description</Translate>
    },
    {
      key: 'accessLevel',
      title: <Translate>Access Level</Translate>
    },
    {
      key: 'passwordErrorRetires',
      title: <Translate>Password Error Retires</Translate>
    },
    {
      key: 'passwordExpires',
      title: <Translate>Password Expires</Translate>,
      render: rowData => <span>{rowData.passwordExpires ? 'Yes' : 'No'}</span>
    },
    {
      key: 'passwordExpiresAfterDays',
      title: <Translate>Password Expires After</Translate>
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
      flexGrow: 2,
      render: rowData => iconsForActions(rowData)
    }
  ];
  return (
    <Carousel className="carousel" autoplay={false} activeIndex={carouselActiveIndex}>
      <Panel>
        <div className="container-of-header-actions-access-roles">
          <Form layout="inline">
            <MyInput
              fieldName="screen"
              fieldType="text"
              record={recordOfSearch}
              setRecord={setRecordOfSearch}
              showLabel={false}
              placeholder="Search by Screen Name"
              width={'220px'}
              height={32}
            />
          </Form>
          <MyButton
            prefixIcon={() => <AddOutlineIcon />}
            color="var(--deep-blue)"
            onClick={handleNew}
            width="111px"
          >
            Add New
          </MyButton>
        </div>
        <MyTable
          height={450}
          data={accessRoleListResponse?.object ?? []}
          columns={tableColumns}
          rowClassName={isSelected}
          loading={isFetching || load}
          onRowClick={rowData => {
            setAccessRole(rowData);
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
        />
        <AddEditAccessRole
          open={popupOpen}
          setOpen={setPopupOpen}
          width={width}
          accessRole={accessRole}
          setAccessRole={setAccessRole}
          setLoad={setLoad}
          refetch={refetch}
        />
        <DeletionConfirmationModal
          open={openConfirmDeleteAccessRole}
          setOpen={setOpenConfirmDeleteAccessRole}
          itemToDelete="Access Role"
          actionButtonFunction={
            stateOfDeleteAccessRole == 'deactivate' ? handleDeactivate : handleReactivate
          }
          actionType={stateOfDeleteAccessRole}
        />
      </Panel>
      {conjureSubViews()}
    </Carousel>
  );
};

export default AccessRoles;
