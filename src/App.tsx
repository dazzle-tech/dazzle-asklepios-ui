import { Icon } from '@rsuite/icons';
import Box from '@mui/material/Box';
import React, {
  Suspense,
  lazy,
  useEffect,
  useMemo,
  useState
} from 'react';
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
import { useAppDispatch, useAppSelector } from './hooks';
import NetworkErrorImg from './images/network-error.png';
import locales from './locales';
import Error403Page from './pages/authentication/403';
import Error404Page from './pages/authentication/404';
import Error500Page from './pages/authentication/500';
import Error503Page from './pages/authentication/503';
import AuthGuard from './pages/authentication/AuthGuard';
import SignInPage from './pages/authentication/sign-in';
  const Dashboard = lazy(() => import('./pages/dashboard'));
  const ContinuousObservations = lazy(() => import ('./pages/encounter/continuous-observations/ContinuousObservations'));
  const DayCaseList= lazy (() => import('./pages/encounter/day-case/DayCaseList/DayCaseList'));
  const DentalProcedures = lazy (() => import ('./pages/encounter/dental-procedures/DentalProcedures'));
  const Dental = lazy (() => import ( './pages/encounter/dental-screen'));
  const ReferralRequest = lazy (() => import ( './pages/encounter/encounter-component/add-referral-request'));
  const AudiometryPuretone = lazy (() => import ( './pages/encounter/encounter-component/audiometry-puretone'));
  const BedsideProceduresRequests = lazy (() => import ( './pages/encounter/encounter-component/bedside-procedures-requests'));
  const BloodOrder = lazy (() => import ( './pages/encounter/encounter-component/blood-order'));
  const Cardiology = lazy (() => import ( './pages/encounter/encounter-component/cardiology'));
  const CarePlanAndGoals = lazy (() => import ( './pages/encounter/encounter-component/care-plan-and-goals'));
  const ConsultationNew = lazy (() => import ( './pages/encounter/encounter-component/consultation-new'));
  const DayCaseContent = lazy (() => import ( './pages/encounter/encounter-component/day-case-content'));
  const DiagnosticsOrderNew = lazy (() => import ( './pages/encounter/encounter-component/diagnostics-order-new'));
