import patientSlice from '@/reducers/patientSlice';
import { attachmentService } from '@/services/attachmentService';
import { authService } from '@/services/authService';
import { authServiceApi } from '@/services/authServiceApi';
import { dentalService } from '@/services/dentalService';
import { dvmService } from '@/services/dvmService';
import { encounterService } from '@/services/encounterService';
import { enumsApi } from '@/services/enumsApi';
import { observationService } from '@/services/observationService';
import { patientService } from '@/services/patientService';
import { potintialService } from '@/services/potintialDuplicateService';
import { radService } from '@/services/radService';
import { activeIngredientIndicationService } from '@/services/setup/activeIngredients/activeIngredientIndicationService';
import { BrandMedicationActiveIngredientService } from '@/services/setup/brandmedication/BrandMedicationActiveIngredientService';
import { BrandMedicationSubstituteService } from '@/services/setup/brandmedication/BrandMedicationSubstituteService';
import { CdtDentalActionService } from '@/services/setup/dental-action/CdtDentalActionService';
import { dentalActionService } from '@/services/setup/dental-action/dentalActionService';
import { diagnosticTestPathologyService } from '@/services/setup/diagnosticTest/diagnosticTestPathologyService';
import { diagnosticTestService } from '@/services/setup/diagnosticTest/diagnosticTestService';
import { radiologyService } from '@/services/setup/diagnosticTest/radiologyTestService';
import { MedicationCategoriesClassService } from '@/services/setup/medication-categories/MedicationCategoriesClassService';
import { MedicationCategoriesService } from '@/services/setup/medication-categories/MedicationCategoriesService';
import { setupService } from '@/services/setupService';
import { uiService } from '@/services/uiService';
import { userService } from '@/services/userService';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './reducers/authSlice';
import divSlice from './reducers/divSlice';
import refetchReducer from './reducers/refetchEncounterState';
import refetchPatientSideInfo from './reducers/refetchPatientSide';
import uiSlice from './reducers/uiSlice';
import { accountApi } from './services/accountService';
import { appointmentService } from './services/appointmentService';
import { encounterAttachmentsService } from './services/encounters/attachmentsService';
import { enumService } from './services/enumService';
import { inventoryTransactionAttachmentService } from './services/inventory/inventory-transaction/attachmentService';
import { inventoryTransferAttachmentService } from './services/inventory/inventory-transfer/attachmentService';
import { inventoryService } from './services/inventoryTransactionService';
import { labService } from './services/labService';
import { MedicalsheetsService } from './services/MedicalSheetsService';
import { medicationsSetupService } from './services/medicationsSetupService';
import { operationService } from './services/operationService';
import { newPatientService } from './services/patient/patientService';
import { addressService } from './services/patients/AddressService';
import { patientAttachmentService } from './services/patients/attachmentService';
import { procedureService } from './services/procedureService';
import { recoveryService } from './services/RecoveryService';
import { departmentService } from './services/security/departmentService';
import { facilityService } from './services/security/facilityService';
import { roleService } from './services/security/roleService';
import { userDepartmentService } from './services/security/userDepartmentsService';
import { userRoleService } from './services/security/UserRoleService';
import activeIngredientAdverseEffectService from './services/setup/activeIngredients/activeIngredientAdverseEffectService';
import { activeIngredientsService } from './services/setup/activeIngredients/activeIngredientsService';
import { ageGroupService } from './services/setup/ageGroupService';
import { allergensService } from './services/setup/allergensService';
import { BrandMedicationService } from './services/setup/brandmedication/BrandMedicationService ';
import { cdtCodeService } from './services/setup/cdtCodeService';
import { cptCodeService } from './services/setup/cptCodeService';
import { diagnosticTestNormalRangeService } from './services/setup/diagnosticTest/diagnosticTestNormalRangeService';
import { diagnosticTestProfileService } from './services/setup/diagnosticTest/diagnosticTestProfileService';
import { laboratoryService } from './services/setup/diagnosticTest/laboratoryService';
import { Icd10Service } from './services/setup/icd10service';
import { languageService } from './services/setup/languageService';
import { loincCodeService } from './services/setup/loincCodeService';
import { PractitionerDepartmentService } from './services/setup/practitioner/PractitionerDepartmentService';
import { PractitionerService } from './services/setup/practitioner/PractitionerService';
import { prescriptionInstructionService } from './services/setup/prescription-instruction/prescriptionInstructionService';
import { procedureCodingService } from './services/setup/procedure/procedureCodingService';
import { procedurePriceListService } from './services/setup/procedure/procedurePriceListService';
import { procedureSetupService } from './services/setup/procedure/procedureService';
import { serviceService } from './services/setup/serviceService';
import { translationService } from './services/setup/translationService';
import { vaccineBrandsService } from './services/vaccine/vaccineBrandsService';
import { vaccineDosesIntervalService } from './services/vaccine/vaccineDosesIntervalService';
import { vaccineDosesService } from './services/vaccine/vaccineDosesService';
import { vaccineService } from './services/vaccine/vaccineService';
import callReducer from './store/callSlice';

