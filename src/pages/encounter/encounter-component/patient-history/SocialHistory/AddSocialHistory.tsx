import React, { useEffect, useState } from 'react';
import { Form } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSmoking, faWineGlass, faPills, faHeartbeat } from '@fortawesome/free-solid-svg-icons';

import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import CollapsibleSection from '@/components/CollapsibleSection/CollapsibleSection';

import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import {
  useAddSocialHistoryMutation,
  useUpdateSocialHistoryMutation
} from '@/services/patients/socialHistoryService';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import './style.less';
import Translate from '@/components/Translate';

type SocialHistory = {
  id?: number | null;
  patientId?: number | null;

  isCurrentSmoker?: boolean;
  smokeStartDate?: any;
  cigaretteAmount?: number | null;
  cigaretteType?: string;

  isPreviousSmoker?: boolean;
  smokeQuitDate?: any;

  exposureToSecondHandSmoke?: boolean;

  alcoholConsumption?: boolean;
  typeOfAlcohol?: string;
  alcoholSinceWhen?: any;

  substanceUse?: boolean;
  route?: any;
  frequency?: any;

  physicalLimitation?: any;
  diagnosedEatingDisorders?: any;
};

const newSocialHistory: SocialHistory = {
  id: null,
  patientId: null,

  isCurrentSmoker: false,
  smokeStartDate: null,
  cigaretteAmount: null,
  cigaretteType: '',

  isPreviousSmoker: false,
  smokeQuitDate: null,

  exposureToSecondHandSmoke: false,

  alcoholConsumption: false,
  typeOfAlcohol: '',
  alcoholSinceWhen: null,

  substanceUse: false,
  route: null,
  frequency: null,

  physicalLimitation: null,
  diagnosedEatingDisorders: null
};

const handleCrudError = (err: any, dispatch: any, keyMap: Record<string, string>) => {
  const data = err?.data ?? {};
  const traceId = data?.traceId || data?.requestId || data?.correlationId;
  const suffix = traceId ? `\nTrace ID: ${traceId}` : '';

  if (Array.isArray(data?.fieldErrors) && data.fieldErrors.length > 0) {
    const normalizeMsg = (msg: string) => {
      const m = (msg || '').toLowerCase();
      if (m.includes('must not be null')) return 'is required';
      if (m.includes('must not be blank')) return 'must not be blank';
      return msg || 'invalid value';
    };

    const lines = data.fieldErrors.map((fe: any) => `• ${fe.field}: ${normalizeMsg(fe.message)}`);

    dispatch(
      notify({
        msg: `Please fix the following fields:\n${lines.join('\n')}${suffix}`,
        sev: 'warning'
      })
    );
    return;
  }

  const messageProp: string = data?.message || '';
  const errorKey = messageProp.startsWith('error.') ? messageProp.substring(6) : data?.errorKey;

  dispatch(
    notify({
      msg:
        keyMap[errorKey] ||
        data?.detail ||
        data?.title ||
        data?.message ||
        'Unexpected error' + suffix,
      sev: 'warning'
    })
  );
};

const SOCIAL_HISTORY_ERROR_MAP: Record<string, string> = {
  'payload.required': 'Social history payload is required.',
  'patient.invalid': 'Invalid patient reference.',
  'smoke.start.required': 'Start date is required for current smoker.',
  'smoke.start.future': 'Smoke start date cannot be in the future.',
  'cigarette.amount.required': 'Cigarette amount is required and must be greater than 0.',
  'smoke.quit.required': 'Quit date is required for previous smoker.',
  'smoke.quit.future': 'Smoke quit date cannot be in the future.',
  'smoker.conflict': 'Cannot be both current and previous smoker.',
  'alcohol.since.required': 'Alcohol since when is required.',
  'alcohol.since.future': 'Alcohol start date cannot be in the future.',
  'current.smoker.required': 'Start date and cigarette amount are required for current smoker.',
  'previous.smoker.required': 'Quit date is required for previous smoker.',
  duplicate: 'Social history already exists for this patient.',
  'db.constraint': 'Database constraint violation.',
  notfound: 'Social history not found.'
};

