import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState, useEffect } from 'react';
import { Panel } from 'rsuite';
import { useGetModulesQuery, useSaveModuleMutation } from '@/services/setupService';
import { Carousel } from 'rsuite';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { FaUndo } from 'react-icons/fa';
import { ApModule } from '@/types/model-types';
import { newApModule } from '@/types/model-types-constructor';
import { Form } from 'rsuite';
import MyInput from '@/components/MyInput';
import { addFilterToListRequest, fromCamelCaseToDBName } from '@/utils';
import Screens from './Screens';
import * as icons from 'react-icons/fa6';
import { MdDelete } from 'react-icons/md';
import { IoSettingsSharp } from 'react-icons/io5';
import { MdModeEdit } from 'react-icons/md';
import { Icon } from '@rsuite/icons';
import MyButton from '@/components/MyButton/MyButton';
import ReactDOMServer from 'react-dom/server';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useAppDispatch } from '@/hooks';
import MyTable from '@/components/MyTable';
import AddEditModule from './AddEditModule';
import './styles.less';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import { notify } from '@/utils/uiReducerActions';
const Modules = () => {
  const dispatch = useAppDispatch();
  const [module, setModule] = useState<ApModule>({ ...newApModule });
  const [modulePopupOpen, setModulePopupOpen] = useState(false);
  const [carouselActiveIndex, setCarouselActiveIndex] = useState(0);
  const [subView, setSubView] = useState('');
  const [recordOfSearch, setRecordOfSearch] = useState({ name: '' });
  const [operationState, setOperationState] = useState<string>('New');
  const [width, setWidth] = useState<number>(window.innerWidth);
  const [openConfirmDeleteModule, setOpenConfirmDeleteModule] = useState<boolean>(false);
  const [stateOfDeleteModule, setStateOfDeleteModule] = useState<string>('delete');
  const [listRequest, setListRequest] = useState<ListRequest>({
    ...initialListRequest,
    pageSize: 15
  });
  // Fetch modules list response
  const { data: moduleListResponse, refetch, isFetching } = useGetModulesQuery(listRequest);
  //save module
  const [saveModule] = useSaveModuleMutation();
  // Pagination values
  const pageIndex = listRequest.pageNumber - 1;
  const rowsPerPage = listRequest.pageSize;
  const totalCount = moduleListResponse?.extraNumeric ?? 0;
  const divContent = (
    <div className="page-title">
      <h5><Translate>Modules</Translate></h5>
    </div>
  );
  dispatch(setPageCode('Modules'));
  dispatch(setDivContent(divContent));

  // Effects
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    handleFilterChange('name', recordOfSearch['name']);
  }, [recordOfSearch]);

  useEffect(() => {
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent('  '));
    };
  }, [location.pathname, dispatch]);

  // handling click on Add New Button
  const handleModuleNew = () => {
    setOperationState('New');
    setModulePopupOpen(true);
    setModule({ ...newApModule });
  };
  // className for selected row
  const isSelected = rowData => {
    if (rowData && module && rowData.key === module.key) {
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
      setListRequest({ ...listRequest, filters: [] });
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

  const conjureSubViews = () => {
    if (carouselActiveIndex === 0) {
      return null;
    }
    switch (subView) {
      case 'screens':
        return (
          <Screens
            module={module}
            goBack={() => {
              setCarouselActiveIndex(0);
            }}
          />
        );
    }
  };

  // handle deactivate module
  const handleDeactivate = () => {
    setOpenConfirmDeleteModule(false);
    saveModule({ ...module, isValid: false })
      .unwrap()
      .then(() => {
        refetch();
        dispatch(
          notify({
            msg: 'The Module was successfully Deactivated',
            sev: 'success'
          })
        );
      })
      .catch(() => {
        dispatch(
          notify({
            msg: 'Faild to Deactivate this Module',
            sev: 'error'
          })
        );
      });
  };
  // handle reactivate module
  const handleReactivate = () => {
    setOpenConfirmDeleteModule(false);
    saveModule({ ...module, isValid: true })
      .unwrap()
      .then(() => {
        refetch();
        dispatch(
          notify({
            msg: 'The Module was successfully Reactivated',
            sev: 'success'
          })
        );
      })
      .catch(() => {
        dispatch(
          notify({
            msg: 'Faild to Reactivate this Module',
            sev: 'error'
          })
        );
      });
  };

  const toSubView = (subview: string, rowData) => {
    setModule(rowData);
    setCarouselActiveIndex(1);
    setSubView(subview);
  };

  //icons column for(edit, deactivate and setup module screens)
  const iconsForActions = (rowData: ApModule) => (
    <div className="container-of-icons">
      <IoSettingsSharp
        title="Setup Module Screens"
        size={24}
        fill="var(--primary-gray)"
        className="icons-style"
        onClick={() => {
          toSubView('screens', rowData);
        }}
      />
      <MdModeEdit
        title="Edit"
        size={24}
        fill="var(--primary-gray)"
        className="icons-style"
        onClick={() => {
          setOperationState('Edit');
          setModulePopupOpen(true);
        }}
      />
      {rowData?.isValid ? (
        <MdDelete
          className="icons-style"
          title="Deactivate"
          size={24}
          fill="var(--primary-pink)"
          onClick={() => {
            setStateOfDeleteModule('deactivate');
            setOpenConfirmDeleteModule(true);
          }}
        />
      ) : (
        <FaUndo
          className="icons-style"
          title="Activate"
          size={21}
          fill="var(--primary-gray)"
          onClick={() => {
            setStateOfDeleteModule('reactivate');
            setOpenConfirmDeleteModule(true);
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
      render: rowData => <Icon fill="#969FB0" size="1.5em" as={icons[rowData.iconImagePath]} />
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
      key: 'icons',
      title: <Translate></Translate>,
      render: rowData => iconsForActions(rowData)
    }
  ];
  return (
    <Carousel className="carousel" autoplay={false} activeIndex={carouselActiveIndex}>
      <Panel>
        <MyTable
          height={450}
          data={moduleListResponse?.object ?? []}
          columns={tableColumns}
          filters={<><Form layout="inline">
            <MyInput
              placeholder="Search by Name"
              fieldName="name"
              fieldType="text"
              record={recordOfSearch}
              setRecord={setRecordOfSearch}
              showLabel={false}
              width={'220px'}
            />
          </Form></>}
          tableButtons={<><MyButton
            prefixIcon={() => <AddOutlineIcon />}
            color="var(--deep-blue)"
            onClick={handleModuleNew}
            width="109px"
          >Add New</MyButton></>}
          rowClassName={isSelected}
          loading={isFetching}
          onRowClick={rowData => {
            setModule(rowData);
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

        <AddEditModule
          open={modulePopupOpen}
          setOpen={setModulePopupOpen}
          operationState={operationState}
          width={width}
          module={module}
          setModule={setModule}
          refetch={refetch}
        />
        <DeletionConfirmationModal
          open={openConfirmDeleteModule}
          setOpen={setOpenConfirmDeleteModule}
          itemToDelete="Module"
          actionButtonFunction={
            stateOfDeleteModule == 'deactivate' ? handleDeactivate : handleReactivate
          }
          actionType={stateOfDeleteModule}
        />
      </Panel>
      {conjureSubViews()}
    </Carousel>
  );
};
export default Modules;
