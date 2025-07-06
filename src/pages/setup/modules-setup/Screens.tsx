import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState, useEffect } from 'react';
import { Drawer, List, Panel } from 'rsuite';
import { useGetScreensQuery, useSaveScreenMutation } from '@/services/setupService';
import { FaUndo } from 'react-icons/fa';
import { useGetScreenMetadataQuery } from '@/services/dvmService';
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
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import { notify } from '@/utils/uiReducerActions';
import { useAppDispatch } from '@/hooks';
const Screens = ({ module, goBack }) => {
  const dispatch = useAppDispatch();
  const [screen, setScreen] = useState<ApScreen>({ ...newApScreen });
  const [screenPopupOpen, setScreenPopupOpen] = useState(false);
  const [screenMetadataPopupOpen, setScreenMetadataPopupOpen] = useState(false);
  const [openConfirmDeleteModule, setOpenConfirmDeleteScreen] = useState<boolean>(false);
  const [stateOfDeleteScreen, setStateOfDeleteScreen] = useState<string>('delete');
  const [record, setRecord] = useState({ value: '' });
  const [width, setWidth] = useState<number>(window.innerWidth);
  const [load, setLoad] = useState<boolean>(false);
  const [listRequest, setListRequest] = useState<ListRequest>({
    ...initialListRequest,
    sortBy: 'viewOrder',
    pageSize: 15
  });
  const [listRequestForMetadata, setListRequestForMetadata] = useState<ListRequest>({
    ...initialListRequest,
    ignore: true,
    pageSize: 15
  });
  //fetch data
  const { data: screenListResponse, refetch, isFetching } = useGetScreensQuery(listRequest);
  const { data: screenMetadataListResponse } = useGetScreenMetadataQuery(listRequestForMetadata);
  //Save screen
  const [saveScreen] = useSaveScreenMutation();
  // Pagination values
  const pageIndex = listRequest.pageNumber - 1;
  const rowsPerPage = listRequest.pageSize;
  const totalCount = screenListResponse?.extraNumeric ?? 0;

  // Effects
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

  // handle deactivate module
  const handleDeactivate = async () => {
    setOpenConfirmDeleteScreen(false);
    try {
      setLoad(true);
      await saveScreen({ ...screen, isValid: false }).unwrap();
      refetch();
      dispatch(
        notify({
          msg: 'The Screen was successfully Deactivated',
          sev: 'success'
        })
      );
    } catch (error) {
      dispatch(
        notify({
          msg: 'Faild to Deactivate this Screen',
          sev: 'error'
        })
      );
    } finally {
      setLoad(false);
    }
  };
  // handle reactivate screen
  const handleReactivate = async () => {
    setOpenConfirmDeleteScreen(false);
    try {
      setLoad(true);
      await saveScreen({ ...screen, isValid: true }).unwrap();
      refetch();
      dispatch(
        notify({
          msg: 'The Screen was successfully Reactivated',
          sev: 'success'
        })
      );
    } catch (error) {
      dispatch(
        notify({
          msg: 'Faild to Reactivate this Screen',
          sev: 'error'
        })
      );
    } finally {
      setLoad(false);
    }
  };

  //icons column (edit, deactivate)
  const iconsForActions = (rowData: ApScreen) => (
    <div className="container-of-icons">
      <MdModeEdit
        title="Edit"
        size={24}
        fill="var(--primary-gray)"
        className="icons-style"
        onClick={() => {
          setScreenPopupOpen(true);
        }}
      />
      {rowData?.isValid ? (
        <MdDelete
          className="icons-style"
          title="Deactivate"
          size={24}
          fill="var(--primary-pink)"
          onClick={() => {
            setStateOfDeleteScreen('deactivate');
            setOpenConfirmDeleteScreen(true);
          }}
        />
      ) : (
        <FaUndo
          className="icons-style"
          title="Activate"
          size={21}
          fill="var(--primary-gray)"
          onClick={() => {
            setStateOfDeleteScreen('reactivate');
            setOpenConfirmDeleteScreen(true);
          }}
        />
      )}
    </div>
  );
  //table columns
  const tableColumns = [
    {
      key: 'icon',
      title: <Translate>Icon</Translate>,
      render: rowData => (
        <Icon fill="var(--primary-gray)" size="1.5em" as={icons[rowData.iconImagePath]} />
      )
    },
    {
      key: 'name',
      title: <Translate>Name</Translate>,
      dataKey: 'name'
    },
    {
      key: 'description',
      title: <Translate>Description</Translate>,
      dataKey: 'description'
    },
    {
      key: 'viewOrder',
      title: <Translate>View Order</Translate>,
      dataKey: 'viewOrder'
    },
    {
      key: 'navPath',
      title: <Translate>Navigation Path</Translate>,
      dataKey: 'viewOrder'
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
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
            loading={load || isFetching}
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
            page={pageIndex}
            rowsPerPage={rowsPerPage}
            totalCount={totalCount}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
          />
          <AddEditScreen
            open={screenPopupOpen}
            setOpen={setScreenPopupOpen}
            width={width}
            setLoad={setLoad}
            screen={screen}
            setScreen={setScreen}
            refetch={refetch}
          />
          <DeletionConfirmationModal
            open={openConfirmDeleteModule}
            setOpen={setOpenConfirmDeleteScreen}
            itemToDelete="Screen"
            actionButtonFunction={
              stateOfDeleteScreen == 'deactivate' ? handleDeactivate : handleReactivate
            }
            actionType={stateOfDeleteScreen}
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
