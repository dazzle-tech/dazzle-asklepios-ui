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
  Checkbox,
  SelectPicker
} from 'rsuite';
import { Plus, Trash, InfoRound, Reload } from '@rsuite/icons';
import { initialListRequest } from '@/types/types';
import {
  useGetActiveIngredientIndicationQuery,
  useRemoveActiveIngredientIndicationMutation,
  useSaveActiveIngredientIndicationMutation
} from '@/services/medicationsSetupService';
import { newApActiveIngredient, newApActiveIngredientIndication } from '@/types/model-types-constructor';
import { MdSave } from 'react-icons/md';
import { ApActiveIngredient, ApActiveIngredientIndication } from '@/types/model-types';
import LogDialog from '@/components/Log';

const Indications = ({ selectedActiveIngredients}) => {
  const exampleData = {
    object: [
      { createdAt: '2024-07-31', createdBy: 'User A' },
      { createdAt: '2024-07-30', createdBy: 'User B' }
    ]
  };
  const [activeIngredient, setActiveIngredient] = useState<ApActiveIngredient>({ ...newApActiveIngredient });
  
  const [selectedActiveIngredientIndicat, setSelectedActiveIngredientIndicat] = useState(exampleData);
  const [activeIngredientIndication, setActiveIngredientIndication] = useState<ApActiveIngredientIndication>({ ...newApActiveIngredientIndication });
  const [listRequest, setListRequest] = useState({
    ...initialListRequest,
    pageSize: 100,
    sortBy: 'createdAt',
    sortType: 'desc',
    filters: [
      {
        fieldName: 'active_ingredient_key',
        operator: 'match',
        value: selectedActiveIngredients.key
      },
      {
        fieldName: 'deleted_at',
        operator: 'isNull',
        value: undefined
      }
    ]
  }
);

  const { data: indicationListResponseData } = useGetActiveIngredientIndicationQuery(listRequest);
  const [removeActiveIngredientIndication, removeActiveIngredientIndicationMutation] = useRemoveActiveIngredientIndicationMutation();
  const [saveActiveIngredientIndication, saveActiveIngredientIndicationMutation] = useSaveActiveIngredientIndicationMutation();
  const [isActive, setIsActive] = useState(false);

  const save = () => {
    saveActiveIngredientIndication({
      ...activeIngredientIndication,
      activeIngredientKey: selectedActiveIngredients.key,
      createdBy: 'Administrator'
    }).unwrap();

  };

  const handleIndicationsNew = () => {
    setIsActive(true);
    setActiveIngredientIndication({ ...newApActiveIngredientIndication});
  };

  const remove = () => {
    if (activeIngredientIndication.key) {
      removeActiveIngredientIndication({
        ...activeIngredientIndication,
      }).unwrap();
    }
  };

  useEffect(() => {
    if (selectedActiveIngredients) {
      setActiveIngredientIndication(prevState => ({
        ...prevState,
        activeIngredientKey: selectedActiveIngredients.key
      }));
    }
  }, [selectedActiveIngredients]);

  // useEffect(() => {
  
  //   if (selectedActiveIngredients) {
  //     console.log('the active ingredient is not null '  + activeIngredient)
  //     setActiveIngredient(selectedActiveIngredients);
  //   } else {
  //     console.log('the active ingredient is null ' )
  //     setActiveIngredient(newApActiveIngredient);
  //   }
  //     console.log('the active ingredient key ' + activeIngredient )
  // }, [selectedActiveIngredients]);

  useEffect(() => {
    if (saveActiveIngredientIndicationMutation.isSuccess) {
      setListRequest({
        ...listRequest,
        timestamp: new Date().getTime()
      });

      setActiveIngredientIndication({ ...newApActiveIngredientIndication });
    }
  }, [saveActiveIngredientIndicationMutation]);

  useEffect(() => {
    if (removeActiveIngredientIndicationMutation.isSuccess) {
      setListRequest({
        ...listRequest,
        timestamp: new Date().getTime()
      });

      setActiveIngredientIndication({ ...newApActiveIngredientIndication });
    }
  }, [removeActiveIngredientIndicationMutation]);

  const isSelected = rowData => {
    if (rowData && rowData.key === activeIngredientIndication.key) {
      return 'selected-row';
    } else return '';
  };

  const [popupOpen, setPopupOpen] = useState(false);
  const handleOpenPopup = () => setPopupOpen(true);

  return (
    <>
      <Grid fluid>
        <Row gutter={15}>
          <Col xs={2}>
            <Input
              disabled={!isActive}
              style={{ width: '230px' }}
              type="text"
              value={activeIngredientIndication.indication}
              onChange={e =>
                setActiveIngredientIndication({
                  ...activeIngredientIndication,
                  indication: String(e)
                })
              }
            />
          </Col>
          <Col xs={4}>

          </Col>
          <Col xs={1}>
          </Col>
          <Col xs={4}>
            <Checkbox
              disabled={!isActive}
              value={activeIngredientIndication.isOffLabel ? "true" : "false"}
              onChange={e =>
                setActiveIngredientIndication({
                  ...activeIngredientIndication,
                  isOffLabel: Boolean(e)
                })
              }>
              Off-Label
            </Checkbox>
          </Col>
          <Col xs={1}>
          </Col>
          <Col xs={6}></Col>
          <Col xs={5}>
            <ButtonToolbar style={{ margin: '2px' }}>
              <IconButton
                size="xs"
                appearance="primary"
                color="blue"
                onClick={handleIndicationsNew}
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
                disabled={!activeIngredientIndication.key}
                size="xs"
                appearance="primary"
                color="red"
                onClick={remove}
                icon={<Trash />}
              />
              <IconButton
                disabled={!activeIngredientIndication.key}
                size="xs"
                appearance="primary"
                color="orange"
                onClick={handleOpenPopup}
                icon={<InfoRound />}
              />

              <LogDialog
                ObjectListResponseData={activeIngredientIndication}
                popupOpen={popupOpen}
                setPopupOpen={setPopupOpen}
              />
            </ButtonToolbar>
          </Col>
        </Row>
        <Row gutter={15}>
          <Col xs={24}>
            <Table
              bordered
              onRowClick={rowData => {
                setActiveIngredientIndication(rowData);
              }}
              rowClassName={isSelected}
              data={indicationListResponseData?.object ?? []}
            >
              <Table.Column flexGrow={1}>
                <Table.HeaderCell>Indication</Table.HeaderCell>
                <Table.Cell>
                  {rowData => <Text>{rowData.indication}</Text>}
                </Table.Cell>
              </Table.Column>
              <Table.Column flexGrow={1}>
                <Table.HeaderCell>Off-Label</Table.HeaderCell>
                <Table.Cell>{rowData => <Text>{rowData.isOffLabel ? 'Yes' : 'No'}</Text>}</Table.Cell>
              </Table.Column>
            </Table>
          </Col>
        </Row>
      </Grid>
    </>
  );
};

export default Indications;