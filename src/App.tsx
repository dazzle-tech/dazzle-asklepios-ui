import { useLoadTenantQuery } from '@/services/authService';
import { Icon } from '@rsuite/icons';
import { BlockUI } from 'primereact/blockui';
import React, { useEffect, useState } from 'react';
import * as icons from 'react-icons/fa6';
import { MdDashboard } from 'react-icons/md';
import { IntlProvider } from 'react-intl';
import { useSelector } from 'react-redux';
import { Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { CustomProvider } from 'rsuite';
import enGB from 'rsuite/locales/en_GB';
import config from '../app-config';
import Frame from './components/Frame';
import SystemLoader from './components/Loaders/SystemLoader';
import MyToast from './components/MyToast/MyToast';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import SessionExpiredBackdrop from './components/SessionExpiredBackdrop/SessionExpiredBackdrop';
import Translate from './components/Translate';
import { useAppDispatch, useAppSelector } from './hooks';
import NetworkErrorImg from './images/network-error.png';
import locales from './locales';
import Resources from './pages/appointment/resources';
import Error403Page from './pages/authentication/403';
import Error404Page from './pages/authentication/404';
import Error500Page from './pages/authentication/500';
import Error503Page from './pages/authentication/503';
import AuthGuard from './pages/authentication/AuthGuard';
import SignInPage from './pages/authentication/sign-in';
import Dashboard from './pages/dashboard';
import ContinuousObservations from './pages/encounter/continuous-observations/ContinuousObservations';
import DayCaseList from './pages/encounter/day-case/DayCaseList/DayCaseList';
import Dental from './pages/encounter/dental-screen';
import ReferralRequest from './pages/encounter/encounter-component/add-referral-request';
import AudiometryPuretone from './pages/encounter/encounter-component/audiometry-puretone';
import BedsideProceduresRequests from './pages/encounter/encounter-component/bedside-procedures-requests';
import BloodOrder from './pages/encounter/encounter-component/blood-order';
import Cardiology from './pages/encounter/encounter-component/cardiology';
import CarePlanAndGoals from './pages/encounter/encounter-component/care-plan-and-goals';
import Consultation from './pages/encounter/encounter-component/consultation';
import DayCaseContent from './pages/encounter/encounter-component/day-case-content';
import DiagnosticsOrder from './pages/encounter/encounter-component/diagnostics-order';
import DiagnosticsResult from './pages/encounter/encounter-component/diagnostics-result/DiagnosticsResult';
import DialysisRequest from './pages/encounter/encounter-component/dialysis-request/DialysisRequest';
import DietaryRequest from './pages/encounter/encounter-component/dietary-request/DietaryRequests';
import DischargePlanning from './pages/encounter/encounter-component/discharged-planning';
import DoctorRound from './pages/encounter/encounter-component/doctor-round/DoctorRound';
import ViewRound from './pages/encounter/encounter-component/doctor-round/NewRound/ViewRound';
import DrugOrder from './pages/encounter/encounter-component/drug-order';
import JohnsHopkinsTool from './pages/encounter/encounter-component/fall-risk-assessments';
import GlasgowComaScale from './pages/encounter/encounter-component/glasgow-coma-scale';
import HendrichFallRisk from './pages/encounter/encounter-component/hendrich-fall-risk';
import ICU from './pages/encounter/encounter-component/i.c.u/ICU';
import IntakeOutputBalance from './pages/encounter/encounter-component/intake-output-balance';
import IVFluidAdministration from './pages/encounter/encounter-component/iv-fluid-administration/IVFluidAdministration';
import IVFluidOrder from './pages/encounter/encounter-component/iv-fluid-order';
import MAR from './pages/encounter/encounter-component/mar';
import MedicationsRecord from './pages/encounter/encounter-component/medications-record';
import MorseFallScale from './pages/encounter/encounter-component/morse-fall-scale';
import MultidisciplinaryTeamNotes from './pages/encounter/encounter-component/multidisciplinary-team-notes';
import NutritionStateAsssessment from './pages/encounter/encounter-component/nutrition-state-asssessment';
import OccupationalTherapy from './pages/encounter/encounter-component/occupational-therapy';
import OperationRequest from './pages/encounter/encounter-component/operation-request/OperationRequest';
import OptometricExam from './pages/encounter/encounter-component/optometric-exam';
import SlidingScale from './pages/encounter/encounter-component/order-details';
import PatientHistory from './pages/encounter/encounter-component/patient-history';
import PatientSummary from './pages/encounter/encounter-component/patient-summary';
import PhysicianOrderSummary from './pages/encounter/encounter-component/physician-order-summary/physician-order-summary-component';
import PhysiotherapyPlan from './pages/encounter/encounter-component/physiotherapy-plan';
import PregnancyFollowup from './pages/encounter/encounter-component/pregnancy-follow-up';
import Prescription from './pages/encounter/encounter-component/prescription';
import PressureUlcerRiskAssessment from './pages/encounter/encounter-component/pressure-ulce-risk-assessment';
import Procedure from './pages/encounter/encounter-component/procedure';
import ProgressNotes from './pages/encounter/encounter-component/progress-notes/ProgressNotes';
import PsychologicalExam from './pages/encounter/encounter-component/psychological-exam';
import SOAP from './pages/encounter/encounter-component/s.o.a.p';
import SpeechTherapy from './pages/encounter/encounter-component/speech-therapy';
import StratifyScale from './pages/encounter/encounter-component/stratify-scale';
import VaccineReccord from './pages/encounter/encounter-component/vaccine-reccord';
import VTERiskAssessment from './pages/encounter/encounter-component/vte-risk-assessment';
import EncounterList from './pages/encounter/encounter-list';
import EncounterPatientPrivateLogin from './pages/encounter/encounter-patient-private';
import Allergies from './pages/encounter/encounter-pre-observations/AllergiesNurse';
import EncounterPreObservations from './pages/encounter/encounter-pre-observations/EncounterPreObservations';
import InpatientNurseStation from './pages/encounter/encounter-pre-observations/InpatientNurseStation';
import Observations from './pages/encounter/encounter-pre-observations/observations/Observations';
import ServiceAndProducts from './pages/encounter/encounter-pre-observations/Service&Products';
import VaccinationTab from './pages/encounter/encounter-pre-observations/vaccination-tab';
import Warning from './pages/encounter/encounter-pre-observations/warning';
import EncounterRegistration from './pages/encounter/encounter-registration';
import Encounter from './pages/encounter/encounter-screen';
import ERDashboards from './pages/encounter/ER-triage/Er-dashboard/ERDashboard';
import ERStartTriage from './pages/encounter/ER-triage/ERStartTriage';
import ERTabsDepartmentAndWaitingList from './pages/encounter/ER-triage/ERTabsDepartmentAndWaitingList';
import ERTriage from './pages/encounter/ER-triage/ERTriage';
import QuickVisit from './pages/encounter/ER-triage/QuickVisit';
import ViewTriage from './pages/encounter/ER-triage/ViewTriage';
import TeleconsultationScreen from './pages/encounter/tele-consultation-screen';
import StartTeleConsultation from './pages/encounter/tele-consultation-screen/start-tele-consultation';
import DepartmentStock from './pages/Inpatient/departmentStock/DepartmentStock';
import InpatientList from './pages/Inpatient/inpatientList';
import InpatientWaitingLists from './pages/Inpatient/waitingList/InpatientWaitingLists';
import InventoryTransaction from './pages/inventory-transaction/inventory-transaction';
import InventoryTransfer from './pages/inventory-transaction/inventory-transfer';
import InventoryTransferApproval from './pages/inventory-transaction/inventory-transfer-approval';
import ProductCatalog from './pages/inventory-transaction/product-catalog';
import Lab from './pages/lab-module';
import ListOfRequisition from './pages/list-of-requisition';
import ActiveIngredientsSetup from './pages/medications/active-ingredients-setup/ActiveIngredientsSetup';
import GenericMedications from './pages/medications/generic-medications';
import PrescriptionInstructions from './pages/medications/prescription_instructions';
import Operation from './pages/operation-module';
import OperationRoomMaterials from './pages/operation-theater/operation-room-materials/OperationRoomMaterials';
import FacilityPatientList from './pages/patient/facility-patient-list/FacilityPatientList';
import PatientChart from './pages/patient/patient-chart';
import PatientEMR from './pages/patient/patient-emr';
import PatientList from './pages/patient/patient-list';
import PatientMergeFiles from './pages/patient/patient-merge-files';
import PatientProfile from './pages/patient/patient-profile';
import PatientProfileNew from './pages/patient/patient-profile/PatientProfileCopy-new';
import PatientQuickAppointment from './pages/patient/patient-profile/PatientQuickAppoinment/PatientQuickAppointment';
import ControlledMedications from './pages/pharmacy/controlled-medications';
import EPrepscriptions from './pages/pharmacy/ePrescriptions/EPrescription';
import InternalDrugOrder from './pages/pharmacy/internal-drug-order';
import Playground from './pages/playground';
import ProcedureModule from './pages/procedure-module/ProcedureModule';
import PurchasingRequisition from './pages/purchasing-requisition/PurchasingRequisition';
import Questionnaire from './pages/questionnaire-setup/Questionnaire';
import Rad from './pages/rad-module/RadiologyMain';
import Recovery from './pages/recovery';
import ResetPassword from './pages/reset-password/ResetPassword';
import ReviewResults from './pages/review-results/ReviewResults';
import ScheduleScreen from './pages/Scheduling/scheduling-screen/ScheduleScreen';
import AccessRoles from './pages/setup/access-roles';
import AgeGroup from './pages/setup/age-group';
import Allergens from './pages/setup/allergens-setup';
import Room from './pages/setup/bed-room-setup';
import Catalog from './pages/setup/catalog-setup';
import CDTSetup from './pages/setup/cdt-setup';
import CPTSetup from './pages/setup/cpt-setup';
import DentalActions from './pages/setup/dental-actions';
import Departments from './pages/setup/departments-setup';
import Diagnostics from './pages/setup/diagnostics-tests-definition';
import DVM from './pages/setup/dvm-setup';
import Facilities from './pages/setup/facilities-setup';
import ICD10Setup from './pages/setup/icd10-setup';
import LOINCSetup from './pages/setup/lonic-setup';
import Lov from './pages/setup/lov-setup';
import MedicationMatrix from './pages/setup/med-matrix-setup';
import MedicationSchedule from './pages/setup/medication-schedule-setup';
import Metadata from './pages/setup/metadata-view';
import Modules from './pages/setup/modules-setup';
import OperationSetup from './pages/setup/operation-setup';
import Checklist from './pages/setup/operations/checklist';
import PotintialDuplicate from './pages/setup/potential-duplicate';
import Practitioners from './pages/setup/practioners-setup-new';
import ProcedureSetup from './pages/setup/procedure-setup';
import ProductSetup from './pages/setup/product-setup';
import PurchaseApprovalSetup from './pages/setup/purchase-approvals-setup/PurchaseApprovalSetup';
import ReportResultTemplate from './pages/setup/report-result-template';
import ServiceSetup from './pages/setup/service-setup';
import Shifts from './pages/setup/shift-setup';
import SupplierSetup from './pages/setup/supplier-setup/Supplier';
import SurgicalKitsSetup from './pages/setup/surgical-kits-setup';
import UOMGroup from './pages/setup/uom-group';
import Users from './pages/setup/users-setup';
import UsersNew from './pages/setup/users-setup-new';
import Vaccine from './pages/setup/vaccine-setup';
import VisitDurationSetup from './pages/setup/visit-duration-setup';
import WarehouseItemsSetup from './pages/setup/warehouse-Items-setup';
import WarehouseSetup from './pages/setup/warehouse-setup/WarehouseSetup';
import { useLoadNavigationMapQuery } from './services/uiService';
import { setScreenKey } from './utils/uiReducerActions';
import NewDepartments from './pages/setup/departments-setup/Departments-new';
import NeonatesPainAssessment from './pages/encounter/neonates-pain-assessment/NeonatesPainAssessment';
import { MODULES } from '@/config/modules-config';
import RoleManegment from './pages/setup/role-managemen';
import { useGetMenuQuery } from './services/security/UserRoleService';
import CallOverlay from './components/Overlay/CallOverlay';
import LanguagesSetup from './pages/setup/language-setup/Language';
import Pediatric from './pages/encounter/encounter-component/pediatric';
import IncidentPortal from './pages/Incident/IncidentPortal';

const App = () => {
  const authSlice = useAppSelector(state => state.auth);
  const uiSlice = useAppSelector(state => state.ui);
  const mode = useSelector((state: any) => state.ui.mode);
  const dispatch = useAppDispatch();
  const tenantQueryResponse = useLoadTenantQuery(config.tenantId);

  const [navigationMap, setNavigationMap] = useState<any[]>([]);
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const tenant = JSON.parse(localStorage.getItem('tenant') || 'null');
  const selectedFacility = tenant?.selectedFacility || null;



  // ------------------------------ MENU BUILD HELPERS ---------------------------
  type BackendMenuItem = { module?: string | null; label?: string | null; screen?: string | null };

  const norm = (s?: string | null) =>
    (s ?? '').toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();

  const toTitleCase = (str: string) =>
    str
      .toLowerCase()
      .split(' ')
      .map(w => (w ? w[0].toUpperCase() + w.slice(1) : w))
      .join(' ');

  const buildPermissionLookup = (menuItems: BackendMenuItem[]) => {
    const globalAllowed = new Set<string>();
    const moduleAllowed = new Map<string, Set<string>>();

    for (const m of menuItems ?? []) {
      const nLabel = norm(m.label);
      const nScreen = norm((m.screen ?? '').replace(/[_]/g, ' '));
      const nModule = norm(m.module);

      if (nLabel) globalAllowed.add(nLabel);
      if (nScreen) globalAllowed.add(nScreen);

      if (nModule) {
        if (!moduleAllowed.has(nModule)) moduleAllowed.set(nModule, new Set());
        if (nLabel) moduleAllowed.get(nModule)!.add(nLabel);
        if (nScreen) moduleAllowed.get(nModule)!.add(nScreen);
      }
    }
    return { globalAllowed, moduleAllowed };
  };

  const isScreenAllowed = (
    screen: { name: string; navPath: string },
    moduleName: string,
    lookups: { globalAllowed: Set<string>; moduleAllowed: Map<string, Set<string>> }
  ) => {
    const { globalAllowed, moduleAllowed } = lookups;
    const nScreenName = norm(screen.name);
    const nScreenCode = norm(screen.name.replace(/-/g, ' '));
    const nNavPath = norm(screen.navPath);
    const nModule = norm(moduleName);
    const modSet = moduleAllowed.get(nModule);

    if (modSet && (modSet.has(nScreenName) || modSet.has(nScreenCode) || modSet.has(nNavPath)))
      return true;
    if (
      globalAllowed.has(nScreenName) ||
      globalAllowed.has(nScreenCode) ||
      globalAllowed.has(nNavPath)
    )
      return true;
    return false;
  };

  // ------------------------------ BUILD NAVIGATION ----------------------------
  useEffect(() => {
    if (!authSlice?.menu ) return;
    loadNavs();
  }, [authSlice?.menu]);

  const loadNavs = () => {
    const navsTemp: any[] = [];

    // Dashboard
    navsTemp.push({
      eventKey: 'nav:dashboard',
      icon: <Icon as={MdDashboard} />,
      title: 'Dashboard',
      to: '/'
    });

    const lookups = buildPermissionLookup(authSlice?.menu as BackendMenuItem[]);

    MODULES.forEach((module, mIdx) => {
      if (!module.screens?.length) return;

      const childrenNavs: any[] = [];
      const sortedScreens = [...module.screens].sort(
        (a, b) => (a.viewOrder ?? 0) - (b.viewOrder ?? 0)
      );

      sortedScreens.forEach((screen, sIdx) => {
        if (isScreenAllowed(screen, module.name, lookups)) {
          const safeIconKey = (screen?.icon as keyof typeof icons) ?? 'FaCircle';
          const IconComp = icons[safeIconKey] ?? icons.FaCircle;

          childrenNavs.push({
            eventKey: `nav:${module.name}:${screen.navPath}:${sIdx}`,
            icon: <Icon as={IconComp} />,
            title: toTitleCase(screen.name),
            to: `/${screen.navPath}`
          });
        }
      });

      if (childrenNavs.length > 0) {
        const safeModuleIconKey = (module?.icon as keyof typeof icons) ?? 'FaBox';
        const ModuleIconComp = icons[safeModuleIconKey] ?? icons.FaBox;

        navsTemp.push({
          eventKey: `nav:${module.name}:${mIdx}`,
          icon: <Icon as={ModuleIconComp} />,
          title: module.name,
          children: childrenNavs
        });
      }
    });

    setNavigationMap(navsTemp);
  };

  return (
    <IntlProvider locale="en" messages={locales.en}>
      <div
        style={{ position: 'fixed', right: '1%', bottom: '1%', zIndex: 1000, color: 'grey' }}
      ></div>
      <div
        id="blocker-error"
        style={{
          position: 'fixed',
          left: '0%',
          bottom: '0%',
          zIndex: 1001,
          background: 'rgba(0,0,0,0.95)',
          width: '100%',
          height: '100%',
          display: 'none'
        }}
      >
        <h3 style={{ textAlign: 'center', margin: '20vw' }}>
          <div id="blocker-error-msg" style={{ margin: '20px', color: 'rgb(150,30,40)' }}>
            System Error
          </div>
          <img src={NetworkErrorImg} width={200} />
        </h3>
      </div>

      <MyToast />
      <SystemLoader />
      <SessionExpiredBackdrop />
      <CustomProvider locale={enGB}>
        <Routes>
          <Route
            element={
              <AuthGuard>
                <ProtectedRoute>
                  <BlockUI
                    template={
                      <h3
                        style={{
                          textAlign: 'center',
                          color: 'white',

                          top: '10%',
                          position: 'absolute'
                        }}
                      >
                        <Translate>Loading</Translate>...
                      </h3>
                    }
                    blocked={uiSlice.loading}
                  >
                    <Outlet />
                  </BlockUI>
                </ProtectedRoute>
              </AuthGuard>
            }
          >
            {/* {/* protected routes (needs authintication) */}
            {/* TODO load them dynamically based on user authorization matrix */}
            <Route path="/" element={<Frame navs={navigationMap} mode={mode} />}>
              <Route index element={<Dashboard />} />
              <Route path="incident-portal" element={<IncidentPortal />} />
              <Route path="patient-profile-old" element={<PatientProfile />} />
              <Route path="patient-quick-appointment" element={<PatientQuickAppointment />} />
              <Route path="patient-profile" element={<PatientProfileNew />} />
              <Route path="patient-chart" element={<PatientChart />} />
              <Route path="patient-list" element={<PatientList />} />
              <Route path="tele-consultation-screen" element={<TeleconsultationScreen />} />
              <Route path="start-tele-consultation" element={<StartTeleConsultation />} />
              <Route path="encounter-registration" element={<EncounterRegistration />} />
              <Route path="information-desk" element={<FacilityPatientList />} />
              <Route path="ER-start-triage" element={<ERStartTriage />} />
              <Route path="ER-triage" element={<ERTriage />} />
              <Route path="ER-dashboard" element={<ERDashboards />} />
              <Route path="ER-department" element={<ERTabsDepartmentAndWaitingList />} />
              <Route path="view-triage" element={<ViewTriage />} />
              <Route path="quick-visit" element={<QuickVisit />} />
              <Route path="report-result-template" element={<ReportResultTemplate />} />
              <Route path="ER-triage" element={<ERTriage />} />
              <Route path="encounter" element={<Encounter />}>
                <Route path="progress-notes" element={<ProgressNotes />} />
                <Route
                  path="pressure-ulce-risk-assessment"
                  element={<PressureUlcerRiskAssessment />}
                />
                <Route path="vte-risk-assessment" element={<VTERiskAssessment />} />
                <Route path="glasgow-coma-scale" element={<GlasgowComaScale />} />
                <Route path="medication-order" element={<DrugOrder />} />
                <Route path="pregnancy-follow-up" element={<PregnancyFollowup />} />
                <Route path="drug-order" element={<DrugOrder />} />
                <Route index element={<PatientSummary />} />
                <Route path="clinical-visit" element={<SOAP />} />
                <Route path="observations" element={<Observations />} />
                <Route path="allergies" element={<Allergies />} />
                <Route path="medical-warnings" element={<Warning />} />
                <Route path="cardiology" element={<Cardiology />} />
                <Route path="dental-care" element={<Dental />} />
                <Route path="optometric-exam" element={<OptometricExam />} />
                <Route path="johns-hopkins-tool" element={<JohnsHopkinsTool />} />
                <Route path="audiometry" element={<AudiometryPuretone />} />
                <Route path="psychological-exam" element={<PsychologicalExam />} />
                <Route path="vaccination" element={<VaccinationTab />} />
                <Route path="prescription" element={<Prescription />} />
                <Route path="diagnostics-order" element={<DiagnosticsOrder />} />
                <Route path="consultation" element={<Consultation />} />
                <Route path="procedures" element={<Procedure />} />
                <Route path="patient-history" element={<PatientHistory />} />
                <Route path="medications-record" element={<MedicationsRecord />} />
                <Route path="vaccine-record" element={<VaccineReccord />} />
                <Route path="diagnostics-result" element={<DiagnosticsResult />} />
                <Route path="dialysis-request" element={<DialysisRequest />} />
                <Route path="operation-request" element={<OperationRequest />} />
                <Route path="doctor-round" element={<DoctorRound />} />
                <Route path="icu" element={<ICU />} />
                <Route path="pediatric" element={<Pediatric />} />
                <Route
                  path="multidisciplinary-team-notes"
                  element={<MultidisciplinaryTeamNotes />}
                />
                <Route path="care-plan-and-goals" element={<CarePlanAndGoals />} />
                <Route path="discharge-planning" element={<DischargePlanning />} />
                <Route path="bedside-procedures-requests" element={<BedsideProceduresRequests />} />
                <Route path="day-case" element={<DayCaseContent />} />
                <Route path="blood-order" element={<BloodOrder />} />
                <Route path="intake-output-balance" element={<IntakeOutputBalance />} />
                <Route path="referral-request" element={<ReferralRequest />} />
                <Route path="iv-fluid-order" element={<IVFluidOrder />} />
                <Route path="morse-fall-scale" element={<MorseFallScale />} />
                <Route path="stratify-scale" element={<StratifyScale />} />
                <Route path="hendrich-fall-risk" element={<HendrichFallRisk />} />
                <Route path="nutrition-state-asssessment" element={<NutritionStateAsssessment />} />
                <Route path="dietary-request" element={<DietaryRequest />} />
                <Route path="medication-administration-record" element={<MAR />} />
                <Route path="physiotherapy-plan" element={<PhysiotherapyPlan />} />
                <Route path="occupational-therapy" element={<OccupationalTherapy />} />
                <Route path="speech-therapy" element={<SpeechTherapy />} />
                <Route path="iv-fluid-Administration" element={<IVFluidAdministration />} />
                <Route path="continuous-observation" element={<ContinuousObservations />} />
                <Route path="FLACC-neonates-pain-assessment" element={<NeonatesPainAssessment />} />
                <Route path="sliding-scale" element={<SlidingScale />} />
              </Route>
              <Route path="/doctor-round/round" element={<ViewRound />} />
              <Route path="/recovery-module" element={<Recovery />} />
              <Route path="procedure-module" element={<ProcedureModule />} />
              <Route path="encounter-list" element={<EncounterList />} />
              <Route path="inpatient-encounters-list" element={<InpatientList />} />
              <Route path="waiting-encounters-list" element={<InpatientWaitingLists />} />
              <Route path="day-case-list" element={<DayCaseList />} />
              <Route path="room" element={<Room />} />
              <Route path="merge-patient-files" element={<PatientMergeFiles />} />
              <Route path="nurse-station" element={<EncounterPreObservations />} />
              <Route path="inpatient-nurse-station" element={<InpatientNurseStation />} />
              <Route path="review-results" element={<ReviewResults />} />
              <Route path="facilities" element={<Facilities />} />
              <Route path="access-roles" element={<AccessRoles />} />
              <Route path="lov-setup" element={<Lov />} />
              <Route path="visit-duration-setup" element={<VisitDurationSetup />} />
              <Route path="modules-setup" element={<Modules />} />
              <Route path="shift-setup" element={<Shifts />} />
              <Route
                path="user-access-patient-private"
                element={<EncounterPatientPrivateLogin />}
              />
              <Route path="vaccine-setup" element={<Vaccine />} />
              <Route path="checklists" element={<Checklist />} />
              <Route path="questionnaire-setup" element={<Questionnaire />} />
              <Route path="procedure-setup" element={<ProcedureSetup />} />
              <Route path="potintial-duplicate" element={<PotintialDuplicate />} />
              <Route path="users" element={<Users />} />
              <Route path="users-new" element={<UsersNew />} />
              <Route path="uom-group" element={<UOMGroup />} />
              <Route path="med-matrix-setup" element={<MedicationMatrix />} />
              <Route path="nurse-station" element={<EncounterPreObservations />} />
              <Route path="metadata" element={<Metadata />} />
              <Route path="dvm" element={<DVM />} />
              <Route path="practitioners" element={<Practitioners />} />
              <Route path="departments" element={<NewDepartments />} />
              <Route path="resources" element={<Resources />} />
              <Route path="diagnostics-test" element={<Diagnostics />} />
              <Route path="catalog" element={<Catalog />} />
              <Route path="allergens" element={<Allergens />} />
              <Route path="inventory-transaction" element={<InventoryTransaction />} />
              <Route path="inventory-product-setup" element={<ProductSetup />} />
              <Route path="inventory-transfer" element={<InventoryTransfer />} />
              <Route path="inventory-transfer-approval" element={<InventoryTransferApproval />} />
              <Route path="product-catalog" element={<ProductCatalog />} />
              <Route path="inventory-product-setup" element={<ProductSetup />} />
              <Route path="inventory-product-setup" element={<ProductSetup />} />
              <Route path="warehouse-setup" element={<WarehouseSetup />} />
              <Route path="warehouse-items-setup" element={<WarehouseItemsSetup />} />
              <Route path="active-ingredients" element={<ActiveIngredientsSetup />} />
              <Route path="age-group" element={<AgeGroup />} />
              <Route path="prescription-instructions" element={<PrescriptionInstructions />} />
              <Route path="brand-medications" element={<GenericMedications />} />
              <Route path="dental-actions" element={<DentalActions />} />
              <Route path="cdt-setup" element={<CDTSetup />} />
              <Route path="icd10-setup" element={<ICD10Setup />} />
              <Route path="cpt-setup" element={<CPTSetup />} />
              <Route path="loinc-setup" element={<LOINCSetup />} />
              <Route path="services-setup" element={<ServiceSetup />} />
              <Route path="surgical-kits-setup" element={<SurgicalKitsSetup />} />
              <Route path="error-404" element={<Error404Page />} />
              <Route path="error-403" element={<Error403Page />} />
              <Route path="error-500" element={<Error500Page />} />
              <Route path="error-503" element={<Error503Page />} />
              <Route path="playground" element={<Playground />} />
              <Route path="schedual-screen" element={<ScheduleScreen />} />
              <Route path="patient-EMR" element={<PatientEMR />} />
              <Route path="lab-module" element={<Lab />} />
              <Route path="rad-module" element={<Rad />} />
              <Route path="operation-module" element={<Operation />} />
              <Route path="operation-setup" element={<OperationSetup />} />
              <Route path="pharmacy-internal-orders" element={<InternalDrugOrder />} />
              <Route path="pharmacy-ePrescriptions" element={<EPrepscriptions />} />
              <Route path="pharmacy-controlled-medications" element={<ControlledMedications />} />
              <Route path="purchase-approvals-setup" element={<PurchaseApprovalSetup />} />
              <Route path="purchasing-requisition" element={<PurchasingRequisition />} />
              <Route path="list-of-requisition" element={<ListOfRequisition />} />
              <Route path="supplier-setup" element={<SupplierSetup />} />
              <Route path="operation-room-materials" element={<OperationRoomMaterials />} />
              <Route path="progress-notes" element={<ProgressNotes />} />
              <Route path="department-stock" element={<DepartmentStock />} />
              <Route path="physician-order-summary" element={<PhysicianOrderSummary />} />
              <Route path="medication-schedule" element={<MedicationSchedule />} />
              <Route path="language-setup" element={<LanguagesSetup />} />
              <Route path="service-and-products" element={<ServiceAndProducts />} />
            </Route>
          </Route>
          <Route path="reset-password" element={<ResetPassword />} />
          <Route path="login" element={<SignInPage />} />
          <Route path="*" element={<Error404Page />} />
        </Routes>
        <CallOverlay />
      </CustomProvider>
    </IntlProvider>
  );
};

export default App;
