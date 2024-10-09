import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState, useEffect } from 'react';
import { Input, Modal, Pagination, Panel, Table } from 'rsuite';
const { Column, HeaderCell, Cell } = Table;
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
const AccessRoles = () => {
  const [accessRole, setAccessRole] = useState<ApAccessRole>({ ...newApAccessRole });
  const [popupOpen, setPopupOpen] = useState(false);
  const [carouselActiveIndex, setCarouselActiveIndex] = useState(0);
  const [subView, setSubView] = useState('');

  const [listRequest, setListRequest] = useState<ListRequest>({ ...initialListRequest });
  const { data: accessRoleListResponse } = useGetAccessRolesQuery(listRequest);

  const [saveAccessRole, saveAccessRoleMutation] = useSaveAccessRoleMutation();


  const handleNew = () => {
    setPopupOpen(true);
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

  return (
    <Carousel
      style={{ height: 'auto', backgroundColor: 'var(--rs-body)' }}
      autoplay={false}
      activeIndex={carouselActiveIndex}
    >
      <Panel
        header={
          <h3 className="title">
            <Translate>AccessRoles</Translate>
          </h3>
        }
      >
        <ButtonToolbar>
          <IconButton appearance="primary" icon={<AddOutlineIcon />} onClick={handleNew}>
            Add New
          </IconButton>
          <IconButton
            disabled={!accessRole.key}
            appearance="primary"
            onClick={() => setPopupOpen(true)}
            color="green"
            icon={<EditIcon />}
          >
            Edit Selected
          </IconButton>
          <IconButton
            disabled={true || !accessRole.key}
            appearance="primary"
            color="red"
            icon={<TrashIcon />}
          >
            Delete Selected
          </IconButton>
          <IconButton
            disabled={!accessRole.key}
            appearance="primary"
            color="orange"
            onClick={() => toSubView('authorizations')}
            icon={<DataAuthorizeIcon />}
          >
            Authorizations
          </IconButton>
          <IconButton
            disabled={!accessRole.key}
            appearance="primary"
            color="yellow"
            onClick={() => toSubView('screen-matrix')}
            icon={<ViewsAuthorizeIcon />}
          >
            Screen Access Matrix
          </IconButton>
        </ButtonToolbar>
        <hr />
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
          headerHeight={80}
          rowHeight={60}
          bordered
          cellBordered
          data={accessRoleListResponse?.object ?? []}
          onRowClick={rowData => {
            setAccessRole(rowData);
            console.log(rowData);
          }}
          rowClassName={isSelected}
        >
          <Column sortable flexGrow={4}>
            <HeaderCell>
              <Input onChange={e => handleFilterChange('name', e)} />
              <Translate>Name</Translate>
            </HeaderCell>
            <Cell dataKey="name" />
          </Column>
          <Column sortable flexGrow={4}>
            <HeaderCell>
              <Input onChange={e => handleFilterChange('accessLevel', e)} />
              <Translate>Access Level</Translate>
            </HeaderCell>
            <Cell dataKey="accessLevel" />
          </Column>
          <Column sortable flexGrow={4}>
            <HeaderCell>
              <Input onChange={e => handleFilterChange('passwordErrorRetires', e)} />
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
              <Input onChange={e => handleFilterChange('passwordExpiresAfterDays', e)} />
              <Translate>Password Expires after</Translate>
            </HeaderCell>
            <Cell dataKey="passwordExpiresAfterDays" />
          </Column>
        </Table>
        <div style={{ padding: 20 }}>
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

        <Modal open={popupOpen} overflow>
          <Modal.Title>
            <Translate>New/Edit AccessRole</Translate>
          </Modal.Title>
          <Modal.Body>
            <Form fluid>
              <MyInput fieldName="name" record={accessRole} setRecord={setAccessRole} />
              <MyInput fieldName="description" record={accessRole} setRecord={setAccessRole} />
              <MyInput fieldName="accessLevel" record={accessRole} setRecord={setAccessRole} />
              <MyInput
                fieldName="passwordErrorRetries"
                record={accessRole}
                setRecord={setAccessRole}
              />
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
              />
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Stack spacing={2} divider={<Divider vertical />}>
              <Button appearance="primary" onClick={handleSave}>
                Save
              </Button>
              <Button appearance="primary" color="red" onClick={() => setPopupOpen(false)}>
                Cancel
              </Button>
            </Stack>
          </Modal.Footer>
        </Modal>
      </Panel>
      {conjureSubViews()}
    </Carousel>
  );
};

export default AccessRoles;
