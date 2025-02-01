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
import { initialListRequest, ListRequest } from '@/types/types';
import { newApActiveIngredient } from '@/types/model-types-constructor';
import { ApActiveIngredient } from '@/types/model-types';
import { useGetActiveIngredientQuery, useSaveActiveIngredientMutation } from '@/services/medicationsSetupService';
import { Console } from 'console';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';


  const DoseAdjustment = ({activeIngredients, isEdit}) => {
  
  const [activeIngredient, setActiveIngredient] = useState<ApActiveIngredient>({ ...newApActiveIngredient });
  const [listRequest, setListRequest] = useState<ListRequest>({ ...initialListRequest });
  const [saveActiveIngredient, saveActiveIngredientMutation] = useSaveActiveIngredientMutation();
  const { data: activeIngredientListResponse } = useGetActiveIngredientQuery(listRequest);
  const [isActive, setIsActive] = useState(false); 
  const [renalDetails, setRenalDetails] = useState(false);
  const [hepaticDetails, setHepaticDetails] = useState(false);
  const dispatch = useAppDispatch();
    
  const handleHepaticAdj = () => {
    setHepaticDetails(!hepaticDetails),
    handleChangeHepatic
 };
  const handleRenalAdj = () => {
      setRenalDetails(!renalDetails) ,
      handleChangeRenal
   };

   useEffect(() => {
    if (activeIngredients) {
      setActiveIngredient(activeIngredients),
      setRenalDetails(activeIngredient.doseAdjustmentRenal);
      setHepaticDetails(activeIngredient.doseAdjustmentHepatic)

    }
  }, [activeIngredients]);

  const save = () => {
    saveActiveIngredient({
      ...activeIngredient, 
      createdBy: 'Administrator'
    }).unwrap().then(() => {
      dispatch(notify("Added successfully"));
  });
      
  };

  const handleChangeHepatic = () => {
    setActiveIngredient({
      ...activeIngredient,
      doseAdjustmentHepatic: hepaticDetails,
    });
  };
  const handleChangeRenal = () => {
    setActiveIngredient({
      ...activeIngredient,
      doseAdjustmentRenal:  renalDetails, 
    });
    console.log(activeIngredient.doseAdjustmentRenal+ "HELLLLLO")
  };
  
  const handleNew = () => {
    setIsActive(true);
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
            
            <Checkbox disabled={!isActive} 
            value="A"
              onChange={handleRenalAdj}
            >Renal Adjustment</Checkbox>
            </Col>
            <Col xs={12}>
            <Checkbox
             disabled={!isActive}
            checked={hepaticDetails}
            onChange={handleHepaticAdj}
            >Hepatic Adjustment</Checkbox>
            </Col>
          </Row>
          <Row gutter={15}>
           <Col xs={12}>
           {renalDetails && <div>
            <Text>CrCl 60-89 mL/min</Text>
            <Input 
             rows={3}  
             as="textarea"
             value={activeIngredient.doseAdjRenalOne}
             onChange={e =>
               setActiveIngredient({
                 ...activeIngredient,
                 doseAdjRenalOne: String(e)
               })
             }
            /> 
            </div>
              }
              </Col>
          
          <Col xs={12}>
          {hepaticDetails && <div>
             <Text>child-Pug A</Text>
          <Input  rows={3}  
          as="textarea"
          value={activeIngredient.doseAdjPugA}
          onChange={e =>
            setActiveIngredient({
              ...activeIngredient,
              doseAdjPugA: String(e)
            })
          } />
          </div>}
          </Col> 
          </Row>
          <Row gutter={15}>
           
          <Col xs={12}>
          {renalDetails && <div>
             <Text>CrCl 30 to &lt;60 mL/min</Text>
          <Input  rows={3}  
          as="textarea"
          value={activeIngredient.doseAdjRenalTwo}
          onChange={e =>
            setActiveIngredient({
              ...activeIngredient,
              doseAdjRenalTwo: String(e)
            })
          } />
          </div>}
          </Col> 
         
          <Col xs={12}>
          {hepaticDetails && <div>
            <Text>child-Pug B</Text>
          <Input  rows={3}  
          as="textarea"
          value={activeIngredient.doseAdjPugB}
          onChange={e =>
            setActiveIngredient({
              ...activeIngredient,
              doseAdjPugB: String(e)
            })
          } />
          </div> }
          </Col> 
          </Row>
          <Row gutter={15}>
          <Col xs={12}>
          {renalDetails && <div>
            <Text>CrCl 15 to &lt;30 mL/min</Text>
          <Input
           rows={3}  
           as="textarea"
           value={activeIngredient.doseAdjRenalThree}
           onChange={e =>
             setActiveIngredient({
               ...activeIngredient,
               doseAdjRenalThree: String(e)
             })
           }
          />
          </div>}
          </Col> 
          <Col xs={12}>
           {hepaticDetails && <div>
            <Text>child-Pug C</Text>
          <Input 
           rows={3}  
           as="textarea"
           value={activeIngredient.doseAdjPugC}
           onChange={e =>
             setActiveIngredient({
               ...activeIngredient,
               doseAdjPugC: String(e)
             })
           }
          />
            </div>
          }
          </Col> 
          </Row>
          <Row gutter={15}>
          <Col xs={12}>
          {renalDetails && <div>
            <Text>CrCl &lt;15 mL/min</Text>
          <Input 
          rows={3}  
          as="textarea"
          value={activeIngredient.doseAdjRenalFour}
          onChange={e =>
            setActiveIngredient({
              ...activeIngredient,
              doseAdjRenalFour: String(e)
            })
          }
          />
            </div>}
          </Col> 
          <Col xs={12}>
          
          </Col> 
          </Row>
          </CheckboxGroup>
          </Grid>
      </>
    );
  };
  
  export default DoseAdjustment;