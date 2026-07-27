import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Col, Divider, Drawer, Form, List, Panel, Row } from 'rsuite';

import BackButton from '@/components/BackButton/BackButton';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import PatientSide from '../encounter-main-info-section/PatienSide';

import { faArrowLeft, faCheckDouble, faClockRotateLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { FaSearch } from 'react-icons/fa';

import { useAppDispatch } from '@/hooks';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { hideSystemLoader, notify, showSystemLoader } from '@/utils/uiReducerActions';

import { MedicalSheets } from '@/config/modules-config';
import { useCompleteEncounterMutation } from '@/services/encounters/patientEncounterService';
import { useGetNurseMedicalSheetsByDepartmentQuery } from '@/services/MedicalSheetsService';

import clsx from 'clsx';
import NurseSummeryReportButton from './NurseSummeryReportButton';
import './styles.less';

type NurseStationModalProps = {
  patient?: any;
  encounter?: any;
  onSheetNavigate?: (relativePath: string) => void;
  outletContent?: React.ReactNode;
};

const NurseStation = ({
  patient: modalPatient,
  encounter: modalEncounter,
  onSheetNavigate,
  outletContent
}: NurseStationModalProps = {}) => {
  const inModal = !!(modalPatient || modalEncounter);
  const mode = useSelector((state: any) => state.ui.mode);

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const propsData = inModal
    ? { patient: modalPatient, encounter: modalEncounter, fromPage: 'PatientEMR', viewMode: 'readOnly' }
    : location.state;
  const fromPage = propsData?.fromPage;
  const pageSource = fromPage || '';

  const [localEncounter, setLocalEncounter] = useState<any>({
    ...propsData?.encounter
  });

  const viewMode = propsData?.viewMode;
  const isFromEMR =
    location.state?.fromPage === 'PatientEMR' ||
    location.pathname.includes('emr');

  const edit =
    isFromEMR ||
    viewMode === 'readOnly' ||
    location.state?.edit ||
    localEncounter?.status === 'COMPLETED';

  const [currentHeader, setCurrentHeader] = useState<string>('Nurse Dashboard');

  const [searchTerm, setSearchTerm] = useState({ term: '' });
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const { data: nurseSheets = [] } = useGetNurseMedicalSheetsByDepartmentQuery(
    localEncounter?.departmentId
  );

  const allowedSheetCodes = useMemo(
    () => new Set((nurseSheets ?? []).map((s: any) => s.medicalSheet)),
    [nurseSheets]
  );

  const visibleSheets = useMemo(() => {
    return MedicalSheets.filter(ms => allowedSheetCodes.has(ms.code)).filter(ms =>
      ms.name.toLowerCase().includes(searchTerm.term.toLowerCase())
    );
  }, [allowedSheetCodes, searchTerm.term]);

  const headersMap = useMemo(() => {
    const map: Record<string, string> = {};

    MedicalSheets.forEach(ms => {
      const fullPath = ms.path.startsWith('/nurse-station')
        ? ms.path
        : `/nurse-station${ms.path.startsWith('/') ? ms.path : `/${ms.path}`}`;

      map[fullPath] = ms.name;
    });

    return map;
  }, []);

  useEffect(() => {
    setCurrentHeader(headersMap[location.pathname] || 'Nurse Dashboard');
  }, [location.pathname, headersMap]);

  const divContent = `Nurse Station > ${currentHeader}`;

  useEffect(() => {
    dispatch(setPageCode('Nurse_Station'));
    dispatch(setDivContent(divContent));

    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [currentHeader, dispatch, divContent]);


  const [completeEncounter, completeEncounterMutation] = useCompleteEncounterMutation();

  useEffect(() => {
    if (
      localEncounter?.encounterType === 'INPATIENT' &&
      completeEncounterMutation.status === 'fulfilled'
    ) {
      navigate('/inpatient-encounters-list');
    } else if (completeEncounterMutation.status === 'fulfilled') {
      if (pageSource === 'Urgent_Care_List') {
        navigate('/urgent-care-department-list', { state: { shouldRefetch: true } });
      } else {
        navigate('/encounter-list', { state: { shouldRefetch: true } });
      }
    }
  }, [completeEncounterMutation.status, localEncounter?.encounterType, navigate, pageSource]);

  const handleCompleteEncounter = async () => {
    try {
      if (!localEncounter) return;

      dispatch(showSystemLoader());
      await completeEncounter(localEncounter).unwrap();

      dispatch(
        notify({
          msg: 'Completed Successfully',
          sev: 'success'
        })
      );
    } catch (err: any) {
      const errorMap: Record<string, string> = {
        'error.complete.notAllowed': 'Cannot complete unless status is ONGOING or TRIAGE STARTED',
        'error.id.notfound': 'Encounter not found'
      };

      const backendMessage = err?.data?.message;
      const msg = errorMap[backendMessage] || 'Error completing encounter';

      dispatch(notify({ msg, sev: 'error' }));
    } finally {
      dispatch(hideSystemLoader());
    }
  };

  const handleGoBack = () => {
    if (pageSource === 'Urgent_Care_List') {
      navigate('/urgent-care-department-list', {
        state: {
          fromPage: 'NurseStation',
          patient: propsData?.patient,
          encounter: propsData?.encounter
        }
      });
      return;
    }

    navigate('/encounter-list');
  };


  return (
    <div className="container">
      <div className="left-box">
        <Panel>
          <div className="container-bt">
            <div className="left">
              {!inModal && (
                <BackButton
                  onClick={handleGoBack}
                  text={pageSource === 'Urgent_Care_List' ? 'To Urgent Care list' : 'To Encounters list'}
                />
              )}
              {!inModal && (
                <MyButton
                  backgroundColor={'var(--primary-gray)'}
                  onClick={() => navigate(-1)}
                  prefixIcon={() => <FontAwesomeIcon icon={faArrowLeft} />}
                />
              )}

              <Form fluid>
                <MyInput
                  width="100%"
                  placeholder="Medical Sheets"
                  fieldName="term"
                  record={searchTerm}
                  setRecord={setSearchTerm}
                  showLabel={false}
                  enterClick={() => setIsDrawerOpen(true)}
                  rightAddon={
                    <FaSearch className="icons-style-2" onClick={() => setIsDrawerOpen(true)} />
                  }
                />
              </Form>
            </div>

            {!inModal && (
              <div className="right">
             <NurseSummeryReportButton encounterId={localEncounter?.id}/>
                <MyButton
                  disabled={edit}
                  prefixIcon={() => <FontAwesomeIcon icon={faCheckDouble} />}
                  onClick={handleCompleteEncounter}
                  appearance="ghost"
                >
                  <Translate>Complete Visit</Translate>
                </MyButton>
              </div>
            )}
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
              <Drawer.Title>Nurse Station Sheets</Drawer.Title>
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
                    if (onSheetNavigate) {
                      onSheetNavigate('');
                    } else {
                      navigate('/nurse-station', { state: location.state });
                    }
                    setIsDrawerOpen(false);
                  }}
                >
                  <FontAwesomeIcon icon={faClockRotateLeft} className="icon" />
                  <Translate>Dashboard</Translate>
                </List.Item>

                {visibleSheets.map(({ code, name, icon, path }) => {
                  const clean = path.startsWith('/') ? path.slice(1) : path;
                  const fullPath = `/nurse-station/${clean}`;

                  return (
                    <List.Item
                      key={code}
                      className="drawer-item"
                      onClick={() => {
                        setIsDrawerOpen(false);
                        if (onSheetNavigate) {
                          onSheetNavigate(clean);
                        } else {
                          navigate(fullPath, {
                            state: {
                              patient: propsData?.patient,
                              encounter: propsData?.encounter,
                              edit,
                              fromPage: propsData?.fromPage
                            }
                          });
                        }
                      }}
                    >
                      {onSheetNavigate ? (
                        <span className="inherit-link">
                          {icon}
                          <span className="margin-left-10">
                            <Translate>{name}</Translate>
                          </span>
                        </span>
                      ) : (
                        <Link
                          to={fullPath}
                          state={{
                            patient: propsData?.patient,
                            encounter: propsData?.encounter,
                            edit,
                            fromPage: propsData?.fromPage
                          }}
                          className="inherit-link"
                        >
                          {icon}
                          <span className="margin-left-10">
                            <Translate>{name}</Translate>
                          </span>
                        </Link>
                      )}
                    </List.Item>
                  );
                })}
              </List>
            </Drawer.Body>
          </Drawer>
          <div
            className={clsx('column-container', { 'disabled-panel': edit && !inModal })}
            style={edit && !inModal ? { pointerEvents: 'none', opacity: 0.6 } : {}}
          >
            <div className="content-with-sticky">
              <div className="main-content-area">
                {outletContent !== undefined ? outletContent : (
                  <Outlet
                    context={{
                      patient: propsData?.patient,
                      encounter: propsData?.encounter,
                      edit,
                      setLocalEncounter
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        </Panel>
      </div>

      <div className="right-box">
        <PatientSide patient={propsData?.patient} encounter={propsData?.encounter} edit={edit} />
      </div>
    </div>
  );
};

export default NurseStation;
