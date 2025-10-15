import React, { useEffect, useState,useRef  } from 'react';
import { Form, Checkbox, Text } from 'rsuite';
import { CloseOutline } from '@rsuite/icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faEdit, faSprayCanSparkles } from '@fortawesome/free-solid-svg-icons';
import PlusIcon from '@rsuite/icons/Plus';
import MyButton from '@/components/MyButton/MyButton';
import MyTable from '@/components/MyTable';
import SectionContainer from '@/components/SectionsoContainer';
import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import AddEditFluidOrder from './AddEditFluidOrder';
import Additives from './additives';
import './styles.less';

const IVFluidOrder = ({ selectedOrder }: { selectedOrder: any }) => {
  const [fluidOrder, setFluidOrder] = useState<any>({});
  const [record, setRecord] = useState<any>(selectedOrder || {});
  const [openAddEditFluidOrderPopup, setOpenAddEditFluidOrderPopup] = useState(false);
  const [openAdditivesPopup, setOpenAdditivesPopup] = useState(false);
  const [width, setWidth] = useState(window.innerWidth);

  // Dummy data
  const data = [
    {
      key: '1',
      fluidType: 'Normal Saline 0.9%',
      volume: '1000',
      route: 'Peripheral IV',
      infusionRate: '125',
      frequency: 'Once',
      duration: 'Until Complete',
      untilComplete: true,
      device: 'IV Pump',
      indication: 'Dehydration treatment',
      notesToNurse: 'Monitor for fluid overload',
      priority: 'high',
      allergyChecked: 'yes',
      startTime: '08:30',
      estimatedEndTime: '16:30',
      createdBy: 'Dr. Sarah Johnson',
      createdAt: '08:00',
      submittedBy: 'Nurse Anna',
      submittedAt: '08:10',
      cancelledBy: '',
      cancelledAt: '',
      cancellationReason: ''
    },
    {
      key: '2',
      fluidType: "Lactated Ringer's",
      volume: '500',
      route: 'Central Line',
      infusionRate: '83',
      frequency: 1,
      duration: '6',
      untilComplete: false,
      device: 'IV Pump',
      indication: 'Post-operative fluid replacement',
      notesToNurse: 'Check potassium levels',
      priority: 'medium',
      allergyChecked: 'yes',
      startTime: '14:00',
      estimatedEndTime: '20:00',
      createdBy: 'Dr. Michael Chen',
      createdAt: '13:45',
      submittedBy: 'Nurse Kate',
      submittedAt: '13:50',
      cancelledBy: '',
      cancelledAt: '',
      cancellationReason: ''
    }
  ];

  const isSelected = (rowData: any) => (rowData?.key === fluidOrder?.key ? 'selected-row' : '');

  const iconsForActions = (rowData: any) => (
    <div className="container-of-icons">
      <FontAwesomeIcon
        title="Additives"
        color="var(--primary-gray)"
        className="icons-style"
        icon={faSprayCanSparkles}
        onClick={() => setOpenAdditivesPopup(true)}
      />
      <FontAwesomeIcon
        title="Edit"
        color="var(--primary-gray)"
        className="icons-style"
        icon={faEdit}
        onClick={() => handleEdit(rowData)}
      />
    </div>
  );

  const tableColumns = [
    { key: 'fluidType', title: <Translate>Fluid Type</Translate> },
    { key: 'volume', title: <Translate>Volume</Translate> },
    { key: 'route', title: <Translate>Route</Translate> },
    { key: 'infusionRate', title: <Translate>Infusion Rate</Translate> },
    { key: 'frequency', title: <Translate>Frequency</Translate> },
    { key: 'duration', title: <Translate>Duration</Translate> },
    { key: 'device', title: <Translate>Device</Translate> },
    { key: 'indication', title: <Translate>Indication</Translate> },
    {
      key: 'actions',
      title: <Translate>Actions</Translate>,
      render: (rowData: any) => iconsForActions(rowData)
    },
    { key: 'notesToNurse', title: <Translate>Notes to Nurse</Translate>, expandable: true },
    { key: 'priority', title: <Translate>Priority</Translate>, expandable: true },
    { key: 'allergyChecked', title: <Translate>Allergy Checked</Translate>, expandable: true },
    { key: 'startTime', title: <Translate>Start Time</Translate>, expandable: true },
    { key: 'estimatedEndTime', title: <Translate>Estimated End Time</Translate>, expandable: true },
    {
      key: 'createdByAt',
      title: <Translate>Created By\At</Translate>,
      expandable: true,
      render: (rowData: any) =>
        rowData.createdBy ? (
          <>
            {rowData.createdBy}
            <br />
            <span className="date-table-style">{rowData.createdAt}</span>
          </>
        ) : null
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
    }
  ];
  // handles
  const handleNew = () => {
    setOpenAddEditFluidOrderPopup(true);
    setFluidOrder({ untilCompleted: true });
    setRecord({});
  };

  const handleEdit = (rowData: any) => {
    setFluidOrder(rowData);
    setRecord(rowData);
    setOpenAddEditFluidOrderPopup(true);
  };
  // Effects
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);



  const tableRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        tableRef.current &&
        !tableRef.current.contains(event.target as Node) &&
        previewRef.current &&
        !previewRef.current.contains(event.target as Node)
      ) {
        setFluidOrder({});
        setRecord({});
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  return (
    <div>
            <div ref={tableRef}>
      <MyTable
        height={450}
        data={data}
        columns={tableColumns}
        rowClassName={isSelected}
        onRowClick={rowData => {
  if (fluidOrder?.key === rowData.key) {
    setFluidOrder({});
    setRecord({});
  } else {
    setFluidOrder(rowData);
    setRecord({
      ...rowData,
      createdByAt: rowData.createdBy ? `${rowData.createdBy} (${rowData.createdAt})` : '',
      submittedByAt: rowData.submittedBy
        ? `${rowData.submittedBy} (${rowData.submittedAt})`
        : '',
      cancelledByAt: rowData.cancelledBy
        ? `${rowData.cancelledBy} (${rowData.cancelledAt})`
        : '',
      cancellationReason: rowData.cancellationReason || ''
    });
  }
}}

        tableButtons={
          <div className="bt-div-2">
            <div className="bt-left-2">
              <MyButton prefixIcon={() => <CloseOutline />}>
                <Translate>Cancel</Translate>
              </MyButton>
              <Checkbox>Show Cancelled</Checkbox>
            </div>

            <div className="bt-right-2">
              <MyButton
                color="var(--deep-blue)"
                prefixIcon={() => <PlusIcon />}
                onClick={handleNew}
                width="100px"
              >
                Add New
              </MyButton>
              <MyButton
                color="var(--deep-blue)"
                prefixIcon={() => <FontAwesomeIcon icon={faCheck} />}
                width="100px"
              >
                Submit
              </MyButton>
            </div>
          </div>
        }
      />
          </div>


      {/* Order Details Section */}
      {fluidOrder?.key && (
                <div ref={previewRef} className="my-order-details-margin">

        <div className="my-order-details-margin">
          <SectionContainer
            title={<Text>Order Details</Text>}
            content={
              <Form className="order-details-row">
                <MyInput
                  fieldName="fluidType"
                  record={record}
                  setRecord={setRecord}
                  disabled={true}
                  width={160}
                />
                <MyInput
                  fieldName="volume"
                  record={record}
                  setRecord={setRecord}
                  disabled={true}
                  width={160}
                />
                <MyInput
                  fieldName="route"
                  record={record}
                  setRecord={setRecord}
                  disabled={true}
                  width={160}
                />
                <MyInput
                  fieldName="infusionRate"
                  record={record}
                  setRecord={setRecord}
                  disabled={true}
                  width={160}
                />
                <MyInput
                  fieldName="frequency"
                  record={record}
                  setRecord={setRecord}
                  disabled={true}
                  width={160}
                />
                <MyInput
                  fieldName="duration"
                  record={record}
                  setRecord={setRecord}
                  disabled={true}
                  width={160}
                />
                <MyInput
                  fieldName="device"
                  record={record}
                  setRecord={setRecord}
                  disabled={true}
                  width={160}
                />
                <MyInput
                  fieldName="indication"
                  record={record}
                  setRecord={setRecord}
                  disabled={true}
                  width={160}
                />
                <MyInput
                  fieldName="notesToNurse"
                  record={record}
                  setRecord={setRecord}
                  disabled={true}
                  width={160}
                />
                <MyInput
                  fieldName="priority"
                  record={record}
                  setRecord={setRecord}
                  disabled={true}
                  width={160}
                />
                <MyInput
                  fieldName="allergyChecked"
                  record={record}
                  setRecord={setRecord}
                  disabled={true}
                  width={160}
                />
                <MyInput
                  fieldName="startTime"
                  record={record}
                  setRecord={setRecord}
                  disabled={true}
                  width={160}
                />
                <MyInput
                  fieldName="estimatedEndTime"
                  record={record}
                  setRecord={setRecord}
                  disabled={true}
                  width={160}
                />

                {/* Columns combined with date */}
                <MyInput
                  fieldName="createdByAt"
                  record={record}
                  setRecord={setRecord}
                  disabled={true}
                  width={160}
                />
                <MyInput
                  fieldName="submittedByAt"
                  record={record}
                  setRecord={setRecord}
                  disabled={true}
                  width={160}
                />
                <MyInput
                  fieldName="cancelledByAt"
                  record={record}
                  setRecord={setRecord}
                  disabled={true}
                  width={160}
                />
                <MyInput
                  fieldName="cancellationReason"
                  record={record}
                  setRecord={setRecord}
                  disabled={true}
                  width={160}
                />
              </Form>
            }
          />
        </div></div>
      )}

      <AddEditFluidOrder
        open={openAddEditFluidOrderPopup}
        setOpen={setOpenAddEditFluidOrderPopup}
        width={width}
        fluidOrder={fluidOrder}
        setFluidOrder={setFluidOrder}
      />
      <Additives open={openAdditivesPopup} setOpen={setOpenAdditivesPopup} />
    </div>
  );
};

export default IVFluidOrder;
