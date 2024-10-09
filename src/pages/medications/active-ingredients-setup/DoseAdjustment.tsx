import React, { useEffect, useState } from 'react';
import {
    IconButton,
    Input,
    Grid,
    Row,
    Col,
    ButtonToolbar,
    Text,
    Radio,
    CheckboxGroup,
    Checkbox,
    Panel
  } from 'rsuite';
  import { Plus, Trash, InfoRound, Reload } from '@rsuite/icons';
  import { MdSave } from 'react-icons/md';

  const DoseAdjustment = () => {
  
  const [renalDetails, setRenalDetails] = useState(false);

  const handleRenalAdj = () => {
      setRenalDetails(!renalDetails)
   };
 
   const [hepaticDetails, setHepaticDetails] = useState(false);

   const handleHepaticAdj = () => {
     setHepaticDetails(!hepaticDetails)
  };
    return (
      <>
          <Grid fluid> 
          <CheckboxGroup  name="checkbox-group">
            <Row gutter={15}>
            <Col xs={6}></Col>
            <Col xs={6}></Col>
            <Col xs={6}></Col>
            <Col xs={1}></Col>
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
            
            <Checkbox  value="A" onChange={handleRenalAdj}>Renal Adjustment</Checkbox>
            </Col>
            <Col xs={12}>
            <Checkbox  value="B" onChange={handleHepaticAdj} >Hepatic Adjustment</Checkbox>
            </Col>
          </Row>
          <Row gutter={15}>
           {renalDetails && 
           <Col xs={12}>
            <Text>CrCl 60-89 mL/min</Text>
            <Input as="textarea" rows={3}  /> 
           </Col> }
          {hepaticDetails &&
          <Col xs={12}>
          <Text>child-Pug A</Text>
          <Input as="textarea" rows={3}  />
          </Col> }
          </Row>
          <Row gutter={15}>
           {renalDetails && 
          <Col xs={12}>
           <Text>CrCl 30 to &lt;60 mL/min</Text>
          <Input as="textarea" rows={3}  />
          </Col> }
         
          {hepaticDetails && <Col xs={12}>
          <Text>child-Pug B</Text>
          <Input as="textarea" rows={3}  />
          </Col> }
          </Row>
          <Row gutter={15}>
           {renalDetails &&<Col xs={12}>
          <Text>CrCl 15 to &lt;30 mL/min</Text>
          <Input as="textarea" rows={3}  />
          </Col> }
          {hepaticDetails && <Col xs={12}>
          <Text>child-Pug C</Text>
          <Input as="textarea" rows={3}  />
          </Col> }
          </Row>
          <Row gutter={15}>
          {renalDetails &&<Col xs={12}>
          <Text>CrCl &lt;15 mL/min</Text>
          <Input as="textarea" rows={3}  />
          </Col> }
          <Col xs={12}>
          
          </Col> 
          </Row>
          </CheckboxGroup>
          </Grid>
      </>
    );
  };
  
  export default DoseAdjustment;