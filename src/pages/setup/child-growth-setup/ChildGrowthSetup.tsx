import React, { useEffect, useMemo, useState } from 'react';
import { Form, Panel } from 'rsuite';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import MyStepper from '@/components/MyStepper';
import Translate from '@/components/Translate';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { notify } from '@/utils/uiReducerActions';
import { extractErrorMessage } from '@/utils/extractErrorMessage';
import {
  toChildGrowthSetupBody,
  useGetActiveChildGrowthUsersQuery,
  useGetChildGrowthSetupQuery,
  useSaveChildGrowthSetupMutation
} from '@/services/setup/child-growth/childGrowthSetupService';
import ChartTypesStep from './ChartTypesStep';
import ResultRangesStep from './ResultRangesStep';
import {
  IndicatorId,
  Scope,
  StatusBand,
  SetupState,
  SCOPES,
  alertedOf,
  validateAlerts,
  validateAllBands,
  validateCharts,
  validateLimits,
  validateRules
} from './model';
import './styles.less';

const STEPS = [
  {
    key: 'charts',
    title: 'Chart types, sex and age',
    description: 'Who each chart applies to'
  },
  {
    key: 'ranges',
    title: 'Result ranges',
    description: 'Status bands, limits and alerts'
  }
];

const setupFromResponse = (data: SetupState): SetupState => ({
  charts: data.charts,
  rules: data.rules,
  bandsByIndicator: (Object.keys(data.bandsByIndicator) as IndicatorId[]).reduce(
    (bands, indicator) => {
      bands[indicator] = (data.bandsByIndicator[indicator] ?? []).map(band => {
        const { alert: _legacy, ...rest } = band as StatusBand & { alert?: unknown };
        return { ...rest, alerted: alertedOf(band) };
      });
      return bands;
    },
    {} as SetupState['bandsByIndicator']
  ),
  limits: data.limits,
  alerts: data.alerts
});

