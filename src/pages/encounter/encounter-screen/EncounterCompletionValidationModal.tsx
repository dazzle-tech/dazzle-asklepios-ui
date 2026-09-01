import React, { useMemo } from 'react';
import MyModal from '@/components/MyModal/MyModal';
import MyButton from '@/components/MyButton/MyButton';
import Translate from '@/components/Translate';
import { Divider } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import { CompletionValidationItem } from './Encounter';

type EncounterCompletionValidationModalProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  items: CompletionValidationItem[];

  onGoToPrescription?: () => void;
  onGoToDiagnosticOrders?: () => void;
};

const sectionCardStyle: React.CSSProperties = {
  padding: '12px',
  border: '1px solid #E5E7EB',
  borderRadius: '8px',
  backgroundColor: '#FAFAFA',
  marginBottom: '10px'
};

const statusStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#6B7280',
  marginTop: '4px'
};

const referenceStyle: React.CSSProperties = {
  fontWeight: 600,
  fontSize: '14px'
};

const EncounterCompletionValidationModal = ({
  open,
  setOpen,
  items,
  onGoToPrescription,
  onGoToDiagnosticOrders
}: EncounterCompletionValidationModalProps) => {
  const prescriptions = useMemo(
    () => items.filter(item => item.type === 'PRESCRIPTION'),
    [items]
  );

  const diagnosticOrders = useMemo(
    () => items.filter(item => item.type === 'DIAGNOSTIC_ORDER'),
    [items]
  );

  return (
    <MyModal
      title="Visit Completion Validation"
      open={open}
      setOpen={setOpen}
      size="650px"
      steps={[
        {
          title: 'Validation',
          icon: <FontAwesomeIcon icon={faTriangleExclamation} />
        }
      ]}
      hideActionBtn
      content={
        <>
          <div
            style={{
              backgroundColor: '#FFF7E6',
              border: '1px solid #FFD591',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '16px'
            }}
          >
            <div
              style={{
                fontWeight: 600,
                marginBottom: '6px'
              }}
            >
              <Translate>Unable to Complete Visit</Translate>
            </div>

            <div
              style={{
                fontSize: '13px'
              }}
            >
              <Translate>
                Please review the following pending items before completing the
                visit.
              </Translate>
            </div>
          </div>

          {prescriptions.length > 0 && (
            <>
              <Divider />

              <h5
                style={{
                  marginBottom: '12px'
                }}
              >
                <Translate>
                  Pending Prescriptions ({prescriptions.length})
                </Translate>
              </h5>

              {prescriptions.map(item => (
                <div
                  key={item.id}
                  style={sectionCardStyle}
                >
                  <div style={referenceStyle}>
                    {item.referenceNumber}
                  </div>

                  {item.status && (
                    <div style={statusStyle}>
                      Status: {item.status}
                    </div>
                  )}
                </div>
              ))}

              <MyButton
                style={{ marginTop: '8px' }}
                onClick={() => {
                  setOpen(false);
                  onGoToPrescription?.();
                }}
              >
                <Translate>Go To Prescription</Translate>
              </MyButton>
            </>
          )}

          {diagnosticOrders.length > 0 && (
            <>
              <Divider />

              <h5
                style={{
                  marginBottom: '12px'
                }}
              >
                <Translate>
                  Pending Diagnostic Orders ({diagnosticOrders.length})
                </Translate>
              </h5>

              {diagnosticOrders.map(item => (
                <div
                  key={item.id}
                  style={sectionCardStyle}
                >
                  <div style={referenceStyle}>
                    {item.referenceNumber}
                  </div>

                  {item.details && (
                    <div
                      style={{
                        marginTop: '4px',
                        fontSize: '13px'
                      }}
                    >
                      {item.details}
                    </div>
                  )}

                  {item.status && (
                    <div style={statusStyle}>
                      Status: {item.status}
                    </div>
                  )}
                </div>
              ))}

              <MyButton
                style={{ marginTop: '8px' }}
                onClick={() => {
                  setOpen(false);
                  onGoToDiagnosticOrders?.();
                }}
              >
                <Translate>Go To Diagnostic Orders</Translate>
              </MyButton>
            </>
          )}

          <Divider />

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end'
            }}
          >
        
          </div>
        </>
      }
    />
  );
};

export default EncounterCompletionValidationModal;