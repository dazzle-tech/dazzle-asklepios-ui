import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState, useEffect } from 'react';
import { Drawer, Input, List, Modal, Pagination, Panel, Table } from 'rsuite';
const { Column, HeaderCell, Cell } = Table;
import { useGetScreensQuery, useSaveScreenMutation } from '@/services/setupService';
import { useGetScreenMetadataQuery, useSaveScreenMetadataMutation } from '@/services/dvmService';
import { Button, ButtonToolbar, Carousel, IconButton } from 'rsuite';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import EditIcon from '@rsuite/icons/Edit';
import ListIcon from '@rsuite/icons/List';
import TrashIcon from '@rsuite/icons/Trash';
import { ApScreen } from '@/types/model-types';
import { newApScreen } from '@/types/model-types-constructor';
import { Form, Stack, Divider } from 'rsuite';
import ArowBackIcon from '@rsuite/icons/ArowBack';
import {
  addFilterToListRequest,
  conjureValueBasedOnKeyFromList,
  fromCamelCaseToDBName
} from '@/utils';
import MyInput from '@/components/MyInput';
import MyIconInput from '@/components/MyInput/MyIconInput';
import { Icon } from '@rsuite/icons';
import * as icons from 'react-icons/fa6';

const Screens = ({ module, goBack, ...props }) => {
  const [screen, setScreen] = useState<ApScreen>({ ...newApScreen });
  const [screenPopupOpen, setScreenPopupOpen] = useState(false);
  const [screenMetadataPopupOpen, setScreenMetadataPopupOpen] = useState(false);

  const [listRequest, setListRequest] = useState<ListRequest>({
    ...initialListRequest,
    sortBy: 'viewOrder'
  });
  const [listRequestForMetadata, setListRequestForMetadata] = useState<ListRequest>({
    ...initialListRequest,
    ignore: true
  });

  const [saveScreen, saveScreenMutation] = useSaveScreenMutation();
  const [saveScreenMetadata, saveScreenMetadataMutation] = useSaveScreenMutation();

  const { data: screenListResponse } = useGetScreensQuery(listRequest);
  const { data: screenMetadataListResponse } = useGetScreenMetadataQuery(listRequestForMetadata);

  useEffect(() => {
    if (module && module.key) {
      setListRequest(addFilterToListRequest('module_key', 'match', module.key, listRequest));
    }
    setScreenPopupOpen(false);
    setScreen({ ...newApScreen });
  }, [module]);

  useEffect(() => {
    if (screen && screen.key) {
      setListRequestForMetadata(
        addFilterToListRequest('screen_key', 'match', screen.key, listRequestForMetadata)
      );
    }
  }, [screen]);

  useEffect(() => {
    if (screenMetadataListResponse) {
      console.log(screenMetadataListResponse);
    }
  }, [screenMetadataListResponse]);

  const handleScreenNew = () => {
    setScreenPopupOpen(true);
    setScreen({ ...newApScreen, moduleKey: module.key });
  };

  const handleScreenSave = () => {
    setScreenPopupOpen(false);
    saveScreen(screen).unwrap();
  };

  useEffect(() => {
    if (saveScreenMutation.data) {
      setListRequest({ ...listRequest, timestamp: new Date().getTime() });
    }
  }, [saveScreenMutation.data]);

  const isSelected = rowData => {
    if (rowData && screen && rowData.key === screen.key) {
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

  return (
    <>
      {module && module.key && (
        <Panel
          header={
            <h3 className="title">
              <Translate> Screens for </Translate> <i>{module?.moduleName ?? ''}</i>{' '}
              <Translate>Module</Translate>
            </h3>
          }
        >
          <ButtonToolbar>
            <IconButton appearance="ghost" color="cyan" icon={<ArowBackIcon />} onClick={goBack}>
              Go Back
            </IconButton>
            <Divider vertical />
            <IconButton appearance="primary" icon={<AddOutlineIcon />} onClick={handleScreenNew}>
              Add New
            </IconButton>
            <IconButton
              disabled={!screen.key}
              appearance="primary"
              onClick={() => setScreenPopupOpen(true)}
              color="green"
              icon={<EditIcon />}
            >
              Edit Selected
            </IconButton>
            <IconButton
              disabled={true || !screen.key}
              appearance="primary"
              color="red"
              icon={<TrashIcon />}
            >
              Delete Selected
            </IconButton>
            <IconButton
              disabled={!screen.key}
              appearance="primary"
              color="orange"
              onClick={() => {
                setScreenMetadataPopupOpen(true);
              }}
              icon={<ListIcon />}
            >
              Screen Metadata
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
            data={screenListResponse?.object ?? []}
            onRowClick={rowData => {
              setScreen({ ...rowData, moduleKey: module.key });
            }}
            rowClassName={isSelected}
          >
            <Column sortable align="center" flexGrow={1}>
              <HeaderCell>
                <Input onChange={e => handleFilterChange('iconImagePath', e)} />
                <Translate>Icon</Translate>
              </HeaderCell>
              <Cell>{rowData => <Icon size="2em" as={icons[rowData.iconImagePath]} />}</Cell>
            </Column>
            <Column sortable flexGrow={4}>
              <HeaderCell>
                <Input onChange={e => handleFilterChange('name', e)} />
                <Translate>Name</Translate>
              </HeaderCell>
              <Cell dataKey="name" />
            </Column>
            <Column sortable flexGrow={4}>
              <HeaderCell>
                <Input onChange={e => handleFilterChange('description', e)} />
                <Translate>Description</Translate>
              </HeaderCell>
              <Cell dataKey="description" />
            </Column>
            <Column sortable flexGrow={2}>
              <HeaderCell>
                <Input onChange={e => handleFilterChange('viewOrder', e)} />
                <Translate>View Order</Translate>
              </HeaderCell>
              <Cell dataKey="viewOrder" />
            </Column>
            <Column sortable flexGrow={4}>
              <HeaderCell>
                <Input onChange={e => handleFilterChange('navPath', e)} />
                <Translate>Navigation Path</Translate>
              </HeaderCell>
              <Cell dataKey="navPath" />
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
              total={screenListResponse?.extraNumeric ?? 0}
            />
          </div>

          <Modal open={screenPopupOpen} overflow>
            <Modal.Title>
              <Translate>New/Edit Screen</Translate>
            </Modal.Title>
            <Modal.Body>
              <Form fluid>
                <MyInput fieldName="name" record={screen} setRecord={setScreen} />
                <MyInput fieldName="description" record={screen} setRecord={setScreen} />
                <MyInput
                  fieldName="viewOrder"
                  fieldType="number"
                  record={screen}
                  setRecord={setScreen}
                />
                <MyIconInput
                  fieldName="iconImagePath"
                  fieldLabel="Icon"
                  record={screen}
                  setRecord={setScreen}
                />
                <MyInput fieldName="navPath" record={screen} setRecord={setScreen} />
              </Form>
            </Modal.Body>
            <Modal.Footer>
              <Stack spacing={2} divider={<Divider vertical />}>
                <Button appearance="primary" onClick={handleScreenSave}>
                  Save
                </Button>
                <Button appearance="primary" color="red" onClick={() => setScreenPopupOpen(false)}>
                  Cancel
                </Button>
              </Stack>
            </Modal.Footer>
          </Modal>
        </Panel>
      )}

      <Drawer open={screenMetadataPopupOpen} onClose={() => setScreenMetadataPopupOpen(false)}>
        <Drawer.Header>
          <Drawer.Title>List of Metadata In Screen</Drawer.Title> 
        </Drawer.Header>
        <Drawer.Body>
          <List bordered>
            {(screenMetadataListResponse?.object ?? []).map(smd => {
              return <List.Item>{smd.metadataObject.objectName}</List.Item>
            })}
          </List>
        </Drawer.Body>
      </Drawer>

      {(!module || !module.key) && (
        <IconButton appearance="ghost" color="cyan" icon={<ArowBackIcon />} onClick={goBack}>
          No Valid Module Selected, Go Back
        </IconButton>
      )}
    </>
  );
};

export default Screens;
