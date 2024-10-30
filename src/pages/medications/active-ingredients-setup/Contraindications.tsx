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
  } from 'rsuite';
import { Trash, InfoRound, Reload, Plus  } from '@rsuite/icons';
import { MdSave } from 'react-icons/md';
import { initialListRequest } from '@/types/types';
import { newApActiveIngredientContraindication } from '@/types/model-types-constructor';
import { ApActiveIngredientContraindication } from '@/types/model-types';
import {
  useGetActiveIngredientContraindicationQuery,
  useRemoveActiveIngredientContraindicationMutation,
  useSaveActiveIngredientContraindicationMutation
} from '@/services/medicationsSetupService';


  const Contraindications = ({activeIngredients, isEdit}) => {


    const [isActive , setIsActive] = useState(false);
    const [selectedActiveIngredientContraindication, setSelectedActiveIngredientContraindication] = useState({
      ...newApActiveIngredientContraindication
    });
  
    const [activeIngredientContraindication, setActiveIngredientContraindication] = useState<ApActiveIngredientContraindication>({ ...newApActiveIngredientContraindication});
    const [listRequest, setListRequest] = useState({
      ...initialListRequest,
      pageSize: 100,
      timestamp: new Date().getMilliseconds(),
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
  
    const { data: ContraindicationsListResponseData } = useGetActiveIngredientContraindicationQuery(listRequest);
    const [saveActiveIngredientContraindication, saveActiveIngredientContraindicationMutation] =
    useSaveActiveIngredientContraindicationMutation();
  const [removeActiveIngredientContraindication, removeActiveIngredientContraindicationMutation] =
    useRemoveActiveIngredientContraindicationMutation();
    
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
      if (activeIngredients) {
        setActiveIngredientContraindication(prevState => ({
          ...prevState,
          activeIngredientKey: activeIngredients.key
        }));
      }
    }, [activeIngredients]);

    const save = () => {
      saveActiveIngredientContraindication({
        ...selectedActiveIngredientContraindication,
        activeIngredientKey: activeIngredients.key , 
        createdBy: 'Administrator'
      }).unwrap();
        
    };

    useEffect(() => {
      if (saveActiveIngredientContraindicationMutation.isSuccess) {
        setListRequest({
          ...listRequest,
          timestamp: new Date().getTime()
        });
  
        setSelectedActiveIngredientContraindication({ ...newApActiveIngredientContraindication });
      }
    }, [saveActiveIngredientContraindicationMutation]);

    useEffect(() => {
      if (removeActiveIngredientContraindicationMutation.isSuccess) {
        setListRequest({
          ...listRequest,
          timestamp: new Date().getTime()
        });
        setIsActive(false);
        setSelectedActiveIngredientContraindication({ ...newApActiveIngredientContraindication });
      }
    }, [removeActiveIngredientContraindicationMutation]);
  
    const remove = () => {
      if (selectedActiveIngredientContraindication.key) {
        removeActiveIngredientContraindication({
          ...selectedActiveIngredientContraindication,
          deletedBy: 'Administrator'
        }).unwrap();
      }
    };

    const handleContraindicationsNew = () => {
      setIsActive(true);
      setActiveIngredientContraindication({ ...newApActiveIngredientContraindication, activeIngredientKey: activeIngredients.Key });
    };
  
    const isSelected = rowData => {
      if (rowData && rowData.key === selectedActiveIngredientContraindication.key) {
        return 'selected-row';
      } else return '';
    };

    return (
      <>
          <Grid fluid>
            <Row gutter={15}>
              <Col xs={2}>
              <Input
                 disabled={!isActive}
                 style={{ width: '300px' }}
                  type="text"
                  value={selectedActiveIngredientContraindication.contraindication}
                  onChange={e =>
                    setSelectedActiveIngredientContraindication({
                      ...selectedActiveIngredientContraindication,
                      contraindication: String(e)
                    })
                  }
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
              <Col xs={6}></Col>
              <Col xs={5}>
              {isEdit && <ButtonToolbar style={{ margin: '1px' }}>
              <IconButton
                  size="xs"
                  appearance="primary"
                  color="blue"
                  onClick={handleContraindicationsNew}
                  icon={<Plus />}
                />
              <IconButton
                  size="xs"
                  appearance="primary"
                  color="green"
                  onClick={save}
                  icon={<MdSave />}
                />
                   <IconButton
                   disabled={!selectedActiveIngredientContraindication.key}
                    size="xs"
                    appearance="primary"
                    color="red"
                    onClick={remove}
                    icon={<Trash />}
                  />
                  <IconButton
                  disabled={!selectedActiveIngredientContraindication.key}
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
                <Table
                   bordered
                   onRowClick={rowData => {
                     setSelectedActiveIngredientContraindication(rowData);
                   }}
                   rowClassName={isSelected}
                   data={ContraindicationsListResponseData?.object ?? []}
                >
                  <Table.Column flexGrow={1}>
                    <Table.HeaderCell align='center'>Contraindications</Table.HeaderCell>
                    <Table.Cell>
                    {rowData => <Text>{rowData.contraindication}</Text>}
                    </Table.Cell>
                  </Table.Column>
                </Table>
              </Col>
            </Row>
          </Grid>
      </>
    );
  };
  
  export default Contraindications;