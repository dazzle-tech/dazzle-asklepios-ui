import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import { useAppDispatch, useAppSelector } from '@/hooks';
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
  SelectPicker,
  InputPicker,
  DatePicker
} from 'rsuite';
import 'react-tabs/style/react-tabs.css';
import { initialListRequest, ListRequest } from '@/types/types';

import { newApGenericMedication, newApGenericMedicationActiveIngredient, newApPatientDiagnose } from '@/types/model-types-constructor';
import { Plus, Trash } from '@rsuite/icons';
import { MdSave } from 'react-icons/md';
import {
  useGetPatientDiagnosisQuery,
  useRemovePatientDiagnoseMutation,
  useSavePatientDiagnoseMutation
} from '@/services/encounterService';
import { useGetIcdListQuery, useGetLovValuesByCodeQuery } from '@/services/setupService';
import { ApGenericMedicationActiveIngredient, ApPatientDiagnose } from '@/types/model-types';

import { ApActiveIngredient } from '@/types/model-types';
import { newApActiveIngredient } from '@/types/model-types-constructor';
import { useGetActiveIngredientQuery, useGetGenericMedicationActiveIngredientQuery, useRemoveGenericMedicationActiveIngredientMutation, useSaveGenericMedicationActiveIngredientMutation } from '@/services/medicationsSetupService';
import { conjureValueBasedOnKeyFromList } from '@/utils';
import { notify } from '@/utils/uiReducerActions';



