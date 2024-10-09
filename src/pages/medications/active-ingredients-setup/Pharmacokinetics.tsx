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

  const Pharmacokinetics = () => {
  
    const [activeIngredient, setActiveIngredient] = useState<ApActiveIngredient>({ ...newApActiveIngredient });
    const [listRequest, setListRequest] = useState<ListRequest>({ ...initialListRequest });
    const [saveActiveIngredient, saveActiveIngredientMutation] = useSaveActiveIngredientMutation();
    const { data: activeIngredientListResponse } = useGetActiveIngredientQuery(listRequest);
    const [selectedActiveIngredient, setSelectedActiveIngredient] = useState<ApActiveIngredient>({
      ...newApActiveIngredient
    });


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
              <ButtonToolbar style={{ margin: '2px' }}>
              <IconButton
                  size="xs"
                  appearance="primary"
                  color="green"
                  icon={<MdSave />}
                />
              <IconButton
                    size="xs"
                    appearance="primary"
                    color="blue"
                    icon={<Reload />}
                  />
                   <IconButton
                    size="xs"
                    appearance="primary"
                    color="red"
                    icon={<Trash />}
                  />
                  <IconButton
                    size="xs"
                    appearance="primary"
                    color="orange"
                    icon={<InfoRound />}
                  />
                  </ButtonToolbar>
              </Col>
          </Row>
          <Row gutter={15}>
          <Col xs={12}>
          <Text>Absorption</Text>
          <Input as="textarea" 
                 rows={3} 
                 value={selectedActiveIngredient.pharmaAbsorption}
                 onChange={e =>
                   setSelectedActiveIngredient({
                     ...selectedActiveIngredient,
                     pharmaAbsorption: String(e)
                   }) }
                   />
          </Col> 
          <Col xs={12}>
          <Text>Rout Of Elimination</Text>
          <Input as="textarea"
                  rows={3}
                  value={selectedActiveIngredient.pharmaRouteOfElimination}
                  onChange={e =>
                    setSelectedActiveIngredient({
                      ...selectedActiveIngredient,
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
                 value={selectedActiveIngredient.pharmaVolumeOfDistribution}
                  onChange={e =>
                    setSelectedActiveIngredient({
                      ...selectedActiveIngredient,
                      pharmaRouteOfElimination: String(e)
                    }) }
                 />
          </Col> 
          <Col xs={12}>
          <Text>Half-Life</Text>
          <Input as="textarea"
                 rows={3}  
                 value={selectedActiveIngredient.pharmaHalfLife}
                  onChange={e =>
                    setSelectedActiveIngredient({
                      ...selectedActiveIngredient,
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
                 value={selectedActiveIngredient.pharmaProteinBinding}
                  onChange={e =>
                    setSelectedActiveIngredient({
                      ...selectedActiveIngredient,
                      pharmaProteinBinding: String(e)
                    }) }
                     />
          </Col> 
          <Col xs={12}>
          <Text>Clearance</Text>
          <Input as="textarea" 
                 rows={3} 
                 value={selectedActiveIngredient.pharmaClearance}
                  onChange={e =>
                    setSelectedActiveIngredient({
                      ...selectedActiveIngredient,
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
                 value={selectedActiveIngredient.pharmaMetabolism}
                  onChange={e =>
                    setSelectedActiveIngredient({
                      ...selectedActiveIngredient,
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