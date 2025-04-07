import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState, useEffect } from 'react';
import { Input, Modal, Pagination, Panel, Table } from 'rsuite';
const { Column, HeaderCell, Cell } = Table;
import { MdDelete } from 'react-icons/md';
import { IoSettingsSharp } from 'react-icons/io5';
import { MdModeEdit } from 'react-icons/md';
import { useGetAccessRolesQuery, useSaveAccessRoleMutation } from '@/services/setupService';
import { Button, ButtonToolbar, Carousel, IconButton } from 'rsuite';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import EditIcon from '@rsuite/icons/Edit';
import TrashIcon from '@rsuite/icons/Trash';
import DataAuthorizeIcon from '@rsuite/icons/DataAuthorize';
import { ApAccessRole } from '@/types/model-types';
import { newApAccessRole } from '@/types/model-types-constructor';
import { Form, Stack, Divider } from 'rsuite';
import MyInput from '@/components/MyInput';
import Authorizations from './Authorizations';
import { addFilterToListRequest, fromCamelCaseToDBName } from '@/utils';
import AccessRoleScreenMatrix from './AccessRoleScreenMatrix';
import ViewsAuthorizeIcon from '@rsuite/icons/ViewsAuthorize';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import ReactDOMServer from 'react-dom/server';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useAppDispatch } from '@/hooks';
import MyButton from '@/components/MyButton/MyButton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faKey } from '@fortawesome/free-solid-svg-icons';
import { faCheckDouble } from '@fortawesome/free-solid-svg-icons';


