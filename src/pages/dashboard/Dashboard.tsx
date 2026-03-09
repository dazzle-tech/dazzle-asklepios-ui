import Translate from '@/components/Translate';
import React, { useEffect } from 'react';
import { Panel, FlexboxGrid, Col } from 'rsuite';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useAppDispatch } from '@/hooks';
import DynamicBarChart from '@/components/Charts/DynamicBarChart/DynamicBarChart';
import DynamicPieChart from '@/components/Charts/DynamicPieChart/DynamicPieChart';
import { TitleWithIcon } from '@/components/Charts/DynamicTableChart/TitleWithIcon';
import DynamicMainTableChart from '@/components/Charts/DynamicTableChart/DynamicMainTableChart';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStethoscope, faVial, faPills } from '@fortawesome/free-solid-svg-icons';
import './styles.less';
import { useSelector } from 'react-redux';
import { PDFDownloadLink, PDFViewer } from '@react-pdf/renderer';
import MedicalReport from '@/reportCharts/MedicalReport';

const Dashboard = () => {
   const report = (
    <MedicalReport
      organizationName="Health Organization"
      patientName="Batool test Testing Sbaih"
      mrn={1055}
      dob="2002-03-26"
      age="23y 10m 22d"
      visitId={257}
      visitDate="2026-02-17"
      visitType="Urgent Visit"
      priority=""
      origin=""
      reason=""
      generatedAt="24/02/2026 19:24:55"
      sections={[
        { title: "Patient Observations & Complaints", value: "" },
        { title: "Vital Signs", value: "Temperature: 37.2°C, BP: 120/80, Pulse: 78 bpm" },
        { title: "Body Measurements", value: "Weight: 68 kg, Height: 170 cm" },
        { title: "Pain Assessment", value: "Pain score: 2/10" },
        { title: "Additional Measurements (Infant / Neonate)", value: "" },
        { title: "Additional Measurements (GER)", value: "" },
        { title: "Allergies", value: "No known drug allergies." },
        { title: "Medical Warnings", value: "" },
        { title: "Vaccinations", value: "Influenza vaccine up to date." },
        { title: "Nurse Services & Products", value: "" },
      ]}
    />
  );
  const dispatch = useAppDispatch();
  const mode = useSelector((state: any) => state.ui.mode);

  const direction = localStorage.getItem('direction') || 'LTR';
  const isRTL = direction === 'RTL';

  useEffect(() => {
    dispatch(setPageCode('Dashboard'));
    dispatch(setDivContent('Dashboard'));

    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch]);

  const tableAlignments = isRTL ? ['right', 'left'] : ['left', 'right'];

  return (
    <Panel
      className={mode === 'dark' ? 'dashboard-dark' : ''}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <FlexboxGrid>

        {/* Bar Chart */}
        <FlexboxGrid.Item as={Col} colspan={24} lg={12} md={12} sm={24}>
          <Panel
            bordered
            header={<Translate>Weekly Patient Flow</Translate>}
            className="margin-bottom-10"
          >
            <DynamicBarChart
              selectable
              multiColumns
              colors={['#3498db', '#2ecc71', '#e74c3c']}
              chartData={[
                { label: 'Mon', Admissions: 45, Discharges: 38, Emergency: 66 },
                { label: 'Tue', Admissions: 52, Discharges: 41, Emergency: 73 },
                { label: 'Wed', Admissions: 48, Discharges: 45, Emergency: 69 },
                { label: 'Thu', Admissions: 61, Discharges: 39, Emergency: 82 },
                { label: 'Fri', Admissions: 55, Discharges: 43, Emergency: 76 },
                { label: 'Sat', Admissions: 42, Discharges: 47, Emergency: 59 },
                { label: 'Sun', Admissions: 38, Discharges: 35, Emergency: 52 }
              ]}
            />
          </Panel>
        </FlexboxGrid.Item>

        {/* Pie Chart */}
        <FlexboxGrid.Item as={Col} colspan={24} lg={12} md={12} sm={24}>
          <Panel
            bordered
            header={<Translate>Patient Distribution by Department</Translate>}
            className="margin-bottom-10"
          >
            <DynamicPieChart
              selectable
              width={350}
              height={347}
              colors={['#2264E5', '#93C6FA', '#FF6384', '#FFCE56', '#4BC0C0', '#663399']}
              chartData={[
                { label: 'ICU', value: 13 },
                { label: 'Surgery', value: 5 },
                { label: 'Cardiology', value: 9 },
                { label: 'Pediatrics', value: 12 },
                { label: 'Others', value: 6 },
                { label: 'Emergency', value: 6 }
              ]}
            />
          </Panel>
        </FlexboxGrid.Item>

        <FlexboxGrid.Item as={Col} colspan={24} lg={8} md={12} sm={24}>
          <Panel>
            <DynamicMainTableChart
              title={
                <TitleWithIcon
                  icon={<FontAwesomeIcon icon={faStethoscope} />}
                  text="Top Diagnoses"
                  iconColor="#8f98ab"
                />
              }
              subtitle="Most common diagnoses this month"
              data={[
                { name: 'Hypertension', value: 289, percentage: '27.1%', trend: 'up' },
                { name: 'Type 2 Diabetes', value: 234, percentage: '21.9%', trend: 'down' },
                { name: 'Pneumonia', value: 178, percentage: '16.7%', trend: 'up' },
                { name: 'Coronary Artery Disease', value: 145, percentage: '13.6%', trend: 'up' },
                { name: 'COPD', value: 123, percentage: '11.5%', trend: 'down' },
                { name: 'Acute Myocardial Infarction', value: 98, percentage: '9.2%', trend: 'up' }
              ]}
              showHeader={false}
              columns={['name', 'value']}
              columnWidths={['70%', '30%']}
              alignments={tableAlignments}
              showPercentage
            />
          </Panel>
        </FlexboxGrid.Item>

        <FlexboxGrid.Item as={Col} colspan={24} lg={8} md={12} sm={24}>
          <Panel>
            <DynamicMainTableChart
              title={
                <TitleWithIcon
                  icon={<FontAwesomeIcon icon={faPills} />}
                  text="Top Medications"
                  iconColor="#8f98ab"
                />
              }
              subtitle="Most prescribed medications this month"
              data={[
                { name: 'Metformin', value: 342, percentage: '23.0%', trend: 'up' },
                { name: 'Lisinopril', value: 298, percentage: '20.1%', trend: 'down' },
                { name: 'Atorvastatin', value: 267, percentage: '18.0%', trend: 'up' },
                { name: 'Amlodipine', value: 231, percentage: '15.6%', trend: 'down' },
                { name: 'Amoxicillin', value: 189, percentage: '12.7%', trend: 'up' },
                { name: 'Omeprazole', value: 156, percentage: '10.5%', trend: 'down' }
              ]}
              showHeader={false}
              columns={['name', 'value']}
              columnWidths={['70%', '30%']}
              alignments={tableAlignments}
              showPercentage
              showTrend
            />
          </Panel>
        </FlexboxGrid.Item>

        {/* Lab Findings */}
        <FlexboxGrid.Item as={Col} colspan={24} lg={8} md={12} sm={24}>
          <Panel>
            <DynamicMainTableChart
              title={
                <TitleWithIcon
                  icon={<FontAwesomeIcon icon={faVial} />}
                  text="Top Lab Findings"
                  iconColor="#8f98ab"
                />
              }
              subtitle="Most frequent lab test findings"
              data={[
                { name: 'Elevated Glucose', value: 156, percentage: '16.6%', trend: 'up' },
                { name: 'High Cholesterol', value: 234, percentage: '24.8%', trend: 'up' },
                { name: 'Low Hemoglobin', value: 189, percentage: '20.1%', trend: 'down' },
                { name: 'Elevated Creatinine', value: 139, percentage: '14.8%', trend: 'down' },
                { name: 'Abnormal Liver Enzymes', value: 224, percentage: '23.8%', trend: 'down' }
              ]}
              showHeader={false}
              columns={['name', 'value']}
              columnWidths={['70%', '30%']}
              alignments={tableAlignments}
              showPercentage
            />
          </Panel>
        <div style={{ padding: 24, fontFamily: "Arial, sans-serif" }}>
      <h2>Medical PDF Demo</h2>

      <div style={{ marginBottom: 16 }}>
        <PDFDownloadLink document={report} fileName="medical-report.pdf">
          {({ loading }) => (loading ? "Generating PDF..." : "Download PDF")}
        </PDFDownloadLink>
      </div>

      <div style={{ border: "1px solid #ddd", height: "80vh" }}>
        <PDFViewer width="100%" height="100%">
          {report}
        </PDFViewer>
      </div>
    </div>
        </FlexboxGrid.Item>

      </FlexboxGrid>
    </Panel>
  );
};

export default Dashboard;