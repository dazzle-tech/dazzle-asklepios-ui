import React, { useState } from 'react';
import { UNSAFE_LocationContext, UNSAFE_RouteContext } from 'react-router-dom';
import './modal-view-only.less';
import Encounter from '@/pages/encounter/encounter-screen';

import PatientSummary from '@/pages/encounter/encounter-component/patient-summary';
import NurseAssessment from '@/pages/encounter/encounter-pre-observations-new/observation-PMH-Progress/nurse-assessment';
import PhysicianAssessment from '@/pages/encounter/encounter-pre-observations-new/physician-assessment/physician-assessment';
import ProgressNotes from '@/pages/encounter/encounter-component/progress-notes/ProgressNotes';
import PressureUlcerRiskAssessment from '@/pages/encounter/encounter-component/pressure-ulce-risk-assessment';
import VTERiskAssessment from '@/pages/encounter/encounter-component/vte-risk-assessment';
import GlasgowComaScale from '@/pages/encounter/encounter-component/glasgow-coma-scale';
import DrugOrderNew from '@/pages/encounter/encounter-component/drug-order-new';
import PregnancyFollowup from '@/pages/encounter/encounter-component/pregnancy-follow-up';
import SOAP from '@/pages/encounter/encounter-component/s.o.a.p';
import Observations from '@/pages/encounter/encounter-pre-observations-new/observations/Observations';
import PreviousMeasurementsMainScreen from '@/pages/encounter/encounter-pre-observations-new/previous-measurements/PreviousMeasurementsMainScreen';
import Allergies from '@/pages/encounter/encounter-pre-observations-new/AllergiesNurse';
import Warning from '@/pages/encounter/encounter-pre-observations-new/warning';
import Cardiology from '@/pages/encounter/encounter-component/cardiology';
import Dental from '@/pages/encounter/dental-screen';
import DentalProcedures from '@/pages/encounter/dental-procedures/DentalProcedures';
import OptometricExam from '@/pages/encounter/encounter-component/optometric-exam';
import JohnsHopkinsTool from '@/pages/encounter/encounter-component/fall-risk-assessments';
import AudiometryPuretone from '@/pages/encounter/encounter-component/audiometry-puretone';
import PsychologicalExam from '@/pages/encounter/encounter-component/psychological-exam';
import VaccinationTab from '@/pages/encounter/encounter-pre-observations-new/vaccination-tab';
import PrescriptionNew from '@/pages/encounter/encounter-component/prescription-new';
import DiagnosticsOrderNew from '@/pages/encounter/encounter-component/diagnostics-order-new';
import ConsultationNew from '@/pages/encounter/encounter-component/consultation-new';
import ProcedureNew from '@/pages/encounter/encounter-component/procedure-new/Procedure';
import PatientHistory from '@/pages/encounter/encounter-component/patient-history';
import MedicationsRecord from '@/pages/encounter/encounter-component/medications-record';
import VaccineReccord from '@/pages/encounter/encounter-component/vaccine-reccord';
import DiagnosticsResult from '@/pages/encounter/encounter-component/diagnostics-result/DiagnosticsResult';
import DialysisRequest from '@/pages/encounter/encounter-component/dialysis-request/DialysisRequest';
import UccMedicationOrder from '@/pages/encounter/encounter-component/ucc-medication-order';
import OperationRequestNew from '@/pages/encounter/encounter-component/operation-request-new/OperationRequest';
import DoctorRound from '@/pages/encounter/encounter-component/doctor-round/DoctorRound';
import ICU from '@/pages/encounter/encounter-component/i.c.u/ICU';
import Pediatric from '@/pages/encounter/encounter-component/pediatric';
import MultidisciplinaryTeamNotes from '@/pages/encounter/encounter-component/multidisciplinary-team-notes';
import CarePlanAndGoals from '@/pages/encounter/encounter-component/care-plan-and-goals';
import DischargePlanning from '@/pages/encounter/encounter-component/discharged-planning';
import BedsideProceduresRequests from '@/pages/encounter/encounter-component/bedside-procedures-requests';
import DayCaseContent from '@/pages/encounter/encounter-component/day-case-content';
import BloodOrder from '@/pages/encounter/encounter-component/blood-order';
import IntakeOutputBalance from '@/pages/encounter/encounter-component/intake-output-balance';
import ReferralRequest from '@/pages/encounter/encounter-component/add-referral-request';
import IVFluidOrder from '@/pages/encounter/encounter-component/iv-fluid-order';
import MorseFallScale from '@/pages/encounter/encounter-component/morse-fall-scale';
import StratifyScale from '@/pages/encounter/encounter-component/stratify-scale';
import HendrichFallRisk from '@/pages/encounter/encounter-component/hendrich-fall-risk';
import NutritionStateAsssessment from '@/pages/encounter/encounter-component/nutrition-state-asssessment';
import DietaryRequest from '@/pages/encounter/encounter-component/dietary-request/DietaryRequests';
import MAR from '@/pages/encounter/encounter-component/mar';
import PhysiotherapyPlan from '@/pages/encounter/encounter-component/physiotherapy-plan';
import OccupationalTherapy from '@/pages/encounter/encounter-component/occupational-therapy';
import SpeechTherapy from '@/pages/encounter/encounter-component/speech-therapy';
import IVFluidAdministration from '@/pages/encounter/encounter-component/iv-fluid-administration/IVFluidAdministration';
import ContinuousObservations from '@/pages/encounter/continuous-observations/ContinuousObservations';
import NeonatesPainAssessment from '@/pages/encounter/neonates-pain-assessment/NeonatesPainAssessment';
import SlidingScale from '@/pages/encounter/encounter-component/order-details';
import ServiceAndProductsTab from '@/pages/encounter/encounter-pre-observations-new/Service&Products/ServiceAndProducts';
import FormTemplatesUseScreen from '@/components/FormsTemplate/FormTemplatesUseScreen';

