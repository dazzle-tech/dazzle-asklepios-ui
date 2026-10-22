import React, { useMemo } from 'react';
import { useGetByDentalActionQuery } from '@/services/setup/dental-action/CdtDentalActionService';
import { useGetCdtByIdsQuery } from '@/services/setup/cdtCodeService';
import { Button, Form, IconButton, Panel } from 'rsuite';
import { Box, Typography } from '@mui/material';
import Trash from '@rsuite/icons/Trash';
import Translate from '../../Translate';
import FullTooth from '../../DentalChart/Tooth/Tooth';
import ToothActionCard from '../ToothActionCard/ToothActionCard';
import MyInput from '@/components/MyInput';
import CancellationModal from '@/components/CancellationModal/CancellationModal';
import { useState } from 'react';
import './ToothStateTab.less';

interface ToothStateTabProps {
  selectedTooth: any;
  currentToothAction: any;
  setCurrentToothAction: (action: any) => void;
  selectedCdt: string | null;
  setSelectedCdt: (cdt: string | null) => void;
  dentalActionsList: any[];
  dentalActionsMap: any;
  removeToothAction: any;
  clearCurrentAction: () => void;
}

const SURFACE_OPTIONS = [
  { key: 'MESIAL', lovDisplayVale: 'Mesial' },
  { key: 'DISTAL', lovDisplayVale: 'Distal' },
  { key: 'BUCCAL', lovDisplayVale: 'Buccal' },
  { key: 'LINGUAL', lovDisplayVale: 'Lingual' },
  { key: 'OCCLUSAL', lovDisplayVale: 'Occlusal' },
  { key: 'INCISAL', lovDisplayVale: 'Incisal' },
  { key: 'FACIAL', lovDisplayVale: 'Facial' },
  { key: 'WHOLE_TOOTH', lovDisplayVale: 'Whole Tooth' }
];

const SURFACE_LABELS: Record<string, string> = SURFACE_OPTIONS.reduce((acc, item) => {
  acc[item.key] = item.lovDisplayVale;
  return acc;
}, {} as Record<string, string>);

