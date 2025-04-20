import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState, useEffect } from 'react';
import { Modal, Pagination, Panel, Table } from 'rsuite';
const { Column, HeaderCell, Cell } = Table;
import { useGetModulesQuery, useSaveModuleMutation } from '@/services/setupService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLaptop } from '@fortawesome/free-solid-svg-icons';
import { Carousel } from 'rsuite';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { ApModule } from '@/types/model-types';
import { newApModule } from '@/types/model-types-constructor';
import { Form, Stack, Divider } from 'rsuite';
import MyInput from '@/components/MyInput';
import { addFilterToListRequest, fromCamelCaseToDBName } from '@/utils';
import Screens from './Screens';
import * as icons from 'react-icons/fa6';
import { MdDelete } from 'react-icons/md';
import { IoSettingsSharp } from 'react-icons/io5';
import { MdModeEdit } from 'react-icons/md';
import MyIconInput from '@/components/MyInput/MyIconInput';
import { Icon } from '@rsuite/icons';
import MyButton from '@/components/MyButton/MyButton';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import ReactDOMServer from 'react-dom/server';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useAppDispatch } from '@/hooks';
import MyModal from '@/components/MyModal/MyModal';
import MyTable from '@/components/MyTable';
import './styles.less';
import { title } from 'process';

