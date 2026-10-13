import React, { useEffect, useMemo, useState } from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import Translate from '@/components/Translate';
import MyInput from '@/components/MyInput';
import MyTable from '@/components/MyTable';
import CancellationModal from '@/components/CancellationModal/CancellationModal';
import { ItemDataType } from 'rsuite/esm/@types/common';
import {
  useGetTreatmentPlanByEncounterQuery,
  useCreatePlannedTreatmentMutation,
  useUpdatePlannedTreatmentMutation,
  useCancelPlannedTreatmentMutation
} from '@/services/dental/dentalTreatmentPlanService';
import { useGetAllCdtQuery } from '@/services/setup/cdtCodeService';
import { newApDentalPlannedTreatment } from '@/types/model-types-constructor';
import { toothDisplayLabel } from '@/utils/toothNumber';
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
  const [draftPlannedTreatment, setDraftPlannedTreatment] = useState({
    ...newApDentalPlannedTreatment
  });
  const [activePlannedTreatment, setActivePlannedTreatment] = useState({
    ...newApDentalPlannedTreatment
  });
  const [draftModalOpen, setDraftModalOpen] = useState(false);
  const [activeModalOpen, setActiveModalOpen] = useState(false);
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const [cancelForm, setCancelForm] = useState<any>({ cancellationReason: '' });

  const cdtListResponse = useGetAllCdtQuery({ page: 0, size: 1000, sort: 'id,asc' });

  const treatmentPlanDataResponse = useGetTreatmentPlanByEncounterQuery(encounter?.id, {
    skip: !encounter?.id
  });

  // Tooth-action saves (in the chart tab) can create/alter planned treatments server-side
  // (source = DENTAL_CHART_CDT_TREATMENT) without the treatment-plan API's own tag
  // invalidation being aware of it, since it lives in a separate RTK Query API slice.
  // Re-fetch explicitly whenever that cross-slice trigger flips.
  useEffect(() => {
    if (encounter?.id) {
      treatmentPlanDataResponse.refetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [treatmentPlanTrigger]);

  const [createPlannedTreatment, createPlannedTreatmentMutation] =
    useCreatePlannedTreatmentMutation();
  const [updatePlannedTreatment, updatePlannedTreatmentMutation] =
    useUpdatePlannedTreatmentMutation();
  const [cancelPlannedTreatment, cancelPlannedTreatmentMutation] =
    useCancelPlannedTreatmentMutation();

  const cdtMap = useMemo(() => {
    const cache: Record<number, any> = {};
    (cdtListResponse?.data?.data ?? []).forEach((cdt: any) => {
      cache[cdt.id] = cdt;
    });
    return cache;
  }, [cdtListResponse.data]);

  const treatmentPlan = useMemo(
    () => ({
      draft: treatmentPlanDataResponse?.data?.draftTreatments ?? [],
      current: treatmentPlanDataResponse?.data?.currentTreatments ?? []
    }),
    [treatmentPlanDataResponse.data]
  );

  useEffect(() => {
    if (createPlannedTreatmentMutation.status === 'fulfilled') {
      setTreatmentPlanTrigger(prev => prev * -1);
      setDraftModalOpen(false);
      setActiveModalOpen(false);
    } else if (createPlannedTreatmentMutation.status === 'rejected') {
      dispatch({ type: 'NOTIFY', payload: { msg: 'Save Failed', sev: 'error' } });
    }
  }, [createPlannedTreatmentMutation.status]);

  useEffect(() => {
    if (updatePlannedTreatmentMutation.status === 'fulfilled') {
      setTreatmentPlanTrigger(prev => prev * -1);
      setDraftModalOpen(false);
      setActiveModalOpen(false);
    } else if (updatePlannedTreatmentMutation.status === 'rejected') {
      dispatch({ type: 'NOTIFY', payload: { msg: 'Save Failed', sev: 'error' } });
    }
  }, [updatePlannedTreatmentMutation.status]);

  useEffect(() => {
    if (cancelPlannedTreatmentMutation.status === 'fulfilled') {
      setTreatmentPlanTrigger(prev => prev * -1);
      setDraftPlannedTreatment({ ...newApDentalPlannedTreatment });
    } else if (cancelPlannedTreatmentMutation.status === 'rejected') {
      dispatch({ type: 'NOTIFY', payload: { msg: 'Cancel Failed', sev: 'error' } });
    }
  }, [cancelPlannedTreatmentMutation.status]);

  const buildSavePayload = (treatment: any, type: 'DRAFT' | 'CURRENT') => ({
    patientId: patient?.id,
    encounterId: encounter?.id,
    type,
    visitNumber: treatment.visitNumber ?? null,
    cdtCodeId: treatment.cdtCodeId ?? null,
    toothId: treatment.toothId ?? null,
    note: treatment.note ?? null,
    surface: treatment.surface ?? null,
    fees: Math.min(99, Math.max(-99, Math.round(Number(treatment.fees) || 0))),
    insurance: treatment.insurance ?? 0,
    discount: Math.min(99, Math.max(-99, Math.round(Number(treatment.discount) || 0)))
  });

  const saveDraftTreatment = () => {
    const body = buildSavePayload(draftPlannedTreatment, 'DRAFT');
    if (draftPlannedTreatment.id) {
      updatePlannedTreatment({ id: draftPlannedTreatment.id, body }).unwrap();
    } else {
      createPlannedTreatment(body).unwrap();
    }
  };

  const saveActiveTreatment = () => {
    const body = buildSavePayload(activePlannedTreatment, 'CURRENT');
    if (activePlannedTreatment.id) {
      updatePlannedTreatment({ id: activePlannedTreatment.id, body }).unwrap();
    } else {
      createPlannedTreatment(body).unwrap();
    }
  };

  const handleCancelDraft = async () => {
    if (!draftPlannedTreatment.id) {
      setConfirmCancelOpen(false);
      return;
    }
    try {
      await cancelPlannedTreatment({
        id: draftPlannedTreatment.id,
        body: { cancellationReason: cancelForm.cancellationReason || '' }
      }).unwrap();
      setConfirmCancelOpen(false);
      setCancelForm({ cancellationReason: '' });
    } catch (error) {
      setConfirmCancelOpen(false);
    }
  };

  const draftColumns = [
    {
      key: 'visitNumber',
      title: <Translate>Visit #</Translate>,
      render: row => row.visitNumber
    },
    {
      key: 'cdtCode',
      title: <Translate>CDT</Translate>,
      render: row => cdtMap[row.cdtCodeId]?.code || row.cdtCodeId
    },
    {
      key: 'procedure',
      title: <Translate>Procedure</Translate>,
      render: row => cdtMap[row.cdtCodeId]?.description || row.cdtCodeId
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
            disabled={row.cancelled}
            onClick={() => {
              setDraftPlannedTreatment(row);
              setCancelForm({ cancellationReason: '' });
              setConfirmCancelOpen(true);
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
      render: row => cdtMap[row.cdtCodeId]?.code || row.cdtCodeId
    },
    {
      key: 'procedure',
      title: <Translate>Procedure</Translate>,
      render: row => cdtMap[row.cdtCodeId]?.description || row.cdtCodeId
    },
    {
      key: 'tooth',
      title: <Translate>Tooth</Translate>,
      render: row =>
        row.tooth?.toothNumber ? toothDisplayLabel(row.tooth.toothNumber) : row.toothId
    },
    {
      key: 'surface',
      title: <Translate>Surface</Translate>,
      render: row => row.surface
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
              fieldName="cdtCodeId"
              fieldLabel="CDT"
              fieldType="select"
              selectData={cdtListResponse?.data?.data ?? []}
              selectDataLabel="description"
              selectDataValue="id"
              renderMenuItem={(label, item) => (
                <span>
                  {item.code} / {item.description}
                </span>
              )}
              searchBy={(keyword, _, item: ItemDataType) =>
                item.code.toLowerCase().includes(keyword.toLowerCase()) ||
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
        actionButtonFunction={saveDraftTreatment}
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
              disabled={!!activePlannedTreatment.id}
              fieldName="cdtCodeId"
              fieldLabel="CDT"
              fieldType="select"
              selectData={cdtListResponse?.data?.data ?? []}
              selectDataLabel="description"
              selectDataValue="id"
              renderMenuItem={(label, item) => (
                <span>
                  {item.code} / {item.description}
                </span>
              )}
              searchBy={(keyword, _, item: ItemDataType) =>
                item.code.toLowerCase().includes(keyword.toLowerCase()) ||
                item.description.toLowerCase().includes(keyword.toLowerCase())
              }
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
        actionButtonFunction={saveActiveTreatment}
      />

      <CancellationModal
        title="Cancel Draft Treatment"
        fieldLabel="Cancellation Reason"
        open={confirmCancelOpen}
        setOpen={setConfirmCancelOpen}
        object={cancelForm}
        setObject={setCancelForm}
        handleCancle={handleCancelDraft}
        fieldName="cancellationReason"
        required={true}
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
