import React, { useState } from 'react';
import MyModal from '@/components/MyModal/MyModal';
import MyTable from '@/components/MyTable';
import SampleModal from '@/pages/lab-module-new/SampleModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBan,
  faBarcode,
  faCircleCheck,
  faCirclePause,
  faCircleStop,
  faClipboardList,
  faClock,
  faListCheck,
  faPills,
  faTrash,
  faVialCircleCheck
} from '@fortawesome/free-solid-svg-icons';
import { Form, HStack, Text, Tooltip, Whisper, Popover, Dropdown } from 'rsuite';
import '../style.less';

const icons = [
  { key: '1', title: 'On Hold', icon: <FontAwesomeIcon icon={faCirclePause} /> },
  { key: '2', title: 'Administered', icon: <FontAwesomeIcon icon={faCircleCheck} /> },
  { key: '3', title: 'DC', icon: <FontAwesomeIcon icon={faCircleStop} /> },
  { key: '4', title: 'Missed', icon: <FontAwesomeIcon icon={faClock} /> },
  { key: '5', title: 'Cancelled', icon: <FontAwesomeIcon icon={faBan} /> },
  { key: '6', title: 'DiscardedReturned', icon: <FontAwesomeIcon icon={faTrash} /> }
];

const TableTaskManagment = ({ openModal, setOpenModal }) => {
  const [openSampleModal, setOpenSampleModal] = useState(false);

  // ✅ Dummy Data
  const data_one = [
    {
      drugName: 'Aspirin',
      dose: '100mg',
      route: 'Oral',
      type: 'STAT',
      scheduledTime: '2025-01-02 08:00',
      administeredTime: '2025-01-02 08:05'
    }
  ];

  const data_two = [
    {
      sampleType: 'Blood',
      tubeType: 'EDTA',
      collectedBy: 'Nurse A',
      collectedAt: '2025-08-06',
      status: 'Received',
      orderNotes: 'Routine CBC'
    }
  ];

  const data_three = [
    {
      sentTime: '2025-08-06 09:15',
      transportMethod: 'Tube',
      confirmation: 'Received at Lab'
    }
  ];

  const actionContent = (
    <Popover full>
      <Dropdown.Menu>
        {icons.map(item => (
          <Dropdown.Item key={item.key}>
            <div className="container-of-icon-and-key">
              {item.icon}
              {item.title}
            </div>
          </Dropdown.Item>
        ))}
      </Dropdown.Menu>
    </Popover>
  );

  const columns_one = [
    {
      title: 'Drug Name / Dose / Route',
      render: row => `${row.drugName} ${row.dose} ${row.route}`
    },
    { title: 'Type', dataIndex: 'type' },
    { title: 'Scheduled Time', dataIndex: 'scheduledTime' },
    { title: 'Administered Time', dataIndex: 'administeredTime' },
    {
      title: 'Actions',
      render: () => (
        <Whisper trigger="click" speaker={actionContent}>
          <FontAwesomeIcon icon={faPills} />
        </Whisper>
      )
    }
  ];

  const column_two = [
    { title: 'Sample Type', dataIndex: 'sampleType' },
    { title: 'Tube Type', dataIndex: 'tubeType' },
    {
      title: 'Collected By / At',
      render: row => `${row.collectedBy} - ${row.collectedAt}`
    },
    { title: 'Status', dataIndex: 'status' },
    { title: 'Order Notes', dataIndex: 'orderNotes' },
    {
      title: 'Actions',
      render: () => (
        <FontAwesomeIcon
          icon={faVialCircleCheck}
          onClick={() => setOpenSampleModal(true)}
        />
      )
    }
  ];

  const column_three = [
    { title: 'Sent Time', dataIndex: 'sentTime' },
    { title: 'Transport Method', dataIndex: 'transportMethod' },
    { title: 'Confirmation', dataIndex: 'confirmation' }
  ];

  return (
    <div>
      <MyModal
        open={openModal}
        setOpen={setOpenModal}
        title="Order Comparison"
        content={
          <div className="gapping">
            <h6>Medication</h6>
            <MyTable data={data_one} columns={columns_one} />

            <h6>Laboratory</h6>
            <MyTable data={data_two} columns={column_two} />

            <h6>Radiology</h6>
            <MyTable data={data_three} columns={column_three} />
          </div>
        }
        steps={[{ title: 'Order Comparison', icon: <FontAwesomeIcon icon={faListCheck} /> }]}
      />

      <SampleModal
        open={openSampleModal}
        setOpen={setOpenSampleModal}
      />
    </div>
  );
};

export default TableTaskManagment;