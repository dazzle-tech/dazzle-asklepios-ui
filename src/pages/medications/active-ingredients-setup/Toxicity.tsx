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

  const Toxicity = () => {
  
    const [isActive, setIsActive] = useState(false);
    const [activeIngredient, setActiveIngredient] = useState<ApActiveIngredient>({ ...newApActiveIngredient });
    const [listRequest, setListRequest] = useState<ListRequest>({ ...initialListRequest });
    const [saveActiveIngredient, saveActiveIngredientMutation] = useSaveActiveIngredientMutation();
    const { data: activeIngredientListResponse } = useGetActiveIngredientQuery(listRequest);
    const [selectedActiveIngredient, setSelectedActiveIngredient] = useState<ApActiveIngredient>({
      ...newApActiveIngredient
    });
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
            <Row gutter={15}>
            <Col xs={6}>
              <Text>Maximum Dose</Text>
              <Input
                 disabled={!isActive}
                 style={{ width: '180px' }}
                  type="text"
                  value={selectedActiveIngredient.toxicityMaximumDose}
                  onChange={e =>
                    setSelectedActiveIngredient({
                      ...selectedActiveIngredient,
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
                data={activeIngredientListResponse?.object ?? []}
                value={selectedActiveIngredient.toxicityMaximumDosePerUnitLkey}
                onChange={e =>
                  setSelectedActiveIngredient({
                    ...selectedActiveIngredient,
                    toxicityMaximumDosePerUnitLkey: String(e)
                  })
                }
                labelKey="name"
                valueKey="key"
                style={{ width: 224 }}
              />
            </Col>
            <Col xs={5}></Col>
            <Col xs={5}>
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
                // onClick={handleOpenPopup}
                icon={<InfoRound />}
              />
{/* 
              <LogDialog
                ObjectListResponseData={selectedActiveIngredientIndication}
                popupOpen={popupOpen}
                setPopupOpen={setPopupOpen}
              /> */}
                  </ButtonToolbar>
              </Col>
          </Row>
            <Row gutter={15}>
              <Col xs={24}>
              <Text>Toxicity</Text>
              <Input as="textarea"
                     disabled={!isActive}
                     rows={9}  
                     value={selectedActiveIngredient.toxicityDetails}
                     onChange={e =>
                       setSelectedActiveIngredient({
                         ...selectedActiveIngredient,
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