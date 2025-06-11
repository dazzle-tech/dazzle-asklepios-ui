import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState, useEffect } from 'react';
import { Drawer, Input, Modal, Pagination, Panel, SelectPicker, Table } from 'rsuite';
const { Column, HeaderCell, Cell } = Table;
import { FaUndo } from 'react-icons/fa';
import { MdModeEdit } from 'react-icons/md';
import { MdDelete } from 'react-icons/md';
import {
  useGetServicesQuery,
  useSaveServiceMutation,
  useGetCdtsQuery,
  useLinkCdtServiceMutation,
  useUnlinkCdtServiceMutation,
  useGetLovValuesByCodeQuery
} from '@/services/setupService';
import { Button, ButtonToolbar, IconButton } from 'rsuite';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import EditIcon from '@rsuite/icons/Edit';
import TrashIcon from '@rsuite/icons/Trash';
import { ApService } from '@/types/model-types';
import { newApServiceCdt, newApService } from '@/types/model-types-constructor';
import { Form, Stack, Divider } from 'rsuite';
import MyInput from '@/components/MyInput';
import { addFilterToListRequest, fromCamelCaseToDBName } from '@/utils';
import { Check, Trash } from '@rsuite/icons';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import ReactDOMServer from 'react-dom/server';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useAppDispatch } from '@/hooks';
import MyTable from '@/components/MyTable';
import AddEditService from './AddEditService';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
const ServiceSetup = () => {
  const dispatch = useAppDispatch();
  const [service, setService] = useState<ApService>({ ...newApService });
  const [popupOpen, setPopupOpen] = useState(false);
  const [proceduresOpen, setProceduresOpen] = useState(false);
  const [openConfirmDeleteService, setOpenConfirmDeleteService] =
      useState<boolean>(false);
    const [stateOfDeleteService, setStateOfDeleteService] = useState<string>('delete');
  const [width, setWidth] = useState<number>(window.innerWidth);
  const [cdtMap, setCdtMap] = useState({});
  const [selectedCdtKey, setSelectedCdtKey] = useState('');
  const [recordOfFilter, setRecordOfFilter] = useState({ filter: '', value: '' });
  const [listRequest, setListRequest] = useState<ListRequest>({
    ...initialListRequest,
    pageSize: 15
  });

  const [saveService, saveServiceMutation] = useSaveServiceMutation();
  const [linkCdtService, linkCdtServiceMutation] = useLinkCdtServiceMutation();
  const [unlinkCdtService, unlinkCdtServiceMutation] = useUnlinkCdtServiceMutation();

  const { data: serviceListResponse, isFetching } = useGetServicesQuery(listRequest);
  const { data: cdtListResponse } = useGetCdtsQuery({
    ...initialListRequest,
    pageSize: 1000,
    skipDetails: true
  });

  // const { data: serviceTypeLovQueryResponse } = useGetLovValuesByCodeQuery('SERVICE_TYPE');
  // const { data: serviceCategoryLovQueryResponse } = useGetLovValuesByCodeQuery('SERVICE_CATEGORY');
  // const { data: currencyLovQueryResponse } = useGetLovValuesByCodeQuery('CURRENCY');
  const divContent = (
    <div style={{ display: 'flex' }}>
      <h5>Services</h5>
    </div>
  );
  const divContentHTML = ReactDOMServer.renderToStaticMarkup(divContent);
  dispatch(setPageCode('Services'));
  dispatch(setDivContent(divContentHTML));

  // Pagination values
  const pageIndex = listRequest.pageNumber - 1;
  const rowsPerPage = listRequest.pageSize;
  const totalCount = serviceListResponse?.extraNumeric ?? 0;
  // Available fields for filtering
  const filterFields = [
    { label: 'Type', value: 'typeLkey' },
    { label: 'Service Name', value: 'name' },
    { label: 'Abbreviation', value: 'abbreviation' },
    { label: 'Code', value: 'code' },
    { label: 'Category', value: 'categoryLkey' },
    { label: 'Price', value: 'price' },
    { label: 'Currency', value: 'currencyLkey' }
  ];

   // Icons column (Edit,Does Schedule, reactive/Deactivate)
    const iconsForActions = (rowData: ApService) => (
      <div className="container-of-icons-vaccine">
        <MdModeEdit
          className="icons-vaccine"
          title="Edit"
          size={24}
          fill="var(--primary-gray)"
          onClick={() => setPopupOpen(true)}
        />
        
        {rowData?.isValid ? (
          <MdDelete
            className="icons-vaccine"
            title="Deactivate"
            size={24}
            fill="var(--primary-pink)"
            onClick={() => {
              setStateOfDeleteService('deactivate');
              setOpenConfirmDeleteService(true);
            }}
          />
        ) : (
          <FaUndo
            className="icons-vaccine"
            title="Activate"
            size={24}
            fill="var(--primary-gray)"
            onClick={() => {
              setStateOfDeleteService('reactivate');
              setOpenConfirmDeleteService(true);
            }}
          />
        )}
      </div>
    );

  //Table columns
  const tableColumns = [
    {
      key: 'typeLkey',
      title: <Translate>Type</Translate>,
      flexGrow: 4,
      render: rowData => (rowData.typeLvalue ? rowData.typeLvalue.lovDisplayVale : rowData.typeLkey)
    },
    {
      key: 'name',
      title: <Translate>Service Name</Translate>,
      flexGrow: 4
    },
    {
      key: 'abbreviation',
      title: <Translate>Abbreviation</Translate>,
      flexGrow: 4
    },
    {
      key: 'code',
      title: <Translate>Code</Translate>,
      flexGrow: 4
    },
    {
      key: 'categoryLkey',
      title: <Translate>Category</Translate>,
      flexGrow: 4,
      render: rowData =>
        rowData.categoryLvalue ? rowData.categoryLvalue.lovDisplayVale : rowData.categoryLkey
    },
    {
      key: 'price',
      title: <Translate>Price</Translate>,
      flexGrow: 4
    },
    {
      key: 'currencyLkey',
      title: <Translate>Currency</Translate>,
      flexGrow: 4,
      render: rowData =>
        rowData.currencyLvalue ? rowData.currencyLvalue.lovDisplayVale : rowData.currencyLkey
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
      flexGrow: 3,
      render: rowData => iconsForActions(rowData)
    }
  ];

  // Filter table
  const filters = () => (
    <Form layout="inline" fluid className="container-of-filter-fields-vaccine">
      <MyInput
        selectDataValue="value"
        selectDataLabel="label"
        selectData={filterFields}
        fieldName="filter"
        fieldType="select"
        record={recordOfFilter}
        setRecord={updatedRecord => {
          setRecordOfFilter({
            ...recordOfFilter,
            filter: updatedRecord.filter,
            value: ''
          });
        }}
        showLabel={false}
        placeholder="Select Filter"
        searchable={false}
      />
      <MyInput
        fieldName="value"
        fieldType="text"
        record={recordOfFilter}
        setRecord={setRecordOfFilter}
        showLabel={false}
        placeholder="Search"
      />
    </Form>
  );

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

  useEffect(() => {
          const handleResize = () => setWidth(window.innerWidth);
          window.addEventListener('resize', handleResize);
          return () => window.removeEventListener('resize', handleResize);
        }, []);
  

  useEffect(() => {
    if (cdtListResponse && cdtListResponse.object) {
      let map = {};
      cdtListResponse.object.forEach(item => {
        map[item.key] = item.description;
      });
      setCdtMap(map);
    }
  }, [cdtListResponse]);

  const handleNew = () => {
    setService({ ...newApService });
    setPopupOpen(true);
  };

  const handleSave = () => {
    setPopupOpen(false);
    saveService(service).unwrap();
  };

  

  useEffect(() => {
    if (saveServiceMutation.data) {
      setListRequest({ ...listRequest, timestamp: new Date().getTime() });
    }
  }, [saveServiceMutation.data]);

  useEffect(() => {
    if (recordOfFilter['filter']) {
      handleFilterChange(recordOfFilter['filter'], recordOfFilter['value']);
    } else {
      setListRequest({
        ...initialListRequest,
        pageSize: listRequest.pageSize,
        pageNumber: 1
      });
    }
  }, [recordOfFilter]);

  useEffect(() => {
    if (linkCdtServiceMutation.data) {
      // add the new linked procedure to selected action procedure list
      let currentProcedureList = [...service['linkedProcedures']];
      currentProcedureList.push(linkCdtServiceMutation.data);
      let clone = { ...service };
      clone['linkedProcedures'] = currentProcedureList;
      setService({ ...clone });
    }
  }, [linkCdtServiceMutation.data]);

  useEffect(() => {
    if (unlinkCdtServiceMutation.data) {
      // remove the unlinked procedure from selected action procedure list
      const cdtKeyToRemove = unlinkCdtServiceMutation.data.cdtKey;
      // Filter out the procedure with the matching cdtKey
      const updatedProcedureList = service['linkedProcedures'].filter(
        procedure => procedure.cdtKey !== cdtKeyToRemove
      );
      let clone = { ...service };
      clone['linkedProcedures'] = updatedProcedureList;
      setService({ ...clone });
    }
  }, [unlinkCdtServiceMutation.data]);

  const isSelected = rowData => {
    if (rowData && service && rowData.key === service.key) {
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
  useEffect(() => {
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent('  '));
    };
  }, [location.pathname, dispatch]);
  return (
    <Panel>
      <ButtonToolbar>
        <IconButton appearance="primary" icon={<AddOutlineIcon />} onClick={handleNew}>
          Add New
        </IconButton>
        <IconButton
          disabled={!service.key}
          appearance="primary"
          onClick={() => setPopupOpen(true)}
          color="green"
          icon={<EditIcon />}
        >
          Edit Selected
        </IconButton>
        <IconButton
          disabled={true || !service.key}
          appearance="primary"
          color="red"
          icon={<TrashIcon />}
        >
          Delete Selected
        </IconButton>
        <IconButton
          disabled={!service.key}
          appearance="primary"
          onClick={() => setProceduresOpen(true)}
          color="cyan"
          icon={<EditIcon />}
        >
          Linked Procedures
        </IconButton>
      </ButtonToolbar>
      <hr />
      <MyTable
        height={450}
        data={serviceListResponse?.object ?? []}
        loading={isFetching}
        columns={tableColumns}
        rowClassName={isSelected}
        filters={filters()}
        onRowClick={rowData => {
          setService(rowData);
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
      {/* <Table
        height={550}
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
        data={serviceListResponse?.object ?? []}
        onRowClick={rowData => {
          setService(rowData);
        }}
        rowClassName={isSelected}
      >
        <Column sortable flexGrow={2}>
          <HeaderCell align="center">
            <Input onChange={e => handleFilterChange('typeLkey', e)} />
            <Translate>Type</Translate>
          </HeaderCell>
          <Cell>
            {rowData => (rowData.typeLvalue ? rowData.typeLvalue.lovDisplayVale : rowData.typeLkey)}
          </Cell>
        </Column>
        <Column sortable flexGrow={2}>
          <HeaderCell align="center">
            <Input onChange={e => handleFilterChange('name', e)} />
            <Translate>Service Name</Translate>
          </HeaderCell>
          <Cell dataKey="name" />
        </Column>
        <Column sortable flexGrow={2}>
          <HeaderCell align="center">
            <Input onChange={e => handleFilterChange('abbreviation', e)} />
            <Translate>Abbreviation</Translate>
          </HeaderCell>
          <Cell dataKey="abbreviation" />
        </Column>
        <Column sortable flexGrow={1}>
          <HeaderCell align="center">
            <Input onChange={e => handleFilterChange('code', e)} />
            <Translate>Code</Translate>
          </HeaderCell>
          <Cell dataKey="code" />
        </Column>
        <Column sortable flexGrow={2}>
          <HeaderCell align="center">
            <Input onChange={e => handleFilterChange('categoryLkey', e)} />
            <Translate>Category</Translate>
          </HeaderCell>
          <Cell>
            {rowData =>
              rowData.categoryLvalue ? rowData.categoryLvalue.lovDisplayVale : rowData.categoryLkey
            }
          </Cell>
        </Column>
        <Column sortable flexGrow={1}>
          <HeaderCell align="center">
            <Input onChange={e => handleFilterChange('price', e)} />
            <Translate>Price</Translate>
          </HeaderCell>
          <Cell dataKey="price" />
        </Column>
        <Column sortable flexGrow={1}>
          <HeaderCell align="center">
            <Input onChange={e => handleFilterChange('currencyLkey', e)} />
            <Translate>Currency</Translate>
          </HeaderCell>
          <Cell>
            {rowData =>
              rowData.currencyLvalue ? rowData.currencyLvalue.lovDisplayVale : rowData.currencyLkey
            }
          </Cell>
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
          total={serviceListResponse?.extraNumeric ?? 0}
        />
      </div> */}
      <AddEditService
        open={popupOpen}
        setOpen={setPopupOpen}
        width={width}
        service={service}
        setService={setService}
        handleSave={handleSave}
      />
       <DeletionConfirmationModal
              open={openConfirmDeleteService}
              setOpen={setOpenConfirmDeleteService}
              itemToDelete="Vaccine"
              actionButtonFunction={handleDeactiveReactivateVaccine}
              actionType={stateOfDeleteService}
            />
      {/* <Modal open={popupOpen} overflow>
        <Modal.Title>
          <Translate>New/Edit Service</Translate>
        </Modal.Title>
        <Modal.Body>
          <Form fluid>
            <MyInput
              fieldName="typeLkey"
              fieldType="select"
              selectData={serviceTypeLovQueryResponse?.object ?? []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              record={service}
              setRecord={setService}
            />
            <MyInput fieldName="name" record={service} setRecord={setService} />
            <MyInput fieldName="abbreviation" record={service} setRecord={setService} />
            <MyInput fieldName="code" record={service} setRecord={setService} />
            <MyInput
              fieldName="categoryLkey"
              fieldType="select"
              selectData={serviceCategoryLovQueryResponse?.object ?? []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              record={service}
              setRecord={setService}
            />
            <MyInput fieldName="price" fieldType="number" record={service} setRecord={setService} />
            <MyInput
              fieldName="currencyLkey"
              fieldType="select"
              selectData={currencyLovQueryResponse?.object ?? []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              record={service}
              setRecord={setService}
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
      </Modal> */}

      <Drawer
        size="lg"
        onEsc={() => setProceduresOpen(false)}
        onClose={() => setProceduresOpen(false)}
        open={proceduresOpen}
      >
        <Drawer.Header>
          <Translate>Service Linked Procedures</Translate>
        </Drawer.Header>
        <Drawer.Body>
          <Stack justifyContent={'space-between'} style={{ marginBottom: '10px' }}>
            <Stack.Item>
              <SelectPicker
                placeholder="Select Procedure"
                data={cdtListResponse?.object ?? []}
                labelKey={'description'}
                valueKey="key"
                style={{ width: '300px' }}
                value={selectedCdtKey}
                onChange={e => {
                  if (e) setSelectedCdtKey(e);
                  else setSelectedCdtKey('');
                }}
              />
            </Stack.Item>
            <Stack.Item>
              <IconButton
                appearance="primary"
                icon={<Check />}
                onClick={() => {
                  linkCdtService({
                    ...newApServiceCdt,
                    serviceKey: service.key,
                    cdtKey: selectedCdtKey
                  }).unwrap();
                }}
              >
                Link CDT Procedure to Service
              </IconButton>
            </Stack.Item>
          </Stack>

          <Table
            height={550}
            headerHeight={80}
            rowHeight={60}
            bordered
            cellBordered
            data={service['linkedProcedures']}
          >
            <Column sortable flexGrow={2}>
              <HeaderCell align="center">
                <Translate>Procedure Key</Translate>
              </HeaderCell>
              <Cell>{rowData => rowData.cdtKey}</Cell>
            </Column>
            <Column sortable flexGrow={5}>
              <HeaderCell align="center">
                <Translate>Description</Translate>
              </HeaderCell>
              <Cell>
                {rowData =>
                  cdtMap[rowData.cdtKey] ? cdtMap[rowData.cdtKey] : 'Error fetching description'
                }
              </Cell>
            </Column>
            <Column sortable flexGrow={1}>
              <HeaderCell align="center">
                <Translate>Remove</Translate>
              </HeaderCell>
              <Cell>
                {rowData => (
                  <IconButton
                    onClick={() => {
                      unlinkCdtService({
                        ...newApServiceCdt,
                        serviceKey: rowData.serviceKey,
                        cdtKey: rowData.cdtKey
                      }).unwrap();
                    }}
                    color="red"
                    appearance="ghost"
                    icon={<Trash />}
                  />
                )}
              </Cell>
            </Column>
          </Table>
        </Drawer.Body>
      </Drawer>
    </Panel>
  );
};

export default ServiceSetup;
