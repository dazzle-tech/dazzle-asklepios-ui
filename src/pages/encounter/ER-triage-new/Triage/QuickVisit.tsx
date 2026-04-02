import React, { useEffect, useState, useRef } from 'react';
import { Panel, Divider } from 'rsuite';
import PatientSide from '../../encounter-main-info-section/PatienSide';
import { useAppDispatch } from '@/hooks';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckDouble } from '@fortawesome/free-solid-svg-icons';
import Translate from '@/components/Translate';
import '../styles.less';
import MyButton from '@/components/MyButton/MyButton';
import { useCompleteEncounterMutation } from '@/services/encounters/patientEncounterService';
import { useLocation } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { Tabs } from 'rsuite';
import ReactDOMServer from 'react-dom/server';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import BackButton from '@/components/BackButton/BackButton';
import { notify } from '@/utils/uiReducerActions';
import SOAP from '../../encounter-component/s.o.a.p';
import PrescriptionNew from '../../encounter-component/prescription-new';
import DiagnosticsOrderNew from '../../encounter-component/diagnostics-order-new';
import BedsideProceduresRequests from '../../encounter-component/bedside-procedures-requests';
import { faPrint } from '@fortawesome/free-solid-svg-icons';
import Observations from '../../encounter-pre-observations-new/observations/Observations';
import Allergies from '../../encounter-pre-observations-new/AllergiesNurse';
import Warning from '../../encounter-pre-observations-new/warning';
import PatientHistory from '../../encounter-component/patient-history';
import PreviousMeasurements from '../../encounter-pre-observations-new/previous-measurements';
import PatientAttachment from '@/pages/patient/patient-profile/tabs/Attachment-new/PatientAttachment';
import EncounterDischarge from '../../encounter-component/encounter-discharge/EncounterDischarge';

const QuickVisit = () => {
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
                const id = (localEncounter as any)?.id ?? (localEncounter as any)?.key ?? null;
                if (!id) throw new Error('Missing encounter id');
                await completeEncounter({ id } as any).unwrap();
                dispatch(notify({ msg: 'Completed Successfully', sev: 'success' }));
            }
            setReadOnly(true);
        } catch (err: any) {
            const errorMap: Record<string, string> = {
                'error.complete.notAllowed': 'Cannot complete unless status is ONGOING or TRIAGE STARTED',
                'error.id.notfound': 'Encounter not found'
            };

            const backendMessage = err?.data?.message;
            const msg = errorMap[backendMessage] || 'Error completing encounter';

            dispatch(notify({ msg, sev: 'error' }));
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
        if (String((localEncounter as any)?.status ?? (localEncounter as any)?.encounterStatus ?? '').toUpperCase() === 'CLOSED') {
            setIsEncounterStatusClosed(true);
        }
    }, [localEncounter]);
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
                                        if (localEncounter?.encounterType == "EMERGENCY") {
                                            navigate(-1)
                                        } else {
                                            navigate('/encounter-list');
                                        }
                                    }}
                                />
                                <div className="left-buttons-contant">
                                    {/* TODO update status to be a LOV value */}
                                    {!localEncounter.discharge && String((localEncounter as any)?.status ?? (localEncounter as any)?.encounterStatus ?? '').toUpperCase() !== "CLOSED" && (<MyButton
                                        prefixIcon={() => <FontAwesomeIcon icon={faCheckDouble} />}
                                        onClick={() => localEncounter?.encounterType == "EMERGENCY" ? setOpenDischargeModal(true) : handleCompleteEncounter()}

                                        appearance="ghost"
                                    >
                                        <Translate>{localEncounter?.encounterType == "EMERGENCY" ? "Discharge" : "Complete Visit"}</Translate>
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
                                    <PrescriptionNew
                                        edit={propsData.edit}
                                        patient={propsData.patient}
                                        encounter={propsData.encounter}
                                    />
                                </Tabs.Tab>
                                <Tabs.Tab eventKey="3" title="Diagnostics Order">
                                    <DiagnosticsOrderNew
                                        edit={propsData.edit}
                                        patient={propsData.patient}
                                        encounter={propsData.encounter}
                                    />
                                </Tabs.Tab>
                                {/* <Tabs.Tab eventKey="4" title="Bedside Procedures">
                                    <BedsideProceduresRequests />
                                </Tabs.Tab> */}
                                <Tabs.Tab eventKey="4" title="Observations">
                                    <Observations
                                        edit={propsData.edit}
                                        ref={obsRef}
                                        patient={propsData.patient}
                                        encounter={propsData.encounter}
                                    />
                                </Tabs.Tab>
                                <Tabs.Tab eventKey="5" title="Allergies">
                                    <Allergies
                                        edit={propsData.edit}
                                        patient={propsData.patient}
                                        encounter={propsData.encounter}
                                    />
                                </Tabs.Tab>
                                <Tabs.Tab eventKey="6" title="Medical Warnings">
                                    <Warning
                                        edit={propsData.edit}
                                        patient={propsData.patient}
                                        encounter={propsData.encounter}
                                    />
                                </Tabs.Tab>
                                <Tabs.Tab eventKey="7" title="Patient History">
                                    <PatientHistory {...({} as any)} />
                                </Tabs.Tab>
                                <Tabs.Tab eventKey="8" title="Previous Measurements">
                                    <PreviousMeasurements
                                        patient={propsData.patient}
                                    />
                                </Tabs.Tab>
                                <Tabs.Tab eventKey="9" title="Attachments">
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