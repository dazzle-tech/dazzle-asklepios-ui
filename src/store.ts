import { configureStore } from '@reduxjs/toolkit';

import { idParsingService } from '@/services/idParsingService';
import { summarizationService } from '@/services/summarizationService';

import uiSlice from './reducers/uiSlice';
import divSlice from './reducers/divSlice';
import refetchReducer from './reducers/refetchEncounterState';
import refetchPatientSideInfo from './reducers/refetchPatientSide';
import authReducer from './reducers/authSlice';
import callReducer from './store/callSlice';
import patientSlice from '@/reducers/patientSlice';

import { uiService } from '@/services/uiService';
import { authService } from '@/services/authService';
import { authServiceApi } from '@/services/authServiceApi';
import { accountApi } from './services/accountService';

import { patientService } from '@/services/patientService';
import { newPatientService } from './services/patient/patientService';
import { addressService } from './services/patients/AddressService';
import { hipaaService } from './services/patients/hipaaService';
import { patientPreferredHealthProfessionalService } from './services/patients/PatientPreferredHealthProfessional';
import { patientDocumentsService } from './services/patients/patientDocumentsService';

import { setupService } from '@/services/setupService';
import { dvmService } from '@/services/dvmService';
import { encounterService } from '@/services/encounterService';
import { dentalService } from '@/services/dentalService';
import { observationService } from '@/services/observationService';
import { referralRequestService } from './services/medicalsheetsEncounter/referralRequestService';
import { medicationsSetupService } from './services/medicationsSetupService';
import { activeIngredientSynonymsService } from '@/services/setup/activeIngredients/activeIngredientSynonymsService';
import { activeIngredientContraindicationService } from '@/services/setup/activeIngredients/activeIngredientContraindicationService';
import { activeIngredientIndicationService } from '@/services/setup/activeIngredients/activeIngredientIndicationService';
import { activeIngredientSpecialPopulationService } from '@/services/setup/activeIngredients/activeIngredientSpecialPopulationService';
import { activeIngredientPreRequestedTestService } from '@/services/setup/activeIngredients/activeIngredientPreRequestedTestService';
import activeIngredientAdverseEffectService from './services/setup/activeIngredients/activeIngredientAdverseEffectService';
import { activeIngredientDrugInteractionService } from '@/services/setup/activeIngredients/activeIngredientDrugInteractionService';
import activeIngredientFoodInteractionService from './services/setup/activeIngredients/ActiveIngredientFoodInteraction';
import { activeIngredientsService } from './services/setup/activeIngredients/activeIngredientsService';

import { attachmentService } from '@/services/attachmentService';
import { patientAttachmentService } from './services/patients/attachmentService';
import { encounterAttachmentsService } from './services/encounters/attachmentsService';
import { inventoryTransferAttachmentService } from './services/inventory/inventory-transfer/attachmentService';
import { inventoryTransactionAttachmentService } from './services/inventory/inventory-transaction/attachmentService';

import { appointmentService } from './services/appointmentService';
import { userService } from '@/services/userService';

import { labService } from './services/labService';
import { radService } from '@/services/radService';
import { procedureService } from './services/procedureService';
import { operationService } from './services/operationService';

import { inventoryService } from './services/inventoryTransactionService';
import { inventoryProductsService } from './services/inventory/inventory-products/inventoryProductsService';

import { recoveryService } from './services/RecoveryService';

import { enumsApi } from '@/services/enumsApi';

import { facilityService } from './services/security/facilityService';
import { departmentService } from './services/security/departmentService';
import { organizationDefinitionService } from './services/system-configurations/organizationDefinitionService';
import { roleService } from './services/security/roleService';
import { userRoleService } from './services/security/UserRoleService';
import { enumService } from './services/enumService';
import { userDepartmentService } from './services/security/userDepartmentsService';

import { MedicalsheetsService } from './services/MedicalSheetsService';

import { serviceService } from './services/setup/serviceService';
import { languageService } from './services/setup/languageService';
import { translationService } from './services/setup/translationService';

import { PractitionerService } from './services/setup/practitioner/PractitionerService';
import { PractitionerDepartmentService } from './services/setup/practitioner/PractitionerDepartmentService';

import { Icd10Service } from './services/setup/icd10service';
import { ResourceService } from './services/setup/resource/ResourceService';

import { ageGroupService } from './services/setup/ageGroupService';
import { potintialService } from '@/services/potintialDuplicateService';
import { allergensService } from './services/setup/allergensService';

import { diagnosticTestService } from '@/services/setup/diagnosticTest/diagnosticTestService';
import { laboratoryService } from './services/setup/diagnosticTest/laboratoryService';
import { diagnosticTestProfileService } from './services/setup/diagnosticTest/diagnosticTestProfileService';
import { diagnosticTestPathologyService } from '@/services/setup/diagnosticTest/diagnosticTestPathologyService';
import { radiologyService } from '@/services/setup/diagnosticTest/radiologyTestService';
import { diagnosticTestNormalRangeService } from './services/setup/diagnosticTest/diagnosticTestNormalRangeService';
import { diagnosticTestCodingService } from '@/services/setup/diagnosticTest/diagnosticTestCodingService';

