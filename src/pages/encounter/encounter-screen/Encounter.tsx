import BackButton from '@/components/BackButton/BackButton';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import { MedicalSheets } from '@/config/modules-config';
import { useAppDispatch, useAppSelector } from '@/hooks';
import FollowupAppointmentModal from '@/pages/Scheduling/scheduling-screen/FollowupAppointmentModal';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
// import { useGetResourcesByResourceIdQuery } from '@/services/appointmentService';
import { useCompleteEncounterMutation } from '@/services/encounters/patientEncounterService';
import { useGetMedicalSheetsByDepartmentQuery } from '@/services/MedicalSheetsService';
import { useGetPatientByIdQuery } from '@/services/patient/patientService';
import { notify } from '@/utils/uiReducerActions';
import {
  faChartLine,
  faCheckDouble,
  faClockRotateLeft,
  faDesktop,
  faRobot,
  faUserPlus
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useEffect, useRef, useState } from 'react';
import { FaSearch } from 'react-icons/fa';
import { FaArrowLeft } from 'react-icons/fa6';
import { useSelector } from 'react-redux';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import 'react-tabs/style/react-tabs.css';
import { Col, Divider, Drawer, Form, List, Panel, Row, Tooltip, Whisper } from 'rsuite';
import EncounterDischarge from '../encounter-component/encounter-discharge/EncounterDischarge';
import { ActionContext } from '../encounter-component/patient-summary/ActionContext';
import ConsultationPopup from '../encounter-component/patient-summary/ConsultationPopup';
import PatientSide from '../encounter-main-info-section/PatienSide';
import AdmitToInpatientModal from './AdmitToInpatientModal';
import AllergiesModal from './AllergiesModal';
import SideSummaryScreen from './SideSummaryScreen';
import './styles.less';
import WarningiesModal from './WarningiesModal';
import PatientHistorySummaryModal from '../encounter-component/patient-history/MedicalHistory/PatientHistorySummaryModal';
import AiAssistantPopup from './AiAssistantPopup';
import { useLazyExistsPatientDiagnosisByEncounterIdQuery } from '@/services/medicalsheetsEncounter/clinicalVisit/patientDiagnosisService';

