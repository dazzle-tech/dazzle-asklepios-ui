import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { setEncounter, setPatient } from '@/reducers/patientSlice';
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
  DatePicker
} from 'rsuite';
import 'react-tabs/style/react-tabs.css';
import { initialListRequest } from '@/types/types';

import { newApPatientDiagnose } from '@/types/model-types-constructor';
import { Plus, Trash } from '@rsuite/icons';
import { MdSave } from 'react-icons/md';
import {
  useGetPatientDiagnosisQuery,
  useRemovePatientDiagnoseMutation,
  useSavePatientDiagnoseMutation
} from '@/services/encounterService';
import { useGetIcdListQuery, useGetLovValuesByCodeQuery } from '@/services/setupService';
import { ApPatientDiagnose } from '@/types/model-types';



const UOM = () => {
    const patientSlice = useAppSelector(state => state.patient);

    const [selectedDiagnose, setSelectedDiagnose] = useState<ApPatientDiagnose>({
      ...newApPatientDiagnose
    });
  
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
  
    const patientDiagnoseListResponse = useGetPatientDiagnosisQuery(listRequest);
  
    const { data: icdListResponseData } = useGetIcdListQuery({
      ...initialListRequest,
      pageSize: 100
    });
  
    const { data: sourceOfInfoLovResponseData } = useGetLovValuesByCodeQuery('SOURCE_OF_INFO');
    const { data: resolutionStatusLovResponseData } =
      useGetLovValuesByCodeQuery('ALLERGY_RES_STATUS');
  
    const [savePatientDiagnose, savePatientDiagnoseMutation] = useSavePatientDiagnoseMutation();
    const [removePatientDiagnose, removePatientDiagnoseMutation] = useRemovePatientDiagnoseMutation();
  
    const save = () => {
      savePatientDiagnose({
        ...selectedDiagnose,
        createdBy: 'Administrator'
      }).unwrap();
    };
  
    const remove = () => {
      if (selectedDiagnose.key) {
        removePatientDiagnose({
          ...selectedDiagnose,
          deletedBy: 'Administrator'
        }).unwrap();
      }
    };
  
    useEffect(() => {
      if (savePatientDiagnoseMutation.isSuccess) {
        setListRequest({
          ...listRequest,
          timestamp: new Date().getMilliseconds()
        });
        setSelectedDiagnose({ ...newApPatientDiagnose });
      }
    }, [savePatientDiagnoseMutation]);
  
    useEffect(() => {
      if (removePatientDiagnoseMutation.isSuccess) {
        setListRequest({
          ...listRequest,
          timestamp: new Date().getMilliseconds()
        });
        setSelectedDiagnose({ ...newApPatientDiagnose });
      }
    }, [removePatientDiagnoseMutation]);
  
  
    const isSelected = rowData => {
      if (rowData && rowData.key === selectedDiagnose.key) {
        return 'selected-row';
      } else return '';
    };
    return (
      <>
        <Panel bordered style={{ padding: '10px', margin: '5px' }} header="UOM">
          <Grid fluid>
            <Row gutter={15} style={{ border: '1px solid #e1e1e1' }}>
              <Col xs={3}>
                <ButtonToolbar style={{ margin: '6px' }}>
                  <IconButton
                    size="xs"
                    appearance="primary"
                    color="blue"
                    onClick={() => setSelectedDiagnose({ ...newApPatientDiagnose })}
                    icon={<Plus />}
                  />
                </ButtonToolbar>
              </Col>
              <Col xs={18}></Col>
              <Col xs={3}>
                <ButtonToolbar style={{ margin: '6px' }}>
                  <IconButton
                    size="xs"
                    onClick={save}
                    appearance="primary"
                    color="green"
                    icon={<MdSave />}
                  />
                  <IconButton
                    disabled={!selectedDiagnose.key}
                    size="xs"
                    appearance="primary"
                    onClick={remove}
                    color="red"
                    icon={<Trash />}
                  />
                </ButtonToolbar>
              </Col>
            </Row>
            <Row gutter={15}>
              <Col xs={6}>
                <Text>Unit of Measurement</Text>
                <SelectPicker
                  style={{ width: '100%' }}
                  data={icdListResponseData?.object ?? []}
                  labelKey="description"
                  valueKey="key"
                  placeholder="UOM"
                  value={selectedDiagnose.diagnoseCode}
                  onChange={e =>
                    setSelectedDiagnose({
                      ...selectedDiagnose,
                      diagnoseCode: e
                    })
                  }
                />
              </Col>
              <Col xs={6}>
                <Text>Unit Orders</Text>
                <Input
                type="number"
                placeholder="Unit Orders"
               
              />
              </Col>
  
              <Col xs={6}>
                <Text>Selling Default Unit</Text>
                <SelectPicker
                  style={{ width: '100%' }}
                  data={resolutionStatusLovResponseData?.object ?? []}
                  labelKey="lovDisplayVale"
                  valueKey="key"
                  placeholder="Resolution Status"
                  value={selectedDiagnose.diagnoseStatusLkey}
                  onChange={e =>
                    setSelectedDiagnose({
                      ...selectedDiagnose,
                      diagnoseStatusLkey: e
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
                rowHeight={60}
              >
                <Table.Column flexGrow={1}>
                  <Table.HeaderCell>Unit of Measurement</Table.HeaderCell>
                  <Table.Cell>
                  </Table.Cell>
                </Table.Column>
                <Table.Column flexGrow={1}>
                  <Table.HeaderCell>Unit Orders</Table.HeaderCell>
                  <Table.Cell></Table.Cell>
                </Table.Column>
                <Table.Column flexGrow={1}>
                  <Table.HeaderCell>Selling Default Unit</Table.HeaderCell>
                  <Table.Cell></Table.Cell>
                </Table.Column>
                <Table.Column flexGrow={1}>
                  <Table.HeaderCell>Base Unit Price</Table.HeaderCell>
                  <Table.Cell></Table.Cell>
                </Table.Column>
                <Table.Column flexGrow={1}>
                  <Table.HeaderCell>Stock Default Unit</Table.HeaderCell>
                  <Table.Cell></Table.Cell>
                </Table.Column>
              </Table>
              </Col>
            </Row>
          </Grid>
        </Panel>
      </>
    );

};
export default UOM;