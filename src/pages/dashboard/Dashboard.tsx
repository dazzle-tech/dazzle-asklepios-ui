import Translate from '@/components/Translate';
import React, { useEffect, useMemo } from 'react';
import { Panel, FlexboxGrid, Col } from 'rsuite';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useAppDispatch, useAppSelector } from '@/hooks';
import DynamicBarChart from '@/components/Charts/DynamicBarChart/DynamicBarChart';
import DynamicPieChart from '@/components/Charts/DynamicPieChart/DynamicPieChart';
import { TitleWithIcon } from '@/components/Charts/DynamicTableChart/TitleWithIcon';
import DynamicMainTableChart from '@/components/Charts/DynamicTableChart/DynamicMainTableChart';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStethoscope, faVial, faPills } from '@fortawesome/free-solid-svg-icons';
import './styles.less';
import { useSelector } from 'react-redux';
import {
  useFilterEncountersQuery,
} from '@/services/encounters/patientEncounterService';
import { formatEnumString } from '@/utils';
import { useGetDepartmentsQuery } from '@/services/security/departmentService';
import { useEnumOptions } from '@/services/enumsApi';
import DetailsCard from '@/components/DetailsCard';

const Dashboard = () => {
  const dispatch = useAppDispatch();
  const mode = useSelector((state: any) => state.ui.mode);
  const authSlice = useAppSelector(state => state.auth);
  const selectedDepartment = authSlice?.selectedDepartment;
  const departmentId = selectedDepartment?.departmentId;

  const direction = localStorage.getItem('direction') || 'LTR';
  const isRTL = direction === 'RTL';

  // Calculate date range for last 10 days
  const today = new Date();
  const tenDaysAgo = new Date();
  tenDaysAgo.setDate(today.getDate() - 10);
  const fromDate = tenDaysAgo.toISOString().split('T')[0];
  const toDate = today.toISOString().split('T')[0];

  // Get all departments and filter for Outpatient departments only
  const { data: departmentsData } = useGetDepartmentsQuery({
    page: 0,
    size: 10000,
    sort: 'id,asc'
  });

  const departments = departmentsData?.data || [];
  
  // Filter for Outpatient departments only
  const outpatientDepartments = useMemo(() => {
    return departments.filter((dept: any) => {
      const deptName = (dept?.name || '').toLowerCase();
      const deptType = (dept?.departmentType || '').toLowerCase();
      return (
        deptName.includes('outpatient') ||
        deptType.includes('outpatient') ||
        deptName.includes('opd') ||
        deptType.includes('opd')
      );
    });
  }, [departments]);

  // Fetch encounters for the selected department
  // Note: If you want to show data from all departments, you may need to modify this
  const { data: encountersData, isLoading: isLoadingEncounters } = useFilterEncountersQuery(
    {
      departmentId: departmentId || 0,
      fromDate,
      toDate,
      page: 0,
      size: 10000 // Get a large number to aggregate all encounters
    },
    {
      skip: !departmentId
    }
  );

  // Get all possible encounter reasons from enum
  const allEncounterReasons = useEnumOptions('EncounterReason');

  // Aggregate encounters by encounterReason
  const topVisitReasons = useMemo(() => {
    // Get all possible reason values
    const allReasonValues = allEncounterReasons.map((option: any) => 
      typeof option === 'string' ? option : option.value
    );

    // Count encounters by reason
    const reasonCounts: Record<string, number> = {};
    if (encountersData?.data && encountersData.data.length > 0) {
      encountersData.data.forEach((encounter: any) => {
        const reason = encounter.encounterReason;
        if (reason) {
          reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
        }
      });
    }

    // Create chart data with ALL reasons, showing 0 for reasons without data
    // This ensures all reasons appear on X-axis with consistent column widths
    const chartData = allReasonValues.map((reason: string) => ({
      label: formatEnumString(reason),
      value: reasonCounts[reason] || 0, // Use 0 if no data for this reason
      reason: reason // Keep original enum value
    }));


    return chartData;
  }, [encountersData, allEncounterReasons]);

  useEffect(() => {
    dispatch(setPageCode('Dashboard'));
    dispatch(setDivContent('Dashboard'));

    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch]);

  // Get patient distribution by Outpatient departments with static default values
  const patientDistributionByDepartment = useMemo(() => {
    // Static default values
    const staticValues = [13, 5, 9, 12, 6, 6];
    
    if (outpatientDepartments.length === 0) {
      // If no outpatient departments found, show a default entry
      return [
        { label: 'Outpatient Department', value: staticValues[0] }
      ];
    }

    // Map static values to outpatient departments
    return outpatientDepartments
      .slice(0, staticValues.length) // Limit to available static values
      .map((dept: any, index: number) => ({
        label: dept?.name || 'Outpatient Department',
        value: staticValues[index] || staticValues[0]
      }));
  }, [outpatientDepartments]);

  const tableAlignments: ('left' | 'right' | 'center')[] = isRTL 
    ? (['right', 'left'] as ('left' | 'right' | 'center')[])
    : (['left', 'right'] as ('left' | 'right' | 'center')[]);

  return (
    <Panel
      className={mode === 'dark' ? 'dashboard-dark' : ''}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <FlexboxGrid>

        {/* Bar Chart - Top Visit Reasons */}
        <FlexboxGrid.Item as={Col} colspan={24} lg={12} md={12} sm={24}>
          <Panel
            bordered
            header={<span className="responsive-title"><Translate>Top Visit Reasons</Translate></span>}
            className="margin-bottom-10"
          >
            {isLoadingEncounters ? (
              <div style={{ padding: '20px', textAlign: 'center' }}>
                <Translate>Loading...</Translate>
              </div>
            ) : topVisitReasons.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center' }}>
                <Translate>No data available</Translate>
              </div>
            ) : (
              <DynamicBarChart
                selectable
                multiColumns={false}
                colors={[
                  '#3498db', // Blue
                  '#2ecc71', // Green
                  '#e74c3c', // Red
                  '#f39c12', // Orange
                  '#9b59b6', // Purple
                  '#1abc9c', // Turquoise
                  '#e67e22', // Dark Orange
                  '#34495e', // Dark Blue
                  '#16a085', // Dark Turquoise
                  '#c0392b', // Dark Red
                  '#d35400', // Dark Orange
                  '#8e44ad', // Dark Purple
                  '#27ae60', // Dark Green
                  '#2980b9', // Medium Blue
                  '#f1c40f', // Yellow
                  '#e91e63', // Pink
                  '#00bcd4', // Cyan
                  '#ff9800', // Deep Orange
                  '#4caf50', // Light Green
                  '#2196f3'  // Light Blue
                ]}
                chartData={topVisitReasons}
              />
            )}
          </Panel>
        </FlexboxGrid.Item>

        {/* Pie Chart */}
        <FlexboxGrid.Item as={Col} colspan={24} lg={12} md={12} sm={24}>
          <Panel
            bordered
            header={<span className="responsive-title"><Translate>Patient Distribution by Department</Translate></span>}
            className="margin-bottom-10"
          >
            <DynamicPieChart
              selectable
              width={350}
              height={347}
              colors={['#2264E5', '#93C6FA', '#FF6384', '#FFCE56', '#4BC0C0', '#663399']}
              chartData={patientDistributionByDepartment}
            />
          </Panel>
        </FlexboxGrid.Item>

        <FlexboxGrid.Item as={Col} colspan={24} lg={8} md={12} sm={24}>
          <Panel>
            <DynamicMainTableChart
              title={
                <TitleWithIcon
                  icon={<FontAwesomeIcon icon={faStethoscope} />}
                  text={<span className="responsive-title"><Translate>Top Diagnoses</Translate></span>}
                  iconColor="#8f98ab"
                />
              }
              subtitle={<span className="responsive-subtitle">
                        <Translate>Most common diagnoses this month</Translate>
                        </span>}
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
                  text={
                    <span className="responsive-title">
                      <Translate>Top Diagnoses</Translate>
                    </span>
                  }  
                    iconColor="#8f98ab"
                />
              }
              subtitle={<span className="responsive-subtitle">
                <Translate>Most prescribed medications this month</Translate>
              </span>}
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
                  text={<span className="responsive-title"><Translate>Top Lab Findings</Translate></span>}
                  iconColor="#8f98ab"
                />
              }
              subtitle={<span className="responsive-subtitle">
                <Translate>Most frequent lab test findings</Translate>
              </span>}
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
        </FlexboxGrid.Item>

      </FlexboxGrid>
    </Panel>
  );
};

export default Dashboard;