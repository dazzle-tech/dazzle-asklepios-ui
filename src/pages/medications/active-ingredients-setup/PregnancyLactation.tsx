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

  const PregnancyLactation = () => {
  
    const [activeIngredient, setActiveIngredient] = useState<ApActiveIngredient>({ ...newApActiveIngredient });
    const [listRequest, setListRequest] = useState<ListRequest>({ ...initialListRequest });
    const [saveActiveIngredient, saveActiveIngredientMutation] = useSaveActiveIngredientMutation();
    const { data: activeIngredientListResponse } = useGetActiveIngredientQuery(listRequest);
    const [selectedActiveIngredient, setSelectedActiveIngredient] = useState<ApActiveIngredient>({
      ...newApActiveIngredient
    });
    const [isActive, setIsActive] = useState(false);
    const { data: pregnancyCategoriesLovQueryResponseData } = useGetLovValuesByCodeQuery('PREGNANCY_CATEGORIES');
    const { data: breastfeedingCategoriesLovQueryResponseData } = useGetLovValuesByCodeQuery('FR_MED_CATEGORIES');


    const save = () => {
      saveActiveIngredient({
        ...selectedActiveIngredient, 
        createdBy: 'Administrator'
      }).unwrap();
        
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
                    disabled={!selectedActiveIngredient.key}
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
              <Text>Pregnancy Category</Text>
              <InputPicker
                disabled={!isActive}
                placeholder="Pregnancy Catagory"
                data={pregnancyCategoriesLovQueryResponseData?.object ?? []}
                value={selectedActiveIngredient.pregnancyCategoryLkey}
                onChange={e =>
                  setSelectedActiveIngredient({
                    ...selectedActiveIngredient,
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
                value={selectedActiveIngredient.lactationRiskLkey}
                onChange={e =>
                  setSelectedActiveIngredient({
                    ...selectedActiveIngredient,
                    pregnancyCategoryLkey: String(e)
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
          <Input as="textarea"  disabled={!isActive}  rows={9}  />
          </Col> 
          <Col xs={12}>
          <Input as="textarea"  disabled={!isActive} rows={9}  />
          </Col> 
          </Row>
           
          </Grid>
      </>
    );
  };
  
  export default PregnancyLactation;