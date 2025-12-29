import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Divider, Drawer, Form, List, Panel } from 'rsuite';

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
import { useCompleteEncounterMutation } from '@/services/encounterService';
import { useGetNurseMedicalSheetsByDepartmentQuery } from '@/services/MedicalSheetsService';

import './styles.less';
import { useGenerateNurseSummaryReportMutation } from '@/services/observationService';
import { ApPatient } from '@/types/model-types';

const NurseStation = () => {
  const mode = useSelector((state: any) => state.ui.mode);

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const propsData = location.state;

  const [localEncounter, setLocalEncounter] = useState<any>({
    ...propsData?.encounter
  });

  const [searchTerm, setSearchTerm] = useState({ term: '' });
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [edit, setEdit] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [generateNurseReport] = useGenerateNurseSummaryReportMutation();

  // Nurse sheets
  const departmentKeyToUse = localEncounter?.departmentKey || '5001';
  const { data: nurseSheets = [] } = useGetNurseMedicalSheetsByDepartmentQuery(departmentKeyToUse);

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
    const map: any = {};
    MedicalSheets.forEach(ms => {
      const fullPath = `/nurse-station/${ms.path.startsWith('/') ? ms.path.slice(1) : ms.path}`;
      map[fullPath] = ms.name;
    });
    return map;
  }, []);

  useEffect(() => {
    const header = headersMap[location.pathname] || 'Nurse Dashboard';

    dispatch(setPageCode('Nurse_Station'));
    dispatch(setDivContent(`Nurse Station > ${header}`));

    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(' '));
    };
  }, [location.pathname, headersMap, dispatch]);

  useEffect(() => {
    if (!propsData?.encounter) {
      navigate('/encounter-list');
      return;
    }
    setEdit(propsData?.edit || localEncounter?.encounterStatusLvalue?.valueCode === 'CLOSED');
  }, [propsData, localEncounter]);

  // Complete encounter
  const [completeEncounter] = useCompleteEncounterMutation();

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
    } catch (error) {
      dispatch(
        notify({
          msg: 'An error occurred while completing the encounter',
          sev: 'error'
        })
      );
    } finally {
      dispatch(hideSystemLoader());
    }
  };

  const handleGoBack = () => {
    navigate('/encounter-list');
  };

  const handleGenerateReport = async (): Promise<void> => {
    try {
      const blob = await generateNurseReport({
        patient: localEncounter?.patientObject as ApPatient,
        encounter: localEncounter
      }).unwrap();

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `nurse-summary-${localEncounter.key}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      dispatch(
        notify({
          msg: 'Error while generating report',
          sev: 'error'
        })
      );
      throw error;
    }
  };

  return (
    <div className="container">
      {/* LEFT SIDE */}
      <div className="left-box">
        <Panel>
          {/* TOP BAR */}
          <div className="container-bt">
            <div className="left">
              <BackButton onClick={handleGoBack} text="To Encounters list" />
              <MyButton
                backgroundColor={'var(--primary-gray)'}
                onClick={() => navigate(-1)}
                prefixIcon={() => <FontAwesomeIcon icon={faArrowLeft} />}
              />

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

            <div className="right">
              <MyButton
                loading={isGeneratingReport}
                disabled={isGeneratingReport}
                onClick={async () => {
                  try {
                    setIsGeneratingReport(true);
                    await handleGenerateReport();
                  } finally {
                    setIsGeneratingReport(false);
                  }
                }}
              >
                Generate Report
              </MyButton>

              {propsData?.encounter?.editable && !propsData?.encounter?.discharge && (
                <MyButton
                  disabled={edit}
                  prefixIcon={() => <FontAwesomeIcon icon={faCheckDouble} />}
                  onClick={handleCompleteEncounter}
                  appearance="ghost"
                >
                  <Translate>Complete Visit</Translate>
                </MyButton>
              )}
            </div>
          </div>

          <Divider />

          {/* DRAWER */}
          <Drawer
            open={isDrawerOpen}
            onClose={() => setIsDrawerOpen(false)}
            placement="left"
            className={`drawer-style ${mode === 'light' ? 'light' : 'dark'}`}
          >
            <Drawer.Header>
              <Drawer.Title>Nurse Station Sheets</Drawer.Title>
            </Drawer.Header>

            <Drawer.Body>
              <List hover>
                <List.Item
                  onClick={() => {
                    navigate('/nurse-station', { state: location.state });
                    setIsDrawerOpen(false);
                  }}
                >
                  <FontAwesomeIcon icon={faClockRotateLeft} /> Dashboard
                </List.Item>

                {visibleSheets.map(({ code, name, icon, path }) => {
                  const clean = path.startsWith('/') ? path.slice(1) : path;
                  const fullPath = `/nurse-station/${clean}`;

                  return (
                    <List.Item key={code}>
                      <Link
                        to={fullPath}
                        state={{
                          patient: propsData.patient,
                          encounter: propsData.encounter,
                          edit
                        }}
                      >
                        {icon} {name}
                      </Link>
                    </List.Item>
                  );
                })}
              </List>
            </Drawer.Body>
          </Drawer>

          {/* CONTENT */}
          <div className="content-with-sticky">
            <div className="main-content-area">
              <Outlet
                context={{
                  patient: propsData?.patient,
                  encounter: propsData?.encounter,
                  edit,
                  setLocalEncounter
                }}
              />
            </div>
          </div>
        </Panel>
      </div>

      {/* RIGHT SIDE */}
      <div className="right-box">
        <PatientSide patient={propsData?.patient} encounter={propsData?.encounter} edit={edit} />
      </div>
    </div>
  );
};

export default NurseStation;
