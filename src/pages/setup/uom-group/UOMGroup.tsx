import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState, useEffect } from 'react';
import { Input, Modal, Pagination, Panel, Table } from 'rsuite';
const { Column, HeaderCell, Cell } = Table;
import { useSaveUomGroupMutation, useGetUomGroupsQuery,useRemoveUomGroupMutation } from '@/services/setupService';
import { Button, ButtonToolbar, Carousel, IconButton } from 'rsuite';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import EditIcon from '@rsuite/icons/Edit';
import TrashIcon from '@rsuite/icons/Trash';
import ChangeListIcon from '@rsuite/icons/ChangeList';
import { ApModule, ApUomGroups } from '@/types/model-types';
import { newApModule, newApUomGroups } from '@/types/model-types-constructor';
import { Form, Stack, Divider } from 'rsuite';
import MyInput from '@/components/MyInput';
import { addFilterToListRequest, fromCamelCaseToDBName } from '@/utils';
import * as icons from 'react-icons/fa6';
import MyIconInput from '@/components/MyInput/MyIconInput';
import { Icon } from '@rsuite/icons';


const UOMGroup = () => {
  const [uomGroup, setUomGroup] = useState<ApUomGroups>({ ...newApUomGroups });
  const [uomGrpupOpen, setUomGroupOpen] = useState(false);
  const [carouselActiveIndex, setCarouselActiveIndex] = useState(0);
  const [subView, setSubView] = useState('');

  const [listRequest, setListRequest] = useState<ListRequest>({ ...initialListRequest });

  const [saveUomGroup, saveUomGroupMutation] = useSaveUomGroupMutation();
  const [removeUomGroup, { isLoading, isSuccess, isError }] = useRemoveUomGroupMutation();

  const { data: uomGroupsListResponse,refetch:refetchUomGroups } = useGetUomGroupsQuery(listRequest);

  useEffect(() => { }, []);

  const handleUomGroupNew = () => {
    setUomGroupOpen(true);
    setUomGroup({ ...newApUomGroups });
  };

  const handleUomGroupSave = () => {
    setUomGroupOpen(false);
    saveUomGroup(uomGroup).unwrap();
  };
  const handleRemoveUomGroup = async (data) => {
    try {
      const response = await removeUomGroup({
        uomGroup: data
      }).unwrap().then(()=>{
        refetchUomGroups()
      }); 
      console.log('UOM group removed successfully:', response);
    } catch (error) {
      console.error('Error removing UOM group:', error);
    }
  };


  useEffect(() => {
    if (saveUomGroupMutation.data) {
      setListRequest({ ...listRequest, timestamp: new Date().getTime() });
    }
  }, [saveUomGroupMutation.data]);

  const isSelected = rowData => {
    if (rowData && uomGroup && rowData.key === uomGroup.key) {
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
            <Translate>UOM Groups</Translate>
          </h3>
        }
      >
        <ButtonToolbar>
          <IconButton appearance="primary" icon={<AddOutlineIcon />} onClick={handleUomGroupNew}>
            Add New
          </IconButton>
          <IconButton
            disabled={!uomGroup.key}
            appearance="primary"
            onClick={() => setUomGroupOpen(true)}
            color="green"
            icon={<EditIcon />}
          >
            Edit Selected
          </IconButton>
          <IconButton
            disabled={!uomGroup.key}
            onClick={() => handleRemoveUomGroup(uomGroup)}
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
          data={uomGroupsListResponse?.object ?? []}
          onRowClick={rowData => {
            setUomGroup(rowData);
          }}
          rowClassName={isSelected}
        >
          <Column sortable flexGrow={4}>
            <HeaderCell>
              <Input onChange={e => handleFilterChange('description', e)} />
              <Translate>Description</Translate>
            </HeaderCell>
            <Cell dataKey="description" />
          </Column>

          {/* <Column sortable align="center" flexGrow={1}>
            <HeaderCell>
              <Input onChange={e => handleFilterChange('iconImagePath', e)} />
              <Translate>Icon</Translate>
            </HeaderCell>
            <Cell>{rowData => <Icon size="2em" as={icons[rowData.iconImagePath]} />}</Cell>
          </Column> */}
          <Column sortable flexGrow={4}>
            <HeaderCell>
              <Input onChange={e => handleFilterChange('baseUom', e)} />
              <Translate>Base UOM</Translate>
            </HeaderCell>
            <Cell dataKey="baseUom" />
          </Column>

          <Column sortable flexGrow={2}>
            <HeaderCell>
              <Input onChange={e => handleFilterChange('uomEntries', e)} />
              <Translate>UOM Entries</Translate>
            </HeaderCell>
            <Cell dataKey="uomEntries" />
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
            total={uomGroupsListResponse?.extraNumeric ?? 0}
          />
        </div>

        <Modal open={uomGrpupOpen} overflow>
          <Modal.Title>
            <Translate>New/Edit Module</Translate>
          </Modal.Title>
          <Modal.Body>
            <Form fluid>
              <MyInput fieldName="description" record={uomGroup} setRecord={setUomGroup} />
              <MyInput fieldName="baseUom" record={uomGroup} setRecord={setUomGroup} />

              <MyInput
                fieldName="uomEntries"
                fieldType="number"
                record={uomGroup}
                setRecord={setUomGroup}
              />
          
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Stack spacing={2} divider={<Divider vertical />}>
              <Button appearance="primary" onClick={handleUomGroupSave}>
                Save
              </Button>
              <Button appearance="primary" color="red" onClick={() => setUomGroupOpen(false)}>
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

export default UOMGroup;
