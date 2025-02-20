import { configureStore } from '@reduxjs/toolkit';
import uiSlice from './reducers/uiSlice';
import { uiService } from '@/services/uiService';
import { authService } from '@/services/authService';
import authSlice from '@/reducers/authSlice';
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
import divSlice from './reducers/divSlice';
import { labService } from './services/labService';

export const store = configureStore({
  reducer: {
    // ui
    [uiSlice.name]: uiSlice.reducer,
    [uiService.reducerPath]: uiService.reducer,

    // auth
    [authSlice.name]: authSlice.reducer,
    [authService.reducerPath]: authService.reducer,

    // patient
    [patientSlice.name]: patientSlice.reducer,
    [patientService.reducerPath]: patientService.reducer,
    
    //setup
    [setupService.reducerPath]: setupService.reducer,

    //medication
    [medicationsSetupService.reducerPath]: medicationsSetupService.reducer,

    //medication
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

    [labService.reducerPath]:labService.reducer

    
    // div slice 
    [divSlice.name]:divSlice.reducer 
  },
  // @ts-ignore
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware().concat([
      uiService.middleware,
      authService.middleware,
      patientService.middleware,
      setupService.middleware,
      medicationsSetupService.middleware,
      appointmentService.middleware,
      dvmService.middleware,
      encounterService.middleware,
      dentalService.middleware,
      observationService.middleware,
      attachmentService.middleware,
      labService.middleware,
      
  
    ])
});


// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
