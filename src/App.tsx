import { Icon } from '@rsuite/icons';
import Box from '@mui/material/Box';
import React, { useEffect, useMemo, useState } from 'react';
import * as icons from 'react-icons/fa6';
import { MdDashboard } from 'react-icons/md';
import { IntlProvider } from 'react-intl';
import { useSelector } from 'react-redux';
import { Navigate, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { CustomProvider } from 'rsuite';
import enGB from 'rsuite/locales/en_GB';
import Frame from './components/Frame';
import SystemLoader from './components/Loaders/SystemLoader';
import MyToast from './components/MyToast/MyToast';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import SessionExpiredBackdrop from './components/SessionExpiredBackdrop/SessionExpiredBackdrop';
import Translate from './components/Translate';
import { useAppSelector } from './hooks';
import NetworkErrorImg from './images/network-error.png';
import locales from './locales';
import Error403Page from './pages/authentication/403';
import Error404Page from './pages/authentication/404';
import Error500Page from './pages/authentication/500';
import Error503Page from './pages/authentication/503';
import AuthGuard from './pages/authentication/AuthGuard';
import SignInPage from './pages/authentication/sign-in';
import Dashboard from './pages/dashboard';
import ContinuousObservations from './pages/encounter/continuous-observations/ContinuousObservations';
import DayCaseList from './pages/encounter/day-case/DayCaseList/DayCaseList';
import DentalProcedures from './pages/encounter/dental-procedures/DentalProcedures';
import Dental from './pages/encounter/dental-screen';
import ReferralRequest from './pages/encounter/encounter-component/add-referral-request';
import AudiometryPuretone from './pages/encounter/encounter-component/audiometry-puretone';
import BedsideProceduresRequests from './pages/encounter/encounter-component/bedside-procedures-requests';
import BloodOrder from './pages/encounter/encounter-component/blood-order';
import Cardiology from './pages/encounter/encounter-component/cardiology';
import CarePlanAndGoals from './pages/encounter/encounter-component/care-plan-and-goals';
import ConsultationNew from './pages/encounter/encounter-component/consultation-new';
import DayCaseContent from './pages/encounter/encounter-component/day-case-content';
import DiagnosticsOrderNew from './pages/encounter/encounter-component/diagnostics-order-new';
import DiagnosticsResult from './pages/encounter/encounter-component/diagnostics-result/DiagnosticsResult';
import DialysisRequest from './pages/encounter/encounter-component/dialysis-request/DialysisRequest';
import DietaryRequest from './pages/encounter/encounter-component/dietary-request/DietaryRequests';
import DischargePlanning from './pages/encounter/encounter-component/discharged-planning';
import DoctorRound from './pages/encounter/encounter-component/doctor-round/DoctorRound';
import ViewRound from './pages/encounter/encounter-component/doctor-round/NewRound/ViewRound';
import DrugOrderNew from './pages/encounter/encounter-component/drug-order-new';
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
import OperationRequestNew from './pages/encounter/encounter-component/operation-request-new/OperationRequest';
import OptometricExam from './pages/encounter/encounter-component/optometric-exam';
import SlidingScale from './pages/encounter/encounter-component/order-details';
import PatientHistory from './pages/encounter/encounter-component/patient-history';
import PatientSummary from './pages/encounter/encounter-component/patient-summary';
import PhysicianOrderSummary from './pages/encounter/encounter-component/physician-order-summary/physician-order-summary-component';
import PhysiotherapyPlan from './pages/encounter/encounter-component/physiotherapy-plan';
import PregnancyFollowup from './pages/encounter/encounter-component/pregnancy-follow-up';
import PrescriptionNew from './pages/encounter/encounter-component/prescription-new';
import PressureUlcerRiskAssessment from './pages/encounter/encounter-component/pressure-ulce-risk-assessment';
import ProcedureNew from './pages/encounter/encounter-component/procedure-new/Procedure';

import { MODULES } from '@/config/modules-config';
import ApplyTemplateList from './pages/appointments-new/ApplyTemplate/ApplyTemplateList';
import ScheduleScreen from './pages/appointments-new/scheduling-screen/ScheduleScreen';
import Accounting from './pages/billing-module';
import CreatePassword from './pages/create-password/CreatePassword';
import CreatePatientPassword from './pages/patient/patient-profile/CreatePatientPassword';
import ProgressNotes from './pages/encounter/encounter-component/progress-notes/ProgressNotes';
import PsychologicalExam from './pages/encounter/encounter-component/psychological-exam';
import SOAP from './pages/encounter/encounter-component/s.o.a.p';
import SpeechTherapy from './pages/encounter/encounter-component/speech-therapy';
import StratifyScale from './pages/encounter/encounter-component/stratify-scale';
import VaccineReccord from './pages/encounter/encounter-component/vaccine-reccord';
import VTERiskAssessment from './pages/encounter/encounter-component/vte-risk-assessment';
import EncounterList from './pages/encounter/encounter-list';
import EncounterPatientPrivateLogin from './pages/encounter/encounter-patient-private';
import Allergies from './pages/encounter/encounter-pre-observations-new/AllergiesNurse';
import EncounterPreObservationsNew from './pages/encounter/encounter-pre-observations-new/EncounterPreObservations';
import Observations from './pages/encounter/encounter-pre-observations-new/observations/Observations';
import VaccinationTab from './pages/encounter/encounter-pre-observations-new/vaccination-tab';
import Warning from './pages/encounter/encounter-pre-observations-new/warning';
import InpatientNurseStation from './pages/encounter/encounter-pre-observations/InpatientNurseStation';
import EncounterRegistration from './pages/encounter/encounter-registration';
import Encounter from './pages/encounter/encounter-screen';
import ERDashboardsNew from './pages/encounter/ER-triage-new/Er-dashboard/ERDashboard';
import ERTabsDepartmentAndWaitingListNew from './pages/encounter/ER-triage-new/ERTabsDepartmentAndWaitingList';
import ERStartTriageNew from './pages/encounter/ER-triage-new/Triage/ERStartTriage';
import ERTriageNew from './pages/encounter/ER-triage-new/Triage/ERTriage';
import QuickVisitNew from './pages/encounter/ER-triage-new/Triage/QuickVisit';
import ViewTriageNew from './pages/encounter/ER-triage-new/Triage/ViewTriage';
import NeonatesPainAssessment from './pages/encounter/neonates-pain-assessment/NeonatesPainAssessment';
import TeleconsultationScreen from './pages/encounter/tele-consultation-screen';
import StartTeleConsultation from './pages/encounter/tele-consultation-screen/start-tele-consultation';
import DepartmentStock from './pages/Inpatient/departmentStock/DepartmentStock';
import InpatientList from './pages/Inpatient/inpatientList';
import InpatientWaitingLists from './pages/Inpatient/waitingList/InpatientWaitingLists';
import ProductSetup from './pages/inventory-management/product-setup/ProductSetup';
import InventoryTransactionNew from './pages/inventory-transaction/inventory-transaction-new';
import InventoryTransferApproval from './pages/inventory-transaction/inventory-transfer-approval';
import InventoryTransferNew from './pages/inventory-transaction/inventory-transfer-new';
import ProductCatalog from './pages/inventory-transaction/product-catalog';
import Lab from './pages/lab-module-new';
import ListOfRequisition from './pages/list-of-requisition';
import ActiveIngredientsSetup from './pages/medications/active-ingredients-setup-new/ActiveIngredientsSetup';
import GenericMedications from './pages/medications/generic-medications-new';
import PrescriptionInstructions from './pages/medications/prescription_instructions-new';
import Operation from './pages/operation-module';
import OperationRoomMaterials from './pages/operation-theater/operation-room-materials/OperationRoomMaterials';
import PatientOldFacilityPatientList from './pages/patient-old/facility-patient-list';
import PatientChartLegacy from './pages/patient-old/patient-chart';
import PatientEMRLegacy from './pages/patient-old/patient-emr';
import PatientListLegacy from './pages/patient-old/patient-list';
import PatientMergeFilesLegacy from './pages/patient-old/patient-merge-files';
import PatientProfileOLD from './pages/patient-old/patient-profile/PatientProfileCopy-new';
import FacilityPatientList from './pages/patient/facility-patient-list/FacilityPatientList';
import PatientChart from './pages/patient/patient-chart';
import PatientEMR from './pages/patient/patient-emr';
import PatientList from './pages/patient/patient-list';
import PatientMergeFiles from './pages/patient/patient-merge-files';
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
import AccessRoles from './pages/setup/access-roles';
import AgeGroupSetup from './pages/setup/age-group';
import Allergens from './pages/setup/allergens-setup';
import Room from './pages/setup/bed-room-setup';
import Catalog from './pages/setup/catalog-setup-new';
import CDTSetup from './pages/setup/cdt-setup';
import CPTSetup from './pages/setup/cpt-setup';
import DentalActions from './pages/setup/dental-actions-new';
import NewDepartments from './pages/setup/departments-setup/Departments-new';
import Diagnostics from './pages/setup/diagnostics-tests-definition-new';
import DVM from './pages/setup/dvm-setup';
import ICD10Setup from './pages/setup/icd10-setup';
import LOINCSetup from './pages/setup/lonic-setup';
import Lov from './pages/setup/lov-setup';
import MedicationMatrix from './pages/setup/med-matrix-setup-new';
import MedicationSchedule from './pages/setup/medication-schedule-setup';
import Metadata from './pages/setup/metadata-view';
import Modules from './pages/setup/modules-setup';
import OperationSetup from './pages/setup/operation-setup';
import Checklist from './pages/setup/operations/checklist';
import PotintialDuplicate from './pages/setup/potential-duplicate - new';
import Practitioners from './pages/setup/practioners-setup-new';
import ProcedureSetup from './pages/setup/procedure-setup';
import PurchaseApprovalSetup from './pages/setup/purchase-approvals-setup/PurchaseApprovalSetup';
import ReportResultTemplate from './pages/setup/report-result-template';
import ServiceSetup from './pages/setup/service-setup';
import Shifts from './pages/setup/shift-setup';
import SupplierSetup from './pages/setup/supplier-setup/Supplier';
import SurgicalKitsSetup from './pages/setup/surgical-kits-setup';
import UOMGroup from './pages/setup/uom-group-new';
import Vaccine from './pages/setup/vaccine-setup';
import VisitDurationSetup from './pages/setup/visit-duration-setup';
import WarehouseItemsSetup from './pages/setup/warehouse-Items-setup';
import WarehouseSetup from './pages/setup/warehouse-setup/WarehouseSetup';
import Facilities from './pages/system-configurations/facilities-setup';
import UsersNew from './pages/system-configurations/users-setup-new';

import 'survey-core/survey-core.min.css';
import 'survey-creator-core/survey-creator-core.min.css';
import FormTemplatesUseScreen from './components/FormsTemplate/FormTemplatesUseScreen';
import MyConsultations from './components/MyConsultations/MyConsultations';
import CallOverlay from './components/Overlay/CallOverlay';
import AvailabilityTemplatePageNew from './pages/appointments-new/availability-template-new';
import ErrorDepartmentTypePage from './pages/authentication/error-department-type';
import Claimscreen from './pages/billing-module/billingClaims/Claims';
import PriceLists from './pages/billing-module/priceList/PriceLists';
import Pediatric from './pages/encounter/encounter-component/pediatric';
import UccMedicationOrder from './pages/encounter/encounter-component/ucc-medication-order';
import NurseAssessment from './pages/encounter/encounter-pre-observations-new/observation-PMH-Progress/nurse-assessment';
import PhysicianAssessment from './pages/encounter/encounter-pre-observations-new/physician-assessment/physician-assessment';
import PreviousMeasurementsMainScreen from './pages/encounter/encounter-pre-observations-new/previous-measurements/PreviousMeasurementsMainScreen';
import ServiceAndProductsTab from './pages/encounter/encounter-pre-observations-new/Service&Products/ServiceAndProducts';
import UrgentCareStartTriage from './pages/encounter/urgent-care/triage-urgent-care/UrgentCareStartTriage';
import UrgentCareTriage from './pages/encounter/urgent-care/triage-urgent-care/UrgentCareTriage';
import UrgentCareViewTriage from './pages/encounter/urgent-care/triage-urgent-care/UrgentCareViewTriage';
import UrgentCareListMain from './pages/encounter/urgent-care/UrgentCateListMain';
import FormTemplates from './pages/form-template/FormTemplate';
import FormTemplateBuilderPage from './pages/form-template/FormTemplateBuilderPage';
import IncidentPortal from './pages/Incident/IncidentPortal';
import InventoryManagementDepartmentStock from './pages/inventory-management/departmentStock';
import InventoryManagementTransaction from './pages/inventory-management/inventory-transaction/inventory-transaction-new';
import InventoryManagementTransferApproval from './pages/inventory-management/inventory-transaction/inventory-transfer-approval';
import InventoryManagementTransfer from './pages/inventory-management/inventory-transaction/inventory-transfer-new';
import InventoryManagementProductCatalog from './pages/inventory-management/product-catalog';
import InventoryManagementProductSetup from './pages/inventory-management/product-setup/ProductSetup';
import InventoryManagementWarehouseItemsSetup from './pages/inventory-management/warehouse-Items-setup';
import InventoryManagementWarehouseSetup from './pages/inventory-management/warehouse-setup/WarehouseSetup';
import FavoriteTests from './pages/review-results';
import AvailabilityTemplatePage from './pages/setup/availability_template';
import CountrySetup from './pages/setup/country-setup/CountrySetup';
import CountryDistrictPage from './pages/setup/country-setup/district-country/CountryDistrictPage';
import Enums from './pages/setup/Enums';
import LanguagesSetup from './pages/setup/language-setup/Language';
import PayerSetup from './pages/setup/payer-setup';
import PolicyDefinitions from './pages/setup/policy-definition';
import OrganizationDefinition from './pages/system-configurations/organization-definition';
import OrganizationHolidays from './pages/system-configurations/organization-holidays';
import { useLazyGetDepartmentByIdQuery } from './services/security/departmentService';
const PUBLIC_PATHS = new Set([
  '/login',
  '/reset-password',
  '/error-403',
  '/error-404',
  '/error-500',
  '/error-503',
  '/error-department-type'
]);

const norm = (s?: string | null) => (s ?? '').toLowerCase().trim().replace(/^\/+/, '');

type BackendMenuItem = {
  module?: string | null;
  label?: string | null;
  screen?: string | null;
};

function ParentPermissionGuard() {
  const location = useLocation();
  const authSlice = useAppSelector(s => s.auth);

  const path = location.pathname || '/';
  const cleanPath = norm(path.split('?')[0]);
  const selectedDepartment = authSlice.selectedDepartment;
  const selectedDepartmentId = selectedDepartment?.departmentId;

  const [getDepartmentById, { data: department, isLoading, isFetching, error }] =
    useLazyGetDepartmentByIdQuery();

  const matchedModule = MODULES.find((m: any) =>
    (m.screens ?? []).some((s: any) => norm(s.navPath) === cleanPath)
  );

  const matchedScreen = matchedModule?.screens?.find((s: any) => norm(s.navPath) === cleanPath);

  const moduleDepartmentTypes = matchedModule?.departmentTypes ?? [];
  const requiresDepartmentTypeValidation = moduleDepartmentTypes.length > 0;

  const allowedCodes = useMemo(
    () =>
      new Set(
        ((authSlice.menu ?? []) as BackendMenuItem[]).map(x => String(x.screen ?? '').toUpperCase())
      ),
    [authSlice.menu]
  );

  useEffect(() => {
    if (!requiresDepartmentTypeValidation) return;
    if (!selectedDepartmentId) return;

    getDepartmentById(selectedDepartmentId, true);
  }, [requiresDepartmentTypeValidation, selectedDepartmentId, getDepartmentById]);

  if (PUBLIC_PATHS.has(path)) return <Outlet />;
  if (!authSlice?.menu) return <Outlet />;
  if (!cleanPath) return <Outlet />;
  if (!matchedModule || !matchedScreen) return <Outlet />;

  const requiredCode = matchedScreen.code;

  if (requiredCode) {
    const hasPermission = allowedCodes.has(String(requiredCode).toUpperCase());

    if (!hasPermission) {
      return <Navigate to="/error-403" replace state={{ from: path }} />;
    }
  }

  if (!requiresDepartmentTypeValidation) {
    return <Outlet />;
  }

  if (!selectedDepartmentId) {
    return (
      <Navigate
        to="/error-department-type"
        replace
        state={{
          from: path,
          message: 'Please select a department first.',
          currentType: null,
          allowedTypes: moduleDepartmentTypes
        }}
      />
    );
  }

  if (isLoading || isFetching) {
    return <Outlet />;
  }

  if (error) {
    return (
      <Navigate
        to="/error-department-type"
        replace
        state={{
          from: path,
          message: 'Unable to validate current department type.',
          currentType: null,
          allowedTypes: moduleDepartmentTypes
        }}
      />
    );
  }

  const currentDepartmentType = String(department?.departmentType ?? '').toUpperCase();
  const allowedDepartmentTypes = moduleDepartmentTypes.map((x: string) => String(x).toUpperCase());

  if (!currentDepartmentType) {
    return <Outlet />;
  }

  const isCompatible = allowedDepartmentTypes.includes(currentDepartmentType);

  if (!isCompatible) {
    return (
      <Navigate
        to="/error-department-type"
        replace
        state={{
          from: path,
          message: 'Current Department type is not compatible with this module.',
          currentType: currentDepartmentType,
          allowedTypes: allowedDepartmentTypes
        }}
      />
    );
  }

  return <Outlet />;
}

const App = () => {
  const authSlice = useAppSelector(state => state.auth);
  const uiSlice = useAppSelector(state => state.ui);
  const mode = useSelector((state: any) => state.ui.mode);

  const [navigationMap, setNavigationMap] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        const token = localStorage.getItem('token');
        if (!token) navigate('/login', { replace: true });
      }
    };

    window.addEventListener('pageshow', onPageShow);
    return () => window.removeEventListener('pageshow', onPageShow);
  }, [navigate]);

  // ------------------------------ MENU BUILD HELPERS ---------------------------
  type BackendMenuItem = { module?: string | null; label?: string | null; screen?: string | null };

  const buildPermissionLookup = (menuItems: BackendMenuItem[]) => {
    const globalAllowed = new Set<string>();
    const moduleAllowed = new Map<string, Set<string>>();

    for (const m of menuItems ?? []) {
      const nLabel = m.label;
      const nScreen = m.screen ?? '';
      const nModule = m.module;

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
    screen: { name: string; code: string; navPath: string },
    moduleName: string,
    lookups: { globalAllowed: Set<string>; moduleAllowed: Map<string, Set<string>> }
  ) => {
    const { globalAllowed, moduleAllowed } = lookups;
    const nScreenName = screen.name;
    const nScreenCode = screen.code;
    const nNavPath = screen.navPath;
    const nModule = moduleName;
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
    if (!authSlice?.menu) return;
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

    // // Always show Availability Templates (bypass permissions)
    // navsTemp.push({
    //   eventKey: 'nav:availability-templates',
    //   icon: <Icon as={icons.FaCalendarDays} />,
    //   title: 'Availability Templates',
    //   to: '/availability-template'
    // });

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
            title: screen.name,
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
      {/* <div style={{ position: 'fixed', right: '1%', bottom: '1%', zIndex: 1000, color: 'grey' }}>
        <img
          style={{ height: '40px', width: '110px' }}
          src={Logo}

        />
       
      </div> */}

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
      <SessionExpiredBackdrop />
      <CustomProvider locale={enGB}>
        <Routes>
          <Route
            element={
              <AuthGuard>
                <ProtectedRoute>
                  <Box sx={{ position: 'relative', minHeight: '100vh' }}>

                    {/* Overlay Loader */}
                    {uiSlice.loading && (
                      <Box
                        sx={{
                          position: 'fixed',
                          inset: 0,
                          zIndex: 9999,
                          bgcolor: 'rgba(0, 0, 0, 0.45)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <SystemLoader open />
                      </Box>
                    )}

                    {/* Main Content */}
                    <ParentPermissionGuard />

                  </Box>
                </ProtectedRoute>
              </AuthGuard>
            }
          >
            {/* {/* protected routes (needs authintication) */}
            {/* TODO load them dynamically based on user authorization matrix */}
            <Route path="/" element={<Frame navs={navigationMap} mode={mode} />}>
              <Route index element={<Dashboard />} />
              <Route path="incident-portal" element={<IncidentPortal />} />
              <Route path="my-consultations" element={<MyConsultations />} />
              <Route
                path="patient-quick-appointment"
                element={<PatientQuickAppointment {...({} as any)} />}
              />
              <Route path="patient-profile" element={<PatientProfileNew />} />
              <Route path="patient-chart" element={<PatientChart />} />
              <Route path="patient-list" element={<PatientList />} />
              <Route path="tele-consultation-screen" element={<TeleconsultationScreen />} />
              <Route path="start-tele-consultation" element={<StartTeleConsultation />} />
              <Route path="encounter-registration" element={<EncounterRegistration />} />
              <Route path="information-desk" element={<FacilityPatientList />} />
              <Route path="patient-old/patient-profile" element={<PatientProfileOLD />} />
              <Route
                path="patient-old/facility-patient-list"
                element={<PatientOldFacilityPatientList />}
              />
              <Route path="patient-old/patient-chart" element={<PatientChartLegacy />} />
              <Route path="patient-old/patient-emr" element={<PatientEMRLegacy />} />
              <Route path="patient-old/patient-list" element={<PatientListLegacy />} />
              <Route path="patient-old/patient-merge-files" element={<PatientMergeFilesLegacy />} />
              <Route path="ER-start-triage" element={<ERStartTriageNew />} />
              <Route path="urgent-care-start-triage" element={<UrgentCareStartTriage />} />
              <Route path="urgent-care-department-list" element={<UrgentCareListMain />} />
              <Route path="ER-triage" element={<ERTriageNew />} />
              <Route path="ER-dashboard" element={<ERDashboardsNew />} />
              <Route path="ER-department" element={<ERTabsDepartmentAndWaitingListNew />} />
              <Route path="urgent-care-triage" element={<UrgentCareTriage />} />
              <Route path="view-triage" element={<ViewTriageNew />} />
              <Route path="urgent-care-view-triage" element={<UrgentCareViewTriage />} />
              <Route path="quick-visit" element={<QuickVisitNew />} />
              <Route path="report-result-template" element={<ReportResultTemplate />} />
              <Route path="country-setup" element={<CountrySetup />} />
              <Route path="/district-country/:countryId" element={<CountryDistrictPage />} />
              <Route path="organization-definition" element={<OrganizationDefinition />} />
              <Route path="organization-holidays" element={<OrganizationHolidays />} />
              <Route path="encounter" element={<Encounter />}>
                <Route path="nurse-assessment" element={<NurseAssessment />} />
                <Route path="physician-assessment" element={<PhysicianAssessment />} />
                <Route path="progress-notes" element={<ProgressNotes />} />

                <Route
                  path="pressure-ulce-risk-assessment"
                  element={<PressureUlcerRiskAssessment />}
                />
                <Route path="vte-risk-assessment" element={<VTERiskAssessment />} />
                <Route path="glasgow-coma-scale" element={<GlasgowComaScale />} />
                <Route path="medication-order" element={<DrugOrderNew />} />
                <Route path="pregnancy-follow-up" element={<PregnancyFollowup />} />
                <Route path="drug-order" element={<DrugOrderNew />} />
                <Route index element={<PatientSummary />} />
                <Route path="clinical-visit" element={<SOAP />} />
                <Route path="observations" element={<Observations />} />
                <Route path="previous-measurements" element={<PreviousMeasurementsMainScreen />} />
                <Route path="allergies" element={<Allergies />} />
                <Route path="medical-warnings" element={<Warning />} />
                <Route path="cardiology" element={<Cardiology />} />
                <Route path="dental-care" element={<Dental />} />
                <Route path="dental-procedures" element={<DentalProcedures />} />
                <Route path="optometric-exam" element={<OptometricExam />} />
                <Route path="johns-hopkins-tool" element={<JohnsHopkinsTool />} />
                <Route path="audiometry" element={<AudiometryPuretone />} />
                <Route path="psychological-exam" element={<PsychologicalExam {...({} as any)} />} />
                <Route path="vaccination" element={<VaccinationTab {...({} as any)} />} />
                <Route path="prescription" element={<PrescriptionNew />} />
                <Route path="diagnostics-order" element={<DiagnosticsOrderNew />} />
                <Route path="consultation" element={<ConsultationNew />} />
                <Route path="procedures" element={<ProcedureNew />} />
                <Route path="patient-history" element={<PatientHistory {...({} as any)} />} />
                <Route path="medications-record" element={<MedicationsRecord />} />
                <Route path="vaccine-record" element={<VaccineReccord />} />
                <Route path="diagnostics-result" element={<DiagnosticsResult />} />
                <Route path="dialysis-request" element={<DialysisRequest />} />
                <Route path="ucc-medication-order" element={<UccMedicationOrder />} />
                <Route path="operation-request" element={<OperationRequestNew />} />
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
                <Route path="iv-fluid-order" element={<IVFluidOrder {...({} as any)} />} />
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
                <Route path="form-template-use" element={<FormTemplatesUseScreen />} />
                <Route
                  path="service-and-products"
                  element={<ServiceAndProductsTab {...({} as any)} />}
                />
              </Route>
              <Route path="price-list" element={<PriceLists />} />
              <Route path="/doctor-round/round" element={<ViewRound />} />
              <Route path="/recovery-module" element={<Recovery />} />
              <Route path="procedure-module" element={<ProcedureModule />} />
              <Route path="encounter-list" element={<EncounterList />} />
              <Route path="inpatient-encounters-list" element={<InpatientList />} />
              <Route path="waiting-encounters-list" element={<InpatientWaitingLists />} />
              <Route path="day-case-list" element={<DayCaseList />} />
              <Route path="room" element={<Room />} />
              <Route path="merge-patient-files" element={<PatientMergeFiles />} />
              <Route path="nurse-station" element={<EncounterPreObservationsNew />}>
                <Route path="nurse-assessment" element={<NurseAssessment />} />
                <Route path="physician-assessment" element={<PhysicianAssessment />} />
                <Route path="progress-notes" element={<ProgressNotes />} />
                <Route
                  path="pressure-ulce-risk-assessment"
                  element={<PressureUlcerRiskAssessment />}
                />
                <Route path="previous-measurements" element={<PreviousMeasurementsMainScreen />} />
                <Route
                  path="service-and-products"
                  element={<ServiceAndProductsTab {...({} as any)} />}
                />
                <Route path="vte-risk-assessment" element={<VTERiskAssessment />} />
                <Route path="glasgow-coma-scale" element={<GlasgowComaScale />} />
                <Route path="medication-order" element={<DrugOrderNew />} />
                <Route path="pregnancy-follow-up" element={<PregnancyFollowup />} />
                <Route path="drug-order" element={<DrugOrderNew />} />
                <Route index element={<Observations />} />
                <Route path="clinical-visit" element={<SOAP />} />
                <Route path="observations" element={<Observations />} />
                <Route path="allergies" element={<Allergies />} />
                <Route path="medical-warnings" element={<Warning />} />
                <Route path="cardiology" element={<Cardiology />} />
                <Route path="dental-care" element={<Dental />} />
                <Route path="dental-procedures" element={<DentalProcedures />} />
                <Route path="optometric-exam" element={<OptometricExam />} />
                <Route path="johns-hopkins-tool" element={<JohnsHopkinsTool />} />
                <Route path="audiometry" element={<AudiometryPuretone />} />
                <Route path="psychological-exam" element={<PsychologicalExam {...({} as any)} />} />
                <Route path="vaccination" element={<VaccinationTab {...({} as any)} />} />
                <Route path="prescription" element={<PrescriptionNew />} />
                <Route path="diagnostics-order" element={<DiagnosticsOrderNew />} />
                <Route path="consultation" element={<ConsultationNew />} />
                <Route path="procedures" element={<ProcedureNew />} />
                <Route path="patient-history" element={<PatientHistory {...({} as any)} />} />
                <Route path="medications-record" element={<MedicationsRecord />} />
                <Route path="vaccine-record" element={<VaccineReccord />} />
                <Route path="diagnostics-result" element={<DiagnosticsResult />} />
                <Route path="dialysis-request" element={<DialysisRequest />} />
                <Route path="operation-request" element={<OperationRequestNew />} />
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
                <Route path="iv-fluid-order" element={<IVFluidOrder {...({} as any)} />} />
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
              <Route path="inpatient-nurse-station" element={<InpatientNurseStation />} />
              <Route path="review-results" element={<FavoriteTests />} />
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
              <Route path="users-new" element={<UsersNew />} />
              <Route path="uom-group" element={<UOMGroup />} />
              <Route path="med-matrix-setup" element={<MedicationMatrix />} />
              <Route path="nurse-station" element={<EncounterPreObservationsNew />} />
              <Route path="metadata" element={<Metadata />} />
              <Route path="dvm" element={<DVM />} />
              <Route path="practitioners" element={<Practitioners />} />
              <Route path="departments" element={<NewDepartments />} />
              <Route path="diagnostics-test" element={<Diagnostics />} />
              <Route path="catalog" element={<Catalog />} />
              <Route path="policy-definition" element={<PolicyDefinitions />} />
              <Route path="allergens" element={<Allergens />} />
              <Route path="inventory-transaction" element={<InventoryTransactionNew />} />
              <Route path="inventory-product-setup" element={<ProductSetup />} />
              <Route path="inventory-transfer" element={<InventoryTransferNew />} />
              <Route path="billing-accounting" element={<Accounting />} />
              <Route path="billing-claims" element={<Claimscreen />} />

              <Route path="inventory-transfer-approval" element={<InventoryTransferApproval />} />
              <Route path="product-catalog" element={<ProductCatalog />} />
              {/* <Route path="inventory-product-setup" element={<ProductSetup />} /> */}
              {/* <Route path="inventory-product-setup" element={<ProductSetup />} /> */}
              <Route path="warehouse-setup" element={<WarehouseSetup />} />
              <Route path="warehouse-items-setup" element={<WarehouseItemsSetup />} />
              <Route path="active-ingredients" element={<ActiveIngredientsSetup />} />
              <Route path="age-group" element={<AgeGroupSetup />} />
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
              <Route path="error-department-type" element={<ErrorDepartmentTypePage />} />
              <Route path="playground" element={<Playground />} />
              <Route path="schedual-screen" element={<ScheduleScreen />} />
              <Route path="apply-template" element={<ApplyTemplateList />} />
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
              {/* <Route path="service-and-products" element={<ServiceAndProducts />} /> */}
              <Route path="enums" element={<Enums />} />
              {/* <Route path="service-and-products" element={<ServiceAndProducts />} /> */}
              <Route path="enums" element={<Enums />} />
              <Route path="payor-setup" element={<PayerSetup />} />
              <Route
                path="inventory-management-product-setup"
                element={<InventoryManagementProductSetup />}
              />
              <Route
                path="inventory-management-transaction"
                element={<InventoryManagementTransaction />}
              />
              <Route
                path="inventory-management-transfer"
                element={<InventoryManagementTransfer />}
              />
              <Route
                path="inventory-management-transfer-approval"
                element={<InventoryManagementTransferApproval />}
              />
              <Route
                path="inventory-management-product-catalog"
                element={<InventoryManagementProductCatalog />}
              />
              <Route
                path="inventory-management-warehouse-setup"
                element={<InventoryManagementWarehouseSetup />}
              />
              <Route
                path="inventory-management-warehouse-items-setup"
                element={<InventoryManagementWarehouseItemsSetup />}
              />
              <Route
                path="inventory-management-department-stock"
                element={<InventoryManagementDepartmentStock />}
              />
              <Route path="form-template-use" element={<FormTemplatesUseScreen />} />
              <Route path="form-template" element={<FormTemplates />} />
              <Route path="form-template/new" element={<FormTemplateBuilderPage />} />
              <Route path="form-template/:id" element={<FormTemplateBuilderPage />} />
              <Route path="availability-template" element={<AvailabilityTemplatePage />} />
              <Route path="availability-templates" element={<AvailabilityTemplatePageNew />} />
              <Route path="nurse-assessment" element={<NurseAssessment />} />
              <Route path="physician-assessment" element={<PhysicianAssessment />} />
            </Route>
          </Route>
          <Route path="reset-password" element={<ResetPassword />} />
          <Route path="create-password" element={<CreatePassword />} />
          <Route path="create-patient-password" element={<CreatePatientPassword />} />
          <Route path="login" element={<SignInPage />} />
          <Route path="*" element={<Error404Page />} />
        </Routes>
        <CallOverlay />
      </CustomProvider>
    </IntlProvider>
  );
};

export default App;
