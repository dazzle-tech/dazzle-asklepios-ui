// ConsultationPopup.tsx
import React, { useState } from 'react';
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import MyTable from '@/components/MyTable';
import { Form } from 'rsuite';
import SectionContainer from '@/components/SectionsoContainer';
import { useGetDepartmentsQuery, useGetFacilitiesQuery, useGetLovValuesByCodeQuery } from '@/services/setupService';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave } from '@fortawesome/free-solid-svg-icons';
import PatientHistorySummary from '../patient-history/MedicalHistory/PatientHistorySummary';
import { initialListRequest, initialListRequestId } from '@/types/types';
import { newApTeleConsultation } from '@/types/model-types-constructor';
import { useGetTeleConsultationListQuery, useSaveTeleConsultationMutation } from '@/services/encounterService';
import { notify } from '@/utils/uiReducerActions';
import { useAppDispatch } from '@/hooks';
import { conjureValueBasedOnKeyFromList } from '@/utils';


interface ConsultationPopupProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  patient: any;
  encounter: any;
}

const ConsultationPopup: React.FC<ConsultationPopupProps> = ({ open, setOpen, patient ,encounter}) => {
  const dispatch = useAppDispatch();
  const [consultationData, setConsultationData] = useState({...newApTeleConsultation});
  const {data:orders,refetch}=useGetTeleConsultationListQuery({...initialListRequestId,
     filters: [
            {
                fieldName: 'patient_id',
                operator: 'match',
                value: patient?.key
            },
            {
                fieldName: 'encounter_id',
                operator: 'match',
                value: encounter?.key
            }
          ],
  })
 
 const [save,saveMutation]=useSaveTeleConsultationMutation();
 //facility & Department - Mock data
  const {data:facilities}=useGetFacilitiesQuery({...initialListRequest});
 const {data:departments}=useGetDepartmentsQuery({...initialListRequest
  , filters: [
    {
        fieldName: 'facility_key',
        operator: 'match',
        value: consultationData.consultantFacilityId??''
    }
  ]

 },{
    skip:!consultationData.consultantFacilityId
 });


  // Fetch Sub Specialty Lov list response
  const { data: subSpecialityLovQueryResponse } = useGetLovValuesByCodeQuery('PRACT_SUB_SPECIALTY');
  const { data: priorityLevelLovQueryResponse } = useGetLovValuesByCodeQuery('ORDER_PRIORITY');

  const tableColumns = [
    { key: 'consultantFacilityId',
     title: 'Facility',
     width: 100,
      render: row => {
        return <span>
                  {conjureValueBasedOnKeyFromList(
                    facilities?.object ?? [],
                    row.consultantFacilityId,
                    'facilityName'
                  )}
                </span>
      }
     },
    { key: 'consultantDepartmentId', title: 'Department', width: 100
    , render: row => {
      return <span>
                {conjureValueBasedOnKeyFromList(
                  departments?.object ?? [],
                  row.consultantDepartmentId,
                  'name'
                )}
              </span>
    }

     },
    { key: 'specialtyLkey', title: 'Specialty', width: 100
      ,
      render: row => {
        return <span>
                  {conjureValueBasedOnKeyFromList(
                    subSpecialityLovQueryResponse?.object ?? [],
                    row.specialtyLkey,
                    'lovDisplayVale'
                  )}
                </span>
      }
     },
    { key: 'urgencyLkey', title: 'Urgency', width: 80 ,
      render: row => {
        return <span>
                  {conjureValueBasedOnKeyFromList(
                    priorityLevelLovQueryResponse?.object ?? [],
                    row.urgencyLkey,
                    'lovDisplayVale'
                  )}
                </span>
      }
    },
    { key: 'expectedResponse', title: 'Expected Response', width: 120 },
    {
      key: 'statusLkey',
      title: 'Status',
      

      render: row => {
      
        return <MyBadgeStatus  color={row.statusLvalue?.valueColor} contant={row.statusLvalue?.lovDisplayVale} />;
      }
    },
    {
      key: 'createdByAt',
      title: 'Created By\At',
      width: 100,
      expandable: true,
      render: row => (
        <>
          {row.createdBy}
          <br />
          <span className="date-table-style">{row.createdDate}</span>
        </>
      )
    }
  ];

  const handleCancel = () => {
    setOpen(false);
  };

  const handleSave = () => {
    try{
      const response=save({...consultationData,patientId:patient.key,encounterId:encounter.key,
        // ToDo status key for ORD_STAT_REQST
        statusLkey:'5959341154465084',
        expectedResponseTime: consultationData.expectedResponseTime?null:new Date(consultationData.expectedResponseTime).getTime()
       ,
       requestedAt: new Date().getTime()
      }).unwrap();
      response.then((res)=>{
        dispatch(notify({ sev: 'success', msg: 'Consultation saved successfully' }));
        refetch();
      })
    }catch(err){
      dispatch(notify({ sev: 'error', msg: 'Error saving consultation' }));

    }}
  const handleExpectedResponseChange = (type: string) => {
    setConsultationData(prev => ({
      ...prev,
      expectedResponse: type,
      expectedResponseTime: type === 'immediate' ? null : new Date(prev.expectedResponseTime).getTime()
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
              fieldName="questionToConsultant"
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
                  fieldName="consultantFacilityId"
                  fieldType="select"
                  record={consultationData}
                  setRecord={setConsultationData}
                  selectData={facilities?.object ?? []}
                  selectDataLabel="facilityName"
                  selectDataValue="key"
                  width={150}
                  fieldLabel="Consultant Facility"
                />
                <MyInput
                  fieldName="consultantDepartmentId"
                  fieldType="select"
                  record={consultationData}
                  setRecord={setConsultationData}
                  selectData={departments?.object ?? []}
                  selectDataLabel="name"
                  selectDataValue="key"
                  width={150}
                  fieldLabel="Consultant Department"
                  menuMaxHeight={'15vh'}
                />
              </div>
              <div className="flex-20">
                <MyInput
                  fieldName="specialtyLkey"
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
                  fieldName="urgencyLkey"
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
                    checked={consultationData.expectedResponse === 'immediate'}
                    onChange={e => handleExpectedResponseChange(e.target.value)}
                  />
                  Immediate
                </label>

                <label className="flex-center-5">
                  <input
                    type="radio"
                    name="expectedResponse"
                    value="scheduled"
                    checked={consultationData.expectedResponse === 'scheduled'}
                    onChange={e => handleExpectedResponseChange(e.target.value)}
                  />
                  Scheduled Time
                </label>
              </div>

              {consultationData.expectedResponse === 'scheduled' && (
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
        <MyButton 
        prefixIcon={() => <FontAwesomeIcon icon={faSave}/> }
        onClick={handleSave}
        >Save&Submit</MyButton>

      </div>
      {/* Orders */}
      <SectionContainer
        title="Orders List"
        content={
          <div>
            <MyTable data={orders?.object??[]} columns={tableColumns} height={200} loading={false} />
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