const ChildGrowthSetup = () => {
  const dispatch = useAppDispatch();
  const tenant = useAppSelector(state => state.auth?.tenant);
  const menu = useAppSelector(state => state.auth?.menu);
  const facility = tenant?.selectedFacility;
  const facilityId = facility?.id != null && facility.id !== '' ? Number(facility.id) : undefined;
  const facilityName = facility?.name || facility?.facilityName || '';
  const canEdit = (menu ?? []).some(
    (item: { screen?: string; operations?: string[] }) =>
      item?.screen === 'CHILD_GROWTH_SETUP' && (item.operations ?? []).includes('EDIT')
  );

  const [step, setStep] = useState(0);
  const [scope, setScope] = useState<Scope>('FACILITY');
  const [indicator, setIndicator] = useState<IndicatorId>('WFA');
  const [draft, setDraft] = useState<SetupState | null>(null);
  const [saved, setSaved] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);

  const needsFacility = scope !== 'ORGANIZATION';
  const needsUser = scope === 'USER';
  const queryUserIds = useMemo(
    () => [...selectedUserIds].filter(id => Number.isFinite(id)).sort((left, right) => left - right),
    [selectedUserIds]
  );
  const userKey = queryUserIds.join(',');
  const missingFacility = needsFacility && !facilityId;
  const missingUsers = needsUser && queryUserIds.length === 0;
  const missingTarget = missingFacility || missingUsers;
  const queryFacilityId = needsFacility ? facilityId : undefined;

  const { data: facilityUsers = [], isFetching: loadingUsers } = useGetActiveChildGrowthUsersQuery(
    facilityId as number,
    { skip: !needsUser || !facilityId }
  );
  const userOptions = useMemo(
    () =>
      facilityUsers.map(person => ({
        id: person.id,
        displayName:
          [person.firstName, person.lastName].filter(Boolean).join(' ').trim() ||
          person.login ||
          `User ${person.id}`
      })),
    [facilityUsers]
  );

  const { data, isError } = useGetChildGrowthSetupQuery(
    { scope, facilityId: queryFacilityId, userIds: needsUser ? queryUserIds : undefined },
    { skip: missingTarget }
  );
  const [saveSetup, { isLoading: isSaving }] = useSaveChildGrowthSetupMutation();

  useEffect(() => {
    dispatch(setPageCode('Child_Growth_Setup'));
    dispatch(setDivContent('Child Growth Setup'));
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch]);

  useEffect(() => {
    setSelectedUserIds([]);
  }, [facilityId]);

  useEffect(() => {
    setDraft(null);
    setSaved(false);
  }, [scope, queryFacilityId, userKey]);

  useEffect(() => {
    if (!data) return;
    setDraft(setupFromResponse(data));
    setSaved(data.saved);
  }, [data]);

  const warn = (message: string | null) => {
    if (!message) return false;
    dispatch(notify({ msg: message, sev: 'warning' }));
    return true;
  };

  const save = async () => {
    if (!draft || missingTarget) return;
    const chartError = validateCharts(draft.charts);
    const ruleError = validateRules(draft.rules);
    const bandError = validateAllBands(draft.bandsByIndicator);
    const limitError = validateLimits(draft.limits);
    const alertError = validateAlerts(draft.alerts);
    if (warn(chartError || ruleError || bandError || limitError || alertError)) return;
    try {
      const savedSetup = await saveSetup(
        toChildGrowthSetupBody(scope, queryFacilityId, needsUser ? queryUserIds : undefined, draft)
      ).unwrap();
      setDraft(setupFromResponse(savedSetup));
      setSaved(true);
      dispatch(notify({ msg: 'Child growth setup saved', sev: 'success' }));
    } catch (error) {
      const body = (error as { data?: { detail?: string; title?: string } })?.data;
      dispatch(notify({
        msg: body?.detail || body?.title || extractErrorMessage(error) || 'Could not save the child growth setup',
        sev: 'error'
      }));
    }
  };

  const goNext = () => {
    if (!draft) return;
    if (warn(validateCharts(draft.charts) || validateRules(draft.rules))) return;
    setStep(1);
  };

  const scopeLabel = (id: Scope) => {
    if (id === 'FACILITY') return facilityName ? `Facility: ${facilityName}` : 'Facility';
    if (id === 'USER') {
      const count = queryUserIds.length;
      const who = count === 0 ? 'User' : count === 1 ? '1 user' : `${count} users`;
      return facilityName ? `${who} at ${facilityName}` : who;
    }
    return SCOPES.find(item => item.id === id)?.label ?? id;
  };

  const direction = localStorage.getItem('direction') || 'LTR';
  const statusText = missingFacility
    ? 'Select a facility before editing this scope'
    : missingUsers
      ? 'Select the users this setup applies to'
      : saved
        ? 'Saved configuration'
        : 'Example values for the clinical team to confirm';

  return (
    <div className="child-growth-setup" dir={direction === 'RTL' ? 'rtl' : 'ltr'}>
      <div className="cgs-top">
        <div>
          <h2 className="cgs-title">
            <Translate>Child growth setup</Translate>
            <span>
              {' '}
              · <Translate>{`Step ${step + 1} of 2`}</Translate>
              {': '}
              <Translate>{STEPS[step].title}</Translate>
            </span>
          </h2>
          <p className="cgs-sub">
            <Translate>{`${scopeLabel(scope)} · ${statusText}`}</Translate>
          </p>
        </div>
        <div className="cgs-scopes">
          {SCOPES.map(item => (
            <MyButton
              key={item.id}
              appearance={scope === item.id ? 'primary' : 'ghost'}
              onClick={() => setScope(item.id)}
            >
              {item.id === 'FACILITY' && facilityName ? `Facility: ${facilityName}` : item.label}
            </MyButton>
          ))}
        </div>
      </div>

      {needsUser && (
        <Form fluid className="cgs-users">
          <MyInput
            width="100%"
            fieldLabel="Users"
            fieldName="userIds"
            fieldType="checkPicker"
            selectData={userOptions}
            selectDataLabel="displayName"
            selectDataValue="id"
            record={{ userIds: selectedUserIds }}
            setRecord={(next: { userIds?: Array<number | string> }) => {
              const ids = Array.from(
                new Set((next.userIds ?? []).map(id => Number(id)).filter(id => Number.isFinite(id)))
              );
              setSelectedUserIds(ids);
            }}
            searchable
            placeholder={facilityId ? 'Select users' : 'Select a facility first'}
            disabled={!facilityId}
            loading={loadingUsers}
          />
        </Form>
      )}

      <MyStepper
        activeStep={step}
        stepsList={STEPS.map(item => ({
          key: item.key,
          value: <Translate>{item.title}</Translate>,
          description: item.description
        }))}
      />

      {missingTarget ? (
        <Panel bordered className="cgs-card">
          <p className="cgs-note">
            <Translate>
              {missingFacility
                ? 'Select a facility to load this child growth setup.'
                : 'Select one or more active users at this facility.'}
            </Translate>
          </p>
        </Panel>
      ) : isError ? (
        <Panel bordered className="cgs-card">
          <p className="cgs-note">
            <Translate>The child growth setup could not be loaded.</Translate>
          </p>
        </Panel>
      ) : !draft ? (
        <Panel bordered className="cgs-card">
          <p className="cgs-note">
            <Translate>Loading child growth setup</Translate>
          </p>
        </Panel>
      ) : step === 0 ? (
        <ChartTypesStep
          charts={draft.charts}
          rules={draft.rules}
          onCharts={charts => setDraft({ ...draft, charts })}
          onRules={rules => setDraft({ ...draft, rules })}
        />
      ) : (
        <ResultRangesStep
          indicator={indicator}
          onIndicator={setIndicator}
          bands={draft.bandsByIndicator[indicator]}
          onBands={bands =>
            setDraft({
              ...draft,
              bandsByIndicator: { ...draft.bandsByIndicator, [indicator]: bands }
            })
          }
          limits={draft.limits}
          onLimits={limits => setDraft({ ...draft, limits })}
          alerts={draft.alerts}
          onAlerts={alerts => setDraft({ ...draft, alerts })}
        />
      )}

      <div className="cgs-footer">
        {step > 0 && (
          <MyButton appearance="ghost" onClick={() => setStep(0)}>
            Back
          </MyButton>
        )}
        {canEdit && draft && !missingTarget && step === 0 && (
          <>
            <MyButton appearance="ghost" onClick={save} loading={isSaving} disabled={isSaving}>
              Save draft
            </MyButton>
            <MyButton onClick={goNext}>Next: result ranges</MyButton>
          </>
        )}
        {canEdit && draft && !missingTarget && step === 1 && (
          <MyButton onClick={save} loading={isSaving} disabled={isSaving}>
            Save
          </MyButton>
        )}
        {!canEdit && draft && step === 0 && (
          <MyButton onClick={goNext}>Next: result ranges</MyButton>
        )}
      </div>
    </div>
  );
};

export default ChildGrowthSetup;
