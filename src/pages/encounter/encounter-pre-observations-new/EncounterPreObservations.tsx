import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Divider, Form, Panel } from 'rsuite';

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

  const selectedDeptId = useSelector(
    (state: any) => state.auth?.selectedDepartment?.departmentId
  );
  
  const propsData = inModal
    ? { patient: modalPatient, encounter: modalEncounter, fromPage: 'PatientEMR', viewMode: 'readOnly' }
    : location.state;
  const fromPage = propsData?.fromPage;
  const pageSource = fromPage || '';

useEffect(() => {
  if (inModal) return;
  if (!location.pathname.includes('/nurse-station')) return;

  const fromPatientsLists = location.state?.fromPage === 'PatientsLists';
  const encounterDeptId = propsData?.encounter?.departmentId;

  if (
    !fromPatientsLists &&
    (
      !propsData?.encounter ||
      !encounterDeptId ||
      encounterDeptId !== selectedDeptId
    )
  ) {
    navigate('/encounter-list', { replace: true });
  }
}, [
  inModal,
  location.pathname,
  location.state?.fromPage,
  propsData?.encounter,
  selectedDeptId,
  navigate
]);

  const [localEncounter, setLocalEncounter] = useState<any>({
    ...propsData?.encounter
  });

  const viewMode = propsData?.viewMode;
  const isFromEMR =
    location.state?.fromPage === 'PatientEMR' ||
    location.pathname.includes('emr');

  const fromPatientsLists = location.state?.fromPage === 'PatientsLists';

  const edit = fromPatientsLists
    ? false
    : isFromEMR ||
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
  const currentFromPage = propsData?.fromPage || fromPage || '';

  const sharedNavigationState = useMemo(
    () => ({
      patient: propsData?.patient,
      encounter: propsData?.encounter,
      edit,
      fromPage: currentFromPage,
      viewMode: propsData?.viewMode
    }),
    [propsData?.patient, propsData?.encounter, edit, currentFromPage, propsData?.viewMode]
  );
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
    if (pageSource === 'PatientsLists') {
      navigate('/patients-list');
      return;
    }

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
                 text={
                  pageSource === 'PatientsLists'
                    ? 'To Patients list'
                    : pageSource === 'Urgent_Care_List'
                      ? 'To Urgent Care list'
                      : 'To Encounters list'
                 }
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
                <NurseSummeryReportButton encounterId={localEncounter?.id} />
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
          <div className="medical-sheets-tabs">
            <MyButton
              className={`medical-sheet-tab ${location.pathname === '/nurse-station' ? 'active' : ''}`}
              onClick={() => {
                if (onSheetNavigate) {
                  onSheetNavigate('');
                } else {
                  navigate('/nurse-station', { state: sharedNavigationState });
                }
              }}
            >
              <FontAwesomeIcon icon={faClockRotateLeft} />
              <Translate>Dashboard</Translate>
            </MyButton>

            {visibleSheets.map(({ code, name, icon, path }) => {
              const fullPath = `/nurse-station${path.startsWith('/') ? path : `/${path}`}`;
              const isActive = location.pathname === fullPath;

              return (
                <MyButton
                  key={code}
                  className={`medical-sheet-tab ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    if (onSheetNavigate) {
                      const relativePath = path.startsWith('/') ? path.slice(1) : path;
                      onSheetNavigate(relativePath);
                    } else {
                      navigate(fullPath, { state: sharedNavigationState });
                    }
                  }}

                >
                  {icon}
                  <span>
                    <Translate>{name}</Translate>
                  </span>
                </MyButton>
              );
            })}
          </div>
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
