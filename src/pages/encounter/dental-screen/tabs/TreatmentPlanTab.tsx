import React, { useEffect, useState } from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import Translate from '@/components/Translate';
import MyInput from '@/components/MyInput';
import MyTable from '@/components/MyTable';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal/DeletionConfirmationModal';
import { ItemDataType } from 'rsuite/esm/@types/common';
import {
  useSavePlannedTreatmentMutation,
  useDeletePlannedTreatmentMutation,
  useFetchTreatmentPlanQuery
} from '@/services/dentalService';
import { useGetCdtsQuery, useGetLovValuesByCodeQuery } from '@/services/setupService';
import { initialListRequest } from '@/types/types';
import { newApDentalPlannedTreatment } from '@/types/model-types-constructor';
import MyModal from '@/components/MyModal/MyModal';
import { Form, Panel, Tabs } from 'rsuite';
import MyButton from '@/components/MyButton/MyButton';
import AssignmentIcon from '@mui/icons-material/Assignment';
import InventoryIcon from '@mui/icons-material/Inventory';

const TreatmentPlanTab = ({
  encounter,
  patient,
  treatmentPlanTrigger,
  setTreatmentPlanTrigger,
  originalChart,
  dispatch
}) => {
  const [treatmentPlan, setTreatmentPlan] = useState({ draft: [], current: [] });
  const [draftPlannedTreatment, setDraftPlannedTreatment] = useState({
    ...newApDentalPlannedTreatment
  });
  const [activePlannedTreatment, setActivePlannedTreatment] = useState({
    ...newApDentalPlannedTreatment
  });
  const [cdtMap, setCdtMap] = useState({});
  const [billingMap, setBillingMap] = useState({});
  const [draftModalOpen, setDraftModalOpen] = useState(false);
  const [activeModalOpen, setActiveModalOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const cdtListResponse = useGetCdtsQuery({
    ...initialListRequest,
    filters: [{ fieldName: 'type_lkey', operator: 'match', value: '277273303968200' }],
    pageSize: 1000
  });

  const { data: billingTypeLovQueryResponse } = useGetLovValuesByCodeQuery('BILLING_TYPE');

  const treatmentPlanDataResponse = useFetchTreatmentPlanQuery(
    { encounterKey: originalChart.encounterKey, trigger: treatmentPlanTrigger },
    { skip: !originalChart.key }
  );

  const [savePlannedTreatment, savePlannedTreatmentMutation] = useSavePlannedTreatmentMutation();
  const [deletePlannedTreatment, deletePlannedTreatmentMutation] =
    useDeletePlannedTreatmentMutation();

  useEffect(() => {
    if (cdtListResponse.status === 'fulfilled') {
      const cache = {};
      cdtListResponse.data.object.forEach(cdt => {
        cache[cdt.key] = cdt;
      });
      setCdtMap(cache);
    }
  }, [cdtListResponse]);

  useEffect(() => {
    if (billingTypeLovQueryResponse) {
      const billingMap = {};
      billingTypeLovQueryResponse.object.forEach(item => {
        billingMap[item.key] = item.lovDisplayVale;
      });
      setBillingMap(billingMap);
    }
  }, [billingTypeLovQueryResponse]);

  useEffect(() => {
    if (treatmentPlanDataResponse?.isSuccess && treatmentPlanDataResponse.data.object) {
      setTreatmentPlan({
        draft: treatmentPlanDataResponse.data.object?.draftTreatments ?? [],
        current: treatmentPlanDataResponse.data.object?.currentTreatments ?? []
      });
    }
  }, [treatmentPlanDataResponse]);

  useEffect(() => {
    if (savePlannedTreatmentMutation.status === 'fulfilled') {
      setTreatmentPlanTrigger(prev => prev * -1);
      setDraftModalOpen(false);
      setActiveModalOpen(false);
    } else if (savePlannedTreatmentMutation.status === 'rejected') {
      dispatch({ type: 'NOTIFY', payload: { msg: 'Save Failed', sev: 'error' } });
    }
  }, [savePlannedTreatmentMutation.status]);

  useEffect(() => {
    if (deletePlannedTreatmentMutation.status === 'fulfilled') {
      setTreatmentPlanTrigger(prev => prev * -1);
      setDraftPlannedTreatment({ ...newApDentalPlannedTreatment });
    } else if (deletePlannedTreatmentMutation.status === 'rejected') {
      dispatch({ type: 'NOTIFY', payload: { msg: 'Delete Failed', sev: 'error' } });
    }
  }, [deletePlannedTreatmentMutation.status]);

  const draftColumns = [
    {
      key: 'visitNumber',
      title: <Translate>Visit #</Translate>,
      render: row => row.visitNumber
    },
    {
      key: 'cdtCode',
      title: <Translate>CDT</Translate>,
      render: row => cdtMap[row.cdtKey]?.cdtCode || row.cdtKey
    },
    {
      key: 'procedure',
      title: <Translate>Procedure</Translate>,
      render: row => cdtMap[row.cdtKey]?.description || row.cdtKey
    },
    {
      key: 'note',
      title: <Translate>Note</Translate>,
      render: row => row.note || '-'
    },
    {
      key: 'actions',
      title: <Translate>Actions</Translate>,
      render: row => (
        <Box display="flex" gap={1}>
          <IconButton
            color="primary"
            size="small"
            onClick={() => {
              setDraftPlannedTreatment(row);
              setDraftModalOpen(true);
            }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            color="error"
            size="small"
            onClick={() => {
              setDraftPlannedTreatment(row);
              setConfirmDeleteOpen(true);
            }}
            className="delete-icon"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      )
    }
  ];

  const activeColumns = [
    {
      key: 'cdtCode',
      title: <Translate>CDT</Translate>,
      render: row => cdtMap[row.cdtKey]?.cdtCode || row.cdtKey
    },
    {
      key: 'procedure',
      title: <Translate>Procedure</Translate>,
      render: row => cdtMap[row.cdtKey]?.description || row.cdtKey
    },
    {
      key: 'tooth',
      title: <Translate>Tooth</Translate>,
      render: row => row.toothObject?.toothNumber || row.toothKey
    },
    {
      key: 'surface',
      title: <Translate>Surface</Translate>,
      render: row => row.surfaceLvalue?.lovDisplayVale || row.surfaceLkey
    },
    {
      key: 'billing',
      title: <Translate>Billing Type</Translate>,
      render: row => billingMap[row.billingTypeLkey] || row.billingTypeLkey
    },
    {
      key: 'fees',
      title: <Translate>Fees</Translate>,
      render: row => row.fees ?? '-'
    },
    {
      key: 'discount',
      title: <Translate>Discount</Translate>,
      render: row => row.discount ?? '-'
    },
    {
      key: 'note',
      title: <Translate>Note</Translate>,
      render: row => row.note || '-'
    },
    {
      key: 'actions',
      title: <Translate>Actions</Translate>,
      render: row => (
        <Box display="flex" gap={1}>
          <IconButton
            color="primary"
            size="small"
            onClick={() => {
              setActivePlannedTreatment(row);
              setActiveModalOpen(true);
            }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Box>
      )
    }
  ];

  return (
    <Panel
      header={
        <Box display="flex" flexDirection="column" gap={1}>
          <Translate>Treatment Plan</Translate>
          <Typography variant="body2" color="textSecondary">
            <Translate>Manage planned treatments for the patient.</Translate>
          </Typography>
        </Box>
      }
      className="treatment-plan-tab"
    >
      {/* Modals */}
      <MyModal
        open={draftModalOpen}
        setOpen={setDraftModalOpen}
        title="Draft Planned Treatment"
        steps={[{ title: 'Draft Treatment Details', icon: <InventoryIcon /> }]}
        size="450px"
        position='right'
        content={() => (
          <Form>
            <MyInput
              width={400}
              fieldName="visitNumber"
              fieldType="number"
              record={draftPlannedTreatment}
              setRecord={setDraftPlannedTreatment}
            />
            <MyInput
              width={400}
              fieldName="cdtKey"
              fieldLabel="CDT"
              fieldType="select"
              selectData={cdtListResponse?.data?.object ?? []}
              selectDataLabel="description"
              selectDataValue="key"
              renderMenuItem={(label, item) => (
                <span>
                  {item.cdtCode} / {item.description}
                </span>
              )}
              searchBy={(keyword, _, item: ItemDataType) =>
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
        )}
        actionButtonFunction={() =>
          savePlannedTreatment({
            ...draftPlannedTreatment,
            type: 'DRAFT',
            encounterKey: encounter.key,
            patientKey: patient.key,
            fees: Math.min(99, Math.max(-99, Math.round(Number(activePlannedTreatment.fees) || 0))),
            discount: Math.min(
              99,
              Math.max(-99, Math.round(Number(activePlannedTreatment.discount) || 0))
            )
          }).unwrap()
        }
      />

      <MyModal
        open={activeModalOpen}
        setOpen={setActiveModalOpen}
        title="Active Planned Treatment"
        size = "450px"
        position='right'
        steps={[{ title: 'Active Treatment Details' , icon: <AssignmentIcon/>}]}
        content={() => (
          <Form>
            <MyInput
              width={400}
              disabled={!!activePlannedTreatment.key}
              fieldName="cdtKey"
              fieldLabel="CDT"
              fieldType="select"
              selectData={cdtListResponse?.data?.object ?? []}
              selectDataLabel="description"
              selectDataValue="key"
              renderMenuItem={(label, item) => (
                <span>
                  {item.cdtCode} / {item.description}
                </span>
              )}
              searchBy={(keyword, _, item: ItemDataType) =>
                item.cdtCode.toLowerCase().includes(keyword.toLowerCase()) ||
                item.description.toLowerCase().includes(keyword.toLowerCase())
              }
              record={activePlannedTreatment}
              setRecord={setActivePlannedTreatment}
            />
            <MyInput
              width={400}
              fieldName="billingTypeLkey"
              fieldType="select"
              fieldLabel="Billing Type"
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
        )}
        actionButtonFunction={() =>
          savePlannedTreatment({
            ...activePlannedTreatment,
            type: 'CURRENT',
            encounterKey: encounter.key,
            patientKey: patient.key,
            fees: Math.min(99, Math.max(-99, Math.round(Number(activePlannedTreatment.fees) || 0))),
            discount: Math.min(
              99,
              Math.max(-99, Math.round(Number(activePlannedTreatment.discount) || 0))
            )
          }).unwrap()
        }
      />

      <DeletionConfirmationModal
        open={confirmDeleteOpen}
        setOpen={setConfirmDeleteOpen}
        itemToDelete="draft treatment"
        actionButtonFunction={() => {
          deletePlannedTreatment(draftPlannedTreatment).unwrap();
          setConfirmDeleteOpen(false);
        }}
        actionType="delete"
      />

      <Box className="tab-content">
        <Tabs defaultActiveKey="1" appearance="pills">
          <Tabs.Tab
            eventKey="1"
            title={
              <Typography className="tab-title">
                Active Plan <span className="number-label">{treatmentPlan.current.length}</span>
              </Typography>
            }
          >
            <Panel
              bordered
              header={
                <Box display="flex" alignItems="center" justifyContent="space-between" py={1}>
                  <Typography className="table-title">Active Plan</Typography>
                  <MyButton
                    onClick={() => {
                      setActivePlannedTreatment({ ...newApDentalPlannedTreatment });
                      setActiveModalOpen(true);
                    }}
                  >
                    <AddIcon />
                    <Translate>Add New</Translate>
                  </MyButton>
                </Box>
              }
              className="active-plan"
            >
              <MyTable
                data={treatmentPlan.current}
                columns={activeColumns}
                onRowClick={row => setActivePlannedTreatment(row)}
                height={300}
              />
            </Panel>
          </Tabs.Tab>
          <Tabs.Tab
            eventKey="2"
            title={
              <Typography className="tab-title">
                Draft Plan <span className="number-label">{treatmentPlan.draft.length}</span>
              </Typography>
            }
          >
            <Panel
              bordered
              header={
                <Box display="flex" alignItems="center" justifyContent="space-between" py={1}>
                  <Typography className="table-title">Draft Plan</Typography>

                  <Box display="flex" gap={1}>
                    <MyButton
                      onClick={() => {
                        setDraftPlannedTreatment({ ...newApDentalPlannedTreatment });
                        setDraftModalOpen(true);
                      }}
                    >
                      <AddIcon />
                      <Translate>Add New</Translate>
                    </MyButton>
                  </Box>
                </Box>
              }
              className="draft-plan"
            >
              <MyTable
                data={treatmentPlan.draft}
                columns={draftColumns}
                onRowClick={row => setDraftPlannedTreatment(row)}
                height={300}
              />
            </Panel>
          </Tabs.Tab>
        </Tabs>
      </Box>
    </Panel>
  );
};

export default TreatmentPlanTab;
