import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState, useEffect } from 'react';
import { Input, Modal, Pagination, Panel, Table } from 'rsuite';
const { Column, HeaderCell, Cell } = Table;
import {
  useGetPrescriptionInstructionQuery,
  useSavePrescriptionInstructionMutation,
  useRemovePrescriptionInstructionMutation
} from '@/services/medicationsSetupService';
import{
  useGetLovValuesByCodeQuery
}from '@/services/setupService';
import { Button, ButtonToolbar, IconButton } from 'rsuite';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import EditIcon from '@rsuite/icons/Edit';
import TrashIcon from '@rsuite/icons/Trash';
import { ApPrescriptionInstruction } from '@/types/model-types';
import { newApPrescriptionInstruction } from '@/types/model-types-constructor';
import { Form, Stack, Divider } from 'rsuite';
import MyInput from '@/components/MyInput';
import { addFilterToListRequest, fromCamelCaseToDBName } from '@/utils';

const PrescriptionInstructions = () => {
  const [prescriptionInstructions, setPrescriptionInstructions] = useState<ApPrescriptionInstruction>({ ...newApPrescriptionInstruction });
  const [popupOpen, setPopupOpen] = useState(false);

  const [listRequest, setListRequest] = useState<ListRequest>({ ...initialListRequest });

  const [savePrescriptionInstruction, savePrescriptionInstructionMutation] = useSavePrescriptionInstructionMutation();
  const [removePrescriptionInstruction, removePrescriptionInstructionMutation] = useRemovePrescriptionInstructionMutation();

  const { data: prescriptionInstructionListResponse } = useGetPrescriptionInstructionQuery(listRequest);
  const { data: ageGroupLovQueryResponse} = useGetLovValuesByCodeQuery('AGE_GROUPS'); 
  const { data: uomLovQueryResponse} = useGetLovValuesByCodeQuery('UOM');  
  const { data: medRoutLovQueryResponse} = useGetLovValuesByCodeQuery('MED_ROA');  
  const { data: medFreqLovQueryResponse} = useGetLovValuesByCodeQuery('MED_FREQUENCY');  
  
  const handleNew = () => {
    setPrescriptionInstructions({...newApPrescriptionInstruction})
    setPopupOpen(true);
  };

  const handleSave = () => {
    setPopupOpen(false);
    savePrescriptionInstruction(prescriptionInstructions).unwrap();
  };

  const handleDelete = () => {
    if (prescriptionInstructions.key) {
      removePrescriptionInstruction({
        ...prescriptionInstructions,
      }).unwrap();
    }
  };


  useEffect(() => {
    if (savePrescriptionInstructionMutation.data) {
      setListRequest({ ...listRequest, timestamp: new Date().getTime() });
    }
  }, [savePrescriptionInstructionMutation.data]);

  const isSelected = rowData => {
    if (rowData && prescriptionInstructions && rowData.key === prescriptionInstructions.key) {
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

  return (
    <Panel
      header={
        <h3 className="title">
          <Translate>Prescription Instructions</Translate>
        </h3>
      }
    >
      <ButtonToolbar>
        <IconButton appearance="primary" icon={<AddOutlineIcon />} onClick={handleNew}>
          Add New
        </IconButton>
        <IconButton
          disabled={!prescriptionInstructions.key || prescriptionInstructions.deletedAt !== null}
          appearance="primary"
          onClick={() => setPopupOpen(true)}
          color="green"
          icon={<EditIcon />}
        >
          Edit Selected
        </IconButton>
        <IconButton
            disabled={!prescriptionInstructions.key || prescriptionInstructions.deletedAt !== null}
            appearance="primary"
            color="red"
            onClick={handleDelete}
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
        data={prescriptionInstructionListResponse?.object ?? []}
        onRowClick={rowData => {
          setPrescriptionInstructions(rowData);
        }}
         rowClassName={isSelected}
      >
        <Column sortable flexGrow={2}>
          <HeaderCell align="center">
            <Input onChange={e => handleFilterChange('categoryLkey', e)} />
            <Translate>Category</Translate>
          </HeaderCell>
          <Cell>
            {rowData => 
              rowData.categoryLvalue ? rowData.categoryLvalue.lovDisplayVale : rowData.categoryLkey
            }
          </Cell>
        </Column>
        <Column sortable flexGrow={2}>
          <HeaderCell  align="center">
            <Input onChange={e => handleFilterChange('dose', e)} />
            <Translate>Dose</Translate>
          </HeaderCell>
          <Cell dataKey="dose" />
        </Column> 
        <Column sortable flexGrow={2}>
          <HeaderCell  align="center">
            <Input onChange={e => handleFilterChange('unitLkey', e)} />
            <Translate>Unit</Translate>
          </HeaderCell>
          <Cell>
            {rowData =>
              rowData.unitLvalue ? rowData.unitLvalue.lovDisplayVale : rowData.unitLkey
            }
          </Cell>
        </Column>
        <Column sortable flexGrow={3}>
          <HeaderCell  align="center">
            <Input onChange={e => handleFilterChange('routLkey', e)} />
            <Translate>Rout</Translate>
          </HeaderCell>
          <Cell>
            {rowData =>
              rowData.routLvalue ? rowData.routLvalue.lovDisplayVale : rowData.routLkey
            }
          </Cell>
        </Column> 
        <Column sortable flexGrow={3}>
          <HeaderCell  align="center">
            <Input onChange={e => handleFilterChange('frequencyLkey', e)} />
            <Translate>Frequency</Translate>
          </HeaderCell>
          <Cell>
            {rowData =>
              rowData.frequencyLvalue ? rowData.frequencyLvalue.lovDisplayVale : rowData.frequencyLkey
            }
          </Cell>
        </Column> 
        <Column sortable flexGrow={3}>
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
          total={prescriptionInstructionListResponse?.extraNumeric ?? 0}
        />
      </div>

      <Modal open={popupOpen} overflow>
        <Modal.Title>
          <Translate>New/Edit Prescription Instructions</Translate>
        </Modal.Title>
        <Modal.Body>
          <Form fluid>
            <MyInput fieldName="categoryLkey" 
            fieldType="select"
            selectData={ageGroupLovQueryResponse?.object ?? []}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            record={prescriptionInstructions}
            setRecord={setPrescriptionInstructions}
            />
            <MyInput fieldName="dose" fieldType="number" record={prescriptionInstructions} setRecord={setPrescriptionInstructions} />
            <MyInput
              fieldName="unitLkey"
              fieldType="select"
              selectData={uomLovQueryResponse?.object ?? []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              record={prescriptionInstructions}
              setRecord={setPrescriptionInstructions}
            />
             <MyInput fieldName="routLkey"
              fieldType="select"
              selectData={medRoutLovQueryResponse?.object ?? []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              record={prescriptionInstructions}
              setRecord={setPrescriptionInstructions}
              />
             <MyInput fieldName="frequencyLkey" 
             fieldType="select"
              selectData={medFreqLovQueryResponse?.object ?? []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              record={prescriptionInstructions}
              setRecord={setPrescriptionInstructions} 
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
    </Panel>
  );
};

export default PrescriptionInstructions;
