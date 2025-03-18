import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState, useEffect } from 'react';
import { Drawer, Input, List, Modal, Pagination, Panel, SelectPicker, Table } from 'rsuite';
const { Column, HeaderCell, Cell } = Table;
import {
  useGetFacilitiesQuery,
  useGetCdtsQuery,
  useSaveCdtMutation,
  useGetLovValuesByCodeQuery,
  useGetServicesQuery,
  useLinkCdtServiceMutation,
  useUnlinkCdtServiceMutation
} from '@/services/setupService';
import { Button, ButtonToolbar, IconButton } from 'rsuite';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import EditIcon from '@rsuite/icons/Edit';
import TrashIcon from '@rsuite/icons/Trash';
import { ApCdt } from '@/types/model-types';
import { newApCdt, newApServiceCdt } from '@/types/model-types-constructor';
import { Form, Stack, Divider } from 'rsuite';
import MyInput from '@/components/MyInput';
import { addFilterToListRequest, fromCamelCaseToDBName } from '@/utils';
import { BlockUI } from 'primereact/blockui';
import { Check, Trash } from '@rsuite/icons';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import ReactDOMServer from 'react-dom/server';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useAppDispatch } from '@/hooks';
const CDTSetup = () => {
  const dispatch = useAppDispatch();
  const [cdt, setCdt] = useState<ApCdt>({ ...newApCdt });
  const [selectedServiceKey, setSelectedServiceKey] = useState('');
  const [popupOpen, setPopupOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [serviceMap, setServiceMap] = useState({});
  const [listRequest, setListRequest] = useState<ListRequest>({
    ...initialListRequest,
    pageSize: 15
  });

  const [saveCdt, saveCdtMutation] = useSaveCdtMutation();
  const [linkCdtService, linkCdtServiceMutation] = useLinkCdtServiceMutation();
  const [unlinkCdtService, unlinkCdtServiceMutation] = useUnlinkCdtServiceMutation();

  const { data: cdtListResponse, isFetching: cdtListResponseLoading } =
    useGetCdtsQuery(listRequest);

  const { data: serviceListResponse } = useGetServicesQuery({
    ...initialListRequest,
    pageSize: 1000,
    skipDetails: true
  });

  const { data: cdtTypeLovQueryResponse } = useGetLovValuesByCodeQuery('CDT_TYPE');
  const { data: cdtClassLovQueryResponse } = useGetLovValuesByCodeQuery('CDT_CLASS');
  const divElement = useSelector((state: RootState) => state.div?.divElement);
  const divContent = (
    <div style={{ display: 'flex' }}>
      <h5>CDT Codes</h5>
    </div>
  );
  const divContentHTML = ReactDOMServer.renderToStaticMarkup(divContent);
  dispatch(setPageCode('CDT_Codes'));
  dispatch(setDivContent(divContentHTML));
  const handleNew = () => {
    setCdt({ ...newApCdt });
    setPopupOpen(true);
  };

  const handleSave = () => {
    setPopupOpen(false);
    saveCdt(cdt).unwrap();
  };

  useEffect(() => {
    if (saveCdtMutation.data) {
      setListRequest({ ...listRequest, timestamp: new Date().getTime() });
    }
  }, [saveCdtMutation.data]);

  useEffect(() => {
    if (serviceListResponse && serviceListResponse.object) {
      let map = {};
      serviceListResponse.object.forEach(item => {
        map[item.key] = item.name;
      });
      setServiceMap(map);
    }
  }, serviceListResponse);

  useEffect(() => {
    if (linkCdtServiceMutation.data) {
      // add the new linked service to selected cdt service list
      let currentServiceList = [...cdt['linkedServices']];
      currentServiceList.push(linkCdtServiceMutation.data);
      let clone = { ...cdt };
      clone['linkedServices'] = currentServiceList;
      setCdt({ ...clone });
    }
  }, [linkCdtServiceMutation.data]);

  useEffect(() => {
    if (unlinkCdtServiceMutation.data) {
      // remove the unlinked services from selected procedure
      const serviceKeyToRemove = unlinkCdtServiceMutation.data.serviceKey;
      // Filter out the service with the matching serviceKey
      const updatedServiceList = cdt['linkedServices'].filter(
        service => service.serviceKey !== serviceKeyToRemove
      );
      let clone = { ...cdt };
      clone['linkedServices'] = updatedServiceList;
      setCdt({ ...clone });
    }
  }, [unlinkCdtServiceMutation.data]);

  const isSelected = rowData => {
    if (rowData && cdt && rowData.key === cdt.key) {
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
  }, [location.pathname, dispatch])
  return (
    <Panel
    >
      <ButtonToolbar>
        <IconButton appearance="primary" icon={<AddOutlineIcon />} onClick={handleNew}>
          Add New
        </IconButton>
        <IconButton
          disabled={!cdt.key}
          appearance="primary"
          onClick={() => setPopupOpen(true)}
          color="green"
          icon={<EditIcon />}
        >
          Edit Selected
        </IconButton>
        <IconButton
          disabled={true || !cdt.key}
          appearance="primary"
          color="red"
          icon={<TrashIcon />}
        >
          Delete Selected
        </IconButton>
        <IconButton
          disabled={!cdt.key}
          appearance="primary"
          onClick={() => setServicesOpen(true)}
          color="cyan"
          icon={<EditIcon />}
        >
          Linked Services
        </IconButton>
      </ButtonToolbar>
      <hr />
      <BlockUI
        template={
          <h3 style={{ textAlign: 'center', color: 'white', top: '10%', position: 'absolute' }}>
            <Translate>Loading...</Translate>
          </h3>
        }
        blocked={cdtListResponseLoading}
      >
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
          data={cdtListResponse?.object ?? []}
          onRowClick={rowData => {
            setCdt(rowData);
          }}
          rowClassName={isSelected}
        >
      
          <Column sortable flexGrow={1}>
            <HeaderCell align="center">
              <Input onChange={e => handleFilterChange('cdtCode', e)} />
              <Translate>Code</Translate>
            </HeaderCell>
            <Cell dataKey="cdtCode" />
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
              <Input onChange={e => handleFilterChange('classLkey', e)} />
              <Translate>Class</Translate>
            </HeaderCell>
            <Cell>
              {rowData =>
                rowData.classLvalue ? rowData.classLvalue.lovDisplayVale : rowData.classLkey
              }
            </Cell>
          </Column>
        </Table>
      </BlockUI>
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
          total={cdtListResponse?.extraNumeric ?? 0}
        />
      </div>

      <Modal open={popupOpen} overflow>
        <Modal.Title>
          <Translate>New/Edit Cdt</Translate>
        </Modal.Title>
        <Modal.Body>
          <Form fluid>
            <MyInput
              fieldName="typeLkey"
              fieldType="select"
              selectData={cdtTypeLovQueryResponse?.object ?? []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              record={cdt}
              setRecord={setCdt}
            />
            <MyInput fieldLabel="CDT Code" fieldName="cdtCode" record={cdt} setRecord={setCdt} />
            <MyInput fieldType="textarea" fieldName="description" record={cdt} setRecord={setCdt} />
            <MyInput
              fieldName="classLkey"
              fieldType="select"
              selectData={cdtClassLovQueryResponse?.object ?? []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              record={cdt}
              setRecord={setCdt}
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
      </Modal>

      <Drawer
        size="lg"
        onEsc={() => setServicesOpen(false)}
        onClose={() => setServicesOpen(false)}
        open={servicesOpen}
      >
        <Drawer.Header>
          <Translate>CDT Linked Services</Translate>
        </Drawer.Header>
        <Drawer.Body>
          <Stack justifyContent={'space-between'} style={{ marginBottom: '10px' }}>
            <Stack.Item>
              <SelectPicker
                placeholder="Select Service"
                data={serviceListResponse?.object ?? []}
                labelKey={'name'}
                valueKey="key"
                style={{ width: '300px' }}
                value={selectedServiceKey}
                onChange={e => {
                  if (e) setSelectedServiceKey(e);
                  else setSelectedServiceKey('');
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
                    serviceKey: selectedServiceKey,
                    cdtKey: cdt.key
                  }).unwrap();
                }}
              >
                Link Service to CDT Procedure
              </IconButton>
            </Stack.Item>
          </Stack>

          <Table
            height={550}
            headerHeight={80}
            rowHeight={60}
            bordered
            cellBordered
            data={cdt['linkedServices']}
          >
            <Column sortable flexGrow={2}>
              <HeaderCell align="center">
                <Translate>Service Key</Translate>
              </HeaderCell>
              <Cell>{rowData => rowData.serviceKey}</Cell>
            </Column>
            <Column sortable flexGrow={5}>
              <HeaderCell align="center">
                <Translate>Service Name</Translate>
              </HeaderCell>
              <Cell>
                {rowData =>
                  serviceMap[rowData.serviceKey]
                    ? serviceMap[rowData.serviceKey]
                    : 'Error fetching name'
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

export default CDTSetup;
