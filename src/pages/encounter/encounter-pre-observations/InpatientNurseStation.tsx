import React, { useEffect, useState, useRef } from 'react';
import { Panel, Divider } from 'rsuite';
import PatientSide from '../encounter-main-info-section/PatienSide';
import { useAppDispatch } from '@/hooks';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckDouble } from '@fortawesome/free-solid-svg-icons';
import Translate from '@/components/Translate';
import Allergies from './AllergiesNurse';
import { Check } from '@rsuite/icons';
import BlockIcon from '@rsuite/icons/Block';
import Warning from './warning';
import './styles.less';
import MyButton from '@/components/MyButton/MyButton';
import { useCompleteEncounterMutation } from '@/services/encounterService';
import { useLocation } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { Tabs } from 'rsuite';
import ReactDOMServer from 'react-dom/server';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import BackButton from '@/components/BackButton/BackButton';
import PatientHistory from '../encounter-component/patient-history';
import { notify } from '@/utils/uiReducerActions';
import PatientAttachment from '@/pages/patient/patient-profile/tabs/Attachment';
import InpatientObservations from './observations/InpatientObservations';
import PainAssessment from '../encounter-component/pain-assessment/PainAssessment';
import ReviewOfSystems from '../medical-notes-and-assessments/review-of-systems';
import ChiefComplain from '../encounter-component/chief-complain/ChiefComplain';
import GeneralAssessment from '../encounter-component/general-assessment';
import MedicationReconciliation from '../encounter-component/MedicationReconciliation/MedicationReconciliation';
import FunctionalAssessment from '../encounter-component/functional-assessment';
import Repositioning from '../encounter-component/repositioning';
import Encounter from '../encounter-screen';
import EncounterDischarge from '../encounter-component/encounter-discharge/EncounterDischarge';
const InpatientNurseStation = ({ }) => {
    const dispatch = useAppDispatch();
    const location = useLocation();
    const propsData = location.state;
    const navigate = useNavigate();
    const [localEncounter] = useState<any>({ ...propsData.encounter });
    const [isEncounterStatusClosed, setIsEncounterStatusClosed] = useState(false);
    const [readOnly, setReadOnly] = useState(false);
    const [activeKey, setActiveKey] = useState<string | number>('1');
    const [completeEncounter] = useCompleteEncounterMutation();
    const [openDischargeModal, setOpenDischargeModal] = useState(false);
    const [refetchAttachmentList, setRefetchAttachmentList] = useState(false);
    // Page header setup
    const divContent = (
        <div style={{ display: 'flex' }}>
            <h5>Nurse Anamnesis</h5>
        </div>
    );
    const divContentHTML = ReactDOMServer.renderToStaticMarkup(divContent);
    dispatch(setPageCode('Nurse_Station'));
    dispatch(setDivContent(divContentHTML));

    const handleCompleteEncounter = async () => {
        try {
             if (localEncounter) {
                await completeEncounter(localEncounter).unwrap();
                dispatch(notify({ msg: 'Completed Successfully', sev: 'success' }));
            }
            setReadOnly(true);
        } catch (error) {
            console.error("Encounter completion error:", error);
            dispatch(notify({ msg: 'An error occurred while completing the encounter', sev: 'error' }));
        }
    };


    // Effects
    useEffect(() => {

        return () => {
            dispatch(setPageCode(''));
            dispatch(setDivContent('  '));
        };
    }, [location.pathname, dispatch]);
    useEffect(() => {
        // TODO update status to be a LOV value
        if (localEncounter?.encounterStatusLkey === '91109811181900') {
            setIsEncounterStatusClosed(true);
        }
    }, [localEncounter?.encounterStatusLkey]);

    const obsRef = useRef(null);
    const handleSaveObsarvationClick = () => {
        obsRef.current?.handleSave();
    };
    const handleClearObsarvationClick = () => {
        obsRef.current?.handleClear();
    };
    return (
        <>
            {propsData?.patient && propsData?.encounter && (
                <div className="main-box ">
                    <div className="left-box">
                        <Panel>
                            <div className="left-buttons-container">
                                <BackButton
                                    onClick={() => {
                                        if (localEncounter?.resourceTypeLvalue?.valueCode == "BRT_INPATIENT") {
                                            navigate('/inpatient-encounters-list')
                                        } else {
                                            navigate('/encounter-list');
                                        }
                                    }}
                                />
                                <div className="left-buttons-contant">
                                    {/* TODO update status to be a LOV value */}
                                    {!localEncounter.discharge && localEncounter.encounterStatusLkey !== "91109811181900" && (<MyButton
                                        prefixIcon={() => <FontAwesomeIcon icon={faCheckDouble} />}
                                        onClick={()=>localEncounter?.resourceTypeLvalue?.valueCode == "BRT_INPATIENT" ? setOpenDischargeModal(true) : handleCompleteEncounter()}
                                        appearance="ghost"
                                    >
                                        <Translate>{localEncounter?.resourceTypeLvalue?.valueCode == "BRT_INPATIENT" ? "Discharge" : "Complete Visit"}</Translate>
                                    </MyButton>)}
                                    {activeKey == '1' && <Divider vertical />}
                                    {activeKey == '1' && (
                                        <MyButton
                                            appearance="ghost"
                                            onClick={handleClearObsarvationClick}
                                            prefixIcon={() => <BlockIcon />}
                                        >
                                            Clear
                                        </MyButton>
                                    )}
                                    {activeKey == '1' && (
                                        <MyButton prefixIcon={() => <Check />} onClick={handleSaveObsarvationClick}>
                                            Save
                                        </MyButton>
                                    )}
                                </div>
                            </div>
                            <Tabs activeKey={activeKey} onSelect={setActiveKey} appearance="subtle">
                                <Tabs.Tab eventKey="1" title="Observations">
                                    <InpatientObservations
                                        editable={propsData.edit}
                                        localPatient={propsData.patient}
                                        localEncounter={propsData.encounter}
                                    />
                                </Tabs.Tab>
                                <Tabs.Tab eventKey="2" title="Allergies">
                                    <Allergies
                                        edit={propsData.edit}
                                        patient={propsData.patient}
                                        encounter={propsData.encounter}
                                    />
                                </Tabs.Tab>
                                <Tabs.Tab eventKey="3" title="Medical Warnings">
                                    <Warning
                                        edit={propsData.edit}
                                        patient={propsData.patient}
                                        encounter={propsData.encounter}
                                    />
                                </Tabs.Tab>
                                <Tabs.Tab eventKey="4" title="Patient History">
                                    <PatientHistory />
                                </Tabs.Tab>
                                <Tabs.Tab eventKey="5" title="Attachments">
                                    <PatientAttachment
                                        localPatient={propsData?.patient}
                                        setRefetchAttachmentList={setRefetchAttachmentList}
                                        refetchAttachmentList={refetchAttachmentList} />
                                </Tabs.Tab>
                                <Tabs.Tab eventKey="6" title="Chief Complain">
                                    <ChiefComplain
                                        edit={propsData.edit}
                                        patient={propsData.patient}
                                        encounter={propsData.encounter} />
                                </Tabs.Tab>
                                <Tabs.Tab eventKey="7" title="Physical Examination">
                                     <ReviewOfSystems 
                                       edit={propsData.edit}
                                        patient={propsData.patient}
                                        encounter={propsData.encounter} />
                                </Tabs.Tab>
                                 <Tabs.Tab eventKey="8" title="Pain Assessment">
                                    <PainAssessment
                                        edit={propsData.edit}
                                        patient={propsData.patient}
                                        encounter={propsData.encounter} />
                                </Tabs.Tab>
                                <Tabs.Tab eventKey="9" title="General Assessment">
                                    <GeneralAssessment
                                        edit={propsData.edit}
                                        patient={propsData.patient}
                                        encounter={propsData.encounter} />
                                </Tabs.Tab>
                                <Tabs.Tab eventKey="10" title="Functional Assessment">
                                  <FunctionalAssessment
                                        edit={propsData.edit}
                                        patient={propsData.patient}
                                        encounter={propsData.encounter} />  
                                </Tabs.Tab>
                                    <Tabs.Tab eventKey="11" title="Repositioning">
                                  <Repositioning
                                        edit={propsData.edit}
                                        patient={propsData.patient}
                                        encounter={propsData.encounter} />  
                                </Tabs.Tab>
                                <Tabs.Tab eventKey="12" title="Medication Reconciliation">
                                     <MedicationReconciliation
                                        edit={propsData.edit}
                                        patient={propsData.patient}
                                        encounter={propsData.encounter} />
                                </Tabs.Tab>
                                <Tabs.Tab eventKey="13" title="Physician Order Summary">

                                </Tabs.Tab>
                        
                            </Tabs>
                        </Panel>
                    </div>
                    <div className="right-box">
                        <PatientSide patient={propsData.patient} encounter={propsData.encounter} />
                    </div>
                    <EncounterDischarge
                        open={openDischargeModal}
                        setOpen={setOpenDischargeModal}
                        encounter={propsData.encounter}/>
                </div>
            )}
        </>
    );
};

export default InpatientNurseStation;