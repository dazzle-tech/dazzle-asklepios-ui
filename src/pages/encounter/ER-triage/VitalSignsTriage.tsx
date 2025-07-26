
import React, { useEffect, useState } from 'react';
import './styles.less';
import MyButton from '@/components/MyButton/MyButton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckDouble } from '@fortawesome/free-solid-svg-icons';
import Translate from '@/components/Translate';
import { Form } from 'rsuite';
import MyInput from '@/components/MyInput';
import MyLabel from '@/components/MyLabel';
import { Col, Divider, Row, Text } from 'rsuite';
import { faHeartPulse } from "@fortawesome/free-solid-svg-icons";
import { useAppDispatch } from '@/hooks';
import { useGetObservationSummariesQuery, useSaveObservationSummaryMutation } from '@/services/observationService';
import { initialListRequest, ListRequest } from '@/types/types';
import { newApPatientObservationSummary } from '@/types/model-types-constructor';
import { ApPatientObservationSummary } from '@/types/model-types';
import { notify } from '@/utils/uiReducerActions';

const VitalSignsTriage = ({ patient, encounter, setRefetchPatientObservations}) => {
    const dispatch = useAppDispatch();
    const [bmi, setBmi] = useState('');
    const [bsa, setBsa] = useState('');
    const [vital, setVital] = useState({
        bloodPressureSystolic: 0,
        bloodPressureDiastolic: 0,
        heartRate: 0,
        temperature: 0,
        oxygenSaturation: 0,
    });
    const [saveObservationSummary, saveObservationsMutation] = useSaveObservationSummaryMutation();
    const [map, setMap] = useState(null);
    const [isEncounterStatusClosed, setIsEncounterStatusClosed] = useState(false);
    const [readOnly, setReadOnly] = useState(false);

    // Define state for the request used to fetch the patient's last observations list
    const [patientLastVisitObservationsListRequest, setPatientLastVisitObservationsListRequest] =
        useState<ListRequest>({
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

    // Fetch observation summaries using the useGetObservationSummariesQuery hook
    const { data: getObservationSummaries } = useGetObservationSummariesQuery({ ...patientLastVisitObservationsListRequest });

    // Get the last observation summary if available, otherwise set it to null
    const lastObservationSummary = getObservationSummaries?.object?.length > 0 ? getObservationSummaries.object[0] : null;
    const lastencounterop = getObservationSummaries?.object?.length > 0 ? getObservationSummaries?.object?.findLast(item => item.visitKey === encounter?.key) : null;

    const [patientObservationSummary, setPatientObservationSummary] = useState<ApPatientObservationSummary>({
        ...newApPatientObservationSummary,
        latesttemperature: null,
        latestbpSystolic: null,
        latestbpDiastolic: null,
        latestheartrate: null,
        latestrespiratoryrate: null,
        latestoxygensaturation: null,
        latestglucoselevel: null,
        latestweight: null,
        latestheight: null,
        latestheadcircumference: null,
        latestpainlevelLkey: null
    });

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
                latestbpSystolic: vital?.bloodPressureSystolic,
                latestbpDiastolic: vital?.bloodPressureDiastolic,
                latestheartrate: vital?.heartRate,
                latestoxygensaturation: vital?.oxygenSaturation,
                latesttemperature: vital?.temperature,
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
            setRefetchPatientObservations(true);
            dispatch(notify({ msg: 'Saved Successfully', sev: 'success' }));
        } catch (error) {
            console.error('Error while saving observation summary:', error);
            dispatch(notify({ msg: 'Error occurred while saving', sev: 'error' }));
        }
    };
    // Effects
    useEffect(() => {
        console.log(`lastencounterop`, lastencounterop);
        if (lastencounterop) {
            setPatientObservationSummary({
                ...lastencounterop
            });
            console.log(patientObservationSummary.latestbpSystolic)


        }
    }, [lastencounterop])
    useEffect(() => {
        setVital({
            ...vital,
            bloodPressureSystolic: patientObservationSummary.latestbpSystolic || 0,
            bloodPressureDiastolic: patientObservationSummary.latestbpDiastolic || 0,
            heartRate: patientObservationSummary.latestheartrate || 0,
            temperature: patientObservationSummary.latesttemperature || 0,
            oxygenSaturation: patientObservationSummary.latestoxygensaturation || 0,

        })
    }, [patientObservationSummary]);
    useEffect(() => {
        if (saveObservationsMutation && saveObservationsMutation.status === 'fulfilled') {
            setPatientObservationSummary(saveObservationsMutation.data);
        }
    }, [saveObservationsMutation]);
    useEffect(() => {
        // TODO update status to be a LOV value
        if (encounter?.encounterStatusLkey === '91109811181900') {
            setIsEncounterStatusClosed(true);
        }
    }, [encounter?.encounterStatusLkey]);
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
        const diastolic = Number(vital?.bloodPressureDiastolic);
        const systolic = Number(vital?.bloodPressureSystolic);
        if (!isNaN(diastolic) && !isNaN(systolic)) {
            const calculatedMap = ((2 * diastolic + systolic) / 3).toFixed(2);
            setMap(calculatedMap);
        }
    }, [vital?.bloodPressureSystolic, vital?.bloodPressureDiastolic]);
    return (
        <div className='container-form'>
            <div className='title-div'>
                <Text>Vital Signs</Text>
            </div>
            <Divider />
            <Form fluid >
                <Row>
                    <Col md={7}>
                        <MyInput
                            width={300}
                            fieldType="number"
                            fieldName="bloodPressureSystolic"
                            record={vital}
                            setRecord={setVital}
                            inputColor={vital?.bloodPressureSystolic < 90 && vital?.bloodPressureSystolic != 0 ? 'danger' : ''} />
                    </Col>
                    <Col md={1}><div style={{ padding: '5px', paddingTop: '30px' }}>/</div></Col>
                    <Col md={7}>
                        <MyInput
                            width={300}
                            fieldType="number"
                            fieldName="bloodPressureDiastolic"
                            record={vital}
                            setRecord={setVital} />
                    </Col>
                    <Col md={8}>
                        <div className='container-Column'>
                            <MyLabel label="MAP" />
                            <div>
                                <FontAwesomeIcon icon={faHeartPulse} className='my-icon' />
                                <text>{
                                    map
                                }</text></div>
                        </div>
                    </Col>
                </Row>
                <Row>
                    <Col md={8}>
                        <MyInput
                            width={300}
                            fieldType="number"
                            fieldName="heartRate"
                            rightAddon="bpm"
                            rightAddonwidth={45}
                            record={vital}
                            setRecord={setVital}
                            inputColor={(vital?.heartRate < 50 || vital?.heartRate > 120) && vital?.heartRate != 0 ? 'danger' : ''} /></Col>
                    <Col md={8}>
                        <MyInput
                            width={300}
                            fieldType="number"
                            rightAddon="C"
                            fieldName="temperature"
                            record={vital}
                            setRecord={setVital} /></Col>
                </Row>
                <Row>
                    <Col md={8}>
                        <MyInput
                            width={300}
                            fieldType="number"
                            rightAddon=" % "
                            fieldName="oxygenSaturation"
                            record={vital}
                            setRecord={setVital}
                            inputColor={vital?.oxygenSaturation < 92 && vital?.oxygenSaturation != 0 ? 'danger' : ''} /></Col>
                    <Col md={12} >
                        <MyButton
                            prefixIcon={() => <FontAwesomeIcon icon={faCheckDouble} />}
                            className="button-bottom-align-btm"
                            onClick={handleSave}
                        >
                            <Translate>  Save </Translate>
                        </MyButton>
                    </Col>
                </Row>
            </Form>
        </div>
    );
};

export default VitalSignsTriage;