import React, { useEffect, useMemo, useState } from 'react';
import { useAppDispatch } from '@/hooks';
import { Form } from 'rsuite';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import { notify } from '@/utils/uiReducerActions';
import '../../styles.less';
import Translate from '@/components/Translate';
import SectionContainer from '@/components/SectionsoContainer';
import type { ChiefComplain } from '@/types/model-types-new';
import { useEnumOptions } from '@/services/enumsApi';
import { useSaveEncounterChangesMutation } from '@/services/encounterService';
import { setEncounter as setEncounterRedux } from '@/reducers/patientSlice';
import {
  useCreateChiefComplainMutation,
  useGetLatestTriageChiefComplainByEncounterQuery,
  useUpdateChiefComplainMutation
} from '@/services/encounters/chiefComplainService';

const ChiefComplainTriage = ({ patient, encounter, readOnly = false }) => {
  const dispatch = useAppDispatch();
  const toNumberOrNaN = (v: unknown) => {
    if (typeof v === 'number') return v;
    if (typeof v === 'string' && v.trim() !== '') return Number(v);
    return Number.NaN;
  };
  const isBlank = (v: unknown) => {
    if (v == null) return true;
    if (typeof v === 'string') return v.trim() === '';
    return false;
  };

  const patientId = useMemo(() => {
    const id = toNumberOrNaN(patient?.id ?? patient?.patientId ?? patient?.key);
    return Number.isNaN(id) ? null : id;
  }, [patient?.id, patient?.patientId, patient?.key]);

  const encounterId = useMemo(() => {
    const id = toNumberOrNaN(encounter?.id ?? encounter?.encounterId ?? encounter?.key);
    return Number.isNaN(id) ? null : id;
  }, [encounter?.id, encounter?.encounterId, encounter?.key]);

  const [chiefComplain, setChiefComplain] = useState<ChiefComplain>({});
  const [isDisabledField, setIsDisabledField] = useState(false);
  const [isEncounterStatusClosed, setIsEncounterStatusClosed] = useState(false);
  const [createChiefComplain] = useCreateChiefComplainMutation();
  const [updateChiefComplain] = useUpdateChiefComplainMutation();
  const [saveEncounterChanges] = useSaveEncounterChangesMutation();
  const {
    data: latestChiefComplain,
    isFetching: isFetchingLatest
  } = useGetLatestTriageChiefComplainByEncounterQuery(encounterId as any, { skip: !encounterId });


  const { data: bodyPartsLovQueryResponse } = useGetLovValuesByCodeQuery('BODY_PARTS');
  const { data: painPatternLovQueryResponse } = useGetLovValuesByCodeQuery('PAIN_PATTERN');
  const { data: severityLovQueryResponse } = useGetLovValuesByCodeQuery('SEVERITY');
  const patientConditionEnumOptions = useEnumOptions('PatientCondition');

  useEffect(() => {
    if (latestChiefComplain && !isFetchingLatest) {
      setChiefComplain(latestChiefComplain);
    }
  }, [latestChiefComplain, isFetchingLatest]);

  useEffect(() => {
    setChiefComplain(prev => ({
      ...prev,
      patientId: prev?.patientId ?? patientId ?? undefined,
      encounterId: prev?.encounterId ?? encounterId ?? undefined
    }));
  }, [patientId, encounterId]);

  // Handle Save Chief Complain
  const handleSave = async () => {
    try {
      if (!patientId || !encounterId) {
        dispatch(notify({ msg: 'Missing patientId/encounterId for Chief Complain', sev: 'error' }));
        return;
      }

      const missing: string[] = [];
      if (isBlank(chiefComplain?.chiefComplaint)) missing.push('Chief Complain');
      if (isBlank(chiefComplain?.severity)) missing.push('Severity');
      if (chiefComplain?.onsetDateTime == null || chiefComplain?.onsetDateTime === '') missing.push('Onset');

      if (missing.length) {
        dispatch(
          notify({
            msg: `Please fill required fields: ${missing.join(', ')}`,
            sev: 'error'
          })
        );
        return;
      }

      const normalizeInstant = (v: any): string | null => {
        if (v == null || v === '') return null;
        if (v instanceof Date) return v.toISOString();
        if (typeof v === 'number') return new Date(v).toISOString();
        return String(v);
      };

      const payload: ChiefComplain = {
        patientId,
        encounterId,
        chiefComplaint: chiefComplain?.chiefComplaint ?? null,
        provocation: chiefComplain?.provocation ?? null,
        palliation: chiefComplain?.palliation ?? null,
        quality: chiefComplain?.quality ?? null,
        region: chiefComplain?.region ?? null,
        severity: chiefComplain?.severity ?? null,
        onsetDateTime: normalizeInstant(chiefComplain?.onsetDateTime),
        caseUnderstanding: chiefComplain?.caseUnderstanding ?? null,
        patientCondition: chiefComplain?.patientCondition ?? null,
        isTriage: true
      };

      const updated =
        chiefComplain?.id != null
          ? await updateChiefComplain({ ...payload, id: Number(chiefComplain.id) } as any).unwrap()
          : await createChiefComplain(payload as any).unwrap();

      setChiefComplain(updated);

      // Also persist the same "chief complaint" text onto the ENCOUNTER (used by ER list/table and other screens).
      if (encounter) {
        try {
          const updatedEncounter = await saveEncounterChanges({
            ...encounter,
            chiefComplaint: updated?.chiefComplaint ?? payload?.chiefComplaint ?? null
          }).unwrap();
          // Keep redux encounter in sync if it exists in store (harmless otherwise).
          dispatch(setEncounterRedux(updatedEncounter));
        } catch (e) {
          console.error('Error saving encounter chiefComplaint:', e);
          dispatch(notify({ msg: 'Chief Complain saved, but failed to update Encounter chief complaint', sev: 'warn' }));
        }
      }

      dispatch(
        notify({
          msg: chiefComplain?.id != null ? 'Chief Complain Updated Successfully' : 'Chief Complain Added Successfully',
          sev: 'success'
        })
      );
    } catch (error) {
      console.error('Error saving Chief Complain:', error);
      dispatch(notify({ msg: 'Failed to Save Chief Complain', sev: 'error' }));
    }
  };

  // Effects
  useEffect(() => {
    // TODO update status to be a enum value
    if (encounter?.encounterStatusLkey === '91109811181900' || encounter?.discharge) {
      setIsEncounterStatusClosed(true);
    }
  }, [encounter?.encounterStatusLkey]);
  useEffect(() => {
    if (isEncounterStatusClosed) {
      setIsDisabledField(true);
    } else {
      setIsDisabledField(false);
    }
  }, [isEncounterStatusClosed]);
  return (
    <SectionContainer
      title="Chief Complain"
      content={
        <Form fluid layout="inline" className="form-inline-wrap">
          <MyInput
            className="er-chief-complain-full"
            column
            width="100%"
            fieldLabel="Chief Complain"
            fieldType="textarea"
            fieldName="chiefComplaint"
            record={chiefComplain}
            setRecord={setChiefComplain}
            disabled={isDisabledField || readOnly}
            searchable={false}
            required
          />
          <MyInput
            column
            width={200}
            fieldLabel="Provocation"
            fieldName="provocation"
            record={chiefComplain}
            setRecord={setChiefComplain}
            disabled={isDisabledField || readOnly}
            searchable={false}
          />
          <MyInput
            column
            width={200}
            fieldLabel="Palliation"
            fieldName="palliation"
            record={chiefComplain}
            setRecord={setChiefComplain}
            disabled={isDisabledField || readOnly}
            searchable={false}
          />
          <MyInput
            column
            width={200}
            fieldLabel="Quality"
            fieldType="select"
            fieldName="quality"
            selectData={painPatternLovQueryResponse?.object ?? []}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            record={chiefComplain}
            setRecord={setChiefComplain}
            disabled={isDisabledField || readOnly}
            searchable={false}
          />
          <MyInput
            column
            width={200}
            fieldLabel="Patient Condition"
            fieldType="select"
            fieldName="patientCondition"
            selectData={patientConditionEnumOptions}
            selectDataLabel="label"
            selectDataValue="value"
            record={chiefComplain}
            setRecord={setChiefComplain}
            disabled={isDisabledField || readOnly}
            searchable={false}
          />
          <MyInput
            column
            width={200}
            fieldLabel="Region"
            fieldType="select"
            fieldName="region"
            selectData={bodyPartsLovQueryResponse?.object ?? []}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            record={chiefComplain}
            setRecord={setChiefComplain}
            disabled={isDisabledField || readOnly}
            searchable={false}
          />
          <MyInput
            column
            width={200}
            fieldLabel="Severity"
            fieldType="select"
            fieldName="severity"
            selectData={severityLovQueryResponse?.object ?? []}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            record={chiefComplain}
            setRecord={setChiefComplain}
            disabled={isDisabledField || readOnly}
            searchable={false}
            required
          />
          <MyInput
            column
            width={200}
            fieldLabel="Onset"
            disabled={isDisabledField || readOnly}
            fieldName="onsetDateTime"
            fieldType="datetime"
            record={chiefComplain}
            setRecord={setChiefComplain}
            required
          />
          <MyInput
            column
            width={200}
            fieldLabel="Understanding"
            fieldName="caseUnderstanding"
            record={chiefComplain}
            setRecord={setChiefComplain}
            disabled={isDisabledField || readOnly}
          />
          {!readOnly && (
            <MyButton
           
              onClick={handleSave}
            appearance="primary"
            >
              <Translate> Save </Translate>
            </MyButton>
          )}
        </Form>
      }
    />

  );
};

export default ChiefComplainTriage;