const DiagnosticsResult = lazy (() => import ( './pages/encounter/encounter-component/diagnostics-result/DiagnosticsResult'));
const DialysisRequest = lazy (() => import ( './pages/encounter/encounter-component/dialysis-request/DialysisRequest'));
const DietaryRequest = lazy (() => import ( './pages/encounter/encounter-component/dietary-request/DietaryRequests'));
const DischargePlanning = lazy (() => import ( './pages/encounter/encounter-component/discharged-planning'));
const DoctorRound = lazy (() => import ( './pages/encounter/encounter-component/doctor-round/DoctorRound'));
const ViewRound = lazy (() => import ( './pages/encounter/encounter-component/doctor-round/NewRound/ViewRound'));
const DrugOrderNew = lazy (() => import ( './pages/encounter/encounter-component/drug-order-new'));
const JohnsHopkinsTool = lazy (() => import ( './pages/encounter/encounter-component/fall-risk-assessments'));
const GlasgowComaScale = lazy (() => import ( './pages/encounter/encounter-component/glasgow-coma-scale'));
const HendrichFallRisk = lazy (() => import ( './pages/encounter/encounter-component/hendrich-fall-risk'));
const ICU = lazy (() => import ( './pages/encounter/encounter-component/i.c.u/ICU'));
const IntakeOutputBalance = lazy (() => import ( './pages/encounter/encounter-component/intake-output-balance'));
const IVFluidAdministration = lazy (() => import ( './pages/encounter/encounter-component/iv-fluid-administration/IVFluidAdministration'));
const IVFluidOrder = lazy (() => import ( './pages/encounter/encounter-component/iv-fluid-order'));
const MAR = lazy (() => import ( './pages/encounter/encounter-component/mar'));
const MedicationsRecord = lazy (() => import ( './pages/encounter/encounter-component/medications-record'));
const MorseFallScale = lazy (() => import ( './pages/encounter/encounter-component/morse-fall-scale'));
const MultidisciplinaryTeamNotes = lazy (() => import ( './pages/encounter/encounter-component/multidisciplinary-team-notes'));
const NutritionStateAsssessment = lazy (() => import ( './pages/encounter/encounter-component/nutrition-state-asssessment'));
const OccupationalTherapy = lazy (() => import ( './pages/encounter/encounter-component/occupational-therapy'));
const OperationRequestNew = lazy (() => import ( './pages/encounter/encounter-component/operation-request-new/OperationRequest'));
const OptometricExam = lazy (() => import ( './pages/encounter/encounter-component/optometric-exam'));
const SlidingScale = lazy (() => import ( './pages/encounter/encounter-component/order-details'));
const PatientHistory = lazy (() => import ( './pages/encounter/encounter-component/patient-history'));
const PatientSummary = lazy (() => import ( './pages/encounter/encounter-component/patient-summary'));
const PhysicianOrderSummary = lazy (() => import ( './pages/encounter/encounter-component/physician-order-summary/physician-order-summary-component'));
const PhysiotherapyPlan = lazy (() => import ( './pages/encounter/encounter-component/physiotherapy-plan'));
const PregnancyFollowup = lazy (() => import ( './pages/encounter/encounter-component/pregnancy-follow-up'));
const PrescriptionNew = lazy (() => import ( './pages/encounter/encounter-component/prescription-new'));
const PressureUlcerRiskAssessment = lazy (() => import ( './pages/encounter/encounter-component/pressure-ulce-risk-assessment'));
const ProcedureNew = lazy (() => import ( './pages/encounter/encounter-component/procedure-new/Procedure'));
const EncounterReport= lazy(()=> import ('./pages/encounter/PatientEncounterReportPage'));
const StimulsoftReportTemplateList = lazy(
  () =>
    import(
      /* webpackChunkName: "stimulsoft-report-list" */
      './pages/setup/stimulsoft-report-designer'
    )
);
const StimulsoftReportDesignerPage = lazy(
  () =>
    import(
      /* webpackChunkName: "stimulsoft-designer" */
      './pages/setup/stimulsoft-report-designer/StimulsoftReportDesignerPage'
    )
);
import { MODULES } from '@/config/modules-config';
const ApplyTemplateList = lazy (() => import ( './pages/appointments-new/ApplyTemplate/ApplyTemplateList'));
const ScheduleScreen = lazy (() => import ( './pages/appointments-new/scheduling-screen/ScheduleScreen'));
const Accounting = lazy (() => import ( './pages/billing-module'));
const CreatePassword = lazy (() => import ( './pages/create-password/CreatePassword'));
const InsuranceEligibilityRequests = lazy (() => import ( './pages/Waseel integration/insurance-eligibility-requests'));
const CreatePatientPassword = lazy (() => import ( './pages/patient/patient-profile/CreatePatientPassword'));
const ProgressNotes = lazy (() => import ( './pages/encounter/encounter-component/progress-notes/ProgressNotes'));
const PsychologicalExam = lazy (() => import ( './pages/encounter/encounter-component/psychological-exam'));
const SOAP = lazy (() => import ( './pages/encounter/encounter-component/s.o.a.p'));
const SpeechTherapy = lazy (() => import ( './pages/encounter/encounter-component/speech-therapy'));
const StratifyScale = lazy (() => import ( './pages/encounter/encounter-component/stratify-scale'));
const VaccineReccord = lazy (() => import ( './pages/encounter/encounter-component/vaccine-reccord'));
const VTERiskAssessment = lazy (() => import ( './pages/encounter/encounter-component/vte-risk-assessment'));
const EncounterList = lazy (() => import ( './pages/encounter/encounter-list'));
const EncounterPatientPrivateLogin = lazy (() => import ( './pages/encounter/encounter-patient-private'));
const Allergies = lazy (() => import ( './pages/encounter/encounter-pre-observations-new/AllergiesNurse'));
const EncounterPreObservationsNew = lazy (() => import ( './pages/encounter/encounter-pre-observations-new/EncounterPreObservations'));
const Observations = lazy (() => import ( './pages/encounter/encounter-pre-observations-new/observations/Observations'));
const VaccinationTab = lazy (() => import ( './pages/encounter/encounter-pre-observations-new/vaccination-tab'));
const Warning = lazy (() => import ( './pages/encounter/encounter-pre-observations-new/warning'));
const InpatientNurseStation = lazy (() => import ( './pages/encounter/encounter-pre-observations/InpatientNurseStation'));
const EncounterRegistration = lazy (() => import ( './pages/encounter/encounter-registration'));
const Encounter = lazy (() => import ( './pages/encounter/encounter-screen'));
const ERDashboardsNew = lazy (() => import ( './pages/encounter/ER-triage-new/Er-dashboard/ERDashboard'));
const ERTabsDepartmentAndWaitingListNew = lazy (() => import ( './pages/encounter/ER-triage-new/ERTabsDepartmentAndWaitingList'));
const ERStartTriageNew = lazy (() => import ( './pages/encounter/ER-triage-new/Triage/ERStartTriage'));
const ERTriageNew = lazy (() => import ( './pages/encounter/ER-triage-new/Triage/ERTriage'));
const QuickVisitNew = lazy (() => import ( './pages/encounter/ER-triage-new/Triage/QuickVisit'));
const ViewTriageNew = lazy (() => import ( './pages/encounter/ER-triage-new/Triage/ViewTriage'));
const NeonatesPainAssessment = lazy (() => import ( './pages/encounter/neonates-pain-assessment/NeonatesPainAssessment'));
const TeleconsultationScreen = lazy (() => import ( './pages/encounter/tele-consultation-screen'));
const StartTeleConsultation = lazy (() => import ( './pages/encounter/tele-consultation-screen/start-tele-consultation'));
const DepartmentStock = lazy (() => import ( './pages/Inpatient/departmentStock/DepartmentStock'));
const InpatientList = lazy (() => import ( './pages/Inpatient/inpatientList'));
const InpatientWaitingLists = lazy (() => import ( './pages/Inpatient/waitingList/InpatientWaitingLists'));
const ProductSetup = lazy (() => import ( './pages/inventory-management/product-setup/ProductSetup'));
const InventoryTransactionNew = lazy (() => import ( './pages/inventory-transaction/inventory-transaction-new'));
const InventoryTransferApproval = lazy (() => import ( './pages/inventory-transaction/inventory-transfer-approval'));
const InventoryTransferNew = lazy (() => import ( './pages/inventory-transaction/inventory-transfer-new'));
const ProductCatalog = lazy (() => import ( './pages/inventory-transaction/product-catalog'));
const Lab = lazy (() => import ( './pages/lab-module-new'));
const ListOfRequisition = lazy (() => import ( './pages/list-of-requisition'));
const ActiveIngredientsSetup = lazy (() => import ( './pages/medications/active-ingredients-setup-new/ActiveIngredientsSetup'));
const GenericMedications = lazy (() => import ( './pages/medications/generic-medications-new'));
const PrescriptionInstructions = lazy (() => import ( './pages/medications/prescription_instructions-new'));
const Operation = lazy (() => import ( './pages/operation-module'));
const OperationRoomMaterials = lazy (() => import ( './pages/operation-theater/operation-room-materials/OperationRoomMaterials'));
const PatientOldFacilityPatientList = lazy (() => import ( './pages/patient-old/facility-patient-list'));
const PatientChartLegacy = lazy (() => import ( './pages/patient-old/patient-chart'));
const PatientEMRLegacy = lazy (() => import ( './pages/patient-old/patient-emr'));
const PatientListLegacy = lazy (() => import ( './pages/patient-old/patient-list'));
const PatientMergeFilesLegacy = lazy (() => import ( './pages/patient-old/patient-merge-files'));
const PatientProfileOLD = lazy (() => import ( './pages/patient-old/patient-profile/PatientProfileCopy-new'));
const FacilityPatientList = lazy (() => import ( './pages/patient/facility-patient-list/FacilityPatientList'));
const PatientChart = lazy (() => import ( './pages/patient/patient-chart'));
const PatientEMR = lazy (() => import ( './pages/patient/patient-emr'));
const PatientList = lazy (() => import ( './pages/patient/patient-list'));
const PatientMergeFiles = lazy (() => import ( './pages/patient/patient-merge-files'));
const PatientProfileNew = lazy (() => import ( './pages/patient/patient-profile/PatientProfileCopy-new'));
const PatientQuickAppointment = lazy (() => import ( './pages/patient/patient-profile/PatientQuickAppoinment/PatientQuickAppointment'));
const ControlledMedications = lazy (() => import ( './pages/pharmacy/controlled-medications'));
const EPrepscriptions = lazy (() => import ( './pages/pharmacy/ePrescriptions/EPrescription'));
const InternalDrugOrder = lazy (() => import ( './pages/pharmacy/internal-drug-order'));
const Playground = lazy (() => import ( './pages/playground'));
const ProcedureModule = lazy (() => import ( './pages/procedure-module/ProcedureModule'));
const PurchasingRequisition = lazy (() => import ( './pages/purchasing-requisition/PurchasingRequisition'));
const Questionnaire = lazy (() => import ( './pages/questionnaire-setup/Questionnaire'));
const Rad = lazy (() => import ( './pages/rad-module/RadiologyMain'));
const Recovery = lazy (() => import ( './pages/recovery'));
const ResetPassword = lazy (() => import ( './pages/reset-password/ResetPassword'));
const AccessRoles = lazy (() => import ( './pages/setup/access-roles'));
const AgeGroupSetup = lazy (() => import ( './pages/setup/age-group'));
const Allergens = lazy (() => import ( './pages/setup/allergens-setup'));
const Room = lazy (() => import ( './pages/setup/bed-room-setup'));
const Catalog = lazy (() => import ( './pages/setup/catalog-setup-new'));
const CDTSetup = lazy (() => import ( './pages/setup/cdt-setup'));
const CPTSetup = lazy (() => import ( './pages/setup/cpt-setup'));
const DentalActions = lazy (() => import ( './pages/setup/dental-actions-new'));
const NewDepartments = lazy (() => import ( './pages/setup/departments-setup/Departments-new'));
const Diagnostics = lazy (() => import ( './pages/setup/diagnostics-tests-definition-new'));
const DVM = lazy (() => import ( './pages/setup/dvm-setup'));
const ICD10Setup = lazy (() => import ( './pages/setup/icd10-setup'));
const LOINCSetup = lazy (() => import ( './pages/setup/lonic-setup'));
const Lov = lazy (() => import ( './pages/setup/lov-setup'));
const MedicationMatrix = lazy (() => import ( './pages/setup/med-matrix-setup-new'));
const MedicationSchedule = lazy (() => import ( './pages/setup/medication-schedule-setup'));
const Metadata = lazy (() => import ( './pages/setup/metadata-view'));
const Modules = lazy (() => import ( './pages/setup/modules-setup'));
const OperationSetup = lazy (() => import ( './pages/setup/operation-setup'));
const Checklist = lazy (() => import ( './pages/setup/operations/checklist'));
const PotintialDuplicate = lazy (() => import ( './pages/setup/potential-duplicate - new'));
const Practitioners = lazy (() => import ( './pages/setup/practioners-setup-new'));
const ProcedureSetup = lazy (() => import ( './pages/setup/procedure-setup'));
const PurchaseApprovalSetup = lazy (() => import ( './pages/setup/purchase-approvals-setup/PurchaseApprovalSetup'));
const ReportResultTemplate = lazy (() => import ( './pages/setup/report-result-template'));
const ServiceSetup = lazy (() => import ( './pages/setup/service-setup'));
const Shifts = lazy (() => import ( './pages/setup/shift-setup'));
const SupplierSetup = lazy (() => import ( './pages/setup/supplier-setup/Supplier'));
const SurgicalKitsSetup = lazy (() => import ( './pages/setup/surgical-kits-setup'));
const UOMGroup = lazy (() => import ( './pages/setup/uom-group-new'));
const Vaccine = lazy (() => import ( './pages/setup/vaccine-setup'));
const VisitDurationSetup = lazy (() => import ( './pages/setup/visit-duration-setup'));
const PatientSatisfactionSurveyResponses = lazy(
  () => import('./pages/setup/patient-satisfaction-survey-responses')
);
const WarehouseItemsSetup = lazy (() => import ( './pages/setup/warehouse-Items-setup'));
const WarehouseSetup = lazy (() => import ( './pages/setup/warehouse-setup/WarehouseSetup'));
const Facilities = lazy (() => import ( './pages/system-configurations/facilities-setup'));
const UsersNew = lazy (() => import ( './pages/system-configurations/users-setup-new'));
const FacilityPatients = lazy (() => import ( './pages/patient/facility-patients/FacilityPatients'));
const PatientsEncounters = lazy (() => import ( './pages/patient/PatientsEncounters/PatientsEncounters'));
import 'survey-core/survey-core.min.css';
import 'survey-creator-core/survey-creator-core.min.css';
const FormTemplatesUseScreen = lazy (() => import ( './components/FormsTemplate/FormTemplatesUseScreen'));
const MyConsultations = lazy (() => import ( './components/MyConsultations/MyConsultations'));
const CallOverlay = lazy (() => import ( './components/Overlay/CallOverlay'));
const AvailabilityTemplatePageNew = lazy (() => import ( './pages/appointments-new/availability-template-new'));
const ErrorDepartmentTypePage = lazy (() => import ( './pages/authentication/error-department-type'));
const Claimscreen = lazy (() => import ( './pages/billing-module/billingClaims/Claims'));
const InsuranceReceivablesScreen = lazy(
  () => import('./pages/billing-module/insuranceReceivables/InsuranceReceivables')
);
const PriceLists = lazy (() => import ( './pages/billing-module/priceList/PriceLists'));
const Pediatric = lazy (() => import ( './pages/encounter/encounter-component/pediatric'));
const UccMedicationOrder = lazy (() => import ( './pages/encounter/encounter-component/ucc-medication-order'));
const NurseAssessment = lazy (() => import ( './pages/encounter/encounter-pre-observations-new/observation-PMH-Progress/nurse-assessment'));
const PhysicianAssessment = lazy (() => import ( './pages/encounter/encounter-pre-observations-new/physician-assessment/physician-assessment'));
const PreviousMeasurementsMainScreen = lazy (() => import ( './pages/encounter/encounter-pre-observations-new/previous-measurements/PreviousMeasurementsMainScreen'));
const ServiceAndProductsTab = lazy (() => import ( './pages/encounter/encounter-pre-observations-new/Service&Products/ServiceAndProducts'));
const UrgentCareStartTriage = lazy (() => import ( './pages/encounter/urgent-care/triage-urgent-care/UrgentCareStartTriage'));
const UrgentCareTriage = lazy (() => import ( './pages/encounter/urgent-care/triage-urgent-care/UrgentCareTriage'));
const UrgentCareViewTriage = lazy (() => import ( './pages/encounter/urgent-care/triage-urgent-care/UrgentCareViewTriage'));
const UrgentCareListMain = lazy (() => import ( './pages/encounter/urgent-care/UrgentCateListMain'));
const FormTemplates = lazy (() => import ( './pages/form-template/FormTemplate'));
const FormTemplateBuilderPage = lazy (() => import ( './pages/form-template/FormTemplateBuilderPage'));
const PatientSatisfactionSurveyPage = lazy(() => import('./pages/patient-satisfaction-survey/PatientSatisfactionSurveyPage'));
const IncidentPortal = lazy (() => import ( './pages/Incident/IncidentPortal'));
const InventoryManagementDepartmentStock = lazy (() => import ( './pages/inventory-management/departmentStock'));
const InventoryManagementTransaction = lazy (() => import ( './pages/inventory-management/inventory-transaction/inventory-transaction-new'));
const InventoryManagementTransferApproval = lazy (() => import ( './pages/inventory-management/inventory-transaction/inventory-transfer-approval'));
const InventoryManagementTransfer = lazy (() => import ( './pages/inventory-management/inventory-transaction/inventory-transfer-new'));
const InventoryManagementProductCatalog = lazy (() => import ( './pages/inventory-management/product-catalog'));
const InventoryManagementProductSetup = lazy (() => import ( './pages/inventory-management/product-setup/ProductSetup'));
const InventoryManagementWarehouseItemsSetup = lazy (() => import ( './pages/inventory-management/warehouse-Items-setup'));
const InventoryManagementWarehouseSetup = lazy (() => import ( './pages/inventory-management/warehouse-setup/WarehouseSetup'));
const FavoriteTests = lazy (() => import ( './pages/review-results'));
const AvailabilityTemplatePage = lazy (() => import ( './pages/setup/availability_template'));
const CountrySetup = React.lazy(() =>
    import('./pages/setup/country-setup/CountrySetup')
);
const CountryDistrictPage = lazy (() => import ( './pages/setup/country-setup/district-country/CountryDistrictPage'));
const Enums = lazy (() => import ( './pages/setup/Enums'));
const LanguagesSetup = lazy (() => import ( './pages/setup/language-setup/Language'));
const PayerSetup = lazy (() => import ( './pages/setup/payer-setup'));
const PolicyDefinitions = lazy (() => import ( './pages/setup/policy-definition'));
const SkillDefinitions = lazy (() => import ( './pages/setup/skill-definition'));
const OrganizationDefinition = lazy (() => import ( './pages/system-configurations/organization-definition'));
const EmailSettings = lazy (() => import ( './pages/system-configurations/email-settings'));
const WhatsAppSettings = lazy (() => import ( './pages/system-configurations/whatsapp-settings'));
const OrganizationHolidays = lazy (() => import ( './pages/system-configurations/organization-holidays'));
const NotificationRule = lazy (() => import ( './pages/notification-management/notification-rule'));
const EmailNotification = lazy (() => import ( './pages/notification-management/email-notification'));
const SmsNotification = lazy (() => import ( './pages/notification-management/sms-notification'));
const InAppNotification = lazy (() => import ( './pages/notification-management/in-app-notification'));
const WhatsAppNotification = lazy (() => import ( './pages/notification-management/whatsapp-notification'));
const PushNotification = lazy (() => import ( './pages/notification-management/push-notification'));

