import React, { useEffect, useState } from 'react';
import { Checkbox } from 'rsuite';
import PlusIcon from '@rsuite/icons/Plus';
import MyButton from '@/components/MyButton/MyButton';
import Translate from '@/components/Translate';
import CloseOutlineIcon from '@rsuite/icons/CloseOutline';
import MyTable from '@/components/MyTable';
import SectionContainer from '@/components/SectionsoContainer';
import { Line } from 'react-chartjs-2';
import AddEditAnthropometric from './AddEditAnthropometric';
import CancellationModal from '@/components/CancellationModal';
import './styles.less';
import MyTab from '@/components/MyTab';
const Pediatric = () => {
  const [selectedMetric, setSelectedMetric] = useState(null);
  const [selectedMetricLabel, setSelectedMetricLabel] = useState(null);
  const [openAddEditAnthropometric, setOpenAddEditAnthropometric] = useState<boolean>(false);
  const [width, setWidth] = useState<number>(window.innerWidth);
  const [anthropometric, setAanthropometric] = useState({});
  const [openCancelModal, setOpenCancelModal] = useState<boolean>(false);

  // Check if the current row is selected by comparing keys, and return the 'selected-row' class if matched
  const isSelected = rowData => {
    if (rowData && anthropometric && anthropometric.key === rowData.key) {
      return 'selected-row';
    } else return '';
  };

  // dummy data
  const data = [
    {
      key: '0',
      length: 52.3,
      weight: 3.4,
      headCircumference: 34.5,
      bmi: 55,
      weightForAge: 'Normal',
      lengthForAge: 'Above Average',
      hc: 'Normal',
      createdBy: 'Dr. Sarah Ahmad',
      createdAt: '2025-10-18 09:32 AM'
    },
    {
      key: '1',
      length: 48.7,
      weight: 2.9,
      headCircumference: 33.2,
      bmi: 40,
      weightForAge: 'Below Average',
      lengthForAge: 'Normal',
      hc: 'Normal',
      createdBy: 'Dr. Ahmed Khalil',
      createdAt: '2025-10-17 02:10 PM'
    },
    {
      key: '2',
      length: 50.1,
      weight: 3.1,
      headCircumference: 34.0,
      bmi: 60,
      weightForAge: 'Normal',
      lengthForAge: 'Normal',
      hc: 'Above Average',
      createdBy: 'Dr. Rana Yusuf',
      createdAt: '2025-10-15 11:05 AM'
    },
    {
      key: '3',
      length: 54.6,
      weight: 3.9,
      headCircumference: 35.1,
      bmi: 70,
      weightForAge: 'Above Average',
      lengthForAge: 'Above Average',
      hc: 'Normal',
      createdBy: 'Dr. Omar Nasser',
      createdAt: '2025-10-13 04:45 PM'
    },
    {
      key: '4',
      length: 49.8,
      weight: 3.0,
      headCircumference: 33.6,
      bmi: 45,
      weightForAge: 'Normal',
      lengthForAge: 'Below Average',
      hc: 'Below Average',
      createdBy: 'Dr. Laila Hasan',
      createdAt: '2025-10-11 10:20 AM'
    }
  ];

  // dummy data for charts
  const sampleData = [
    {
      date: '2025-09-01',
      weight: 65,
      length: 160,
      headCircumference: 56,
      bmi: 55,
      weightForAge: 70,
      lengthForAge: 68,
      hc: 72
    },
    {
      date: '2025-09-02',
      weight: 65.2,
      length: 155,
      headCircumference: 56.1,
      bmi: 56,
      weightForAge: 71,
      lengthForAge: 68,
      hc: 73
    },
    {
      date: '2025-09-03',
      weight: 65.1,
      length: 170,
      headCircumference: 56.2,
      bmi: 54,
      weightForAge: 70,
      lengthForAge: 67,
      hc: 72
    },
    {
      date: '2025-09-04',
      weight: 65.3,
      length: 172,
      headCircumference: 56.3,
      bmi: 57,
      weightForAge: 71,
      lengthForAge: 69,
      hc: 73
    },
    {
      date: '2025-09-05',
      weight: 66,
      length: 175,
      headCircumference: 56.4,
      bmi: 59,
      weightForAge: 72,
      lengthForAge: 69,
      hc: 74
    },
    {
      date: '2025-09-06',
      weight: 65.7,
      length: 166,
      headCircumference: 56.3,
      bmi: 58,
      weightForAge: 71,
      lengthForAge: 68,
      hc: 74
    },
    {
      date: '2025-09-07',
      weight: 65.8,
      length: 159,
      headCircumference: 56.5,
      bmi: 60,
      weightForAge: 72,
      lengthForAge: 70,
      hc: 75
    },
    {
      date: '2025-09-08',
      weight: 65.5,
      length: 180,
      headCircumference: 56.6,
      bmi: 57,
      weightForAge: 71,
      lengthForAge: 69,
      hc: 74
    },
    {
      date: '2025-09-09',
      weight: 65.6,
      length: 177,
      headCircumference: 56.7,
      bmi: 58,
      weightForAge: 72,
      lengthForAge: 70,
      hc: 75
    },
    {
      date: '2025-09-10',
      weight: 65.9,
      length: 175,
      headCircumference: 56.8,
      bmi: 59,
      weightForAge: 73,
      lengthForAge: 70,
      hc: 75
    },
    {
      date: '2025-09-11',
      weight: 66,
      length: 153,
      headCircumference: 56.9,
      bmi: 60,
      weightForAge: 73,
      lengthForAge: 70,
      hc: 76
    },
    {
      date: '2025-09-12',
      weight: 66.1,
      length: 167,
      headCircumference: 57,
      bmi: 61,
      weightForAge: 74,
      lengthForAge: 71,
      hc: 76
    },
    {
      date: '2025-09-13',
      weight: 66.2,
      length: 164,
      headCircumference: 57.1,
      bmi: 62,
      weightForAge: 74,
      lengthForAge: 71,
      hc: 77
    },
    {
      date: '2025-09-14',
      weight: 66.3,
      length: 174,
      headCircumference: 57.2,
      bmi: 63,
      weightForAge: 75,
      lengthForAge: 72,
      hc: 77
    },
    {
      date: '2025-09-15',
      weight: 66.4,
      length: 184,
      headCircumference: 57.3,
      bmi: 64,
      weightForAge: 75,
      lengthForAge: 72,
      hc: 78
    },
    {
      date: '2025-09-16',
      weight: 66.5,
      length: 156,
      headCircumference: 57.4,
      bmi: 65,
      weightForAge: 76,
      lengthForAge: 73,
      hc: 78
    },
    {
      date: '2025-09-17',
      weight: 66.6,
      length: 179,
      headCircumference: 57.5,
      bmi: 66,
      weightForAge: 77,
      lengthForAge: 73,
      hc: 79
    },
    {
      date: '2025-09-18',
      weight: 66.7,
      length: 181,
      headCircumference: 57.6,
      bmi: 67,
      weightForAge: 77,
      lengthForAge: 74,
      hc: 79
    },
    {
      date: '2025-09-19',
      weight: 66.8,
      length: 176,
      headCircumference: 57.7,
      bmi: 68,
      weightForAge: 78,
      lengthForAge: 74,
      hc: 80
    },
    {
      date: '2025-09-20',
      weight: 66.9,
      length: 178,
      headCircumference: 57.8,
      bmi: 69,
      weightForAge: 79,
      lengthForAge: 75,
      hc: 80
    }
  ];

  // header of the table
  const clickableHeader = (key, label) => (
    <span
      className="link"
      onClick={() => {
        setSelectedMetric(key);
        setSelectedMetricLabel(label);
      }}
    >
      {label}
    </span>
  );

  //Table columns
  const tableColumns = [
    {
      key: 'createdByAt',
      title: <Translate>Created By\At</Translate>,
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
      key: 'length',
      title: <Translate>{clickableHeader('length', 'Length (cm)')}</Translate>
    },
    {
      key: 'weight',
      title: <Translate>{clickableHeader('weight', 'Weight (cm)')}</Translate>
    },
    {
      key: 'headCircumference',
      title: (
        <Translate>{clickableHeader('headCircumference', 'Head circumference (cm)')}</Translate>
      )
    },
    {
      key: 'bmi',
      title: <Translate>{clickableHeader('bmi', 'BMI For Age Percentile (%)')}</Translate>
    },
    {
      key: 'weightForAge',
      title: <Translate>{clickableHeader('weightForAge', 'Weight For Age')}</Translate>
    },
    {
      key: 'lengthForAge',
      title: <Translate>{clickableHeader('lengthForAge', 'Length For Age')}</Translate>
    },
    {
      key: 'hc',
      title: <Translate>{clickableHeader('hc', 'HC For Age')}</Translate>
    }
  ];

  // charts
  const chartData = {
    labels: sampleData.map(d => d.date),
    datasets: [
      {
        label: selectedMetricLabel,
        data: sampleData.map(d => d[selectedMetric]),
        borderColor: '#4e73df',
        backgroundColor: 'rgba(78, 115, 223, 0.2)',
        tension: 0.3,
        fill: true
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: true }
    },
    scales: {
      x: { title: { display: true, text: 'Date' } },
      y: { title: { display: true, text: 'Value' } }
    }
  };

  const tablebuttons = (
    <div className="table-buttons-container">
      <div className="left-group">
        <MyButton
          prefixIcon={() => <CloseOutlineIcon />}
          onClick={() => {
            setOpenCancelModal(true);
          }}
        >
          Cancel
        </MyButton>
        <Checkbox>Show Cancelled</Checkbox>
      </div>
      <MyButton
        color="var(--deep-blue)"
        prefixIcon={() => <PlusIcon />}
        onClick={() => {
          setOpenAddEditAnthropometric(true);
          setAanthropometric({});
        }}
      >
        Add
      </MyButton>
    </div>
  );

   const tabData = [
    {
      title: 'Growth and Development Tracking',
      content: (
        <SectionContainer
          title="Anthropometric"
          content={
            <>
              <MyTable
                data={data}
                columns={tableColumns}
                tableButtons={tablebuttons}
                onRowClick={rowData => {
                  setAanthropometric(rowData);
                }}
                rowClassName={isSelected}
              />
              {selectedMetric && (
                <div className="margin-top-100">
                  <h4 className="font-size-14">{selectedMetricLabel}</h4>
                  <Line
                    data={chartData}
                    options={{
                      ...chartOptions,
                      maintainAspectRatio: false
                    }}
                    height={'300px'}
                  />
                </div>
              )}
              <AddEditAnthropometric
                open={openAddEditAnthropometric}
                setOpen={setOpenAddEditAnthropometric}
                width={width}
                anthropometric={anthropometric}
                setAnthropometric={setAanthropometric}
              />
              <CancellationModal
                open={openCancelModal}
                setOpen={setOpenCancelModal}
                object=""
                setObject=""
                handleCancle={() => {}}
                title="Cancel Anthropometric"
                fieldLabel="Reason for cancellation"
                fieldName="cancelReason"
              />
            </>
          }
        />
      )
    },
    { title: 'Nutritional and Feeding', content: <></> }
  ];

  // Effects
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="container-pediatric">
      <MyTab data={tabData} />
    </div>
  );
};
export default Pediatric;
