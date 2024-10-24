import React, { useEffect, useState } from 'react';
import {
    IconButton,
    Input,
    Grid,
    Row,
    Col,
    ButtonToolbar,
    Text
  } from 'rsuite';
  import { Plus, Trash, InfoRound, Reload } from '@rsuite/icons';
  import { MdSave } from 'react-icons/md';
  import { initialListRequest, ListRequest } from '@/types/types';
  import { ApActiveIngredient} from '@/types/model-types';
  import { newApActiveIngredient } from '@/types/model-types-constructor';
  import{
  useGetActiveIngredientQuery,
  useSaveActiveIngredientMutation
     } from '@/services/medicationsSetupService';

  const MOA = ({activeIngredients, isEdit}) => {
    const [activeIngredient, setActiveIngredient] = useState<ApActiveIngredient>({ ...newApActiveIngredient });
    const [isActive, setIsActive] = useState(false);
    const [saveActiveIngredient, saveActiveIngredientMutation] = useSaveActiveIngredientMutation();
   
    const handleSave = () => {
      setIsActive(true); 
      saveActiveIngredient(activeIngredient).unwrap();
    };

    const save = () => {
      saveActiveIngredient({
        ...activeIngredient,
        createdBy: 'Administrator'
      }).unwrap();
  
    };

  
    useEffect(() => {
      if (activeIngredients) {
        setActiveIngredient(activeIngredients)
      }
    }, [activeIngredients]);
  

    return (
      <>
          <Grid fluid>
          <Row gutter={25}>
          <Col xs={12}>
          <Text>Mechanism Of Actions</Text>
          </Col>
          <Col xs={6}></Col>
          <Col xs={5}>
             {isEdit && <ButtonToolbar style={{ margin: '2px' }}>
              <IconButton
                size="xs"
                appearance="primary"
                color="blue"
                onClick={handleSave}
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
                disabled={!activeIngredient.key}
                size="xs"
                appearance="primary"
                color="orange"
                // onClick={handleOpenPopup}
                icon={<InfoRound />}
              />
                  </ButtonToolbar>}
              </Col> 
          </Row>
          <Row gutter={25}>
          <Col xs={24}>
              <Input as="textarea"
                disabled={!isActive}
                rows={9}
                value={activeIngredient.mechanismOfAction}
                onChange={e =>
                  setActiveIngredient({
                    ...activeIngredient,
                    mechanismOfAction: String(e)
                  })
                }

              />
          </Col>
          </Row>
          </Grid>
      </>
    );
  };
  
  export default MOA;