import { useLazyGetDepartmentByIdQuery } from './services/security/departmentService';
const PatientMergeConfig = lazy (() => import ( './pages/setup/patient-merge-config/PatientMergeConfig'));
import { setSelectedDepartment } from './reducers/authSlice';
import WaseelPreAuthorizationRequests from './pages/Waseel-integration/waseel-pre-authorization-module/waseel-pre-authorization-requests/WaseelPreAuthorizationRequests';
import SystemConfiguration from './pages/system-configurations/system-configuration-theme-setup';
import WaseelSbsSetup from '@/pages/setup/waseel-sbs-setup/WaseelSbsSetup';
import NphiesPayerSetup from './pages/setup/payer-setup/NphiesPayerSetup';
import PriceListSetup from './pages/setup/price-list-setup/PriceListSetup';
import BillingRuleSetup from './pages/setup/billing-rule-setup/BillingRuleSetup';
import BillingConfigurationSetup from './pages/setup/billing-configuration/BillingConfigurationSetup';
import FinancialDocumentNumberingSetup from './pages/setup/financial-document-numbering/FinancialDocumentNumberingSetup';
import TaxSetup from './pages/setup/tax-configuration/TaxSetup';
import DiscountSetup from './pages/setup/discount/DiscountSetup';
import { PUBLIC_PERMISSION_BYPASS_PATHS } from './config/publicRoutes';

