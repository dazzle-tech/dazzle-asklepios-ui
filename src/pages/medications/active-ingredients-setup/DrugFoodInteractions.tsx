import React, { useEffect, useState } from 'react';
import {
    FlexboxGrid,
    IconButton,
    Input,
    Panel,
    Table,
    Grid,
    Row,
    Col,
    ButtonToolbar,
    Text,
    InputGroup,
    Checkbox,
    SelectPicker,
    InputPicker,
    DatePicker
  } from 'rsuite';
  import { Plus, Trash, InfoRound, Reload } from '@rsuite/icons';
  import { MdSave } from 'react-icons/md';
  import { ApActiveIngredientFoodInteraction } from '@/types/model-types';
  import { newApActiveIngredientFoodInteraction} from '@/types/model-types-constructor';
  import { initialListRequest, ListRequest } from '@/types/types';
  import{
    useGetLovValuesByCodeQuery,
  } from '@/services/setupService';
  import {
    useGetActiveIngredientFoodInteractionQuery,
    useSaveActiveIngredientFoodInteractionMutation,
    useRemoveActiveIngredientFoodInteractionMutation
  } from '@/services/medicationsSetupService';



  const DrugFoodInteractions = () => {
  

    const [selectedActiveIngredientFoodInteraction, setSelectedActiveIngredientFoodInteraction] = useState<ApActiveIngredientFoodInteraction>({
      ...newApActiveIngredientFoodInteraction
    });
  
    const [activeIngredientFoodInteraction, setActiveIngredientFoodInteraction] = useState<ApActiveIngredientFoodInteraction>({ ...newApActiveIngredientFoodInteraction});
    const [listRequest, setListRequest] = useState({
      ...initialListRequest,
      pageSize: 100,
      sortBy: 'createdAt',
      sortType: 'desc',
      filters: [
        {
          fieldName: 'deleted_at',
          operator: 'isNull',
          value: undefined
        }
      ]
    });

    
    const [saveActiveIngredientFoodInteraction, saveActiveIngredientFoodInteractionMutation] =  useSaveActiveIngredientFoodInteractionMutation();
    const [removeActiveIngredientFoodInteraction, removeActiveIngredientFoodInteractionMutation] =useRemoveActiveIngredientFoodInteractionMutation();
    const [isActive , setIsActive] = useState(false);

    const { data: foodListResponseData} = useGetActiveIngredientFoodInteractionQuery(listRequest);
    const { data: severityLovQueryResponseData } = useGetLovValuesByCodeQuery('SEVERITY');
   
    const isSelected = rowData => {
      if (rowData && rowData.key === selectedActiveIngredientFoodInteraction.key) {
        return 'selected-row';
      } else return '';
    };

    const save = () => {
      saveActiveIngredientFoodInteraction({
        ...selectedActiveIngredientFoodInteraction, 
        createdBy: 'Administrator'
      }).unwrap();
        
    };

    const handleFoodsNew = () => {
      setIsActive(true);
      setActiveIngredientFoodInteraction({ ...newApActiveIngredientFoodInteraction });
    };

    const remove = () => {
      if (selectedActiveIngredientFoodInteraction.key) {
        removeActiveIngredientFoodInteraction({
          ...selectedActiveIngredientFoodInteraction,
        }).unwrap();
      }
    };

    useEffect(() => {
      if (saveActiveIngredientFoodInteractionMutation.isSuccess) {
        setListRequest({
          ...listRequest,
          timestamp: new Date().getTime()
        });
  
        setSelectedActiveIngredientFoodInteraction({ ...newApActiveIngredientFoodInteraction });
      }
    }, [saveActiveIngredientFoodInteractionMutation]);
  
    useEffect(() => {
      if (removeActiveIngredientFoodInteractionMutation.isSuccess) {
        setListRequest({
          ...listRequest,
          timestamp: new Date().getTime()
        });
  
        setSelectedActiveIngredientFoodInteraction({ ...newApActiveIngredientFoodInteraction });
      }
    }, [removeActiveIngredientFoodInteractionMutation]);

  
    return (
      <>
          <Grid fluid>
            <Row gutter={15}>
            <Col xs={6}>
              <Text>Food</Text>
              < InputPicker
              disabled={!isActive}
               data={severityLovQueryResponseData?.object ?? []}
               value={selectedActiveIngredientFoodInteraction.activeIngredientKey}
               onChange={e =>
                 setSelectedActiveIngredientFoodInteraction({
                   ...selectedActiveIngredientFoodInteraction,
                   activeIngredientKey: String(e)
                 })
               }
               labelKey="lovDisplayVale" 
               valueKey="key"
               style={{ width: 224 }}
                />
            </Col>
            <Col xs={4}>
             
             </Col>
             <Col xs={1}>
             </Col>
             <Col xs={4}>
             </Col>
             <Col xs={1}>
             </Col>
            <Col xs={5}>
              <ButtonToolbar style={{ margin: '2px' }}>
              <IconButton
                  size="xs"
                  appearance="primary"
                  color="blue"
                  onClick={handleFoodsNew}
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
                    disabled={!selectedActiveIngredientFoodInteraction.key}
                    size="xs"
                    appearance="primary"
                    color="red"
                    onClick={remove}
                    icon={<Trash />}
                  />
                  <IconButton
                    disabled={!selectedActiveIngredientFoodInteraction.key}
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
          <Text>Description</Text>
          <Input 
          disabled={!isActive}
          as="textarea" 
          rows={3}  
          value={selectedActiveIngredientFoodInteraction.description}
          onChange={e =>
            setSelectedActiveIngredientFoodInteraction({
              ...selectedActiveIngredientFoodInteraction,
              description: String(e)
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
                     setSelectedActiveIngredientFoodInteraction(rowData);
                   }}
                   rowClassName={isSelected}
                   data={foodListResponseData?.object ?? []}
                >
                  <Table.Column flexGrow={1}>
                    <Table.HeaderCell>Active Ingredients</Table.HeaderCell>
                    <Table.Cell>
                    {rowData => <Text>{rowData.activeIngredientLvalue ? rowData.activeIngredientLvalue.lovDisplayVale : rowData.activeIngredientKey }</Text>}
                    </Table.Cell>
                  </Table.Column>
                  <Table.Column flexGrow={1}>
                    <Table.HeaderCell>Food</Table.HeaderCell>
                    <Table.Cell>
                    {rowData => <Text>{rowData.foodDescription}</Text>}
                    </Table.Cell>
                  </Table.Column>
                  <Table.Column flexGrow={1}>
                    <Table.HeaderCell>Description</Table.HeaderCell>
                    <Table.Cell>
                    {rowData => <Text>{rowData.description}</Text>}
                    </Table.Cell>
                  </Table.Column>
                </Table>
              </Col>
            </Row>
          </Grid>
      </>
    );
  };
  
  export default DrugFoodInteractions;