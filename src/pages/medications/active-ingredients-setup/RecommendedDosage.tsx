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
import { ApActiveIngredientRecommendedDosage } from '@/types/model-types';
import { newApActiveIngredientRecommendedDosage } from '@/types/model-types-constructor';
import { initialListRequest, ListRequest } from '@/types/types';
import {
  useGetActiveIngredientIndicationQuery,
  useGetActiveIngredientRecommededDosageQuery,
  useRemoveActiveIngredientRecommendedDosageMutation,
  useSaveActiveIngredientRecommendedDosageMutation
} from '@/services/medicationsSetupService';
import {
  useGetLovValuesByCodeQuery,
} from '@/services/setupService';

const RecommendedDosage = () => {

  const [ApActiveIngredientRecommendedDosage, setActiveIngredientRecommendedDosage] = useState<ApActiveIngredientRecommendedDosage>({ ...newApActiveIngredientRecommendedDosage });
  const [listRequest, setListRequest] = useState<ListRequest>({ ...initialListRequest });
  const [selectedActiveIngredientRecommendedDosage, setSelectedActiveIngredientRecommendedDosage] = useState<ApActiveIngredientRecommendedDosage>({
    ...newApActiveIngredientRecommendedDosage
  });
  const [saveActiveIngredientRecommendedDosage, saveActiveIngredientRecommendedDosageMutation] = useSaveActiveIngredientRecommendedDosageMutation();
  const isSelected = rowData => {
    if (rowData && rowData.key === selectedActiveIngredientRecommendedDosage.key) {
      return 'selected-row';
    } else return '';
  };
  const [activeIngredientsIndicationListRequest, setActiveIngredientsIndicationListRequest] = useState<ListRequest>({
    ...initialListRequest
  });
  const [isActive , setIsActive] = useState(false);

  const { data: activeIngredientIndicationListResponseData} = useGetActiveIngredientIndicationQuery(activeIngredientsIndicationListRequest);
  const { data: recommendedDosageListResponseData } = useGetActiveIngredientRecommededDosageQuery(listRequest);
  const { data: valueUnitLovQueryResponse } = useGetLovValuesByCodeQuery('VALUE_UNIT');
  const handleFoodsNew = () => {
    setIsActive(true);
    setActiveIngredientRecommendedDosage({ ...newApActiveIngredientRecommendedDosage });
  };
  const save = () => {
    saveActiveIngredientRecommendedDosage({
      ...selectedActiveIngredientRecommendedDosage, 
      createdBy: 'Administrator'
    }).unwrap();
      
  };
  


  return (
    <>
      <Grid fluid>
        <Row gutter={15}>
          <Col xs={6}>
            <Text>Add Indication</Text>
            <InputPicker
                disabled={!isActive}
                placeholder="Select "
                data={activeIngredientIndicationListResponseData?.object ?? []}
                value={selectedActiveIngredientRecommendedDosage.indicationLkey}
                onChange={e =>
                  setSelectedActiveIngredientRecommendedDosage({
                    ...selectedActiveIngredientRecommendedDosage,
                    indicationLkey: String(e)
                  })
                }
                labelKey="indication"
                valueKey="key"
                style={{ width: 224 }}
              />
          </Col>
          <Col xs={6}>
            <Text>Dosage</Text>
            <Input
              disabled={!isActive}
              style={{ width: '180px' }}
              type="text"
              value={selectedActiveIngredientRecommendedDosage.dosage}
              onChange={e =>
                setSelectedActiveIngredientRecommendedDosage({
                  ...selectedActiveIngredientRecommendedDosage,
                  dosage: String(e)
                })
              }
            />
          </Col>
          <Col xs={6}>
            <Text>Unit</Text>
              < InputPicker
               disabled={!isActive}
               data={valueUnitLovQueryResponse?.object ?? []}
               value={selectedActiveIngredientRecommendedDosage.activeIngredientKey}
               onChange={e =>
                 setSelectedActiveIngredientRecommendedDosage({
                   ...selectedActiveIngredientRecommendedDosage,
                   variableLkey: String(e)
                 })
               }
               labelKey="lovDisplayVale" 
               valueKey="key"
               style={{ width: 224 }}
                />
                </Col>
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
                disabled={!selectedActiveIngredientRecommendedDosage.key}
                size="xs"
                appearance="primary"
                color="red"
                icon={<Trash />}
              />
              <IconButton
                disabled={!selectedActiveIngredientRecommendedDosage.key}
                size="xs"
                appearance="primary"
                color="orange"
                icon={<InfoRound />}
              />
            </ButtonToolbar>
          </Col>
        </Row>

        <Row gutter={15}>
          <Col xs={24}>
            <Table
              bordered
              onRowClick={rowData => {
                setSelectedActiveIngredientRecommendedDosage(rowData);
              }}
              rowClassName={isSelected}
              data={recommendedDosageListResponseData?.object ?? []}
            >
              <Table.Column flexGrow={1}>
                <Table.HeaderCell>Unit</Table.HeaderCell>
                <Table.Cell>
                  {rowData => <Text>{rowData.variableLvalue ? rowData.variableLvalue.lovDisplayVale : rowData.variableLkey}</Text>}
                </Table.Cell>
              </Table.Column>
              <Table.Column flexGrow={1}>
                <Table.HeaderCell>Indication</Table.HeaderCell>
                <Table.Cell>
                  {rowData => <Text>{rowData.indicationLvalue ? rowData.indicationLvalue.lovDisplayVale : rowData.indicationLkey}</Text>}
                </Table.Cell>
              </Table.Column>
              <Table.Column flexGrow={1}>
                <Table.HeaderCell>Dosage</Table.HeaderCell>
                <Table.Cell>
                  {rowData => <Text>{rowData.dosage}</Text>}
                </Table.Cell>
              </Table.Column>
            </Table>
          </Col>
        </Row>
      </Grid>
    </>
  );
};

export default RecommendedDosage;