import { cdtCodeService } from './services/setup/cdtCodeService';
import { loincCodeService } from './services/setup/loincCodeService';
import { cptCodeService } from './services/setup/cptCodeService';

import { dentalActionService } from '@/services/setup/dental-action/dentalActionService';
import { CdtDentalActionService } from '@/services/setup/dental-action/CdtDentalActionService';

import { procedureSetupService } from './services/setup/procedure/procedureService';
import { procedureCodingService } from './services/setup/procedure/procedureCodingService';
import { procedurePriceListService } from './services/setup/procedure/procedurePriceListService';

import { vaccineService } from './services/vaccine/vaccineService';
import { vaccineBrandsService } from './services/vaccine/vaccineBrandsService';
import { vaccineDosesService } from './services/vaccine/vaccineDosesService';
import { vaccineDosesIntervalService } from './services/vaccine/vaccineDosesIntervalService';

import { MedicationCategoriesService } from '@/services/setup/medication-categories/MedicationCategoriesService';
import { MedicationCategoriesClassService } from '@/services/setup/medication-categories/MedicationCategoriesClassService';

import { BrandMedicationService } from './services/setup/brandmedication/BrandMedicationService';
import { BrandMedicationSubstituteService } from '@/services/setup/brandmedication/BrandMedicationSubstituteService';
import { BrandMedicationActiveIngredientService } from '@/services/setup/brandmedication/BrandMedicationActiveIngredientService';

import { prescriptionInstructionService } from './services/setup/prescription-instruction/prescriptionInstructionService';

import { uomGroupService } from './services/setup/uom-group/uomGroupService';

import { countryService } from './services/setup/country/countryService';
import { countryDistrictService } from './services/setup/country/countryDistrictService';
import { districtCommunityService } from './services/setup/country/districtCommunityService';
import { communityAreaService } from './services/setup/country/communityAreaService';

import { dischargePService } from './services/setup/dischargeService';

import { resultReportApi } from './services/setup/resultReportApi';
import { invoiceReportApi } from './services/setup/invoiceReportApi';
import { visitDurationService } from './services/setup/visitDurationService';

import { catalogService } from './services/setup/catalog/catalogService';
import { catalogDiagnosticTestService } from './services/setup/catalog/catalogTestService';

