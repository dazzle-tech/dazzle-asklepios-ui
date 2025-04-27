import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState, useEffect } from 'react';
import { Pagination, Panel } from 'rsuite';
import { MdDelete } from 'react-icons/md';
import { IoSettingsSharp } from 'react-icons/io5';
import { MdModeEdit } from 'react-icons/md';
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

const AccessRoles = () => {
  const [accessRole, setAccessRole] = useState<ApAccessRole>({ ...newApAccessRole });
  const [listRequest, setListRequest] = useState<ListRequest>({ ...initialListRequest });
  const [popupOpen, setPopupOpen] = useState(false);
  const [carouselActiveIndex, setCarouselActiveIndex] = useState(0);
  const [subView, setSubView] = useState('');
  const [recordOfSearch, setRecordOfSearch] = useState({ screen: '' });
  const [width, setWidth] = useState<number>(window.innerWidth);
  const [load, setLoad] = useState<boolean>(false);
  const dispatch = useAppDispatch();

  // Fetch accessRole list response
  const { data: accessRoleListResponse, refetch, isFetching } = useGetAccessRolesQuery(listRequest);
  // save AccessRole
  const [, saveAccessRoleMutation] = useSaveAccessRoleMutation();

  // Page header setup
  const divContent = (
    <div title="title">
      <h5>Access Roles</h5>
    </div>
  );
  const divContentHTML = ReactDOMServer.renderToStaticMarkup(divContent);
  dispatch(setPageCode('Access_Roles'));
  dispatch(setDivContent(divContentHTML));

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
  // Icons column for
  const iconsForActions = (rowData: ApAccessRole) => (
    <div className="container-of-icons-access-roles">
      <IoSettingsSharp
        title="Screen Access Matrix"
        size={24}
        fill="var(--primary-gray)"
        onClick={() => toSubView('screen-matrix')}
      />
      <MdModeEdit
        title="Edit"
        size={24}
        fill="var(--primary-gray)"
        onClick={() => {
          setAccessRole(rowData);
          setPopupOpen(true);
        }}
      />
      <MdDelete title="Deactivate" size={24} fill="var(--primary-pink)" />
    </div>
  );
  //table columns
  const tableColumns = [
    {
      key: 'name',
      title: <Translate>Name</Translate>,
      flexGrow: 4,
      dataKey: 'name'
    },
    {
      key: 'description',
      title: <Translate>Description</Translate>,
      flexGrow: 4,
      dataKey: 'description'
    },
    {
      key: 'accessLevel',
      title: <Translate>Access Level</Translate>,
      flexGrow: 4,
      dataKey: 'accessLevel'
    },
    {
      key: 'passwordErrorRetires',
      title: <Translate>Password Error Retires</Translate>,
      flexGrow: 4,
      dataKey: 'passwordErrorRetires'
    },
    {
      key: 'passwordExpires',
      title: <Translate>Password Expires</Translate>,
      flexGrow: 3,
      render: rowData => <span>{rowData.passwordExpires ? 'Yes' : 'No'}</span>
    },
    {
      key: 'passwordExpiresAfterDays',
      title: <Translate>Password Expires After</Translate>,
      flexGrow: 3,
      dataKey: 'passwordExpiresAfterDays'
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
        />
        <div className="container-of-pagination-access-roles">
          <Pagination
            prev
            next
            first={width > 500}
            last={width > 500}
            ellipsis={width > 500}
            boundaryLinks={width > 500}
            maxButtons={width < 500 ? 1 : 2}
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
            total={accessRoleListResponse?.extraNumeric ?? 0}
          />
        </div>
        <AddEditAccessRole
          open={popupOpen}
          setOpen={setPopupOpen}
          width={width}
          accessRole={accessRole}
          setAccessRole={setAccessRole}
          setLoad={setLoad}
          refetch={refetch}
        />
      </Panel>
      {conjureSubViews()}
    </Carousel>
  );
};

export default AccessRoles;
