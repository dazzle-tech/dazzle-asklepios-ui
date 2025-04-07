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
  Dropdown
} from 'rsuite';
import { Trash, InfoRound, Reload, Plus } from '@rsuite/icons';
import { MdSave } from 'react-icons/md';
import { initialListRequest } from '@/types/types';
import { newApActiveIngredientContraindication } from '@/types/model-types-constructor';
import { ApActiveIngredientContraindication } from '@/types/model-types';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import SearchIcon from '@rsuite/icons/Search';
import {
  useGetActiveIngredientContraindicationQuery,
  useRemoveActiveIngredientContraindicationMutation,
  useSaveActiveIngredientContraindicationMutation
} from '@/services/medicationsSetupService';
import { useGetIcdListQuery } from '@/services/setupService';
import { conjureValueBasedOnKeyFromList } from '@/utils';

const Contraindications = ({ activeIngredients, isEdit }) => {
  const [isActive, setIsActive] = useState(false);
  const [selectedActiveIngredientContraindication, setSelectedActiveIngredientContraindication] =
    useState({
      ...newApActiveIngredientContraindication
    });
  const [listIcdRequest, setListIcdRequest] = useState({ ...initialListRequest });
  const [searchKeyword, setSearchKeyword] = useState('');
  const dispatch = useAppDispatch();
  const [icdCode, setIcdCode] = useState(null);
  const { data: icdListResponseData } = useGetIcdListQuery(listIcdRequest);
  const [activeIngredientContraindication, setActiveIngredientContraindication] =
    useState<ApActiveIngredientContraindication>({ ...newApActiveIngredientContraindication });
  const [listRequest, setListRequest] = useState({
    ...initialListRequest,
    pageSize: 100,
    timestamp: new Date().getMilliseconds(),
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
  const modifiedData = (icdListResponseData?.object ?? []).map(item => ({
    ...item,
    combinedLabel: `${item.icdCode} - ${item.description}`
  }));
  const { data: ContraindicationsListResponseData } =
    useGetActiveIngredientContraindicationQuery(listRequest);
  const [saveActiveIngredientContraindication, saveActiveIngredientContraindicationMutation] =
    useSaveActiveIngredientContraindicationMutation();
  const [removeActiveIngredientContraindication, removeActiveIngredientContraindicationMutation] =
    useRemoveActiveIngredientContraindicationMutation();

  useEffect(() => {
    const updatedFilters = [
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
    setListRequest(prevRequest => ({
      ...prevRequest,
      filters: updatedFilters
    }));
  }, [activeIngredients.key]);

  useEffect(() => {
    if (activeIngredients) {
      setActiveIngredientContraindication(prevState => ({
        ...prevState,
        activeIngredientKey: activeIngredients.key
      }));
    }
    setIcdCode(null);
  }, [activeIngredients]);

  const save = () => {
    saveActiveIngredientContraindication({
      ...selectedActiveIngredientContraindication,
      activeIngredientKey: activeIngredients.key,
      createdBy: 'Administrator'
    })
      .unwrap()
      .then(() => {
        dispatch(notify('Saved successfully'));
      });
    console.log(selectedActiveIngredientContraindication.icdCodeKey);
  };

  const handleSearch = value => {
    setSearchKeyword(value);
    console.log('serch' + searchKeyword);
  };

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

  useEffect(() => {
    if (saveActiveIngredientContraindicationMutation.isSuccess) {
      setListRequest({
        ...listRequest,
        timestamp: new Date().getTime()
      });

      setSelectedActiveIngredientContraindication({ ...newApActiveIngredientContraindication });
    }
  }, [saveActiveIngredientContraindicationMutation]);

  useEffect(() => {
    if (removeActiveIngredientContraindicationMutation.isSuccess) {
      setListRequest({
        ...listRequest,
        timestamp: new Date().getTime()
      });
      setIsActive(false);
      setSelectedActiveIngredientContraindication({ ...newApActiveIngredientContraindication });
    }
  }, [removeActiveIngredientContraindicationMutation]);

  const remove = () => {
    if (selectedActiveIngredientContraindication.key) {
      removeActiveIngredientContraindication({
        ...selectedActiveIngredientContraindication,
        deletedBy: 'Administrator'
      })
        .unwrap()
        .then(() => {
          dispatch(notify('Deleted successfully'));
        });
    }
  };

  const handleContraindicationsNew = () => {
    setIsActive(true);
    setActiveIngredientContraindication({
      ...newApActiveIngredientContraindication,
      activeIngredientKey: activeIngredients.Key
    });
  };

  const isSelected = rowData => {
    if (rowData && rowData.key === selectedActiveIngredientContraindication.key) {
      return 'selected-row';
    } else return '';
  };

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
                      setSelectedActiveIngredientContraindication({
                        ...selectedActiveIngredientContraindication,
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
                  item => item.key === selectedActiveIngredientContraindication?.icdCodeKey
                )
                  ? `${
                      icdListResponseData.object.find(
                        item => item.key === selectedActiveIngredientContraindication?.icdCodeKey
                      )?.icdCode
                    }, ${
                      icdListResponseData.object.find(
                        item => item.key === selectedActiveIngredientContraindication?.icdCodeKey
                      )?.description
                    }`
                  : ''
              }
            />
          </InputGroup>
        </Col>
      </Row>
      <Row gutter={15}>
        <Col xs={2}>
          <Input
            disabled={!isActive}
            style={{ width: '300px' }}
            type="text"
            value={selectedActiveIngredientContraindication.contraindication}
            onChange={e =>
              setSelectedActiveIngredientContraindication({
                ...selectedActiveIngredientContraindication,
                contraindication: String(e)
              })
            }
          />
        </Col>
        <Col xs={4}></Col>
        <Col xs={1}></Col>
        <Col xs={4}></Col>
        <Col xs={1}></Col>
        <Col xs={6}></Col>
        <Col xs={5}>
          {isEdit && (
            <ButtonToolbar style={{ margin: '1px' }}>
              <IconButton
                size="xs"
                appearance="primary"
                color="blue"
                onClick={handleContraindicationsNew}
                icon={<Plus />}
              />
              <IconButton
                size="xs"
                appearance="primary"
                color="green"
                onClick={save}
                icon={<MdSave />}
              />
              <IconButton
                disabled={!selectedActiveIngredientContraindication.key}
                size="xs"
                appearance="primary"
                color="red"
                onClick={remove}
                icon={<Trash />}
              />
              <IconButton
                disabled={!selectedActiveIngredientContraindication.key}
                size="xs"
                appearance="primary"
                color="orange"
                icon={<InfoRound />}
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
              setSelectedActiveIngredientContraindication(rowData);
            }}
            rowClassName={isSelected}
            data={ContraindicationsListResponseData?.object ?? []}
          >
            <Table.Column flexGrow={1}>
              <Table.HeaderCell align="center">Contraindications</Table.HeaderCell>
              <Table.Cell>{rowData => <Text>{rowData.contraindication}</Text>}</Table.Cell>
            </Table.Column>
            <Table.Column flexGrow={1}>
              <Table.HeaderCell align="center">ICD Code</Table.HeaderCell>
              <Table.Cell>{rowData => <Text>{rowData.icdObject}</Text>}</Table.Cell>
            </Table.Column>
          </Table>
        </Col>
      </Row>
    </Grid>
  );
};

export default Contraindications;
