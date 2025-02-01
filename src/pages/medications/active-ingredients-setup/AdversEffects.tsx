import React, { useEffect, useState } from 'react';
import {
  IconButton,
  Input,
  Table,
  Grid,
  Row,
  Col,
  ButtonToolbar,
  InputPicker,
  Text,
  Checkbox
} from 'rsuite';
import { Plus, Trash, InfoRound, Reload } from '@rsuite/icons';
import { MdSave } from 'react-icons/md';
import {
  useGetLovValuesByCodeQuery,
} from '@/services/setupService';

import {
  useGetActiveIngredientAdverseEffectQuery,
  useSaveActiveIngredientAdverseEffectMutation,
  useRemoveActiveIngredientAdverseEffectMutation
} from '@/services/medicationsSetupService';
import { newApActiveIngredientAdverseEffect } from '@/types/model-types-constructor';
import { ApActiveIngredientAdverseEffect } from '@/types/model-types';
import { initialListRequest, ListRequest } from '@/types/types';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';

const AdversEffects = ({activeIngredients , isEdit}) => {

  const [selectedActiveIngredientAdverseEffect, setSelectedActiveIngredientAdverseEffect] = useState<ApActiveIngredientAdverseEffect>({
    ...newApActiveIngredientAdverseEffect
  });


  const dispatch = useAppDispatch();
  const { data: AdversEffectsLovQueryResponseData } = useGetLovValuesByCodeQuery('MED_ADVERS_EFFECTS');
  const [activeIngredientAdverseEffect, setActiveIngredientAdverseEffect] = useState<ApActiveIngredientAdverseEffect>({ ...newApActiveIngredientAdverseEffect });
  const [listRequest, setListRequest] = useState({
    ...initialListRequest,
    pageSize: 100,
    sortBy: 'createdAt',
    sortType: 'desc',
    filters: [
      {
        fieldName: 'deleted_at',
        operator: 'isNull',
        value: undefined
      }
    ]
  });

  const [saveActiveIngredientAdverseEffect, saveActiveIngredientAdverseEffectMutation] = useSaveActiveIngredientAdverseEffectMutation();
  const [removeActiveIngredientAdverseEffect, removeActiveIngredientAdverseEffectMutation] = useRemoveActiveIngredientAdverseEffectMutation();
  const [isActive, setIsActive] = useState(false);
  
  const { data: AdverseListResponseData } = useGetActiveIngredientAdverseEffectQuery(listRequest);
  const isSelected = rowData => {
    if (rowData && rowData.key === selectedActiveIngredientAdverseEffect.key) {
      return 'selected-row';
    } else return '';
  };

  const save = () => {
    saveActiveIngredientAdverseEffect({
      ...selectedActiveIngredientAdverseEffect,
      activeIngredientKey: activeIngredients.key , 
      createdBy: 'Administrator'
    }).unwrap().then(() => {
      dispatch(notify("Saved successfully"));
  });;;

  };

  const handleAdverseEffectNew = () => {
    setIsActive(true);
    setActiveIngredientAdverseEffect({ ...newApActiveIngredientAdverseEffect });
  };

  const remove = () => {
    if (selectedActiveIngredientAdverseEffect.key) {
      removeActiveIngredientAdverseEffect({
        ...selectedActiveIngredientAdverseEffect,
      }).unwrap().then(() => {
        dispatch(notify("Deleted successfully"));
    });
    }
  };

  const handleChange = (e) => {
    setSelectedActiveIngredientAdverseEffect({
      ...selectedActiveIngredientAdverseEffect,
      isOther: e.target.checked, // This will set isOther to true or false based on the checkbox state
    });
  };

  useEffect(() => {
    if (saveActiveIngredientAdverseEffectMutation.isSuccess) {
      setListRequest({
        ...listRequest,
        timestamp: new Date().getTime()
      });

      setSelectedActiveIngredientAdverseEffect({ ...newApActiveIngredientAdverseEffect });
    }
  }, [saveActiveIngredientAdverseEffectMutation]);

  useEffect(() => {
    if (removeActiveIngredientAdverseEffectMutation.isSuccess) {
      setListRequest({
        ...listRequest,
        timestamp: new Date().getTime()
      });

      setSelectedActiveIngredientAdverseEffect({ ...newApActiveIngredientAdverseEffect });
    }
  }, [removeActiveIngredientAdverseEffectMutation]);

  useEffect(() => {
    const updatedFilters =[
      {
        fieldName: 'active_ingredient_key',
        operator: 'match',
        value: activeIngredients.key || undefined
      },
      {
        fieldName: 'deleted_at',
        operator: 'isNull',
        value: undefined
      }
    ];
    setListRequest((prevRequest) => ({
      ...prevRequest,
      filters: updatedFilters,
    }));
  }, [activeIngredients.key]);


  useEffect(() => {
    if (activeIngredients) {
      setActiveIngredientAdverseEffect(prevState => ({
        ...prevState,
        activeIngredientKey: activeIngredients.key
      }));
    }
  }, [activeIngredients]);

  return (
    <>
      <Grid fluid>
        <Row gutter={15}>
          <Col xs={6}></Col>
          <Col xs={6}></Col>
          <Col xs={6}></Col>
          <Col xs={5}>
           {isEdit && <ButtonToolbar style={{ margin: '2px' }}>
              <IconButton
                size="xs"
                appearance="primary"
                color="blue"
                onClick={handleAdverseEffectNew}
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
                disabled={!selectedActiveIngredientAdverseEffect.key}
                size="xs"
                appearance="primary"
                color="red"
                onClick={remove}
                icon={<Trash />}
              />
              <IconButton
                disabled={!selectedActiveIngredientAdverseEffect.key}
                size="xs"
                appearance="primary"
                color="orange"
                icon={<InfoRound />}
              />
            </ButtonToolbar>}
          </Col>
        </Row>
        <Row gutter={15}>
          <Col xs={4}>
            <Text style={{ textAlign: 'center' }}>Adverse Effects</Text>
          </Col>
          <Col xs={6}>
            < InputPicker
              disabled={!isActive}
              data={AdversEffectsLovQueryResponseData?.object ?? []}
              value={selectedActiveIngredientAdverseEffect.adverseEffectLkey}
              onChange={e =>
                setSelectedActiveIngredientAdverseEffect({
                  ...selectedActiveIngredientAdverseEffect,
                  adverseEffectLkey: String(e)
                })
              }
              labelKey="lovDisplayVale"
              valueKey="key"
              style={{ width: 224 }}
            />
          </Col>
          <Col xs={3}>
            <Checkbox
            //  onClick={() => setIsActive(!isActive)} 
              //  disabled={!isActive}
              // checked={selectedActiveIngredientAdverseEffect.isOther? true : false}
              // onChange={e => {
              //   setSelectedActiveIngredientAdverseEffect({
              //     ...selectedActiveIngredientAdverseEffect,
              //     isOther: Boolean(e)
              //   });

              // }}
              disabled={!isActive}
              checked={selectedActiveIngredientAdverseEffect.isOther || false} // Ensure it defaults to false if undefined
              onChange={handleChange}
              >Other</Checkbox>
          </Col>
          <Col xs={4}>
            {selectedActiveIngredientAdverseEffect.isOther && <Input
              style={{ width: '300px' }}
              type="text"
              value={selectedActiveIngredientAdverseEffect.otherDescription}
              onChange={e =>
                setSelectedActiveIngredientAdverseEffect({
                  ...selectedActiveIngredientAdverseEffect,
                  otherDescription: String(e)
                })
              }
            />}
          </Col>
          <Col xs={5}></Col>
        </Row>
        <Row gutter={15}>
          <Col xs={24}>
            <Table
              bordered
              onRowClick={rowData => {
                setSelectedActiveIngredientAdverseEffect(rowData);
              }}
              rowClassName={isSelected}
              data={AdverseListResponseData?.object ?? []}
              
            >
              <Table.Column flexGrow={1}>
                <Table.HeaderCell>Advers Effects</Table.HeaderCell>
                <Table.Cell>
                  {rowData =>
                    rowData.adverseEffectLvalue ? rowData.adverseEffectLvalue.lovDisplayVale : rowData.adverseEffectLkey
                        }
                </Table.Cell>
              </Table.Column>
              <Table.Column flexGrow={1}>
                <Table.HeaderCell>Other</Table.HeaderCell>
                <Table.Cell> {rowData => <Text>{rowData.otherDescription}</Text>}</Table.Cell>
              </Table.Column>
            </Table>
          </Col>
        </Row>
      </Grid>
    </>
  );
};

export default AdversEffects;