export const store = configureStore({
  reducer: {
    // ui
    [uiSlice.name]: uiSlice.reducer,
    [uiService.reducerPath]: uiService.reducer,

    // auth
    auth: authReducer,

    [authService.reducerPath]: authService.reducer,
    [authServiceApi.reducerPath]: authServiceApi.reducer,

    // patient
    [patientSlice.name]: patientSlice.reducer,
    [patientService.reducerPath]: patientService.reducer,

    //setup
    [setupService.reducerPath]: setupService.reducer,

    //inventory
    [inventoryService.reducerPath]: inventoryService.reducer,

    //medication
    [medicationsSetupService.reducerPath]: medicationsSetupService.reducer,

    [activeIngredientAdverseEffectService.reducerPath]:
      activeIngredientAdverseEffectService.reducer,

    [activeIngredientIndicationService.reducerPath]: activeIngredientIndicationService.reducer,

    //account
    [accountApi.reducerPath]: accountApi.reducer,

    //appointment
    [appointmentService.reducerPath]: appointmentService.reducer,

    //dvm
    [dvmService.reducerPath]: dvmService.reducer,

    //encounter
    [encounterService.reducerPath]: encounterService.reducer,

    //dental
    [dentalService.reducerPath]: dentalService.reducer,

    //observation
    [observationService.reducerPath]: observationService.reducer,

    //attachment
    [attachmentService.reducerPath]: attachmentService.reducer,
    [patientAttachmentService.reducerPath]: patientAttachmentService.reducer,
    [encounterAttachmentsService.reducerPath]: encounterAttachmentsService.reducer,
    [inventoryTransferAttachmentService.reducerPath]: inventoryTransferAttachmentService.reducer,
    [inventoryTransactionAttachmentService.reducerPath]:
      inventoryTransactionAttachmentService.reducer,
    //lab module
    [labService.reducerPath]: labService.reducer,
    //operation
    [operationService.reducerPath]: operationService.reducer,
    [radService.reducerPath]: radService.reducer,
    // div slice
    [divSlice.name]: divSlice.reducer,
    //role
    [roleService.reducerPath]: roleService.reducer,
    [userRoleService.reducerPath]: userRoleService.reducer,
    [enumsApi.reducerPath]: enumsApi.reducer,
    [MedicalsheetsService.reducerPath]: MedicalsheetsService.reducer,
    //cpt code
    [cptCodeService.reducerPath]: cptCodeService.reducer,
    //refetch Encounters
    refetch: refetchReducer,
    //refetch Patient Side Information
    refetchPatientSide: refetchPatientSideInfo,

    //procedure
    [procedureService.reducerPath]: procedureService.reducer,

    //prescription instruction
    [prescriptionInstructionService.reducerPath]: prescriptionInstructionService.reducer,

    //recovery

    [recoveryService.reducerPath]: recoveryService.reducer,
    [userService.reducerPath]: userService.reducer,
    [potintialService.reducerPath]: potintialService.reducer,
    call: callReducer,

    [facilityService.reducerPath]: facilityService.reducer,
    [departmentService.reducerPath]: departmentService.reducer,

    [enumService.reducerPath]: enumService.reducer,
    [userDepartmentService.reducerPath]: userDepartmentService.reducer,
    [PractitionerService.reducerPath]: PractitionerService.reducer,
    [PractitionerDepartmentService.reducerPath]: PractitionerDepartmentService.reducer,

    //Categories setup
    [MedicationCategoriesService.reducerPath]: MedicationCategoriesService.reducer,
    [MedicationCategoriesClassService.reducerPath]: MedicationCategoriesClassService.reducer,

    // Language slice
    [languageService.reducerPath]: languageService.reducer,

    // Translation slice
    [translationService.reducerPath]: translationService.reducer,

    //service
    [serviceService.reducerPath]: serviceService.reducer,

    //age group
    [ageGroupService.reducerPath]: ageGroupService.reducer,

    [Icd10Service.reducerPath]: Icd10Service.reducer,
    [allergensService.reducerPath]: allergensService.reducer,
    [diagnosticTestService.reducerPath]: diagnosticTestService.reducer,
    [laboratoryService.reducerPath]: laboratoryService.reducer,
    [radiologyService.reducerPath]: radiologyService.reducer,
    [activeIngredientsService.reducerPath]: activeIngredientsService.reducer,

    //loinc code
    [loincCodeService.reducerPath]: loincCodeService.reducer,
    [diagnosticTestProfileService.reducerPath]: diagnosticTestProfileService.reducer,

    [diagnosticTestPathologyService.reducerPath]: diagnosticTestPathologyService.reducer,
    [dentalActionService.reducerPath]: dentalActionService.reducer,
    [diagnosticTestNormalRangeService.reducerPath]: diagnosticTestNormalRangeService.reducer,

    //cdt code
    [cdtCodeService.reducerPath]: cdtCodeService.reducer,

    // procedure
    // procedure setup
    [procedureSetupService.reducerPath]: procedureSetupService.reducer,
    // procedure coding
    [procedureCodingService.reducerPath]: procedureCodingService.reducer,
    // procedure price list
    [procedurePriceListService.reducerPath]: procedurePriceListService.reducer,
    //vaccine
    [vaccineService.reducerPath]: vaccineService.reducer,
    [vaccineBrandsService.reducerPath]: vaccineBrandsService.reducer,
    [vaccineDosesService.reducerPath]: vaccineDosesService.reducer,
    [vaccineDosesIntervalService.reducerPath]: vaccineDosesIntervalService.reducer,
    [BrandMedicationService.reducerPath]: BrandMedicationService.reducer,
    [BrandMedicationSubstituteService.reducerPath]: BrandMedicationSubstituteService.reducer,
    [CdtDentalActionService.reducerPath]: CdtDentalActionService.reducer,
    [BrandMedicationActiveIngredientService.reducerPath]:
      BrandMedicationActiveIngredientService.reducer,

    // Patient
    [newPatientService.reducerPath]: newPatientService.reducer,

    //
    [addressService.reducerPath]: addressService.reducer
  },
  // @ts-ignore
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware().concat([
      uiService.middleware,
      authService.middleware,
      authServiceApi.middleware,
      accountApi.middleware,
      patientService.middleware,
      inventoryService.middleware,
      setupService.middleware,
      medicationsSetupService.middleware,
      activeIngredientAdverseEffectService.middleware,
      activeIngredientIndicationService.middleware,
      appointmentService.middleware,
      dvmService.middleware,
      encounterService.middleware,
      dentalService.middleware,
      observationService.middleware,
      attachmentService.middleware,
      patientAttachmentService.middleware,
      encounterAttachmentsService.middleware,
      inventoryTransferAttachmentService.middleware,
      inventoryTransactionAttachmentService.middleware,
      labService.middleware,
      radService.middleware,
      procedureService.middleware,
      operationService.middleware,
      recoveryService.middleware,
      userService.middleware,
      enumsApi.middleware,
      facilityService.middleware,
      departmentService.middleware,
      roleService.middleware,
      userRoleService.middleware,
      enumService.middleware,
      userDepartmentService.middleware,
      MedicalsheetsService.middleware,
      serviceService.middleware,
      MedicationCategoriesService.middleware,
      MedicationCategoriesClassService.middleware,
      languageService.middleware,
      translationService.middleware,
      PractitionerService.middleware,
      PractitionerDepartmentService.middleware,
      ageGroupService.middleware,
      Icd10Service.middleware,
      allergensService.middleware,
      potintialService.middleware,
      diagnosticTestService.middleware,
      cdtCodeService.middleware,
      loincCodeService.middleware,
      cptCodeService.middleware,
      laboratoryService.middleware,
      diagnosticTestProfileService.middleware,
      diagnosticTestPathologyService.middleware,
      radiologyService.middleware,
      activeIngredientsService.middleware,
      dentalActionService.middleware,
      diagnosticTestNormalRangeService.middleware,
      vaccineService.middleware,
      vaccineBrandsService.middleware,
      procedureSetupService.middleware,
      procedureCodingService.middleware,
      procedurePriceListService.middleware,
      vaccineService.middleware,
      vaccineBrandsService.middleware,
      vaccineDosesService.middleware,
      vaccineDosesIntervalService.middleware,
      BrandMedicationService.middleware,
      BrandMedicationSubstituteService.middleware,
      prescriptionInstructionService.middleware,
      CdtDentalActionService.middleware,
      BrandMedicationActiveIngredientService.middleware,
      newPatientService.middleware,
      addressService.middleware
    ])
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