const toNoonTimestamp = (value: any): number | null => {
  if (!value) return null;
  const d = value instanceof Date ? new Date(value) : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(12, 0, 0, 0);
  return d.getTime();
};

const AddSocialHistory = ({ open, setOpen, initialData, patient }) => {
  const dispatch = useAppDispatch();

  const [record, setRecord] = useState<SocialHistory>(() => ({
    ...newSocialHistory,
    patientId: patient?.id
  }));
  const { data: routeLov } = useGetLovValuesByCodeQuery('MED_ROA');
  const { data: freqLov } = useGetLovValuesByCodeQuery('FREQUENT_USE');
  const { data: physicalLov } = useGetLovValuesByCodeQuery('PHYSICAL_LIMITATION');
  const { data: diagnoseLov } = useGetLovValuesByCodeQuery('EATING_DISORDERS');

  const [addSocialHistory] = useAddSocialHistoryMutation();
  const [updateSocialHistory] = useUpdateSocialHistoryMutation();

  const [smokingExpanded, setSmokingExpanded] = useState(true);
  const [alcoholExpanded, setAlcoholExpanded] = useState(false);
  const [substanceExpanded, setSubstanceExpanded] = useState(false);
  const [healthExpanded, setHealthExpanded] = useState(false);

  const resetAll = () => {
    setRecord({
      ...newSocialHistory,
      patientId: patient?.id
    });
  };

  useEffect(() => {
    if (!open) return;

    if (initialData?.id) {
      setRecord({
        id: initialData.id,
        patientId: patient?.id,

        isCurrentSmoker: initialData.isCurrentSmoker || false,
        smokeStartDate: initialData.smokeStartDate || null,
        cigaretteAmount: initialData.cigaretteAmount || null,
        cigaretteType: initialData.cigaretteType || '',

        isPreviousSmoker: initialData.isPreviousSmoker || false,
        smokeQuitDate: initialData.smokeQuitDate || null,

        exposureToSecondHandSmoke: initialData.exposureToSecondHandSmoke || false,

        alcoholConsumption: initialData.alcoholConsumption || false,
        typeOfAlcohol: initialData.typeOfAlcohol || '',
        alcoholSinceWhen: initialData.alcoholSinceWhen || null,

        substanceUse: initialData.substanceUse || false,
        route: initialData.route || null,
        frequency: initialData.frequency || null,

        physicalLimitation: initialData.physicalLimitation || null,
        diagnosedEatingDisorders: initialData.diagnosedEatingDisorders || null
      });
    } else {
      resetAll();
    }
  }, [open, initialData, patient?.id]);

  const validateBeforeSave = (): string[] => {
    const errors: string[] = [];
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    if (record.isCurrentSmoker && record.isPreviousSmoker) {
      errors.push('Cannot be both a current smoker and a previous smoker.');
    }

    if (record.isCurrentSmoker) {
      if (!record.smokeStartDate) {
        errors.push('Smoke start date is required for current smokers.');
      } else if (new Date(record.smokeStartDate) > today) {
        errors.push('Smoke start date cannot be in the future.');
      }
      if (!record.cigaretteAmount || record.cigaretteAmount <= 0) {
        errors.push('Cigarette amount is required and must be greater than 0 for current smokers.');
      }
    }

    if (record.isPreviousSmoker) {
      if (!record.smokeQuitDate) {
        errors.push('Smoke quit date is required for previous smokers.');
      } else if (new Date(record.smokeQuitDate) > today) {
        errors.push('Smoke quit date cannot be in the future.');
      }
    }

    if (record.alcoholConsumption) {
      if (!record.alcoholSinceWhen) {
        errors.push('"Since when" date is required when alcohol consumption is enabled.');
      } else if (new Date(record.alcoholSinceWhen) > today) {
        errors.push('Alcohol since-when date cannot be in the future.');
      }
    }

    return errors;
  };

  const handleSave = async () => {
    const errors = validateBeforeSave();
    if (errors.length) {
      dispatch(notify({ msg: errors.join('\n'), sev: 'warning' }));
      return;
    }

    const payload: any = {
      patientId: Number(patient?.id),

      isCurrentSmoker: record.isCurrentSmoker ?? false,
      smokeStartDate:
        record.isCurrentSmoker && record.smokeStartDate
          ? toNoonTimestamp(record.smokeStartDate)
          : null,
      cigaretteAmount: record.isCurrentSmoker ? (record.cigaretteAmount ?? null) : null,
      cigaretteType: record.isCurrentSmoker
        ? (record.cigaretteType?.trim() || null)
        : null,

      isPreviousSmoker: record.isPreviousSmoker ?? false,
      smokeQuitDate:
        record.isPreviousSmoker && record.smokeQuitDate
          ? toNoonTimestamp(record.smokeQuitDate)
          : null,

      exposureToSecondHandSmoke: record.exposureToSecondHandSmoke ?? false,

      alcoholConsumption: record.alcoholConsumption ?? false,
      typeOfAlcohol: record.alcoholConsumption
        ? (record.typeOfAlcohol?.trim() || null)
        : null,
      alcoholSinceWhen:
        record.alcoholConsumption && record.alcoholSinceWhen
          ? toNoonTimestamp(record.alcoholSinceWhen)
          : null,

      substanceUse: record.substanceUse ?? false,
      route: record.substanceUse ? (record.route || null) : null,
      frequency: record.substanceUse ? (record.frequency || null) : null,

      physicalLimitation: record.physicalLimitation || null,
      diagnosedEatingDisorders: record.diagnosedEatingDisorders || null
    };

    if (record.id) {
      payload.id = record.id;
    }

    try {
      if (record.id) {
        await updateSocialHistory(payload).unwrap();
        dispatch(notify({ msg: 'Social history updated successfully', sev: 'success' }));
      } else {
        await addSocialHistory(payload).unwrap();
        dispatch(notify({ msg: 'Social history added successfully', sev: 'success' }));
      }
      setOpen(false);
    } catch (err: any) {
      handleCrudError(err, dispatch, SOCIAL_HISTORY_ERROR_MAP);
    }
  };

  const content = (
    <div className="padding-8">
      <CollapsibleSection
        title={<Translate>Smoking History</Translate>}
        icon={faSmoking}
        color="#415be7"
        isOpen={smokingExpanded}
        onToggle={() => setSmokingExpanded(!smokingExpanded)}
        badge={record?.isCurrentSmoker ? 'Active' : record?.isPreviousSmoker ? 'Former' : null}
      >
        <Form fluid layout="inline" className="fields-container">
          <div className="full-row">
            <MyInput
              width={180}
              column
              fieldType="checkbox"
              fieldLabel="Current Smoker"
              fieldName="isCurrentSmoker"
              record={record}
              setRecord={setRecord}
              disabled={record?.isPreviousSmoker}
            />
          </div>
          {record?.isCurrentSmoker && (
            <>
              <MyInput
                width={180}
                column
                required
                fieldType="date"
                fieldLabel="Start date"
                fieldName="smokeStartDate"
                record={record}
                setRecord={setRecord}
              />
              <MyInput
                width={110}
                column
                required
                fieldType="number"
                fieldLabel="Amount"
                fieldName="cigaretteAmount"
                record={record}
                setRecord={setRecord}
                rightAddon="pack/day"
                rightAddonwidth={80}
              />
              <MyInput
                width={180}
                column
                fieldLabel="Cigarette Type"
                fieldName="cigaretteType"
                record={record}
                setRecord={setRecord}
              />
            </>
          )}

          <div className="full-row">
            <MyInput
              width={180}
              column
              fieldType="checkbox"
              fieldLabel="Previous Smoker"
              fieldName="isPreviousSmoker"
              record={record}
              setRecord={setRecord}
              disabled={record?.isCurrentSmoker}
            />
          </div>
          {record?.isPreviousSmoker && (
            <div className="full-row">
              <MyInput
                width={180}
                column
                required
                fieldType="date"
                fieldLabel="Quit date"
                fieldName="smokeQuitDate"
                record={record}
                setRecord={setRecord}
              />
            </div>
          )}

          <MyInput
            width={180}
            column
            fieldType="checkbox"
            fieldLabel="Exposure to second-hand smoke"
            fieldName="exposureToSecondHandSmoke"
            record={record}
            setRecord={setRecord}
          />
        </Form>
      </CollapsibleSection>

      <CollapsibleSection
        title={<Translate>Alcohol Consumption</Translate>}
        icon={faWineGlass}
        color="#415be7"
        isOpen={alcoholExpanded}
        onToggle={() => setAlcoholExpanded(!alcoholExpanded)}
        badge={record.alcoholConsumption ? 'Active' : null}
      >
        <Form fluid layout="inline" className="fields-container">
          <div className="full-row">
            <MyInput
              width={180}
              column
              fieldType="checkbox"
              fieldLabel="Alcohol Consumption"
              fieldName="alcoholConsumption"
              record={record}
              setRecord={setRecord}
            />
          </div>
          {record?.alcoholConsumption && (
            <>
              <MyInput
                width={180}
                column
                required
                fieldType="date"
                fieldLabel="Since when"
                fieldName="alcoholSinceWhen"
                record={record}
                setRecord={setRecord}
              />

              <MyInput
                width={180}
                column
                fieldLabel="Type of alcohol"
                fieldName="typeOfAlcohol"
                record={record}
                setRecord={setRecord}
              />
            </>
          )}
        </Form>
      </CollapsibleSection>

      <CollapsibleSection
        title={<Translate>Substance Use</Translate>}
        icon={faPills}
        color="#415be7"
        isOpen={substanceExpanded}
        onToggle={() => setSubstanceExpanded(!substanceExpanded)}
        badge={record.substanceUse ? 'Active' : null}
      >
        <Form fluid layout="inline" className="fields-container">
          <div className="full-row">
            <MyInput
              width={180}
              column
              fieldType="checkbox"
              fieldLabel={<Translate>Substance Use</Translate>}
              fieldName="substanceUse"
              record={record}
              setRecord={setRecord}
            />
          </div>
          {record?.substanceUse && (
            <>
              <MyInput
                width={180}
                column
                fieldLabel="Route"
                fieldName="route"
                fieldType="select"
                selectData={routeLov?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={record}
                setRecord={setRecord}
              />

              <MyInput
                width={180}
                column
                fieldLabel="Frequency"
                fieldName="frequency"
                fieldType="select"
                selectData={freqLov?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={record}
                setRecord={setRecord}
                searchable={false}
              />
            </>
          )}
        </Form>
      </CollapsibleSection>

      <CollapsibleSection
        title={<Translate>Health Conditions</Translate>}
        icon={faHeartbeat}
        color="#415be7"
        isOpen={healthExpanded}
        onToggle={() => setHealthExpanded(!healthExpanded)}
      >
        <Form fluid layout="inline" className="fields-container">
          <MyInput
            width={180}
            column
            fieldLabel="Physical limitations"
            fieldName="physicalLimitation"
            fieldType="select"
            selectData={physicalLov?.object ?? []}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            record={record}
            setRecord={setRecord}
            searchable={false}
          />

          <MyInput
            width={180}
            column
            fieldLabel="Diagnosed eating disorders"
            fieldName="diagnosedEatingDisorders"
            fieldType="select"
            selectData={diagnoseLov?.object ?? []}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            record={record}
            setRecord={setRecord}
            searchable={false}
          />
        </Form>
      </CollapsibleSection>
    </div>
  );

          // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';


  return (
    <MyModal
      open={open}
      setOpen={value => {
        if (!value) resetAll();
        setOpen(value);
      }}
      title={record?.id ? 'Edit Social History' : 'Add Social History'}
      steps={[{ title: 'Social History', icon: <FontAwesomeIcon icon={faSmoking} /> }]}
      actionButtonFunction={handleSave}
      position="right"
      size="38vw"
      content={<div dir={dir}>{content}</div>}
    />
  );
};

export default AddSocialHistory;