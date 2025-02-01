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
    InputPicker,
    SelectPicker,
    DatePicker
  } from 'rsuite';
  import { Plus, Trash, InfoRound, Reload } from '@rsuite/icons';
  import { MdSave } from 'react-icons/md';
import { ApActiveIngredient } from '@/types/model-types';
import { newApActiveIngredient } from '@/types/model-types-constructor';
import { initialListRequest, ListRequest } from '@/types/types';
import { useGetActiveIngredientQuery, useSaveActiveIngredientMutation } from '@/services/medicationsSetupService';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';


  const PregnancyLactation = ({activeIngredients, isEdit}) => {
  
    const [activeIngredient, setActiveIngredient] = useState<ApActiveIngredient>({ ...newApActiveIngredient });
    const [listRequest, setListRequest] = useState<ListRequest>({ ...initialListRequest });
    const [saveActiveIngredient, saveActiveIngredientMutation] = useSaveActiveIngredientMutation();
    const { data: activeIngredientListResponse } = useGetActiveIngredientQuery(listRequest);
    const [isActive, setIsActive] = useState(false);
    const { data: pregnancyCategoriesLovQueryResponseData } = useGetLovValuesByCodeQuery('PREGNANCY_CATEGORIES');
    const { data: breastfeedingCategoriesLovQueryResponseData } = useGetLovValuesByCodeQuery('FR_MED_CATEGORIES');
    const dispatch = useAppDispatch();
    
    useEffect(() => {
      if (activeIngredients) {
        setActiveIngredient(activeIngredients)
      }
    }, [activeIngredients]);

    const save = () => {
      saveActiveIngredient({
        ...activeIngredient, 
        createdBy: 'Administrator'
      }).unwrap().then(() => {
        dispatch(notify("Saved successfully"));
    });
        
    };
    
    const handleNew = () => {
      setIsActive(true);
     };
  

    return (
      <>
          <Grid fluid>
            <Row >
            <Col xs={6}></Col>
            <Col xs={6}></Col>
            <Col xs={6}></Col>
            <Col xs={6}>
           { isEdit && <ButtonToolbar style={{ margin: '2px' }}>
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
                  </ButtonToolbar> }
              </Col>
            </Row>
            <Row gutter={15}>
            <Col xs={12}>
              <Text>Pregnancy Category</Text>
              <InputPicker
                disabled={!isActive}
                placeholder="Pregnancy Catagory"
                data={pregnancyCategoriesLovQueryResponseData?.object ?? []}
                value={activeIngredient.pregnancyCategoryLkey}
                onChange={e =>
                  setActiveIngredient({
                    ...activeIngredient,
                    pregnancyCategoryLkey: String(e)
                  })
                }
                labelKey="lovDisplayVale"
                valueKey="key"
                style={{ width: 224 }}
              />
            </Col>
            <Col xs={12}>
              <Text>Breastfeeding Category</Text>
              <InputPicker
                disabled={!isActive}
                placeholder="Breastfeeding Category"
                data={breastfeedingCategoriesLovQueryResponseData?.object ?? []}
                value={activeIngredient.lactationRiskLkey}
                onChange={e =>
                  setActiveIngredient({
                    ...activeIngredient,
                    lactationRiskLkey: String(e)
                  })
                }
                labelKey="lovDisplayVale"
                valueKey="key"
                style={{ width: 224 }}
              />
            </Col>
          </Row>
          <Row gutter={15}>
          <Col xs={12}>
          <Input as="textarea"
                     disabled={!isActive}
                     rows={9}  
                     value={activeIngredient.pregnancyNotes}
                     onChange={e =>
                       setActiveIngredient({
                         ...activeIngredient,
                         pregnancyNotes: String(e)
                       })
                     }
                     />
          </Col> 
          <Col xs={12}>
          <Input as="textarea"
                     disabled={!isActive}
                     rows={9}  
                     value={activeIngredient.lactationRiskNotes}
                     onChange={e =>
                       setActiveIngredient({
                         ...activeIngredient,
                         lactationRiskNotes: String(e)
                       })
                     }
                     />
          </Col> 
          </Row>
           
          </Grid>
      </>
    );
  };
  
  export default PregnancyLactation;