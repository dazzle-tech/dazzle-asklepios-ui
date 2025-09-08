import React, { useState, useEffect } from 'react';
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

const DispenseModal = ({ open, setOpen, dispenseData, handleDispenseChange }) => {
  const [dispenseRows, setDispenseRows] = useState(dispenseData || []);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  useEffect(() => {
    setDispenseRows(dispenseData || []);
  }, [dispenseData]);

  const numberPopoverContent = (
    <Popover full>
      <Dropdown.Menu>
        {Array.from({ length: 9 }, (_, groupIndex) => {
          const start = groupIndex * 3 + 1;
          const numbers = [start, start + 1, start + 2];
          return (
            <React.Fragment key={start}>
              <Dropdown.Item divider />
              <Dropdown.Item
                onClick={() => setSelectedKey(numbers.join(','))}
                active={selectedKey === numbers.join(',')}
              >
                <div className="container-of-numbers" style={{ display: 'flex', gap: '8px' }}>
                  {numbers.map(num => (
                    <span key={num}>{num}</span>
                  ))}
                </div>
              </Dropdown.Item>
            </React.Fragment>
          );
        })}
      </Dropdown.Menu>
    </Popover>
  );

  const handleCompleteDispense = key => {
    const rowIndex = dispenseRows.findIndex(row => row.key === key);
    if (rowIndex === -1) return;

    const currentStatus = dispenseRows[rowIndex].status || '';

    const newRow = {
      key: `${rowIndex}-${Date.now()}`,
      wardName: '',
      medicationName: '',
      tolalRequiredDoses: '',
      warehouse: '',
      lotNo: '',
      expiryDate: '',
      availableQty: 0,
      qtyToDispense: 0,
      dispenseUOM: '',
      status: currentStatus // هنا نأخذ الـ status من الصف المضغوط
    };

    const newRows = [...dispenseRows];
    newRows.splice(rowIndex + 1, 0, newRow);

    setDispenseRows(newRows);
  };

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
      render: rowData => (
        <div className="container-of-day-doses-mar">
          <Row>
            <Col md={2}>
              <Whisper placement="bottomStart" trigger="click" speaker={numberPopoverContent}>
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
        const status = rowData.status || '';
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
                contant: ''
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
      actionButtonLabel="Dispense"
      steps={[
        { title: 'Dispense Selected Orders', icon: <FontAwesomeIcon icon={faRightFromBracket} /> }
      ]}
      content={
        <SectionContainer
          title={<div className="title-div"></div>}
          content={
            <div>
              <MyNestedTable
                data={dispenseRows}
                columns={dispenseColumns}
                height={400}
                page={0}
                rowsPerPage={dispenseRows.length}
              />
            </div>
          }
        />
      }
    />
  );
};

export default DispenseModal;
