// NurseStation.tsx  (layout page like Encounter but for nurse sheets)
// - Uses same MedicalSheets config
// - No scope filtering
// - Drawer left + routing via <Outlet />
// - Filters by backend nurseSheets hook only

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Col,
  Divider,
  Drawer,
  Form,
  List,
  Panel,
  Row,
  Tooltip,
  Whisper,
} from "rsuite";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

import MyButton from "@/components/MyButton/MyButton";
import MyInput from "@/components/MyInput";
import Translate from "@/components/Translate";
import BackButton from "@/components/BackButton/BackButton";
import PatientSide from "../encounter-main-info-section/PatienSide";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faBaby,
  faBed,
  faBraille,
  faCapsules,
  faChartLine,
  faCheckDouble,
  faClockRotateLeft,
  faComment,
  faDesktop,
  faDroplet,
  faEarListen,
  faEye,
  faFileLines,
  faFilePrescription,
  faFileWaveform,
  faG,
  faHandDots,
  faHeartPulse,
  faLeaf,
  faNotesMedical,
  faPersonDotsFromLine,
  faPersonFallingBurst,
  faPersonWalking,
  faPills,
  faRightFromBracket,
  faSuitcaseMedical,
  faStethoscope,
  faSyringe,
  faTooth,
  faTriangleExclamation,
  faUserDoctor,
  faUserPlus,
  faVials,
} from "@fortawesome/free-solid-svg-icons";
import { FaSearch } from "react-icons/fa";
import { GiKidneys } from "react-icons/gi";

import { useAppDispatch, useAppSelector } from "@/hooks";
import { setDivContent, setPageCode } from "@/reducers/divSlice";
import { notify, showSystemLoader, hideSystemLoader } from "@/utils/uiReducerActions";

import { useCompleteEncounterMutation } from "@/services/encounterService";
import { useGetNurseMedicalSheetsByDepartmentQuery } from "@/services/MedicalSheetsService";
import { MedicalSheets } from "@/config/modules-config";

import "./styles.less";

