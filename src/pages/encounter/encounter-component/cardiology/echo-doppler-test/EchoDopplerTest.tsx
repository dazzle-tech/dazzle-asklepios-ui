import React, { useState } from 'react';
import MyTable from '@/components/MyTable';
import { ColumnConfig } from '@/components/MyTable/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import { Checkbox, Form } from 'rsuite';
import PlusIcon from '@rsuite/icons/Plus';
import CloseOutlineIcon from '@rsuite/icons/CloseOutline';
import Translate from '@/components/Translate';
import EchoDopplerTestModal from './EchoDopplerTestModal';
import './style.less';
import TestInformation from './EchoSections/TestInformation';
import Measurements from './EchoSections/Measurements';
import DopplerValves from './EchoSections/DopplerValves';
import ColorDopplerFindings from './EchoSections/ColorDopplerFindings';
import OtherFindings from './EchoSections/OtherFindings';
import Conclusion from './EchoSections/Conclusion';
import TechnicalQuality from './EchoSections/TechnicalQuality';
import { useAppSelector } from '@/hooks';

const EchoDopplerTest = ({ patient, encounter, edit }) => {
  const [selectedRow, setSelectedRow] = useState(null);
  const [showCancelled, setShowCancelled] = useState(false);

  const [openModal, setOpenModal] = useState(false);
  const [echoTestObject, setEchoTestObject] = useState(null);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [echoTest, setEchoTest] = useState({
    indication: '',
    indicationOther: ''
  });
  const [record, setRecord] = useState({});

  const handlePageChange = (_, newPage) => setPage(newPage);
  const handleRowsPerPageChange = e => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  const handleAddClick = () => {
    setEchoTestObject({});
    setOpenModal(true);
  };

  // بيانات وهمية للـ sections عند الضغط على صف معين
  const getSampleDataForRow = rowKey => {
    const sampleData = {
      1: {
        echoTest: {
          indication: 'Chest Pain',
          indicationOther: 'Patient complains of chest discomfort'
        },
        record: {
          // Technical Quality data
          imageQuality: 'Good',
          acousticWindow: 'Adequate',
          patientCooperation: 'Good',

          // Measurements data
          leftVentricle: {
            ivsd: '10 mm',
            lvedd: '52 mm',
            pwtd: '9 mm',
            lvesd: '34 mm',
            ef: '60%'
          },
          leftAtrium: {
            dimension: '38 mm',
            volume: '45 ml/m²'
          },
          rightVentricle: {
            dimension: '28 mm',
            function: 'Normal'
          },
          aorta: {
            root: '32 mm',
            ascendingAorta: '35 mm'
          },

          // Doppler Valves data
          mitralValve: {
            structure: 'Normal',
            regurgitation: 'Trivial',
            stenosis: 'None'
          },
          aorticValve: {
            structure: 'Normal',
            regurgitation: 'None',
            stenosis: 'None'
          },
          tricuspidValve: {
            structure: 'Normal',
            regurgitation: 'Mild',
            rvsp: '25 mmHg'
          },
          pulmonaryValve: {
            structure: 'Normal',
            regurgitation: 'Trivial'
          },

          // Other Findings - تأكد من أن جميع القيم arrays
          pericardium: 'Normal',
          rwma: [], // تغيير إلى array
          wallMotionAbnormalities: [],
          selectedRwmaOptions: [], // إضافة هذا الحقل

          // Conclusion
          finalImpression:
            'Normal left ventricular systolic function. Trivial mitral and tricuspid regurgitation.',
          recommendations: 'Routine follow-up as clinically indicated.',
          reportedBy: 'Dr. Heart'
        }
      },
      2: {
        echoTest: {
          indication: 'Shortness of breath',
          indicationOther: 'Dyspnea on exertion'
        },
        record: {
          // Technical Quality data
          imageQuality: 'Fair',
          acousticWindow: 'Limited',
          patientCooperation: 'Fair',

          // Measurements data
          leftVentricle: {
            ivsd: '11 mm',
            lvedd: '56 mm',
            pwtd: '10 mm',
            lvesd: '38 mm',
            ef: '55%'
          },
          leftAtrium: {
            dimension: '42 mm',
            volume: '52 ml/m²'
          },
          rightVentricle: {
            dimension: '32 mm',
            function: 'Mildly impaired'
          },
          aorta: {
            root: '34 mm',
            ascendingAorta: '37 mm'
          },

          // Doppler Valves data
          mitralValve: {
            structure: 'Mild thickening',
            regurgitation: 'Mild',
            stenosis: 'None'
          },
          aorticValve: {
            structure: 'Normal',
            regurgitation: 'None',
            stenosis: 'None'
          },
          tricuspidValve: {
            structure: 'Normal',
            regurgitation: 'Moderate',
            rvsp: '35 mmHg'
          },
          pulmonaryValve: {
            structure: 'Normal',
            regurgitation: 'Trivial'
          },

          // Other Findings - تأكد من أن جميع القيم arrays
          pericardium: 'Normal',
          rwma: ['Hypokinesia'], // تغيير إلى array
          wallMotionAbnormalities: ['Inferior wall hypokinesia'],
          selectedRwmaOptions: ['Hypokinesia'], // إضافة هذا الحقل

          // Conclusion
          finalImpression:
            'Mild left ventricular systolic dysfunction. Mild mitral regurgitation. Moderate tricuspid regurgitation.',
          recommendations:
            'Follow-up echocardiogram in 6 months. Consider cardiology consultation.',
          reportedBy: 'Dr. Valve'
        }
      }
    };

    return (
      sampleData[rowKey] || {
        echoTest: { indication: '', indicationOther: '' },
        record: {
          rwma: [],
          wallMotionAbnormalities: [],
          selectedRwmaOptions: []
        }
      }
    );
  };

  // التعامل مع الضغط على صف من الجدول
  const handleRowClick = row => {
    setSelectedRow(row);

    // جلب البيانات المناسبة للصف المحدد
    const rowData = getSampleDataForRow(row.key);
    setEchoTest(rowData.echoTest);
    setRecord(rowData.record);
  };

  const [echoData, setEchoData] = useState([
    {
      key: 1,
      testIndication: 'Chest Pain',
      echotype: 'Transthoracic Echo',
      referringphysician: 'Dr. Smith',
      finalimpression: 'Normal function',
      recommendation: 'Follow-up in 6 months',
      cardiologist: 'Dr. Heart',
      createdBy: 'Nurse Jane',
      createdAt: '2025-08-20 10:30 AM',
      canceledBy: 'Admin Joe',
      canceledAt: '2025-08-21 09:15 AM',
      cancellationResult: 'Patient rescheduled'
    },
    {
      key: 2,
      testIndication: 'Shortness of breath',
      echotype: 'Transesophageal Echo',
      referringphysician: 'Dr. Adams',
      finalimpression: 'Mild regurgitation',
      recommendation: 'Cardiology consult',
      cardiologist: 'Dr. Valve',
      createdBy: 'Nurse Sam',
      createdAt: '2025-08-19 11:45 AM',
      canceledBy: '',
      canceledAt: '',
      cancellationResult: ''
    }
  ]);

  const columns: ColumnConfig[] = [
    {
      key: 'testIndication',
      title: 'Test Indication ',
      dataKey: 'testIndication',
      width: 150
    },
    {
      key: 'echotype',
      title: 'Echo Type',
      dataKey: 'echotype',
      width: 200
    },
    {
      key: 'referringphysician',
      title: 'Referring Physician',
      dataKey: 'referringphysician',
      width: 200
    },
    {
      key: 'finalimpression',
      title: 'Final Impression',
      dataKey: 'finalimpression',
      width: 200
    },
    {
      key: 'recommendation',
      title: 'Recommendation',
      dataKey: 'recommendation',
      width: 200
    },
    {
      key: 'cardiologist',
      title: 'Cardiologist',
      dataKey: 'cardiologist',
      width: 200
    },
    {
      key: 'createdByAt',
      title: 'Created By/At',
      dataKey: 'createdByAt',
      expandable: true,
      width: 220,
      render: row => (
        <>
          {row.createdBy}
          <br />
          <span className="date-table-style">{row.createdAt}</span>
        </>
      )
    },
    {
      key: 'canceledByAt',
      title: 'Canceled By/At',
      dataKey: 'canceledByAt',
      expandable: true,
      width: 220,
      render: row => (
        <>
          {row.canceledBy}
          <br />
          <span className="date-table-style">{row.canceledAt}</span>
        </>
      )
    },
    {
      key: 'cancellationResult',
      title: 'Cancellation Result',
      expandable: true,
      dataKey: 'cancellationResult',
      width: 220,
      render: row => <>{row.cancellationResult}</>
    }
  ];

  const physicians = [
    { id: 'p1', fullName: 'Dr. Ahmed Ali' },
    { id: 'p2', fullName: 'Dr. Sara Hassan' },
    { id: 'p3', fullName: 'Dr. Omar Khaled' }
  ];
  const usersList = [
    { id: 'u1', fullName: 'Technician John' },
    { id: 'u2', fullName: 'Operator Layla' },
    { id: 'u3', fullName: 'Technician Mike' }
  ];
  const rwmaOptions = [
    { RwmaValue: 'Normal', value: 'Normal' },
    { RwmaValue: 'Hypokinesia', value: 'Hypokinesia' },
    { RwmaValue: 'Akinesia', value: 'Akinesia' },
    { RwmaValue: 'Dyskinesia', value: 'Dyskinesia' },
    { RwmaValue: 'Aneurysm (per segment)', value: 'Aneurysm' }
  ];
  const authSlice = useAppSelector(state => state.auth);

  const tablebuttons = (
    <div className="bt-div-2">
      <div className="bt-left-2">
        <MyButton
          onClick={() => {
            console.log('Cancel clicked');
          }}
          prefixIcon={() => <CloseOutlineIcon />}
          disabled={!edit ? !selectedRow : false}
        >
          <Translate>Cancel</Translate>
        </MyButton>
        <Checkbox checked={showCancelled} onChange={(_, checked) => setShowCancelled(checked)}>
          Show Cancelled
        </Checkbox>
      </div>

      <div className="bt-right-2">
        <MyButton prefixIcon={() => <PlusIcon />} disabled={edit} onClick={handleAddClick}>
          Add
        </MyButton>
      </div>
    </div>
  );

  return (
    <>
      <MyTable
        data={echoData}
        columns={columns}
        loading={false}
        tableButtons={tablebuttons}
        rowClassName={row => (row?.key === selectedRow?.key ? 'selected-row' : '')}
        onRowClick={handleRowClick}
        page={page}
        rowsPerPage={rowsPerPage}
        totalCount={echoData.length}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
      />

      {/* إظهار الـ sections فقط عند تحديد صف من الجدول */}
      {selectedRow && (
        <div style={{ margin: '10px' }}>
          {/* <div
            style={{
              padding: '15px',
              backgroundColor: '#f8f9fa',
              border: '1px solid #dee2e6',
              borderRadius: '5px',
              marginBottom: '10px'
            }}
          >
            <h4 style={{ color: '#495057', marginBottom: '10px' }}>
              Echo Test Details - {selectedRow.testIndication}
            </h4>
            <p style={{ color: '#6c757d', margin: 0, fontSize: '14px' }}>
              Selected Test: {selectedRow.echotype} | Cardiologist: {selectedRow.cardiologist}
            </p>
          </div> */}

          <Form fluid disabled={true}>
            {/* دائماً readonly */}
            <div className="sections-handle-position">
              <TestInformation
                echoTest={echoTest}
                setEchoTest={setEchoTest}
                physicians={physicians}
                usersList={usersList}
              />

              <TechnicalQuality record={record} setRecord={setRecord} />

              <Measurements record={record} setRecord={setRecord} />

              <DopplerValves record={record} setRecord={setRecord} />

              <ColorDopplerFindings record={record} setRecord={setRecord} />

              <OtherFindings record={record} setRecord={setRecord} rwmaOptions={rwmaOptions} />

              <Conclusion
                record={record}
                setRecord={setRecord}
                usersList={usersList}
                currentUserId={authSlice?.user?.id}
              />
            </div>
          </Form>
        </div>
      )}

      <EchoDopplerTestModal
        open={openModal}
        setOpen={setOpenModal}
        patient={patient}
        encounter={encounter}
        echoTestObject={echoTestObject}
        refetch={() => {
          console.log('Refetch after save');
        }}
        edit={false}
      />
    </>
  );
};

export default EchoDopplerTest;
