import React, { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/hooks';
import { Form } from 'rsuite';
import {
    faChildReaching,
    faHeartPulse,
    faPerson
} from '@fortawesome/free-solid-svg-icons';
import MyLabel from '@/components/MyLabel';
import MyInput from '@/components/MyInput';
import { faFileWaveform } from '@fortawesome/free-solid-svg-icons';
import { newApElectrocardiogramEcg, newApPatientObservationSummary } from '@/types/model-types-constructor';
import { useGetObservationSummariesQuery, useSaveObservationSummaryMutation } from '@/services/observationService'; import { notify } from '@/utils/uiReducerActions';
import MyModal from '@/components/MyModal/MyModal';
import MyButton from '@/components/MyButton/MyButton';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Col, Divider, Row } from 'rsuite';
import { ApPatientObservationSummary } from '@/types/model-types';
import { initialListRequest, ListRequest } from '@/types/types';
const AddEditInpatientObservations = ({ open, setOpen, patient, encounter, observationsObject, refetch, edit }) => {
    const authSlice = useAppSelector(state => state.auth);
    const [patientObservationSummary, setPatientObservationSummary] = useState<ApPatientObservationSummary>(observationsObject);
    const [saveObservationSummary] = useSaveObservationSummaryMutation();
    const [isDisabledField, setIsDisabledField] = useState(false);
    const [isEncounterObservationsStatusClose, setIsEncounterObservationsStatusClose] = useState(false);
    const [isEncounterStatusClosed, setIsEncounterStatusClosed] = useState(false);
    const [bmi, setBmi] = useState('');
    const [bsa, setBsa] = useState('');
    const [map, setMap] = useState('');
    const dispatch = useAppDispatch()
    const [patientLastVisitObservationsListRequest, setPatientLastVisitObservationsListRequest] = useState<ListRequest>({
        ...initialListRequest,
        sortBy: 'createdAt',
        sortType: 'desc',
        filters: [
            {
                fieldName: 'patient_key',
                operator: 'match',
                value: patient?.key
            }
        ]
    });
    // Fetch LOV data for various fields
    const { data: getObservationSummaries } = useGetObservationSummariesQuery({
        ...patientLastVisitObservationsListRequest,
    });
    const firstObservationSummary = getObservationSummaries?.object?.length > 0 ? getObservationSummaries.object[0] : null;

    // Handle Save Electrocardiogram ECG Function
    const handleSave = async () => {
        //TODO convert key to code
        // try {
        //     if (patientObservationSummary.key === undefined) {
        //         //TODO convert key to code
        //         await saveObservationSummary({
        //             observation: {
        //                 ...patientObservationSummary,
        //                 visitKey: encounter.key,
        //                 patientKey: patient.key,
        //                 createdBy: 'Administrator',
        //                 lastDate: new Date(),
        //                 latestbmi: bmi,
        //                 age: firstObservationSummary?.age,
        //                 prevRecordKey: firstObservationSummary?.key || null,
        //                 plastDate: firstObservationSummary?.lastDate || null,
        //                 platesttemperature: firstObservationSummary?.latesttemperature || null,
        //                 platestbpSystolic: firstObservationSummary?.latestbpSystolic || null,
        //                 platestbpDiastolic: firstObservationSummary?.latestbpDiastolic || null,
        //                 platestheartrate: firstObservationSummary?.latestheartrate || null,
        //                 platestrespiratoryrate: firstObservationSummary?.latestrespiratoryrate || null,
        //                 platestoxygensaturation: firstObservationSummary?.latestoxygensaturation || null,
        //                 platestweight: firstObservationSummary?.latestweight || firstObservationSummary?.platestweight,
        //                 platestheight: firstObservationSummary?.latestheight || firstObservationSummary?.platestheight,
        //                 platestheadcircumference: firstObservationSummary?.latestheadcircumference || firstObservationSummary?.platestheadcircumference,
        //                 platestnotes: firstObservationSummary?.latestnotes || '',
        //                 platestpaindescription: firstObservationSummary?.latestpaindescription || '',
        //                 platestpainlevelLkey: firstObservationSummary?.latestpainlevelLkey || '',
        //                 platestbmi: firstObservationSummary?.latestbmi,
        //                 page: firstObservationSummary?.age,
        //             },
        //             listRequest: patientObservationsListRequest
        //         }).unwrap();
        //         dispatch(notify({ msg: 'Patient ECG Added Successfully', sev: 'success' }));
        //         //TODO convert key to code
        //         setElectrocardiogramEcg({ ...newApElectrocardiogramEcg, statusLkey: "9766169155908512" });
        //         setOpen(false);
        //     } else {
        //         await saveElectrocardiogramECG({ ...electrocardiogramEcg, patientKey: patient.key, encounterKey: encounter.key, updatedBy: authSlice.user.key }).unwrap();
        //         setOpen(false);
        //         dispatch(notify({ msg: 'Patient ECG Updated Successfully', sev: 'success' }));
        //     }

        //     await refetch();
        //     handleClearField();

        // } catch (error) {
        //     console.error("Error saving Patient ECG:", error);
        //     dispatch(notify({ msg: 'Failed to save Patient ECG', sev: 'error' }));
        // }
    };

    // Effects 
    useEffect(() => {
        const diastolic = Number(patientObservationSummary.latestbpDiastolic);
        const systolic = Number(patientObservationSummary.latestbpSystolic);


        if (!isNaN(diastolic) && !isNaN(systolic)) {
            const calculatedMap = ((2 * diastolic + systolic) / 3).toFixed(2);
            setMap(calculatedMap);
        }
    }, [patientObservationSummary.latestbpDiastolic, patientObservationSummary.latestbpSystolic]);

    const handleClear = () => {
        setPatientObservationSummary({
            ...newApPatientObservationSummary,
            latestpainlevelLkey: null
        });
    }

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
                                fieldLabel='BP'
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
                                fieldLabel='mmHg'
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
                                rightAddon="Cm"
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
                            rightAddon="Cm"
                            fieldName='latestheadcircumference'
                            disabled={isEncounterStatusClosed}
                            fieldType='number'
                            record={patientObservationSummary}
                            setRecord={setPatientObservationSummary} />
                    </Form>
                );
            case 2:
                return (
                    <></>
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
            steps={[{
                title: "Vital Signs",
                icon: <FontAwesomeIcon icon={faHeartPulse} />,
                footer: <MyButton appearance='ghost' onClick={handleClear} >Clear</MyButton>
            }, {
                title: "Body Measurements",
                icon: <FontAwesomeIcon icon={faChildReaching} />,
                footer: <MyButton appearance='ghost' onClick={handleClear} >Clear</MyButton>
            }]}
            content={content}
        ></MyModal>
    );
};
export default AddEditInpatientObservations;