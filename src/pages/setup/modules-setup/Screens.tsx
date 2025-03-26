import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState, useEffect } from 'react';
import { Drawer, Input, List, Modal, Pagination, Panel, Table,InputGroup } from 'rsuite';
import SearchIcon from '@rsuite/icons/Search';
const { Column, HeaderCell, Cell } = Table;
import { useGetScreensQuery, useSaveScreenMutation } from '@/services/setupService';
import { useGetScreenMetadataQuery, useSaveScreenMetadataMutation } from '@/services/dvmService';
import { Button, ButtonToolbar, Carousel, IconButton } from 'rsuite';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import EditIcon from '@rsuite/icons/Edit';
import ListIcon from '@rsuite/icons/List';
import TrashIcon from '@rsuite/icons/Trash';
import { ApScreen } from '@/types/model-types';
import { MdDelete } from 'react-icons/md';
import { MdModeEdit } from 'react-icons/md';
import { newApScreen } from '@/types/model-types-constructor';
import { Form, Stack, Divider } from 'rsuite';
import ArowBackIcon from '@rsuite/icons/ArowBack';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLaptop } from '@fortawesome/free-solid-svg-icons';
import { faCheckDouble } from '@fortawesome/free-solid-svg-icons';
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

  const [operationState, setOperationState] = useState<string>("New");

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
    setOperationState('New');
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

  const iconsForActions = (rowData: ApScreen) => (
    <div style={{ display: 'flex', gap: '20px' }}>
      <MdModeEdit
        title="Edit"
        size={24}
        fill="var(--primary-gray)"
        onClick={() => {
          setScreen(rowData);
          setOperationState('Edit');
          setScreenPopupOpen(true);
        }}
      />
      <MdDelete title="Deactivate" fill="var(--primary-pink)" size={24} />
    </div>
  );

  return (
    <>
      {module && module.key && (
        <Panel
        // header={
        //   <h3 className="title">
        //     <Translate> Screens for </Translate> <i>{module?.moduleName ?? ''}</i>{' '}
        //     <Translate>Module</Translate>
        //   </h3>
        // }
        >
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div style={{display: "flex", gap: "20px"}}>
         

            <Button startIcon={<ArowBackIcon />} style={{ marginBottom: 10}} color="var(--deep-blue)" appearance="ghost" onClick={goBack}> Back </Button>


          
            <InputGroup inside style={{ width: 170, marginBottom: 10 }}>
                        <InputGroup.Button>
                          <SearchIcon />
                        </InputGroup.Button>
                        <Input style={{fontSize: "12px"}} placeholder="Search by Name" onChange={e => handleFilterChange('name', e)} />
                      </InputGroup>
                     

             </div>
            <div>
              
                <Button startIcon={<AddOutlineIcon />} style={{ marginRight: '40px', backgroundColor: "var(--deep-blue)"}} appearance="primary" onClick={handleScreenNew}> Add New </Button>
              
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
            cellBordered
            data={screenListResponse?.object ?? []}
            onRowClick={rowData => {
              setScreen({ ...rowData, moduleKey: module.key });
            }}
            rowClassName={isSelected}
          >
            <Column sortable align="center" flexGrow={1}>
              <HeaderCell>
                <Translate>Icon</Translate>
              </HeaderCell>
              <Cell>{rowData => <Icon fill="var(--primary-gray)" size="1.5em" as={icons[rowData.iconImagePath]} />}</Cell>
            </Column>
            <Column sortable flexGrow={4}>
              <HeaderCell>
                <Translate>Name</Translate>
              </HeaderCell>
              <Cell dataKey="name" />
            </Column>
            <Column sortable flexGrow={4}>
              <HeaderCell>
                <Translate>Description</Translate>
              </HeaderCell>
              <Cell dataKey="description" />
            </Column>
            <Column sortable flexGrow={2}>
              <HeaderCell>
                <Translate>View Order</Translate>
              </HeaderCell>
              <Cell dataKey="viewOrder" />
            </Column>
            <Column sortable flexGrow={4}>
              <HeaderCell>
                <Translate>Navigation Path</Translate>
              </HeaderCell>
              <Cell dataKey="navPath" />
            </Column>

            <Column flexGrow={2}>
              <HeaderCell></HeaderCell>
              <Cell>{rowData => iconsForActions(rowData)}</Cell>
            </Column>
          </Table>
          <div style={{ padding: 20, backgroundColor: '#F4F7FC'}}>
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

          <Modal open={screenPopupOpen} className="left-modal" size="xsm">
            <Modal.Title>
              <Translate>{operationState} Screen</Translate>
            </Modal.Title>
            <hr />
            <Modal.Body style={{ marginBottom: '50px' }}>
              <Form fluid>
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
                                  icon={faLaptop}
                                  color="#415BE7"
                                  style={{ marginBottom: '10px' }}
                                  size="2x"
                                />
                                <label style={{fontWeight: "bold", fontSize: "14px"}}>Screen info</label>
                              </div>

                <MyInput fieldName="name" record={screen} setRecord={setScreen} width={520} height={45}/>
                <MyInput fieldName="description" record={screen} setRecord={setScreen} width={520} height={150} />
                <MyInput
                  fieldName="viewOrder"
                  fieldType="number"
                  record={screen}
                  setRecord={setScreen}
                  height={45}
                  width={520}
                />
                <div style={{ display: 'flex', gap: '20px' }}>
                <MyIconInput
                  fieldName="iconImagePath"
                  fieldLabel="Icon"
                  record={screen}
                  setRecord={setScreen}
                  height={"45px"}
                  width={250}
                />
                <MyInput fieldName="navPath" record={screen} setRecord={setScreen} height={45} width={250} />
                </div>
              </Form>
            </Modal.Body>
            <hr/>
            <Modal.Footer>
              <Stack style={{display: "flex", justifyContent: "flex-end"}} spacing={2} divider={<Divider vertical />}>
               <Button
                              appearance="subtle"
                              style={{ color: "var(--deep-blue)" }}
                              onClick={() => setScreenPopupOpen(false)}
                            >
                              Cancel
                            </Button>
                            <Button startIcon={<FontAwesomeIcon icon={faCheckDouble} />} style={{backgroundColor: "var(--deep-blue)"}} appearance="primary" onClick={handleScreenSave}> {operationState === "New" ? "Create" : "Save"} </Button>
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
              return <List.Item>{smd.metadataObject.objectName}</List.Item>;
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
