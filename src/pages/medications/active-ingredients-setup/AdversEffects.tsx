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

const AdversEffects = () => {

  const [selectedActiveIngredientAdverseEffect, setSelectedActiveIngredientAdverseEffect] = useState<ApActiveIngredientAdverseEffect>({
    ...newApActiveIngredientAdverseEffect
  });

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
      createdBy: 'Administrator'
    }).unwrap();

  };

  const handleFoodsNew = () => {
    setIsActive(true);
    setActiveIngredientAdverseEffect({ ...newApActiveIngredientAdverseEffect });
  };

  const remove = () => {
    if (selectedActiveIngredientAdverseEffect.key) {
      removeActiveIngredientAdverseEffect({
        ...selectedActiveIngredientAdverseEffect,
      }).unwrap();
    }
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

  return (
    <>
      <Grid fluid>
        <Row gutter={15}>
          <Col xs={6}></Col>
          <Col xs={6}></Col>
          <Col xs={6}></Col>
          <Col xs={5}>
            <ButtonToolbar style={{ margin: '2px' }}>
              <IconButton
                size="xs"
                appearance="primary"
                color="blue"
                onClick={handleFoodsNew}
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
            </ButtonToolbar>
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
                  activeIngredientKey: String(e)
                })
              }
              labelKey="lovDisplayVale"
              valueKey="key"
              style={{ width: 224 }}
            />
          </Col>
          <Col xs={3}>
            <Checkbox onClick={() => setIsActive(!isActive)} 
               disabled={!isActive}
              checked={selectedActiveIngredientAdverseEffect.isOther}
              onChange={e => {
                setSelectedActiveIngredientAdverseEffect({
                  ...selectedActiveIngredientAdverseEffect,
                  isOther: Boolean(e)
                });

              }}
              >Other</Checkbox>
          </Col>
          <Col xs={4}>
            {isActive && <Input
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
                  {rowData => <Text>{rowData.adverseEffectLkey}</Text>}
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