const AccessRoles = () => {
  const [accessRole, setAccessRole] = useState<ApAccessRole>({ ...newApAccessRole });
  const [popupOpen, setPopupOpen] = useState(false);
  const [carouselActiveIndex, setCarouselActiveIndex] = useState(0);
  const [subView, setSubView] = useState('');
  const dispatch = useAppDispatch();

  const [listRequest, setListRequest] = useState<ListRequest>({ ...initialListRequest });
  const { data: accessRoleListResponse } = useGetAccessRolesQuery(listRequest);

  const [saveAccessRole, saveAccessRoleMutation] = useSaveAccessRoleMutation();

  const [operationState, setOperationState] = useState<string>('New');
  const [recordOfSearch, setRecordOfSearch] = useState({ screen: '' });

  const divElement = useSelector((state: RootState) => state.div?.divElement);
  const divContent = (
    <div style={{ display: 'flex' }}>
      <h5>Access Roles</h5>
    </div>
  );
  const divContentHTML = ReactDOMServer.renderToStaticMarkup(divContent);
  dispatch(setPageCode('Access_Roles'));
  dispatch(setDivContent(divContentHTML));
  const handleNew = () => {
    setOperationState('New');
    setPopupOpen(true);
    setAccessRole({ ...newApAccessRole });
  };

  const handleSave = () => {
    setPopupOpen(false);
    saveAccessRole(accessRole).unwrap();
  };

  useEffect(() => {
    if (saveAccessRoleMutation.data) {
      setListRequest({ ...listRequest, timestamp: new Date().getTime() });
    }
  }, [saveAccessRoleMutation.data]);

  useEffect(() => {
    handleFilterChange('name', recordOfSearch['screen']);
  }, [recordOfSearch]);

  const isSelected = rowData => {
    if (rowData && accessRole && rowData.key === accessRole.key) {
      return 'selected-row';
    } else return '';
  };

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

  useEffect(() => {
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent('  '));
    };
  }, [location.pathname, dispatch]);

  const iconsForActions = (rowData: ApAccessRole) => (
    <div style={{ display: 'flex', gap: '20px' }}>
      <IoSettingsSharp
        title="Setup Module Screens"
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
          setOperationState('Edit');
          setPopupOpen(true);
        }}
      />
      <MdDelete title="Deactivate" size={24} fill="var(--primary-pink)" />
    </div>
  );

  return (
    <Carousel
      style={{ height: 'auto', backgroundColor: 'var(--rs-body)' }}
      autoplay={false}
      activeIndex={carouselActiveIndex}
    >
      <Panel>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <Form>
            <MyInput
              fieldName="screen"
              fieldType="text"
              record={recordOfSearch}
              setRecord={setRecordOfSearch}
              showLabel={false}
              placeholder="Search by Screen Name"
              width={'220px'}
            />
          </Form>
          <div style={{ marginRight: '40px' }}>
            <MyButton
              prefixIcon={() => <AddOutlineIcon />}
              color="var(--deep-blue)"
              onClick={handleNew}
              width ="109px"
              height ="32px"
            >
              Add New
            </MyButton>
          </div>
        </div>

        <Table
          height={400}
          sortColumn={listRequest.sortBy}
          sortType={listRequest.sortType}
          onSortColumn={(sortBy, sortType) => {
            if (sortBy)
              setListRequest({
                ...listRequest,
                sortBy,
                sortType
              });
          }}
          data={accessRoleListResponse?.object ?? []}
          onRowClick={rowData => {
            setAccessRole(rowData);
            console.log(rowData);
          }}
          rowClassName={isSelected}
        >
          <Column sortable flexGrow={4}>
            <HeaderCell>
              {/* <Input onChange={e => handleFilterChange('name', e)} /> */}
              <Translate>Name</Translate>
            </HeaderCell>
            <Cell dataKey="name" />
          </Column>
          <Column sortable flexGrow={4}>
            <HeaderCell>
              {/* <Input onChange={e => handleFilterChange('accessLevel', e)} /> */}
              <Translate>Access Level</Translate>
            </HeaderCell>
            <Cell dataKey="accessLevel" />
          </Column>
          <Column sortable flexGrow={4}>
            <HeaderCell>
              {/* <Input onChange={e => handleFilterChange('passwordErrorRetires', e)} /> */}
              <Translate>Password Error Retries</Translate>
            </HeaderCell>
            <Cell dataKey="passwordErrorRetires" />
          </Column>
          <Column sortable flexGrow={3}>
            <HeaderCell>
              <Translate>Password Expires</Translate>
            </HeaderCell>
            <Cell>{rowData => <span>{rowData.passwordExpires ? 'Yes' : 'No'}</span>}</Cell>
          </Column>
          <Column sortable flexGrow={3}>
            <HeaderCell>
              {/* <Input onChange={e => handleFilterChange('passwordExpiresAfterDays', e)} /> */}
              <Translate>Password Expires after</Translate>
            </HeaderCell>
            <Cell dataKey="passwordExpiresAfterDays" />
          </Column>
          <Column flexGrow={2}>
            <HeaderCell></HeaderCell>
            <Cell>{rowData => iconsForActions(rowData)}</Cell>
          </Column>
        </Table>
        <div style={{ padding: 20, backgroundColor: '#F4F7FC' }}>
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
            total={accessRoleListResponse?.extraNumeric ?? 0}
          />
        </div>

        <Modal open={popupOpen} className="left-modal" size="xsm">
          <Modal.Title>
            <Translate>{operationState} AccessRole</Translate>
          </Modal.Title>
          <hr />
          <Modal.Body style={{ marginBottom: '170px' }}>
            <Form
              fluid
              style={{
                padding: '1px'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignContent: 'center',
                  alignItems: 'center',
                  marginBottom: '40px'
                }}
              >
                <FontAwesomeIcon
                  icon={faKey}
                  color="#415BE7"
                  style={{ marginBottom: '10px' }}
                  size={'2x'}
                />
                <label style={{ fontWeight: 'bold', fontSize: '14px' }}>Access Rule Rule info</label>
              </div>
              <MyInput fieldName="name" record={accessRole} setRecord={setAccessRole} width={520} />
              <MyInput fieldName="description" record={accessRole} setRecord={setAccessRole} width={520} />
              <div
               style={{
                    display: 'flex',
                    gap: '20px'
                  }}>
              <MyInput fieldName="accessLevel" record={accessRole} setRecord={setAccessRole} width={250} />
              <MyInput
                fieldName="passwordErrorRetries"
                record={accessRole}
                setRecord={setAccessRole}
                width={250}
              />
              </div>
              <div
              style={{
                display: 'flex',
                gap: '120px'
              }}
              >
              <MyInput
                fieldName="passwordExpires"
                fieldType="checkbox"
                record={accessRole}
                setRecord={setAccessRole}
                
              />
              <MyInput
                fieldName="passwordExpiresAfterDays"
                record={accessRole}
                disabled={!accessRole.passwordExpires}
                setRecord={setAccessRole}
                width={245}
              />
              </div>
            </Form>
          </Modal.Body>
          <Modal.Footer>
             <Stack
                            style={{ display: 'flex', justifyContent: 'flex-end' }}
                            spacing={2}
                            divider={<Divider vertical />}
                          >
                            <MyButton ghost color="var(--deep-blue)" onClick={() => setPopupOpen(false)}
                            width='78px'
                            height='40px'
                              >
                              Cancel
                            </MyButton>
                            <MyButton
                              prefixIcon={() => <FontAwesomeIcon icon={faCheckDouble} />}
                              color="var(--deep-blue)"
                              onClick={handleSave}
                              width="93px"
                              height="40px"
                            >
                              {operationState === 'New' ? 'Create' : 'Save'}
                            </MyButton>
                          </Stack>
          </Modal.Footer>
        </Modal>
      </Panel>
      {conjureSubViews()}
    </Carousel>
  );
};

export default AccessRoles;
