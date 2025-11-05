import { configureStore } from '@reduxjs/toolkit';
import uiSlice from './reducers/uiSlice';
import { uiService } from '@/services/uiService';
import { authService } from '@/services/authService';
import authSlice from '@/reducers/authSlice';
import { authServiceApi } from '@/services/authServiceApi';
import { patientService } from '@/services/patientService';
import patientSlice from '@/reducers/patientSlice';
import { setupService } from '@/services/setupService';
import { dvmService } from '@/services/dvmService';
import { encounterService } from '@/services/encounterService';
import { dentalService } from '@/services/dentalService';
import { observationService } from '@/services/observationService';
import { medicationsSetupService } from './services/medicationsSetupService';
import { attachmentService } from '@/services/attachmentService';
import { appointmentService } from './services/appointmentService';
import { userService } from '@/services/userService';
import divSlice from './reducers/divSlice';
import { labService } from './services/labService';
import { radService } from '@/services/radService';
import { procedureService } from './services/procedureService';
import { operationService } from './services/operationService';
import { inventoryService } from './services/inventoryTransactionService';
import refetchReducer from './reducers/refetchEncounterState';
import { recoveryService } from './services/RecoveryService';
import refetchPatientSideInfo from './reducers/refetchPatientSide';
import { accountApi } from './services/accountService';
import authReducer from './reducers/authSlice';
import callReducer from './store/callSlice';
import { enumsApi } from '@/services/enumsApi';
import { facilityService } from './services/security/facilityService';
import { departmentService } from './services/security/departmentService';
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
import {Icd10Service} from './services/setup/icd10service';
import { patientAttachmentService } from './services/patients/attachmentService';
import { ageGroupService } from './services/setup/ageGroupService';
import {potintialService} from '@/services/potintialDuplicateService';
import { allergensService } from './services/setup/allergensService';
import { diagnosticTestService } from '@/services/setup/diagnosticTest/diagnosticTestService';
import { encounterAttachmentsService } from './services/encounters/attachmentsService';
import { loincCodeService } from './services/setup/loincCodeService';
import { cptCodeService } from './services/setup/cptCodeService';
import { laboratoryService } from './services/setup/diagnosticTest/laboratoryService';
import{diagnosticTestProfileService} from './services/setup/diagnosticTestProfileService';
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
    [MedicalsheetsService.reducerPath]:MedicalsheetsService.reducer,
    //cpt code
    [cptCodeService.reducerPath]: cptCodeService.reducer,
    //refetch Encounters
    refetch: refetchReducer,
    //refetch Patient Side Information
    refetchPatientSide: refetchPatientSideInfo,

    //procedure 
    [procedureService.reducerPath]: procedureService.reducer,

    //recovery

    [recoveryService.reducerPath]: recoveryService.reducer,
    [userService.reducerPath]: userService.reducer,
    [potintialService.reducerPath] :potintialService.reducer,
    call: callReducer,

    [facilityService.reducerPath]: facilityService.reducer,
    [departmentService.reducerPath]: departmentService.reducer,

    [enumService.reducerPath]: enumService.reducer,
    [userDepartmentService.reducerPath]:userDepartmentService.reducer,
    [PractitionerService.reducerPath]:PractitionerService.reducer,
    [PractitionerDepartmentService.reducerPath]:PractitionerDepartmentService.reducer,

    
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

    //loinc code
    [loincCodeService.reducerPath]: loincCodeService.reducer,
    [diagnosticTestProfileService.reducerPath]: diagnosticTestProfileService.reducer,

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
      appointmentService.middleware,
      dvmService.middleware,
      encounterService.middleware,
      dentalService.middleware,
      observationService.middleware,
      attachmentService.middleware,
      patientAttachmentService.middleware,
      encounterAttachmentsService.middleware,
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
      languageService.middleware,
      translationService.middleware,
      PractitionerService.middleware,
      PractitionerDepartmentService.middleware,
      ageGroupService.middleware,
      Icd10Service.middleware,
      allergensService.middleware,
      potintialService.middleware,
      diagnosticTestService.middleware,
      loincCodeService.middleware,
      cptCodeService.middleware,
      laboratoryService.middleware,
      diagnosticTestProfileService.middleware,
    ])
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;