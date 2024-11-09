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
  import {
    useGetLovValuesByCodeQuery,
  } from '@/services/setupService';

  import{
    useGetActiveIngredientDrugInteractionQuery,
    useGetActiveIngredientQuery,
    useSaveActiveIngredientDrugInteractionMutation,
    useRemoveActiveIngredientDrugInteractionMutation
  } from '@/services/medicationsSetupService';

import { ApActiveIngredientDrugInteraction } from '@/types/model-types';
import { newApActiveIngredientDrugInteraction} from '@/types/model-types-constructor';
import { initialListRequest, ListRequest } from '@/types/types';
import { conjureValueBasedOnKeyFromList } from '@/utils';

  const DrugDrugInteractions = ({activeIngredients, isEdit}) => {
  
    const [selectedActiveIngredientDrugInteraction, setSelectedActiveIngredientDrugInteraction] = useState<ApActiveIngredientDrugInteraction>({
      ...newApActiveIngredientDrugInteraction
    });
  
    const [activeIngredientDrugInteraction, setActiveIngredientDrugInteraction] = useState<ApActiveIngredientDrugInteraction>({ ...newApActiveIngredientDrugInteraction});
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
  
    const [activeIngredientsListRequest, setActiveIngredientsListRequest] = useState<ListRequest>({
      ...initialListRequest
    });

    const [saveActiveIngredientDrugInteraction, saveActiveIngredientDrugInteractionMutation] =  useSaveActiveIngredientDrugInteractionMutation();
    const [removeActiveIngredientDrugInteraction, removeActiveIngredientDrugInteractionMutation] =useRemoveActiveIngredientDrugInteractionMutation();
    const [isActive , setIsActive] = useState(false);

    const { data: drugListResponseData} = useGetActiveIngredientDrugInteractionQuery(listRequest);
    const { data: activeIngredientListResponseData} = useGetActiveIngredientQuery(activeIngredientsListRequest);
    const { data: severityLovQueryResponseData } = useGetLovValuesByCodeQuery('SEVERITY');
   
    const isSelected = rowData => {
      if (rowData && rowData.key === selectedActiveIngredientDrugInteraction.key) {
        return 'selected-row';
      } else return '';
    };

    const save = () => {
      saveActiveIngredientDrugInteraction({
        ...selectedActiveIngredientDrugInteraction, 
        activeIngredientKey: activeIngredients.key , 
        createdBy: 'Administrator'
      }).unwrap();
  
    };

    const handleDrugsNew = () => {
      setIsActive(true);
      setActiveIngredientDrugInteraction({ ...newApActiveIngredientDrugInteraction });
    };

    const remove = () => {
      if (selectedActiveIngredientDrugInteraction.key) {
        removeActiveIngredientDrugInteraction({
          ...selectedActiveIngredientDrugInteraction,
        }).unwrap();
      }
    };

    useEffect(() => {
      const updatedFilters =[
        {
          fieldName: 'active_ingredient_key',
          operator: 'match',
          value: activeIngredients.key || undefined
        },
        {
          fieldName: 'deleted_at',
          operator: 'isNull',
          value: undefined
        }
      ];
      setListRequest((prevRequest) => ({
        ...prevRequest,
        filters: updatedFilters,
      }));
    }, [activeIngredients.key]);

    useEffect(() => {
      if (saveActiveIngredientDrugInteractionMutation.isSuccess) {
        setListRequest({
          ...listRequest,
          timestamp: new Date().getTime()
        });
  
        setSelectedActiveIngredientDrugInteraction({ ...newApActiveIngredientDrugInteraction });
      }
    }, [saveActiveIngredientDrugInteractionMutation]);
  
    useEffect(() => {
      if (removeActiveIngredientDrugInteractionMutation.isSuccess) {
        setListRequest({
          ...listRequest,
          timestamp: new Date().getTime()
        });
  
        setSelectedActiveIngredientDrugInteraction({ ...newApActiveIngredientDrugInteraction });
      }
    }, [removeActiveIngredientDrugInteractionMutation]);


    return (
      <>
          <Grid fluid>
            <Row gutter={15}>
            <Col xs={6}>
              <Text>Active Ingredients</Text>
              <InputPicker
                disabled={!isActive}
                placeholder="Select A.I"
                data={activeIngredientListResponseData?.object ?? []}
                value={selectedActiveIngredientDrugInteraction.interactedActiveIngredientKey}
                onChange={e =>
                  setSelectedActiveIngredientDrugInteraction({
                    ...selectedActiveIngredientDrugInteraction,
                    interactedActiveIngredientKey: String(e)
                  })
                }
                labelKey="name"
                valueKey="key"
                style={{ width: 224 }}
              />
            </Col>
            <Col xs={6}>
              <Text>Severity</Text>
              <InputPicker
                disabled={!isActive}
                placeholder="Select Severity"
                data={severityLovQueryResponseData?.object ?? []}
                value={selectedActiveIngredientDrugInteraction.severityLkey}
                onChange={e =>
                  setSelectedActiveIngredientDrugInteraction({
                    ...selectedActiveIngredientDrugInteraction,
                    severityLkey: String(e)
                  })
                }
                labelKey="lovDisplayVale"
                valueKey="key"
                style={{ width: 224 }}
              />
            </Col>
            <Col xs={5}></Col>
            <Col xs={5}>
            {isEdit && <ButtonToolbar style={{ margin: '2px' }}>
              <IconButton
                  size="xs"
                  appearance="primary"
                  color="blue"
                  onClick={handleDrugsNew}
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
                    disabled={!selectedActiveIngredientDrugInteraction.key}
                    size="xs"
                    appearance="primary"
                    color="red"
                    onClick={remove}
                    icon={<Trash />}
                  />
                  <IconButton
                    disabled={!selectedActiveIngredientDrugInteraction.key}
                    size="xs"
                    appearance="primary"
                    color="orange"
                    icon={<InfoRound />}
                  />
                  </ButtonToolbar>}
              </Col>
          </Row>
          <Row gutter={15}>
          <Col xs={24}>
          <Text>Description</Text>
          <Input
           disabled={!isActive}
           as="textarea" 
           rows={3} 
           value={selectedActiveIngredientDrugInteraction.description}
                onChange={e =>
                  setSelectedActiveIngredientDrugInteraction({
                    ...selectedActiveIngredientDrugInteraction,
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
                    setSelectedActiveIngredientDrugInteraction(rowData);
                  }}
                  rowClassName={isSelected}
                  data={drugListResponseData?.object ?? []}
                >
                  <Table.Column flexGrow={1}>
                    <Table.HeaderCell>Active Ingredients</Table.HeaderCell>
                    <Table.Cell>
                    {rowData => (
                      <span>
                        {conjureValueBasedOnKeyFromList(
                          activeIngredientListResponseData?.object ?? [],
                          rowData.interactedActiveIngredientKey,
                          'name'
                        )}
                      </span>
                    )}
                    </Table.Cell>
                  </Table.Column>
                  <Table.Column flexGrow={1}>
                    <Table.HeaderCell>Severity</Table.HeaderCell>
                    <Table.Cell>
                    {rowData =>
                    rowData.severityLvalue ? rowData.severityLvalue.lovDisplayVale : rowData.severityLkey
                        }
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
  
  export default DrugDrugInteractions;