import { PriceListService } from './services/billing/PriceListService';
import { ReportTemplateService } from './services/setup/report-template/reportTemplateService';
import { DiagnosticTestTemplateService } from './services/setup/report-template/DiagnosticTestTemplate';
import { userStickyNotesService } from './services/userStickyNotes/userStickyNotes';
import { BillingService } from './services/billing/BillingService';
import { PriceListItemService } from './services/billing/PriceListItemService';
import PatientRelationService from './services/patients/PatientRelationService';
import { patientInsurancesService } from './services/patients/patientInsurancesService';
import { patientInsuranceCoveragesService } from './services/patients/patientInsuranceCoveragesService';
import { encounterVaccinationService } from './services/encounterMedical/encounterVaccinationService';
import { patientEncounterService } from './services/encounters/patientEncounterService';
import { patientPaymentsService } from './services/encounters/patientPaymentsService';
import { consultationService } from './services/consultation/consultationService';
import { portalService } from './services/portalService';
import { PayorService } from './services/setup/payer/PayorService';
import { PayorPlanService } from '@/services/setup/payer/PayorPlanService';
import { priceListAttributesService } from '@/services/billing/PriceListAttributesService';
import { DischargePlanningService } from '@/services/setup/DischargePlanningService';
import { formTemplateService } from './services/setup/formTemplateService';
import { FormEntriesService } from './services/setup/formEntriesService';
import { prescriptionPService } from './services/setup/PrescriptionReportRequest';
import { clinicalSummaryService } from './services/ai-services/clinicalSummaryService';
import { clinicalRecommendationsService } from './services/ai-services/clinicalRecommendationsService';
import { medicationTestOrdersValidationService } from './services/ai-services/medicationTestOrdersValidationService';
import { patientProblemService } from './services/patients/patientProblemService';
import { familyHistoryService } from './services/patients/familyHistoryService';
import { hospitalizationService } from './services/patients/hospitalizationsService';
import { surgicalHistoryService } from './services/patients/surgicalHistoryService';
import { socialHistoryService } from './services/patients/socialHistoryService';
import { favoriteDiagnosticTestService } from './services/diagnosic-order/favoriteDiagnosticTestService';
import { diagnosticOrderService } from './services/diagnosic-order/diagnosticOrderService';
import { diagnosticOrderTestService } from './services/diagnosic-order/diagnosticOrderTestService';
import { diagnosticOrderTestCollectedSampleService } from './services/setup/diagnosticTest/diagnosticOrderTestCollectedSampleService';
import { diagnosticOrderTestTechnicianNoteService } from './services/diagnosic-order/diagnosticOrderTestTechnicianNoteService';
import { diagnosticTestRequestService } from './services/diagnosic-order/diagnosticTestRequestService';
import { externalTestService } from './services/diagnosic-order/externalTestService';
import { diagnosticOrderTestResultService } from './services/setup/diagnosticTest/diagnosticOrderTestResultService';
import { diagnosticOrderTestResultTechnicianNoteService } from './services/diagnosic-order/diagnosticOrderTestResultTechnicianNoteService';
import { diagnosticOrderTestReportService } from './services/setup/diagnosticTest/diagnosticOrderTestReportService';
import { diagnosticOrderTestReportCommentsService } from '@/services/setup/diagnosticTest/diagnosticOrderTestReportCommentsService';
import { patientDiagnosticResultHistoryService } from './services/diagnosic-order/patientDiagnosticResultHistoryService';
import { patientReportService } from './services/patientReportService';
import { progressNoteService } from './services/patients/progressNoteService';
import { patientProcedureService } from './services/patients/patientProcedureService';
import { telephonicConsultationService } from './services/patients/telephonicConsultationService';
import { ICDTreeService } from './services/setup/icdTreeService';
import { generalAssessmentService } from './services/encounters/generalAssessmentService';
import { chiefComplainService } from './services/encounters/chiefComplainService';
import { emergencyTriageService } from './services/encounters/er-triage/emergencyTriageService';
import { encounterAssessmentService } from './services/medicalsheetsEncounter/clinicalVisit/encounterAssessmentService';
import { encounterPlanService } from './services/medicalsheetsEncounter/clinicalVisit/encounterPlanService';
import { patientDiagnosisService } from './services/medicalsheetsEncounter/clinicalVisit/patientDiagnosisService';
import { vitalSignsService } from './services/medicalsheetsEncounter/observations/vitalSignsService';
import { bodyMeasurementsService } from './services/medicalsheetsEncounter/observations/bodyMeasurementsService';
import { patientObservationsComplaintsService } from './services/medicalsheetsEncounter/observations/patientObservationsComplaintsService';
import { painAssessmentService } from './services/medicalsheetsEncounter/observations/painAssessmentService';
import { additionalMeasurementsService } from './services/medicalsheetsEncounter/observations/additionalMeasurementsService';
import { patientAllergiesService } from './services/encounters/patientAllergiesService';
import { ReviewOfSystemService } from './services/medicalsheetsEncounter/ReviewOfSystemService';
import { patientWarningsService } from './services/encounters/patientWarningsService';
import { patientPrescriptionService } from './services/patients/Prescription/patientPrescriptionService';
import { patientPrescriptionMedicationService } from './services/patients/Prescription/patientPrescriptionMedicationService';
import { patientServicesAndProductsService } from './services/encounters/patientServicesAndProductsService';
import { NextOfKinService } from './services/patients/NextOfKinService';
import { RelationsMatrixService } from './services/patients/RelationsMatrixService';
import { patientAdministrativeWarningsService } from './services/patient/patientAdministrativeWarningsService';
import { radiologyReportService } from './services/reports/radiologyReportService';
import { observationServiceNew } from './services/observationServiceNew';
import { organizationHolidaysService } from './services/system-configurations/organizationHolidaysService';
import { PolicyDefinitionService } from './services/setup/policyDefinition/policyDefinitionService';
import { availabilityTemplateService } from './services/appointment/availabilityTemplateService';
import { availabilityGenerationBatchService } from './services/appointment/availabilityGenerationBatchService/availabilityGenerationBatchService';
import { availabilityTemplateIntervalService } from './services/appointment/availabilityTemplate/availabilityTemplateInterval';
import { availabilityTemplateIntervalBreakService } from './services/appointment/availabilityTemplate/availabilityTemplateIntervalBreak';
import { appointmentFromTemplateService } from './services/appointment/appointmentService';
import { departmentServicesService } from './services/departmentServicesService';
import { patientBillingInvoiceService } from './services/patient/patientBillingInvoiceService';
import { patientBillingInvoiceItemService } from './services/patient/patientBillingInvoiceItemService';
import { appointmentRequestService } from '@/services/appointment/appointmentRequestService';
import { roomService } from './services/setup/room/roomService';
import { bedService } from './services/setup/room/bedService';
import { bedRoomService } from './services/setup/room/bedRoomService';
import { encounterAssignToBedService } from './services/patients/emergency/encounterAssignToBedService';
import { currentMedicationService } from './services/patients/currentMedicationService';
import { uccMedicationOrderService } from './services/medicalsheetsEncounter/uccMedicationOrder/uccMedicationOrderService';

