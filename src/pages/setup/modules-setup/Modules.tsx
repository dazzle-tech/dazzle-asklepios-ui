import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState, useEffect } from 'react';
import { Input, Modal, Pagination, Panel, Table, InputGroup, SelectPicker } from 'rsuite';
const { Column, HeaderCell, Cell } = Table;
import { useGetModulesQuery, useSaveModuleMutation } from '@/services/setupService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLaptop } from '@fortawesome/free-solid-svg-icons';
import SearchIcon from '@rsuite/icons/Search';
import { Button, ButtonToolbar, Carousel, IconButton } from 'rsuite';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import EditIcon from '@rsuite/icons/Edit';
import TrashIcon from '@rsuite/icons/Trash';
import ChangeListIcon from '@rsuite/icons/ChangeList';
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
import { faCheckDouble } from '@fortawesome/free-solid-svg-icons';
import FormControl from 'rsuite/esm/FormControl';
import './styles.less';

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
    <div className="containerOfIcons">
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
        <div className="containerOfHeaderActions">
          <Form>
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
          >
            Add New
          </MyButton>
        </div>
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
            <Cell className="columnName" dataKey="name" />
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
        <div className="containerOfPagination">
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
            total={moduleListResponse?.extraNumeric ?? 0}
          />
        </div>

        <Modal open={modulePopupOpen} className="left-modal" size="xsm">
          <Modal.Title>
            <Translate>{operationState} Module</Translate>
          </Modal.Title>
          <hr />

          <Modal.Body className="modalBody">
            <Form fluid>
              <div
                className="headerOfModal"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignContent: 'center',
                  alignItems: 'center',
                  marginBottom: '40px'
                }}
              >
                <FontAwesomeIcon
                  icon={faLaptop}
                  color="#415BE7"
                  style={{ marginBottom: '10px' }}
                  size="2x"
                />
                <label style={{ fontWeight: 'bold', fontSize: '14px' }}>Module info</label>
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
              <div style={{ display: 'flex', gap: '20px' }}>
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
          <Modal.Footer>
            <Stack
              style={{ display: 'flex', justifyContent: 'flex-end' }}
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
        </Modal>
      </Panel>
      {conjureSubViews()}
    </Carousel>
  );
};

export default Modules;
