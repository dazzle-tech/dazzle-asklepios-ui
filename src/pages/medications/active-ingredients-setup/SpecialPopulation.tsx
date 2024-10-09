import React, { useEffect, useState } from 'react';
import {
    IconButton,
    Input,
    Table,
    Grid,
    Row,
    Col,
    ButtonToolbar,
    Text,
    InputPicker
  } from 'rsuite';
import { Plus, Trash, InfoRound, Reload } from '@rsuite/icons';
import { MdSave } from 'react-icons/md';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { newApActiveIngredientSpecialPopulation } from '@/types/model-types-constructor';
import { ApActiveIngredientSpecialPopulation } from '@/types/model-types';
import { initialListRequest, ListRequest } from '@/types/types';
import { useGetActiveIngredientSpecialPopulationQuery, useRemoveActiveIngredientSpecialPopulationMutation, useSaveActiveIngredientSpecialPopulationMutation } from '@/services/medicationsSetupService';

  const SpecialPopulation = () => { 
  
    const [activeIngredientSpecialPopulation, setActiveIngredientSpecialPopulation] = useState<ApActiveIngredientSpecialPopulation>({ ...newApActiveIngredientSpecialPopulation });
    const [listRequest, setListRequest] = useState<ListRequest>({ ...initialListRequest });
    const [saveActiveIngredient, saveActiveIngredientMutation] = useSaveActiveIngredientSpecialPopulationMutation();
    const { data: activeIngredientListResponse } = useGetActiveIngredientSpecialPopulationQuery(listRequest);
    const [selectedActiveIngredientSpecialPopulation, setSelectedActiveIngredientSpecialPopulation] = useState<ApActiveIngredientSpecialPopulation>({
      ...newApActiveIngredientSpecialPopulation
    });
    const { data: specialPopulationLovQueryResponseData } = useGetLovValuesByCodeQuery('SPECIAL_POPULATION_GROUPS');
    const isSelected = rowData => {
      if (rowData && rowData.key === selectedActiveIngredientSpecialPopulation.key) {
        return 'selected-row';
      } else return '';
    };
    const [removeActiveIngredientSpecialPopulation, removeActiveIngredientSpecialPopulationMutation] =useRemoveActiveIngredientSpecialPopulationMutation();
    const [saveActiveIngredientSpecialPopulation, saveActiveIngredientSpecialPopulationMutation] = useSaveActiveIngredientSpecialPopulationMutation();
   const { data: specialPopulationListResponseData } = useGetActiveIngredientSpecialPopulationQuery(listRequest);
    const [isActive, setIsActive] = useState(false);

    const handleNew = () => {
      setIsActive(true);
      setActiveIngredientSpecialPopulation({ ...newApActiveIngredientSpecialPopulation });
    };

    const remove = () => {
      if (selectedActiveIngredientSpecialPopulation.key) {
        removeActiveIngredientSpecialPopulation({
          ...selectedActiveIngredientSpecialPopulation,
        }).unwrap();
      }
    };

    const save = () => {
      saveActiveIngredientSpecialPopulation({
        ...selectedActiveIngredientSpecialPopulation,
        createdBy: 'Administrator'
      }).unwrap();
  
    };


    return (
      <>
          <Grid fluid>
            <Row gutter={15}>
            <Col xs={6}>
              <Text>Additional Population</Text>
              <InputPicker
               disabled={!isActive}
                placeholder=""
                data={specialPopulationLovQueryResponseData?.object ?? []}
                value={selectedActiveIngredientSpecialPopulation.additionalPopulationLkey}
                onChange={e =>
                  setSelectedActiveIngredientSpecialPopulation({
                    ...selectedActiveIngredientSpecialPopulation,
                    additionalPopulationLkey: String(e)
                  })
                }
                 labelKey="lovDisplayVale"
                valueKey="key"
                style={{ width: 224 }}
              />
            </Col>
            <Col xs={6}>
            </Col>
            <Col xs={5}></Col>
            <Col xs={5}>
            <ButtonToolbar style={{ margin: '2px' }}>
              <IconButton
                  size="xs"
                  appearance="primary"
                  color="blue"
                  onClick={handleNew}
                  icon={<Plus />}
                />
              <IconButton
                  disabled={!isActive}
                  size="xs"
                  appearance="primary"
                  color="green"
                  onClick={save}
                  icon={<MdSave />}
                />
                   <IconButton
                    disabled={!selectedActiveIngredientSpecialPopulation.key}
                    size="xs"
                    appearance="primary"
                    color="red"
                    onClick={remove}
                    icon={<Trash />}
                  />
                  <IconButton
                    disabled={!selectedActiveIngredientSpecialPopulation.key}
                    size="xs"
                    appearance="primary"
                    color="orange"
                    icon={<InfoRound />}
                  />
                  </ButtonToolbar>
              </Col>
          </Row>
          <Row gutter={15}>
          <Col xs={24}>
          <Text>Considerations</Text>
          <Input as="textarea"
                    disabled={!isActive}
                     rows={9}  
                     value={selectedActiveIngredientSpecialPopulation.considerations}
                     onChange={e =>
                       setSelectedActiveIngredientSpecialPopulation({
                         ...selectedActiveIngredientSpecialPopulation,
                         considerations: String(e)
                       })
                     }
                     
                     />
          </Col> 
          </Row>
            <Row gutter={15}>
              <Col xs={24}>
                <Table
                 bordered
                 onRowClick={rowData => {
                   setSelectedActiveIngredientSpecialPopulation(rowData);
                 }}
                 rowClassName={isSelected}
                 data={specialPopulationListResponseData?.object ?? []}
                >
                  <Table.Column flexGrow={1}>
                    <Table.HeaderCell>Special Population</Table.HeaderCell>
                    <Table.Cell>
                    {rowData => <Text>{rowData.additionalPopulationLvalue ? rowData.additionalPopulationLvalue.lovDisplayVale : rowData.additionalPopulationLkey}</Text>}
             
                    </Table.Cell>
                  </Table.Column>
                  <Table.Column flexGrow={1}>
                    <Table.HeaderCell>Considerations</Table.HeaderCell>
                    <Table.Cell>
                    {rowData => <Text>{rowData.considerations}</Text>}
                    </Table.Cell>
                  </Table.Column>
                </Table>
              </Col>
            </Row>
          </Grid>
      </>
    );
  };
  
  export default SpecialPopulation;