const ENCOUNTER_SHEET_MAP: Record<string, React.ComponentType<any>> = {
  '': PatientSummary,
  'nurse-assessment': NurseAssessment,
  'physician-assessment': PhysicianAssessment,
  'progress-notes': ProgressNotes,
  'pressure-ulce-risk-assessment': PressureUlcerRiskAssessment,
  'vte-risk-assessment': VTERiskAssessment,
  'glasgow-coma-scale': GlasgowComaScale,
  'medication-order': DrugOrderNew,
  'pregnancy-follow-up': PregnancyFollowup,
  'drug-order': DrugOrderNew,
  'clinical-visit': SOAP,
  'observations': Observations,
  'previous-measurements': PreviousMeasurementsMainScreen,
  'allergies': Allergies,
  'medical-warnings': Warning,
  'cardiology': Cardiology,
  'dental-care': Dental,
  'dental-procedures': DentalProcedures,
  'optometric-exam': OptometricExam,
  'johns-hopkins-tool': JohnsHopkinsTool,
  'audiometry': AudiometryPuretone,
  'psychological-exam': PsychologicalExam,
  'vaccination': VaccinationTab,
  'prescription': PrescriptionNew,
  'diagnostics-order': DiagnosticsOrderNew,
  'consultation': ConsultationNew,
  'procedures': ProcedureNew,
  'patient-history': PatientHistory,
  'medications-record': MedicationsRecord,
  'vaccine-record': VaccineReccord,
  'diagnostics-result': DiagnosticsResult,
  'dialysis-request': DialysisRequest,
  'ucc-medication-order': UccMedicationOrder,
  'operation-request': OperationRequestNew,
  'doctor-round': DoctorRound,
  'icu': ICU,
  'pediatric': Pediatric,
  'multidisciplinary-team-notes': MultidisciplinaryTeamNotes,
  'care-plan-and-goals': CarePlanAndGoals,
  'discharge-planning': DischargePlanning,
  'bedside-procedures-requests': BedsideProceduresRequests,
  'day-case': DayCaseContent,
  'blood-order': BloodOrder,
  'intake-output-balance': IntakeOutputBalance,
  'referral-request': ReferralRequest,
  'iv-fluid-order': IVFluidOrder,
  'morse-fall-scale': MorseFallScale,
  'stratify-scale': StratifyScale,
  'hendrich-fall-risk': HendrichFallRisk,
  'nutrition-state-asssessment': NutritionStateAsssessment,
  'dietary-request': DietaryRequest,
  'medication-administration-record': MAR,
  'physiotherapy-plan': PhysiotherapyPlan,
  'occupational-therapy': OccupationalTherapy,
  'speech-therapy': SpeechTherapy,
  'iv-fluid-Administration': IVFluidAdministration,
  'continuous-observation': ContinuousObservations,
  'FLACC-neonates-pain-assessment': NeonatesPainAssessment,
  'sliding-scale': SlidingScale,
  'form-template-use': FormTemplatesUseScreen,
  'service-and-products': ServiceAndProductsTab,
};

// Reset RouteContext inside each sheet so it doesn't inherit the parent fake outlet
const EMPTY_ROUTE_CTX = { outlet: null, matches: [] as any, isDataRoute: false };

type Props = {
  patient: any;
  encounter: any;
};

const EncounterModalContent: React.FC<Props> = ({ patient, encounter }) => {
  const [activeSheet, setActiveSheet] = useState('');

  const SheetComponent = ENCOUNTER_SHEET_MAP[activeSheet] ?? PatientSummary;

  const fakeLocationCtx = {
    location: {
      pathname: activeSheet ? `/encounter/${activeSheet}` : '/encounter',
      search: '',
      hash: '',
      state: { patient, encounter, fromPage: 'PatientEMR', viewMode: 'readOnly', edit: true, },
      key: 'modal',
    },
    navigationType: 'POP' as const
  };

  // Provide a fake outlet so <Outlet context={...}> inside Encounter renders SheetComponent.
  // SheetComponents get patient/encounter/edit via useOutletContext() — exactly as in real routing.
  // We reset RouteContext inside the sheet so it doesn't recursively see the same fake outlet.
  const sheetElement = (
    <UNSAFE_RouteContext.Provider value={EMPTY_ROUTE_CTX}>
      <SheetComponent />
    </UNSAFE_RouteContext.Provider>
  );

  const fakeRouteCtx = {
    outlet: sheetElement as React.ReactElement,
    matches: [] as any,
    isDataRoute: false
  };

  return (
    <div>
      <UNSAFE_LocationContext.Provider value={fakeLocationCtx}>
        <UNSAFE_RouteContext.Provider value={fakeRouteCtx}>
          <Encounter
            patient={patient}
            encounter={encounter}
            onSheetNavigate={setActiveSheet}
          />
        </UNSAFE_RouteContext.Provider>
      </UNSAFE_LocationContext.Provider>
    </div>
  );
};

export default EncounterModalContent;
