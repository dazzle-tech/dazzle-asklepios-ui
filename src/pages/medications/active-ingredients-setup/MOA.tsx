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

  const MOA = () => {
    const [activeIngredient, setActiveIngredient] = useState<ApActiveIngredient>({ ...newApActiveIngredient });
    const [listRequest, setListRequest] = useState<ListRequest>({ ...initialListRequest });
    const [isActive, setIsActive] = useState(false);
    const [saveActiveIngredient, saveActiveIngredientMutation] = useSaveActiveIngredientMutation();
    const { data: activeIngredientListResponse } = useGetActiveIngredientQuery(listRequest);
    const [selectedActiveIngredient, setSelectedActiveIngredient] = useState<ApActiveIngredient>({
      ...newApActiveIngredient
    });

    const handleSave = () => {
      setIsActive(true); 
      saveActiveIngredient(activeIngredient).unwrap();
    };

    const save = () => {
      saveActiveIngredient({
        ...selectedActiveIngredient,
        createdBy: 'Administrator'
      }).unwrap();
  
    };

    return (
      <>
          <Grid fluid>
          <Row gutter={25}>
          <Col xs={12}>
          <Text>Mechanism Of Actions</Text>
          </Col>
          <Col xs={6}></Col>
          <Col xs={5}>
              <ButtonToolbar style={{ margin: '2px' }}>
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
                disabled={!selectedActiveIngredient.key}
                size="xs"
                appearance="primary"
                color="orange"
                // onClick={handleOpenPopup}
                icon={<InfoRound />}
              />
                  </ButtonToolbar>
              </Col> 
          </Row>
          <Row gutter={25}>
          <Col xs={24}>
              <Input as="textarea"
                disabled={!isActive}
                rows={9}
                value={selectedActiveIngredient.mechanismOfAction}
                onChange={e =>
                  setSelectedActiveIngredient({
                    ...selectedActiveIngredient,
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