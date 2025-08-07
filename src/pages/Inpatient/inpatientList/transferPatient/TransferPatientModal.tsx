import React, { useState, useEffect } from 'react';
import { initialListRequest, ListRequest } from '@/types/types';
import MyInput from '@/components/MyInput';
import { newApAdmitOutpatientInpatient, newApBed, newApEncounter, newApPatient, newApRoom, newApTransferPatient } from '@/types/model-types-constructor';
import { useFetchBedCountByDepartmentKeyQuery, useGetPractitionersQuery } from '@/services/setupService';
import { Form } from 'rsuite';
import { ApBed, ApPatient, ApRoom, ApTransferPatient } from '@/types/model-types';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { useGetResourceTypeQuery } from '@/services/appointmentService';
import MyLabel from '@/components/MyLabel';
import { useSaveTransferPatientMutation } from '@/services/encounterService';
import { notify } from '@/utils/uiReducerActions';
import { useAppDispatch } from '@/hooks';
import AdvancedModal from '@/components/AdvancedModal';
const TransferPatientModal = ({ open, setOpen, localEncounter, refetchInpatientList }) => {
    const [encounter, setEncounter] = useState<any>({ ...newApEncounter });
    const [localPatient, setLocalPatient] = useState<ApPatient>({ ...newApPatient });
    const [apBed, setApBed] = useState<ApBed>({ ...newApBed });
    const [apRoom, setApRoom] = useState<ApRoom>({ ...newApRoom });
    const [admitToInpatient, setAdmitToInpatient] = useState({ ...newApAdmitOutpatientInpatient });
    const [transferPatient, setTransferPatient] = useState<ApTransferPatient>({ ...newApTransferPatient });
    const inpatientDepartmentListResponse = useGetResourceTypeQuery("4217389643435490");
    const [bedCount, setBedCount] = useState({ count: 0 });
    const [saveTransferPatient] = useSaveTransferPatientMutation();
    const dispatch = useAppDispatch();
    // State to manage the list request used for fetching practitioners
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
    // Fetch the list of practitioners (physicians) based on the request
    const { data: practitionerListResponse } = useGetPractitionersQuery(physicanListRequest);
    // Fetch the bed count for the selected department key
    const { data: bedCountResponse, isFetching } = useFetchBedCountByDepartmentKeyQuery(
        { department_key: transferPatient?.toInpatientDepartmentKey },
        {
            skip: !transferPatient?.toInpatientDepartmentKey
        }
    );


    // Fetch LOV data for various fields
    const { data: genderLovQueryResponse } = useGetLovValuesByCodeQuery('GNDR');
    //right modal content
    const rightModalContent = (
        <>
            <br />
            <MyLabel label={<h6>Transfer Details</h6>} />
            <Form fluid layout="inline" className='fields-container'>
                <MyInput
                    width={200}
                    column
                    fieldType="select"
                    fieldLabel="Transfer To Ward"
                    fieldName="toInpatientDepartmentKey"
                    selectData={
                        inpatientDepartmentListResponse?.data?.object
                            ?.filter((item) => item.key !== localEncounter?.resourceObject?.key)
                        ?? []
                    }
                    selectDataLabel="name"
                    selectDataValue="key"
                    record={transferPatient}
                    setRecord={setTransferPatient}
                />

                <MyInput
                    width={200}
                    column
                    fieldLabel="Bed Count"
                    fieldName="count"
                    record={bedCount}
                    setRecord={setBedCount}
                    disabled
                />
                <MyInput
                    width={200}
                    column
                    fieldType="checkbox"
                    fieldLabel="Urgent Transfer"
                    fieldName="urgentTransfer"
                    record={transferPatient}
                    setRecord={setTransferPatient} />
                <MyInput
                    width={200}
                    column
                    fieldType="checkbox"
                    fieldLabel="Planned Transfer"
                    fieldName="plannedTransfer"
                    record={transferPatient}
                    setRecord={setTransferPatient} />
                <MyInput
                    width={200}
                    column
                    fieldLabel="Transfer Notes"
                    fieldName="transferNotes"
                    record={transferPatient}
                    setRecord={setTransferPatient}
                    fieldType='textarea' />
                <MyInput
                    width={200}
                    column
                    fieldLabel="Reason for Transfer"
                    fieldName="reasonForTransfer"
                    record={transferPatient}
                    setRecord={setTransferPatient}
                    fieldType='textarea' />
            </Form>
            <br />
            <MyLabel label={<h6>Checklist</h6>} />
            <Form fluid layout="inline" className='fields-container'>
                <MyInput
                    width={200}
                    column
                    fieldType="checkbox"
                    fieldLabel="Final Vitals Before Transfer"
                    fieldName="finalVitalsBeforeTransfer"
                    record={transferPatient}
                    setRecord={setTransferPatient} />
                <MyInput
                    width={200}
                    column
                    fieldType="checkbox"
                    fieldLabel="IV Lines / Drips Checked"
                    fieldName="ivLinesDripsChecked"
                    record={transferPatient}
                    setRecord={setTransferPatient} />
                <MyInput
                    width={200}
                    column
                    fieldType="checkbox"
                    fieldLabel="Medication Administered Pre-Transfer"
                    fieldName="medicationAdministeredPreTransfer"
                    record={transferPatient}
                    setRecord={setTransferPatient} />
                <MyInput
                    width={200}
                    column
                    fieldType="checkbox"
                    fieldLabel="Belongings Sent with Patient"
                    fieldName="belongingsSentWithPatient"
                    record={transferPatient}
                    setRecord={setTransferPatient} />
                <MyInput
                    width={200}
                    column
                    fieldType="checkbox"
                    fieldLabel="Clinical Handover Done"
                    fieldName="clinicalHandoverDone"
                    record={transferPatient}
                    setRecord={setTransferPatient} />
            </Form>
        </>
    );

    // left modal content
    const modalContent = (
        <>
            <Form fluid layout="inline" className='fields-container'>
                <MyInput
                    width={200}
                    column
                    fieldLabel="Patient Name"
                    fieldName="fullName"
                    record={localPatient}
                    setRecord={setLocalPatient}
                    disabled
                />
                <MyInput
                    width={200}
                    column
                    fieldLabel="Patient MRN"
                    fieldName="patientMrn"
                    record={localPatient}
                    setRecord={setLocalPatient}
                    disabled
                />
                <MyInput
                    width={200}
                    column
                    fieldLabel="Gender"
                    fieldType="select"
                    fieldName="genderLkey"
                    selectData={genderLovQueryResponse?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    record={localPatient}
                    setRecord={setLocalPatient}
                    disabled
                />
                <MyInput
                    width={200}
                    column
                    fieldLabel="Admission Date"
                    fieldName="plannedStartDate"
                    record={encounter}
                    setRecord={setEncounter}
                    disabled
                />
                <MyInput
                    width={200}
                    column
                    fieldLabel="Current Ward"
                    fieldName="departmentName"
                    record={encounter}
                    setRecord={setEncounter}
                    disabled
                />
                <MyInput
                    width={200}
                    column
                    fieldLabel="Room"
                    fieldName="name"
                    record={apRoom}
                    setRecord={setApRoom}
                    disabled
                />
                <MyInput
                    width={200}
                    column
                    fieldLabel="Bed"
                    fieldName="name"
                    record={apBed}
                    setRecord={setApBed}
                    disabled
                />
                <MyInput
                    column
                    fieldLabel="Responsible physician"
                    fieldType="select"
                    fieldName="physicianKey"
                    selectData={practitionerListResponse?.object ?? []}
                    selectDataLabel="practitionerFullName"
                    selectDataValue="key"
                    record={admitToInpatient}
                    setRecord={setAdmitToInpatient}
                    width={200}
                    disabled
                />
                <MyInput
                    width={400}
                    column
                    fieldType="textarea"
                    fieldLabel="Diagnosis"
                    fieldName="diagnosis"
                    record={encounter}
                    setRecord={setEncounter}
                    disabled
                />
            </Form>
        </>
    );

    // Function to handle saving the transfer patient data
    const handleSave = async () => {
        // TODO convert key to code
        try {
            if (transferPatient.key === undefined) {
                await saveTransferPatient({
                    ...transferPatient,
                    patientKey: localPatient.key,
                    encounterKey: encounter.key,
                    fromInpatientDepartmentKey: encounter.resourceObject?.key,
                    statusLkey: "91063195286200"
                }).unwrap();

                dispatch(notify({ msg: 'Transfer Patient Successfully', sev: 'success' }));
                //TODO convert key to code
                setTransferPatient({ ...newApTransferPatient, statusLkey: "91063195286200" });
                setOpen(false);
            }
            await refetchInpatientList();
            handleClearField();
        } catch (error) {
            console.error("Error saving Transfer Patientt:", error);
            dispatch(notify({ msg: 'Failed to Save Transfer Patient', sev: 'error' }));
        }
    };
    // Function to clear the fields
    const handleClearField = () => {
        setTransferPatient({ ...newApTransferPatient });
        setBedCount({ count: 0 });
    }
    // Effects
    useEffect(() => {
        if (localEncounter) {
            setEncounter(localEncounter);
            setLocalPatient(localEncounter.patientObject);
            setApBed(localEncounter.apBed);
            setApRoom(localEncounter.apRoom);
            setAdmitToInpatient({ ...localEncounter?.admitRecord });
        }
    }, [localEncounter]);
    useEffect(() => {
        setBedCount({ count: bedCountResponse ?? 0 });
    }, [bedCountResponse]);
    useEffect(() => {
        if (!open) {
            handleClearField();
        }
    }, [open]);
    useEffect(() => {
        if (!isFetching && bedCountResponse !== undefined) {
            setBedCount({ count: bedCountResponse });

            if (transferPatient?.toInpatientDepartmentKey && bedCountResponse === 0) {
                dispatch(notify({ msg: 'No Available Beds', sev: 'warning' }));
            }
        }
    }, [isFetching, bedCountResponse, transferPatient?.toInpatientDepartmentKey]);


    return (
        <AdvancedModal
            open={open}
            setOpen={setOpen}
            leftTitle={`Patient Information`}
            rightTitle='Patient Transfer'
            actionButtonFunction={handleSave}
            leftWidth="40%"
            rightWidth="60%"
            rightContent={rightModalContent}
            leftContent={modalContent}
            actionButtonLabel="Transfer"
        ></AdvancedModal>);
}
export default TransferPatientModal;