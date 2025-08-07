import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faListCheck,
  faBarcode,
  faPills,
  faCirclePause,
  faCircleCheck,
  faCircleStop,
  faClock,
  faBan,
  faTrash
} from '@fortawesome/free-solid-svg-icons';
import MyModal from '@/components/MyModal/MyModal';
import MyTable from '@/components/MyTable';
import './style.less';
import { Tooltip, Whisper, Text, Form } from 'rsuite';
import MyButton from '@/components/MyButton/MyButton';

const TableModal = ({ openModal, setOpenModal }) => {
  const data_one = [
    {
      drugName: 'Aspirin',
      dose: '100mg',
      route: 'Oral',
      type: 'STAT',
      scheduledTime: '2025-01-02 08:00',
      administeredTime: '2025-01-02 08:05'
    },
    {
      drugName: 'Ibuprofen',
      dose: '200mg',
      route: 'Oral',
      type: 'Scheduled',
      scheduledTime: '2025-01-02 09:00',
      administeredTime: ''
    }
  ];

  const columns_one = [
    {
      title: 'Drug Name / Dose / Route',
      key: 'medicationInfo',
      render: (rowData: any) => (
        <span>{`${rowData.drugName} ${rowData.dose} ${rowData.route}`}</span>
      )
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type'
    },
    {
      title: 'Scheduled Time',
      dataIndex: 'scheduledTime',
      key: 'scheduledTime',
      render: (rowData: any) =>
        rowData?.scheduledTime ? (
          <>
            {rowData?.scheduledTime.split(' ')[0]}
            <br />
            <span className="date-table-style">{rowData?.scheduledTime.split(' ')[1]}</span>
          </>
        ) : (
          ''
        )
    },
    {
      title: 'Administered Time',
      dataIndex: 'administeredTime',
      key: 'administeredTime',
      render: (rowData: any) =>
        rowData?.administeredTime ? (
          <>
            {rowData?.administeredTime.split(' ')[0]}
            <br />
            <span className="date-table-style">{rowData?.administeredTime.split(' ')[1]}</span>
          </>
        ) : (
          ''
        )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (rowData: any) => (
        <div className="container-icons">
          <Whisper trigger="hover" placement="top" speaker={<Tooltip>Action</Tooltip>}>
            <FontAwesomeIcon icon={faPills} className="font-aws" />
          </Whisper>
        </div>
      )
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

  const column_two = [
    {
      title: 'Sample Type',
      dataIndex: 'sampleType',
      key: 'sampleType'
    },
    {
      title: 'Tube Type',
      dataIndex: 'tubeType',
      key: 'tubeType'
    },
    {
      title: 'Collected By / At',
      key: 'collectedByAt',
      render: (rowData: any) => (
        <>
          {rowData.collectedBy}
          <br />
          <span className="date-table-style">{rowData.collectedAt}</span>
        </>
      )
    },

    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status'
    },
    {
      title: 'Order Notes',
      dataIndex: 'orderNotes',
      key: 'orderNotes'
    },
    {
      title: 'Actions',
      key: 'actions',
      render: rowData => {
        const tooltip = <Tooltip>parcode</Tooltip>;
        return (
          <Form layout="inline" fluid className="nurse-doctor-form">
            <Whisper trigger="hover" placement="top" speaker={tooltip}>
              <div>
                <FontAwesomeIcon icon={faBarcode} className="font-aws" />
              </div>
            </Whisper>
          </Form>
        );
      }
    }
  ];

  const data_three = [
    {
      sentTime: '2025-08-06 09:15',
      transportMethod: 'Pneumatic Tube',
      confirmation: 'Received at Lab'
    }
  ];

  const column_three = [
    {
      title: 'Sent Time',
      dataIndex: 'sentTime',
      key: 'sentTime'
    },
    {
      title: 'Transport Method',
      dataIndex: 'transportMethod',
      key: 'transportMethod'
    },
    {
      title: 'Confirmation',
      dataIndex: 'confirmation',
      key: 'confirmation'
    },
    {
      title: 'Actions',
      key: 'actions',
      render: rowData => {
        const tooltip = <Tooltip>parcode</Tooltip>;
        return (
          <Form layout="inline" fluid className="nurse-doctor-form">
            <Whisper trigger="hover" placement="top" speaker={tooltip}>
              <div></div>
            </Whisper>
          </Form>
        );
      }
    }
  ];

  const icons = [
    {
      key: '1',
      title: 'Action',
      icon: (
        <Whisper trigger="hover" placement="top" speaker={<Tooltip>Action</Tooltip>}>
          <FontAwesomeIcon icon={faPills} className="icons-style" />
        </Whisper>
      )
    },
    {
      key: '8632641360936162',
      title: 'On Hold',
      icon: (
        <Whisper trigger="hover" placement="top" speaker={<Tooltip>On Hold</Tooltip>}>
          <FontAwesomeIcon
            icon={faCirclePause}
            color="var(--primary-orange)"
            className="icons-style"
          />
        </Whisper>
      )
    },
    {
      key: '8632624584925141',
      title: 'Administered',
      icon: (
        <Whisper trigger="hover" placement="top" speaker={<Tooltip>Administered</Tooltip>}>
          <FontAwesomeIcon
            icon={faCircleCheck}
            color="var(--primary-green)"
            className="icons-style"
          />
        </Whisper>
      )
    },
    {
      key: '8632633074146151',
      title: 'DC',
      icon: (
        <Whisper trigger="hover" placement="top" speaker={<Tooltip>D/C</Tooltip>}>
          <FontAwesomeIcon
            icon={faCircleStop}
            color="var(--primary-pink)"
            className="icons-style"
          />
        </Whisper>
      )
    },
    {
      key: '8632651909869906',
      title: 'Missed',
      icon: (
        <Whisper trigger="hover" placement="top" speaker={<Tooltip>Missed</Tooltip>}>
          <FontAwesomeIcon icon={faClock} className="icons-style" />
        </Whisper>
      )
    },
    {
      key: '8632666911581391',
      title: 'Cancelled',
      icon: (
        <Whisper trigger="hover" placement="top" speaker={<Tooltip>Cancelled</Tooltip>}>
          <FontAwesomeIcon icon={faBan} color="var(--gray-dark)" className="icons-style" />
        </Whisper>
      )
    },
    {
      key: '8632772055422992',
      title: 'DiscardedReturned',
      icon: (
        <Whisper trigger="hover" placement="top" speaker={<Tooltip>Discarded/Returned</Tooltip>}>
          <FontAwesomeIcon icon={faTrash} color="var(--primary-purple)" className="icons-style" />
        </Whisper>
      )
    }
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
            <div className="container-of-icons-keys-mar">
              {icons.map((item, index) => (
                <div key={index} className="container-of-icon-and-key">
                  {item.icon}
                  <Text>{item.title}</Text>
                </div>
              ))}
            </div>
            <MyTable data={data_one} columns={columns_one} />
            <h6>Laboratory</h6>
            <MyTable data={data_two} columns={column_two} />
            <h6>Radiology</h6>
            <MyTable data={data_three} columns={column_three} />
          </div>
        }
        steps={[{ title: 'Order Comparison', icon: <FontAwesomeIcon icon={faListCheck} /> }]}
      />
    </div>
  );
};

export default TableModal;
