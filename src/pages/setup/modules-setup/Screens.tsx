import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState, useEffect } from 'react';
import { Drawer, List, Modal, Pagination, Panel, Table } from 'rsuite';
const { Column, HeaderCell, Cell } = Table;
import { useGetScreensQuery, useSaveScreenMutation } from '@/services/setupService';
import { useGetScreenMetadataQuery, useSaveScreenMetadataMutation } from '@/services/dvmService';
import {IconButton } from 'rsuite';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { ApScreen } from '@/types/model-types';
import { MdDelete } from 'react-icons/md';
import { MdModeEdit } from 'react-icons/md';
import { newApScreen } from '@/types/model-types-constructor';
import { Form, Stack, Divider } from 'rsuite';
import ArowBackIcon from '@rsuite/icons/ArowBack';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLaptop } from '@fortawesome/free-solid-svg-icons';
import { faCheckDouble } from '@fortawesome/free-solid-svg-icons';
import MyButton from '@/components/MyButton/MyButton';
import {
  addFilterToListRequest,
  fromCamelCaseToDBName
} from '@/utils';
import MyInput from '@/components/MyInput';
import MyIconInput from '@/components/MyInput/MyIconInput';
import { Icon } from '@rsuite/icons';
import * as icons from 'react-icons/fa6';
import MyModal from '@/components/MyModal/MyModal';
import './styles.less';
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

  const [operationState, setOperationState] = useState<string>('New');
  const [record, setRecord] = useState({ value: '' });

    const [isSmallWindow, setIsSmallWindow] = useState<boolean>(window.innerWidth < 500);

    useEffect(() => {
        const handleResize = () => {
          setIsSmallWindow(window.innerWidth < 500);
        };
    
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
      }, []);
  

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

  useEffect(() => {
    handleFilterChange('name', record['value']);
  }, [record]);

  useEffect(() => {
    if (saveScreenMutation.data) {
      setListRequest({ ...listRequest, timestamp: new Date().getTime() });
    }
  }, [saveScreenMutation.data]);

  const handleScreenNew = () => {
    setOperationState('New');
    setScreenPopupOpen(true);
    setScreen({ ...newApScreen, moduleKey: module.key });
  };

  const handleScreenSave = () => {
    setScreenPopupOpen(false);
    saveScreen(screen).unwrap();
  };

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
    <div className='container-of-icons'>
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

  const conjureFormContent = (stepNumber = 0) => {
      switch (stepNumber) {
        case 0:
          return (
            <Form
                fluid
              >
               

                <MyInput fieldName="name" record={screen} setRecord={setScreen} width={520} />
                <MyInput
                  fieldName="description"
                  fieldType="textarea"
                  record={screen}
                  setRecord={setScreen}
                  width={520}
                />
                <MyInput
                  fieldName="viewOrder"
                  fieldType="number"
                  record={screen}
                  setRecord={setScreen}
                  width={520}
                />
                <div className='container-of-two-fields-module'>
                  <MyIconInput
                    fieldName="iconImagePath"
                    fieldLabel="Icon"
                    record={screen}
                    setRecord={setScreen}
                    width={250}
                  />
                  <MyInput fieldName="navPath" record={screen} setRecord={setScreen} width={250} />
                </div>
              </Form>
          );
      }
    };
  

  return (
    <>
      {module && module.key && (
        <Panel
        header={
          <p >
            <Translate> Screens for </Translate> <i>{module?.name ?? ''}</i>{' '}
            <Translate>Module</Translate>
          </p>
        }
        >
          <div className='container-of-header-actions-screen'>
            <div className= {window.innerWidth > 700 ? 'container-of-back-and-search-screen' : ""}>
              <div>
              <MyButton
                prefixIcon={() => <ArowBackIcon />}
                color="var(--deep-blue)"
                appearance={'ghost'}
                onClick={goBack}
                width="82px"
              >
                Back
              </MyButton>
              </div>
              <Form>
                <MyInput
                  fieldName="value"
                  fieldType="text"
                  record={record}
                  setRecord={setRecord}
                  showLabel={false}
                  placeholder="Search by Name"
                  width={'220px'}
                  // width={isSmallWindow ? '109px' : '220px'}
                />
              </Form>
            </div>
            <div>
              <MyButton
                prefixIcon={() => <AddOutlineIcon />}
                color="var(--deep-blue)"
                onClick={handleScreenNew}
                width="111px"
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
              <Cell>
                {rowData => (
                  <Icon fill="var(--primary-gray)" size="1.5em" as={icons[rowData.iconImagePath]} />
                )}
              </Cell>
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
          <div className='container-of-pagination-module'>
            <Pagination
              prev
              next
              first={!isSmallWindow}
            last={!isSmallWindow}
            ellipsis={!isSmallWindow}
            boundaryLinks={!isSmallWindow}
            maxButtons={isSmallWindow ? 1 : 2}
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

          {/* <Modal open={screenPopupOpen} className="left-modal" size="xsm">
            <Modal.Title>
              <Translate>{operationState} Screen</Translate>
            </Modal.Title>
            <hr />
            <Modal.Body className='modal-body'>
              <Form
                fluid
                
              >
                <div
                 className='header-of-modal'
                >
                  <FontAwesomeIcon
                    icon={faLaptop}
                    color="#415BE7"
                    // style={{ marginBottom: '10px' }}
                    size="2x"
                  />
                  <label >Screen info</label>
                </div>

                <MyInput fieldName="name" record={screen} setRecord={setScreen} width={520} />
                <MyInput
                  fieldName="description"
                  fieldType="textarea"
                  record={screen}
                  setRecord={setScreen}
                  width={520}
                />
                <MyInput
                  fieldName="viewOrder"
                  fieldType="number"
                  record={screen}
                  setRecord={setScreen}
                  width={520}
                />
                <div className='container-of-two-fields'>
                  <MyIconInput
                    fieldName="iconImagePath"
                    fieldLabel="Icon"
                    record={screen}
                    setRecord={setScreen}
                    width={250}
                  />
                  <MyInput fieldName="navPath" record={screen} setRecord={setScreen} width={250} />
                </div>
              </Form>
            </Modal.Body>
            <hr />
            <Modal.Footer className='modal-footer'>
              <Stack
                className='stack'
                spacing={2}
                divider={<Divider vertical />}
              >
                <MyButton ghost color="var(--deep-blue)" onClick={() => setScreenPopupOpen(false)} width='78px' height='40px'>
                  Cancel
                </MyButton>
                <MyButton
                  prefixIcon={() => <FontAwesomeIcon icon={faCheckDouble} />}
                  color="var(--deep-blue)"
                  onClick={handleScreenSave}
                   width='93px'
                  height='40px'
                >
                  {operationState === 'New' ? 'Create' : 'Save'}
                </MyButton>
              </Stack>
            </Modal.Footer>
          </Modal> */}


          <MyModal
                    open={screenPopupOpen}
                    setOpen={setScreenPopupOpen}
                    title={operationState + ' Screen'}
                    position="right"
                    content={conjureFormContent}
                    actionButtonLabel={operationState === 'New' ? 'Create' : 'Save'}
                    steps={[{ title: 'Screen Info', icon: faLaptop }]}
                    size={'570px'}
                  />
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