const ActiveIngredient = ({genericMedication}) => {

    const [genericActive, setGenericActive] = useState<ApGenericMedicationActiveIngredient>({...newApGenericMedicationActiveIngredient});
     const [activeIngredientsListRequest, setActiveIngredientsListRequest] = useState<ListRequest>({
          ...initialListRequest
        });
    const { data: activeIngredientListResponseData} = useGetActiveIngredientQuery(activeIngredientsListRequest);
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
        },
        {
          fieldName: 'generic_medication_key',
          operator: 'match',
          value: genericMedication.key || undefined

        }
      ]
    });
  
    const [isActive, setIsActive] = useState(false);
    const dispatch = useAppDispatch();
    const [activeIngredient, setActiveIngredient] = useState<ApActiveIngredient>({ ...newApActiveIngredient });
    const { data: sourceOfInfoLovResponseData } = useGetLovValuesByCodeQuery('SOURCE_OF_INFO');
    const { data: UOMLovResponseData } = useGetLovValuesByCodeQuery('VALUE_UNIT');
    const { data: genericMedicationActiveIngredientListResponseData} = useGetGenericMedicationActiveIngredientQuery(listRequest);
    const [saveGenericMedicationActiveIngredient, saveGenericMedicationActiveIngredientMutation]= useSaveGenericMedicationActiveIngredientMutation();
    const [removeGenericMedicationActiveIngredient, removeGenericMedicationActiveIngredientMutation] = useRemoveGenericMedicationActiveIngredientMutation();
  
    const isSelected = rowData => {
      if (rowData && rowData.key === genericActive.key) {
        return 'selected-row';
      } else return '';
    };

    const handleNew = () => {
      setIsActive(true);
      setGenericActive({ 
        ...newApGenericMedicationActiveIngredient,
        unitLkey: null,
        activeIngredientKey:null,

      });
    };

    const save = () => {
     saveGenericMedicationActiveIngredient({
       ...genericActive,
       genericMedicationKey:genericMedication.key,
       createdBy: 'Administrator'
      }).unwrap();
      dispatch(notify('A.I Saved Successfully'));
    };
  
    const remove = () => {
      if (genericActive.key) {
        removeGenericMedicationActiveIngredient({
          ...genericActive,
          deletedBy: 'Administrator'
        }).unwrap();
        dispatch(notify('A.I Deleted Successfully'));
      }
    };
  
    useEffect(() => {
      if (saveGenericMedicationActiveIngredientMutation) {
        setListRequest({
          ...listRequest,
          timestamp: new Date().getMilliseconds()
        });
        setGenericActive({
           ...newApGenericMedicationActiveIngredient,
            activeIngredientKey: null,
            unitLkey: null 
         });
      }
    }, [saveGenericMedicationActiveIngredientMutation]);
  
    useEffect(() => {
      if (removeGenericMedicationActiveIngredient) {
        setListRequest({
          ...listRequest,
          timestamp: new Date().getMilliseconds()
        });
        setGenericActive({
          ...newApGenericMedicationActiveIngredient,
           activeIngredientKey: null,
           unitLkey: null 
        });
      }
    }, [removeGenericMedicationActiveIngredientMutation]);
  
     useEffect(() => {
          const updatedFilters =[
            {
              fieldName: 'generic_medication_key',
              operator: 'match',
              value: genericMedication.key || undefined
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
        }, [genericMedication.key]);

    function formatDate(_date) {
      if (!_date) return '';
  
      const date = new Date(_date);
  
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
      const day = String(date.getDate()).padStart(2, '0');
  
      return `${year}/${month}/${day}`;
    }
    
    return (
      <>
        <Panel bordered style={{ padding: '10px', margin: '5px' }}>
          <Grid fluid>
            <Row gutter={15} style={{ border: '1px solid #e1e1e1' }}>
              <Col xs={3}>
              </Col>
              <Col xs={18}></Col>
              <Col xs={3}>
              <ButtonToolbar style={{ margin: '2px' }}>
              <IconButton
                disabled={!genericMedication.key}
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
                disabled={!genericActive.key}
                size="xs"
                appearance="primary"
                color="red"
                onClick={remove}
                icon={<Trash />}
              />
            </ButtonToolbar>
              </Col>
            </Row>
            <Row gutter={15}>
              <Col xs={6}>
                <Text>Active Ingredient</Text>
                <InputPicker
                disabled={!isActive}
                placeholder="Select A.I"
                data={activeIngredientListResponseData?.object ?? []}
                value={genericActive.activeIngredientKey}
                onChange={e =>
                  setGenericActive({
                    ...genericActive,
                    activeIngredientKey: String(e)
                  })
                }
                labelKey="name"
                valueKey="key"
                style={{ width: '100%' }}
              />
              </Col>
              <Col xs={6}>
                <Text>Strength</Text>
                <Input
                 disabled={!isActive}
                type="number"
                placeholder="Strength"
                value={genericActive.strength}
                onChange={e =>
                  setGenericActive({
                    ...genericActive,
                    strength: Number(e)
                  })
                }
              />
              </Col>
  
              <Col xs={6}>
                <Text>Unit</Text>
                <SelectPicker
                 disabled={!isActive}
                  style={{ width: '100%' }}
                  data={UOMLovResponseData?.object ?? []}
                  labelKey="lovDisplayVale"
                  valueKey="key"
                  placeholder="Unit"
                  value={genericActive.unitLkey}
                  onChange={e =>
                    setGenericActive({
                      ...genericActive,
                      unitLkey: e
                    })
                  }
                />
              </Col>
            </Row>
  
            <Row gutter={15}>
              <Col xs={24}>
              <Table
                bordered
                rowClassName={isSelected}
                headerHeight={50}
                rowHeight={50}
                  onRowClick={rowData => {
                    setGenericActive(rowData);
                  }}
                data={genericMedicationActiveIngredientListResponseData?.object}
              >
                <Table.Column flexGrow={1}>
                  <Table.HeaderCell>Active Ingredient Name</Table.HeaderCell>
                  <Table.Cell>
                      {rowData => (
                        <span>
                          {conjureValueBasedOnKeyFromList(
                            activeIngredientListResponseData?.object ?? [],
                            rowData.activeIngredientKey,
                            'name'
                          )}
                        </span>
                      )}
                  </Table.Cell>
                </Table.Column>
                <Table.Column flexGrow={1}>
                <Table.HeaderCell>Active Ingredient ATC Code</Table.HeaderCell>
                  <Table.Cell>
                      {rowData => (
                        <span>
                          {conjureValueBasedOnKeyFromList(
                            activeIngredientListResponseData?.object ?? [],
                            rowData.activeIngredientKey,
                            'atc_code'
                          )}
                        </span>
                      )}
                  </Table.Cell>
                </Table.Column>
                <Table.Column flexGrow={1}>
                  <Table.HeaderCell>strength</Table.HeaderCell>
                  <Table.Cell>
                  {rowData => <Text>{rowData.strength} { rowData.unitLvalue ? rowData.unitLvalue.lovDisplayVale : rowData.unitLkey}</Text>}
                  </Table.Cell>
                </Table.Column>
              </Table>
              </Col>
            </Row>
          </Grid>
        </Panel>
      </>
    );

};
export default ActiveIngredient;