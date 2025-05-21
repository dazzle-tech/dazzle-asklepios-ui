import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState, useEffect } from 'react';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import { Form, Input, Modal, Pagination, Panel, Table } from 'rsuite';
const { Column, HeaderCell, Cell } = Table;
import { MdModeEdit } from 'react-icons/md';
import { FaUndo } from 'react-icons/fa';
import { MdDelete } from 'react-icons/md';
import {
  useRemoveGenericMedicationMutation,
  useGetGenericMedicationQuery
} from '@/services/medicationsSetupService';
import { ButtonToolbar, IconButton, Carousel } from 'rsuite';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import EditIcon from '@rsuite/icons/Edit';
import TrashIcon from '@rsuite/icons/Trash';
import { ApGenericMedication } from '@/types/model-types';
import { newApGenericMedication } from '@/types/model-types-constructor';
import {
  addFilterToListRequest,
  conjureValueBasedOnKeyFromList,
  fromCamelCaseToDBName
} from '@/utils';
import NewEditGenericMedication from './NewEditGenericMedication';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import ReactDOMServer from 'react-dom/server';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import MyTable from '@/components/MyTable';
import MyInput from '@/components/MyInput';
const GenericMedications = () => {
  const dispatch = useAppDispatch();
  const [genericMedication, setGenericMedication] = useState<ApGenericMedication>({
    ...newApGenericMedication
  });
  const [listRequest, setListRequest] = useState<ListRequest>({ ...initialListRequest });
  const {
    data: genericMedicationListResponse,
    refetch: genericMedicationRefetch,
    isFetching
  } = useGetGenericMedicationQuery(listRequest);
  const [removeGenericMedication, removeGenericMedicationMutation] =
    useRemoveGenericMedicationMutation();
  const [carouselActiveIndex, setCarouselActiveIndex] = useState(0);
  const { data: medRoutLovQueryResponse } = useGetLovValuesByCodeQuery('MED_ROA');
  const divElement = useSelector((state: RootState) => state.div?.divElement);
  const divContent = (
    <div style={{ display: 'flex' }}>
      <h5>Brand Medications List</h5>
    </div>
  );
  const divContentHTML = ReactDOMServer.renderToStaticMarkup(divContent);
  dispatch(setPageCode('Brand_Medications'));
  dispatch(setDivContent(divContentHTML));

  // Pagination values
  const pageIndex = listRequest.pageNumber - 1;
  const rowsPerPage = listRequest.pageSize;
  const totalCount = genericMedicationListResponse?.extraNumeric ?? 0;
  const [recordOfFilter, setRecordOfFilter] = useState({ filter: '', value: '' });
  // Available fields for filtering
  const filterFields = [
    { label: 'Code', value: 'code' },
    { label: 'Brand Name', value: 'genericName' },
    { label: 'Manufacturer', value: 'manufacturerLkey' },
    { label: 'Dosage Form', value: 'dosageFormLkey' },
    { label: 'Usage Instructions', value: 'usageInstructions' },
    { label: 'ROA', value: 'roaList' },
    { label: 'Expires After Opening', value: 'expiresAfterOpening' },
    { label: 'Single Patient Use', value: 'singlePatientUse' },
    { label: 'Status', value: 'deleted_at' }
  ];

  // to handle filter change
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

  const handleNew = () => {
    setGenericMedication({ ...newApGenericMedication });
    setCarouselActiveIndex(1);
  };

  const handleEdit = () => {
    setCarouselActiveIndex(1);
  };

  const handleDelete = () => {
    if (genericMedication.key) {
      removeGenericMedication({
        ...genericMedication
      }).unwrap();
      dispatch(notify('Brand Medication  DeactivateActivate Successfully'));
    }
  };

  const handleFilterChange = (fieldName, value) => {
    if (value) {
      setListRequest(
        addFilterToListRequest(
          fromCamelCaseToDBName(fieldName),
          'containsIgnoreCase',
          value,
          listRequest
        )
      );
    } else {
      setListRequest({ ...listRequest, filters: [] });
    }
  };

  const isSelected = rowData => {
    if (rowData && genericMedication && rowData.key === genericMedication.key) {
      return 'selected-row';
    } else return '';
  };

  useEffect(() => {
    if (removeGenericMedicationMutation.isSuccess) {
      setListRequest({
        ...listRequest,
        timestamp: new Date().getTime()
      });

      setGenericMedication({ ...newApGenericMedication });
    }
  }, [removeGenericMedicationMutation]);

  useEffect(() => {
    genericMedicationRefetch();
  }, [carouselActiveIndex]);
  useEffect(() => {
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent('  '));
    };
  }, [location.pathname, dispatch]);

  // Filter table
  const filters = () => (
    <Form layout="inline" fluid className="container-of-filter-fields-resources">
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
  // Icons column (Edite, reactive/Deactivate)
  const iconsForActions = (rowData: ApGenericMedication) => (
    <div className="container-of-icons-resources">
      {/* open edit brand when click on this icon */}
      <MdModeEdit
        className="icons-resources"
        title="Edit"
        size={24}
        fill="var(--primary-gray)"
        // onClick={() => setPopupOpen(true)}
      />
      {/* deactivate/activate  when click on one of these icon */}
      {!rowData?.deletedAt ? (
        <MdDelete
          className="icons-resources"
          title="Deactivate"
          size={24}
          fill="var(--primary-pink)"
          // onClick={() => {
          //   setStateOfDeleteUserModal('deactivate');
          //   setOpenConfirmDeleteUserModal(true);
          // }}
        />
      ) : (
        <FaUndo
          className="icons-resources"
          title="Activate"
          size={20}
          fill="var(--primary-gray)"
          // onClick={() => {
          //   setStateOfDeleteUserModal('reactivate');
          //   setOpenConfirmDeleteUserModal(true);
          // }}
        />
      )}
    </div>
  );

  //Table columns
  const tableColumns = [
    {
      key: 'code',
      title: <Translate>Code</Translate>,
      flexGrow: 4
    },
    {
      key: 'genericName',
      title: <Translate>Brand Name</Translate>,
      flexGrow: 4
    },
    {
      key: 'manufacturerLkey',
      title: <Translate>Manufacturer</Translate>,
      flexGrow: 4,
      render: rowData =>
        rowData.manufacturerLvalue
          ? rowData.manufacturerLvalue.lovDisplayVale
          : rowData.manufacturerLkey
    },
    {
      key: 'dosageFormLkey',
      title: <Translate>Dosage Form</Translate>,
      flexGrow: 4,
      render: rowData =>
        rowData.dosageFormLvalue ? rowData.dosageFormLvalue.lovDisplayVale : rowData.dosageFormLkey
    },
    {
      key: 'usageInstructions',
      title: <Translate>Usage Instructions</Translate>,
      flexGrow: 4
    },
    {
      key: 'roaList',
      title: <Translate>ROA</Translate>,
      flexGrow: 4,
      render: rowData =>
        rowData.roaList?.map((item, index) => {
          const value = conjureValueBasedOnKeyFromList(
            medRoutLovQueryResponse?.object ?? [],
            item,
            'lovDisplayVale'
          );
          return (
            <span key={index}>
              {value}
              {index < rowData.roaList.length - 1 && ', '}
            </span>
          );
        })
    },
    {
      key: 'expiresAfterOpening',
      title: <Translate>Expires After Opening</Translate>,
      flexGrow: 4,
      render: rowData => (rowData.expiresAfterOpening ? 'Yes' : 'No')
    },
    {
      key: 'singlePatientUse',
      title: <Translate>Single Patient Use</Translate>,
      flexGrow: 4,
      render: rowData => (rowData.singlePatientUse ? 'Yes' : 'No')
    },
    {
      key: 'deleted_at',
      title: <Translate>Status</Translate>,
      flexGrow: 4,
      render: rowData => (rowData.deletedAt === null ? 'Active' : 'InActive')
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
      flexGrow: 3,
      render: rowData => iconsForActions(rowData)
    }
  ];

  return (
    <Carousel
      style={{ height: 'auto', backgroundColor: 'var(--rs-body)' }}
      autoplay={false}
      activeIndex={carouselActiveIndex}
    >
      <Panel>
        <ButtonToolbar>
          <IconButton appearance="primary" icon={<AddOutlineIcon />} onClick={handleNew}>
            Add New
          </IconButton>
          <IconButton
            disabled={!genericMedication.key || genericMedication.deletedAt !== null}
            appearance="primary"
            color="green"
            onClick={handleEdit}
            icon={<EditIcon />}
          >
            Edit Selected
          </IconButton>
          <IconButton
            disabled={!genericMedication.key}
            appearance="primary"
            color="red"
            onClick={handleDelete}
            icon={<TrashIcon />}
          >
            Deactivate\Activate Selected
          </IconButton>
        </ButtonToolbar>
        <hr />
        <MyTable
          height={450}
          data={genericMedicationListResponse?.object ?? []}
          loading={isFetching}
          columns={tableColumns}
          rowClassName={isSelected}
          filters={filters()}
          onRowClick={rowData => {
            setGenericMedication(rowData);
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
          data={genericMedicationListResponse?.object ?? []}
          onRowClick={rowData => {
            setGenericMedication(rowData);
          }}
          rowClassName={isSelected}
        >
              <Column sortable flexGrow={2}>
            <HeaderCell align="center">
              <Input onChange={e => handleFilterChange('code', e)} />
              <Translate>Code </Translate>
            </HeaderCell>
            <Cell dataKey="code" />
          </Column>
          <Column sortable flexGrow={2}>
            <HeaderCell align="center">
              <Input onChange={e => handleFilterChange('genericName', e)} />
              <Translate>Brand Name </Translate>
            </HeaderCell>
            <Cell dataKey="genericName" />
          </Column>
          <Column sortable flexGrow={2}>
            <HeaderCell  align="center">
              <Input onChange={e => handleFilterChange('manufacturerLkey', e)} />
              <Translate>Manufacturer</Translate>
            </HeaderCell>
            <Cell dataKey="manufacturerLkey">
            {rowData =>
                rowData.manufacturerLvalue ? rowData.manufacturerLvalue.lovDisplayVale : rowData.manufacturerLkey
              }
            </Cell>
          </Column> 
          <Column sortable flexGrow={2} fullText>
            <HeaderCell  align="center">
              <Input onChange={e => handleFilterChange('dosageFormLkey', e)} />
              <Translate>Dosage Form</Translate>
            </HeaderCell>
            <Cell>
              {rowData =>
                rowData.dosageFormLvalue ? rowData.dosageFormLvalue.lovDisplayVale : rowData.dosageFormLkey
              }
            </Cell>
          </Column>
         
          <Column sortable flexGrow={3} fullText>
            <HeaderCell  align="center">
              <Input onChange={e => handleFilterChange('usageInstructions', e)} />
              <Translate>Usage Instructions</Translate>
            </HeaderCell>
            <Cell dataKey="usageInstructions" />
          </Column> 
          <Column sortable flexGrow={2} fixed fullText>
            <HeaderCell  align="center">
               <Input onChange={e => handleFilterChange('roaList', e)} /> 
              <Translate>ROA</Translate>
            </HeaderCell>
            <Cell>
              {rowData => rowData.roaList?.map((item, index) => {
                const value = conjureValueBasedOnKeyFromList(
                  medRoutLovQueryResponse?.object ?? [],
                  item,
                  'lovDisplayVale'
                );
                return (
                  <span key={index}>
                    {value}
                    {index < rowData.roaList.length - 1 && ', '}
                  </span>
                );
              })}
            </Cell>
          </Column> 
          <Column sortable flexGrow={2}>
            <HeaderCell  align="center">
              <Input onChange={e => handleFilterChange('expiresAfterOpening', e)} />
              <Translate>Expires After Opening</Translate>
            </HeaderCell>
            <Cell>
            {rowData =>
              rowData.expiresAfterOpening ? 'Yes' : 'No'
            }
            </Cell>
          </Column>
          <Column sortable flexGrow={3}>
            <HeaderCell  align="center">
              <Input onChange={e => handleFilterChange('singlePatientUse', e)} />
              <Translate>Single Patient Use</Translate>
            </HeaderCell>
            <Cell>
            {rowData =>
              rowData.singlePatientUse ? 'Yes' : 'No'
            }
            </Cell>
          </Column>
          <Column sortable flexGrow={1}>
            <HeaderCell  align="center">
              <Input onChange={e => handleFilterChange('deleted_at', e)} />
              <Translate>Status</Translate>
            </HeaderCell>
            <Cell>
            {rowData =>
              rowData.deletedAt === null  ? 'Active' : 'InActive' 
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
            total={genericMedicationListResponse?.extraNumeric ?? 0}
          />
        </div> */}

        {/* <Panel
          bordered
          header={
            <h5 className="title">
              <Translate>Details</Translate>
            </h5>
          }
        > */}

        {/* <Tabs>
            <TabList>
              <Tab>Details</Tab>
              <Tab>Active Ingredient</Tab>
              <Tab>Unit of Measurments</Tab>
              <Tab>Price</Tab>
              <Tab>Insurance</Tab>
            </TabList>

            <TabPanel> 
            <Form layout="inline" fluid>
                <MyInput
                  column
                  fieldLabel="Rout of Admin"
                  fieldType="select"
                  fieldName="maritalStatusLkey"
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={localPatient}
                />
                <MyInput
                  column
                  fieldLabel="Usage Instruction"
                  fieldType="select"
                  fieldName="nationalityLkey"
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={localPatient}
                />
                <MyInput
                  column
                  fieldLabel="Storge Req."
                  fieldType="select"
                  fieldName="primaryLanguageLkey"
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={localPatient}
                />
                <MyInput
                  column
                  fieldLabel="Single Use"
                  fieldType="check"
                  fieldName="religionLkey"
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={localPatient}
                />
                <MyInput
                  column
                  fieldLabel="Ethnicity"
                  fieldType="check"
                  fieldName="ethnicityLkey"
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={localPatient}
                />
              </Form>
               </TabPanel>
            <TabPanel> 
            <Table
                bordered
                rowClassName={isSelected}
                headerHeight={50}
                rowHeight={60}
              >
                <Table.Column flexGrow={1}>
                  <Table.HeaderCell>Active Ingredient Name</Table.HeaderCell>
                  <Table.Cell>
                  </Table.Cell>
                </Table.Column>
                <Table.Column flexGrow={1}>
                  <Table.HeaderCell>strength & unit</Table.HeaderCell>
                  <Table.Cell></Table.Cell>
                </Table.Column>
              </Table>
               </TabPanel>
            <TabPanel>
            <Table
                bordered
                rowClassName={isSelected}
                headerHeight={50}
                rowHeight={60}
              >
                <Table.Column flexGrow={1}>
                  <Table.HeaderCell>Unit of Measurement</Table.HeaderCell>
                  <Table.Cell>
                  </Table.Cell>
                </Table.Column>
                <Table.Column flexGrow={1}>
                  <Table.HeaderCell>Unit Orders</Table.HeaderCell>
                  <Table.Cell></Table.Cell>
                </Table.Column>
                <Table.Column flexGrow={1}>
                  <Table.HeaderCell>Selling Default Unit</Table.HeaderCell>
                  <Table.Cell></Table.Cell>
                </Table.Column>
                <Table.Column flexGrow={1}>
                  <Table.HeaderCell>Base Unit Price</Table.HeaderCell>
                  <Table.Cell></Table.Cell>
                </Table.Column>
                <Table.Column flexGrow={1}>
                  <Table.HeaderCell>Stock Default Unit</Table.HeaderCell>
                  <Table.Cell></Table.Cell>
                </Table.Column>
              </Table>
            </TabPanel>
            <TabPanel>
              <Table
                bordered
                rowClassName={isSelected}
                headerHeight={50}
                rowHeight={60}
              >
                <Table.Column flexGrow={1}>
                  <Table.HeaderCell>Cost</Table.HeaderCell>
                  <Table.Cell>
                  </Table.Cell>
                </Table.Column>
                <Table.Column flexGrow={1}>
                  <Table.HeaderCell>Price</Table.HeaderCell>
                  <Table.Cell></Table.Cell>
                </Table.Column>
              </Table>
              </TabPanel>
            <TabPanel>
            <Table
                bordered
                rowClassName={isSelected}
                headerHeight={50}
                rowHeight={60}
              >
                <Table.Column flexGrow={1}>
                  <Table.HeaderCell>Insurance</Table.HeaderCell>
                  <Table.Cell>
                  </Table.Cell>
                </Table.Column>
                <Table.Column flexGrow={1}>
                  <Table.HeaderCell>Plan</Table.HeaderCell>
                  <Table.Cell></Table.Cell>
                </Table.Column>
                <Table.Column flexGrow={1}>
                  <Table.HeaderCell>Coverage</Table.HeaderCell>
                  <Table.Cell></Table.Cell>
                </Table.Column>
              </Table>
            </TabPanel>
          </Tabs>  */}
        {/* </Panel> */}
      </Panel>
      <NewEditGenericMedication
        selectedGenericMedication={genericMedication}
        goBack={() => {
          setCarouselActiveIndex(0);
        }}
      />
    </Carousel>
  );
};

export default GenericMedications;