const NurseStation = () => {
  const mode = useSelector((state: any) => state.ui.mode);

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const propsData = location.state;

  const authSlice = useAppSelector((state) => state.auth);

  const [localEncounter, setLocalEncounter] = useState<any>({
    ...propsData?.encounter,
  });

  const [searchTerm, setSearchTerm] = useState({ term: "" });
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [edit, setEdit] = useState(false);

  // Nurse sheets from backend (different hook than encounter)
   const departmentKeyToUse = localEncounter?.departmentKey || '5001';
  const { data: nurseSheets = [] } =
    useGetNurseMedicalSheetsByDepartmentQuery(departmentKeyToUse);
 console.log("Nurse Sheets from backend:", nurseSheets);
  // allowed codes from backend
  const allowedSheetCodes = useMemo(
    () => new Set((nurseSheets ?? []).map((s: any) => s.medicalSheet)),
    [nurseSheets]
  );

  // visible sheets (NO scope)
  const visibleSheets = useMemo(() => {
    return MedicalSheets
      .filter((ms) => allowedSheetCodes.has(ms.code))
      .filter((ms) =>
        ms.name.toLowerCase().includes(searchTerm.term.toLowerCase())
      );
  }, [allowedSheetCodes, searchTerm.term]);

  // headers map for nurse station routes
  const headersMap = useMemo(() => {
    const map: any = {};
    MedicalSheets.forEach((ms) => {
      const fullPath = `/nurse-station/${ms.path.startsWith("/") ? ms.path.slice(1) : ms.path}`;
      map[fullPath] = ms.name;
    });
    return map;
  }, []);

  const [currentHeader, setCurrentHeader] = useState<string>("Nurse Station");

  useEffect(() => {
    const header = headersMap[location.pathname] || "Nurse Dashboard";
    setCurrentHeader(header);

    dispatch(setPageCode("Nurse_Station"));
    dispatch(setDivContent(`Nurse Station > ${header}`));

    return () => {
      dispatch(setPageCode(""));
      dispatch(setDivContent(" "));
    };
  }, [location.pathname, headersMap, dispatch]);

  // encounter edit/closed logic (same as before)
  useEffect(() => {
    if (!propsData?.encounter) {
      navigate("/encounter-list");
      return;
    }
    setEdit(
      propsData?.edit ||
        localEncounter?.encounterStatusLvalue?.valueCode === "CLOSED"
    );
  }, [propsData, localEncounter]);

  // complete encounter
  const [completeEncounter, completeEncounterMutation] =
    useCompleteEncounterMutation();

  const handleCompleteEncounter = async () => {
    try {
      if (!localEncounter) return;

      dispatch(showSystemLoader());
      await completeEncounter(localEncounter).unwrap();

      dispatch(
        notify({
          msg: "Completed Successfully",
          sev: "success",
        })
      );
    } catch (error) {
      console.error("Encounter completion error:", error);
      dispatch(
        notify({
          msg: "An error occurred while completing the encounter",
          sev: "error",
        })
      );
    } finally {
      dispatch(hideSystemLoader());
    }
  };

  const handleGoBack = () => {
    navigate("/encounter-list");
  };

  return (
    <div className="container">
      {/* Top bar */}
      <div className="left-box">
        <Panel>
          <div className="container-bt">
            <div className="left">
              <BackButton onClick={handleGoBack} text="To Encounters list" />
              <MyButton
                backgroundColor={"var(--primary-gray)"}
                onClick={() => navigate(-1)}
                prefixIcon={() => <FontAwesomeIcon icon={faArrowLeft} />}
              />

              <Form fluid>
                <MyInput
                  width="100%"
                  placeholder="Medical Sheets"
                  fieldName={"term"}
                  record={searchTerm}
                  setRecord={setSearchTerm}
                  showLabel={false}
                  enterClick={() => setIsDrawerOpen(true)}
                  rightAddon={
                    <FaSearch
                      className="icons-style-2"
                      onClick={() => setIsDrawerOpen(true)}
                    />
                  }
                />
              </Form>
            </div>

            <div className="right">
              {/* example actions if needed */}
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

          {/* Drawer list */}
          <Drawer
            open={isDrawerOpen}
            onClose={() => setIsDrawerOpen(false)}
            placement="left"
            style={{ zIndex: 999999999999 }}
            className={`drawer-style ${mode === "light" ? "light" : "dark"}`}
          >
            <Drawer.Header className="header-drawer">
              <Drawer.Title className="title-drawer">
                Nurse Station Sheets
              </Drawer.Title>
            </Drawer.Header>

            <Drawer.Body className="drawer-body">
              <Form fluid>
                <Row>
                  <Col md={24}>
                    <MyInput
                      width="100%"
                      placeholder="Search screens..."
                      fieldName={"term"}
                      record={searchTerm}
                      setRecord={setSearchTerm}
                      showLabel={false}
                      rightAddon={
                        <FaSearch style={{ color: "var(--primary-gray)" }} />
                      }
                    />
                  </Col>
                </Row>
              </Form>

              <List hover className="drawer-list-style">
                {/* Dashboard entry */}
                <List.Item
                  className="drawer-item return-button"
                  onClick={() => {
                    navigate("/nurse-station", { state: location.state });
                    setIsDrawerOpen(false);
                  }}
                >
                  <FontAwesomeIcon icon={faClockRotateLeft} className="icon" />
                  <Translate>Dashboard</Translate>
                </List.Item>

                {visibleSheets.map(({ code, name, icon, path }) => {
                  const clean = path.startsWith("/") ? path.slice(1) : path;
                  const fullPath = `/nurse-station/${clean}`;

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
                            edit,
                          },
                        });
                      }}
                    >
                      <Link
                        to={fullPath}
                        state={{
                          patient: propsData.patient,
                          encounter: propsData.encounter,
                          edit,
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

          {/* Content body */}
          <div className="content-with-sticky">
            <div className="main-content-area">
              <Outlet
                context={{
                  patient: propsData?.patient,
                  encounter: propsData?.encounter,
                  edit,
                  setLocalEncounter,
                }}
              />
            </div>
          </div>
        </Panel>
      </div>

      {/* Right box with PatientSide */}
      <div className="right-box">
        <PatientSide
          patient={propsData?.patient}
          encounter={propsData?.encounter}
          edit={edit}
        />
      </div>
    </div>
  );
};

export default NurseStation;