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
  SelectPicker,
  InputGroup,
  Dropdown
} from 'rsuite';
import { Plus, Trash, InfoRound, Reload } from '@rsuite/icons';
import { initialListRequest } from '@/types/types';
import SearchIcon from '@rsuite/icons/Search';
import {
  useGetActiveIngredientIndicationQuery,
  useRemoveActiveIngredientIndicationMutation,
  useSaveActiveIngredientIndicationMutation
} from '@/services/medicationsSetupService';
import {
  newApActiveIngredient,
  newApActiveIngredientIndication
} from '@/types/model-types-constructor';
import { MdSave } from 'react-icons/md';
import { ApActiveIngredient, ApActiveIngredientIndication } from '@/types/model-types';
import LogDialog from '@/components/Log';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { useGetIcdListQuery } from '@/services/setupService';
import { conjureValueBasedOnKeyFromList } from '@/utils';

const Indications = ({ selectedActiveIngredients, isEdit }) => {
  const exampleData = {
    object: [
      { createdAt: '2024-07-31', createdBy: 'User A' },
      { createdAt: '2024-07-30', createdBy: 'User B' }
    ]
  };
  const [activeIngredient, setActiveIngredient] = useState<ApActiveIngredient>({
    ...newApActiveIngredient
  });
  const dispatch = useAppDispatch();
  const [icdCode, setIcdCode] = useState(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [listIcdRequest, setListIcdRequest] = useState({ ...initialListRequest });
  const { data: icdListResponseData } = useGetIcdListQuery(listIcdRequest);
  const [selectedActiveIngredientIndicat, setSelectedActiveIngredientIndicat] =
    useState(exampleData);
  const [activeIngredientIndication, setActiveIngredientIndication] =
    useState<ApActiveIngredientIndication>({ ...newApActiveIngredientIndication });
  const [listRequest, setListRequest] = useState({
    ...initialListRequest,
    pageSize: 100,
    sortBy: 'createdAt',
    sortType: 'desc',
    filters: [
      {
        fieldName: 'active_ingredient_key',
        operator: 'match',
        value: undefined
      },
      {
        fieldName: 'deleted_at',
        operator: 'isNull',
        value: undefined
      }
    ]
  });

  useEffect(() => {
    const updatedFilters = [
      {
        fieldName: 'active_ingredient_key',
        operator: 'match',
        value: selectedActiveIngredients.key || undefined
      },
      {
        fieldName: 'deleted_at',
        operator: 'isNull',
        value: undefined
      }
    ];
    setListRequest(prevRequest => ({
      ...prevRequest,
      filters: updatedFilters
    }));
  }, [selectedActiveIngredients.key]);

  useEffect(() => {
    if (searchKeyword.trim() !== '') {
      setListIcdRequest({
        ...initialListRequest,
        filterLogic: 'or',
        filters: [
          {
            fieldName: 'icd_code',
            operator: 'containsIgnoreCase',
            value: searchKeyword
          },
          {
            fieldName: 'description',
            operator: 'containsIgnoreCase',
            value: searchKeyword
          }
        ]
      });
    }
  }, [searchKeyword]);

  const { data: indicationListResponseData } = useGetActiveIngredientIndicationQuery(listRequest);
  const [removeActiveIngredientIndication, removeActiveIngredientIndicationMutation] =
    useRemoveActiveIngredientIndicationMutation();
  const [saveActiveIngredientIndication, saveActiveIngredientIndicationMutation] =
    useSaveActiveIngredientIndicationMutation();
  const [isActive, setIsActive] = useState(false);
  const modifiedData = (icdListResponseData?.object ?? []).map(item => ({
    ...item,
    combinedLabel: `${item.icdCode} - ${item.description}`
  }));

  const save = () => {
    saveActiveIngredientIndication({
      ...activeIngredientIndication,
      activeIngredientKey: selectedActiveIngredients.key,
      createdBy: 'Administrator'
    })
      .unwrap()
      .then(() => {
        dispatch(notify('Added successfully'));
      });
  };

  const handleIndicationsNew = () => {
    setIsActive(true);
    setActiveIngredientIndication({ ...newApActiveIngredientIndication });
  };

  const remove = () => {
    if (activeIngredientIndication.key) {
      removeActiveIngredientIndication({
        ...activeIngredientIndication
      })
        .unwrap()
        .then(() => {
          dispatch(notify('Deleted successfully'));
        });
    }
  };

  const handleSearch = value => {
    setSearchKeyword(value);
    console.log('serch' + searchKeyword);
  };

  useEffect(() => {
    if (selectedActiveIngredients) {
      setActiveIngredientIndication(prevState => ({
        ...prevState,
        activeIngredientKey: selectedActiveIngredients.key
      }));
    }
    setIcdCode(null);
  }, [selectedActiveIngredients]);

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
    <Grid fluid>
      <Row gutter={15}>
        <Col xs={4}>
          <InputGroup inside style={{ width: '300px', marginTop: '20px' }}>
            <Input
              disabled={!isActive}
              placeholder={'Search ICD-10'}
              value={searchKeyword}
              onChange={handleSearch}
            />
            <InputGroup.Button>
              <SearchIcon />
            </InputGroup.Button>
          </InputGroup>
          {searchKeyword && (
            <Dropdown.Menu className="dropdown-menuresult">
              {modifiedData &&
                modifiedData?.map(mod => (
                  <Dropdown.Item
                    key={mod.key}
                    eventKey={mod.key}
                    onClick={() => {
                      setActiveIngredientIndication({
                        ...activeIngredientIndication,
                        icdCodeKey: mod.key
                      });
                      setIcdCode(mod);
                      setSearchKeyword('');
                    }}
                  >
                    <span style={{ marginRight: '19px' }}>{mod.icdCode}</span>
                    <span>{mod.description}</span>
                  </Dropdown.Item>
                ))}
            </Dropdown.Menu>
          )}
        </Col>
        <Col xs={4}></Col>
        <Col xs={4}>
          <InputGroup inside style={{ width: '500px', marginTop: '20px' }}>
            <Input
              disabled={true}
              style={{ width: '300px' }}
              value={
                icdListResponseData?.object.find(
                  item => item.key === activeIngredientIndication?.icdCodeKey
                )
                  ? `${
                      icdListResponseData.object.find(
                        item => item.key === activeIngredientIndication?.icdCodeKey
                      )?.icdCode
                    }, ${
                      icdListResponseData.object.find(
                        item => item.key === activeIngredientIndication?.icdCodeKey
                      )?.description
                    }`
                  : ''
              }
            />
          </InputGroup>
        </Col>
      </Row>
      <Row gutter={15}>
        <Col xs={4}>
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
        <Col xs={3}></Col>
        <Col xs={4}>
          <Checkbox
            disabled={!isActive}
            value={activeIngredientIndication.isOffLabel ? 'true' : 'false'}
            onChange={e =>
              setActiveIngredientIndication({
                ...activeIngredientIndication,
                isOffLabel: Boolean(e)
              })
            }
          >
            Off-Label
          </Checkbox>
        </Col>
        <Col xs={1}></Col>
        <Col xs={6}></Col>
        <Col xs={5}>
          {isEdit && (
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
          )}
        </Col>
      </Row>
      <Row gutter={15}>
        <Col xs={24}>
          <Table
            bordered
            onRowClick={rowData => {
              setActiveIngredientIndication(rowData);
              setIcdCode(rowData.icdObject);
            }}
            rowClassName={isSelected}
            data={indicationListResponseData?.object ?? []}
          >
            <Table.Column flexGrow={1}>
              <Table.HeaderCell>Indication</Table.HeaderCell>
              <Table.Cell>{rowData => <Text>{rowData.indication}</Text>}</Table.Cell>
            </Table.Column>
            <Table.Column flexGrow={2}>
              <Table.HeaderCell align="center">ICD Code</Table.HeaderCell>
              <Table.Cell>{rowData => <Text>{rowData.icdObject}</Text>}</Table.Cell>
            </Table.Column>
            <Table.Column flexGrow={1}>
              <Table.HeaderCell>Off-Label</Table.HeaderCell>
              <Table.Cell>{rowData => <Text>{rowData.isOffLabel ? 'Yes' : 'No'}</Text>}</Table.Cell>
            </Table.Column>
          </Table>
        </Col>
      </Row>
    </Grid>
  );
};

export default Indications;
