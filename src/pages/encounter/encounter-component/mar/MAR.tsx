import Translate from '@/components/Translate';
import React, { useState, useEffect } from 'react';
import { useAppDispatch } from '@/hooks';
import MyTable from '@/components/MyTable';
import {
  Button,
  ButtonGroup,
  Col,
  Form,
  Panel,
  Popover,
  Row,
  Text,
  Tooltip,
  Whisper
} from 'rsuite';
import 'react-tabs/style/react-tabs.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPills } from '@fortawesome/free-solid-svg-icons';
import { faCirclePause } from '@fortawesome/free-solid-svg-icons';
import { faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import { faCircleStop } from '@fortawesome/free-solid-svg-icons';
import { faClock } from '@fortawesome/free-solid-svg-icons';
import { faBan } from '@fortawesome/free-solid-svg-icons';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import MyCard from '@/components/MyCard';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import MyInput from '@/components/MyInput';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import './styles.less';
import MyButton from '@/components/MyButton/MyButton';
const MAR = () => {
  const dispatch = useAppDispatch();
  const [medication, setMedication] = useState({ status: '' });
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [record, setRecord] = useState({ filter: '', value: '' });

  // Fetch mar Dose Status Lov list response
  const { data: marDoseStatusLovQueryResponse } = useGetLovValuesByCodeQuery('MAR_DOSE_STATUS');

  // class name for selected row
  const isSelected = rowData => {
    if (rowData && medication && rowData.key === medication.key) {
      return 'selected-row';
    } else return '';
  };

  // Available fields for filtering
  const filterFields = [
    { label: 'Status', value: 'status' },
    { label: 'Medication Name', value: 'name' }
  ];

  // handle save action
  const handleSave = () => {
     setOpenKey(null);
  };

  // handle close container
  const handleClose = () => {
     setOpenKey(null);
  };

  // container to choose action appear as a toolTip
  const content = (
    <Popover title="Choose action" className='container-of-choose-action'>
      <Form className='choose-action-form'>
        <MyInput
          fieldType="select"
          fieldName="status"
          selectData={marDoseStatusLovQueryResponse?.object ?? []}
          selectDataLabel="lovDisplayVale"
          selectDataValue="key"
          record={medication}
          showLabel={false}
          setRecord={setMedication}
          menuMaxHeight={150}
          width={270}
          searchable={false}
        />
        <div className="container-of-add-new-button">
          <div className='container-of-buttons-mar'>
          <MyButton
            color="var(--deep-blue)"
            onClick={handleSave}
            width="50px"
          >
            Save
          </MyButton>
          <MyButton
            color="var(--deep-blue)"
            onClick={handleClose}
            width="50px"
          >
            Close
          </MyButton>
          </div>
        </div>
      </Form>
    </Popover>
  );

  // array of actions icons
  const icons = [
    {
      key: '1',
      title: 'Action',
      icon: (
        <FontAwesomeIcon
          icon={faPills}
          title="Action"
          className="icons-style"
        />
      )
    },
    {
      key: '8632641360936162',
      title: 'On Hold',
      icon: (
        <Whisper trigger="hover" placement="top" speaker={<Tooltip>On Hold</Tooltip>}>
          <FontAwesomeIcon
            icon={faCirclePause}
            title="On Hold"
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
            title="Administered"
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
        <Whisper trigger="hover" placement="top" speaker={<Tooltip>D\C</Tooltip>}>
          <FontAwesomeIcon
            icon={faCircleStop}
            title="D\C"
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
          <FontAwesomeIcon icon={faClock} title="Missed" className="icons-style" />
        </Whisper>
      )
    },
    {
      key: '8632666911581391',
      title: 'Cancelled',
      icon: (
        <Whisper trigger="hover" placement="top" speaker={<Tooltip>Cancelled</Tooltip>}>
          <FontAwesomeIcon
            icon={faBan}
            title="Cancelled"
            color="var(--gray-dark)"
            className="icons-style"
          />
        </Whisper>
      )
    },
    {
      key: '8632772055422992',
      title: 'DiscardedReturned',
      icon: (
        <Whisper trigger="hover" placement="top" speaker={<Tooltip>Discarded\Returned</Tooltip>}>
          <FontAwesomeIcon
            icon={faTrash}
            title="Discarded\Returned"
            color="var(--primary-purple)"
            className="icons-style"
          />
        </Whisper>
      )
    }
  ];

  const tableData = [
    {
      type: 'Missed Doses',
      doses: [
        { name: 'Anaflam 50mg', time: '10:00', color: '#d9534f' },
        { name: 'Another Med', time: '11:30', color: '#d9534f' },
        { name: 'Another Med', time: '11:30', color: '#d9534f' }
      ]
    },
    {
      type: 'Due Doses',
      doses: [
        { name: 'Ibuprofen 400mg', time: '14:00', color: '#f0ad4e' },
        { name: 'AzlCare 250mg', time: '14:00', color: '#f0ad4e' }
      ]
    }
  ];

  const maxDoses = Math.max(...tableData.map(row => row.doses.length));

  const columns = [
    {
      key: 'type',
      title: '',
      render: (rowData: any) => <strong>{rowData.type}</strong>
    },
    ...Array.from({ length: maxDoses }, (_, colIndex) => ({
      key: `dose${colIndex}`,
      title: 'Dose',
      render: (rowData: any) => {
        const dose = rowData.doses[colIndex];
        return dose ? (
          <MyBadgeStatus color={dose.color} contant={dose.name + ' ' + dose.time} />
        ) : null;
      }
    }))
  ];

  // dummy data
  const data = [
    {
      key: '0',
      name: 'Paracetamol',
      dose: '500mg',
      rout: 'PO',
      frequency: 'Every 6 Hours',
      startDate: '31/7/2025',
      endDate: '4/8/2025',
      type: 'PRN',
      day1: [
        {
          key: '0',
          date: '31/7/2025',
          hour: '06:00',
          status: '8632641360936162'
        },
        {
          key: '1',
          date: '31/7/2025',
          hour: '12:00',
          status: '8632624584925141'
        },
        {
          key: '2',
          date: '31/7/2025',
          hour: '6:00',
          status: '8632633074146151'
        },
        {
          key: '3',
          date: '1/8/2025',
          hour: '00:00',
          status: '8632651909869906'
        }
      ],
      day2: [
        {
          key: '4',
          date: '1/8/2025',
          hour: '06:00',
          status: '8632772055422992'
        },
        {
          key: '5',
          date: '1/8/2025',
          hour: '12:00',
          status: '8632633074146151'
        },
        {
          key: '6',
          date: '1/8/2025',
          hour: '06:00',
          status: '1'
        },
        {
          key: '7',
          date: '2/8/2025',
          hour: '00:00',
          status: '1'
        }
      ],
      day3: [
        {
          key: '8',
          date: '2/8/2025',
          hour: '06:00',
          status: '1'
        },
        {
          key: '9',
          date: '2/8/2025',
          hour: '12:00',
          status: '1'
        },
        {
          key: '10',
          date: '2/8/2025',
          hour: '6:00',
          status: '1'
        },
        {
          key: '11',
          date: '3/8/2025',
          hour: '00:00',
          status: '1'
        }
      ],
      day4: [
        {
          key: '12',
          date: '3/8/2025',
          hour: '06:00',
          status: '1'
        },
        {
          key: '13',
          date: '3/8/2025',
          hour: '12:00',
          status: '1'
        },
        {
          key: '14',
          date: '3/8/2025',
          hour: '06:00',
          status: '1'
        },
        {
          key: '15',
          date: '4/8/2025',
          hour: '00:00',
          status: '1'
        }
      ],
      day5: [
        {
          key: '16',
          date: '4/8/2025',
          hour: '06:00',
          status: '1'
        },
        {
          key: '17',
          date: '4/8/2025',
          hour: '12:00',
          status: '1'
        },
        {
          key: '18',
          date: '4/8/2025',
          hour: '06:00',
          status: '1'
        },
        {
          key: '19',
          date: '5/8/2025',
          hour: '00:00',
          status: '1'
        }
      ]
    },

    {
      key: '1',
      name: 'Heparin',
      dose: '1000IU',
      rout: 'IV',
      frequency: 'Every 12 Hours',
      startDate: '1/8/2025',
      endDate: '5/8/2025',
      type: 'Scheduled',
      day1: [
        {
          key: '20',
          date: '1/8/2025',
          hour: '08:00',
          status: '8632641360936162'
        },
        {
          key: '21',
          date: '1/8/2025',
          hour: '20:00',
          status: '8632624584925141'
        }
      ],
      day2: [
        {
          key: '22',
          date: '2/8/2025',
          hour: '08:00',
          status: '8632633074146151'
        },
        {
          key: '23',
          date: '2/8/2025',
          hour: '20:00',
          status: '1'
        }
      ],
      day3: [
        {
          key: '24',
          date: '3/8/2025',
          hour: '08:00',
          status: '8632651909869906'
        },
        {
          key: '25',
          date: '3/8/2025',
          hour: '20:00',
          status: '8632772055422992'
        }
      ],
      day4: [
        {
          key: '26',
          date: '4/8/2025',
          hour: '08:00',
          status: '1'
        },
        {
          key: '27',
          date: '4/8/2025',
          hour: '20:00',
          status: '1'
        }
      ],
      day5: [
        {
          key: '28',
          date: '5/8/2025',
          hour: '08:00',
          status: '1'
        },
        {
          key: '29',
          date: '5/8/2025',
          hour: '20:00',
          status: '1'
        }
      ]
    }
  ];
  // filter Table
  const filters = () => (
    <Form layout="inline" fluid className="container-of-filters-mar">
      <div className="container-of-filters-fields-mar">
        <MyInput
          column
          width={150}
          fieldName="startDate"
          fieldType="date"
          record={medication}
          setRecord={setMedication}
        />
        <MyInput
          column
          fieldName="endDate"
          fieldType="date"
          record={medication}
          setRecord={setMedication}
        />
        <MyInput
          column
          selectDataValue="value"
          selectDataLabel="label"
          selectData={filterFields}
          fieldName="filter"
          fieldType="select"
          record={record}
          setRecord={updatedRecord => {
            setRecord({
              ...record,
              filter: updatedRecord.filter,
              value: ''
            });
          }}
          placeholder="Select Filter"
          searchable={false}
        />
        {record['filter'] == 'status' && (
          <MyInput
            column
            fieldType="select"
            fieldName="status"
            selectData={marDoseStatusLovQueryResponse?.object ?? []}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            record={medication}
            setRecord={setMedication}
          />
        )}
        {record['filter'] == 'name' && (
          <MyInput
            column
            fieldLabel="Medication Name"
            fieldName="name"
            record={medication}
            setRecord={setMedication}
          />
        )}
        <MyInput
          column
          fieldName=""
          fieldLabel="Show Cancelled"
          showLabel={false}
          fieldType="check"
          record={medication}
          setRecord={setMedication}
        />
      </div>
      <div className='container-of-select-type'>
        <ButtonGroup size="md">
          <Button>STAT</Button>
          <Button>PRN</Button>
          <Button>Scheduled</Button>
          <Button>Continuous</Button>
        </ButtonGroup>
      </div>
    </Form>
  );

  // Table Columns
  const tableColumns = [
    {
      key: 'card',
      title: <Translate>Medication Card</Translate>,
      render: (rowData: any) => (
        <MyCard
          width={250}
          showArrow={false}
          key="009"
          margin="5px"
          leftArrow={false}
          title={<strong>{rowData.name + ' ' + rowData.dose}</strong>}
          contant={
            <>
              <Text>{rowData.rout}</Text>
              <Text>{rowData.frequency}</Text>
              <Text>{rowData.startDate + ' ' + rowData.endDate}</Text>
              <Text>{rowData.type}</Text>
            </>
          }
        />
      )
    },
    {
      key: 'day1',
      title: <Translate>Day1</Translate>,
      render: (rowData: any) => (
        <div className="container-of-day-doses-mar">
          {rowData.day1.map((item, index) => (
            <Row key={index}>
              <Col md={12}>
                <Text>{item.date}</Text>
              </Col>
              <Col md={10}>
                <MyBadgeStatus color="#45b887" contant={item.hour} />
              </Col>
              <Col md={2}>
                <Whisper
                  placement="right"
                  trigger="click"
                  onClose={() => setOpenKey(null)}
                  open={openKey === item.key}
                  speaker={content}
                >
                  <span
                    onClick={e => {
                      if(item.status == '1' && !openKey){
                      e.stopPropagation();
                      setOpenKey(openKey === item.key ? null : item.key);
                      }
                    }}
                  >
                    {icons.find(obj => obj.key === item.status).icon}
                  </span>
                </Whisper>
              </Col>
            </Row>
          ))}
        </div>
      )
    },
    {
      key: 'day2',
      title: <Translate>Day2</Translate>,
      render: (rowData: any) => (
        <div className="container-of-day-doses-mar">
          {rowData.day2.map((item, index) => (
            <Row key={index}>
              <Col md={12}>
                <Text>{item.date}</Text>
              </Col>
              <Col md={10}>
                <MyBadgeStatus color="#45b887" contant={item.hour} />
              </Col>
             <Col md={2}>
                <Whisper
                  placement="right"
                  trigger="click"
                  onClose={() => setOpenKey(null)}
                  open={openKey === item.key}
                  speaker={content}
                >
                  <span
                    onClick={e => {
                      if(item.status == '1' && !openKey){
                      e.stopPropagation();
                      setOpenKey(openKey === item.key ? null : item.key);
                      }
                    }}
                  >
                    {icons.find(obj => obj.key === item.status).icon}
                  </span>
                </Whisper>
              </Col>
            </Row>
          ))}
        </div>
      )
    },
    {
      key: 'day3',
      title: <Translate>Day3</Translate>,
      render: (rowData: any) => (
        <div className="container-of-day-doses-mar">
          {rowData.day3.map((item, index) => (
            <Row key={index}>
              <Col md={12}>
                <Text>{item.date}</Text>
              </Col>
              <Col md={10}>
                <MyBadgeStatus color="#45b887" contant={item.hour} />
              </Col>
              <Col md={2}>
                <Whisper
                  placement="right"
                  trigger="click"
                  onClose={() => setOpenKey(null)}
                  open={openKey === item.key}
                  speaker={content}
                >
                  <span
                   onClick={e => {
                      if(item.status == '1' && !openKey){
                      e.stopPropagation();
                      setOpenKey(openKey === item.key ? null : item.key);
                      }
                    }}
                  >
                    {icons.find(obj => obj.key === item.status).icon}
                  </span>
                </Whisper>
              </Col>
            </Row>
          ))}
        </div>
      )
    },
    {
      key: 'day4',
      title: <Translate>Day4</Translate>,
      render: (rowData: any) => (
        <div className="container-of-day-doses-mar">
          {rowData.day4.map((item, index) => (
            <Row key={index}>
              <Col md={12}>
                <Text>{item.date}</Text>
              </Col>
              <Col md={10}>
                <MyBadgeStatus color="#45b887" contant={item.hour} />
              </Col>
              <Col md={2}>
                <Whisper
                  placement="right"
                  trigger="click"
                  onClose={() => setOpenKey(null)}
                  open={openKey === item.key}
                  speaker={content}
                >
                  <span
                   onClick={e => {
                      if(item.status == '1' && !openKey){
                      e.stopPropagation();
                      setOpenKey(openKey === item.key ? null : item.key);
                      }
                    }}
                  >
                    {icons.find(obj => obj.key === item.status).icon}
                  </span>
                </Whisper>
              </Col>
            </Row>
          ))}
        </div>
      )
    },
    {
      key: 'day5',
      title: <Translate>Day5</Translate>,
      render: (rowData: any) => (
        <div className="container-of-day-doses-mar">
          {rowData.day5.map((item, index) => (
            <Row key={index}>
              <Col md={12}>
                <Text>{item.date}</Text>
              </Col>
              <Col md={10}>
                <MyBadgeStatus color="#45b887" contant={item.hour} />
              </Col>
              <Col md={2}>
                <Whisper
                  placement="right"
                  trigger="click"
                  onClose={() => setOpenKey(null)}
                  open={openKey === item.key}
                  speaker={content}
                >
                  <span
                    onClick={e => {
                      if(item.status == '1' && !openKey){
                      e.stopPropagation();
                      setOpenKey(openKey === item.key ? null : item.key);
                      }
                    }}
                  >
                    {icons.find(obj => obj.key === item.status).icon}
                  </span>
                </Whisper>
              </Col>
            </Row>
          ))}
        </div>
      )
    }
  ];

  // Effects
  useEffect(() => {
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent('  '));
    };
  }, [location.pathname, dispatch]);

  return (
    <Panel>
      <br />
      <div className="container-of-icons-keys-mar1">
        {icons.map((item, index) => (
          <div key={index} className="container-of-icon-and-key1">
            <>{item.icon}</>
            <Text>{item.title}</Text>
          </div>
        ))}
      </div>
      <br />
      <MyTable
        height={450}
        data={data}
        columns={tableColumns}
        rowClassName={isSelected}
        filters={filters()}
        onRowClick={rowData => {
          setMedication(rowData);
        }}
      />
      <br />
      <MyTable height={200} data={tableData} columns={columns} />
    </Panel>
  );
};
export default MAR;