export const store = configureStore({
  reducer: {
    // ai parsing and summarization
    [idParsingService.reducerPath]: idParsingService.reducer,
    [summarizationService.reducerPath]: summarizationService.reducer,

    // ui
    [uiSlice.name]: uiSlice.reducer,
    [uiService.reducerPath]: uiService.reducer,
    [divSlice.name]: divSlice.reducer,

    // auth
    auth: authReducer,
    [authService.reducerPath]: authService.reducer,
    [authServiceApi.reducerPath]: authServiceApi.reducer,

    // patient
    [patientSlice.name]: patientSlice.reducer,
    [patientService.reducerPath]: patientService.reducer,
    [newPatientService.reducerPath]: newPatientService.reducer,
    [addressService.reducerPath]: addressService.reducer,
    [hipaaService.reducerPath]: hipaaService.reducer,
    [patientPreferredHealthProfessionalService.reducerPath]:
      patientPreferredHealthProfessionalService.reducer,
    [patientDocumentsService.reducerPath]: patientDocumentsService.reducer,

    // setup
    [setupService.reducerPath]: setupService.reducer,

    [PolicyDefinitionService.reducerPath]: PolicyDefinitionService.reducer,

    // inventory
    [inventoryService.reducerPath]: inventoryService.reducer,
    [inventoryProductsService.reducerPath]: inventoryProductsService.reducer,

    // medication / active ingredients
    [medicationsSetupService.reducerPath]: medicationsSetupService.reducer,
    [activeIngredientSynonymsService.reducerPath]: activeIngredientSynonymsService.reducer,
    [activeIngredientSpecialPopulationService.reducerPath]:
      activeIngredientSpecialPopulationService.reducer,
    [activeIngredientContraindicationService.reducerPath]:
      activeIngredientContraindicationService.reducer,
    [activeIngredientPreRequestedTestService.reducerPath]:
      activeIngredientPreRequestedTestService.reducer,
    [activeIngredientAdverseEffectService.reducerPath]:
      activeIngredientAdverseEffectService.reducer,
    [activeIngredientIndicationService.reducerPath]: activeIngredientIndicationService.reducer,
    [activeIngredientDrugInteractionService.reducerPath]:
      activeIngredientDrugInteractionService.reducer,
    [activeIngredientFoodInteractionService.reducerPath]:
      activeIngredientFoodInteractionService.reducer,
    [activeIngredientsService.reducerPath]: activeIngredientsService.reducer,

    // account / billing base
    [accountApi.reducerPath]: accountApi.reducer,

    // appointment
    [appointmentService.reducerPath]: appointmentService.reducer,

    // dvm / encounter / clinical
    [dvmService.reducerPath]: dvmService.reducer,
    [encounterService.reducerPath]: encounterService.reducer,
    [dentalService.reducerPath]: dentalService.reducer,
    [observationService.reducerPath]: observationService.reducer,

    // attachments
    [attachmentService.reducerPath]: attachmentService.reducer,
    [patientAttachmentService.reducerPath]: patientAttachmentService.reducer,
    [encounterAttachmentsService.reducerPath]: encounterAttachmentsService.reducer,
    [inventoryTransferAttachmentService.reducerPath]: inventoryTransferAttachmentService.reducer,
    [inventoryTransactionAttachmentService.reducerPath]:
      inventoryTransactionAttachmentService.reducer,

    // lab / rad / operation / procedures
    [labService.reducerPath]: labService.reducer,
    [operationService.reducerPath]: operationService.reducer,
    [radService.reducerPath]: radService.reducer,
    [procedureService.reducerPath]: procedureService.reducer,
    [PatientRelationService.reducerPath]: PatientRelationService.reducer,

    // refetch flags
    refetch: refetchReducer,
    refetchPatientSide: refetchPatientSideInfo,

    // prescription instruction
    [prescriptionInstructionService.reducerPath]: prescriptionInstructionService.reducer,

    // recovery
    [recoveryService.reducerPath]: recoveryService.reducer,

    // user / call
    [userService.reducerPath]: userService.reducer,
    [potintialService.reducerPath]: potintialService.reducer,
    call: callReducer,

    // security / enums
    [facilityService.reducerPath]: facilityService.reducer,
    [departmentService.reducerPath]: departmentService.reducer,
    [roleService.reducerPath]: roleService.reducer,
    [userRoleService.reducerPath]: userRoleService.reducer,
    [organizationDefinitionService.reducerPath]: organizationDefinitionService.reducer,
    [organizationHolidaysService.reducerPath]: organizationHolidaysService.reducer,

    [enumService.reducerPath]: enumService.reducer,
    [userDepartmentService.reducerPath]: userDepartmentService.reducer,
    [enumsApi.reducerPath]: enumsApi.reducer,

    // medical sheets
    [MedicalsheetsService.reducerPath]: MedicalsheetsService.reducer,

    [departmentServicesService.reducerPath]: departmentServicesService.reducer,

    // services / language / translation
    [serviceService.reducerPath]: serviceService.reducer,
    [languageService.reducerPath]: languageService.reducer,
    [translationService.reducerPath]: translationService.reducer,

    // practitioner
    [PractitionerService.reducerPath]: PractitionerService.reducer,
    [PractitionerDepartmentService.reducerPath]: PractitionerDepartmentService.reducer,

    // categories
    [MedicationCategoriesService.reducerPath]: MedicationCategoriesService.reducer,
    [MedicationCategoriesClassService.reducerPath]: MedicationCategoriesClassService.reducer,

    // uom
    [uomGroupService.reducerPath]: uomGroupService.reducer,

    // Translation slice
    // Form slice
    [formTemplateService.reducerPath]: formTemplateService.reducer,
    [FormEntriesService.reducerPath]: FormEntriesService.reducer,

    // age group
    [ageGroupService.reducerPath]: ageGroupService.reducer,
    [Icd10Service.reducerPath]: Icd10Service.reducer,
    [ResourceService.reducerPath]: ResourceService.reducer,
    [allergensService.reducerPath]: allergensService.reducer,

    // diagnostic tests
    [diagnosticTestService.reducerPath]: diagnosticTestService.reducer,
    [laboratoryService.reducerPath]: laboratoryService.reducer,
    [radiologyService.reducerPath]: radiologyService.reducer,
    [diagnosticTestProfileService.reducerPath]: diagnosticTestProfileService.reducer,
    [diagnosticTestPathologyService.reducerPath]: diagnosticTestPathologyService.reducer,
    [diagnosticTestNormalRangeService.reducerPath]: diagnosticTestNormalRangeService.reducer,
    [diagnosticTestCodingService.reducerPath]: diagnosticTestCodingService.reducer,

    // coding
    [cdtCodeService.reducerPath]: cdtCodeService.reducer,
    [loincCodeService.reducerPath]: loincCodeService.reducer,
    [cptCodeService.reducerPath]: cptCodeService.reducer,

    // dental actions
    [dentalActionService.reducerPath]: dentalActionService.reducer,
    [CdtDentalActionService.reducerPath]: CdtDentalActionService.reducer,

    // procedures
    [procedureSetupService.reducerPath]: procedureSetupService.reducer,
    [procedureCodingService.reducerPath]: procedureCodingService.reducer,
    [procedurePriceListService.reducerPath]: procedurePriceListService.reducer,

    // billing
    [BillingService.reducerPath]: BillingService.reducer,

    // vaccines
    [vaccineService.reducerPath]: vaccineService.reducer,
    [vaccineBrandsService.reducerPath]: vaccineBrandsService.reducer,
    [vaccineDosesService.reducerPath]: vaccineDosesService.reducer,
    [vaccineDosesIntervalService.reducerPath]: vaccineDosesIntervalService.reducer,

    // brand medications
    [BrandMedicationService.reducerPath]: BrandMedicationService.reducer,
    [BrandMedicationSubstituteService.reducerPath]: BrandMedicationSubstituteService.reducer,
    [BrandMedicationActiveIngredientService.reducerPath]:
      BrandMedicationActiveIngredientService.reducer,

    // country / geo
    [countryService.reducerPath]: countryService.reducer,
    [countryDistrictService.reducerPath]: countryDistrictService.reducer,
    [districtCommunityService.reducerPath]: districtCommunityService.reducer,
    [communityAreaService.reducerPath]: communityAreaService.reducer,

    // discharge
    [dischargePService.reducerPath]: dischargePService.reducer,
    [DischargePlanningService.reducerPath]: DischargePlanningService.reducer,

    // reporting
    [resultReportApi.reducerPath]: resultReportApi.reducer,
    [invoiceReportApi.reducerPath]: invoiceReportApi.reducer,

    // invoice report
    // visit duration
    [visitDurationService.reducerPath]: visitDurationService.reducer,

    // catalog
    [catalogService.reducerPath]: catalogService.reducer,
    [catalogDiagnosticTestService.reducerPath]: catalogDiagnosticTestService.reducer,

    // billing / price list
    [PriceListService.reducerPath]: PriceListService.reducer,
    [PriceListItemService.reducerPath]: PriceListItemService.reducer,

    // patient billing (new endpoints)
    [patientBillingInvoiceService.reducerPath]: patientBillingInvoiceService.reducer,
    [patientBillingInvoiceItemService.reducerPath]: patientBillingInvoiceItemService.reducer,
    [appointmentRequestService.reducerPath]: appointmentRequestService.reducer,

    // Templates
    // report templates
    [ReportTemplateService.reducerPath]: ReportTemplateService.reducer,
    [DiagnosticTestTemplateService.reducerPath]: DiagnosticTestTemplateService.reducer,

    // sticky notes
    [userStickyNotesService.reducerPath]: userStickyNotesService.reducer,

    // referral
    [referralRequestService.reducerPath]: referralRequestService.reducer,

    // payer
    [PayorService.reducerPath]: PayorService.reducer,
    [PayorPlanService.reducerPath]: PayorPlanService.reducer,

    [patientInsurancesService.reducerPath]: patientInsurancesService.reducer,
    [patientInsuranceCoveragesService.reducerPath]: patientInsuranceCoveragesService.reducer,

    [encounterVaccinationService.reducerPath]: encounterVaccinationService.reducer,

    [patientEncounterService.reducerPath]: patientEncounterService.reducer,
    [patientPaymentsService.reducerPath]: patientPaymentsService.reducer,
    [priceListAttributesService.reducerPath]: priceListAttributesService.reducer,

    [prescriptionPService.reducerPath]: prescriptionPService.reducer,
    [radiologyReportService.reducerPath]: radiologyReportService.reducer,
    [patientAllergiesService.reducerPath]: patientAllergiesService.reducer,
    [patientWarningsService.reducerPath]: patientWarningsService.reducer,

    [availabilityTemplateService.reducerPath]: availabilityTemplateService.reducer,
    [availabilityGenerationBatchService.reducerPath]: availabilityGenerationBatchService.reducer,
    [availabilityTemplateIntervalService.reducerPath]: availabilityTemplateIntervalService.reducer,
    [availabilityTemplateIntervalBreakService.reducerPath]: availabilityTemplateIntervalBreakService.reducer,
    [appointmentFromTemplateService.reducerPath]: appointmentFromTemplateService.reducer,

    //AI Services
    // AI Services
    [clinicalSummaryService.reducerPath]: clinicalSummaryService.reducer,
    [clinicalRecommendationsService.reducerPath]: clinicalRecommendationsService.reducer,
    [medicationTestOrdersValidationService.reducerPath]:
      medicationTestOrdersValidationService.reducer,
    [patientReportService.reducerPath]: patientReportService.reducer,
    [progressNoteService.reducerPath]: progressNoteService.reducer,
    [patientProcedureService.reducerPath]: patientProcedureService.reducer,

    [patientProblemService.reducerPath]: patientProblemService.reducer,
    [familyHistoryService.reducerPath]: familyHistoryService.reducer,
    [hospitalizationService.reducerPath]: hospitalizationService.reducer,
    [surgicalHistoryService.reducerPath]: surgicalHistoryService.reducer,
    [socialHistoryService.reducerPath]: socialHistoryService.reducer,
    [favoriteDiagnosticTestService.reducerPath]: favoriteDiagnosticTestService.reducer,
    [consultationService.reducerPath]: consultationService.reducer,
    [portalService.reducerPath]: portalService.reducer,
    [telephonicConsultationService.reducerPath]: telephonicConsultationService.reducer,

    [diagnosticOrderService.reducerPath]: diagnosticOrderService.reducer,
    [diagnosticOrderTestService.reducerPath]: diagnosticOrderTestService.reducer,
    [diagnosticOrderTestCollectedSampleService.reducerPath]:
      diagnosticOrderTestCollectedSampleService.reducer,
    [diagnosticOrderTestTechnicianNoteService.reducerPath]:
      diagnosticOrderTestTechnicianNoteService.reducer,
    [diagnosticTestRequestService.reducerPath]: diagnosticTestRequestService.reducer,
    [externalTestService.reducerPath]: externalTestService.reducer,
    [diagnosticOrderTestResultService.reducerPath]: diagnosticOrderTestResultService.reducer,
    [diagnosticOrderTestResultTechnicianNoteService.reducerPath]:
      diagnosticOrderTestResultTechnicianNoteService.reducer,
    [diagnosticOrderTestReportService.reducerPath]: diagnosticOrderTestReportService.reducer,
    [diagnosticOrderTestReportCommentsService.reducerPath]:
      diagnosticOrderTestReportCommentsService.reducer,
    [patientDiagnosticResultHistoryService.reducerPath]:
      patientDiagnosticResultHistoryService.reducer,

    [ICDTreeService.reducerPath]: ICDTreeService.reducer,

    //er-triage
    [generalAssessmentService.reducerPath]: generalAssessmentService.reducer,
    [chiefComplainService.reducerPath]: chiefComplainService.reducer,
    [emergencyTriageService.reducerPath]: emergencyTriageService.reducer,
    [encounterAssessmentService.reducerPath]: encounterAssessmentService.reducer,
    [encounterPlanService.reducerPath]: encounterPlanService.reducer,
    [patientDiagnosisService.reducerPath]: patientDiagnosisService.reducer,

    [vitalSignsService.reducerPath]: vitalSignsService.reducer,

    [bodyMeasurementsService.reducerPath]: bodyMeasurementsService.reducer,
    [patientObservationsComplaintsService.reducerPath]:
      patientObservationsComplaintsService.reducer,
    [painAssessmentService.reducerPath]: painAssessmentService.reducer,
    [additionalMeasurementsService.reducerPath]: additionalMeasurementsService.reducer,
    [ReviewOfSystemService.reducerPath]: ReviewOfSystemService.reducer,
    [patientPrescriptionService.reducerPath]: patientPrescriptionService.reducer,
    [patientPrescriptionMedicationService.reducerPath]:
      patientPrescriptionMedicationService.reducer,
    [patientServicesAndProductsService.reducerPath]: patientServicesAndProductsService.reducer,
    [NextOfKinService.reducerPath]: NextOfKinService.reducer,
    [RelationsMatrixService.reducerPath]: RelationsMatrixService.reducer,
    [patientAdministrativeWarningsService.reducerPath]:
      patientAdministrativeWarningsService.reducer,
    [observationServiceNew.reducerPath]: observationServiceNew.reducer,

    // setup - room and bed management
    [roomService.reducerPath]: roomService.reducer,
    [bedService.reducerPath]: bedService.reducer,
    [bedRoomService.reducerPath]: bedRoomService.reducer,
    [encounterAssignToBedService.reducerPath]: encounterAssignToBedService.reducer,
    [currentMedicationService.reducerPath]: currentMedicationService.reducer,
    [uccMedicationOrderService.reducerPath]: uccMedicationOrderService.reducer

  },

  middleware: getDefaultMiddleware =>
    getDefaultMiddleware().concat(
      ...[
        // ai
        idParsingService.middleware,
        summarizationService.middleware,

        // ui
        uiService.middleware,

        // auth / account
        authService.middleware,
        authServiceApi.middleware,
        accountApi.middleware,

        // patient
        patientService.middleware,
        newPatientService.middleware,
        addressService.middleware,
        hipaaService.middleware,
        patientPreferredHealthProfessionalService.middleware,
        patientDocumentsService.middleware,

        // inventory
        inventoryService.middleware,
        inventoryProductsService.middleware,

        // setup
        setupService.middleware,

        // medication / active ingredients
        medicationsSetupService.middleware,
        activeIngredientSynonymsService.middleware,
        activeIngredientAdverseEffectService.middleware,
        activeIngredientIndicationService.middleware,
        activeIngredientSpecialPopulationService.middleware,
        activeIngredientContraindicationService.middleware,
        activeIngredientPreRequestedTestService.middleware,
        activeIngredientDrugInteractionService.middleware,
        activeIngredientFoodInteractionService.middleware,
        activeIngredientsService.middleware,

        // appointment / clinical
        appointmentService.middleware,
        dvmService.middleware,
        encounterService.middleware,
        dentalService.middleware,
        observationService.middleware,

        // attachments
        attachmentService.middleware,
        patientAttachmentService.middleware,
        encounterAttachmentsService.middleware,
        inventoryTransferAttachmentService.middleware,
        inventoryTransactionAttachmentService.middleware,

        // lab / rad / procedure / operation
        labService.middleware,
        radService.middleware,
        procedureService.middleware,
        operationService.middleware,

        // recovery / user
        recoveryService.middleware,
        userService.middleware,
        potintialService.middleware,

        // enums / security
        enumsApi.middleware,
        facilityService.middleware,
        departmentService.middleware,
        organizationDefinitionService.middleware,
        roleService.middleware,
        userRoleService.middleware,
        enumService.middleware,
        userDepartmentService.middleware,

        // medical sheets
        MedicalsheetsService.middleware,
        vitalSignsService.middleware,

        // services / language / translation
        serviceService.middleware,
        MedicationCategoriesService.middleware,
        MedicationCategoriesClassService.middleware,
        languageService.middleware,
        translationService.middleware,

        // practitioner
        formTemplateService.middleware,
        FormEntriesService.middleware,
        PractitionerService.middleware,
        PractitionerDepartmentService.middleware,

        // misc setup
        ResourceService.middleware,
        ageGroupService.middleware,
        Icd10Service.middleware,
        allergensService.middleware,

        // diagnostic tests
        diagnosticTestService.middleware,
        cdtCodeService.middleware,
        loincCodeService.middleware,
        cptCodeService.middleware,
        laboratoryService.middleware,
        diagnosticTestProfileService.middleware,
        diagnosticTestPathologyService.middleware,
        radiologyService.middleware,
        diagnosticTestNormalRangeService.middleware,
        diagnosticTestCodingService.middleware,

        // dental actions
        dentalActionService.middleware,
        CdtDentalActionService.middleware,

        // vaccines
        vaccineService.middleware,
        vaccineBrandsService.middleware,
        vaccineDosesService.middleware,
        vaccineDosesIntervalService.middleware,

        // brand medications
        BrandMedicationService.middleware,
        BrandMedicationSubstituteService.middleware,
        BrandMedicationActiveIngredientService.middleware,

        // prescription instruction
        prescriptionInstructionService.middleware,

        // uom
        uomGroupService.middleware,

        // geo
        countryService.middleware,
        countryDistrictService.middleware,
        districtCommunityService.middleware,
        communityAreaService.middleware,

        // discharge
        dischargePService.middleware,
        DischargePlanningService.middleware,

        // reporting
        resultReportApi.middleware,
        invoiceReportApi.middleware,

        // visit duration
        visitDurationService.middleware,

        // catalog
        catalogService.middleware,
        catalogDiagnosticTestService.middleware,

        // billing / price list
        BillingService.middleware,
        PriceListService.middleware,
        PriceListItemService.middleware,
        patientBillingInvoiceService.middleware,
        patientBillingInvoiceItemService.middleware,
        appointmentRequestService.middleware,

        // report templates
        ReportTemplateService.middleware,
        DiagnosticTestTemplateService.middleware,

        // sticky notes
        userStickyNotesService.middleware,

        // referral
        referralRequestService.middleware,

        // payer
        PayorService.middleware,
        PayorPlanService.middleware,


        PatientRelationService.middleware,
        patientInsurancesService.middleware,
        patientInsuranceCoveragesService.middleware,
        encounterVaccinationService.middleware,
        patientEncounterService.middleware,
        patientPaymentsService.middleware,
        priceListAttributesService.middleware,
        prescriptionPService.middleware,
        clinicalSummaryService.middleware,
        clinicalRecommendationsService.middleware,
        medicationTestOrdersValidationService.middleware,
        patientProblemService.middleware,
        familyHistoryService.middleware,
        hospitalizationService.middleware,
        surgicalHistoryService.middleware,
        socialHistoryService.middleware,
        favoriteDiagnosticTestService.middleware,
        diagnosticOrderTestService.middleware,
        diagnosticOrderService.middleware,
        diagnosticOrderTestCollectedSampleService.middleware,
        diagnosticOrderTestTechnicianNoteService.middleware,
        diagnosticTestRequestService.middleware,
        externalTestService.middleware,
        diagnosticOrderTestResultService.middleware,
        diagnosticOrderTestResultTechnicianNoteService.middleware,
        diagnosticOrderTestReportService.middleware,
        diagnosticOrderTestReportCommentsService.middleware,
        patientDiagnosticResultHistoryService.middleware,
        patientReportService.middleware,
        progressNoteService.middleware,
        patientProcedureService.middleware,
        consultationService.middleware,
        portalService.middleware,
        telephonicConsultationService.middleware,
        ICDTreeService.middleware,
        //er-triage
        generalAssessmentService.middleware,
        chiefComplainService.middleware,
        emergencyTriageService.middleware,
        encounterAssessmentService.middleware,
        encounterPlanService.middleware,
        patientDiagnosisService.middleware,
        vitalSignsService.middleware,
        bodyMeasurementsService.middleware,
        patientObservationsComplaintsService.middleware,
        painAssessmentService.middleware,
        additionalMeasurementsService.middleware,
        patientAllergiesService.middleware,
        patientWarningsService.middleware,
        procedureSetupService.middleware,
        ReviewOfSystemService.middleware,
        patientPrescriptionService.middleware,
        patientPrescriptionMedicationService.middleware,
        patientServicesAndProductsService.middleware,
        NextOfKinService.middleware,
        RelationsMatrixService.middleware,
        patientAdministrativeWarningsService.middleware,
        radiologyReportService.middleware,
        PatientRelationService.middleware,
        patientInsurancesService.middleware,
        patientInsuranceCoveragesService.middleware,
        encounterVaccinationService.middleware,
        patientEncounterService.middleware,
        patientPaymentsService.middleware,
        priceListAttributesService.middleware,
        prescriptionPService.middleware,
        clinicalSummaryService.middleware,
        clinicalRecommendationsService.middleware,
        medicationTestOrdersValidationService.middleware,
        patientProblemService.middleware,
        familyHistoryService.middleware,
        hospitalizationService.middleware,
        surgicalHistoryService.middleware,
        socialHistoryService.middleware,
        favoriteDiagnosticTestService.middleware,
        diagnosticOrderTestService.middleware,
        diagnosticOrderService.middleware,
        diagnosticOrderTestCollectedSampleService.middleware,
        diagnosticOrderTestTechnicianNoteService.middleware,
        diagnosticTestRequestService.middleware,
        externalTestService.middleware,
        diagnosticOrderTestResultService.middleware,
        diagnosticOrderTestResultTechnicianNoteService.middleware,
        diagnosticOrderTestReportService.middleware,
        diagnosticOrderTestReportCommentsService.middleware,
        patientDiagnosticResultHistoryService.middleware,
        patientReportService.middleware,
        progressNoteService.middleware,
        patientProcedureService.middleware,
        consultationService.middleware,
        portalService.middleware,
        telephonicConsultationService.middleware,
        ICDTreeService.middleware,
        //er-triage
        generalAssessmentService.middleware,
        chiefComplainService.middleware,
        emergencyTriageService.middleware,
        encounterAssessmentService.middleware,
        encounterPlanService.middleware,
        patientDiagnosisService.middleware,
        vitalSignsService.middleware,
        bodyMeasurementsService.middleware,
        patientObservationsComplaintsService.middleware,
        painAssessmentService.middleware,
        additionalMeasurementsService.middleware,
        patientAllergiesService.middleware,
        patientWarningsService.middleware,
        procedureSetupService.middleware,
        ReviewOfSystemService.middleware,
        patientPrescriptionService.middleware,
        patientPrescriptionMedicationService.middleware,
        patientServicesAndProductsService.middleware,
        NextOfKinService.middleware,
        RelationsMatrixService.middleware,
        patientAdministrativeWarningsService.middleware,
        observationServiceNew.middleware,
        organizationHolidaysService.middleware,
        PolicyDefinitionService.middleware,
        availabilityTemplateService.middleware,
        availabilityGenerationBatchService.middleware,
        availabilityTemplateIntervalService.middleware,
        availabilityTemplateIntervalBreakService.middleware,
        appointmentFromTemplateService.middleware,
        departmentServicesService.middleware,
        roomService.middleware,
        bedService.middleware,
        bedRoomService.middleware,
        encounterAssignToBedService.middleware,
        currentMedicationService.middleware,
        uccMedicationOrderService.middleware
      ]
    ) as any
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
