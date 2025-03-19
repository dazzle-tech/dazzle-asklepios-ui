import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState, useEffect } from 'react';
import { Input, Modal, Pagination, Panel, Table } from 'rsuite';
const { Column, HeaderCell, Cell } = Table;
import { useGetLovsQuery, useSaveLovMutation } from '@/services/setupService';
import { Button, ButtonToolbar, Carousel, IconButton } from 'rsuite';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import EditIcon from '@rsuite/icons/Edit';
import TrashIcon from '@rsuite/icons/Trash';
import ChangeListIcon from '@rsuite/icons/ChangeList';
import { ApLov } from '@/types/model-types';
import { newApLov } from '@/types/model-types-constructor';
import { Form, Stack, Divider } from 'rsuite';
import MyInput from '@/components/MyInput';
import LovValues from './LovValues';
import {
  addFilterToListRequest,
  conjureValueBasedOnKeyFromList,
  fromCamelCaseToDBName
} from '@/utils';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import ReactDOMServer from 'react-dom/server';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useAppDispatch } from '@/hooks';
const Lov = () => {
  const dispatch = useAppDispatch();

  const [lov, setLov] = useState<ApLov>({ ...newApLov });
  const [lovPopupOpen, setLovPopupOpen] = useState(false);
  const [carouselActiveIndex, setCarouselActiveIndex] = useState(0);

  const [listRequest, setListRequest] = useState<ListRequest>({ ...initialListRequest, pageSize: 100 });

  const [saveLov, saveLovMutation] = useSaveLovMutation();

  const { data: lovListResponse } = useGetLovsQuery(listRequest);

  const handleLovNew = () => {
    setLovPopupOpen(true);
    setLov({ ...newApLov });
  };

  const handleLovSave = () => {
    setLovPopupOpen(false);
    saveLov(lov).unwrap();
  };
  const divElement = useSelector((state: RootState) => state.div?.divElement);
  const divContent = (
    <div style={{ display: 'flex' }}>
      <h5>Lovs</h5>
    </div>
  );
  const divContentHTML = ReactDOMServer.renderToStaticMarkup(divContent);
  dispatch(setPageCode('Lovs'));
  dispatch(setDivContent(divContentHTML));
  useEffect(() => {
    if (saveLovMutation.data) {
      setListRequest({ ...listRequest, timestamp: new Date().getTime() });
    }
  }, [saveLovMutation.data]);

  const isSelected = rowData => {
    if (rowData && lov && rowData.key === lov.key) {
      return 'selected-row';
    } else return '';
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
  useEffect(() => {
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent("  "));
    };
  }, [location.pathname, dispatch])
  return (
    <Carousel
      style={{ height: 'auto', backgroundColor: 'var(--rs-body)' }}
      autoplay={false}
      activeIndex={carouselActiveIndex}
    >
      <Panel
      >
        <ButtonToolbar>
          <IconButton appearance="primary" icon={<AddOutlineIcon />} onClick={handleLovNew}>
            Add New
          </IconButton>
          <IconButton
            disabled={!lov.key}
            appearance="primary"
            onClick={() => setLovPopupOpen(true)}
            color="green"
            icon={<EditIcon />}
          >
            Edit Selected
          </IconButton>
          <IconButton
            disabled={true || !lov.key}
            appearance="primary"
            color="red"
            icon={<TrashIcon />}
          >
            Delete Selected
          </IconButton>
          <IconButton
            disabled={!lov.key}
            appearance="primary"
            color="orange"
            onClick={() => setCarouselActiveIndex(1)}
            icon={<ChangeListIcon />}
          >
            Setup Lov Values
          </IconButton>
        </ButtonToolbar>
        <hr />
        <Table
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
          data={lovListResponse?.object ?? []}
          onRowClick={rowData => {
            setLov(rowData);
          }}
          rowClassName={isSelected}
        >
          <Column sortable flexGrow={4}>
            <HeaderCell>
              <Input onChange={e => handleFilterChange('lovCode', e)} />
              <Translate>Code</Translate>
            </HeaderCell>
            <Cell dataKey="lovCode" />
          </Column>
          <Column sortable flexGrow={4}>
            <HeaderCell>
              <Input onChange={e => handleFilterChange('lovName', e)} />
              <Translate>Name</Translate>
            </HeaderCell>
            <Cell dataKey="lovName" />
          </Column>
          <Column sortable flexGrow={4}>
            <HeaderCell>
              <Input onChange={e => handleFilterChange('lovDescription', e)} />
              <Translate>Description</Translate>
            </HeaderCell>
            <Cell dataKey="lovDescription" />
          </Column>
          <Column sortable flexGrow={3}>
            <HeaderCell>
              <Translate>Auto Select Default</Translate>
            </HeaderCell>
            <Cell>{rowData => <span>{rowData.autoSelectDefault ? 'Yes' : 'No'}</span>}</Cell>
          </Column>
          <Column sortable flexGrow={3}>
            <HeaderCell>
              <Translate>Default Value Key</Translate>
            </HeaderCell>
            <Cell dataKey="defaultValueId" />
          </Column>
          <Column sortable flexGrow={3}>
            <HeaderCell>
              <Translate>Parent LOV</Translate>
            </HeaderCell>
            <Cell>
              {rowData => (
                <span>
                  {conjureValueBasedOnKeyFromList(
                    lovListResponse?.object ?? [],
                    rowData.parentLov,
                    'lovName'
                  )}
                </span>
              )}
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
            total={lovListResponse?.extraNumeric ?? 0}
          />
        </div>

        <Modal open={lovPopupOpen} overflow>
          <Modal.Title>
            <Translate>New/Edit Lov</Translate>
          </Modal.Title>
          <Modal.Body>
            <Form fluid>
              <MyInput fieldName="lovCode" record={lov} setRecord={setLov} />
              <MyInput fieldName="lovName" record={lov} setRecord={setLov} />
              <MyInput
                fieldName="lovDescription"
                fieldType="textarea"
                record={lov}
                setRecord={setLov}
              />
              <MyInput
                fieldName="autoSelectDefault"
                fieldType="checkbox"
                record={lov}
                setRecord={setLov}
              />
              <MyInput
                fieldName="defaultValueId"
                record={lov}
                disabled={!lov.autoSelectDefault}
                setRecord={setLov}
              />
              <MyInput
                fieldName="parentLov"
                fieldType="select"
                selectData={lovListResponse?.object ?? []}
                selectDataLabel="lovName"
                selectDataValue="key"
                record={lov}
                setRecord={setLov}
              />
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Stack spacing={2} divider={<Divider vertical />}>
              <Button appearance="primary" onClick={handleLovSave}>
                Save
              </Button>
              <Button appearance="primary" color="red" onClick={() => setLovPopupOpen(false)}>
                Cancel
              </Button>
            </Stack>
          </Modal.Footer>
        </Modal>
      </Panel>
      <LovValues
        lov={lov}
        goBack={() => {
          setCarouselActiveIndex(0);
          setLov({ ...newApLov });
        }}
      />
    </Carousel>
  );
};

export default Lov;
