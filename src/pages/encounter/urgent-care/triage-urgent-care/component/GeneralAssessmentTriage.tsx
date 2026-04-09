import React, { useEffect, useMemo, useState } from 'react';
import '../../styles.less';
import MyButton from '@/components/MyButton/MyButton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckDouble } from '@fortawesome/free-solid-svg-icons';
import Translate from '@/components/Translate';
import { notify } from '@/utils/uiReducerActions';
import { Form } from 'rsuite';
import { useAppDispatch } from '@/hooks';
import MyInput from '@/components/MyInput';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import SectionContainer from '@/components/SectionsoContainer';
import type { GeneralAssessment } from '@/types/model-types-new';
import {
  useCreateGeneralAssessmentMutation,
  useGetLatestTriageGeneralAssessmentByEncounterQuery,
  useUpdateGeneralAssessmentMutation
} from '@/services/encounters/generalAssessmentService';

const GeneralAssessmentTriage = ({ patient, encounter, readOnly = false }) => {
  const dispatch = useAppDispatch();

  const toNumberOrNaN = (v: unknown) => {
    if (typeof v === 'number') return v;
    if (typeof v === 'string' && v.trim() !== '') return Number(v);
    return Number.NaN;
  };
  const isBlank = (v: unknown) => v == null || String(v).trim() === '';

  const patientId = useMemo(() => {
    const id = toNumberOrNaN(patient?.id ?? patient?.patientId ?? patient?.key);
    return Number.isNaN(id) ? null : id;
  }, [patient?.id, patient?.patientId, patient?.key]);

  const encounterId = useMemo(() => {
    const id = toNumberOrNaN(encounter?.id ?? encounter?.encounterId ?? encounter?.key);
    return Number.isNaN(id) ? null : id;
  }, [encounter?.id, encounter?.encounterId, encounter?.key]);

  const [generalAssessment, setGeneralAssessment] = useState<GeneralAssessment>({});
  const [isDisabledField, setIsDisabledField] = useState(false);
  const [isEncounterStatusClosed, setIsEncounterStatusClosed] = useState(false);
  const [createGeneralAssessment] = useCreateGeneralAssessmentMutation();
  const [updateGeneralAssessment] = useUpdateGeneralAssessmentMutation();

  const { data: latestGeneralAssessment, isFetching: isFetchingLatest } =
    useGetLatestTriageGeneralAssessmentByEncounterQuery(encounterId as any, { skip: !encounterId });

  // Fetch LOV data for various fields
  const { data: positionStatusLovQueryResponse } = useGetLovValuesByCodeQuery('POSITION_STATUS');
  const { data: bodyMovementLovQueryResponse } = useGetLovValuesByCodeQuery('BODY_MOVEMENT');
  const { data: levelOfConscLovQueryResponse } = useGetLovValuesByCodeQuery('LEVEL_OF_CONSC');
  const { data: facialLovQueryResponse } = useGetLovValuesByCodeQuery('FACIAL_EXPRESS');
  const { data: speechAssLovQueryResponse } = useGetLovValuesByCodeQuery('SPEECH_ASSESSMENT');
  const { data: moodLovQueryResponse } = useGetLovValuesByCodeQuery('MOOD_BEHAVIOR');

  useEffect(() => {
    if (latestGeneralAssessment && !isFetchingLatest) {
      setGeneralAssessment(latestGeneralAssessment);
    }
  }, [latestGeneralAssessment, isFetchingLatest]);

  // Handle Save General Assessment
  const handleSave = async () => {
    try {
      if (!patientId || !encounterId) {
        dispatch(notify({ msg: 'Missing patientId/encounterId for General Assessment', sev: 'error' }));
        return;
      }

      const missing: string[] = [];
      if (isBlank(generalAssessment?.positionStatus)) missing.push('Position Status');
      if (isBlank(generalAssessment?.bodyMovements)) missing.push('Body Movements');
      if (isBlank(generalAssessment?.levelOfConsciousness)) missing.push('Level of Consciousness');
      if (isBlank(generalAssessment?.facialExpression)) missing.push('Facial Expression');
      if (isBlank(generalAssessment?.speech)) missing.push('Speech');
      if (isBlank(generalAssessment?.moodBehavior)) missing.push('Mood/Behavior');

      if (missing.length) {
        dispatch(
          notify({
            msg: `Please fill required fields: ${missing.join(', ')}`,
            sev: 'error'
          })
        );
        return;
      }

      const payload: GeneralAssessment = {
        patientId,
        encounterId,
        positionStatus: generalAssessment?.positionStatus ?? null,
        bodyMovements: generalAssessment?.bodyMovements ?? null,
        levelOfConsciousness: generalAssessment?.levelOfConsciousness ?? null,
        facialExpression: generalAssessment?.facialExpression ?? null,
        speech: generalAssessment?.speech ?? null,
        moodBehavior: generalAssessment?.moodBehavior ?? null,
        memoryRemote: !!generalAssessment?.memoryRemote,
        memoryRecent: !!generalAssessment?.memoryRecent,
        signsOfAgitation: !!generalAssessment?.signsOfAgitation,
        signsOfDepression: !!generalAssessment?.signsOfDepression,
        signsOfSuicidalIdeation: !!generalAssessment?.signsOfSuicidalIdeation,
        signsOfSubstanceUse: !!generalAssessment?.signsOfSubstanceUse,
        isTriage: true
      };

      const updated =
        generalAssessment?.id != null
          ? await updateGeneralAssessment({ ...payload, id: Number(generalAssessment.id) } as any).unwrap()
          : await createGeneralAssessment(payload as any).unwrap();

      setGeneralAssessment(updated);
      dispatch(
        notify({
          msg: generalAssessment?.id != null ? 'General Assessment Updated Successfully' : 'General Assessment Saved Successfully',
          sev: 'success'
        })
      );
    } catch (error) {
      console.error('Error saving General Assessment:', error);
      dispatch(notify({ msg: 'Failed to Save General Assessment', sev: 'error' }));
    }
  };

  useEffect(() => {
    if (String(encounter?.status ?? encounter?.encounterStatus ?? '').toUpperCase() === 'CLOSED' || encounter?.discharge) {
      setIsEncounterStatusClosed(true);
    }
  }, [encounter?.status, encounter?.encounterStatus, encounter?.discharge]);
  useEffect(() => {
    if (isEncounterStatusClosed) {
      setIsDisabledField(true);
    } else {
      setIsDisabledField(false);
    }
  }, [isEncounterStatusClosed]);

  return (
    <SectionContainer
      title="General Assessment"
      content={
        <Form fluid layout="inline" className="form-inline-wrap">
          <MyInput
            column
            width={170}
            fieldLabel="Position Status"
            fieldType="select"
            fieldName="positionStatus"
            selectData={positionStatusLovQueryResponse?.object ?? []}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            record={generalAssessment}
            setRecord={setGeneralAssessment}
            disabled={isDisabledField || readOnly}
            searchable={false}
            required
          />
          <MyInput
            column
            width={170}
            fieldLabel="Body Movements"
            fieldType="select"
            fieldName="bodyMovements"
            selectData={bodyMovementLovQueryResponse?.object ?? []}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            record={generalAssessment}
            setRecord={setGeneralAssessment}
            disabled={isDisabledField || readOnly}
            searchable={false}
            required
          />
          <MyInput
            column
            width={170}
            fieldLabel="Level of Consciousness"
            fieldType="select"
            fieldName="levelOfConsciousness"
            selectData={levelOfConscLovQueryResponse?.object ?? []}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            record={generalAssessment}
            setRecord={setGeneralAssessment}
            disabled={isDisabledField || readOnly}
            searchable={false}
            required
          />
          <MyInput
            column
            width={170}
            fieldLabel="Facial Expression"
            fieldType="select"
            fieldName="facialExpression"
            selectData={facialLovQueryResponse?.object ?? []}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            record={generalAssessment}
            setRecord={setGeneralAssessment}
            disabled={isDisabledField || readOnly}
            searchable={false}
            required
          />
          <MyInput
            column
            width={170}
            fieldLabel="Speech"
            fieldType="select"
            fieldName="speech"
            selectData={speechAssLovQueryResponse?.object ?? []}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            record={generalAssessment}
            setRecord={setGeneralAssessment}
            disabled={isDisabledField || readOnly}
            searchable={false}
            required
          />
          <MyInput
            column
            width={170}
            fieldLabel="Mood/Behavior"
            fieldType="select"
            fieldName="moodBehavior"
            selectData={moodLovQueryResponse?.object ?? []}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            record={generalAssessment}
            setRecord={setGeneralAssessment}
            disabled={isDisabledField || readOnly}
            searchable={false}
            required
          />
          <MyInput
            column
            width={200}
            fieldLabel="Memory Remote"
            fieldName="memoryRemote"
            fieldType="checkbox"
            record={generalAssessment}
            setRecord={setGeneralAssessment}
            disabled={isDisabledField || readOnly}
          />
          <MyInput
            column
            width={200}
            fieldLabel="Memory Recent"
            fieldName="memoryRecent"
            fieldType="checkbox"
            record={generalAssessment}
            setRecord={setGeneralAssessment}
            disabled={isDisabledField || readOnly}
          />
          <MyInput
            column
            width={200}
            fieldLabel="Signs of Agitation"
            fieldName="signsOfAgitation"
            fieldType="checkbox"
            record={generalAssessment}
            setRecord={setGeneralAssessment}
            disabled={isDisabledField || readOnly}
          />
          <MyInput
            column
            width={200}
            fieldLabel="Signs of Depression"
            fieldName="signsOfDepression"
            fieldType="checkbox"
            record={generalAssessment}
            setRecord={setGeneralAssessment}
            disabled={isDisabledField || readOnly}
          />
          <MyInput
            column
            width={200}
            fieldLabel="Signs of Suicidal Ideation"
            fieldName="signsOfSuicidalIdeation"
            fieldType="checkbox"
            record={generalAssessment}
            setRecord={setGeneralAssessment}
            disabled={isDisabledField || readOnly}
          />
          <MyInput
            column
            width={200}
            fieldLabel="Signs of Substance Use"
            fieldName="signsOfSubstanceUse"
            fieldType="checkbox"
            record={generalAssessment}
            setRecord={setGeneralAssessment}
            disabled={isDisabledField || readOnly}
          />
          {!readOnly && (
            <MyButton
              disabled={isDisabledField || readOnly}
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

export default GeneralAssessmentTriage;
