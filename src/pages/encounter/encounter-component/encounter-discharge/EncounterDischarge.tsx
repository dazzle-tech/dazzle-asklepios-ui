import React, { useEffect, useState } from 'react';
import { useAppDispatch } from '@/hooks';
import { Form } from 'rsuite';
import { newApEncounter } from '@/types/model-types-constructor';
import { ApEncounter, ApBed } from '@/types/model-types';
import { notify } from '@/utils/uiReducerActions';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import MyModal from '@/components/MyModal/MyModal';
import './styles.less'
import { useUpdateEncounterMutation } from '@/services/encounters/patientEncounterService';
import { PatientEncounter } from '@/types/model-types-new';
import { faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import { useGetLovValuesByCodeQuery, useSaveBedMutation, useLazyGetBedListQuery } from '@/services/setupService';
import { useLazyGetEncounterAssignToBedQuery } from '@/services/encounterService';
import MyInput from '@/components/MyInput';
import { ListRequest } from '@/types/types';
import { initialListRequest } from '@/types/types';

const EncounterDischarge = ({ open, setOpen, encounter, refetch = null }) => {
    const dispatch = useAppDispatch();
    const [localEncounter, setLocalEncounter] = useState<ApEncounter>({ ...newApEncounter, dischargeAt: (new Date()).getTime() });
    const [updateEncounter] = useUpdateEncounterMutation();
    const [saveBed] = useSaveBedMutation();
    const [getEncounterAssignToBed] = useLazyGetEncounterAssignToBedQuery();
    const [getBedList] = useLazyGetBedListQuery();

    // Fetch discharge type LOV
    const { data: dischargeTypeLovQueryResponse } = useGetLovValuesByCodeQuery('DC_TYPES');

    // Function to handle the discharge of the encounter
    const handleCompleteEncounter = async () => {
        try {
            // Get encounter id - handle both old (key) and new (id) formats
            const encounterId = encounter?.id ?? encounter?.key;
            
            if (!encounterId) {
                dispatch(notify({ msg: 'Encounter ID is required', sev: 'error' }));
                return;
            }

            // Convert encounter ID to number if it's a string
            const numericId = typeof encounterId === 'string' ? Number(encounterId) : encounterId;

            // Build update payload - preserve all encounter fields and update status to "Discharge"
            // Handle both old (ApEncounter) and new (PatientEncounter) encounter types
            const updatePayload: PatientEncounter = {
                id: numericId,
                patientId: encounter.patientId ?? (encounter as any).patient?.id ?? ((encounter as any).patientKey ? Number((encounter as any).patientKey) : 0),
                facilityId: encounter.facilityId ?? ((encounter as any).facilityKey ? Number((encounter as any).facilityKey) : 0),
                departmentId: encounter.departmentId ?? ((encounter as any).departmentKey ? Number((encounter as any).departmentKey) : 0),
                practitionerId: encounter.practitionerId ?? ((encounter as any).practitionerKey ? Number((encounter as any).practitionerKey) : null),
                encounterType: encounter.encounterType ?? (encounter as any).encounterTypeLkey ?? '',
                encounterReason: encounter.encounterReason ?? (encounter as any).reasonLkey ?? '',
                priorityLevel: encounter.priorityLevel ?? (encounter as any).encounterPriorityLkey ?? '',
                status: 'DISCHARGED', // Update status to Discharge
                encounterNumber: encounter.encounterNumber ?? (encounter as any).visitId ?? null,
                encounterDate: encounter.encounterDate ?? (encounter as any).plannedStartDate ?? null,
                followUpEncounterId: encounter.followUpEncounterId ?? ((encounter as any).followUpEncounterKey ? Number((encounter as any).followUpEncounterKey) : null),
                originType: encounter.originType ?? (encounter as any).originLkey ?? null,
                originName: encounter.originName ?? (encounter as any).admissionSource ?? null,
                notes: encounter.notes ?? (encounter as any).encounterNotes ?? null,
                departmentDailySequenceNumber: encounter.departmentDailySequenceNumber ?? null,
                chiefComplaint: encounter.chiefComplaint ?? (encounter as any).chiefComplaint ?? null,
                hasPrescription: encounter.hasPrescription ?? false,
                hasOrder: encounter.hasOrder ?? false,
                isObserved: encounter.isObserved ?? (encounter as any).isObserved ?? false,
                paymentDate: (encounter as any).paymentDate ?? '',
                amount: (encounter as any).amount ?? 0
            };

            // Ensure required fields are present
            if (!updatePayload.facilityId || !updatePayload.departmentId || !updatePayload.patientId) {
                dispatch(notify({ msg: 'Encounter missing required fields (facilityId, departmentId, or patientId)', sev: 'error' }));
                return;
            }

            // Update the encounter using updateEncounter mutation with status "Discharge"
            await updateEncounter({ 
                id: numericId, 
                body: updatePayload 
            }).unwrap();

            // After successful discharge, handle bed status update
            try {
                // Get encounter assign to bed record using the service query
                const encounterAssignToBedListRequest: ListRequest = {
                    ...initialListRequest,
                    filters: [
                        {
                            fieldName: 'encounter_key',
                            operator: 'match',
                            value: String(encounterId)
                        }
                    ],
                    pageSize: 1
                };
                
                const encounterAssignToBedResponse = await getEncounterAssignToBed(encounterAssignToBedListRequest).unwrap();
                const encounterAssignToBed = Array.isArray(encounterAssignToBedResponse) 
                    ? encounterAssignToBedResponse[0] 
                    : encounterAssignToBedResponse;
                
                if (encounterAssignToBed?.bedKey) {
                    // Get the bed details using getBedList from setupService
                    const bedListRequest: ListRequest = {
                        ...initialListRequest,
                        filters: [
                            {
                                fieldName: 'key',
                                operator: 'match',
                                value: encounterAssignToBed.bedKey
                            }
                        ],
                        pageSize: 1
                    };
                    
                    // Use the lazy query hook to get the bed
                    const bedQueryResult = await getBedList(bedListRequest).unwrap();
                    
                    // Get the bed from the response
                    const bedResponse = bedQueryResult?.object;
                    const bed = Array.isArray(bedResponse) ? bedResponse[0] : bedResponse;
                    
                    if (bed) {
                        // Update bed status to 5258572711068224
                        await saveBed({
                            ...bed,
                            statusLkey: '5258572711068224',
                            isValid: bed.isValid !== undefined ? bed.isValid : true
                        } as ApBed).unwrap();
                    }
                }
            } catch (bedError) {
                // Log bed update error but don't fail the discharge
                console.error("Error updating bed status:", bedError);
                // Optionally notify user about bed status update failure
                // dispatch(notify({ msg: 'Encounter discharged but bed status update failed', sev: 'warning' }));
            }
            
            dispatch(notify({ msg: ' Encounter Discharge Successfully', sev: 'success' }));
            setOpen(false);
            if (refetch) {
                refetch();
            }
        }
        catch (error: any) {
            console.error("Encounter discharge error:", error);
            // Extract error message from the error object
            const errorMessage = error?.data?.message || error?.data?.detail || error?.message || 'An error occurred while discharging the encounter';
            dispatch(notify({ msg: errorMessage, sev: 'error' }));
        }
    };
    // Modal Content 
    const content = (
        <Form fluid layout='inline' className='encounter-discharge-form'>
            <MyInput
                column
                width={300}
                fieldLabel="Discharge Type"
                fieldType="select"
                fieldName="dischargeTypeLkey"
                selectData={dischargeTypeLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={localEncounter}
                setRecord={setLocalEncounter}
                searchable={false} />
            <MyInput
                column
                width={300}
                fieldLabel="Date Time"
                fieldType="datetime"
                fieldName="dischargeAt"
                record={localEncounter}
                setRecord={setLocalEncounter}
                searchable={false} />
            <MyInput
                column
                width={300}
                fieldLabel="Discharge Diagnosis"
                fieldType="textarea"
                fieldName="diagnosis"
                record={localEncounter}
                setRecord={setLocalEncounter}
                disabled={true} />
        </Form>
    )

    //Effects
    useEffect(() => {
        if (encounter) {
            setLocalEncounter({
                ...encounter,
                dischargeAt: encounter.dischargeAt ? new Date(encounter.dischargeAt).getTime() : new Date().getTime()
            });
        }
    }, [encounter]);


    return (
        <MyModal
            open={open}
            setOpen={setOpen}
            title="Discharge Encounter"
            actionButtonFunction={handleCompleteEncounter}
            position='center'
            size='28vw'
            bodyheight='70vh'
            steps={[{
                title: "Discharge Encounter",
                icon: <FontAwesomeIcon icon={faSignOutAlt} />
            },]}
            content={content}
        ></MyModal>
    );
};
export default EncounterDischarge;