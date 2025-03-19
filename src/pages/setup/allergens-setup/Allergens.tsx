import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState, useEffect } from 'react';
import { Input, Modal, Pagination, Panel, Table } from 'rsuite';
const { Column, HeaderCell, Cell } = Table;
import {
  useGetAllergensQuery,
  useSaveAllergensMutation,
  useGetLovValuesByCodeQuery
} from '@/services/setupService';
import { Button, ButtonToolbar, IconButton } from 'rsuite';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import EditIcon from '@rsuite/icons/Edit';
import TrashIcon from '@rsuite/icons/Trash';
import { ApAllergens } from '@/types/model-types';
import { newApAllergens } from '@/types/model-types-constructor';
import { Form, Stack, Divider } from 'rsuite';
import MyInput from '@/components/MyInput';
import { addFilterToListRequest, fromCamelCaseToDBName } from '@/utils';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import ReactDOMServer from 'react-dom/server';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useAppDispatch } from '@/hooks';
const Allergens = () => {
  const dispatch = useAppDispatch();
  const [allergens, setAllergens] = useState<ApAllergens>({ ...newApAllergens });
  const [popupOpen, setPopupOpen] = useState(false);
  const [listRequest, setListRequest] = useState<ListRequest>({ ...initialListRequest });
  const [saveAllergens, saveAllergensMutation] = useSaveAllergensMutation();
  const { data: allergensListResponse } = useGetAllergensQuery(listRequest);
  const { data: allergensTypeLovQueryResponse } = useGetLovValuesByCodeQuery('ALLERGEN_TYPES');
  const divElement = useSelector((state: RootState) => state.div?.divElement);
  const divContent = (
    <div style={{ display: 'flex' }}>
      <h5>Allergens</h5>
    </div>
  );
  const divContentHTML = ReactDOMServer.renderToStaticMarkup(divContent);
  dispatch(setPageCode('Allergens'));
  dispatch(setDivContent(divContentHTML));

  const handleNew = () => {
    setAllergens({...newApAllergens})
    setPopupOpen(true);
  };

  const handleSave = () => {
    setPopupOpen(false);
    saveAllergens(allergens).unwrap();
  };

  useEffect(() => {
    if (saveAllergensMutation.data) {
      setListRequest({ ...listRequest, timestamp: new Date().getTime() });
    }
  }, [saveAllergensMutation.data]);

  const isSelected = rowData => {
    if (rowData && allergens && rowData.key === allergens.key) {
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
  }, [location.pathname, dispatch]);
  return (
    <Panel>
      <ButtonToolbar>
        <IconButton appearance="primary" icon={<AddOutlineIcon />} onClick={handleNew}>
          Add New
        </IconButton>
        <IconButton
          disabled={!allergens.key}
          appearance="primary"
          onClick={() => setPopupOpen(true)}
          color="green"
          icon={<EditIcon />}
        >
          Edit Selected
        </IconButton>
        <IconButton
          disabled={true || !allergens.key}
          appearance="primary"
          color="red"
          icon={<TrashIcon />}
        >
          Delete Selected
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
        data={allergensListResponse?.object ?? []}
        onRowClick={rowData => {
          setAllergens(rowData);
        }}
        rowClassName={isSelected}
      >
        <Column sortable flexGrow={2}>
          <HeaderCell align="center">
            <Input onChange={e => handleFilterChange('allergenCode', e)} />
            <Translate>Allergens Code</Translate>
          </HeaderCell>
          <Cell dataKey="allergenCode" />
        </Column>
        <Column sortable flexGrow={2}>
          <HeaderCell  align="center">
            <Input onChange={e => handleFilterChange('allergenName', e)} />
            <Translate>Allergens Name</Translate>
          </HeaderCell>
          <Cell dataKey="allergenName" />
        </Column> 
        <Column sortable flexGrow={2}>
          <HeaderCell  align="center">
            <Input onChange={e => handleFilterChange('allergenTypeLkey', e)} />
            <Translate>Allergens Type</Translate>
          </HeaderCell>
          <Cell>
            {rowData =>
              rowData.allergenTypeLvalue ? rowData.allergenTypeLvalue.lovDisplayVale : rowData.allergenTypeLkey
            }
          </Cell>
        </Column>
        <Column sortable flexGrow={3}>
          <HeaderCell  align="center">
            <Input onChange={e => handleFilterChange('description', e)} />
            <Translate>description</Translate>
          </HeaderCell>
          <Cell dataKey="description" />
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
          total={allergensListResponse?.extraNumeric ?? 0}
        />
      </div>

      <Modal open={popupOpen} overflow>
        <Modal.Title>
          <Translate>New/Edit Allergens</Translate>
        </Modal.Title>
        <Modal.Body>
          <Form fluid>
            <MyInput fieldName="allergenCode" record={allergens} setRecord={setAllergens} />
            <MyInput fieldName="allergenName" record={allergens} setRecord={setAllergens} />
            <MyInput
              fieldName="allergenTypeLkey"
              fieldType="select"
              selectData={allergensTypeLovQueryResponse?.object ?? []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              record={allergens}
              setRecord={setAllergens}
            />
             <MyInput fieldName="description" record={allergens} setRecord={setAllergens} />
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
    </Panel>
  );
};

export default Allergens;
