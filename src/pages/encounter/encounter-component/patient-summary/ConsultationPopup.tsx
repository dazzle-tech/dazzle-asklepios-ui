// ConsultationPopup.tsx
import React, { useState } from 'react';
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import MyTable from '@/components/MyTable';
import { Form } from 'rsuite';
import SectionContainer from '@/components/SectionsoContainer';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave } from '@fortawesome/free-solid-svg-icons';
import PatientHistorySummary from '../patient-history/MedicalHistory/PatientHistorySummary';

interface ConsultationPopupProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  patient: any;
}

const ConsultationPopup: React.FC<ConsultationPopupProps> = ({ open, setOpen, patient }) => {
  const [consultationData, setConsultationData] = useState({
    reasonForConsultation: '',
    consultantFacility: '',
    consultantDepartment: '',
    specialty: '',
    consultationUrgency: '',
    expectedResponseType: 'immediate',
    expectedResponseTime: null,
    notes: ''
  });

  const [orders, setOrders] = useState<any[]>([
    {
      facility: 'Rafidia Hospital',
      department: 'Cardiology',
      specialty: 'Pediatrics',
      urgency: 'High',
      expectedResponse: 'Immediate',
      status: 'Pending',
      createdBy: 'Dr. Ahmad',
      createdAt: '2025-09-23 14:30'
    },
    {
      facility: 'Makassed Hospital',
      department: 'Neurology',
      specialty: 'Neuro Surgery',
      urgency: 'Medium',
      expectedResponse: 'Scheduled',
      status: 'Closed',
      createdBy: 'Dr. Sara',
      createdAt: '2025-09-20 11:00'
    },
    {
      facility: 'Augusta Victoria Hospital',
      department: 'Cardiology',
      specialty: 'Cardio Surgery',
      urgency: 'Low',
      expectedResponse: 'Scheduled',
      status: 'Rejected',
      createdBy: 'Dr. Omar',
      createdAt: '2025-09-19 09:15'
    }
  ]);

  // Mock data - replace with actual API calls
  const facilities = [
    { label: 'Rafidia Hospital', value: 'Rafidia Hospital' },
    { label: 'Makassed Hospital', value: 'Makassed Hospital' }
  ];

  const departments = [
    { label: 'Cardiology', value: 'cardiology' },
    { label: 'Neurology', value: 'neurology' }
  ];

  // Fetch Sub Specialty Lov list response
  const { data: subSpecialityLovQueryResponse } = useGetLovValuesByCodeQuery('PRACT_SUB_SPECIALTY');
  const { data: priorityLevelLovQueryResponse } = useGetLovValuesByCodeQuery('ORDER_PRIORITY');

  const tableColumns = [
    { key: 'facility', title: 'Facility', width: 100 },
    { key: 'department', title: 'Department', width: 100 },
    { key: 'specialty', title: 'Specialty', width: 100 },
    { key: 'urgency', title: 'Urgency', width: 80 },
    { key: 'expectedResponse', title: 'Expected Response', width: 120 },
    {
      key: 'status',
      title: 'Status',
      dataKey: 'status',

      width: 100,

      render: row => {
        let bgColor = 'var(--light-gray)';
        let color = 'var(--primary-gray)';
        if (row.status === 'Pending') {
          bgColor = 'var(--light-orange)';
          color = 'var(--primary-orange)';
        } else if (row.status === 'Closed') {
          bgColor = 'var(--light-yellow)';
          color = 'var(--primary-yellow)';
        } else if (row.status === 'Rejected') {
          bgColor = 'var(--light-red)';
          color = 'var(--primary-red)';
        }
        return <MyBadgeStatus backgroundColor={bgColor} color={color} contant={row.status} />;
      }
    },
    {
      key: 'createdByAt',
      title: 'Created By\\At',
      width: 100,
      expandable: true,
      render: row => (
        <>
          {row.createdBy}
          <br />
          <span className="date-table-style">{row.createdAt}</span>
        </>
      )
    }
  ];

  const handleCancel = () => {
    setOpen(false);
  };

  const handleExpectedResponseChange = (type: string) => {
    setConsultationData(prev => ({
      ...prev,
      expectedResponseType: type,
      expectedResponseTime: type === 'immediate' ? null : prev.expectedResponseTime
    }));
  };

  const content = () => (
    <Form className="form-container-column">
      <PatientHistorySummary title={'Patient Summary'} />
      <Form className="form-container-row">
        {/* Reason */}
        <SectionContainer
          title="Question to Consultant"
          content={
            <MyInput
              fieldName="reasonForConsultation"
              fieldType="textarea"
              record={consultationData}
              setRecord={setConsultationData}
              width="250"
              height={130}
              showLabel={false}
            />
          }
        />

        {/* Facility & Department & Specialty & Urgency*/}
        <SectionContainer
          title="Consultation Details"
          content={
            <>
              <div className="flex-20">
                <MyInput
                  fieldName="consultantFacility"
                  fieldType="select"
                  record={consultationData}
                  setRecord={setConsultationData}
                  selectData={facilities}
                  selectDataLabel="label"
                  selectDataValue="value"
                  width={150}
                  fieldLabel="Consultant Facility"
                />
                <MyInput
                  fieldName="consultantDepartment"
                  fieldType="select"
                  record={consultationData}
                  setRecord={setConsultationData}
                  selectData={departments}
                  selectDataLabel="label"
                  selectDataValue="value"
                  width={150}
                  fieldLabel="Consultant Department"
                />
              </div>
              <div className="flex-20">
                <MyInput
                  fieldName="specialty"
                  fieldType="select"
                  record={consultationData}
                  setRecord={setConsultationData}
                  selectData={subSpecialityLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  width={150}
                  fieldLabel="Specialty"
                  searchable={false}
                />
                <MyInput
                  fieldName="consultationUrgency"
                  fieldType="select"
                  record={consultationData}
                  setRecord={setConsultationData}
                  selectData={priorityLevelLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  width={150}
                  fieldLabel="Consultation Urgency"
                  searchable={false}
                />
              </div>
            </>
          }
        />
      </Form>
      <Form className="form-container-row">
        {/* Expected Response */}
        <SectionContainer
          title="Expected Response"
          content={
            <>
              <div className="group-flex">
                <label className="flex-center-5">
                  <input
                    type="radio"
                    name="expectedResponse"
                    value="immediate"
                    checked={consultationData.expectedResponseType === 'immediate'}
                    onChange={e => handleExpectedResponseChange(e.target.value)}
                  />
                  Immediate
                </label>

                <label className="flex-center-5">
                  <input
                    type="radio"
                    name="expectedResponse"
                    value="scheduled"
                    checked={consultationData.expectedResponseType === 'scheduled'}
                    onChange={e => handleExpectedResponseChange(e.target.value)}
                  />
                  Scheduled Time
                </label>
              </div>

              {consultationData.expectedResponseType === 'scheduled' && (
                <div className="margin-div">
                  <MyInput
                    fieldName="expectedResponseTime"
                    fieldType="datetime"
                    record={consultationData}
                    setRecord={setConsultationData}
                    width={200}
                  />
                </div>
              )}
            </>
          }
        />

        {/* Notes */}
        <SectionContainer
          title="Notes"
          content={
            <MyInput
              fieldName="notes"
              fieldType="textarea"
              record={consultationData}
              setRecord={setConsultationData}
              placeholder="Additional notes..."
              width="100%"
              height={80}
              showLabel={false}
            />
          }
        />
      </Form>
      <div className="flex-end-5">
        <MyButton appearance="primary" prefixIcon={() => <FontAwesomeIcon icon={faSave} />}>
          Save & Submit
        </MyButton>
      </div>
      {/* Orders */}
      <SectionContainer
        title="Orders List"
        content={
          <div>
            <MyTable data={orders} columns={tableColumns} height={200} loading={false} />
          </div>
        }
      />
    </Form>
  );

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="New Tele Consultation Request"
      size="lg"
      bodyheight="75vh"
      content={content()}
      hideActionBtn={true}
      handleCancelFunction={handleCancel}
    />
  );
};

export default ConsultationPopup;