const ToothStateTab: React.FC<ToothStateTabProps> = ({
  selectedTooth,
  currentToothAction,
  setCurrentToothAction,
  selectedCdt,
  setSelectedCdt,
  dentalActionsList,
  dentalActionsMap,
  removeToothAction,
  clearCurrentAction
}) => {
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelForm, setCancelForm] = useState<any>({ cancellationReason: '' });

  // Conditions first, then treatments; alphabetical within each group
  const sortedDentalActions = useMemo(
    () =>
      [...(dentalActionsList ?? [])].sort((a, b) => {
        const typeDiff = (a.type === 'TREATMENT' ? 1 : 0) - (b.type === 'TREATMENT' ? 1 : 0);
        if (typeDiff !== 0) return typeDiff;
        return (a.description ?? '').localeCompare(b.description ?? '');
      }),
    [dentalActionsList]
  );

  const { data: cdtDentalActionRows } = useGetByDentalActionQuery(
    currentToothAction.dentalActionId,
    { skip: !currentToothAction.dentalActionId }
  );

  const treatmentCdtIds = useMemo(
    // The setup-service mapping endpoint nests the full CdtCode object under `cdtId`
    // (CdtDentalActionResponseVM.cdtId: CdtCode, not a plain id) — unwrap it.
    () => (cdtDentalActionRows ?? []).map(row => row.cdtId?.id).filter((id): id is number => Boolean(id)),
    [cdtDentalActionRows]
  );

  const { data: treatmentCdtListQueryResponse, isLoading: treatmentCdtListIsLoading } =
    useGetCdtByIdsQuery(treatmentCdtIds, { skip: treatmentCdtIds.length === 0 });

  const handleCancelAction = async () => {
    try {
      await removeToothAction({
        id: currentToothAction.id,
        body: { cancellationReason: cancelForm.cancellationReason || '' }
      }).unwrap();
      setCancelModalOpen(false);
      setCancelForm({ cancellationReason: '' });
    } catch (error) {
      setCancelModalOpen(false);
    }
  };

  return (
    <div>
      <Box className="tooth-status-tab-form">
        <Form>
          <Box className="tooth-status-form-row">
            <MyInput
              fieldName="dentalActionId"
              fieldType="select"
              required
              record={currentToothAction}
              setRecord={setCurrentToothAction}
              placeholder={<Translate>Select Action From List</Translate>}
              disabled={!!currentToothAction.id}
              selectData={sortedDentalActions}
              selectDataLabel="description"
              selectDataValue="id"
              renderMenuItem={(label, action) => (
                <div style={{ color: action.type === 'TREATMENT' ? 'green' : 'red' }}>
                  {action.description}
                </div>
              )}
            />

            <MyInput
              fieldName="existing"
              fieldType="check"
              record={currentToothAction}
              setRecord={r => {
                setCurrentToothAction(r);
                if (r.existing) setSelectedCdt(null);
              }}
              disabled={
                !dentalActionsMap[currentToothAction.dentalActionId] ||
                dentalActionsMap[currentToothAction.dentalActionId].type !== 'TREATMENT' ||
                !!currentToothAction.id
              }
              label={<Translate>Existing?</Translate>}
              className="existing-checkbox"
            />

            <MyInput
            fieldLabel='CDT Code ID'
              fieldName="cdtCodeId"
              fieldType="select"
              required={
                dentalActionsMap[currentToothAction.dentalActionId]?.type === 'TREATMENT' &&
                !currentToothAction.existing
              }
              record={{ cdtCodeId: selectedCdt }}
              setRecord={r => setSelectedCdt(r.cdtCodeId)}
              disabled={
                !dentalActionsMap[currentToothAction.dentalActionId] ||
                dentalActionsMap[currentToothAction.dentalActionId].type !== 'TREATMENT' ||
                currentToothAction.existing
              }
              placeholder={
                <Translate>
                  {currentToothAction.id
                    ? '(+) Add new CDT to this treatment'
                    : 'Select CDT (Treatment Only)'}
                </Translate>
              }
              selectData={treatmentCdtListQueryResponse ?? []}
              loading={treatmentCdtListIsLoading}
              selectDataLabel="description"
              selectDataValue="id"
              renderMenuItem={(label, item) => (
                <span>
                  {item.code} / {item.description}
                </span>
              )}
              searchBy={(keyword, label, item) =>
                item.code.toLowerCase().includes(keyword.toLowerCase()) ||
                item.description.toLowerCase().includes(keyword.toLowerCase())
              }
            />

            <MyInput
              fieldName="surface"
              fieldType="select"
              required
              record={currentToothAction}
              setRecord={setCurrentToothAction}
              disabled={!!currentToothAction.id}
              placeholder={<Translate>Select Surface</Translate>}
              selectData={SURFACE_OPTIONS}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
            />
          </Box>
          <Box className="tooth-status-form-row">
            <MyInput
              fieldName="anesthesiaUsed"
              fieldLabel="Anesthesia"
              fieldType="text"
              record={currentToothAction}
              setRecord={setCurrentToothAction}
              placeholder="Anesthesia"
            />
            <MyInput
              fieldName="dose"
              fieldLabel="Dose"
              fieldType="text"
              record={currentToothAction}
              setRecord={setCurrentToothAction}
              placeholder="Dose"
            />
            <MyInput
              fieldName="note"
              fieldType="text"
              record={currentToothAction}
              setRecord={setCurrentToothAction}
              placeholder="Notes"
              className="note-field"
            />
            <Box className="tooth-status-tab-actions">
              <IconButton
                appearance="primary"
                color="red"
                style={{ marginRight: '10px' }}
                disabled={!currentToothAction.id}
                onClick={() => {
                  setCancelForm({ cancellationReason: '' });
                  setCancelModalOpen(true);
                }}
                icon={<Trash />}
              >
                <Translate>Remove</Translate>
              </IconButton>

              <Button appearance="default" onClick={clearCurrentAction}>
                <Translate>Clear</Translate>
              </Button>
            </Box>
          </Box>
        </Form>
      </Box>

      <Panel bordered className="applied-actions-container">
        <Box className="actions-chart">
          <FullTooth chartTooth={selectedTooth} key={selectedTooth.id} />
          {selectedTooth.actions && selectedTooth.actions.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body2" color="text.secondary">
                No actions applied to this tooth
              </Typography>
            </Box>
          )}
        </Box>

        {selectedTooth.actions && selectedTooth.actions.length > 0 && (
          <Box className="tooth-state-tab-content">
            <Typography variant="h6">
              <Translate>Applied Actions on Tooth</Translate> <b># {selectedTooth.toothNumber}</b>
            </Typography>
            <Box className="tooth-status-applied-actions-cards">
              {selectedTooth.actions.map((action: any) => (
                <Box
                  key={action.id}
                  onClick={() => {
                    setCurrentToothAction({
                      id: action.id,
                      dentalActionId: action.dentalActionId,
                      surface: action.surface,
                      note: action.note,
                      existing: action.existing,
                      anesthesiaUsed: action.anesthesiaUsed,
                      dose: action.dose
                    });
                  }}
                  style={{
                    cursor: 'pointer',
                    opacity: currentToothAction.id === action.id ? 0.8 : 1,
                    transform: currentToothAction.id === action.id ? 'scale(1.01)' : 'scale(1)',
                    border:
                      currentToothAction.id === action.id && '1px solid var(--primary-blue)',
                    borderRadius: 10,
                    transition: 'all 0.2s ease'
                  }}
                >
                  <ToothActionCard
                    date={Date.now()}
                    action={dentalActionsMap[action.dentalActionId]?.description || 'Unknown Action'}
                    type={dentalActionsMap[action.dentalActionId]?.type || 'Unknown'}
                    surface={SURFACE_LABELS[action.surface] || action.surface || 'N/A'}
                    note={action.note || 'No notes'}
                    existing={action.existing}
                    anesthesiaUsed={action.anesthesiaUsed}
                    dose={action.dose}
                  />
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </Panel>

      <CancellationModal
        title="Cancel Tooth Action"
        fieldLabel="Cancellation Reason"
        open={cancelModalOpen}
        setOpen={setCancelModalOpen}
        object={cancelForm}
        setObject={setCancelForm}
        handleCancle={handleCancelAction}
        fieldName="cancellationReason"
        required={true}
      />
    </div>
  );
};

export default ToothStateTab;
