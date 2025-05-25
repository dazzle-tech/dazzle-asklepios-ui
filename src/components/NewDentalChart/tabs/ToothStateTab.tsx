import React from 'react';
import { useGetCdtsByTreatmentQuery, useGetLovValuesByCodeQuery } from '@/services/setupService';
import { Button, Form, IconButton, Panel } from 'rsuite';
import { Box, Typography } from '@mui/material';
import Trash from '@rsuite/icons/Trash';
import Translate from '../../Translate';
import FullTooth from '../../DentalChart/Tooth/Tooth';
import ToothActionCard from '../ToothActionCard/ToothActionCard';
import MyInput from '@/components/MyInput';
import './ToothStateTab.less';

interface ToothStateTabProps {
  selectedTooth: any;
  currentToothAction: any;
  setCurrentToothAction: (action: any) => void;
  selectedCdt: string;
  setSelectedCdt: (cdt: string) => void;
  dentalActionsList: any[];
  dentalActionsMap: any;
  removeToothAction: any;
  clearCurrentAction: () => void;
}

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
  const { data: toothSurfaceLovQueryResponse } = useGetLovValuesByCodeQuery('TOOTH_SURF');
  const { data: treatmentCdtListQueryResponse, isLoading: treatmentCdtListIsLoading } =
    useGetCdtsByTreatmentQuery(currentToothAction.actionKey);

  return (
    <div>
      <Box className="tooth-status-tab-form">
        <Form>
          <Box className="tooth-status-form-row">
            <MyInput
              fieldName="actionKey"
              fieldType="select"
              record={currentToothAction}
              setRecord={setCurrentToothAction}
              placeholder={<Translate>Select Action From List</Translate>}
              disabled={!!currentToothAction.key}
              selectData={dentalActionsList}
              selectDataLabel="description"
              selectDataValue="key"
              renderMenuItem={(label, action) => (
                <div style={{ color: action.type === 'treatment' ? 'green' : 'red' }}>
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
                if (r.existing) setSelectedCdt('');
              }}
              disabled={
                !dentalActionsMap[currentToothAction.actionKey] ||
                dentalActionsMap[currentToothAction.actionKey].type !== 'treatment' ||
                !!currentToothAction.key
              }
              label={<Translate>Existing?</Translate>}
              className="existing-checkbox"
            />

            <MyInput
              fieldName="cdtKey"
              fieldType="select"
              record={{ cdtKey: selectedCdt }}
              setRecord={r => setSelectedCdt(r.cdtKey)}
              disabled={
                !dentalActionsMap[currentToothAction.actionKey] ||
                dentalActionsMap[currentToothAction.actionKey].type !== 'treatment' ||
                currentToothAction.existing
              }
              placeholder={
                <Translate>
                  {currentToothAction.key
                    ? '(+) Add new CDT to this treatment'
                    : 'Select CDT (Treatment Only)'}
                </Translate>
              }
              selectData={treatmentCdtListQueryResponse?.object ?? []}
              loading={treatmentCdtListIsLoading}
              selectDataLabel="description"
              selectDataValue="key"
              renderMenuItem={(label, item) => (
                <span>
                  {item.cdtCode} / {item.description}
                </span>
              )}
              searchBy={(keyword, label, item) =>
                item.cdtCode.toLowerCase().includes(keyword.toLowerCase()) ||
                item.description.toLowerCase().includes(keyword.toLowerCase())
              }
            />

            <MyInput
              fieldName="surfaceKey"
              fieldType="select"
              record={currentToothAction}
              setRecord={setCurrentToothAction}
              disabled={!!currentToothAction.key}
              placeholder={<Translate>Select Surface</Translate>}
              selectData={toothSurfaceLovQueryResponse?.object ?? []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
            />
          </Box>
          <Box className="tooth-status-form-row">
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
                disabled={!currentToothAction.key}
                onClick={() => {
                  removeToothAction({
                    toothKey: selectedTooth.key,
                    key: currentToothAction.key,
                    actionKey: currentToothAction.actionKey,
                    operation: 'REMOVE'
                  }).unwrap();
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
          <FullTooth
            chartTooth={selectedTooth}
            key={selectedTooth.key}
          />
        </Box>

        <Box className="tooth-state-tab-content">
          <Typography variant="h6">
            <Translate>Applied Actions on Tooth</Translate> <b># {selectedTooth.toothNumber}</b>
          </Typography>
          <Box className="tooth-status-applied-actions-cards">
            {selectedTooth.toothActions && selectedTooth.toothActions.length > 0 ? (
              selectedTooth.toothActions.map((action: any) => (
                <Box
                  key={action.key}
                  onClick={() => {
                    setCurrentToothAction({
                      key: action.key,
                      actionKey: action.actionKey,
                      surfaceKey: action.surfaceLkey,
                      note: action.note,
                      existing: action.existing
                    });
                  }}
                  style={{
                    cursor: 'pointer',
                    opacity: currentToothAction.key === action.key ? 0.8 : 1,
                    transform: currentToothAction.key === action.key ? 'scale(1.01)' : 'scale(1)',
                    border:
                      currentToothAction.key === action.key && '1px solid var(--primary-blue)',
                    borderRadius: 10,
                    transition: 'all 0.2s ease'
                  }}
                >
                  <ToothActionCard
                    date={action.createdDate || Date.now()}
                    action={dentalActionsMap[action.actionKey]?.description || 'Unknown Action'}
                    type={dentalActionsMap[action.actionKey]?.type || 'Unknown'}
                    surface={action.surfaceLvalue?.lovDisplayVale || action.surfaceLkey || 'N/A'}
                    note={action.note || 'No notes'}
                    existing={action.existing}
                  />
                </Box>
              ))
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body2" color="text.secondary">
                  No actions applied to this tooth
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Panel>
    </div>
  );
};

export default ToothStateTab;
