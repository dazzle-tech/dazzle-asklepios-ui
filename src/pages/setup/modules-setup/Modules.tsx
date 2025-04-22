import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState, useEffect } from 'react';
import { Pagination, Panel } from 'rsuite';
import { useGetModulesQuery } from '@/services/setupService';
import { Carousel } from 'rsuite';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
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
const Modules = () => {
  const dispatch = useAppDispatch();
  const [module, setModule] = useState<ApModule>({ ...newApModule });
  const [modulePopupOpen, setModulePopupOpen] = useState(false);
  const [carouselActiveIndex, setCarouselActiveIndex] = useState(0);
  const [subView, setSubView] = useState('');
  const [listRequest, setListRequest] = useState<ListRequest>({ ...initialListRequest });
  const [recordOfSearch, setRecordOfSearch] = useState({ name: '' });
  const [operationState, setOperationState] = useState<string>('New');
  const [width, setWidth] = useState<number>(window.innerWidth);
  const { data: moduleListResponse, refetch, isLoading } = useGetModulesQuery(listRequest);
  const divContent = (
    <div className="title">
      <h5>Modules</h5>
    </div>
  );
  const divContentHTML = ReactDOMServer.renderToStaticMarkup(divContent);
  dispatch(setPageCode('Modules'));
  dispatch(setDivContent(divContentHTML));
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
        onClick={() => {
          toSubView('screens', rowData);
        }}
      />
      <MdModeEdit
        title="Edit"
        size={24}
        fill="var(--primary-gray)"
        onClick={() => {
          setModule(rowData);
          setOperationState('Edit');
          setModulePopupOpen(true);
        }}
      />
      <MdDelete title="Deactivate" size={24} fill="var(--primary-pink)" />
    </div>
  );
  //table columns
  const tableColumns = [
    {
      key: 'icon',
      title: <Translate>Icon</Translate>,
      flexGrow: 3,
      render: rowData => <Icon fill="#969FB0" size="1.5em" as={icons[rowData.iconImagePath]} />
    },
    {
      key: 'name',
      title: <Translate>Name</Translate>,
      flexGrow: 5,
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
      flexGrow: 3,
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
    <Carousel className="carousel" autoplay={false} activeIndex={carouselActiveIndex}>
      <Panel>
        <div className="container-of-header-actions-module">
          <Form layout="inline">
            <MyInput
              placeholder="Search by Name"
              fieldName="name"
              fieldType="text"
              record={recordOfSearch}
              setRecord={setRecordOfSearch}
              showLabel={false}
              width={'220px'}
            />
          </Form>
          <MyButton
            prefixIcon={() => <AddOutlineIcon />}
            color="var(--deep-blue)"
            onClick={handleModuleNew}
            width="109px"
          >
            Add New
          </MyButton>
        </div>
        <MyTable
          height={450}
          data={moduleListResponse?.object ?? []}
          columns={tableColumns}
          rowClassName={isSelected}
          loading={isLoading}
          onRowClick={rowData => {
            setModule(rowData);
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
            total={moduleListResponse?.extraNumeric ?? 0}
          />
        </div>
        <AddEditModule
          open={modulePopupOpen}
          setOpen={setModulePopupOpen}
          operationState={operationState}
          width={width}
          module={module}
          setModule={setModule}
          refetch={refetch}
        />
      </Panel>
      {conjureSubViews()}
    </Carousel>
  );
};
export default Modules;
