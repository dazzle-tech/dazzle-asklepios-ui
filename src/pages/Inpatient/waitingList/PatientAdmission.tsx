import React, { useState, useEffect } from 'react';
import './styles.less';
import { useAppDispatch } from '@/hooks';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import MyModal from '@/components/MyModal/MyModal';
import { initialListRequest, ListRequest } from '@/types/types';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import { notify } from '@/utils/uiReducerActions';
import { faBed } from '@fortawesome/free-solid-svg-icons';
import { useGetResourceTypeQuery } from '@/services/appointmentService';
import { newApAdmitOutpatientInpatient } from '@/types/model-types-constructor';
import { useGetPractitionersQuery } from '@/services/setupService';
import { useAdmitToInpatientEncounterMutation } from '@/services/encounterService';
import { useGetRoomListQuery, useDeactiveActivRoomMutation } from '@/services/setupService';
import { ApAdmitOutpatientInpatient } from '@/types/model-types';
const PatientAdmission = ({ open, setOpen, admitToInpatientObject }) => {
    const [admitToInpatient, setAdmitToInpatient] = useState<ApAdmitOutpatientInpatient>({ ...newApAdmitOutpatientInpatient });
    const inpatientDepartmentListResponse = useGetResourceTypeQuery("4217389643435490");

    const [listRequest, setListRequest] = useState<ListRequest>({
        ...initialListRequest,

        filters: [
            {
                fieldName: 'department_key',
                operator: 'match',
                value: admitToInpatient?.admissionDepartmentKey
            }],
                    pageSize: 100,
    });

    console.log("listRequest==>",listRequest);
    const [bedListRequest, setBedListRequest] = useState<ListRequest>({
        ...initialListRequest,
        pageSize: 100,
        filters: [
            {
                fieldName: 'room_key',
                operator: 'match',
                value: admitToInpatient?.roomKey
            }]
    });
    // Fetch Room list response
    const {
        data: roomListResponseLoading,
        refetch,
        isFetching
    } = useGetRoomListQuery(listRequest);
    const dispatch = useAppDispatch();
    const [saveAdmitToInpatient, saveAdmitToInpatientMutation] = useAdmitToInpatientEncounterMutation();
    console.log("roomListResponseLoading==>", roomListResponseLoading);
    const [physicanListRequest, setPhysicanListRequest] = useState<ListRequest>({
        ...initialListRequest,
        filters: [
            {
                fieldName: 'deleted_at',
                operator: 'isNull',
                value: undefined
            },
            {
                fieldName: 'job_role_lkey',
                operator: 'match',
                value: '157153854130600'
            }
        ],
        pageSize: 1000
    });
    const { data: practitionerListResponse } = useGetPractitionersQuery(physicanListRequest);
    // handle save To admit outpatient to inpatient function
    const handleSave = async () => {
        try {
            const saveAdmit = await saveAdmitToInpatient({
                ...admitToInpatient,
            }).unwrap();
            dispatch(notify({ msg: 'Billing Approval Sent', sev: 'success' }));
            setOpen(false);
            setAdmitToInpatient({ ...newApAdmitOutpatientInpatient });

        } catch (error) {
        }
    };
    useEffect(() => {
        setAdmitToInpatient({ ...admitToInpatientObject, admissionDepartmentKey: admitToInpatientObject?.inpatientDepartmentKey });
    }, [admitToInpatientObject]);
    useEffect(() => {
  setPhysicanListRequest((prev) => {
    const baseFilters = [
      {
        fieldName: 'deleted_at',
        operator: 'isNull',
        value: undefined,
      },
    ];

    // إذا كانت admitToInpatient true نضيف الفلتر الجديد
    if (admitToInpatient) {
      baseFilters.push({
        fieldName: 'job_role_lkey',
        operator: 'match',
        value: '157153854130600',
      });
    }

    return {
      ...prev,
      filters: baseFilters,
    };
  });
}, [admitToInpatient]);
    // modal content
    console.log("admitToInpatientObject==>", admitToInpatient)
    const modalContent = (
      <>  <Form fluid layout="inline" className='fields-container'>
            <MyInput
                require
                column
                fieldLabel="Admission Department"
                fieldType="select"
                fieldName="admissionDepartmentKey"
                selectData={inpatientDepartmentListResponse?.data?.object ?? []}
                selectDataLabel="name"
                selectDataValue="key"
                record={admitToInpatient}
                setRecord={setAdmitToInpatient}
                width={190}
            />
              <MyInput
                require
                column
                fieldLabel="Select Room"
                fieldType="select"
                fieldName="admissionDepartmentKey"
                selectData={ []}
                selectDataLabel="name"
                selectDataValue="key"
                record={admitToInpatient}
                setRecord={setAdmitToInpatient}
                width={190}
            />
               <MyInput
                require
                column
                fieldLabel="Select Bed"
                fieldType="select"
                fieldName="admissionDepartmentKey"
                selectData={ []}
                selectDataLabel="name"
                selectDataValue="key"
                record={admitToInpatient}
                setRecord={setAdmitToInpatient}
                width={190}
            />
            <MyInput
                require
                column
                fieldLabel="Responsible Department"
                fieldType="select"
                fieldName="inpatientDepartmentKey"
                selectData={inpatientDepartmentListResponse?.data?.object ?? []}
                selectDataLabel="name"
                selectDataValue="key"
                record={admitToInpatient}
                setRecord={setAdmitToInpatient}
                width={190}
                disabled
            />
            <MyInput
                require
                column
                fieldLabel="Responsible physician"
                fieldType="select"
                fieldName="physicianKey"
                selectData={practitionerListResponse?.object ?? []}
                selectDataLabel="practitionerFullName"
                selectDataValue="key"
                record={admitToInpatient}
                setRecord={setAdmitToInpatient}
                width={190}
                disabled
            />
            <br/>
         
        </Form>
              <Form fluid layout="inline" className='fields-container'>
                   <MyInput
                column
                fieldType='textarea'
                fieldLabel="Handoff Information"
                fieldName='handoffInformation'
                record={admitToInpatient}
                setRecord={setAdmitToInpatient}
                width={390}
            />
            <MyInput
                column
                fieldType='textarea'
                fieldLabel="Reason of Admission"
                fieldName='reasonOfAdmission'
                record={admitToInpatient}
                setRecord={setAdmitToInpatient}
                width={390}
            /></Form></>);
    return (<MyModal
        open={open}
        setOpen={setOpen}
        title="Admit to Inpatient"
        steps={[{ title: "Admit to Inpatient", icon: <FontAwesomeIcon icon={faBed} /> }]}
        size="60vw"
        bodyheight='500px'
        actionButtonFunction={handleSave}
        content={modalContent}
    />);
}
export default PatientAdmission