import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState, useEffect } from 'react';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import { Input, Modal, Pagination, Panel, Table } from 'rsuite';
const { Column, HeaderCell, Cell } = Table;
import{
  useRemoveGenericMedicationMutation,
  useGetGenericMedicationQuery
} from '@/services/medicationsSetupService';
import { ButtonToolbar, IconButton, Carousel } from 'rsuite';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import EditIcon from '@rsuite/icons/Edit';
import TrashIcon from '@rsuite/icons/Trash';
import { ApGenericMedication } from '@/types/model-types';
import { newApGenericMedication } from '@/types/model-types-constructor';
import { addFilterToListRequest, fromCamelCaseToDBName } from '@/utils';
import NewEditGenericMedication from './NewEditGenericMedication';

const GenericMedications = () => {

    const [genericMedication, setGenericMedication] = useState<ApGenericMedication>({ ...newApGenericMedication});
    const [listRequest, setListRequest] = useState<ListRequest>({ ...initialListRequest });
   
    const { data: genericMedicationListResponse } = useGetGenericMedicationQuery(listRequest);
    const [removeGenericMedication, removeGenericMedicationMutation] = useRemoveGenericMedicationMutation();
    const [carouselActiveIndex, setCarouselActiveIndex] = useState(0);

    const handleNew = () => {
      setGenericMedication({...newApGenericMedication});
      setCarouselActiveIndex(1);
    };

    const handleEdit = () => {
      setCarouselActiveIndex(1);
    };

    
    const handleDelete = () => {
      if (genericMedication.key) {
        removeGenericMedication({
          ...genericMedication,
        }).unwrap();
      }
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

    
    const isSelected = rowData => {
      if (rowData && genericMedication && rowData.key === genericMedication.key) {
         return 'selected-row';
      } else return '';
    };

    useEffect(() => {
      if (removeGenericMedicationMutation.isSuccess) {
        setListRequest({
          ...listRequest,
          timestamp: new Date().getTime()
        });
        
        setGenericMedication({ ...newApGenericMedication });
      }
    }, [removeGenericMedicationMutation]);
  

  
    return (
      <Carousel
      style={{ height: 'auto', backgroundColor: 'var(--rs-body)' }}
      autoplay={false}
      activeIndex={carouselActiveIndex}
    >
      <Panel
        header={
          <h3 className="title">
            <Translate> Generic Medications List </Translate>
          </h3>
        }
      >
        <ButtonToolbar>
          <IconButton appearance="primary" icon={<AddOutlineIcon />}  onClick={handleNew}>
            Add New
          </IconButton>
          <IconButton
            disabled={!genericMedication.key || genericMedication.deletedAt !== null}
            appearance="primary"
            color="green"
            onClick={handleEdit}
            icon={<EditIcon />}
          >
            Edit Selected
          </IconButton>
          <IconButton
            disabled={!genericMedication.key || genericMedication.deletedAt !== null}
            appearance="primary"
            color="red"
            onClick={handleDelete}
            icon={<TrashIcon />}
          >
            Deactivate Selected
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
          data={genericMedicationListResponse?.object ?? []}
          onRowClick={rowData => {
            setGenericMedication(rowData);
          }}
          rowClassName={isSelected}
        >
              {/* <Column sortable flexGrow={2}>
            <HeaderCell align="center">
              <Input onChange={e => handleFilterChange('code', e)} />
              <Translate>Code </Translate>
            </HeaderCell>
            <Cell dataKey="code" />
          </Column> */}
          <Column sortable flexGrow={2}>
            <HeaderCell align="center">
              <Input onChange={e => handleFilterChange('genericName', e)} />
              <Translate>Generic Name </Translate>
            </HeaderCell>
            <Cell dataKey="genericName" />
          </Column>
          <Column sortable flexGrow={2}>
            <HeaderCell  align="center">
              <Input onChange={e => handleFilterChange('manufacturerLkey', e)} />
              <Translate>Manufacturer</Translate>
            </HeaderCell>
            <Cell dataKey="manufacturerLkey">
            {rowData =>
                rowData.manufacturerLvalue ? rowData.manufacturerLvalue.lovDisplayVale : rowData.manufacturerLkey
              }
            </Cell>
          </Column> 
          <Column sortable flexGrow={2}>
            <HeaderCell  align="center">
              <Input onChange={e => handleFilterChange('dosageFormLkey', e)} />
              <Translate>Dosage Form</Translate>
            </HeaderCell>
            <Cell>
              {rowData =>
                rowData.dosageFormLvalue ? rowData.dosageFormLvalue.lovDisplayVale : rowData.dosageFormLkey
              }
            </Cell>
          </Column>
         
          <Column sortable flexGrow={3}>
            <HeaderCell  align="center">
              <Input onChange={e => handleFilterChange('usageInstructions', e)} />
              <Translate>Usage Instructions</Translate>
            </HeaderCell>
            <Cell dataKey="usageInstructions" />
          </Column> 
          <Column sortable flexGrow={3}>
            <HeaderCell  align="center">
              <Input onChange={e => handleFilterChange('roaLkey', e)} />
              <Translate>Rout</Translate>
            </HeaderCell>
            <Cell>
            {rowData =>
                rowData.roaLvalue ? rowData.roaLvalue.lovDisplayVale : rowData.roaLkey
              }
            </Cell>
          </Column> 
          <Column sortable flexGrow={3}>
            <HeaderCell  align="center">
              <Input onChange={e => handleFilterChange('expiresAfterOpening', e)} />
              <Translate>Expires After Opening</Translate>
            </HeaderCell>
            <Cell>
            {rowData =>
              rowData.expiresAfterOpening ? 'Yes' : 'No'
            }
            </Cell>
          </Column>
          <Column sortable flexGrow={3}>
            <HeaderCell  align="center">
              <Input onChange={e => handleFilterChange('singlePatientUse', e)} />
              <Translate>Single Patient Use</Translate>
            </HeaderCell>
            <Cell>
            {rowData =>
              rowData.singlePatientUse ? 'Yes' : 'No'
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
            total={genericMedicationListResponse?.extraNumeric ?? 0}
          />
        </div>

      
        {/* <Panel
          bordered
          header={
            <h5 className="title">
              <Translate>Details</Translate>
            </h5>
          }
        > */}

  {/* <Tabs>
            <TabList>
              <Tab>Details</Tab>
              <Tab>Active Ingredient</Tab>
              <Tab>Unit of Measurments</Tab>
              <Tab>Price</Tab>
              <Tab>Insurance</Tab>
            </TabList>

            <TabPanel> 
            <Form layout="inline" fluid>
                <MyInput
                  column
                  fieldLabel="Rout of Admin"
                  fieldType="select"
                  fieldName="maritalStatusLkey"
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={localPatient}
                />
                <MyInput
                  column
                  fieldLabel="Usage Instruction"
                  fieldType="select"
                  fieldName="nationalityLkey"
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={localPatient}
                />
                <MyInput
                  column
                  fieldLabel="Storge Req."
                  fieldType="select"
                  fieldName="primaryLanguageLkey"
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={localPatient}
                />
                <MyInput
                  column
                  fieldLabel="Single Use"
                  fieldType="check"
                  fieldName="religionLkey"
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={localPatient}
                />
                <MyInput
                  column
                  fieldLabel="Ethnicity"
                  fieldType="check"
                  fieldName="ethnicityLkey"
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={localPatient}
                />
              </Form>
               </TabPanel>
            <TabPanel> 
            <Table
                bordered
                rowClassName={isSelected}
                headerHeight={50}
                rowHeight={60}
              >
                <Table.Column flexGrow={1}>
                  <Table.HeaderCell>Active Ingredient Name</Table.HeaderCell>
                  <Table.Cell>
                  </Table.Cell>
                </Table.Column>
                <Table.Column flexGrow={1}>
                  <Table.HeaderCell>strength & unit</Table.HeaderCell>
                  <Table.Cell></Table.Cell>
                </Table.Column>
              </Table>
               </TabPanel>
            <TabPanel>
            <Table
                bordered
                rowClassName={isSelected}
                headerHeight={50}
                rowHeight={60}
              >
                <Table.Column flexGrow={1}>
                  <Table.HeaderCell>Unit of Measurement</Table.HeaderCell>
                  <Table.Cell>
                  </Table.Cell>
                </Table.Column>
                <Table.Column flexGrow={1}>
                  <Table.HeaderCell>Unit Orders</Table.HeaderCell>
                  <Table.Cell></Table.Cell>
                </Table.Column>
                <Table.Column flexGrow={1}>
                  <Table.HeaderCell>Selling Default Unit</Table.HeaderCell>
                  <Table.Cell></Table.Cell>
                </Table.Column>
                <Table.Column flexGrow={1}>
                  <Table.HeaderCell>Base Unit Price</Table.HeaderCell>
                  <Table.Cell></Table.Cell>
                </Table.Column>
                <Table.Column flexGrow={1}>
                  <Table.HeaderCell>Stock Default Unit</Table.HeaderCell>
                  <Table.Cell></Table.Cell>
                </Table.Column>
              </Table>
            </TabPanel>
            <TabPanel>
              <Table
                bordered
                rowClassName={isSelected}
                headerHeight={50}
                rowHeight={60}
              >
                <Table.Column flexGrow={1}>
                  <Table.HeaderCell>Cost</Table.HeaderCell>
                  <Table.Cell>
                  </Table.Cell>
                </Table.Column>
                <Table.Column flexGrow={1}>
                  <Table.HeaderCell>Price</Table.HeaderCell>
                  <Table.Cell></Table.Cell>
                </Table.Column>
              </Table>
              </TabPanel>
            <TabPanel>
            <Table
                bordered
                rowClassName={isSelected}
                headerHeight={50}
                rowHeight={60}
              >
                <Table.Column flexGrow={1}>
                  <Table.HeaderCell>Insurance</Table.HeaderCell>
                  <Table.Cell>
                  </Table.Cell>
                </Table.Column>
                <Table.Column flexGrow={1}>
                  <Table.HeaderCell>Plan</Table.HeaderCell>
                  <Table.Cell></Table.Cell>
                </Table.Column>
                <Table.Column flexGrow={1}>
                  <Table.HeaderCell>Coverage</Table.HeaderCell>
                  <Table.Cell></Table.Cell>
                </Table.Column>
              </Table>
            </TabPanel>
          </Tabs>  */}
        {/* </Panel> */}
      </Panel>
       <NewEditGenericMedication
        selectedGenericMedication={genericMedication}
        goBack={() => {
         setCarouselActiveIndex(0);
       }}
     />
   </Carousel>
    );
  };

  export default GenericMedications;