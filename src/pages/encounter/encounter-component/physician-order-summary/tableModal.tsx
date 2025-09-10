import React, { useState } from 'react';
import MyModal from '@/components/MyModal/MyModal';
import MyTable from '@/components/MyTable';
import { useAppDispatch } from '@/hooks';
import SampleModal from '@/pages/lab-module/SampleModal';
import {
  useGetDiagnosticOrderTestQuery,
  useSaveDiagnosticOrderTestMutation
} from '@/services/encounterService';
import { ApDiagnosticOrderTests, ApDiagnosticTest } from '@/types/model-types';
import {
  newApDiagnosticOrders,
  newApDiagnosticOrderTests,
  newApDiagnosticTest
} from '@/types/model-types-constructor';
import { notify } from '@/utils/uiReducerActions';
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
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useLocation } from 'react-router-dom';
import { Form, HStack, Text, Tooltip, Whisper } from 'rsuite';
import { initialListRequest, ListRequest } from '@/types/types';
import { Popover, Dropdown } from 'rsuite';
import './style.less';

const icons = [
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
        <FontAwesomeIcon icon={faCircleStop} color="var(--primary-pink)" className="icons-style" />
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
const TableModal = ({ openModal, setOpenModal }) => {
  const location = useLocation();
  const dispatch = useAppDispatch();

  const patient = location.state?.patient;
  const encounter = location.state?.encounter;
  const edit = location.state?.edit ?? false;
  const [openSampleModal, setOpenSampleModal] = useState(false);
  const [orders, setOrders] = useState<any>({ ...newApDiagnosticOrders });
  const [test, setTest] = useState<ApDiagnosticTest>({ ...newApDiagnosticTest });
  const [showCanceled, setShowCanceled] = useState(true);

  const [orderTest, setOrderTest] = useState<ApDiagnosticOrderTests>({
    ...newApDiagnosticOrderTests,
    processingStatusLkey: '6055029972709625'
  });
  const [listOrdersTestRequest, setListOrdersTestRequest] = useState<ListRequest>({
    ...initialListRequest,
    filters: [
      {
        fieldName: 'patient_key',
        operator: 'match',
        value: patient?.key
      },
      {
        fieldName: 'order_key',
        operator: 'match',
        value: orders?.key || undefined
      },
      {
        fieldName: 'is_valid',
        operator: 'match',
        value: showCanceled
      }
    ]
  });
  const [saveOrderTests, saveOrderTestsMutation] = useSaveDiagnosticOrderTestMutation();
  const [openDetailsModel, setOpenDetailsModel] = useState(false);
  const {
    data: orderTestList,
    refetch: orderTestRefetch,
    isLoading: loadTests
  } = useGetDiagnosticOrderTestQuery({ ...listOrdersTestRequest });
  const handleSaveTest = async () => {
    try {
      await saveOrderTests(orderTest).unwrap();
      setOpenDetailsModel(false);
      dispatch(notify({ msg: 'saved Successfully', sev: 'success' }));

      orderTestRefetch()
        .then(() => {
          console.log('Refetch complete');
        })
        .catch(error => {
          console.error('Refetch failed:', error);
        });
    } catch (error) {
      dispatch(notify('Save Failed'));
    }
  };
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
          <Whisper placement="right" trigger="click" speaker={actionContent}>
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

  const actionContent = (
    <Popover full>
      <Dropdown.Menu>
        {icons.map(item => (
          <Dropdown.Item key={item.key} onClick={() => console.log('Selected:', item.title)}>
            <div className="container-of-icon-and-key">
              {item.icon}
              {item.title}
            </div>
          </Dropdown.Item>
        ))}
      </Dropdown.Menu>
    </Popover>
  );

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
        const barcodeTooltip = <Tooltip>Print Barcode</Tooltip>;
        const SampleTooltip = <Tooltip>Collect Sample</Tooltip>;
        return (
          <Form layout="inline" fluid className="nurse-doctor-form">
            <Whisper trigger="hover" placement="top" speaker={barcodeTooltip}>
              <div>
                <FontAwesomeIcon icon={faBarcode} className="font-aws" />
              </div>
            </Whisper>
            <Whisper placement="top" speaker={SampleTooltip}>
              <HStack spacing={10}>
                <FontAwesomeIcon
                  icon={faVialCircleCheck}
                  className="font-aws"
                  onClick={() => setOpenSampleModal(true)}
                />
              </HStack>
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
    ,
    {
      title: 'Actions',
      key: 'actions',
      render: rowData => {
        const SampleTooltip = <Tooltip>Assessment</Tooltip>;

        return (
          <Form layout="inline" fluid className="nurse-doctor-form">
            <Whisper trigger="hover" placement="top" speaker={SampleTooltip}>
              <div>
                <FontAwesomeIcon icon={faClipboardList} className="font-aws" />
              </div>
            </Whisper>
          </Form>
        );
      }
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
      <SampleModal
        open={openSampleModal}
        setOpen={setOpenSampleModal}
        order={orders}
        test={test}
        orderTest={orderTest}
        patient={patient}
        encounter={encounter}
        edit={edit}
        onSave={handleSaveTest}
      />
    </div>
  );
};

export default TableModal;
