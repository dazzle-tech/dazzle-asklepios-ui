import Translate from '@/components/Translate';
import React, { useState, useEffect } from 'react';
import { Col, Form, Panel, Row } from 'rsuite';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSquarePollHorizontal } from '@fortawesome/free-solid-svg-icons';
import MyInput from '@/components/MyInput';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import './styles.less';
import AddEditIntake from './AddEditIntake';
import AddEditOutput from './AddEditOutput';
import DynamicLineChart from '@/components/Charts/DynamicLineChart/DynamicLineChart';
import SectionContainer from '@/components/SectionsoContainer';
const IntakeOutputBalance = () => {
  const [popupAddIntakeOpen, setPopupAddIntakeOpen] = useState<boolean>(false);
  const [popupAddOutputOpen, setPopupAddOutputOpen] = useState<boolean>(false);
  const [width, setWidth] = useState<number>(window.innerWidth);
  const [totalIntake] = useState(0);
  const [totalOutput] = useState(0);
  const [recordFilterBalance, setRecordFilterBalance] = useState({ fromDate: '', toDate: '' });
  const [recordFilterIntake, setRecordFilterIntake] = useState({ date: '' });
  const [recordFilterOutput, setRecordFilterOutput] = useState({ date: '' });
  const [balance, setBalance] = useState({});
  const [intake, setIntake] = useState({});
  const [output, setOutput] = useState({});

  // class name for selected row
  const isSelected = rowData => {
    if (rowData && balance && rowData.key === balance.key) {
      return 'selected-row';
    } else return '';
  };
  // class name for selected row
  const isSelectedIntake = rowData => {
    if (rowData && intake && rowData.key === intake.key) {
      return 'selected-row';
    } else return '';
  };
  // class name for selected row
  const isSelectedOutput = rowData => {
    if (rowData && output && rowData.key === output.key) {
      return 'selected-row';
    } else return '';
  };

  // dummy data
  const data = [
    {
      key: '1',
      date: '2025-02-15',
      totalIntake: 2500,
      totalOutput: 1800
    },
    {
      key: '2',
      date: '2025-02-16',
      totalIntake: 2800,
      totalOutput: 2200
    },
    {
      key: '3',
      date: '2025-02-17',
      totalIntake: 3200,
      totalOutput: 2900
    },
    {
      key: '4',
      date: '2025-02-18',
      totalIntake: 2400,
      totalOutput: 2600
    }
  ];

  // dummy data
  const intakeData = [
    {
      key: '1',
      date: '2025-02-15',
      time: '08:30',
      intakeType: 'Oral Fluids',
      route: 'Oral',
      volume: 500
    },
    {
      key: '2',
      date: '2025-02-15',
      time: '12:15',
      intakeType: 'IV Fluids',
      route: 'Intravenous',
      volume: 1000
    },
    {
      key: '3',
      date: '2025-02-15',
      time: '16:45',
      intakeType: 'Oral Fluids',
      route: 'Oral',
      volume: 300
    },
    {
      key: '4',
      date: '2025-02-15',
      time: '20:30',
      intakeType: 'IV Fluids',
      route: 'Intravenous',
      volume: 700
    }
  ];

  // dummy data
  const outputData = [
    {
      key: '1',
      date: '2025-02-15',
      time: '09:15',
      outputType: 'Urine',
      volume: 800
    },
    {
      key: '2',
      date: '2025-02-15',
      time: '13:30',
      outputType: 'Urine',
      volume: 600
    },
    {
      key: '3',
      date: '2025-02-15',
      time: '17:45',
      outputType: 'Urine',
      volume: 400
    },
    {
      key: '4',
      date: '2025-02-15',
      time: '22:00',
      outputType: 'Urine',
      volume: 300
    }
  ];

  //icons column (Medical sheets, Edite, Active/Deactivate)
  const iconsForActions = rowData => {
    if (
      rowData.totalIntake - rowData.totalOutput > 2000 ||
      rowData.totalIntake - rowData.totalOutput < -1500
    ) {
      return (
        <div className="container-of-icons">
          <FontAwesomeIcon
            icon={faSquarePollHorizontal}
            color="var(--primary-gray)"
            className="icons-style"
          />
        </div>
      );
    }
  };

  // table Columns
  const tableFluidBalanceColumns = [
    {
      key: 'date',
      title: <Translate>Date</Translate>
    },
    {
      key: 'totalIntake',
      title: <Translate>Total Intake (ml)</Translate>
    },
    {
      key: 'totalOutput',
      title: <Translate>Total Output (ml)</Translate>
    },
    {
      key: 'netBalance',
      title: <Translate>Net Balance</Translate>,
      render: (rowData: any) => {
        return <span>{rowData.totalIntake - rowData.totalOutput}</span>;
      }
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
      render: rowData => iconsForActions(rowData)
    }
  ];

  // table Columns
  const tableIntakesColumns = [
    {
      key: 'date',
      title: <Translate>Date</Translate>
    },
    {
      key: 'time',
      title: <Translate>Time</Translate>
    },
    {
      key: 'intakeType',
      title: <Translate>Intake Type</Translate>
    },
    {
      key: 'route',
      title: <Translate>Route</Translate>
    },
    {
      key: 'volume',
      title: <Translate>Volume</Translate>
    }
  ];

  // table Columns
  const tableOutputsColumns = [
    {
      key: 'date',
      title: <Translate>Date</Translate>
    },
    {
      key: 'time',
      title: <Translate>Time</Translate>
    },
    {
      key: 'outputType',
      title: <Translate>Output Type</Translate>
    },
    {
      key: 'volume',
      title: <Translate>Volume</Translate>
    }
  ];

  // Filter form rendered above the table
  const filters = () => (
    <Form layout="inline" fluid>
      <MyInput
        column
        fieldName="fromDate"
        fieldType="date"
        record={recordFilterBalance}
        setRecord={setRecordFilterBalance}
      />
      <MyInput
        column
        fieldName="toDate"
        fieldType="date"
        record={recordFilterBalance}
        setRecord={setRecordFilterBalance}
      />
    </Form>
  );

  // Effects
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <Row gutter={15} className="d">
      <Col md={12}>
        <Row>
          <SectionContainer
            title="Fluid Balance"
            content={
              <>
                <MyTable
                  data={data}
                  columns={tableFluidBalanceColumns}
                  rowClassName={isSelected}
                  filters={filters()}
                  onRowClick={rowData => {
                    setBalance(rowData);
                  }}
                />
              </>
            }
          />
        </Row>
        <Row>
          <SectionContainer
            title="Total Balance Change per Date"
            content={
              <Panel>
                <DynamicLineChart
                  maxValue={7000}
                  title="Balance Change"
                  chartData={[
                    { x: '2025-09-19', y: 1450 },
                    { x: '2025-09-20', y: -300 },
                    { x: '2025-09-21', y: 1200 },
                    { x: '2025-09-22', y: -500 },
                    { x: '2025-09-23', y: 750 }
                  ]}
                />
              </Panel>
            }
          />
        </Row>
      </Col>
      <Col md={12}>
        <Row>
          <SectionContainer 
           title={<>Intakes
           
                           <MyButton
                prefixIcon={() => <AddOutlineIcon />}
                color="var(--deep-blue)"
                onClick={() => {
                  setPopupAddIntakeOpen(true);
                }}
                width="90px"
              >
                Add
              </MyButton>
              </>}
           content={
            <>
            <div className="container-of-add-new-button"></div>
            <Form fluid layout="inline" className="container-of-header-intake">
              <MyInput
                fieldName="date"
                fieldType="date"
                record={recordFilterIntake}
                setRecord={setRecordFilterIntake}
                showLabel={false}
              />
            </Form>
            <MyTable
              data={intakeData}
              columns={tableIntakesColumns}
              rowClassName={isSelectedIntake}
              onRowClick={rowData => {
                setIntake(rowData);
              }}
            />
            <label>Total Intake: {totalIntake}</label>
            <AddEditIntake
              open={popupAddIntakeOpen}
              setOpen={setPopupAddIntakeOpen}
              width={width}
            />
            </>
           }
          />
        </Row>
        <Row>
          <SectionContainer 
           title={<>Outputs
                <MyButton
                prefixIcon={() => <AddOutlineIcon />}
                color="var(--deep-blue)"
                onClick={() => {
                  setPopupAddOutputOpen(true);
                }}
                width="90px"
              >
                Add
              </MyButton>
              </>}
           content={
            <>
            <div className="container-of-add-new-button"></div>
            <Form fluid layout="inline" className="container-of-header-intake">
              <MyInput
                fieldName="date"
                fieldType="date"
                record={recordFilterOutput}
                setRecord={setRecordFilterOutput}
                showLabel={false}
              />

            </Form>
            <MyTable
              data={outputData}
              columns={tableOutputsColumns}
              rowClassName={isSelectedOutput}
              onRowClick={rowData => {
                setOutput(rowData);
              }}
            />
            <label>Total Output: {totalOutput}</label>
            <AddEditOutput
              open={popupAddOutputOpen}
              setOpen={setPopupAddOutputOpen}
              width={width}
            />
            </>
           }
          />
        </Row>
      </Col>
    </Row>
  );
};

export default IntakeOutputBalance;
