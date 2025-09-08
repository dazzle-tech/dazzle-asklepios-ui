// DispenseModal.jsx
import React, { useState } from 'react';
import { Form, Tooltip, Whisper, Col, Row, Popover, Dropdown } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRightFromBracket, faPlus, faEllipsisVertical } from '@fortawesome/free-solid-svg-icons';
import Translate from '@/components/Translate';
import MyInput from '@/components/MyInput';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import MyButton from '@/components/MyButton/MyButton';
import MyNestedTable from '@/components/MyNestedTable';
import MyModal from '@/components/MyModal/MyModal';
import SectionContainer from '@/components/SectionsoContainer';

const DispenseModal = ({
  open,
  setOpen,
  dispenseData,
  handleDispenseChange,
  handleCompleteDispense
}) => {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const numberPopoverContent = (
    <Popover full>
      <Dropdown.Menu>
        {Array.from({ length: 9 }, (_, index) => {
          const number = index + 1;
          return (
            <React.Fragment key={number}>
              <Dropdown.Item divider />
              <Dropdown.Item
                active={selectedKey === number.toString()}
                onClick={() => setSelectedKey(number.toString())}
              >
                <div className="container-of-icon-and-key1">
                  <FontAwesomeIcon icon={faEllipsisVertical} className="margin-right-8" />
                  {number}
                </div>
              </Dropdown.Item>
            </React.Fragment>
          );
        })}
      </Dropdown.Menu>
    </Popover>
  );
  const dispenseColumns = [
    { key: 'wardName', title: <Translate>Ward Name</Translate> },
    { key: 'medicationName', title: <Translate>Medication Name</Translate> },
    { key: 'tolalRequiredDoses', title: <Translate>Total Required Qty.</Translate> },
    {
      key: 'warehouse',
      title: <Translate>Warehouse</Translate>,
      render: rowData => (
        <Form>
          <MyInput
            fieldName="warehouse"
            fieldLabel=""
            fieldType="select"
            record={rowData}
            setRecord={updatedRow =>
              handleDispenseChange(rowData.key, 'warehouse', updatedRow.warehouse)
            }
            selectData={[
              { label: 'Main', value: 'Main' },
              { label: 'ICU', value: 'ICU' },
              { label: 'Pharmacy', value: 'Pharmacy' }
            ]}
            selectDataLabel="label"
            selectDataValue="value"
            disabled={rowData.status === 'Dispensed'}
          />
        </Form>
      )
    },
    {
      key: 'lotNo',
      title: <Translate>Lot No.</Translate>,
      render: (rowData: any) => (
        <div className="container-of-day-doses-mar">
          <Row>
            <Col md={2}>
              <Whisper placement="right" trigger="click" speaker={numberPopoverContent}>
                <FontAwesomeIcon icon={faEllipsisVertical} title="Action" className="icons-style" />
              </Whisper>
            </Col>
          </Row>
        </div>
      )
    },
    {
      key: 'expiryDate',
      title: <Translate>Expiry Date</Translate>,
      render: rowData => (
        <Form>
          {' '}
          <MyInput
            fieldName="expiryDate"
            fieldLabel=""
            record={{}}
            setRecord={{}}
            value={rowData.expiryDate}
            fieldType="text"
            readOnly
          />
        </Form>
      )
    },
    {
      key: 'availableQty',
      title: <Translate>Available Qty.</Translate>,
      render: rowData => rowData.availableQty || 0
    },
    {
      key: 'qtyToDispense',
      title: <Translate>Qty. to Dispense</Translate>,
      render: rowData => (
        <Form>
          <MyInput
            fieldType="number"
            fieldName="qtyToDispense"
            fieldLabel=""
            record={rowData}
            setRecord={updatedRow =>
              handleDispenseChange(rowData.key, 'qtyToDispense', updatedRow.qtyToDispense)
            }
            disabled={rowData.status === 'Dispensed'}
          />
        </Form>
      )
    },
    { key: 'dispenseUOM', title: <Translate>Dispense UOM</Translate> },
    {
      key: 'status',
      title: <Translate>Status</Translate>,
      render: rowData => {
        const status = rowData.status || 'Pending';
        const getStatusConfig = status => {
          switch (status.toLowerCase()) {
            case 'pending':
              return {
                backgroundColor: 'var(--light-orange)',
                color: 'var(--primary-orange)',
                contant: 'Pending'
              };
            case 'partially dispensed':
              return {
                backgroundColor: 'var(--light-yellow)',
                color: 'var(--primary-yellow)',
                contant: 'Partially Dispensed'
              };
            case 'dispensed':
              return {
                backgroundColor: 'var(--light-green)',
                color: 'var(--primary-green)',
                contant: 'Dispensed'
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
    },

    // Actions column for modal Dispense Selected Orders table
    {
      key: 'actions',
      title: <Translate>Actions</Translate>,
      render: rowData => {
        const tooltipComplete = <Tooltip>Complete Dispensing</Tooltip>;

        return (
          <Form layout="inline" fluid className="nurse-doctor-form">
            {rowData.status?.toLowerCase() === 'partially dispensed' && (
              <Whisper trigger="hover" placement="top" speaker={tooltipComplete}>
                <div>
                  <MyButton
                    size="small"
                    appearance="primary"
                    onClick={() => handleCompleteDispense(rowData.key)}
                  >
                    <FontAwesomeIcon icon={faPlus} />
                  </MyButton>
                </div>
              </Whisper>
            )}
          </Form>
        );
      }
    }
  ];

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Dispense Selected Orders"
      size="75vw"
      position="center"
      content={
        <SectionContainer
          title={
            <div className="title-div">
              <FontAwesomeIcon icon={faRightFromBracket} className="font-small title-div-s" />
              <p className="font-small title-div-ps">Dispense</p>
            </div>
          }
          content={
            <div>
              <MyNestedTable
                data={dispenseData}
                columns={dispenseColumns}
                height={400}
                page={0}
                rowsPerPage={dispenseData.length}
              />

              <div className="flex-20-10">
                <MyButton
                  appearance="primary"
                  onClick={() => console.log('Save Dispense', dispenseData)}
                >
                  Save
                </MyButton>
                <MyButton appearance="ghost" onClick={() => setOpen(false)}>
                  Cancel
                </MyButton>
              </div>
            </div>
          }
        />
      }
    />
  );
};

export default DispenseModal;
