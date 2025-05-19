import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState, useEffect } from 'react';
import { Drawer, List, Pagination, Panel } from 'rsuite';
import { useGetScreensQuery } from '@/services/setupService';
import { useGetScreenMetadataQuery } from '@/services/dvmService';
import { IconButton } from 'rsuite';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { ApScreen } from '@/types/model-types';
import { MdDelete } from 'react-icons/md';
import { MdModeEdit } from 'react-icons/md';
import { newApScreen } from '@/types/model-types-constructor';
import { Form } from 'rsuite';
import MyButton from '@/components/MyButton/MyButton';
import { addFilterToListRequest, fromCamelCaseToDBName } from '@/utils';
import MyInput from '@/components/MyInput';
import { Icon } from '@rsuite/icons';
import * as icons from 'react-icons/fa6';
import './styles.less';
import MyTable from '@/components/MyTable';
import AddEditScreen from './AddEditScreen';
import BackButton from '@/components/BackButton/BackButton';
const Screens = ({ module, goBack }) => {
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
  const [operationState, setOperationState] = useState<string>('New');
  const [record, setRecord] = useState({ value: '' });
  const [width, setWidth] = useState<number>(window.innerWidth);
  //fetch data
  const { data: screenListResponse, refetch } = useGetScreensQuery(listRequest);
  const { data: screenMetadataListResponse } = useGetScreenMetadataQuery(listRequestForMetadata);
  //useEffects
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
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
  //handle click on Add New Button
  const handleScreenNew = () => {
    setOperationState('New');
    setScreenPopupOpen(true);
    setScreen({ ...newApScreen, moduleKey: module.key });
  };
  //className for selected row
  const isSelected = rowData => {
    if (rowData && screen && rowData.key === screen.key) {
      return 'selected-row';
    } else return '';
  };
  //filter table
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
      // setListRequest(addFilterToListRequest('module_key', 'match', module.key, listRequest));
      setListRequest({
              ...initialListRequest,
              filters: [
                {
                  fieldName: 'module_key',
                  operator: 'match',
                  value: module.key
                }
              ]
            });
    }
  };
  //icons column (edit, deactivate)
  const iconsForActions = (rowData: ApScreen) => (
    <div className="container-of-icons">
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
  //table columns
  const tableColumns = [
    {
      key: 'icon',
      title: <Translate>Icon</Translate>,
      flexGrow: 3,
      render: rowData => (
        <Icon fill="var(--primary-gray)" size="1.5em" as={icons[rowData.iconImagePath]} />
      )
    },
    {
      key: 'name',
      title: <Translate>Name</Translate>,
      flexGrow: 4,
      dataKey: 'name'
    },
    {
      key: 'description',
      title: <Translate>Description</Translate>,
      flexGrow: 5,
      dataKey: 'description'
    },
    {
      key: 'viewOrder',
      title: <Translate>View Order</Translate>,
      flexGrow: 4,
      dataKey: 'viewOrder'
    },
    {
      key: 'navPath',
      title: <Translate>Navigation Path</Translate>,
      flexGrow: 4,
      dataKey: 'viewOrder'
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
      flexGrow: 3,
      render: rowData => iconsForActions(rowData)
    }
  ];

  return (
    <>
      {module && module.key && (
        <Panel
          header={
            <p className="title-screen">
              <Translate> Screens for </Translate> <i>{module?.name ?? ''}</i>{' '}
              <Translate>Module</Translate>
            </p>
          }
        >
          <div className="container-of-header-actions-screen">
            <div className={'container-of-back-and-search-screen'}>
              <div>
                <BackButton onClick={goBack} text="Back" appearance="ghost" />
              </div>
              <Form layout="inline">
                <MyInput
                  fieldName="value"
                  fieldType="text"
                  record={record}
                  setRecord={setRecord}
                  showLabel={false}
                  placeholder="Search by Name"
                  width={'220px'}
                  height={32}
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

          <MyTable
            height={450}
            data={screenListResponse?.object ?? []}
            columns={tableColumns}
            rowClassName={isSelected}
            onRowClick={rowData => {
              setScreen({ ...rowData, moduleKey: module.key });
            }}
            sortColumn={listRequest.sortBy}
            sortType={listRequest.sortType}
            onSortChange={(sortBy, sortType) => {
              if (sortBy) setListRequest({ ...listRequest, sortBy, sortType });
            }}
          />
          <div className="container-of-pagination-module">
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
              total={screenListResponse?.extraNumeric ?? 0}
            />
          </div>
          <AddEditScreen
            open={screenPopupOpen}
            setOpen={setScreenPopupOpen}
            operationState={operationState}
            width={width}
            screen={screen}
            setScreen={setScreen}
            refetch={refetch}
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
              return (
                <List.Item key={smd.metadataObject.objectId}>
                  {smd.metadataObject.objectName}
                </List.Item>
              );
            })}
          </List>
        </Drawer.Body>
      </Drawer>
      {(!module || !module.key) && (
        <BackButton onClick={goBack} text=" No Valid Module Selected, Go Back" appearance="ghost" />
      )}
    </>
  );
};
export default Screens;
