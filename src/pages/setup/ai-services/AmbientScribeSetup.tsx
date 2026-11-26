import React, { useMemo, useState } from 'react';
import { Form, Panel } from 'rsuite';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import MyLabel from '@/components/MyLabel';
import MyModal from '@/components/MyModal/MyModal';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import { useEnumOptions } from '@/services/enumsApi';
import {
  ambientScribeSetupService,
  toAmbientScribeUpdate,
  useGetAmbientScribeSetupQuery,
  useSaveAmbientScribeSetupMutation,
  useSetAmbientScribeClinicsEnabledMutation,
  type AmbientScribeClinic,
  type AmbientScribeSetting
} from '@/services/setup/ambientScribeSetupService';
import { extractErrorMessage } from '@/utils/extractErrorMessage';
import { notify } from '@/utils/uiReducerActions';

type AmbientScribeSetupProps = {
  facilityId: number;
};

const AmbientScribeSetup = ({ facilityId }: AmbientScribeSetupProps) => {
  const dispatch = useAppDispatch();
  const { data, isLoading, isError, refetch } = useGetAmbientScribeSetupQuery(facilityId);
  const [saveSetup, { isLoading: saving }] = useSaveAmbientScribeSetupMutation();
  const [setClinicsEnabled, { isLoading: switching }] = useSetAmbientScribeClinicsEnabledMutation();
  const [manageClinic, setManageClinic] = useState<AmbientScribeClinic | null>(null);
  const [selectedPhysicianIds, setSelectedPhysicianIds] = useState<number[]>([]);
  const noteLanguages = useEnumOptions('AmbientNoteLanguage');
  const instructionLanguages = useEnumOptions('AmbientInstructionLanguage');
  const noteStyles = useEnumOptions('AmbientNoteStyle');
  const specialties = useEnumOptions('AmbientSpecialty');
  const noteForms = useEnumOptions('AmbientNoteForm');
  const retentions = useEnumOptions('AmbientAudioRetention');
  const audiences = useEnumOptions('AmbientRecordingAccess');

  const busy = saving || switching;
  const anyEnabled = Boolean(data?.clinics.some(clinic => clinic.enabled));

  const writeCache = (setting: AmbientScribeSetting) => {
    dispatch(
      ambientScribeSetupService.util.updateQueryData('getAmbientScribeSetup', facilityId, () => setting)
    );
  };

  const persist = async (next: AmbientScribeSetting) => {
    writeCache(next);
    try {
      const saved = await saveSetup({ facilityId, body: toAmbientScribeUpdate(next) }).unwrap();
      writeCache(saved);
    } catch (error) {
      dispatch(
        notify({
          msg: extractErrorMessage(error) || 'Ambient Scribe setup could not be saved.',
          sev: 'error'
        })
      );
      refetch();
    }
  };

  const setSetting = (next: AmbientScribeSetting) => {
    if (
      !data ||
      !next.noteLanguage ||
      !next.instructionLanguage ||
      !next.noteStyle ||
      !next.specialty ||
      !next.noteForm ||
      !next.audioRetention ||
      !next.recordingAccess ||
      (next.noteLanguage === data.noteLanguage &&
        next.instructionLanguage === data.instructionLanguage &&
        next.noteStyle === data.noteStyle &&
        next.specialty === data.specialty &&
        next.noteForm === data.noteForm &&
        next.suggestIcd10 === data.suggestIcd10 &&
        next.suggestOrders === data.suggestOrders &&
        next.audioRetention === data.audioRetention &&
        next.consentVerbal === data.consentVerbal &&
        next.consentTablet === data.consentTablet &&
        next.recordingAccess === data.recordingAccess &&
        next.allowAnonymizedAudio === data.allowAnonymizedAudio &&
        next.clinics === data.clinics)
    ) {
      return;
    }
    void persist(next);
  };

  const updateClinic = (departmentId: number, mapClinic: (clinic: AmbientScribeClinic) => AmbientScribeClinic) => {
    if (!data) {
      return;
    }
    void persist({
      ...data,
      clinics: data.clinics.map(clinic => (clinic.departmentId === departmentId ? mapClinic(clinic) : clinic))
    });
  };

  const switchAll = async (enabled: boolean) => {
    try {
      const saved = await setClinicsEnabled({ facilityId, enabled }).unwrap();
      writeCache(saved);
      dispatch(
        notify({
          msg: enabled
            ? 'Ambient Scribe is on for every clinic.'
            : 'Ambient Scribe is off for every clinic.',
          sev: 'success'
        })
      );
    } catch (error) {
      dispatch(
        notify({
          msg: extractErrorMessage(error) || 'The clinics could not be updated.',
          sev: 'error'
        })
      );
    }
  };

  const openManage = (clinic: AmbientScribeClinic) => {
    setManageClinic(clinic);
    setSelectedPhysicianIds(
      clinic.practitioners.filter(practitioner => practitioner.enabled).map(practitioner => practitioner.id)
    );
  };

  const savePhysicians = () => {
    if (!manageClinic) {
      return;
    }
    const selected = new Set(selectedPhysicianIds);
    updateClinic(manageClinic.departmentId, clinic => ({
      ...clinic,
      practitioners: clinic.practitioners.map(practitioner => ({
        ...practitioner,
        enabled: selected.has(practitioner.id)
      }))
    }));
    setManageClinic(null);
  };

  const columns = useMemo(
    () => [
      { key: 'departmentName', title: 'Clinic', dataKey: 'departmentName' },
      {
        key: 'physicians',
        title: 'Physicians',
        render: (clinic: AmbientScribeClinic) => {
          const selected = clinic.practitioners.filter(practitioner => practitioner.enabled);
          const physicianLabel =
            selected.length === 0
              ? 'All physicians'
              : selected.length <= 3
                ? selected.map(practitioner => practitioner.name).join(', ')
                : `${selected
                    .slice(0, 3)
                    .map(practitioner => practitioner.name)
                    .join(', ')} +${selected.length - 3}`;
          return (
            <div className="ambient-setup-physicians-cell">
              <span title={selected.map(practitioner => practitioner.name).join(', ') || 'All physicians'}>
                {physicianLabel}
              </span>
              <MyButton appearance="subtle" size="xs" disabled={busy} onClick={() => openManage(clinic)}>
                Manage
              </MyButton>
            </div>
          );
        }
      },
      {
        key: 'status',
        title: 'Status',
        width: 140,
        render: (clinic: AmbientScribeClinic) => (
            <MyInput
              className="ambient-setup-inline-input"
              showLabel={false}
              fieldType="checkbox"
              fieldName="enabled"
              fieldLabel="Status"
              checkedLabel="On"
              unCheckedLabel="Off"
              width={110}
              disabled={busy}
              record={{ enabled: clinic.enabled }}
              setRecord={next => {
                if (Boolean(next.enabled) === clinic.enabled) {
                  return;
                }
                updateClinic(clinic.departmentId, current => ({
                  ...current,
                  enabled: Boolean(next.enabled)
                }));
              }}
            />
          )
      }
    ],
    [busy, data]
  );

  if (isLoading) {
    return <div className="ai-services-status">Loading Ambient Scribe…</div>;
  }

  if (isError || !data) {
    return (
      <div className="ai-services-status">
        Ambient Scribe setup could not be loaded.
        <MyButton appearance="ghost" onClick={() => refetch()}>
          Try again
        </MyButton>
      </div>
    );
  }

  return (
    <div className="ambient-setup">
      <div className="ambient-setup-heading">
        <div>
          <h1>
            <Translate>Ambient Scribe</Translate>
          </h1>
          <p>
            <Translate>
              Drafts visit notes from recorded conversations. Audio is processed and stored in the KSA region.
            </Translate>
          </p>
        </div>
        <MyButton
          appearance="ghost"
          color={anyEnabled ? '#e11d48' : 'var(--primary-blue)'}
          disabled={busy}
          loading={switching}
          onClick={() => {
            void switchAll(!anyEnabled);
          }}
        >
          {anyEnabled ? 'Turn off for all clinics' : 'Turn on for all clinics'}
        </MyButton>
      </div>

      <Panel header={<Translate>Clinics and physicians</Translate>} bordered>
        <MyTable
          data={data.clinics}
          columns={columns}
          height={360}
          dontTranslateData
        />
      </Panel>

      <div className="ambient-setup-grid">
        <Panel header={<Translate>Note output</Translate>} bordered>
          <Form fluid>
            <MyInput
              width="100%"
              fieldType="select"
              fieldName="noteLanguage"
              fieldLabel="Note language"
              selectData={noteLanguages}
              selectDataLabel="label"
              selectDataValue="value"
              record={data}
              setRecord={setSetting}
              disabled={busy}
              searchable={false}
              cleanable={false}
            />
            <MyInput
              width="100%"
              fieldType="select"
              fieldName="instructionLanguage"
              fieldLabel="Patient instructions"
              selectData={instructionLanguages}
              selectDataLabel="label"
              selectDataValue="value"
              record={data}
              setRecord={setSetting}
              disabled={busy}
              searchable={false}
              cleanable={false}
            />
            <MyInput
              width="100%"
              fieldType="select"
              fieldName="noteStyle"
              fieldLabel="Note length"
              selectData={noteStyles}
              selectDataLabel="label"
              selectDataValue="value"
              record={data}
              setRecord={setSetting}
              disabled={busy}
              searchable={false}
              cleanable={false}
            />
            <MyInput
              width="100%"
              fieldType="select"
              fieldName="specialty"
              fieldLabel="Specialty"
              selectData={specialties}
              selectDataLabel="label"
              selectDataValue="value"
              record={data}
              setRecord={setSetting}
              disabled={busy}
              searchable={false}
              cleanable={false}
            />
            <MyInput
              width="100%"
              fieldType="select"
              fieldName="noteForm"
              fieldLabel="Note form"
              selectData={noteForms}
              selectDataLabel="label"
              selectDataValue="value"
              record={data}
              setRecord={setSetting}
              disabled={busy}
              searchable={false}
              cleanable={false}
            />
            <MyInput
              showLabel={false}
              fieldType="check"
              fieldName="suggestIcd10"
              fieldLabel="Suggest ICD-10 diagnoses"
              label="Suggest ICD-10 diagnoses"
              record={data}
              setRecord={setSetting}
              disabled={busy}
            />
            <MyInput
              showLabel={false}
              fieldType="check"
              fieldName="suggestOrders"
              fieldLabel="Suggest orders (always need physician acceptance)"
              label="Suggest orders (always need physician acceptance)"
              record={data}
              setRecord={setSetting}
              disabled={busy}
            />
          </Form>
        </Panel>

        <Panel header={<Translate>Privacy and consent</Translate>} bordered>
          <Form fluid>
            <MyInput
              width="100%"
              fieldType="select"
              fieldName="audioRetention"
              fieldLabel="Delete audio after"
              selectData={retentions}
              selectDataLabel="label"
              selectDataValue="value"
              record={data}
              setRecord={setSetting}
              disabled={busy}
              searchable={false}
              cleanable={false}
            />
            <MyLabel label="Accepted consent methods" />
            <MyInput
              showLabel={false}
              fieldType="check"
              fieldName="consentVerbal"
              fieldLabel="Verbal, logged by physician"
              label="Verbal, logged by physician"
              record={data}
              setRecord={setSetting}
              disabled={busy}
            />
            <MyInput
              showLabel={false}
              fieldType="check"
              fieldName="consentTablet"
              fieldLabel="Signed on tablet"
              label="Signed on tablet"
              record={data}
              setRecord={setSetting}
              disabled={busy}
            />
            <MyInput
              width="100%"
              fieldType="select"
              fieldName="recordingAccess"
              fieldLabel="Who can play recordings"
              selectData={audiences}
              selectDataLabel="label"
              selectDataValue="value"
              record={data}
              setRecord={setSetting}
              disabled={busy}
              searchable={false}
              cleanable={false}
            />
            <MyInput
              showLabel={false}
              fieldType="check"
              fieldName="allowAnonymizedAudio"
              fieldLabel="Allow anonymized audio to improve models (off by default)"
              label="Allow anonymized audio to improve models (off by default)"
              record={data}
              setRecord={setSetting}
              disabled={busy}
            />
          </Form>
        </Panel>
      </div>

      <Panel
        className="ambient-setup-usage"
        bordered
        header={
          <div className="ambient-setup-usage-head">
            <span>
              <Translate>Quality and usage</Translate>
              <span className="ambient-setup-usage-range">
                <Translate>Last 30 days</Translate>
              </span>
            </span>
            <MyButton
              appearance="ghost"
              onClick={() =>
                dispatch(
                  notify({
                    msg: 'Flagged drafts appear after the first recorded visit.',
                    sev: 'warning'
                  })
                )
              }
            >
              Open flagged drafts
            </MyButton>
          </div>
        }
      >
        <div className="ambient-setup-metrics">
          <div>
            <span>
              <Translate>Visits recorded</Translate>
            </span>
            <strong>—</strong>
          </div>
          <div>
            <span>
              <Translate>Sections accepted</Translate>
            </span>
            <strong>—</strong>
          </div>
          <div>
            <span>
              <Translate>Diagnoses accepted</Translate>
            </span>
            <strong>—</strong>
          </div>
          <div>
            <span>
              <Translate>Flagged by physicians</Translate>
            </span>
            <strong>—</strong>
          </div>
        </div>
        <p>
          <Translate>Figures appear after the first recorded visit.</Translate>
        </p>
      </Panel>

      <MyModal
        open={Boolean(manageClinic)}
        setOpen={open => {
          if (!open) {
            setManageClinic(null);
          }
        }}
        title={manageClinic ? `Physicians · ${manageClinic.departmentName}` : 'Physicians'}
        size="480px"
        bodyheight="auto"
        actionButtonLabel="Save"
        actionButtonFunction={savePhysicians}
        actionButtonLoading={busy}
        content={
          <Form fluid className="ambient-setup-physicians">
            <p>
              <Translate>
                Leave everyone unchecked to allow every physician in this clinic to start Ambient.
              </Translate>
            </p>
            {manageClinic && manageClinic.practitioners.length === 0 && (
              <p>
                <Translate>No physicians are assigned to this clinic.</Translate>
              </p>
            )}
            {manageClinic?.practitioners.map(practitioner => (
              <MyInput
                key={practitioner.id}
                className="ambient-setup-inline-input"
                showLabel={false}
                fieldType="check"
                fieldName="enabled"
                fieldLabel={practitioner.name}
                label={practitioner.name}
                record={{ enabled: selectedPhysicianIds.includes(practitioner.id) }}
                setRecord={next =>
                  setSelectedPhysicianIds(current => {
                    const selected = current.includes(practitioner.id);
                    if (next.enabled && !selected) {
                      return [...current, practitioner.id];
                    }
                    if (!next.enabled && selected) {
                      return current.filter(id => id !== practitioner.id);
                    }
                    return current;
                  })
                }
              />
            ))}
          </Form>
        }
      />
    </div>
  );
};

export default AmbientScribeSetup;
