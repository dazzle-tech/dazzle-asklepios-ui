import React, { useEffect, useState } from 'react';
import { Routes, Route, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { IntlProvider } from 'react-intl';
import { CustomProvider } from 'rsuite';
import enGB from 'rsuite/locales/en_GB';
import locales from './locales';
import Frame from './components/Frame';
import Error404Page from './pages/authentication/404';
import Error403Page from './pages/authentication/403';
import Error500Page from './pages/authentication/500';
import Error503Page from './pages/authentication/503';
import SignInPage from './pages/authentication/sign-in';
import Allergens from './pages/setup/allergens-setup';
import { useAppDispatch, useAppSelector } from './hooks';
import MyToast from './components/MyToast/MyToast';
import NetworkErrorImg from './images/network-error.png';
import PatientChart from './pages/patient/patient-chart';
import { Icon } from '@rsuite/icons';
import { MdDashboard } from 'react-icons/md';
import PatientList from './pages/patient/patient-list';
import Dashboard from './pages/dashboard';
import { useLoadTenantQuery } from '@/services/authService';
import config from '../app-config';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import SessionExpiredBackdrop from './components/SessionExpiredBackdrop/SessionExpiredBackdrop';
import { useLoadNavigationMapQuery } from './services/uiService';
import Facilities from './pages/setup/facilities-setup';
import PatientMergeFiles from './pages/patient/patient-merge-files';
import AccessRoles from './pages/setup/access-roles';
import Lov from './pages/setup/lov-setup';
import Users from './pages/setup/users-setup';
import UOMGroup from './pages/setup/uom-group';
import Vaccine from './pages/setup/vaccine-setup';
import Modules from './pages/setup/modules-setup';
import * as icons from 'react-icons/fa6';
import PatientProfile from './pages/patient/patient-profile';
import Metadata from './pages/setup/metadata-view';
import DVM from './pages/setup/dvm-setup';
import { setScreenKey } from './utils/uiReducerActions';
import EncounterRegistration from './pages/encounter/encounter-registration';
import Practitioners from './pages/setup/practioners-setup';
import EncounterList from './pages/encounter/encounter-list';
import Encounter from './pages/encounter/encounter-screen';
import Dental from './pages/encounter/dental-screen';
import Departments from './pages/setup/departments-setup';
import DentalActions from './pages/setup/dental-actions';
import CDTSetup from './pages/setup/cdt-setup';
import ICD10Setup from './pages/setup/icd10-setup';
import ServiceSetup from './pages/setup/service-setup';
import PotintialDuplicate from './pages/setup/potential-duplicate';
import ProcedureSetup from './pages/setup/procedure-setup';
import Translate from './components/Translate';
import { BlockUI } from 'primereact/blockui';
import Playground from './pages/playground';
import PrescriptionInstructions from './pages/medications/prescription_instructions';
import ActiveIngredientsSetup from './pages/medications/active-ingredients-setup/ActiveIngredientsSetup';
import GenericMedications from './pages/medications/generic-medications';
import Catalog from './pages/setup/catalog-setup';
import Diagnostics from './pages/setup/diagnostics-tests-definition';
import Resources from './pages/appointment/resources';
import EncounterPreObservations from './pages/encounter/encounter-pre-observations/EncounterPreObservations';
import AgeGroup from './pages/setup/age-group';
import FacilityPatientList from './pages/patient/facility-patient-list/FacilityPatientList';
import ScheduleScreen from './pages/Scheduling/scheduling-screen/ScheduleScreen';
import EncounterPatientPrivateLogin from './pages/encounter/encounter-patient-private';
import VaccinationTab from './pages/encounter/encounter-pre-observations/vaccination-tab';
import CPTSetup from './pages/setup/cpt-setup';
import LOINCSetup from './pages/setup/lonic-setup';
import PatientQuickAppointment from './pages/patient/patient-profile/PatientQuickAppoinment/PatientQuickAppointment';
import PatientEMR from './pages/patient/patient-emr';
import PatientProfileCopy from './pages/patient/patient-profile/PatientProfileCopy';
import Lab from './pages/lab-module';
import Rad from './pages/rad-module';
import SystemLoader from './components/Loaders/SystemLoader';
import DrugOrder from './pages/encounter/encounter-component/drug-order';
import PatientSummary from './pages/encounter/encounter-component/patient-summary';
import SOAP from './pages/encounter/encounter-component/s.o.a.p';
import Observations from './pages/encounter/encounter-pre-observations/observations/Observations';
import Allergies from './pages/encounter/encounter-pre-observations/AllergiesNurse';
import Warning from './pages/encounter/encounter-pre-observations/warning';
import Cardiology from './pages/encounter/encounter-component/cardiology';
import OptometricExam from './pages/encounter/encounter-component/optometric-exam';
import AddAudiometryPuretone from './pages/encounter/encounter-component/audiometry-puretone/AddAudiometryPuretone';
import AudiometryPuretone from './pages/encounter/encounter-component/audiometry-puretone';
import PsychologicalExam from './pages/encounter/encounter-component/psychological-exam';
import Prescription from './pages/encounter/encounter-component/prescription';
import DiagnosticsOrder from './pages/encounter/encounter-component/diagnostics-order';
import Consultation from './pages/encounter/encounter-component/consultation';
import Procedure from './pages/encounter/encounter-component/procedure';
import PatientHistory from './pages/encounter/encounter-component/patient-history';
import MedicationsRecord from './pages/encounter/encounter-component/medications-record';
import VaccineReccord from './pages/encounter/encounter-component/vaccine-reccord';
import DiagnosticsResult from './pages/encounter/encounter-component/diagnostics-result/DiagnosticsResult';
import InpatientList from './pages/Inpatient/inpatientList';
import ReviewResults from './pages/review-results/ReviewResults';
import Room from './pages/setup/bed-room-setup';
import InpatientWaitingLists from './pages/Inpatient/waitingList/InpatientWaitingLists';
import ProcedureModule from './pages/procedure-module/ProcedureModule';
import ProductSetup from './pages/setup/product-setup';
import Checklist from './pages/setup/operations/checklist';
import InpatientNurseStation from './pages/encounter/encounter-pre-observations/InpatientNurseStation';
import OperationSetup from './pages/setup/operation-setup';
import OperationRequest from './pages/encounter/encounter-component/operation-request/OperationRequest';
import Questionnaire from './pages/questionnaire-setup/Questionnaire';
import InternalDrugOrder from './pages/pharmacy/internal-drug-order';
import Operation from './pages/operation-module'
import WarehouseSetup from './pages/setup/warehouse-setup/WarehouseSetup';

const App = () => {
  const authSlice = useAppSelector(state => state.auth);
  const uiSlice = useAppSelector(state => state.ui);
  const dispatch = useAppDispatch();
  const tenantQueryResponse = useLoadTenantQuery(config.tenantId);
  const [navigationMap, setNavigationMap] = useState([]);
  const {
    data: navigationMapRawData,
    isLoading: isLoadingNavigationMap,
    isFetching: isFetchingNavigationMap
  } = useLoadNavigationMapQuery(authSlice.user, { skip: !authSlice.user });
  const [screenKeys, setScreenKeys] = useState({});
  const location = useLocation();

  useEffect(() => {
    console.log(config.backendBaseURL);
    console.log(config.tenantId);
  }, []);

  useEffect(() => {
    if (navigationMapRawData && !isLoadingNavigationMap && !isFetchingNavigationMap) {
      // build navigation map
      loadNavs();
    }
  }, [navigationMapRawData]);

  useEffect(() => {
    if (screenKeys && location) {
      if (screenKeys[location.pathname]) {
        dispatch(setScreenKey(screenKeys[location.pathname]));
      }
    }
  }, [screenKeys]);

  const loadNavs = async () => {
    const navs = [];
    navs.push({
      eventKey: 'dashboard',
      icon: <Icon fill="var(--gray-dark)" as={MdDashboard} />,
      title: 'Dashboard',
      to: '/'
    });

    // fill screens without a module (direct links)
    navigationMapRawData.screens.map(screenWithoutModule => {
      navs.push({
        eventKey: screenWithoutModule.key,
        icon: (
          <Icon
            fill="var(--gray-dark)"
            as={icons[screenWithoutModule?.iconImagePath ?? 'FaCircle']}
          />
        ),
        title: screenWithoutModule.name,
        to: '/'.concat(screenWithoutModule.navPath)
      });
    });

    const _screenKeys = {};

    // fill screens without a module (direct links)
    navigationMapRawData.modules.map(module => {
      const childrenScreens = module.screens;
      const chidlrenNavs = [];

      childrenScreens.map(screen => {
        chidlrenNavs.push({
          eventKey: screen.key,
          icon: (
            <Icon
               fill="var(--gray-dark)"
              as={icons[screen?.iconImagePath ?? 'FaCircle']}
            />
          ),
          title: screen.name,
          to: '/'.concat(screen.navPath)
        });

        _screenKeys['/'.concat(screen.navPath)] = screen.key;
      });

      navs.push({
        eventKey: module.key,
        icon: (
          <Icon
            fill="var(--gray-dark)"
            as={icons[module?.iconImagePath ?? 'FaBox']}
          />
        ),
        title: module.name,
        children: chidlrenNavs
      });
    });

    setScreenKeys(_screenKeys);

    setNavigationMap(navs);
  };

  return (
    <IntlProvider locale="en" messages={locales.en}>
      <div style={{ position: 'fixed', right: '1%', bottom: '1%', zIndex: 1000, color: 'grey' }}>
        {/* @ {authSlice.tenant ? authSlice.tenant.tenantName : 'No-Tenant'} */}
      </div>

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
            }
          >
            {/* {/* protected routes (needs authintication) */}
            {/* TODO load them dynamically based on user authorization matrix */}
            <Route path="/" element={<Frame navs={navigationMap} />}>
              <Route index element={<Dashboard />} />
              <Route path="patient-profile-old" element={<PatientProfile />} />
              <Route path="patient-quick-appointment" element={<PatientQuickAppointment />} />
              <Route path="patient-profile" element={<PatientProfileCopy />} />
              <Route path="patient-chart" element={<PatientChart />} />
              <Route path="patient-list" element={<PatientList />} />
              <Route path="encounter-registration" element={<EncounterRegistration />} />
              <Route path="facility-patient-list" element={<FacilityPatientList />} />
              <Route path="encounter" element={<Encounter />}>
                <Route path="drug-order" element={<DrugOrder />} />
                <Route index element={<PatientSummary />} />
                <Route path='clinical-visit' element={<SOAP />} />
                <Route path='observations' element={<Observations />} />
                <Route path='allergies' element={<Allergies />} />
                <Route path='medical-warnings' element={<Warning />} />
                <Route path='cardiology' element={<Cardiology />} />
                <Route path='dental-care' element={<Dental />} />
                <Route path='optometric-exam' element={<OptometricExam />} />
                <Route path='audiometry' element={<AudiometryPuretone />} />
                <Route path='psychological-exam' element={<PsychologicalExam />} />
                <Route path='vaccination' element={<VaccinationTab />} />
                <Route path='prescription' element={<Prescription />} />
                <Route path='diagnostics-order' element={<DiagnosticsOrder />} />
                <Route path='consultation' element={<Consultation />} />
                <Route path='procedures' element={<Procedure/>} />
                <Route path='patient-history' element={<PatientHistory/>} />
                <Route path='medications-record' element={<MedicationsRecord/>} />
                <Route path='vaccine-record' element={<VaccineReccord/>} />
                <Route path='diagnostics-result' element={<DiagnosticsResult/>} />
                <Route path='operation-request' element={<OperationRequest/>}/>
              </Route>
              <Route path="procedure-module" element={<ProcedureModule />} />
              <Route path="encounter-list" element={<EncounterList />} />
              <Route path='inpatient-encounters-list' element={<InpatientList/>} />
               <Route path='waiting-encounters-list' element={<InpatientWaitingLists/>}/>
              <Route path='room' element={<Room/>} />
              <Route path="merge-patient-files" element={<PatientMergeFiles />} />
              <Route path="nurse-station" element={<EncounterPreObservations />} />
              <Route path="inpatient-nurse-station" element={<InpatientNurseStation />} />
              <Route path="review-results" element={<ReviewResults />} />
              <Route path="facilities" element={<Facilities />} />
              <Route path="access-roles" element={<AccessRoles />} />
              <Route path="lov-setup" element={<Lov />} />
              <Route path="modules-setup" element={<Modules />} />
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
              <Route path="uom-group" element={<UOMGroup />} />
              <Route path="nurse-station" element={<EncounterPreObservations />} />
              <Route path="metadata" element={<Metadata />} />
              <Route path="dvm" element={<DVM />} />
              <Route path="practitioners" element={<Practitioners />} />
              <Route path="departments" element={<Departments />} />
              <Route path="resources" element={<Resources />} />
              <Route path="diagnostics-test" element={<Diagnostics />} />
              <Route path="catalog" element={<Catalog />} />
              <Route path="allergens" element={<Allergens />} />
              <Route path='inventory-product-setup' element={<ProductSetup/>} />
              <Route path="warehouse-setup" element={<WarehouseSetup/>} />
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
              <Route path="error-404" element={<Error404Page />} />
              <Route path="error-403" element={<Error403Page />} />
              <Route path="error-500" element={<Error500Page />} />
              <Route path="error-503" element={<Error503Page />} />
              <Route path="playground" element={<Playground />} />
              <Route path="schedual-screen" element={<ScheduleScreen />} />
              <Route path="patient-EMR" element={<PatientEMR />} />
              <Route path="lab-module" element={<Lab />} />
              <Route path="rad-module" element={<Rad />} />
              <Route path='operation-module' element={<Operation />}/>
              <Route path='operation-setup' element={<OperationSetup />}/>
               <Route path="pharmacy-internal-orders" element={<InternalDrugOrder />} />

            </Route>
          </Route>

          <Route path="login" element={<SignInPage />} />
          <Route path="*" element={<Error404Page />} />
        </Routes>
      </CustomProvider>
    </IntlProvider>
  );
};

export default App;
