import { useLazyGetPatientLabelQuery } from '@/services/patient/patientService';
import { printPatientLabel } from '@/utils/printPatientLabel';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';

export default function PrintPatientLabelAction({ patientId }) {
  const dispatch = useAppDispatch();

  const [trigger] = useLazyGetPatientLabelQuery();

  const onPrint = async () => {
    try {
      const res = await trigger({ patientId }).unwrap();

      await printPatientLabel(res);
    } catch (err: any) {
      dispatch(
        notify({
          msg: err?.data?.message || 'Print failed',
          sev: 'error'
        })
      );
    }
  };

  return onPrint;
}
