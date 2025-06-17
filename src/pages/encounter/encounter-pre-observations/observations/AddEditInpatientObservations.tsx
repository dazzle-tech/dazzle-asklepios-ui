import React, { useState, useEffect } from 'react';
import { useAppDispatch } from '@/hooks';
import { Form } from 'rsuite';
import { faChildReaching, faHeartPulse, faPerson } from '@fortawesome/free-solid-svg-icons';
import MyLabel from '@/components/MyLabel';
import MyInput from '@/components/MyInput';
import { faFaceTired } from '@fortawesome/free-solid-svg-icons';
import { newApPatientObservationSummary } from '@/types/model-types-constructor';
import { useGetObservationSummariesQuery, useSaveObservationSummaryMutation } from '@/services/observationService';
import { notify } from '@/utils/uiReducerActions';
import MyModal from '@/components/MyModal/MyModal';
import MyButton from '@/components/MyButton/MyButton';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ApPatientObservationSummary } from '@/types/model-types';
import { initialListRequest, ListRequest } from '@/types/types';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
const AddEditInpatientObservations = ({ open, setOpen, patient, encounter, observationsObject, refetch, edit }) => {
    const [patientObservationSummary, setPatientObservationSummary] = useState<ApPatientObservationSummary>(observationsObject);
    const [saveObservationSummary, saveObservationsMutation] = useSaveObservationSummaryMutation();
    const [isDisabledField, setIsDisabledField] = useState(false);
    const [isEncounterObservationsStatusClose, setIsEncounterObservationsStatusClose] = useState(false);
    const [isEncounterStatusClosed, setIsEncounterStatusClosed] = useState(false);
    const [bmi, setBmi] = useState('');
    const [bsa, setBsa] = useState('');
    const [map, setMap] = useState('');
    const dispatch = useAppDispatch();
    // Define state for the request used to fetch the patient's last visit observations list
    const [patientLastVisitObservationsListRequest, setPatientLastVisitObservationsListRequest] = useState<ListRequest>({
        ...initialListRequest,
        sortBy: 'createdAt',
        sortType: 'desc',
        filters: [
            {
                fieldName: 'patient_key',
                operator: 'match',
                value: patient?.key
            },
            {
                fieldName: 'visit_key',
                operator: 'match',
                value: encounter?.key
            }
        ]
    });
    // Fetch LOV data for various fields
    const { data: painDegreesLovQueryResponse } = useGetLovValuesByCodeQuery('PAIN_DEGREE');
    // Fetch observation summaries using the useGetObservationSummariesQuery hook
    const { data: getObservationSummaries } = useGetObservationSummariesQuery({ ...patientLastVisitObservationsListRequest, });
    // Get the last observation summary if available, otherwise set it to null
    const lastObservationSummary = getObservationSummaries?.object?.length > 0 ? getObservationSummaries.object[0] : null;

    // Handle Save Observations Function
    const handleSave = async () => {
        try {
            await saveObservationSummary({
                ...patientObservationSummary,
                visitKey: encounter.key,
                patientKey: patient.key,
                createdBy: 'Administrator',
                lastDate: new Date(),
                latestbmi: bmi,
                age: lastObservationSummary?.age,
                prevRecordKey: lastObservationSummary?.key || null,
                plastDate: lastObservationSummary?.lastDate || null,
                platesttemperature: lastObservationSummary?.latesttemperature || null,
                platestbpSystolic: lastObservationSummary?.latestbpSystolic || null,
                platestbpDiastolic: lastObservationSummary?.latestbpDiastolic || null,
                platestheartrate: lastObservationSummary?.latestheartrate || null,
                platestrespiratoryrate: lastObservationSummary?.latestrespiratoryrate || null,
                platestoxygensaturation: lastObservationSummary?.latestoxygensaturation || null,
                platestweight: lastObservationSummary?.latestweight || lastObservationSummary?.platestweight,
                platestheight: lastObservationSummary?.latestheight || lastObservationSummary?.platestheight,
                platestheadcircumference: lastObservationSummary?.latestheadcircumference || lastObservationSummary?.platestheadcircumference,
                platestnotes: lastObservationSummary?.latestnotes || '',
                platestpaindescription: lastObservationSummary?.latestpaindescription || '',
                platestpainlevelLkey: lastObservationSummary?.latestpainlevelLkey || '',
                platestbmi: lastObservationSummary?.latestbmi,
                page: lastObservationSummary?.age,
            }).unwrap();
            refetch();
            dispatch(notify({ msg: 'Saved Successfully', sev: 'success' }));
        } catch (error) {
            console.error('Error while saving observation summary:', error);
            dispatch(notify({ msg: 'Error occurred while saving', sev: 'error' }));
        }
    };
    // Handle Clear Fields 
    const handleClear = () => {
        setPatientObservationSummary({
            ...newApPatientObservationSummary,
            latestpainlevelLkey: null
        });
    }
    //Effects
    useEffect(() => {
        // TODO update status to be a LOV value
        if (encounter?.encounterStatusLkey === '91109811181900') {
            setIsEncounterStatusClosed(true);
        }
    }, [encounter?.encounterStatusLkey]);
    useEffect(() => {
        if (isEncounterStatusClosed || isEncounterObservationsStatusClose) {
            setIsDisabledField(true);
        } else {
            setIsDisabledField(false);
        }
    }, [isEncounterStatusClosed, isEncounterObservationsStatusClose]);
    useEffect(() => {
        const diastolic = Number(patientObservationSummary.latestbpDiastolic);
        const systolic = Number(patientObservationSummary.latestbpSystolic);

        if (!isNaN(diastolic) && !isNaN(systolic)) {
            const calculatedMap = ((2 * diastolic + systolic) / 3).toFixed(2);
            setMap(calculatedMap);
        }
    }, [patientObservationSummary.latestbpDiastolic, patientObservationSummary.latestbpSystolic]);
    useEffect(() => {
        const { latestweight, latestheight } = patientObservationSummary;
        if (latestweight && latestheight) {
            const calculatedBmi = (latestweight / ((latestheight / 100) ** 2)).toFixed(2);
            const calculatedBsa = Math.sqrt((latestweight * latestheight) / 3600).toFixed(2);
            setBmi(calculatedBmi);
            setBsa(calculatedBsa);
        } else {
            setBmi('');
            setBsa('');
        }
    }, [patientObservationSummary]);
    useEffect(() => {
        setPatientObservationSummary(observationsObject);
    }, [observationsObject]);
    useEffect(() => {
        const diastolic = Number(patientObservationSummary.latestbpDiastolic);
        const systolic = Number(patientObservationSummary.latestbpSystolic);

        if (!isNaN(diastolic) && !isNaN(systolic)) {
            const calculatedMap = ((2 * diastolic + systolic) / 3).toFixed(2);
            setMap(calculatedMap);
        }
    }, [patientObservationSummary.latestbpDiastolic, patientObservationSummary.latestbpSystolic]);
    useEffect(() => {
        if (saveObservationsMutation && saveObservationsMutation.status === 'fulfilled') {
            setPatientObservationSummary(saveObservationsMutation.data);
        }
    }, [saveObservationsMutation]);
    // Modal Content 
    const content = stepNumber => {
        switch (stepNumber) {
            case 0:
                return (
                    <Form fluid layout="inline">
                        <div className='row-contains-many-fields'>
                            <MyInput
                                column
                                width={150}
                                fieldLabel='BP Systolic'
                                fieldName='latestbpSystolic'
                                disabled={isEncounterStatusClosed}
                                fieldType='number'
                                record={patientObservationSummary}
                                setRecord={setPatientObservationSummary}
                            >
                            </MyInput>
                            <div className='divide-style'>/</div>
                            <MyInput
                                column
                                width={150}
                                fieldLabel='BP Diastolic'
                                fieldName='latestbpDiastolic'
                                disabled={isEncounterStatusClosed}
                                fieldType='number'
                                record={patientObservationSummary}
                                setRecord={setPatientObservationSummary}
                            ></MyInput>  <div className='container-Column'>
                                <MyLabel label="MAP" />
                                <div>
                                    <FontAwesomeIcon icon={faHeartPulse} className='my-icon' />
                                    <text>{
                                        map
                                    }</text></div>
                            </div>
                        </div>
                        <MyInput
                            fieldLabel='Pulse'
                            rightAddon="bpm"
                            column
                            width={150}
                            rightAddonwidth={50}
                            fieldName='latestheartrate'
                            disabled={isEncounterStatusClosed}
                            fieldType='number'
                            record={patientObservationSummary}
                            setRecord={setPatientObservationSummary}
                        ></MyInput>
                        <MyInput
                            column
                            fieldLabel='R.R'
                            rightAddon="bpm"
                            rightAddonwidth={50}
                            width={150}
                            fieldName='latestrespiratoryrate'
                            disabled={isEncounterStatusClosed}
                            fieldType='number'
                            record={patientObservationSummary}
                            setRecord={setPatientObservationSummary}
                        ></MyInput>
                        <MyInput
                            column
                            fieldLabel='SpO2'
                            rightAddon="%"
                            width={150}
                            rightAddonwidth={50}
                            fieldName='latestoxygensaturation'
                            disabled={isEncounterStatusClosed}
                            fieldType='number'
                            record={patientObservationSummary}
                            setRecord={setPatientObservationSummary}
                        ></MyInput>
                        <MyInput
                            column
                            fieldLabel='Temp'
                            rightAddon="°C"
                            rightAddonwidth={50}
                            width={150}
                            fieldName='latesttemperature'
                            disabled={isEncounterStatusClosed}
                            fieldType='number'
                            record={patientObservationSummary}
                            setRecord={setPatientObservationSummary}
                        ></MyInput>
                        <MyInput
                            column
                            fieldLabel='Note'
                            height='80px'
                            width={200}
                            fieldName='latestnotes'
                            disabled={isEncounterStatusClosed}
                            fieldType='textarea'
                            record={patientObservationSummary}
                            setRecord={setPatientObservationSummary}
                        ></MyInput>

                    </Form>
                );
            case 1:
                return (
                    <Form fluid layout="inline">
                        <div className='row-contains-many-fields'>
                            <MyInput
                                width={250}
                                fieldLabel='Weight'
                                fieldName='latestweight'
                                rightAddon="Kg"
                                disabled={isEncounterStatusClosed}
                                fieldType='number'
                                record={patientObservationSummary}
                                setRecord={setPatientObservationSummary}
                            ></MyInput>
                            <div className='container-Column'>
                                <MyLabel label="BMI" />
                                <div>
                                    <FontAwesomeIcon icon={faPerson} className='my-icon' />
                                    <text>{bmi}</text>
                                </div>
                            </div>
                        </div>
                        <div className='row-contains-many-fields'>
                            <MyInput
                                width={250}
                                fieldLabel='Height'
                                fieldName='latestheight'
                                rightAddon="cm"
                                disabled={isEncounterStatusClosed}
                                fieldType='number'
                                record={patientObservationSummary}
                                setRecord={setPatientObservationSummary}
                            ></MyInput>
                            <div className='container-Column'>
                                <MyLabel label="BSA" />
                                <div>
                                    <FontAwesomeIcon icon={faChildReaching} className='my-icon' />
                                    <text>{bsa}</text>
                                </div>
                            </div>
                        </div>
                        <MyInput
                            width={250}
                            fieldLabel='Head circumference'
                            rightAddon="cm"
                            fieldName='latestheadcircumference'
                            disabled={isEncounterStatusClosed}
                            fieldType='number'
                            record={patientObservationSummary}
                            setRecord={setPatientObservationSummary} />
                    </Form>
                );
            case 2:
                return (
                    <Form fluid layout="inline">
                        <MyInput
                            column
                            disabled={isEncounterStatusClosed}
                            width={300}
                            fieldLabel="Pain Degree"
                            fieldType="select"
                            fieldName="latestpainlevelLkey"
                            selectData={painDegreesLovQueryResponse?.object ?? []}
                            selectDataLabel="lovDisplayVale"
                            selectDataValue="key"
                            record={patientObservationSummary}
                            setRecord={setPatientObservationSummary}
                        />
                        <MyInput
                            column
                            fieldType='textarea'
                            width={300}
                            height='150px'
                            fieldLabel="Pain Description"
                            fieldName='latestpaindescription'
                            record={patientObservationSummary}
                            setRecord={setPatientObservationSummary} />
                    </Form>
                );
        };
    }
    return (
        <MyModal
            open={open}
            setOpen={setOpen}
            title={patientObservationSummary?.key ? "Edit Observations" : "Add Observations"}
            actionButtonFunction={handleSave}
            position='right'
            isDisabledActionBtn={!edit ? isDisabledField : true}
            size='32vw'
            footerButtons={<>
                <MyButton appearance='ghost' onClick={handleClear}>Clear</MyButton>
                <MyButton onClick={handleSave}>Save</MyButton>
            </>
            }
            steps={[{
                title: "Vital Signs",
                icon: <FontAwesomeIcon icon={faHeartPulse} />,
            }, {
                title: "Body Measurements",
                icon: <FontAwesomeIcon icon={faChildReaching} />,
            }, {
                title: "Pain Level",
                icon: <FontAwesomeIcon icon={faFaceTired} />
            }]}
            content={content}
        ></MyModal>
    );
};
export default AddEditInpatientObservations;