const Modules = () => {
  const dispatch = useAppDispatch();
  const [module, setModule] = useState<ApModule>({ ...newApModule });
  const [modulePopupOpen, setModulePopupOpen] = useState(false);
  const [carouselActiveIndex, setCarouselActiveIndex] = useState(0);
  const [subView, setSubView] = useState('');

  const [listRequest, setListRequest] = useState<ListRequest>({ ...initialListRequest });
  const [recordOfSearch, setRecordOfSearch] = useState({ name: '' });

  const [saveModule, saveModuleMutation] = useSaveModuleMutation();
  const divElement = useSelector((state: RootState) => state.div?.divElement);
  const divContent = (
    <div className="title">
      <h5>Modules</h5>
    </div>
  );
  const divContentHTML = ReactDOMServer.renderToStaticMarkup(divContent);
  dispatch(setPageCode('Modules'));
  dispatch(setDivContent(divContentHTML));
  useEffect(() => {}, []);

  const { data: moduleListResponse, refetch, isLoading } = useGetModulesQuery(listRequest);

  const [operationState, setOperationState] = useState<string>('New');

  const [isSmallWindow, setIsSmallWindow] = useState<boolean>(window.innerWidth < 500);

  // useEffect(() => {}, []);

  const handleModuleNew = () => {
    setOperationState('New');
    setModulePopupOpen(true);
    setModule({ ...newApModule });
  };

  const handleModuleSave = () => {
    setModulePopupOpen(false);
    saveModule(module).unwrap();
  };

  useEffect(() => {
    const handleResize = () => {
      setIsSmallWindow(window.innerWidth < 500);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (saveModuleMutation.data) {
      setListRequest({ ...listRequest, timestamp: new Date().getTime() });
    }
  }, [saveModuleMutation.data]);

  useEffect(() => {
    handleFilterChange('name', recordOfSearch['name']);
  }, [recordOfSearch]);

  const isSelected = rowData => {
    if (rowData && module && rowData.key === module.key) {
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
  useEffect(() => {
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent('  '));
    };
  }, [location.pathname, dispatch]);

  const toSubView = (subview: string, rowData) => {
    setModule(rowData);
    setCarouselActiveIndex(1);
    setSubView(subview);
  };

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

  const conjureFormContent = (stepNumber = 0) => {
    switch (stepNumber) {
      case 0:
        return (
          <Form fluid>
            <MyInput fieldName="name" record={module} setRecord={setModule} width={520} />
            <MyInput
              fieldType="textarea"
              fieldName="description"
              record={module}
              setRecord={setModule}
              width={520}
              height={150}
            />
            <div className="container-of-two-fields-module">
              <MyInput
                fieldName="viewOrder"
                fieldType="number"
                record={module}
                setRecord={setModule}
                width={250}
              />
              <MyIconInput
                fieldName="iconImagePath"
                fieldLabel="Icon"
                record={module}
                setRecord={setModule}
                width={250}
              />
            </div>
          </Form>
        );
    }
  };

   const tableColumns = [
      {
        key: 'queueNumber',
        title: <Translate>#</Translate>,
        flexGrow: 1,
        dataKey: 'queueNumber'
      },
      {
        key: 'patientFullName',
        title: <Translate>PATIENT NAME</Translate>,
        flexGrow: 6,
        fullText: true,
      },
      {
        key: 'visitType',
        title: <Translate>VISIT TYPE</Translate>,
        flexGrow: 4,

      },
      {
        key: 'chiefComplaint',
        title: <Translate>CHIEF COMPLAIN</Translate>,
        flexGrow: 4,
      },
      {
        key: 'diagnosis',
        title: <Translate>DIAGNOSIS</Translate>,
        flexGrow: 4,
      },
      {
        key: 'hasPrescription',
        title: <Translate>PRESCRIPTION</Translate>,
        flexGrow: 3,
     
      },
      {
        key: 'hasOrder',
        title: <Translate>HAS ORDER</Translate>,
        flexGrow: 3,
       
      },
      {
        key: 'encounterPriority',
        title: <Translate>PRIORITY</Translate>,
        flexGrow: 3,
       
      },
      {
        key: 'plannedStartDate',
        title: <Translate>DATE</Translate>,
        flexGrow: 3,
        dataKey: 'plannedStartDate'
      },
      {
        key: 'status',
        title: <Translate>STATUS</Translate>,
        flexGrow: 3,
        render: rowData =>
          rowData.encounterStatusLvalue
            ? rowData.encounterStatusLvalue.lovDisplayVale
            : rowData.encounterStatusLkey
      },
      {
        key: 'hasObservation',
        title: <Translate>IS OBSERVED</Translate>,
      },
      {
        key: 'actions',
        title: <Translate> </Translate>,
      }
    ];

  return (
    <Carousel className="carousel" autoplay={false} activeIndex={carouselActiveIndex}>
      <Panel

      // style={{backgroundColor: "#b3c2d3"}}
      // header={
      //   <h3 className="title">
      //     <Translate>Modules</Translate>
      //   </h3>
      // }
      >
        <div className="container-of-header-actions-module">
          <Form>
            <MyInput
              placeholder="Search by Name"
              fieldName="name"
              fieldType="text"
              record={recordOfSearch}
              setRecord={setRecordOfSearch}
              showLabel={false}
              width={'220px'}
              // width={'100%'}
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
        // loading={isLoading || (manualSearchTriggered && isFetching)}
        onRowClick={rowData => {
          setModule(rowData);
          
        }}
        sortColumn={listRequest.sortBy}
        sortType={listRequest.sortType}
        onSortChange={(sortBy, sortType) => {
          if (sortBy)
          setListRequest({ ...listRequest, sortBy, sortType });
        }}
      />

        <Table
          loading={isLoading}
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
          headerHeight={42}
          cellBordered
          data={moduleListResponse?.object ?? []}
          onRowClick={rowData => {
            setModule(rowData);
          }}
          rowClassName={isSelected}
        >
          <Column sortable align="center" flexGrow={1}>
            <HeaderCell>
              <Translate>Icon</Translate>
            </HeaderCell>
            <Cell>
              {rowData => <Icon fill="#969FB0" size="1.5em" as={icons[rowData.iconImagePath]} />}
            </Cell>
          </Column>
          <Column sortable flexGrow={4}>
            <HeaderCell>
              <Translate>Name</Translate>
            </HeaderCell>
            <Cell className="column-name" dataKey="name" />
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

          <Column flexGrow={2}>
            <HeaderCell></HeaderCell>
            <Cell>{rowData => iconsForActions(rowData)}</Cell>
          </Column>
        </Table>
        <div className="container-of-pagination-module">
          <Pagination
            prev
            next
            first={!isSmallWindow}
            last={!isSmallWindow}
            ellipsis={!isSmallWindow}
            boundaryLinks={!isSmallWindow}
            maxButtons={isSmallWindow ? 1 : 2}
            size="xs"
            // layout={isSmallWindow ? ['pager'] : ['limit', '|', 'pager']}
            layout={ ['limit', '|', 'pager']}
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

        {/* <Modal open={modulePopupOpen} className="left-modal" size="xsm">
          <Modal.Title>
            <Translate>{operationState} Module</Translate>
          </Modal.Title>
          <hr />

          <Modal.Body className="modal-body">
            <Form fluid>
              <div
                className="header-of-modal"
              >
                <FontAwesomeIcon
                  icon={faLaptop}
                  color="#415BE7"
                  // style={{ marginBottom: '10px' }}
                  size="2x"
                />
                <label>Module info</label>
              </div>
              <MyInput fieldName="name" record={module} setRecord={setModule} width={520} />
              <MyInput
                fieldType="textarea"
                fieldName="description"
                record={module}
                setRecord={setModule}
                width={520}
                height={150}
              />
              <div className='container-of-two-fields'>
                <MyInput
                  fieldName="viewOrder"
                  fieldType="number"
                  record={module}
                  setRecord={setModule}
                  width={250}
                />
                <MyIconInput
                  fieldName="iconImagePath"
                  fieldLabel="Icon"
                  record={module}
                  setRecord={setModule}
                  width={250}
                />
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
              <MyButton
                ghost
                color="var(--deep-blue)"
                onClick={() => setModulePopupOpen(false)}
                width="78px"
                height="40px"
              >
                Cancel
              </MyButton>
              <MyButton
                prefixIcon={() => <FontAwesomeIcon icon={faCheckDouble} />}
                color="var(--deep-blue)"
                onClick={handleModuleSave}
                width="93px"
                height="40px"
              >
                {operationState === 'New' ? 'Create' : 'Save'}
              </MyButton>
            </Stack>
          </Modal.Footer>
        </Modal> */}
        <MyModal
          open={modulePopupOpen}
          setOpen={setModulePopupOpen}
          title={operationState + ' Module'}
          position="right"
          content={conjureFormContent}
          actionButtonLabel={operationState === 'New' ? 'Create' : 'Save'}
          steps={[{ title: 'Module Info', icon: faLaptop }]}
          size={'570px'}
        />
      </Panel>
      {conjureSubViews()}
    </Carousel>
  );
};

export default Modules;
