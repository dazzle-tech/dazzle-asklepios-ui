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
import { useAppDispatch } from '@/hooks';
const DentalActions = () => {
  const dispatch = useAppDispatch();
  const [dentalAction, setDentalAction] = useState<ApDentalAction>({ ...newApDentalAction });
  const [popupOpen, setPopupOpen] = useState(false);
  const [proceduresOpen, setProceduresOpen] = useState(false);
  const [cdtMap, setCdtMap] = useState({});
  const [selectedCdtKey, setSelectedCdtKey] = useState('');
  const [listRequest, setListRequest] = useState<ListRequest>({
    ...initialListRequest,
    pageSize: 15
  });

  const [saveDentalAction, saveDentalActionMutation] = useSaveDentalActionMutation();
  const [linkCdtAction, linkCdtActionMutation] = useLinkCdtActionMutation();
  const [unlinkCdtAction, unlinkCdtActionMutation] = useUnlinkCdtActionMutation();
  const { data: dentalActionListResponse } = useGetDentalActionsQuery(listRequest);
  const { data: cdtListResponse } = useGetCdtsQuery({
    ...initialListRequest,
    pageSize: 1000,
    skipDetails: true
  });
  const divElement = useSelector((state: RootState) => state.div?.divElement);
  const divContent = (
    <div style={{ display: 'flex' }}>
      <h5>Dental Actions</h5>
    </div>
  );
  const divContentHTML = ReactDOMServer.renderToStaticMarkup(divContent);
  dispatch(setPageCode('Dental_Actions'));
  dispatch(setDivContent(divContentHTML));
  useEffect(() => {
    // fill cdt procedure objects in a map with key as item key
    let map = {};
    for (const cdt of cdtListResponse?.object ?? []) {
      map[cdt.key] = cdt;
    }
    setCdtMap(map);
  }, [cdtListResponse]);

  const handleNew = () => {
    setDentalAction({ ...newApDentalAction });
    setPopupOpen(true);
  };

  const handleSave = () => {
    setPopupOpen(false);
    saveDentalAction(dentalAction).unwrap();
  };

  useEffect(() => {
    if (saveDentalActionMutation.data) {
      setListRequest({ ...listRequest, timestamp: new Date().getTime() });
    }
  }, [saveDentalActionMutation.data]);

  useEffect(() => {
    if (linkCdtActionMutation.data) {
      // add the new linked procedure to selected action procedure list
      let currentProcedureList = [...dentalAction['linkedProcedures']];
      currentProcedureList.push(linkCdtActionMutation.data);
      let clone = { ...dentalAction };
      clone['linkedProcedures'] = currentProcedureList;
      setDentalAction({ ...clone });
    }
  }, [linkCdtActionMutation.data]);

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
      dispatch(setDivContent("  "));
    };
  }, [location.pathname, dispatch]);
  return (
    <Panel>
      <ButtonToolbar>
        <IconButton appearance="primary" icon={<AddOutlineIcon />} onClick={handleNew}>
          Add New
        </IconButton>
        <IconButton
          disabled={!dentalAction.key}
          appearance="primary"
          onClick={() => setPopupOpen(true)}
          color="green"
          icon={<EditIcon />}
        >
          Edit Selected
        </IconButton>
        <IconButton
          disabled={true || !dentalAction.key}
          appearance="primary"
          color="red"
          icon={<TrashIcon />}
        >
          Delete Selected
        </IconButton>
        <IconButton
          disabled={!dentalAction.key || dentalAction.type !== 'treatment'}
          appearance="primary"
          onClick={() => setProceduresOpen(true)}
          color="cyan"
          icon={<EditIcon />}
        >
          Linked Procedures
        </IconButton>
      </ButtonToolbar>
      <hr />
      <Table
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
          total={dentalActionListResponse?.extraNumeric ?? 0}
        />
      </div>

      <Modal open={popupOpen} overflow>
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
      </Modal>

      <Drawer
        size="lg"
        onEsc={() => setProceduresOpen(false)} 
        onClose={() => setProceduresOpen(false)}
        open={proceduresOpen}
      >
        <Drawer.Header>
          <Translate>Treatment Linked Procedures</Translate>
        </Drawer.Header>
        <Drawer.Body>
          <Stack justifyContent={'space-between'} style={{ marginBottom: '10px' }}>
            <Stack.Item>
              <SelectPicker
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
              />
            </Stack.Item>
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
          </Stack>

          <Table
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
          </Table>
        </Drawer.Body>
      </Drawer>
    </Panel>
  );
};

export default DentalActions;
