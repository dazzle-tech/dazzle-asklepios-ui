import React, { useEffect, useState } from 'react';
import {
    IconButton,
    Input,
    Grid,
    Row,
    Col,
    ButtonToolbar,
    Text,
    Radio
  } from 'rsuite';
  import { Plus, Trash, InfoRound, Reload } from '@rsuite/icons';
  import { MdSave } from 'react-icons/md';
import { newApActiveIngredient } from '@/types/model-types-constructor';
import { ApActiveIngredient } from '@/types/model-types';
import { useGetActiveIngredientQuery, useSaveActiveIngredientMutation } from '@/services/medicationsSetupService';
import { initialListRequest, ListRequest } from '@/types/types';

  const Pharmacokinetics = ({activeIngredients, isEdit}) => {
  
    const [activeIngredient, setActiveIngredient] = useState<ApActiveIngredient>({ ...newApActiveIngredient });
    const [listRequest, setListRequest] = useState<ListRequest>({ ...initialListRequest });
    const [saveActiveIngredient, saveActiveIngredientMutation] = useSaveActiveIngredientMutation();
    const { data: activeIngredientListResponse } = useGetActiveIngredientQuery(listRequest);
    const [isActive, setIsActive] = useState(false);

    useEffect(() => {
      if (activeIngredients) {
        setActiveIngredient(activeIngredients)
      }
    }, [activeIngredients]);

    const save = () => {
      saveActiveIngredient({
        ...activeIngredient, 
        createdBy: 'Administrator'
      }).unwrap();
        
    };

    const handleNew = () => {
      setIsActive(true);
     };


    return (
      <>
          <Grid fluid>
            <Row gutter={15}>
            <Col xs={6}>
            </Col>
            <Col xs={6}>
            </Col>
            <Col xs={5}></Col>
            <Col xs={5}>
            {isEdit && <ButtonToolbar style={{ margin: '2px' }}>
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
                    disabled={!activeIngredient.key}
                    size="xs"
                    appearance="primary"
                    color="orange"
                    icon={<InfoRound />}
                  />
                  </ButtonToolbar>}
              </Col>
          </Row>
          <Row gutter={15}>
          <Col xs={12}>
          <Text>Absorption</Text>
          <Input as="textarea" 
                 rows={3} 
                 disabled={!isActive}
                 value={activeIngredient.pharmaAbsorption}
                 onChange={e =>
                   setActiveIngredient({
                     ...activeIngredient,
                     pharmaAbsorption: String(e)
                   }) }
                   />
          </Col> 
          <Col xs={12}>
          <Text>Rout Of Elimination</Text>
          <Input as="textarea"
           disabled={!isActive}
                  rows={3}
                  value={activeIngredient.pharmaRouteOfElimination}
                  onChange={e =>
                    setActiveIngredient({
                      ...activeIngredient,
                      pharmaRouteOfElimination: String(e)
                    }) }
                  />
          </Col> 
          </Row>
          <Row gutter={15}>
          <Col xs={12}>
          <Text>Volume Of Distribution</Text>
          <Input as="textarea"
                 rows={3} 
                 disabled={!isActive}
                 value={activeIngredient.pharmaVolumeOfDistribution}
                  onChange={e =>
                    setActiveIngredient({
                      ...activeIngredient,
                      pharmaVolumeOfDistribution: String(e)
                    }) }
                 />
          </Col> 
          <Col xs={12}>
          <Text>Half-Life</Text>
          <Input as="textarea"
                 rows={3}  
                 disabled={!isActive}
                 value={activeIngredient.pharmaHalfLife}
                  onChange={e =>
                    setActiveIngredient({
                      ...activeIngredient,
                      pharmaHalfLife: String(e)
                    }) }
                 />
          </Col> 
          </Row>
          <Row gutter={15}>
          <Col xs={12}>
          <Text>Protein Binding</Text>
          <Input as="textarea" 
                 rows={3} 
                 disabled={!isActive}
                 value={activeIngredient.pharmaProteinBinding}
                  onChange={e =>
                    setActiveIngredient({
                      ...activeIngredient,
                      pharmaProteinBinding: String(e)
                    }) }
                     />
          </Col> 
          <Col xs={12}>
          <Text>Clearance</Text>
          <Input as="textarea" 
                 rows={3} 
                 disabled={!isActive}
                 value={activeIngredient.pharmaClearance}
                  onChange={e =>
                    setActiveIngredient({
                      ...activeIngredient,
                      pharmaClearance: String(e)
                    }) }
                 />
          </Col> 
          </Row>
          <Row gutter={15}>
          <Col xs={12}>
          <Text>Metabolism</Text>
          <Input as="textarea" 
                 rows={3} 
                 disabled={!isActive}
                 value={activeIngredient.pharmaMetabolism}
                  onChange={e =>
                    setActiveIngredient({
                      ...activeIngredient,
                      pharmaMetabolism: String(e)
                    }) }
                 />
          </Col> 
          <Col xs={12}>
          
          </Col> 
          </Row>
          </Grid>
      </>
    );
  };
  
  export default Pharmacokinetics;