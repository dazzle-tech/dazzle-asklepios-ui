import React, { useEffect, useState } from 'react';
import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import { Input, Modal, Pagination, Panel, Table } from 'rsuite';
const { Column, HeaderCell, Cell } = Table;
import { Button, ButtonToolbar, IconButton } from 'rsuite';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import EditIcon from '@rsuite/icons/Edit';
import TrashIcon from '@rsuite/icons/Trash';
import { Form, Stack, Divider } from 'rsuite';
import MyInput from '@/components/MyInput';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import {
  useGetLovValuesByCodeQuery,
  useSaveAgeGroupMutation,
  useGetAgeGroupQuery
} from '@/services/setupService';
import { addFilterToListRequest, fromCamelCaseToDBName } from '@/utils';
import { ApAgeGroup } from '@/types/model-types';
import { newApAgeGroup } from '@/types/model-types-constructor';
const AgeGroup = () => {
  const [listRequest, setListRequest] = useState<ListRequest>({ ...initialListRequest });
  const [popupOpen, setPopupOpen] = useState(false);
  const [agegroups, setAgeGroups] = useState<ApAgeGroup>({ ...newApAgeGroup });
  const dispatch = useAppDispatch();
  const { data: agegroupsLovQueryResponse } = useGetLovValuesByCodeQuery('AGE_GROUPS');
  const { data: ageunitsLovQueryResponse } = useGetLovValuesByCodeQuery('AGE_UNITS');
  const [saveAgeGroups, saveAgeGroupsMutation] = useSaveAgeGroupMutation();
  const { data: ageGroupsListResponse } = useGetAgeGroupQuery(listRequest);

  const isSelected = rowData => {
    if (rowData && agegroups && rowData.key === agegroups.key) {
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

  const handleNew = () => {
    setAgeGroups({ ...newApAgeGroup, fromAge: null, toAge: null });
    setPopupOpen(true);
  };
  const handleSave = async () => {
    setPopupOpen(false);
    //if you want to use response object write response.object 
    try {
      const response = await saveAgeGroups(agegroups).unwrap();
      console.log(response.msg)

      dispatch(notify(response.msg));

    } catch (error) {
      if (error.data && error.data.message) {
        // Display error message from server
        dispatch(notify(error.data.message));
      } else {
        // Generic error notification
        dispatch(notify("An unexpected error occurred"));
      }
    }
  };


  useEffect(() => {
    if (saveAgeGroupsMutation.data) {
      setListRequest({ ...listRequest, timestamp: new Date().getTime() });
    }
  }, [saveAgeGroupsMutation.data]);

  return (<>
    <Panel
      header={
        <h3 className="title">
          <Translate>Age Group</Translate>
        </h3>
      }
    >
      <ButtonToolbar>
        <IconButton appearance="primary"
          icon={<AddOutlineIcon />}
          onClick={handleNew}
        >
          Add New
        </IconButton>
        <IconButton

          disabled={!agegroups.key}
          appearance="primary"
          onClick={() => setPopupOpen(true)}
          color="cyan"
          icon={<EditIcon />}
        >
          Edit Selected
        </IconButton>
        <IconButton
          disabled={!agegroups.key}
          appearance="ghost"
          style={{ border: '1px solid rgb(130, 95, 196)', color: 'rgb(130, 95, 196)' }}
          icon={<TrashIcon />}
        >
          Deactivate
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
        data={ageGroupsListResponse?.object ?? []}
        onRowClick={rowData => {
          setAgeGroups(rowData);
        }}
        rowClassName={isSelected}
      >
        <Column sortable flexGrow={2}>
          <HeaderCell align="center">
            <Input onChange={e => handleFilterChange('ageGroupLkey', e)} />
            <Translate>Age Group</Translate>
          </HeaderCell>
          <Cell>
            {rowData => ` ${rowData.ageGroupLvalue ? rowData.ageGroupLvalue.lovDisplayVale
              : rowData.ageGroupLkey}`}
          </Cell  >
        </Column>
        <Column sortable flexGrow={2}>
          <HeaderCell align="center">
            <Input onChange={e => handleFilterChange('fromAge', e)} />

            <Translate>Age From Unit</Translate>
          </HeaderCell>
          <Cell dataKey="fromAge" >
            {rowData => `${rowData.fromAge} ${rowData.fromAgeUnitLvalue ? rowData.fromAgeUnitLvalue.lovDisplayVale
              : rowData.fromAgeUnitLkey}`}
            {/* {rowData => rowData.fromAge } */}
          </Cell>
        </Column>
        <Column sortable flexGrow={2} >
          <HeaderCell align="center">
            <Input onChange={e => handleFilterChange('toAge', e)} />
            <Translate>Age To Unit</Translate>
          </HeaderCell>
          <Cell dataKey="toAge" >
            {rowData => `${rowData.toAge} ${rowData.toAgeUnitLvalue ? rowData.toAgeUnitLvalue.lovDisplayVale
              : rowData.toAgeUnitLkey}`}
          </Cell>
        </Column>
        <Column flexGrow={3}>
          <HeaderCell align="center">
            <Input onChange={e => handleFilterChange('isValid', e)} />
            <Translate>status</Translate>
          </HeaderCell>
          <Cell >
            {rowData => rowData.isValid ? 'active' : 'deactive'}
          </Cell>
        </Column>

      </Table>
      <Modal open={popupOpen} overflow>
        <Modal.Title>
          <Translate>New Age Group</Translate>
        </Modal.Title>
        <Modal.Body>
          <Form fluid>

            <MyInput
              fieldName="ageGroupLkey"
              fieldType="select"
              selectData={agegroupsLovQueryResponse?.object ?? []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              record={agegroups}
              setRecord={setAgeGroups}
            />
            <div style={{ display: "flex", gap: "20px" }}>

              <MyInput width={150} fieldName="fromAge" record={agegroups} setRecord={setAgeGroups} />
              <MyInput
                width={100}
                fieldName="fromAgeUnitLkey"
                fieldType="select"
                selectData={ageunitsLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={agegroups}
                setRecord={setAgeGroups}
              />
            </div>

            <div style={{ display: "flex", gap: "20px" }}>
              <MyInput width={150} fieldName="toAge" record={agegroups} setRecord={setAgeGroups} />
              <MyInput
                width={100}
                fieldName="toAgeUnitLkey"
                fieldType="select"
                selectData={ageunitsLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={agegroups}
                setRecord={setAgeGroups}
              />
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Stack spacing={2} divider={<Divider vertical />}>
            <Button appearance="primary"
              onClick={handleSave}
            >
              Save
            </Button>
            <Button appearance="ghost" onClick={() => setPopupOpen(false)}>
              Cancel
            </Button>
          </Stack>
        </Modal.Footer>
      </Modal>
    </Panel></>);
};
export default AgeGroup;