import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState, useEffect } from 'react';
import { Input, Modal, Pagination, Panel, Table } from 'rsuite';
const { Column, HeaderCell, Cell } = Table;
import { useGetModulesQuery, useSaveModuleMutation } from '@/services/setupService';
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
import MyIconInput from '@/components/MyInput/MyIconInput';
import { Icon } from '@rsuite/icons';

const Modules = () => {
  const [module, setModule] = useState<ApModule>({ ...newApModule });
  const [modulePopupOpen, setModulePopupOpen] = useState(false);
  const [carouselActiveIndex, setCarouselActiveIndex] = useState(0);
  const [subView, setSubView] = useState('');

  const [listRequest, setListRequest] = useState<ListRequest>({ ...initialListRequest });

  const [saveModule, saveModuleMutation] = useSaveModuleMutation();

  const { data: moduleListResponse } = useGetModulesQuery(listRequest);

  useEffect(() => {}, []);

  const handleModuleNew = () => {
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

  const toSubView = (subview: string) => {
    setCarouselActiveIndex(1);
    setSubView(subview);
  };

  return (
    <Carousel
      style={{ height: 'auto', backgroundColor: 'var(--rs-body)' }}
      autoplay={false}
      activeIndex={carouselActiveIndex}
    >
      <Panel 
        header={
          <h3 className="title">
            <Translate>Modules</Translate>
          </h3>
        }
      >
        <ButtonToolbar>
          <IconButton appearance="primary" icon={<AddOutlineIcon />} onClick={handleModuleNew}>
            Add New
          </IconButton>
          <IconButton
            disabled={!module.key}
            appearance="primary"
            onClick={() => setModulePopupOpen(true)}
            color="green"
            icon={<EditIcon />}
          >
            Edit Selected
          </IconButton>
          <IconButton
            disabled={true || !module.key}
            appearance="primary"
            color="red"
            icon={<TrashIcon />}
          >
            Delete Selected
          </IconButton>
          <IconButton
            disabled={!module.key}
            appearance="primary"
            color="orange"
            onClick={() => toSubView('screens')}
            icon={<ChangeListIcon />}
          >
            Setup Module Screens
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
          data={moduleListResponse?.object ?? []}
          onRowClick={rowData => {
            setModule(rowData);
          }}
          rowClassName={isSelected}
        >
          <Column sortable align="center" flexGrow={1}>
            <HeaderCell>
              <Input onChange={e => handleFilterChange('iconImagePath', e)} />
              <Translate>Icon</Translate>
            </HeaderCell>
            <Cell>{rowData => <Icon size="2em" as={icons[rowData.iconImagePath]} />}</Cell>
          </Column>
          <Column sortable flexGrow={4}>
            <HeaderCell>
              <Input onChange={e => handleFilterChange('name', e)} />
              <Translate>Name</Translate>
            </HeaderCell>
            <Cell dataKey="name" />
          </Column>
          <Column sortable flexGrow={4}>
            <HeaderCell>
              <Input onChange={e => handleFilterChange('description', e)} />
              <Translate>Description</Translate>
            </HeaderCell>
            <Cell dataKey="description" />
          </Column>
          <Column sortable flexGrow={2}>
            <HeaderCell>
              <Input onChange={e => handleFilterChange('viewOrder', e)} />
              <Translate>View Order</Translate>
            </HeaderCell>
            <Cell dataKey="viewOrder" />
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
            total={moduleListResponse?.extraNumeric ?? 0}
          />
        </div>

        <Modal open={modulePopupOpen} overflow>
          <Modal.Title>
            <Translate>New/Edit Module</Translate>
          </Modal.Title>
          <Modal.Body>
            <Form fluid>
              <MyInput fieldName="name" record={module} setRecord={setModule} />
              <MyInput fieldName="description" record={module} setRecord={setModule} />
              <MyInput
                fieldName="viewOrder"
                fieldType="number"
                record={module}
                setRecord={setModule}
              />
              <MyIconInput
                fieldName="iconImagePath"
                fieldLabel="Icon"
                record={module}
                setRecord={setModule}
              />
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Stack spacing={2} divider={<Divider vertical />}>
              <Button appearance="primary" onClick={handleModuleSave}>
                Save
              </Button>
              <Button appearance="primary" color="red" onClick={() => setModulePopupOpen(false)}>
                Cancel
              </Button>
            </Stack>
          </Modal.Footer>
        </Modal>
      </Panel>
      {conjureSubViews()}
    </Carousel>
  );
};

export default Modules;
