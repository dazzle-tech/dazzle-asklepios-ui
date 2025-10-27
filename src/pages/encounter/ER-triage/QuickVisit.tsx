import React, { useEffect, useState, useRef } from 'react';
import { Panel, Divider } from 'rsuite';
import PatientSide from '../encounter-main-info-section/PatienSide';
import { useAppDispatch } from '@/hooks';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckDouble } from '@fortawesome/free-solid-svg-icons';
import Translate from '@/components/Translate';
import './styles.less';
import MyButton from '@/components/MyButton/MyButton';
import { useCompleteEncounterMutation } from '@/services/encounterService';
import { useLocation } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { Tabs } from 'rsuite';
import ReactDOMServer from 'react-dom/server';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import BackButton from '@/components/BackButton/BackButton';
import { notify } from '@/utils/uiReducerActions';
import SOAP from '../encounter-component/s.o.a.p';
import Prescription from '../encounter-component/prescription';
import DiagnosticsOrder from '../encounter-component/diagnostics-order';
import BedsideProceduresRequests from '../encounter-component/bedside-procedures-requests';
import { faPrint } from '@fortawesome/free-solid-svg-icons';
import Observations from '../encounter-pre-observations/observations/Observations';
import Allergies from '../encounter-pre-observations/AllergiesNurse';
import Warning from '../encounter-pre-observations/warning';
import PatientHistory from '../encounter-component/patient-history';
import PreviousMeasurements from '../encounter-pre-observations/previous-measurements';
import PatientAttachment from '@/pages/patient/patient-profile/tabs/Attachment';
import EncounterDischarge from '../encounter-component/encounter-discharge/EncounterDischarge';

const QuickVisit = ({ }) => {
    const dispatch = useAppDispatch();
    const location = useLocation();
    const propsData = location.state;
    const navigate = useNavigate();
    const [localEncounter] = useState<any>({ ...propsData.encounter });
    const [isEncounterStatusClosed, setIsEncounterStatusClosed] = useState(false);
    const [readOnly, setReadOnly] = useState(false);
    const [activeKey, setActiveKey] = useState<string | number>('1');
    const [refetchAttachmentList, setRefetchAttachmentList] = useState(false);
    const [completeEncounter] = useCompleteEncounterMutation();
    const [openDischargeModal, setOpenDischargeModal] = useState(false);
    // Page header setup
    const divContent = (
            "Quick Visit"
    );
    dispatch(setPageCode('Quick_Visit'));
    dispatch(setDivContent(divContent));

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
                                        if (localEncounter?.resourceTypeLvalue?.valueCode == "BRT_EMERGENCY") {
                                            navigate('/ER-waiting-list')
                                        } else {
                                            navigate('/encounter-list');
                                        }
                                    }}
                                />
                                <div className="left-buttons-contant">
                                    {/* TODO update status to be a LOV value */}
                                    {!localEncounter.discharge && localEncounter.encounterStatusLkey !== "91109811181900" && (<MyButton
                                        prefixIcon={() => <FontAwesomeIcon icon={faCheckDouble} />}
                                        onClick={()=>localEncounter?.resourceTypeLvalue?.valueCode == "BRT_EMERGENCY" ? setOpenDischargeModal(true) : handleCompleteEncounter()}

                                        appearance="ghost"
                                    >
                                        <Translate>{localEncounter?.resourceTypeLvalue?.valueCode == "BRT_EMERGENCY" ? "Discharge" : "Complete Visit"}</Translate>
                                    </MyButton>)}
                                    <Divider vertical />
                                    <MyButton
                                        prefixIcon={() => <FontAwesomeIcon icon={faPrint} />}
                                        
                                    >
                                        <Translate>Print Visit Report </Translate>
                                    </MyButton>
                                </div>
                            </div>
                            <Tabs activeKey={activeKey} onSelect={setActiveKey} appearance="subtle">
                                <Tabs.Tab eventKey="1" title="Clinical Visit">
                                    <SOAP
                                        edit={propsData.edit}
                                        patient={propsData.patient}
                                        encounter={propsData.encounter} />
                                </Tabs.Tab>
                                <Tabs.Tab eventKey="2" title="Prescription">
                                    <Prescription
                                        edit={propsData.edit}
                                        patient={propsData.patient}
                                        encounter={propsData.encounter}
                                    />
                                </Tabs.Tab>
                                <Tabs.Tab eventKey="3" title="Diagnostics Order">
                                    <DiagnosticsOrder
                                        edit={propsData.edit}
                                        patient={propsData.patient}
                                        encounter={propsData.encounter}
                                    />
                                </Tabs.Tab>
                                <Tabs.Tab eventKey="4" title="Bedside Procedures">
                                    <BedsideProceduresRequests />
                                </Tabs.Tab>
                                <Tabs.Tab eventKey="5" title="Observations">
                                    <Observations
                                        edit={propsData.edit}
                                        ref={obsRef}
                                        patient={propsData.patient}
                                        encounter={propsData.encounter}
                                    />
                                </Tabs.Tab>
                                <Tabs.Tab eventKey="6" title="Allergies">
                                    <Allergies
                                        edit={propsData.edit}
                                        patient={propsData.patient}
                                        encounter={propsData.encounter}
                                    />
                                </Tabs.Tab>
                                <Tabs.Tab eventKey="7" title="Medical Warnings">
                                    <Warning
                                        edit={propsData.edit}
                                        patient={propsData.patient}
                                        encounter={propsData.encounter}
                                    />
                                </Tabs.Tab>
                                <Tabs.Tab eventKey="8" title="Patient History">
                                    <PatientHistory />
                                </Tabs.Tab>
                                <Tabs.Tab eventKey="9" title="Previous Measurements">
                                    <PreviousMeasurements
                                        patient={propsData.patient}
                                    />
                                </Tabs.Tab>
                                <Tabs.Tab eventKey="10" title="Attachments">
                                    <PatientAttachment
                                        localPatient={propsData?.patient}
                                        setRefetchAttachmentList={setRefetchAttachmentList}
                                        refetchAttachmentList={refetchAttachmentList} />
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
                        encounter={propsData.encounter} />
                </div>
            )}
        </>
    );
};

export default QuickVisit;