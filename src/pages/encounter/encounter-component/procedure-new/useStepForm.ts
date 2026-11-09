import { useEffect, useState } from 'react';

export type ProcedureStepHandle = {
  save: () => Promise<boolean>;
};

/** Form state of a Perform step: follows the loaded record and reports unsaved changes. */
export const useStepForm = (loaded: any, onDirtyChange?: (dirty: boolean) => void) => {
  const [form, setForm] = useState<any>({});
  const [baseline, setBaseline] = useState('{}');

  useEffect(() => {
    if (!loaded) return;
    setForm(loaded);
    setBaseline(JSON.stringify(loaded));
  }, [loaded]);

  const isDirty = JSON.stringify(form) !== baseline;

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const markSaved = () => setBaseline(JSON.stringify(form));

  return { form, setForm, isDirty, markSaved };
};
