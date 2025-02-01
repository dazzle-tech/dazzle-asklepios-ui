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
    InputPicker,
    InputGroup,
    Checkbox,
    SelectPicker,
    DatePicker
  } from 'rsuite';
import { Plus, Trash, InfoRound, Reload } from '@rsuite/icons';
import { MdSave } from 'react-icons/md';
import { newApActiveIngredient } from '@/types/model-types-constructor';
import { useGetActiveIngredientQuery, useSaveActiveIngredientMutation } from '@/services/medicationsSetupService';
import { initialListRequest, ListRequest } from '@/types/types';
import { ApActiveIngredient } from '@/types/model-types';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';

  const Toxicity = ({activeIngredients, isEdit}) => {
  
    const [isActive, setIsActive] = useState(false);
    const [activeIngredient, setActiveIngredient] = useState<ApActiveIngredient>({ ...newApActiveIngredient });
    const [listRequest, setListRequest] = useState<ListRequest>({ ...initialListRequest });
    const [saveActiveIngredient, saveActiveIngredientMutation] = useSaveActiveIngredientMutation();
    const { data: valueUnitLovQueryResponse } = useGetLovValuesByCodeQuery('VALUE_UNIT');
    const dispatch = useAppDispatch();
    const { data: activeIngredientListResponse } = useGetActiveIngredientQuery(listRequest);
     const save = () => {
    saveActiveIngredient({
      ...activeIngredient,
      createdBy: 'Administrator'
    }).unwrap().then(() => {
      dispatch(notify("Saved successfully"));
  });;

  };

  const handleNew = () => {
    setIsActive(true);
   };

   useEffect(() => {
    if (activeIngredients) {
      setActiveIngredient(activeIngredients)
    }
  }, [activeIngredients]);
  

    return (
      <>
          <Grid fluid>
            <Row gutter={15}>
            <Col xs={6}>
              <Text>Maximum Dose</Text>
              <Input
                 disabled={!isActive}
                 style={{ width: '180px' }}
                  type="text"
                  value={activeIngredient.toxicityMaximumDose}
                  onChange={e =>
                    setActiveIngredient({
                      ...activeIngredient,
                      toxicityMaximumDose: String(e)
                    })
                  }
                />
            </Col>
            <Col xs={6}>
              <Text>Per</Text>
              <InputPicker
                disabled={!isActive}
                placeholder="per"
                data={valueUnitLovQueryResponse?.object ?? []}
                value={activeIngredient.toxicityMaximumDosePerUnitLkey}
                onChange={e =>
                  setActiveIngredient({
                    ...activeIngredient,
                    toxicityMaximumDosePerUnitLkey: String(e)
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
                // onClick={handleOpenPopup}
                icon={<InfoRound />}
              />
{/* 
              <LogDialog
                ObjectListResponseData={activeIngredientIndication}
                popupOpen={popupOpen}
                setPopupOpen={setPopupOpen}
              /> */}
                  </ButtonToolbar>}
              </Col>
          </Row>
            <Row gutter={15}>
              <Col xs={24}>
              <Text>Toxicity</Text>
              <Input as="textarea"
                     disabled={!isActive}
                     rows={9}  
                     value={activeIngredient.toxicityDetails}
                     onChange={e =>
                       setActiveIngredient({
                         ...activeIngredient,
                         toxicityDetails: String(e)
                       })
                     }
                     />
              </Col>
            </Row>
          </Grid>
      </>
    );
  };
  
  export default Toxicity;