const PUBLIC_PATHS = PUBLIC_PERMISSION_BYPASS_PATHS;

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

  const matchedCandidates = useMemo(() => {
    return MODULES.flatMap((module: any) =>
      (module.screens ?? [])
        .filter((screen: any) => norm(screen.navPath) === cleanPath)
        .map((screen: any) => ({ module, screen }))
    );
  }, [cleanPath]);

  const allowedCodes = useMemo(
    () =>
      new Set(
        ((authSlice.menu ?? []) as BackendMenuItem[]).map(x => String(x.screen ?? '').toUpperCase())
      ),
    [authSlice.menu]
  );

  const permittedCandidates = useMemo(() => {
    return matchedCandidates.filter(({ screen }) => {
      const code = screen?.code;
      if (!code) return true;
      return allowedCodes.has(String(code).toUpperCase());
    });
  }, [matchedCandidates, allowedCodes]);

  // Prefer a permitted module that does not require a department type (e.g. Waseel Integration),
  // otherwise fall back to the first permitted match.
  const selectedMatch =
    permittedCandidates.find(
      ({ module }) => !(module?.departmentTypes && module.departmentTypes.length > 0)
    ) ??
    permittedCandidates[0] ??
    matchedCandidates[0];

  const matchedModule = selectedMatch?.module;
  const matchedScreen = selectedMatch?.screen;

  const moduleDepartmentTypes = matchedModule?.departmentTypes ?? [];
  const requiresDepartmentTypeValidation = moduleDepartmentTypes.length > 0;

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

  if (requiredCode && permittedCandidates.length === 0) {
    return <Navigate to="/error-403" replace state={{ from: path }} />;
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
  const dispatch = useAppDispatch();
  const [navigationMap, setNavigationMap] = useState<any[]>([]);
  const navigate = useNavigate();
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'selectedDepartment') {
        const newDepartment = event.newValue
          ? JSON.parse(event.newValue)
          : null;

        dispatch(setSelectedDepartment(newDepartment));

        window.location.reload();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [dispatch]);
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
      <Suspense fallback={<SystemLoader open />}>
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
              <Route path="encounter-report" element={<EncounterReport/>}/>
              <Route path="report-designer" element={<StimulsoftReportTemplateList />} />
              <Route path="report-designer/new" element={<StimulsoftReportDesignerPage />} />
              <Route path="report-designer/:id" element={<StimulsoftReportDesignerPage />} />
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
              <Route path="tax-setup" element={<TaxSetup />} />
              <Route path="/district-country/:countryId" element={<CountryDistrictPage />} />
              <Route path="organization-definition" element={<OrganizationDefinition />} />
              <Route path="email-settings" element={<EmailSettings />} />
              <Route path="whatsapp-settings" element={<WhatsAppSettings />} />
              <Route path="organization-holidays" element={<OrganizationHolidays />} />
              <Route path="notification-rule" element={<NotificationRule />} />
              <Route path="email-notification" element={<EmailNotification />} />
              <Route path="sms-notification" element={<SmsNotification />} />
              <Route path="in-app-notification" element={<InAppNotification />} />
              <Route path="whatsapp-notification" element={<WhatsAppNotification />} />
              <Route path="push-notification" element={<PushNotification />} />
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

              <Route path="facility-patients" element={<FacilityPatients />} />
              <Route path="patients-encounters-list" element={<PatientsEncounters />} />
              <Route path="price-list" element={<PriceLists />} />
              <Route path="/doctor-round/round" element={<ViewRound />} />
              <Route path="/recovery-module" element={<Recovery />} />
              <Route path="procedure-module" element={<ProcedureModule />} />
              <Route path="waseel-pre-authorization-requests" element={<WaseelPreAuthorizationRequests />} />
              <Route path="encounter-list" element={<EncounterList />} />
              <Route path="inpatient-encounters-list" element={<InpatientList />} />
              <Route path="waiting-encounters-list" element={<InpatientWaitingLists />} />
              <Route path="day-case-list" element={<DayCaseList />} />
              <Route path="room" element={<Room />} />
              <Route path="discount-setup" element={<DiscountSetup />} />
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
              <Route
                path="patient-satisfaction-survey-responses"
                element={<PatientSatisfactionSurveyResponses />}
              />
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
              {/* <Route path="skill-definition" element={<SkillDefinitions />} /> */}

              <Route path="allergens" element={<Allergens />} />
              <Route path="inventory-transaction" element={<InventoryTransactionNew />} />
              <Route path="inventory-product-setup" element={<ProductSetup />} />
              <Route path="inventory-transfer" element={<InventoryTransferNew />} />
              <Route path="billing-accounting" element={<Accounting />} />
              <Route path="billing-claims" element={<Claimscreen />} />
              <Route
                path="insurance-receivables"
                element={<InsuranceReceivablesScreen />}
              />
              <Route
                path="insurance-eligibility-requests"
                element={<InsuranceEligibilityRequests />}
              />

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
              <Route path="/price-list-setup" element={<PriceListSetup />} />
              <Route path="/billing-rule-setup" element={<BillingRuleSetup />} />
               <Route path="/billing-configuration" element={<BillingConfigurationSetup />} />
               <Route path="/financial-document-numbering" element={<FinancialDocumentNumberingSetup />} />
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
              <Route path="waseel-sbs-setup" element={<WaseelSbsSetup />} />
              {/* <Route path="service-and-products" element={<ServiceAndProducts />} /> */}
              <Route path="enums" element={<Enums />} />
              {/* <Route path="service-and-products" element={<ServiceAndProducts />} /> */}
              <Route path="enums" element={<Enums />} />
              <Route path="payor-setup" element={<PayerSetup />} />
              <Route path="nphies-payers" element={<NphiesPayerSetup />} />
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
              <Route path="patient-merge-config" element={<PatientMergeConfig />} />
              <Route path="system-configuration" element={<SystemConfiguration />} />
            </Route>
          </Route>

          <Route path="reset-password" element={<ResetPassword />} />
          <Route path="create-password" element={<CreatePassword />} />
          <Route path="create-patient-password" element={<CreatePatientPassword />} />
          <Route path="patient-satisfaction-survey" element={<PatientSatisfactionSurveyPage />} />
          <Route path="login" element={<SignInPage />} />
          <Route path="*" element={<Error404Page />} />
        </Routes>
      </Suspense>

        <CallOverlay />
      </CustomProvider>

    </IntlProvider>
  );
};

export default App;
