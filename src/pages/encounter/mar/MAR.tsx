import Translate from '@/components/Translate';
import React, { useState, useEffect } from 'react';
import { useAppDispatch } from '@/hooks';
import MyTable from '@/components/MyTable';
import { Col, Form, Panel, Row, Text } from 'rsuite';
import 'react-tabs/style/react-tabs.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPills } from '@fortawesome/free-solid-svg-icons';
import { faCirclePause } from '@fortawesome/free-solid-svg-icons';
import { faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import { faCircleStop } from '@fortawesome/free-solid-svg-icons';
import { faClock } from '@fortawesome/free-solid-svg-icons';
import { faBan } from '@fortawesome/free-solid-svg-icons';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import ReactDOMServer from 'react-dom/server';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import MyCard from '@/components/MyCard';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import MyInput from '@/components/MyInput';
import ActionModal from './ActionModal';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import './styles.less';
const MAR = () => {
  const dispatch = useAppDispatch();
  const [width, setWidth] = useState<number>(window.innerWidth);
  const [medication, setMedication] = useState({ status: '' });
  const [openActionModal, setOpenActionModal] = useState<boolean>(false);

  // Fetch mar Dose Status Lov list response
  const { data: marDoseStatusLovQueryResponse } = useGetLovValuesByCodeQuery('MAR_DOSE_STATUS');

  // Page Header Setup
  const divContent = (
    <div className="page-title">
      <h5>MAR</h5>
    </div>
  );
  const divContentHTML = ReactDOMServer.renderToStaticMarkup(divContent);
  dispatch(setPageCode('MAR'));
  dispatch(setDivContent(divContentHTML));

  // class name for selected row
  const isSelected = rowData => {
    if (rowData && medication && rowData.key === medication.key) {
      return 'selected-row';
    } else return '';
  };

  // array of actions icons
  const icons = [
    {
      key: '1',
      title: 'Action',
      icon: (
        <FontAwesomeIcon
          icon={faPills}
          title="Action"
          onClick={() => setOpenActionModal(true)}
          className="icons-style"
        />
      )
    },
    {
      key: '8632641360936162',
      title: 'On Hold',
      icon: (
        <FontAwesomeIcon
          icon={faCirclePause}
          title="On Hold"
          color="var(--primary-orange)"
          className="icons-style"
        />
      )
    },
    {
      key: '8632624584925141',
      title: 'Administered',
      icon: (
        <FontAwesomeIcon
          icon={faCircleCheck}
          title="Administered"
          color="var(--primary-green)"
          className="icons-style"
        />
      )
    },
    {
      key: '8632633074146151',
      title: 'DC',
      icon: (
        <FontAwesomeIcon
          icon={faCircleStop}
          title="D\C"
          color="var(--primary-pink)"
          className="icons-style"
        />
      )
    },
    {
      key: '8632651909869906',
      title: 'Missed',
      icon: <FontAwesomeIcon icon={faClock} title="Missed" className="icons-style" />
    },
    {
      key: '8632666911581391',
      title: 'MAR_CANCELLED',
      icon: (
        <FontAwesomeIcon
          icon={faBan}
          title="MAR_CANCELLED"
          color="var(--gray-dark)"
          className="icons-style"
        />
      )
    },
    {
      key: '8632772055422992',
      title: 'DiscardedReturned',
      icon: (
        <FontAwesomeIcon
          icon={faTrash}
          title="Discarded\Returned"
          color="var(--primary-purple)"
          className="icons-style"
        />
      )
    }
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
          date: '31/7/2025',
          hour: '06:00',
          status: '1'
        },
        {
          date: '31/7/2025',
          hour: '12:00',
          status: '8632624584925141'
        },
        {
          date: '31/7/2025',
          hour: '18:00',
          status: '8632641360936162'
        },
        {
          date: '31/7/2025',
          hour: '00:00',
          status: '8632633074146151'
        }
      ],
      day2: [
        {
          date: '3/8/2025',
          hour: '06:00',
          status: '8632641360936162'
        },
        {
          date: '3/8/2025',
          hour: '12:00',
          status: '8632633074146151'
        }
      ],
      day3: [
        {
          date: '4/8/2025',
          hour: '06:00',
          status: '8632633074146151'
        },
        {
          date: '4/8/2025',
          hour: '12:00',
          status: '8632772055422992'
        },
        {
          date: '4/8/2025',
          hour: '12:00',
          status: '8632641360936162'
        }
      ],
      day4: [
        {
          date: '5/8/2025',
          hour: '06:00',
          status: '1'
        }
      ],
      day5: [
        {
          date: '5/8/2025',
          hour: '06:00',
          status: '8632651909869906'
        },
        {
          date: '5/8/2025',
          hour: '12:00',
          status: '1'
        },
        {
          date: '5/8/2025',
          hour: '12:00',
          status: '8632641360936162'
        },
        {
          date: '5/8/2025',
          hour: '12:00',
          status: '8632651909869906'
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
          date: '1/8/2025',
          hour: '08:00',
          status: '8632651909869906'
        },
        {
          date: '1/8/2025',
          hour: '20:00',
          status: '8632772055422992'
        }
      ],
      day2: [
        {
          date: '7/8/2025',
          hour: '08:00',
          status: '8632651909869906'
        },
        {
          date: '7/8/2025',
          hour: '20:00',
          status: '1'
        },
        {
          date: '7/8/2025',
          hour: '20:00',
          status: '8632641360936162'
        }
      ],
      day3: [
        {
          date: '8/8/2025',
          hour: '08:00',
          status: '8632772055422992'
        },
        {
          date: '8/8/2025',
          hour: '20:00',
          status: '8632624584925141'
        },
        {
          date: '8/8/2025',
          hour: '21:00',
          status: '1'
        },
        {
          date: '8/8/2025',
          hour: '23:00',
          status: '8632772055422992'
        }
      ],
      day4: [
        {
          date: '9/8/2025',
          hour: '08:00',
          status: '8632651909869906'
        },
        {
          date: '9/8/2025',
          hour: '20:00',
          status: '8632633074146151'
        }
      ],
      day5: [
        {
          date: '10/8/2025',
          hour: '09:00',
          status: '8632624584925141'
        }
      ]
    }
  ];
  // filter Table
  const filters = () => (
    <Form layout="inline" fluid className='container-of-filters-mar' >
      <MyInput
       column
        width={150}
        fieldName="startDate"
        fieldType="date"
        record={medication}
        setRecord={setMedication}
      />
      <MyInput column fieldName="endDate" fieldType="date" record={medication} setRecord={setMedication} />
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
      <MyInput
      column
        fieldName=""
        fieldLabel="Show Cancelled"
        showLabel={false}
        fieldType="check"
        record={medication}
        setRecord={setMedication}
      />
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
          title={<Text>{rowData.name + ' ' + rowData.dose}</Text>}
          contant={
            <>
              <Text>{rowData.rout}</Text>
              <Text>{rowData.frequency}</Text>
              <Text>{rowData.startDate + ' ' + rowData.endDate}</Text>
              <Text>{rowData.type}</Text>
            </>
          }
          showMore={true}
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
              <Col md={9}>
                <Text>{item.date}</Text>
              </Col>
              <Col md={8}>
                <MyBadgeStatus color="#45b887" contant={item.hour} />
              </Col>
              <Col md={7}>
                <>{icons.find(obj => obj.key === item.status).icon}</>
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
              <Col md={9}>
                <Text>{item.date}</Text>
              </Col>
              <Col md={8}>
                <MyBadgeStatus color="#45b887" contant={item.hour} />
              </Col>
              <Col md={7}>
                <>{icons.find(obj => obj.key === item.status).icon}</>
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
              <Col md={9}>
                <Text>{item.date}</Text>
              </Col>
              <Col md={8}>
                <MyBadgeStatus color="#45b887" contant={item.hour} />
              </Col>
              <Col md={7}>
                <>{icons.find(obj => obj.key === item.status).icon}</>
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
              <Col md={9}>
                <Text>{item.date}</Text>
              </Col>
              <Col md={8}>
                <MyBadgeStatus color="#45b887" contant={item.hour} />
              </Col>
              <Col md={7}>
                <>{icons.find(obj => obj.key === item.status).icon}</>
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
              <Col md={9}>
                <Text>{item.date}</Text>
              </Col>
              <Col md={8}>
                <MyBadgeStatus color="#45b887" contant={item.hour} />
              </Col>
              <Col md={7}>
                <>{icons.find(obj => obj.key === item.status).icon}</>
              </Col>
            </Row>
          ))}
        </div>
      )
    }
  ];

  // Effects
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  useEffect(() => {
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent('  '));
    };
  }, [location.pathname, dispatch]);

  return (
    <Panel>
      <br />
      <div className="container-of-icons-keys-mar">
        {icons.map((item, index) => (
          <div key={index} className="container-of-icon-and-key">
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
      <ActionModal
        open={openActionModal}
        setOpen={setOpenActionModal}
        handleSave=""
        width={width}
        icons={icons}
      />
    </Panel>
  );
};
export default MAR;
