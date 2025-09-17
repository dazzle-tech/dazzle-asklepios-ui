import Translate from '@/components/Translate';
import React, { useState, useEffect } from 'react';
import { Form, Panel, Text } from 'rsuite';
import MyTable from '@/components/MyTable';
import { faTrash, faCircleInfo, faPen, faCheckDouble } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import MyButton from '@/components/MyButton/MyButton';
import PlusIcon from '@rsuite/icons/Plus';
import CancellationModal from '@/components/CancellationModal';
import './styles.less';
import MyInput from '@/components/MyInput';
import AddEditBloodOrder from './AddEditBloodOrder';
import SectionContainer from '@/components/SectionsoContainer';

const BloodOrder = () => {
  const [popupOpen, setPopupOpen] = useState(false);
  const [width, setWidth] = useState<number>(window.innerWidth);
  const [openCancellationReasonModel, setOpenCancellationReasonModel] = useState(false);
  const [bloodOrder, setBloodOrder] = useState<any>({});
  const [record, setRecord] = useState<any>({});
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // class name for selected row
  const isSelected = (rowData: any) =>
    rowData && bloodOrder && rowData.key === bloodOrder.key ? 'selected-row' : '';

  // dummy data
  const data = [
    {
      key: '1',
      productType: 'Packed Red Blood Cells',
      amount: 450,
      reason: 'Severe anemia due to blood loss',
      requestBy: 'Dr. Rawan',
      requestAt: '2025-02-15 10:30',
      previousReaction: true,
      status: 'new',
      submittedBy: 'Nurse Rana',
      submittedAt: '2025-02-15 10:45',
      cancelledBy: '',
      cancelledAt: '',
      cancellationReason: ''
    },
    {
      key: '2',
      productType: 'Fresh Frozen Plasma',
      amount: 300,
      reason: 'Coagulation disorder treatment',
      requestBy: 'Dr. Batool',
      requestAt: '2025-02-16 14:15',
      previousReaction: false,
      status: 'new',
      submittedBy: 'Nurse Hadeel',
      submittedAt: '2025-02-16 14:30',
      cancelledBy: '',
      cancelledAt: '',
      cancellationReason: ''
    }
  ];

  // Handle click on Add New Button
  const handleNew = () => {
    setPopupOpen(true);
    setBloodOrder({});
    setRecord({});
  };

  //icons column ( Edit, Cancel, Submit )
  const iconsForActions = (rowData: any) => (
    <div className="container-of-icons">
      <FontAwesomeIcon
        title="Edit"
        icon={faPen}
        color="var(--primary-gray)"
        className="icons-style"
        onClick={() => {
          setBloodOrder(rowData);
          setRecord(rowData);
          setPopupOpen(true);
        }}
      />
      <FontAwesomeIcon
        title="Cancel"
        icon={faTrash}
        color="var(--primary-gray)"
        className="icons-style"
        onClick={() => {
          setBloodOrder(rowData);
          setOpenCancellationReasonModel(true);
        }}
      />
      <FontAwesomeIcon
        title="Submit"
        icon={faCheckDouble}
        color="var(--primary-gray)"
        className="icons-style"
        onClick={() => {
          console.log('Submit clicked', rowData);
        }}
      />
    </div>
  );

  // table Columns
  const tableColumns = [
    {
      key: 'productType',
      title: <Translate>Product Type</Translate>
    },
    {
      key: 'amount',
      title: <Translate>Amount (ml)</Translate>
    },
    {
      key: 'reason',
      title: <Translate>Reason</Translate>
    },
    {
      key: 'RequestByAt',
      title: <Translate>Request By\At</Translate>,
      render: (rowData: any) =>
        rowData?.requestAt ? (
          <>
            {rowData?.requestBy}
            <br />
            <span className="date-table-style">{rowData?.requestAt}</span>
          </>
        ) : null
    },
    {
      key: 'status',
      title: <Translate>Status</Translate>
    },
    {
      key: 'submittedByAt',
      title: <Translate>Submitted By\At</Translate>,
      expandable: true,
      render: (rowData: any) =>
        rowData.submittedBy ? (
          <>
            {rowData.submittedBy}
            <br />
            <span className="date-table-style">{rowData.submittedAt}</span>
          </>
        ) : null
    },
    {
      key: 'cancelledByAt',
      title: <Translate>Cancelled By\At</Translate>,
      expandable: true,
      render: (rowData: any) =>
        rowData.cancelledBy ? (
          <>
            {rowData.cancelledBy}
            <br />
            <span className="date-table-style">{rowData.cancelledAt}</span>
          </>
        ) : null
    },
    {
      key: 'cancellationReason',
      title: <Translate>Cancellation Reason</Translate>,
      expandable: true,
      render: (rowData: any) =>
        rowData.cancellationReason ? <span>{rowData.cancellationReason}</span> : null
    },
    {
      key: 'icons',
      title: <Translate>Actions</Translate>,
      flexGrow: 4,
      render: (rowData: any) => iconsForActions(rowData)
    }
  ];

  // handle cancel
  const handleCancel = async () => {
    setOpenCancellationReasonModel(false);
  };

  // Effects
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <Panel>
      <Form fluid layout="inline">
        <div className="container-of-header-fields-blood">
          <MyInput
            fieldName="patientBloodGroup"
            fieldType="text"
            record=""
            setRecord=""
            showLabel={false}
            placeholder="Patient Blood Group"
            readonly
            width={200}
          />
          <div className="container-of-buttons-blood">
            <MyButton>Submit</MyButton>
            <MyButton prefixIcon={() => <PlusIcon />} onClick={handleNew}>
              Add
            </MyButton>
          </div>
        </div>
      </Form>

      {/* Table */}
      <MyTable
        data={data}
        columns={tableColumns}
        rowClassName={isSelected}
        expandedRowKeys={[expandedRow || '']}
        onRowClick={(rowData: any) => {
          setBloodOrder(rowData);
          setRecord({
            ...rowData,
            submittedByAt: rowData.submittedBy
              ? `${rowData.submittedBy} (${rowData.submittedAt})`
              : '',
            cancelledByAt: rowData.cancelledBy
              ? `${rowData.cancelledBy} (${rowData.cancelledAt})`
              : '',
            cancellationReason: rowData.cancellationReason || ''
          });
          setExpandedRow(rowData.key);
        }}
      />

      {/* Order Details Section */}
      {bloodOrder?.key && (
        <div className="my-order-details-margin">
          <SectionContainer
            title={<Text>Order Details</Text>}
            content={
              <Form className="order-details-row">
                <MyInput fieldName="productType" record={record} setRecord={setRecord} disabled />
                <MyInput fieldName="amount" record={record} setRecord={setRecord} disabled />
                <MyInput fieldName="reason" record={record} setRecord={setRecord} disabled />
                <MyInput fieldName="status" record={record} setRecord={setRecord} disabled />
                <MyInput fieldName="submittedByAt" record={record} setRecord={setRecord} disabled />
                <MyInput fieldName="cancelledByAt" record={record} setRecord={setRecord} disabled />
                <MyInput
                  fieldName="cancellationReason"
                  record={record}
                  setRecord={setRecord}
                  disabled
                />
              </Form>
            }
          />
        </div>
      )}

      {/* Modals */}
      <CancellationModal
        open={openCancellationReasonModel}
        setOpen={setOpenCancellationReasonModel}
        object={bloodOrder}
        setObject={setBloodOrder}
        handleCancle={handleCancel}
        fieldName="cancelledReason"
        fieldLabel={'Cancelled Reason'}
        title={'Cancellation'}
      />

      <AddEditBloodOrder
        open={popupOpen}
        setOpen={setPopupOpen}
        width={width}
        bloodorder={bloodOrder}
        setBloodOrder={setBloodOrder}
      />
    </Panel>
  );
};

export default BloodOrder;
