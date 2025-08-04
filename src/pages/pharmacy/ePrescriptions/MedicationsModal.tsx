import React, { useState, useEffect } from 'react';
import { Form } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCapsules, faBottleDroplet } from '@fortawesome/free-solid-svg-icons';
import MyInput from '@/components/MyInput';
import MyTable from '@/components/MyTable';
import MyModal from '@/components/MyModal/MyModal';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import MyButton from '@/components/MyButton/MyButton';
import Translate from '@/components/Translate';
import { formatDateWithoutSeconds } from '@/utils';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import './styles.less';

interface MedicationsModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  selectedPrescription: any;
}

const MedicationsModal: React.FC<MedicationsModalProps> = ({
  open,
  setOpen,
  selectedPrescription
}) => {
  const [medicationChecks, setMedicationChecks] = useState({});
  const [paymentMethodSelected, setPaymentMethodSelected] = useState('');
  const { data: paymentMethodLovQueryResponse } = useGetLovValuesByCodeQuery('PAY_METHOD');
  const { data: currencyLovQueryResponse } = useGetLovValuesByCodeQuery('CURRENCY');
  const { data: encounterPymentMethodLovQueryResponse } = useGetLovValuesByCodeQuery('PAY_TYPS');

  // Reset values when modal opens
  useEffect(() => {
    if (open) {
      setPaymentMethodSelected('');
      setMedicationChecks({});
    }
  }, [open]);

  // Table columns for medications
  const tableMedicationsColumns = [
    {
      key: 'select',
      title: <Translate></Translate>,
      width: 60,
      render: rowData => (
        <MyInput
          fieldType="check"
          fieldName={rowData.key}
          record={medicationChecks}
          setRecord={setMedicationChecks}
          label=""
          fieldLabel=""
        />
      )
    },
    {
      key: 'medication',
      title: <Translate>Medication Name</Translate>,
      width: 100
    },
    {
      key: 'instructions',
      dataKey: 'instructions',
      title: <Translate>Instructions</Translate>,
      width: 275
    },
    {
      key: 'duration',
      title: <Translate>Duration</Translate>
    },
    {
      key: 'qtyToDispense',
      title: <Translate>Total to Dispense</Translate>
    },
    {
      key: 'warehouse',
      title: <Translate>Select warehouse</Translate>,
      render: rowData => (
        <Form>
          <MyInput
            fieldType="select"
            fieldName={rowData.key}
            record={medicationChecks}
            setRecord={setMedicationChecks}
            selectData={[
              { label: 'Main Pharmacy', value: 'Main Pharmacy' },
              { label: 'Emergency Pharmacy', value: 'Emergency Pharmacy' },
              { label: 'Cardiology Pharmacy', value: 'Cardiology Pharmacy' },
              { label: 'ICU Pharmacy', value: 'ICU Pharmacy' },
              { label: 'Diabetes Clinic', value: 'Diabetes Clinic' },
              { label: 'Pediatrics Pharmacy', value: 'Pediatrics Pharmacy' },
              { label: 'Respiratory Clinic', value: 'Respiratory Clinic' }
            ]}
            label=""
            fieldLabel=""
            selectDataLabel="label"
            selectDataValue="value"
            width="100%"
            height={30}
            placeholder="Select warehouse"
          />
        </Form>
      )
    },
    {
      key: 'availableQty',
      title: <Translate>Available qty</Translate>
    },
    {
      key: 'unit',
      title: <Translate>Dispense UOM</Translate>
    },
    {
      key: 'priceCurrency',
      title: <Translate>Price, Currency</Translate>,
      expandable: true
    },
    {
      key: 'DispenseBy/At',
      title: <Translate>Dispense By/At</Translate>,
      expandable: true,
      width: 158,
      render: (row: any) =>
        row?.DispenseAt ? (
          <>
            {row?.DispenseBy}
            <br />
            <span className="date-table-style">{formatDateWithoutSeconds(row.DispenseAt)}</span>
          </>
        ) : (
          ' '
        )
    },
    {
      key: 'status',
      title: <Translate>Status</Translate>,
      render: rowData => {
        const status = rowData.status || 'New';

        const getStatusConfig = status => {
          switch (status) {
            case 'New':
              return {
                backgroundColor: 'var(--light-orange)',
                color: 'var(--primary-orange)',
                contant: 'New'
              };
            case 'Completed':
              return {
                backgroundColor: 'var(--light-green)',
                color: 'var(--primary-green)',
                contant: 'Completed'
              };
            default:
              return {
                backgroundColor: 'var(--background-gray)',
                color: 'var(--primary-gray)',
                contant: 'Unknown'
              };
          }
        };

        const config = getStatusConfig(status);
        return (
          <MyBadgeStatus
            backgroundColor={config.backgroundColor}
            color={config.color}
            contant={config.contant}
          />
        );
      }
    }
  ];

  return (
    <>
      <MyModal
        open={open}
        setOpen={setOpen}
        title={`Medications - ${selectedPrescription?.prescriptionId || ''}`}
        steps={[
          {
            title: 'Medications',
            icon: <FontAwesomeIcon icon={faBottleDroplet} />
          }
        ]}
        content={
          <div className="medications-modal">
            <div className="header-icon">
              <MyButton >
                <FontAwesomeIcon icon={faCapsules} className="icon" />
              </MyButton>
            </div>
            <div className="table-container">
              <MyTable
                data={selectedPrescription?.medications || []}
                columns={tableMedicationsColumns}
                height={400}
              />
            </div>
            <div className="payment-section">
              <Form className="payment-type-form">
                <MyInput
                  width={150}
                  fieldType="text"
                  fieldLabel="Amount To Pay"
                  fieldName="amountToPay"
                  placeholder="10.00$"
                  record={{}}
                  className="payment-field-small"
                  disabled={true}
                />
                <MyInput
                  width={150}
                  fieldType="select"
                  fieldLabel="Payment Type"
                  fieldName="paymentTypeLkey"
                  selectData={encounterPymentMethodLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={{}}
                  className="payment-field-small"
                />
              </Form>
              <Form layout="inline" fluid className="payment-method-form">
                <div className="payment-row">
                  <MyInput
                    column
                    width={180}
                    fieldType="select"
                    fieldLabel="Payment Method"
                    fieldName="PaymentMethod"
                    selectData={paymentMethodLovQueryResponse?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    record={{}}
                    setRecord={newValue => {
                      console.log('Selected Payment Method:', newValue.PaymentMethod);
                      setPaymentMethodSelected(newValue.PaymentMethod);
                    }}
                    className="payment-field"
                  />
                  <div className="amount-section">
                    <MyInput
                      column
                      width={180}
                      fieldLabel="Amount"
                      fieldName={'Amount'}
                      record={{}}
                      setRecord={() => {
                        // Handle amount changes
                      }}
                      className="payment-field"
                    />
                  </div>
                  <MyInput
                    width={180}
                    column
                    fieldType="select"
                    fieldLabel="Currency"
                    fieldName="Currency"
                    selectData={currencyLovQueryResponse?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    record={{}}
                    setRecord={() => {
                      // Handle currency changes
                    }}
                    className="payment-field currency-section"
                  />
                  <MyInput
                    column
                    disabled={true}
                    width={180}
                    fieldLabel="Due Amount"
                    fieldName={'DueAmount'}
                    record={{}}
                    setRecord={() => {
                      // Handle due amount changes
                    }}
                    className="payment-field due-amount-section disabled-field"
                  />
                  <MyInput
                    column
                    disabled={true}
                    width={180}
                    fieldLabel="Patient's Free Balance"
                    fieldName={'PatientFreeBalance'}
                    record={{}}
                    setRecord={() => {
                      // Handle free balance changes
                    }}
                    className="payment-field free-balance-section disabled-field"
                  />
                </div>
                {paymentMethodSelected === '3623962430163299' && (
                  <div className="payment-card-fields">
                    <MyInput
                      column
                      width={180}
                      fieldLabel="Card Number"
                      fieldName={'CardNumber'}
                      record={{}}
                      setRecord={() => {
                        // Handle card number changes
                      }}
                      className="payment-field"
                    />
                    <MyInput
                      column
                      width={180}
                      fieldLabel="Holder Name"
                      fieldName={'HolderName'}
                      record={{}}
                      setRecord={() => {
                        // Handle holder name changes
                      }}
                      className="payment-field"
                    />
                    <MyInput
                      column
                      fieldType="date"
                      fieldLabel="Valid Until"
                      fieldName="ValidUntil"
                      record={{}}
                      setRecord={() => {
                        // Handle valid until changes
                      }}
                      className="payment-field"
                    />
                  </div>
                )}
                {paymentMethodSelected === '3623993823412902' && (
                  <div className="payment-cheque-fields">
                    <MyInput
                      column
                      width={180}
                      fieldLabel="Cheque Number"
                      fieldName={'ChequeNumber'}
                      record={{}}
                      setRecord={() => {
                        // Handle cheque number changes
                      }}
                      className="payment-field"
                    />
                    <MyInput
                      column
                      width={180}
                      fieldLabel="Bank Name"
                      fieldName={'BankName'}
                      record={{}}
                      setRecord={() => {
                        // Handle bank name changes
                      }}
                      className="payment-field"
                    />
                    <MyInput
                      column
                      fieldType="date"
                      fieldLabel="Cheque Due Date"
                      fieldName="ChequeDueDate"
                      record={{}}
                      setRecord={() => {
                        // Handle cheque due date changes
                      }}
                      className="payment-field"
                    />
                  </div>
                )}
                {paymentMethodSelected === '91849731565300' && (
                  <div className="payment-transfer-fields">
                    <MyInput
                      column
                      width={180}
                      fieldLabel="Transfer Number"
                      fieldName={'transferNumber'}
                      record={{}}
                      setRecord={() => {
                        // Handle transfer number changes
                      }}
                      className="payment-field"
                    />
                    <MyInput
                      column
                      width={180}
                      fieldLabel="Bank Name"
                      fieldName={'BankName'}
                      record={{}}
                      setRecord={() => {
                        // Handle bank name changes
                      }}
                      className="payment-field"
                    />
                    <MyInput
                      column
                      fieldType="date"
                      fieldLabel="Transfer Date"
                      fieldName="transferDate"
                      record={{}}
                      setRecord={() => {
                        // Handle transfer date changes
                      }}
                      className="payment-field"
                    />
                  </div>
                )}
              </Form>
              <div className="confirm-button-section">
                <MyButton
                  type="primary"
                  size="md"
                  onClick={() => {
                    // Handle confirm action
                    console.log('Confirm button clicked');
                    // Add your confirmation logic here
                  }}
                >
                  Confirm
                </MyButton>
              </div>
            </div>
          </div>
        }
        hideActionBtn={true}
        size="80vw"
      />
    </>
  );
};

export default MedicationsModal;
