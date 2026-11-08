import { useAppDispatch } from '@/hooks';
import {
  useGetProcedurePostCareQuery,
  useSaveProcedurePostCareMutation
} from '@/services/patients/patientProcedureService';
import { notify } from '@/utils/uiReducerActions';
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import '../styles.less';
import { ProcedureStepHandle, useStepForm } from '../useStepForm';
import Diagnosis from './Diagnosis';
import PostProcedureAnesthesia from './PostProcedureAnesthesia';
import PostProcedureChecklist from './PostProcedureChecklist';
import ProcedureMedications from './ProcedureMedications';
import ProcedurePainScore from './ProcedurePainScore';
import ProcedureVitals from './ProcedureVitals';

const PostProcedureCare = forwardRef<ProcedureStepHandle, any>(
  ({ procedure, onDirtyChange }, ref) => {
    const dispatch = useAppDispatch();
    const medicationsRef = useRef<ProcedureStepHandle | null>(null);
    const [medicationsDirty, setMedicationsDirty] = useState(false);
    const { data: savedPostCare } = useGetProcedurePostCareQuery(procedure?.id, {
      skip: !procedure?.id
    });
    const [savePostCare] = useSaveProcedurePostCareMutation();
    const { form, setForm, isDirty, markSaved } = useStepForm(savedPostCare);

    useEffect(() => {
      onDirtyChange?.(isDirty || medicationsDirty);
    }, [isDirty, medicationsDirty, onDirtyChange]);

    useImperativeHandle(ref, () => ({
      save: async () => {
        try {
          if (isDirty || !savedPostCare?.id) {
            await savePostCare({ id: procedure.id, body: form }).unwrap();
            markSaved();
          }
          const medicationsSaved = await medicationsRef.current?.save();
          if (medicationsSaved === false) return false;
          dispatch(notify({ msg: 'Saved Successfully', sev: 'success' }));
          return true;
        } catch {
          dispatch(notify({ msg: 'Save failed', sev: 'error' }));
          return false;
        }
      }
    }));

    return (
      <div className="perform-step-body">
        <Diagnosis record={form} setRecord={setForm} />
        <div className="perform-columns">
          <div className="perform-step-body">
            <ProcedureVitals record={form} setRecord={setForm} />
            <ProcedurePainScore record={form} setRecord={setForm} />
            <PostProcedureAnesthesia record={form} setRecord={setForm} />
          </div>
          <div className="perform-step-body">
            <ProcedureMedications
              ref={medicationsRef}
              procedureId={procedure?.id}
              onDirtyChange={setMedicationsDirty}
            />
            <PostProcedureChecklist record={form} setRecord={setForm} />
          </div>
        </div>
      </div>
    );
  }
);
export default PostProcedureCare;
