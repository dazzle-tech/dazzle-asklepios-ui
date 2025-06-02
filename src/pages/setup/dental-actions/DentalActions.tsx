import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState, useEffect } from 'react';
import { Drawer, Input, Modal, Pagination, Panel, SelectPicker, Table } from 'rsuite';
const { Column, HeaderCell, Cell } = Table;
import {
  useGetDentalActionsQuery,
  useSaveDentalActionMutation,
  useGetCdtsQuery,
  useLinkCdtActionMutation,
  useUnlinkCdtActionMutation
} from '@/services/setupService';
import { Button, ButtonToolbar, IconButton } from 'rsuite';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import EditIcon from '@rsuite/icons/Edit';
import TrashIcon from '@rsuite/icons/Trash';
import { ApDentalAction } from '@/types/model-types';
import { newApCdtDentalAction, newApDentalAction } from '@/types/model-types-constructor';
import { Form, Stack, Divider } from 'rsuite';
import MyInput from '@/components/MyInput';
import { addFilterToListRequest, fromCamelCaseToDBName } from '@/utils';
import { Check, Trash } from '@rsuite/icons';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import ReactDOMServer from 'react-dom/server';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { IoSettingsSharp } from 'react-icons/io5';
import { PiToothFill } from 'react-icons/pi';
import { MdModeEdit } from 'react-icons/md';
import { FaUndo } from 'react-icons/fa';
import { MdDelete } from 'react-icons/md';
import { useAppDispatch } from '@/hooks';
import { hideSystemLoader, showSystemLoader } from '@/utils/uiReducerActions';
import MyTable from '@/components/MyTable';
import AddEditDentalAction from './AddEditDentalAction';
import MyButton from '@/components/MyButton/MyButton';
import TreatmentLinkedProcedures from './TreatmentLinkedProcedures';
const DentalActions = () => {
  const dispatch = useAppDispatch();
  const [dentalAction, setDentalAction] = useState<ApDentalAction>({ ...newApDentalAction });
  const [popupOpen, setPopupOpen] = useState(false);
  const [proceduresOpen, setProceduresOpen] = useState(false);
  // const [cdtMap, setCdtMap] = useState({});
  // const [selectedCdtKey, setSelectedCdtKey] = useState('');
  const [listRequest, setListRequest] = useState<ListRequest>({
    ...initialListRequest,
    pageSize: 15
  });
  const [width, setWidth] = useState<number>(window.innerWidth);
  const [saveDentalAction, saveDentalActionMutation] = useSaveDentalActionMutation();
  // const [linkCdtAction, linkCdtActionMutation] = useLinkCdtActionMutation();
  const [unlinkCdtAction, unlinkCdtActionMutation] = useUnlinkCdtActionMutation();
  const {
    data: dentalActionListResponse,
    isLoading: isDentalActionLoading,
    isFetching: isDentalActionFetching
  } = useGetDentalActionsQuery(listRequest);
  // const { data: cdtListResponse } = useGetCdtsQuery({
  //   ...initialListRequest,
  //   pageSize: 1000,
  //   skipDetails: true
  // });

  // Pagination values
  const pageIndex = listRequest.pageNumber - 1;
  const rowsPerPage = listRequest.pageSize;
  const totalCount = dentalActionListResponse?.extraNumeric ?? 0;
  const [recordOfFilter, setRecordOfFilter] = useState({ filter: '', value: '' });
  // Available fields for filtering
  const filterFields = [
    { label: 'Key', value: 'key' },
    { label: 'Type', value: 'type' },
    { label: 'imageName', value: 'imageName' }
  ];
  const divElement = useSelector((state: RootState) => state.div?.divElement);
  const divContent = (
    <div style={{ display: 'flex' }}>
      <h5>Dental Actions</h5>
    </div>
  );
  const divContentHTML = ReactDOMServer.renderToStaticMarkup(divContent);
  dispatch(setPageCode('Dental_Actions'));
  dispatch(setDivContent(divContentHTML));
  // useEffect(() => {
  //   // fill cdt procedure objects in a map with key as item key
  //   let map = {};
  //   for (const cdt of cdtListResponse?.object ?? []) {
  //     map[cdt.key] = cdt;
  //   }
  //   setCdtMap(map);
  // }, [cdtListResponse]);

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
    setDentalAction({ ...newApDentalAction });
    setPopupOpen(true);
  };

  const handleSave = () => {
    setPopupOpen(false);
    saveDentalAction(dentalAction).unwrap();
  };

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (saveDentalActionMutation.data) {
      setListRequest({ ...listRequest, timestamp: new Date().getTime() });
    }
  }, [saveDentalActionMutation.data]);

  // useEffect(() => {
  //   if (linkCdtActionMutation.data) {
  //     // add the new linked procedure to selected action procedure list
  //     let currentProcedureList = [...dentalAction['linkedProcedures']];
  //     currentProcedureList.push(linkCdtActionMutation.data);
  //     let clone = { ...dentalAction };
  //     clone['linkedProcedures'] = currentProcedureList;
  //     setDentalAction({ ...clone });
  //   }
  // }, [linkCdtActionMutation.data]);

  useEffect(() => {
    if (unlinkCdtActionMutation.data) {
      // remove the unlinked procedure from selected action procedure list
      const cdtKeyToRemove = unlinkCdtActionMutation.data.cdtKey;
      // Filter out the procedure with the matching cdtKey
      const updatedProcedureList = dentalAction['linkedProcedures'].filter(
        procedure => procedure.cdtKey !== cdtKeyToRemove
      );
      let clone = { ...dentalAction };
      clone['linkedProcedures'] = updatedProcedureList;
      setDentalAction({ ...clone });
    }
  }, [unlinkCdtActionMutation.data]);

  const isSelected = rowData => {
    if (rowData && dentalAction && rowData.key === dentalAction.key) {
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
    if (isDentalActionLoading || isDentalActionFetching) {
      dispatch(showSystemLoader());
    } else {
      dispatch(hideSystemLoader());
    }
    return () => {
      dispatch(hideSystemLoader());
    };
  }, [isDentalActionLoading, isDentalActionFetching]);

  const iconsForActions = (rowData: ApDentalAction) => (
    <div className="container-of-icons-lov">
      <PiToothFill
        className="icons-lov"
        title="Setup Lov Values"
        size={24}
        fill="var(--primary-gray)"
        style={{
          cursor: !rowData.key || rowData.type !== 'treatment' ? 'not-allowed' : 'pointer',
          color: 'var(--primary-gray)'
        }}
        onClick={() => {
          if (!(!rowData.key || rowData.type !== 'treatment')) setProceduresOpen(true);
        }}
        // onClick={() => setCarouselActiveIndex(1)}
      />

      <MdModeEdit
        className="icons-lov"
        title="Edit"
        size={24}
        fill="var(--primary-gray)"
        onClick={() => setPopupOpen(true)}
      />
      {!rowData?.deletedAt ? (
        <MdDelete className="icons-lov" title="Deactivate" size={24} fill="var(--primary-pink)" />
      ) : (
        <FaUndo className="icons-lov" title="Activate" size={20} fill="var(--primary-gray)" />
      )}
    </div>
  );

  //Table columns
  const tableColumns = [
    {
      key: 'key',
      title: <Translate>Key</Translate>,
      flexGrow: 4
    },
    {
      key: 'description',
      title: <Translate>Description</Translate>,
      flexGrow: 4
    },
    {
      key: 'type',
      title: <Translate>Type</Translate>,
      flexGrow: 4
    },
    {
      key: 'imageName',
      title: <Translate>Image Name</Translate>,
      flexGrow: 4
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
    <Form layout="inline" fluid className="container-of-filter-fields-lov">
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

  return (
    <Panel>
      {/* <ButtonToolbar> */}
      {/* <IconButton appearance="primary" icon={<AddOutlineIcon />} onClick={handleNew}>
          Add New
        </IconButton> */}
      <div className="container-of-add-new-button-lov">
        <MyButton
          prefixIcon={() => <AddOutlineIcon />}
          color="var(--deep-blue)"
          onClick={handleNew}
          width="109px"
        >
          Add New
        </MyButton>
      </div>
      {/* <IconButton
          disabled={!dentalAction.key}
          appearance="primary"
          onClick={() => setPopupOpen(true)}
          color="green"
          icon={<EditIcon />}
        >
          Edit Selected
        </IconButton> */}
      {/* <IconButton
          disabled={true || !dentalAction.key}
          appearance="primary"
          color="red"
          icon={<TrashIcon />}
        >
          Delete Selected
        </IconButton> */}
      {/* <IconButton
          disabled={!dentalAction.key || dentalAction.type !== 'treatment'}
          appearance="primary"
          onClick={() => setProceduresOpen(true)}
          color="cyan"
          icon={<EditIcon />}
        >
          Linked Procedures
        </IconButton> */}
      {/* </ButtonToolbar> */}
      <MyTable
        height={450}
        data={dentalActionListResponse?.object ?? []}
        loading={isDentalActionFetching}
        columns={tableColumns}
        rowClassName={isSelected}
        filters={filters()}
        onRowClick={rowData => {
          setDentalAction(rowData);
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
        data={dentalActionListResponse?.object ?? []}
        onRowClick={rowData => {
          setDentalAction(rowData);
        }}
        rowClassName={isSelected}
      >
        <Column sortable flexGrow={1}>
          <HeaderCell align="center">
            <Input onChange={e => handleFilterChange('key', e)} />
            <Translate>Key</Translate>
          </HeaderCell>
          <Cell dataKey="key" />
        </Column>
        <Column sortable flexGrow={1}>
          <HeaderCell align="center">
            <Input onChange={e => handleFilterChange('description', e)} />
            <Translate>Description</Translate>
          </HeaderCell>
          <Cell dataKey="description" />
        </Column>
        <Column sortable flexGrow={1}>
          <HeaderCell align="center">
            <Input onChange={e => handleFilterChange('type', e)} />
            <Translate>Type</Translate>
          </HeaderCell>
          <Cell dataKey="type" />
        </Column>
        <Column sortable flexGrow={4}>
          <HeaderCell>
            <Input onChange={e => handleFilterChange('imageName', e)} />
            <Translate>Image Name</Translate>
          </HeaderCell>
          <Cell dataKey="imageName" />
        </Column>
      </Table> */}

      <AddEditDentalAction
        open={popupOpen}
        setOpen={setPopupOpen}
        dentalAction={dentalAction}
        setDentalAction={setDentalAction}
        handleSave={handleSave}
        width={width}
      />

      {/* <Modal open={popupOpen} overflow>
        <Modal.Title>
          <Translate>New/Edit DentalAction</Translate>
        </Modal.Title>
        <Modal.Body>
          <Form fluid>
            <MyInput fieldName="description" record={dentalAction} setRecord={setDentalAction} />
            <MyInput
              fieldName="type"
              fieldType="select"
              selectData={[
                { label: 'Treatment', value: 'treatment' },
                { label: 'Condition', value: 'condition' }
              ]}
              selectDataLabel="label"
              selectDataValue="value"
              record={dentalAction}
              setRecord={setDentalAction}
            />
            <MyInput fieldName="imageName" record={dentalAction} setRecord={setDentalAction} />
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

      <TreatmentLinkedProcedures 
       open={proceduresOpen}
       setOpen={setProceduresOpen}
       dentalAction={dentalAction}
       setDentalAction={setDentalAction}
      />
      {/* <Drawer
        size="lg"
        onEsc={() => setProceduresOpen(false)}
        onClose={() => setProceduresOpen(false)}
        open={proceduresOpen}
      > */}
        {/* <Drawer.Header>
          <Translate>Treatment Linked Procedures</Translate>
        </Drawer.Header>
        <Drawer.Body>
          <Stack justifyContent={'space-between'} style={{ marginBottom: '10px' }}>
            <Stack.Item> */}
              {/* <SelectPicker
                placeholder="Select Procedure"
                data={cdtListResponse?.object ?? []}
                renderMenuItem={(label, item) => {
                  return (
                    <div>
                      {item.key} / {item.description}
                    </div>
                  );
                }}
                labelKey={'description'}
                valueKey="key"
                style={{ width: '300px' }}
                value={selectedCdtKey}
                onChange={e => {
                  if (e) setSelectedCdtKey(e);
                  else setSelectedCdtKey('');
                }}
              /> */}
            {/* </Stack.Item>
            <Stack.Item>
              <IconButton
                appearance="primary"
                icon={<Check />}
                onClick={() => {
                  linkCdtAction({
                    ...newApCdtDentalAction,
                    dentalActionKey: dentalAction.key,
                    cdtKey: selectedCdtKey
                  }).unwrap();
                }}
              >
                Link CDT Procedure to Treatment
              </IconButton>
            </Stack.Item>
          </Stack> */}

          {/* <Table
            height={550}
            headerHeight={80}
            rowHeight={60}
            bordered
            cellBordered
            data={dentalAction['linkedProcedures']}
          >
            <Column sortable flexGrow={5}>
              <HeaderCell align="center">
                <Translate>CDT Key</Translate>
              </HeaderCell>
              <Cell>{rowData => rowData.cdtKey}</Cell>
            </Column>
            <Column sortable flexGrow={5}>
              <HeaderCell align="center">
                <Translate>Description</Translate>
              </HeaderCell>
              <Cell>{rowData => cdtMap[rowData.cdtKey].description}</Cell>
            </Column>
            <Column sortable flexGrow={1}>
              <HeaderCell align="center">
                <Translate>Remove</Translate>
              </HeaderCell>
              <Cell>
                {rowData => (
                  <IconButton
                    onClick={() => {
                      unlinkCdtAction({
                        ...newApCdtDentalAction,
                        dentalActionKey: rowData.dentalActionKey,
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
          </Table> */}
        {/* </Drawer.Body>
      </Drawer> */}
    </Panel>
  );
};

export default DentalActions;
