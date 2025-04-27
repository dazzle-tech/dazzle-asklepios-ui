import React, { type ReactNode, useState } from 'react';
import {
  Panel,
  IconButton,
  Modal,
  Form,
  Button,
  Stack,
  Divider,
  Table,
  Whisper,
  Tooltip
} from 'rsuite';
import * as icons from '@rsuite/icons';
import Translate from '@/components/Translate';
import MyInput from '@/components/MyInput';
import { ItemDataType } from 'rsuite/esm/@types/common';
import {
  useSavePlannedTreatmentMutation,
  useDeletePlannedTreatmentMutation,
  useFetchTreatmentPlanQuery
} from '@/services/dentalService';
import { useGetCdtsQuery, useGetLovValuesByCodeQuery } from '@/services/setupService';
import { initialListRequest } from '@/types/types';
import { newApDentalPlannedTreatment } from '@/types/model-types-constructor';

const { Column, HeaderCell, Cell } = Table;

const TreatmentPlanTab = ({
  encounter,
  patient,
  treatmentPlanTrigger,
  setTreatmentPlanTrigger,
  originalChart,
  dispatch
}) => {
  // State for treatment plans
  const [treatmentPlan, setTreatmentPlan] = useState({
    draft: [],
    current: []
  });

  // Draft plan state
  const [draftPlannedTreatment, setDraftPlannedTreatment] = useState({
    ...newApDentalPlannedTreatment
  });
  const [draftPlanPopupOpen, setDraftPlanPopupOpen] = useState(false);

  // Active plan state
  const [activePlannedTreatment, setActivePlannedTreatment] = useState({
    ...newApDentalPlannedTreatment
  });
  const [activePlanPopupOpen, setActivePlanPopupOpen] = useState(false);

  // CDT codes
  const [cdtListRequest, setCdtListRequest] = useState({
    ...initialListRequest,
    filters: [
      {
        fieldName: 'type_lkey',
        operator: 'match',
        value: '277273303968200'
      }
    ],
    pageSize: 1000
  });
  const cdtListResponse = useGetCdtsQuery(cdtListRequest);
  const [cdtMap, setCdtMap] = useState({});

  // LOV queries
  const { data: treatmentPlanStatusLovQueryResponse } =
    useGetLovValuesByCodeQuery('DENT_PLAN_TRTMNT_STATUS');
  const { data: toothSurfaceLovQueryResponse } = useGetLovValuesByCodeQuery('TOOTH_SURF');
  const { data: billingTypeLovQueryResponse } = useGetLovValuesByCodeQuery('BILLING_TYPE');

  // Treatment plan data
  const treatmentPlanDataResponse = useFetchTreatmentPlanQuery(
    { encounterKey: originalChart.encounterKey, trigger: treatmentPlanTrigger },
    {
      skip: !originalChart.key
    }
  );

  // Mutations
  const [savePlannedTreatment, savePlannedTreatmentMutation] = useSavePlannedTreatmentMutation();
  const [deletePlannedTreatment, deletePlannedTreatmentMutation] =
    useDeletePlannedTreatmentMutation();

  // Cache CDT codes
  React.useEffect(() => {
    if (cdtListResponse.status === 'fulfilled') {
      const cdtCache = {};
      cdtListResponse.data.object.map(cdt => {
        cdtCache[cdt.key] = cdt;
      });
      setCdtMap(cdtCache);
    }
  }, [cdtListResponse]);

  // Handle treatment plan data
  React.useEffect(() => {
    if (treatmentPlanDataResponse && treatmentPlanDataResponse.isSuccess) {
      if (treatmentPlanDataResponse.data.object) {
        setTreatmentPlan({
          draft: treatmentPlanDataResponse.data.object?.draftTreatments ?? [],
          current: treatmentPlanDataResponse.data.object?.currentTreatments ?? []
        });
      }
    }
  }, [treatmentPlanDataResponse]);

  // Handle save planned treatment
  React.useEffect(() => {
    if (savePlannedTreatmentMutation.status === 'fulfilled') {
      setTreatmentPlanTrigger(treatmentPlanTrigger * -1);
      setDraftPlanPopupOpen(false);
      setActivePlanPopupOpen(false);
    } else if (savePlannedTreatmentMutation.status === 'rejected') {
      dispatch({ type: 'NOTIFY', payload: { msg: 'Save Failed', sev: 'error' } });
    }
  }, [savePlannedTreatmentMutation, treatmentPlanTrigger, setTreatmentPlanTrigger, dispatch]);

  // Handle delete planned treatment
  React.useEffect(() => {
    if (deletePlannedTreatmentMutation.status === 'fulfilled') {
      setTreatmentPlanTrigger(treatmentPlanTrigger * -1);
      setDraftPlannedTreatment({ ...newApDentalPlannedTreatment });
    } else if (deletePlannedTreatmentMutation.status === 'rejected') {
      dispatch({ type: 'NOTIFY', payload: { msg: 'Delete Failed', sev: 'error' } });
    }
  }, [deletePlannedTreatmentMutation, treatmentPlanTrigger, setTreatmentPlanTrigger, dispatch]);

  // Row selection helpers
  const isDraftTreatmentSelected = rowData => {
    if (rowData && draftPlannedTreatment && rowData.key === draftPlannedTreatment.key) {
      return 'selected-row';
    } else return '';
  };

  const isActiveTreatmentSelected = rowData => {
    if (rowData && activePlannedTreatment && rowData.key === activePlannedTreatment.key) {
      return 'selected-row';
    } else return '';
  };

  return (
    <>
      {/* Draft Plan Modal */}
      <Modal open={draftPlanPopupOpen} overflow>
        <Modal.Title>
          <Translate>New/Edit Draft Planned Treatment</Translate>
        </Modal.Title>
        <Modal.Body>
          <Form fluid>
            <MyInput
              width={400}
              fieldName="visitNumber"
              fieldType="number"
              max={99}
              record={draftPlannedTreatment}
              setRecord={setDraftPlannedTreatment}
            />
            <MyInput
              width={400}
              fieldName="cdtKey"
              fieldLabel="CDT"
              fieldType="select"
              selectData={cdtListResponse?.data?.object ?? [] ?? []}
              selectDataLabel="description"
              selectDataValue="key"
              renderMenuItem={(label, item) => {
                return (
                  <span>
                    {item.cdtCode} / {item.description}
                  </span>
                );
              }}
              searchBy={(keyword: string, label: ReactNode, item: ItemDataType) =>
                item.cdtCode.toLowerCase().includes(keyword.toLowerCase()) ||
                item.description.toLowerCase().includes(keyword.toLowerCase())
              }
              record={draftPlannedTreatment}
              setRecord={setDraftPlannedTreatment}
            />
            <MyInput
              width={400}
              fieldName="note"
              fieldType="textarea"
              record={draftPlannedTreatment}
              setRecord={setDraftPlannedTreatment}
            />
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Stack spacing={2} divider={<Divider vertical />}>
            <Button
              appearance="primary"
              onClick={() => {
                savePlannedTreatment({
                  ...draftPlannedTreatment,
                  type: 'DRAFT',
                  encounterKey: encounter.key,
                  patientKey: patient.key
                }).unwrap();
              }}
            >
              Save
            </Button>
            <Button appearance="primary" color="red" onClick={() => setDraftPlanPopupOpen(false)}>
              Cancel
            </Button>
          </Stack>
        </Modal.Footer>
      </Modal>

      {/* Active Plan Modal */}
      <Modal open={activePlanPopupOpen} overflow>
        <Modal.Title>
          <Translate>New/Edit Active Planned Treatment</Translate>
        </Modal.Title>
        <Modal.Body>
          <Form fluid>
            <MyInput
              disabled={activePlannedTreatment.key}
              width={400}
              fieldName="cdtKey"
              fieldLabel="CDT"
              fieldType="select"
              selectData={cdtListResponse?.data?.object ?? [] ?? []}
              selectDataLabel="description"
              selectDataValue="key"
              renderMenuItem={(label, item) => {
                return (
                  <span>
                    {item.cdtCode} / {item.description}
                  </span>
                );
              }}
              searchBy={(keyword: string, label: ReactNode, item: ItemDataType) =>
                item.cdtCode.toLowerCase().includes(keyword.toLowerCase()) ||
                item.description.toLowerCase().includes(keyword.toLowerCase())
              }
              record={activePlannedTreatment}
              setRecord={setActivePlannedTreatment}
            />
            <MyInput
              width={400}
              fieldType="select"
              fieldLabel="Billing Type"
              fieldName="billingTypeLkey"
              selectData={billingTypeLovQueryResponse?.object ?? []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              record={activePlannedTreatment}
              setRecord={setActivePlannedTreatment}
            />
            <MyInput
              width={400}
              fieldName="fees"
              fieldType="number"
              record={activePlannedTreatment}
              setRecord={setActivePlannedTreatment}
            />
            <MyInput
              width={400}
              fieldName="discount"
              fieldType="number"
              record={activePlannedTreatment}
              setRecord={setActivePlannedTreatment}
            />
            <MyInput
              width={400}
              fieldName="note"
              fieldType="textarea"
              record={activePlannedTreatment}
              setRecord={setActivePlannedTreatment}
            />
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Stack spacing={2} divider={<Divider vertical />}>
            <Button
              appearance="primary"
              onClick={() => {
                savePlannedTreatment({
                  ...activePlannedTreatment,
                  type: 'CURRENT',
                  encounterKey: encounter.key,
                  patientKey: patient.key
                }).unwrap();
              }}
            >
              Save
            </Button>
            <Button appearance="primary" color="red" onClick={() => setActivePlanPopupOpen(false)}>
              Cancel
            </Button>
          </Stack>
        </Modal.Footer>
      </Modal>

      {/* Draft Plan Panel */}
      <Panel
        bordered
        header={
          <h5>
            <Translate>Draft Plan</Translate>
            <IconButton
              style={{ marginLeft: '10px' }}
              appearance="primary"
              color="green"
              icon={<icons.Plus />}
              onClick={() => {
                setDraftPlanPopupOpen(true);
                setDraftPlannedTreatment({ ...newApDentalPlannedTreatment });
              }}
            >
              <Translate>New</Translate>
            </IconButton>
            <IconButton
              style={{ marginLeft: '10px' }}
              appearance="primary"
              color="blue"
              icon={<icons.Edit />}
              disabled={!draftPlannedTreatment || !draftPlannedTreatment.key}
              onClick={() => {
                setDraftPlanPopupOpen(true);
              }}
            >
              <Translate>Edit</Translate>
            </IconButton>
            <IconButton
              style={{ marginLeft: '10px' }}
              appearance="primary"
              color="red"
              icon={<icons.Trash />}
              disabled={!draftPlannedTreatment || !draftPlannedTreatment.key}
              onClick={() => {
                deletePlannedTreatment(draftPlannedTreatment).unwrap();
              }}
            >
              <Translate>Delete</Translate>
            </IconButton>
          </h5>
        }
        style={{ width: '35%', display: 'inline-block', marginRight: '0.5%' }}
      >
        <Table
          data={treatmentPlan.draft}
          height={400}
          rowHeight={60}
          bordered
          onRowClick={rowData => {
            setDraftPlannedTreatment(rowData);
          }}
          rowClassName={isDraftTreatmentSelected}
        >
          <Table.Column flexGrow={1} align="center" fixed>
            <Table.HeaderCell>Visit Number</Table.HeaderCell>
            <Table.Cell dataKey="visitNumber" />
          </Table.Column>
          <Table.Column flexGrow={1} align="center" fixed>
            <Table.HeaderCell>CDT Code</Table.HeaderCell>
            <Table.Cell>
              {rowData => (
                <Translate>{cdtMap[rowData.cdtKey]?.cdtCode ?? rowData.cdtKey}</Translate>
              )}
            </Table.Cell>
          </Table.Column>
          <Table.Column flexGrow={3} align="center" fixed>
            <Table.HeaderCell>Planned Procedure</Table.HeaderCell>
            <Table.Cell>
              {rowData => (
                <Translate>{cdtMap[rowData.cdtKey]?.description ?? rowData.cdtKey}</Translate>
              )}
            </Table.Cell>
          </Table.Column>
          <Column flexGrow={1} align="center">
            <HeaderCell>
              <Translate>Note</Translate>
            </HeaderCell>
            <Cell>
              {rowData =>
                rowData.note && (
                  <Whisper
                    placement="right"
                    controlId="control-id-hover"
                    trigger="hover"
                    speaker={
                      <Tooltip>
                        <span style={{ fontSize: '20px' }}>{rowData.note}</span>
                      </Tooltip>
                    }
                  >
                    <icons.Message style={{ fontSize: '20px' }} />
                  </Whisper>
                )
              }
            </Cell>
          </Column>
        </Table>
      </Panel>

      {/* Active Plan Panel */}
      <Panel
        bordered
        header={
          <h5>
            <Translate>Active Plan</Translate>
            <IconButton
              style={{ marginLeft: '10px' }}
              appearance="primary"
              color="green"
              icon={<icons.Plus />}
              onClick={() => {
                setActivePlanPopupOpen(true);
                setActivePlannedTreatment({ ...newApDentalPlannedTreatment });
              }}
            >
              <Translate>New</Translate>
            </IconButton>
            <IconButton
              style={{ marginLeft: '10px' }}
              appearance="primary"
              color="blue"
              icon={<icons.Edit />}
              disabled={!activePlannedTreatment || !activePlannedTreatment.key}
              onClick={() => {
                setActivePlanPopupOpen(true);
              }}
            >
              <Translate>Edit</Translate>
            </IconButton>
            <IconButton
              style={{ marginLeft: '10px' }}
              appearance="primary"
              color="cyan"
              disabled
              icon={<icons.CheckOutline />}
            >
              <Translate>Sign</Translate>
            </IconButton>
          </h5>
        }
        style={{ width: '64%', display: 'inline-block' }}
      >
        <Table
          data={treatmentPlan.current}
          height={400}
          rowHeight={60}
          bordered
          onRowClick={rowData => {
            setActivePlannedTreatment(rowData);
          }}
          rowClassName={isActiveTreatmentSelected}
        >
          <Table.Column flexGrow={2} align="center" fixed>
            <Table.HeaderCell>CDT Code</Table.HeaderCell>
            <Table.Cell>
              {rowData => (
                <Translate>{cdtMap[rowData.cdtKey]?.cdtCode ?? rowData.cdtKey}</Translate>
              )}
            </Table.Cell>
          </Table.Column>
          <Table.Column flexGrow={4} align="center" fixed>
            <Table.HeaderCell>Procedure</Table.HeaderCell>
            <Table.Cell>
              {rowData => (
                <Translate>{cdtMap[rowData.cdtKey]?.description ?? rowData.cdtKey}</Translate>
              )}
            </Table.Cell>
          </Table.Column>
          <Table.Column flexGrow={1} align="center" fixed>
            <Table.HeaderCell>Tooth</Table.HeaderCell>
            <Table.Cell>
              {rowData =>
                rowData.toothObject ? rowData.toothObject.toothNumber : rowData.toothKey
              }
            </Table.Cell>
          </Table.Column>
          <Table.Column flexGrow={2} align="center" fixed>
            <Table.HeaderCell>Surface</Table.HeaderCell>
            <Table.Cell>
              {rowData =>
                rowData.surfaceLvalue ? rowData.surfaceLvalue.lovDisplayVale : rowData.surfaceLkey
              }
            </Table.Cell>
          </Table.Column>
          <Table.Column flexGrow={2} align="center" fixed>
            <Table.HeaderCell>Billing Type</Table.HeaderCell>
            <Table.Cell>
              {rowData =>
                rowData.billingTypeLvalue
                  ? rowData.billingTypeLvalue.lovDisplayVale
                  : rowData.billingTypeLkey
              }
            </Table.Cell>
          </Table.Column>
          <Table.Column flexGrow={2} align="center" fixed>
            <Table.HeaderCell>Fees</Table.HeaderCell>
            <Table.Cell dataKey="fees" />
          </Table.Column>
          <Table.Column flexGrow={2} align="center" fixed>
            <Table.HeaderCell>Discount</Table.HeaderCell>
            <Table.Cell dataKey="discount" />
          </Table.Column>
          <Column flexGrow={1} align="center">
            <HeaderCell>
              <Translate>Note</Translate>
            </HeaderCell>
            <Cell>
              {rowData =>
                rowData.note && (
                  <Whisper
                    placement="left"
                    controlId="control-id-hover"
                    trigger="hover"
                    speaker={
                      <Tooltip>
                        <span style={{ fontSize: '20px' }}>{rowData.note}</span>
                      </Tooltip>
                    }
                  >
                    <icons.Message style={{ fontSize: '20px' }} />
                  </Whisper>
                )
              }
            </Cell>
          </Column>
        </Table>
      </Panel>
    </>
  );
};

export default TreatmentPlanTab;