const Encounter = () => {
  const mode = useSelector((state: any) => state.ui.mode);
  const [action, setAction] = useState(() => () => { });

  const authSlice = useAppSelector(state => state.auth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const propsData = location.state;

  const isMedicalHistoryTab = location.pathname.includes('/encounter/patient-history');

  const encounterId = propsData?.encounter?.id;
  const [checkDiagnosisExists, { isFetching: isCheckingPatientDiagnosis }] =
    useLazyExistsPatientDiagnosisByEncounterIdQuery();

  const patientIdToFetch =
    (propsData?.patient as any)?.id ??
    (propsData?.patient as any)?.key ??
    (propsData?.patient as any)?.patientId ??
    null;

  const shouldFetchPatient =
    patientIdToFetch != null &&
    String(patientIdToFetch).trim() !== '' &&
    String(patientIdToFetch) !== 'undefined';

  const { data: fetchedPatient } = useGetPatientByIdQuery(
    { id: patientIdToFetch as any },
    {
      skip: !shouldFetchPatient
    }
  );

  const patientToSend = fetchedPatient ?? propsData?.patient;

  const savedState = sessionStorage.getItem('encounterPageSource');
  const [localEncounter, setLocalEncounter] = useState<any>({ ...propsData?.encounter });
  const [searchTerm, setSearchTerm] = useState({ term: '' });
  const [openAdmitModal, setOpenAdmitModal] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [showAppointmentOnly, setShowAppointmentOnly] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [selectedResourceType, setSelectedResourceType] = useState(null);
  const [openDischargeModal, setOpenDischargeModal] = useState(false);
  const [edit, setEdit] = useState(false);
  const [fromPage, setFromPage] = useState(savedState);
  const [patientSideRefreshKey, setPatientSideRefreshKey] = useState(0);

  const handlePatientDiagnosisSaved = () => {
    setPatientSideRefreshKey(prev => prev + 1);
  };

  const [openConsultationPopup, setOpenConsultationPopup] = useState<boolean>(false);
  const [buttonPosition, setButtonPosition] = useState({
    x: typeof window !== 'undefined' ? window.innerWidth - 100 : 100,
    y: typeof window !== 'undefined' ? window.innerHeight - 100 : 100
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [hasMoved, setHasMoved] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);

  const [openAiPopup, setOpenAiPopup] = useState<boolean>(false);

  const [aiButtonPosition, setAiButtonPosition] = useState({
    x: typeof window !== 'undefined' ? window.innerWidth - 180 : 180,
    y: typeof window !== 'undefined' ? window.innerHeight - 100 : 100
  });

  const [isAiDragging, setIsAiDragging] = useState(false);
  const [aiDragOffset, setAiDragOffset] = useState({ x: 0, y: 0 });
  const [aiHasMoved, setAiHasMoved] = useState(false);

  const aiButtonRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = e => {
    setIsDragging(true);
    setHasMoved(false);
    setDragOffset({
      x: e.clientX - buttonPosition.x,
      y: e.clientY - buttonPosition.y
    });
    e.preventDefault();
  };

  const handleMouseMove = e => {
    if (!isDragging) return;

    if (!hasMoved) {
      const movedDistance = Math.sqrt(
        Math.pow(e.clientX - (buttonPosition.x + dragOffset.x), 2) +
        Math.pow(e.clientY - (buttonPosition.y + dragOffset.y), 2)
      );

      if (movedDistance > 5) {
        setHasMoved(true);
      }
    }

    setButtonPosition({
      x: e.clientX - dragOffset.x,
      y: e.clientY - dragOffset.y
    });
  };

  const handleMouseUp = () => {
    if (!hasMoved && !isDragging) {
      setOpenConsultationPopup(true);
    }

    setIsDragging(false);
  };

  const handleClick = () => {
    if (!hasMoved && !isDragging) {
      setOpenConsultationPopup(true);
    }
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset, hasMoved]);

  const departmentKeyToUse = localEncounter?.departmentId;

  const { data: departmentSheets = [] } = useGetMedicalSheetsByDepartmentQuery(departmentKeyToUse);

  const [completeEncounter, completeEncounterMutation] = useCompleteEncounterMutation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [openAllargyModal, setOpenAllargyModal] = useState(false);
  const [openWarningModal, setOpenWarningModal] = useState(false);

  useEffect(() => {
    if (location.state && location.state.fromPage) {
      setFromPage(location.state.fromPage);
    }
  }, [location.state]);

  useEffect(() => {
    if (
      localEncounter?.encounterType == 'INPATIENT' &&
      completeEncounterMutation.status === 'fulfilled'
    ) {
      navigate('/inpatient-encounters-list');
    } else if (completeEncounterMutation.status === 'fulfilled') {
      navigate('/encounter-list');
    }
  }, [completeEncounterMutation]);

  const handleGoBack = () => {
    if (savedState === 'PatientEMR') {
      navigate('/patient-EMR', {
        state: {
          localPatient: propsData.patient,
          fromPage: 'clinicalVisit'
        }
      });
    } else if (localEncounter?.encounterType == 'INPATIENT') {
      navigate('/inpatient-encounters-list');
    } else if (propsData?.fromPage === 'DayCaseList') {
      navigate('/day-case-list');
    } else if (propsData?.fromPage === 'ER_Department') {
      navigate('/ER-department');
    } else {
      navigate('/encounter-list');
    }
  };

  const followUpDraftAppointmentData = React.useMemo(() => {
    if (!patientToSend) return null;
    return {
      patientId: (patientToSend as any)?.id ?? (patientToSend as any)?.key ?? null
    };
  }, [patientToSend]);

  const handleCompleteEncounter = async () => {
    try {
      if (propsData.encounter) {
        await completeEncounter({ id: propsData.encounter.id }).unwrap();
        dispatch(notify({ msg: 'Completed Successfully', sev: 'success' }));
      }
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

  const handleAiMouseDown = (e: any) => {
    setIsAiDragging(true);
    setAiHasMoved(false);
    setAiDragOffset({
      x: e.clientX - aiButtonPosition.x,
      y: e.clientY - aiButtonPosition.y
    });
    e.preventDefault();
  };

  const handleAiMouseMove = (e: any) => {
    if (!isAiDragging) return;

    if (!aiHasMoved) {
      const movedDistance = Math.sqrt(
        Math.pow(e.clientX - (aiButtonPosition.x + aiDragOffset.x), 2) +
        Math.pow(e.clientY - (aiButtonPosition.y + aiDragOffset.y), 2)
      );

      if (movedDistance > 5) setAiHasMoved(true);
    }

    setAiButtonPosition({
      x: e.clientX - aiDragOffset.x,
      y: e.clientY - aiDragOffset.y
    });
  };

  const handleAiMouseUp = () => {
    if (!aiHasMoved && !isAiDragging) {
      setOpenAiPopup(true);
    }
    setIsAiDragging(false);
  };

  const handleAiClick = () => {
    if (!aiHasMoved && !isAiDragging) {
      setOpenAiPopup(true);
    }
  };

  const allowedSheetCodes = React.useMemo(
    () => new Set((departmentSheets ?? []).map((s: any) => s.medicalSheet)),
    [departmentSheets]
  );

  const visibleSheets = React.useMemo(() => {
    return MedicalSheets.filter(ms => allowedSheetCodes.has(ms.code)).filter(ms =>
      ms.name.toLowerCase().includes(searchTerm.term.toLowerCase())
    );
  }, [allowedSheetCodes, searchTerm.term]);

  const headersMap = React.useMemo(() => {
    const map: Record<string, string> = {};

    MedicalSheets.forEach(ms => {
      const fullPath = ms.path.startsWith('/encounter')
        ? ms.path
        : `/encounter${ms.path.startsWith('/') ? ms.path : `/${ms.path}`}`;

      map[fullPath] = ms.name;
    });

    return map;
  }, []);

  const [currentHeader, setCurrentHeader] = useState<string>('Patient Dashboard');

  const divContent = `Patient Visit > ${currentHeader}`;
  useEffect(() => {
    dispatch(setPageCode('Patient_Visit'));
    dispatch(setDivContent(divContent));
  }, [currentHeader, dispatch]);

  useEffect(() => {
    setCurrentHeader(headersMap[location.pathname] || 'Patient Dashboard');
  }, [location.pathname, headersMap]);

  const [expand, setExpand] = useState(false);
  const [windowHeight, setWindowHeight] = useState(window.innerHeight);

  useEffect(() => {
    const handleResize = () => {
      setWindowHeight(window.innerHeight);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isAiDragging) {
      document.addEventListener('mousemove', handleAiMouseMove);
      document.addEventListener('mouseup', handleAiMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleAiMouseMove);
        document.removeEventListener('mouseup', handleAiMouseUp);
      };
    }
  }, [isAiDragging, aiDragOffset, aiHasMoved, aiButtonPosition]);

  const selectedDeptId = useAppSelector(s => s.auth.selectedDepartment?.departmentId);

  useEffect(() => {
    if (!location.pathname.includes('/encounter')) return;

    const encounterDeptId = propsData?.encounter?.departmentId;

    if (!propsData?.encounter || !encounterDeptId || encounterDeptId !== selectedDeptId) {
      navigate('/encounter-list', { replace: true });
    }
  }, [selectedDeptId, propsData?.encounter]);

  return (
    <ActionContext.Provider value={{ action, setAction }}>
      <div className="container">
        <div
          ref={buttonRef}
          className={`draggable-container ${isDragging ? 'grabbing' : 'grab'}`}
          style={{ left: `${buttonPosition.x}px`, top: `${buttonPosition.y}px` }}
          onMouseDown={handleMouseDown}
          onClick={handleClick}
        >
          <button
            className={`my-button draggable-button ${isDragging ? 'dragging' : ''}`}
            title="Drag to move or click to open consultation"
          >
            <FontAwesomeIcon icon={faDesktop} />
          </button>

          {!isDragging && <div className="draggable-pulse" />}
        </div>

        <div
          ref={buttonRef}
          className={`draggable-container ${isDragging ? 'grabbing' : 'grab'}`}
          style={{ left: `${buttonPosition.x}px`, top: `${buttonPosition.y}px` }}
          onMouseDown={handleMouseDown}
          onClick={handleClick}
        >
          <button
            className={`my-button draggable-button ${isDragging ? 'dragging' : ''}`}
            title="Drag to move or click to open consultation"
          >
            <FontAwesomeIcon icon={faDesktop} />
          </button>

          {!isDragging && <div className="draggable-pulse" />}
        </div>

        <div
          ref={aiButtonRef}
          className={`draggable-container ${isAiDragging ? 'grabbing' : 'grab'}`}
          style={{ left: `${aiButtonPosition.x}px`, top: `${aiButtonPosition.y}px` }}
          onMouseDown={handleAiMouseDown}
          onClick={handleAiClick}
        >
          <button
            type="button"
            className={`my-button draggable-button ai-icon-btn ${isAiDragging ? 'dragging' : ''}`}
            title="AI Assistant"
          >
            <FontAwesomeIcon icon={faRobot} />
            <span className="ai-badge-2">AI</span>
          </button>

          {!isAiDragging && <div className="draggable-pulse" />}
        </div>

        <div className="left-box">
          <Panel>
            <div className="container-bt">
              <div className="left">
                <BackButton onClick={handleGoBack} text="To Patients list" />
                <MyButton
                  backgroundColor={'var(--primary-gray)'}
                  onClick={() => navigate(-1)}
                  prefixIcon={() => <FaArrowLeft />}
                />
                <Form fluid>
                  <MyInput
                    width="100%"
                    placeholder="Medical Sheets"
                    fieldName={'term'}
                    record={searchTerm}
                    setRecord={setSearchTerm}
                    showLabel={false}
                    enterClick={() => setIsDrawerOpen(true)}
                    rightAddon={
                      <FaSearch
                        className="icons-style-2"
                        onClick={() => {
                          setIsDrawerOpen(true);
                        }}
                      />
                    }
                  />
                </Form>
              </div>
              <div className="right">
                {isMedicalHistoryTab && (
                  <MyButton
                    disabled={edit}
                    onClick={() => {
                      setSummaryModalOpen(true);
                    }}
                  >
                    patient summary
                  </MyButton>
                )}

                <MyButton
                  disabled={edit}
                  prefixIcon={() => <FontAwesomeIcon icon={faUserPlus} />}
                  onClick={() => {
                    setModalOpen(true);
                  }}
                >
                  Create Follow-up
                </MyButton>

                <MyButton
                  prefixIcon={() => <FontAwesomeIcon icon={faCheckDouble} />}
                  onClick={async () => {
                    try {
                      if (localEncounter?.encounterType === 'EMERGENCY') {
                        setOpenDischargeModal(true);
                        return;
                      }

                      if (!encounterId) {
                        dispatch(
                          notify({
                            msg: 'Encounter not found',
                            sev: 'error'
                          })
                        );
                        return;
                      }

                      const exists = await checkDiagnosisExists({ encounterId }).unwrap();

                      if (!exists) {
                        dispatch(
                          notify({
                            msg: 'Please add patient diagnosis before completing the visit',
                            sev: 'warning'
                          })
                        );
                        return;
                      }

                      handleCompleteEncounter();
                    } catch (error) {
                      console.error('Diagnosis check error:', error);
                      dispatch(
                        notify({
                          msg: 'Failed to validate patient diagnosis',
                          sev: 'error'
                        })
                      );
                    }
                  }}
                  disabled={
                    localEncounter?.encounterType !== 'EMERGENCY' &&
                    (!encounterId || isCheckingPatientDiagnosis)
                  }
                  appearance="ghost"
                >
                  <Translate>
                    {localEncounter?.encounterType === 'EMERGENCY' ? 'Discharge' : 'Complete Visit'}
                  </Translate>
                </MyButton>

                {location.pathname == '/encounter' && (
                  <MyButton
                    prefixIcon={() => (
                      <Whisper
                        trigger="hover"
                        placement="top"
                        speaker={<Tooltip>Customize Dashboard</Tooltip>}
                      >
                        <FontAwesomeIcon icon={faChartLine} />
                      </Whisper>
                    )}
                    onClick={action}
                    backgroundColor="#8360BF"
                  />
                )}

                {location.pathname !== '/encounter' && (
                  <MyButton
                    prefixIcon={() => (
                      <Whisper trigger="hover" placement="top" speaker={<Tooltip>Summary</Tooltip>}>
                        <FontAwesomeIcon icon={faChartLine} />
                      </Whisper>
                    )}
                    onClick={() => setExpand(!expand)}
                    backgroundColor="#8360BF"
                  />
                )}
              </div>
            </div>
            <Divider />

            <Drawer
              open={isDrawerOpen}
              onClose={() => setIsDrawerOpen(false)}
              placement="left"
              style={{ zIndex: 999999999999 }}
              className={`drawer-style ${mode === 'light' ? 'light' : 'dark'}`}
            >
              <Drawer.Header className="header-drawer">
                <Drawer.Title className="title-drawer">Medical Sheets</Drawer.Title>
              </Drawer.Header>
              <Drawer.Body className="drawer-body">
                <Form fluid>
                  <Row>
                    <Col md={24}>
                      <MyInput
                        width="100%"
                        placeholder="Search screens..."
                        fieldName={'term'}
                        record={searchTerm}
                        setRecord={setSearchTerm}
                        showLabel={false}
                        rightAddon={<FaSearch style={{ color: 'var(--primary-gray)' }} />}
                      />
                    </Col>
                  </Row>
                </Form>

                <List hover className="drawer-list-style">
                  <List.Item
                    className="drawer-item return-button"
                    onClick={() => {
                      const basePath = location.pathname.split('/').slice(0, -1).join('/');
                      navigate(basePath, { state: location.state });
                      setIsDrawerOpen(false);
                    }}
                  >
                    <FontAwesomeIcon icon={faClockRotateLeft} className="icon" />
                    <Translate>Dashboard</Translate>
                  </List.Item>
                  {visibleSheets.map(({ code, name, icon, path }) => {
                    const fullPath = `/encounter${path.startsWith('/') ? path : `/${path}`}`;

                    return (
                      <List.Item
                        key={code}
                        className="drawer-item"
                        onClick={() => {
                          setIsDrawerOpen(false);
                          navigate(fullPath, {
                            state: {
                              patient: propsData.patient,
                              encounter: propsData.encounter,
                              edit
                            }
                          });
                        }}
                      >
                        <Link
                          to={fullPath}
                          state={{
                            patient: propsData.patient,
                            encounter: propsData.encounter,
                            edit
                          }}
                          className="inherit-link"
                        >
                          {icon}
                          <span className="margin-left-10">
                            <Translate>{name}</Translate>
                          </span>
                        </Link>
                      </List.Item>
                    );
                  })}
                </List>
              </Drawer.Body>
            </Drawer>

            <div className="content-with-sticky">
              <div className="main-content-area">
                <Outlet
                  context={{
                    patient: propsData?.patient,
                    encounter: propsData?.encounter,
                    edit,
                    setLocalEncounter,
                    onDiagnosisSaved: handlePatientDiagnosisSaved
                  }}
                />
              </div>

              {expand && (
                <div className="sticky-sidebar-area">
                  <SideSummaryScreen
                    expand={expand}
                    setExpand={setExpand}
                    windowHeight={windowHeight}
                    patient={propsData.patient}
                    encounter={propsData.encounter}
                  />
                </div>
              )}
            </div>
          </Panel>
        </div>

        <div className="right-box">
          <PatientSide
            patient={propsData?.patient}
            encounter={propsData?.encounter}
            edit={edit}
            refetchList={patientSideRefreshKey}
          />
        </div>
      </div>

      <AllergiesModal
        open={openAllargyModal}
        setOpen={setOpenAllargyModal}
        patient={propsData?.patien}
      />

      <WarningiesModal
        open={openWarningModal}
        setOpen={setOpenWarningModal}
        patient={propsData?.patient}
      />

      <AdmitToInpatientModal
        open={openAdmitModal}
        setOpen={setOpenAdmitModal}
        encounter={propsData?.encounter}
      />

      <FollowupAppointmentModal
        from={'Encounter'}
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false), setShowAppointmentOnly(false);
        }}
        patient={patientToSend}
        appointmentData={followUpDraftAppointmentData}
        resourceType={selectedResourceType}
        facility={selectedFacility}
        onSave={() => { }}
        showOnly={showAppointmentOnly}
        selectedSlot={undefined}
      />

      <PatientHistorySummaryModal
        patient={propsData?.patient}
        encounter={propsData?.encounter}
        edit={edit}
        open={summaryModalOpen}
        setOpen={setSummaryModalOpen}
      />

      <EncounterDischarge
        open={openDischargeModal}
        setOpen={setOpenDischargeModal}
        encounter={propsData?.encounter}
      />

      <ConsultationPopup
        open={openConsultationPopup}
        setOpen={() => setOpenConsultationPopup(false)}
        patient={propsData?.patient}
        encounter={propsData?.encounter}
      />

      <AiAssistantPopup
        open={openAiPopup}
        setOpen={setOpenAiPopup}
        patient={propsData?.patient}
        encounter={propsData?.encounter}
      />
    </ActionContext.Provider>
  );
};

export default Encounter;