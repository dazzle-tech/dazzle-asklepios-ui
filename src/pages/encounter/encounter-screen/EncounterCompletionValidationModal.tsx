import React, { useMemo } from 'react';
import MyModal from '@/components/MyModal/MyModal';
import MyButton from '@/components/MyButton/MyButton';
import Translate from '@/components/Translate';
import { Divider } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import { CompletionValidationItem } from './Encounter';

interface EncounterCompletionValidationModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  items: CompletionValidationItem[];

  onGoToMedicalSheet: (path: string) => void;
  onGoToPrescription: () => void;
  onGoToDiagnosticOrders: () => void;
}

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

const sectionTitleStyle: React.CSSProperties = {
  marginBottom: '12px',
  fontWeight: 600
};

const missingItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontSize: '13px',
  marginBottom: '6px'
};

const goButtonStyle: React.CSSProperties = {
  marginTop: '8px',
  backgroundColor: 'var(--primary-color)',
  color: '#FFFFFF',
  borderColor: 'var(--primary-color)'
};

const EncounterCompletionValidationModal = ({
  open,
  setOpen,
  items,
  onGoToMedicalSheet,
  onGoToPrescription,
  onGoToDiagnosticOrders
}: EncounterCompletionValidationModalProps) => {
  const medicalSheets = useMemo(
    () => items.filter(item => item.type === 'MEDICAL_SHEET'),
    [items]
  );

  const insuranceItems = useMemo(
    () => items.filter(item => item.type === 'INSURANCE'),
    [items]
  );

  const prescriptions = useMemo(
    () => items.filter(item => item.type === 'PRESCRIPTION'),
    [items]
  );

  const diagnosticOrders = useMemo(
    () => items.filter(item => item.type === 'DIAGNOSTIC_ORDER'),
    [items]
  );

  const totalItems =
    medicalSheets.length +
    insuranceItems.length +
    prescriptions.length +
    diagnosticOrders.length;

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
          {/* =====================================================
              HEADER
          ===================================================== */}
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
                Please review the following incomplete or pending items before
                completing the visit.
              </Translate>
            </div>

            {totalItems > 0 && (
              <div
                style={{
                  marginTop: '8px',
                  fontSize: '12px',
                  color: '#8C5A00',
                  fontWeight: 500
                }}
              >
                {totalItems}{' '}
                <Translate>
                  validation item(s) require attention.
                </Translate>
              </div>
            )}
          </div>

          {/* =====================================================
              MEDICAL SHEETS
          ===================================================== */}
          {medicalSheets.length > 0 &&
            medicalSheets.map(item => {
              const missingItems = item.missingItems ?? [];

              return (
                <React.Fragment
                  key={`medical-sheet-${item.id}-${item.medicalSheetCode}`}
                >
                  <Divider />

                  <h5 style={sectionTitleStyle}>
                    <Translate>
                      {item.medicalSheetName ?? item.referenceNumber}
                    </Translate>
                  </h5>

                  <div style={sectionCardStyle}>
                    {missingItems.length > 0 ? (
                      <div>
                        {missingItems.map((missingItem, index) => (
                          <div
                            key={`${item.id}-missing-${index}`}
                            style={missingItemStyle}
                          >
                            <FontAwesomeIcon
                              icon={faTriangleExclamation}
                            />

                            <span>{missingItem}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      item.details && (
                        <div
                          style={{
                            fontSize: '13px',
                            lineHeight: 1.5
                          }}
                        >
                          {item.details}
                        </div>
                      )
                    )}

                    {item.status && (
                      <div style={statusStyle}>
                        <Translate>Status</Translate>: {item.status}
                      </div>
                    )}
                  </div>

                  {item.medicalSheetPath && (
                    <MyButton
                      style={goButtonStyle}
                      onClick={() => {
                        setOpen(false);
                        onGoToMedicalSheet(item.medicalSheetPath as string);
                      }}
                    >
                      <Translate>
                        Go To {item.medicalSheetName ?? 'Medical Sheet'}
                      </Translate>
                    </MyButton>
                  )}
                </React.Fragment>
              );
            })}

          {/* =====================================================
              INSURANCE
          ===================================================== */}
          {insuranceItems.length > 0 && (
            <>
              <Divider />

              <h5 style={sectionTitleStyle}>
                <Translate>Insurance Validation</Translate>
              </h5>

              {insuranceItems.map(item => (
                <div
                  key={`insurance-${item.id}`}
                  style={{
                    ...sectionCardStyle,
                    borderColor: '#FFD591',
                    backgroundColor: '#FFFBE6'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontWeight: 600,
                      fontSize: '14px'
                    }}
                  >
                    <FontAwesomeIcon
                      icon={faTriangleExclamation}
                    />

                    <Translate>
                      Insurance requirements are incomplete
                    </Translate>
                  </div>

                  {item.details && (
                    <div
                      style={{
                        marginTop: '8px',
                        fontSize: '13px',
                        lineHeight: 1.5
                      }}
                    >
                      {item.details}
                    </div>
                  )}

                  {item.status && (
                    <div style={statusStyle}>
                      <Translate>Status</Translate>: {item.status}
                    </div>
                  )}
                </div>
              ))}
            </>
          )}

          {/* =====================================================
              PRESCRIPTIONS
          ===================================================== */}
          {prescriptions.length > 0 && (
            <>
              <Divider />

              <h5 style={sectionTitleStyle}>
                <Translate>
                  Pending Prescriptions ({prescriptions.length})
                </Translate>
              </h5>

              {prescriptions.map(item => (
                <div
                  key={`prescription-${item.id}`}
                  style={sectionCardStyle}
                >
                  <div style={referenceStyle}>
                    {item.referenceNumber}
                  </div>

                  {item.details && (
                    <div
                      style={{
                        marginTop: '4px',
                        fontSize: '13px',
                        lineHeight: 1.5
                      }}
                    >
                      {item.details}
                    </div>
                  )}

                  {item.status && (
                    <div style={statusStyle}>
                      <Translate>Status</Translate>: {item.status}
                    </div>
                  )}
                </div>
              ))}

              <MyButton
                style={goButtonStyle}
                onClick={() => {
                  setOpen(false);
                  onGoToPrescription();
                }}
              >
                <Translate>Go To Prescription</Translate>
              </MyButton>
            </>
          )}

          {/* =====================================================
              DIAGNOSTIC ORDERS
          ===================================================== */}
          {diagnosticOrders.length > 0 && (
            <>
              <Divider />

              <h5 style={sectionTitleStyle}>
                <Translate>
                  Pending Diagnostic Orders ({diagnosticOrders.length})
                </Translate>
              </h5>

              {diagnosticOrders.map(item => (
                <div
                  key={`diagnostic-${item.id}`}
                  style={sectionCardStyle}
                >
                  <div style={referenceStyle}>
                    {item.referenceNumber}
                  </div>

                  {item.details && (
                    <div
                      style={{
                        marginTop: '4px',
                        fontSize: '13px',
                        lineHeight: 1.5
                      }}
                    >
                      {item.details}
                    </div>
                  )}

                  {item.status && (
                    <div style={statusStyle}>
                      <Translate>Status</Translate>: {item.status}
                    </div>
                  )}
                </div>
              ))}

              <MyButton
                style={goButtonStyle}
                onClick={() => {
                  setOpen(false);
                  onGoToDiagnosticOrders();
                }}
              >
                <Translate>Go To Diagnostic Orders</Translate>
              </MyButton>
            </>
          )}

          {/* =====================================================
              FOOTER
          ===================================================== */}
          <Divider />

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center'
            }}
          >
            <MyButton
              style={goButtonStyle}
              appearance="ghost"
              onClick={() => setOpen(false)}
            >
              <Translate>Close</Translate>
            </MyButton>
          </div>
        </>
      }
    />
  );
};

export default EncounterCompletionValidationModal;