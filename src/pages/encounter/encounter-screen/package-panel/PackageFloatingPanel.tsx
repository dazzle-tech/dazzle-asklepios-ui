import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Form, Loader, Tooltip, Whisper } from 'rsuite';
import { FaBoxesStacked, FaChevronDown, FaCheck, FaLock, FaXmark } from 'react-icons/fa6';
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { extractApiErrorMessage } from '@/utils/apiErrorMessage';
import { formatEnumString } from '@/utils';
import {
  PatientPackage,
  PatientPackageItem,
  useGetPatientPackagesByPatientQuery,
  useOrderPackageDiagnosticsMutation,
  useOrderPatientPackageItemMutation
} from '@/services/patient/patientPackageService';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { useEnumOptions } from '@/services/enumsApi';
import { useSortedLovQuery } from '../../encounter-component/procedure-new/useSortedLovQuery';
import PatientDiagnosisTable from '../../medical-notes-and-assessments/patient-diagnosis/PatientDiagnosisTable';
import './packagePanel.less';

interface Props {
  patientId?: number | string | null;
  encounterId?: number | string | null;
  /** View-only encounters show the panel without the checkboxes. */
  readOnly?: boolean;
}

/** Ordered straight away with one click. */
const DIRECT_TYPES = ['SERVICE'];
/** Ticked together, then ordered as ONE diagnostic order through the tests wizard. */
const DIAGNOSTIC_TYPES = ['LABORATORY', 'RADIOLOGY', 'PATHOLOGY'];
/** Each one opens its own wizard (body part, schedule...). */
const PROCEDURE_TYPES = ['PROCEDURE'];
const SUPPORTED_TYPES = [...DIRECT_TYPES, ...DIAGNOSTIC_TYPES, ...PROCEDURE_TYPES];

// Same fields and sources as the procedure order screen (procedure-new/Details.tsx)
const newProcedureWizard = () => ({
  indicationId: null as number | null,
  procedureLevel: null as string | null,
  priority: null as string | null,
  bodyPart: '',
  side: '',
  scheduledDateTime: new Date(),
  notes: ''
});

const newTestsWizard = () => ({
  isUrgent: false,
  notes: '',
  icdDiagnosisId: null as number | null
});

/**
 * Floating panel on the encounter screen: the patient's active packages as a checklist.
 * Tests are ticked together and ordered in one diagnostic order; a procedure opens its own wizard;
 * a service is ordered with one click. Every order takes its quantity from the package.
 */
const PackageFloatingPanel: React.FC<Props> = ({ patientId, encounterId, readOnly = false }) => {
  const dispatch = useAppDispatch();
  const mode = useSelector((state: any) => state.ui?.mode);
  const [collapsed, setCollapsed] = useState(false);
  const [busyItemId, setBusyItemId] = useState<number | null>(null);

  // tests ticked for one order
  const [selectedTestIds, setSelectedTestIds] = useState<number[]>([]);
  const [testsWizardOpen, setTestsWizardOpen] = useState(false);
  const [testsWizard, setTestsWizard] = useState<any>(newTestsWizard());
  const [testReasons, setTestReasons] = useState<Record<number, string | null>>({});

  // one procedure at a time
  const [procedureItem, setProcedureItem] = useState<PatientPackageItem | null>(null);
  const [procedureWizard, setProcedureWizard] = useState<any>(newProcedureWizard());

  const { data: packages = [], isFetching } = useGetPatientPackagesByPatientQuery(
    { patientId: patientId as number, activeOnly: true },
    { skip: !patientId }
  );
  const [orderItem, { isLoading: isOrderingItem }] = useOrderPatientPackageItemMutation();
  const [orderDiagnostics, { isLoading: isOrderingTests }] = useOrderPackageDiagnosticsMutation();
  const { data: reasonLov } = useGetLovValuesByCodeQuery('DIAG_ORD_REASON');
  const procedureLevelOptions = useEnumOptions('ProcedureLevel');
  const priorityOptions = useEnumOptions('Priority');
  const { data: bodyPartLov } = useSortedLovQuery('BODY_PARTS');
  const { data: sideLov } = useSortedLovQuery('SIDES');

  const allItems = useMemo(() => packages.flatMap(p => p.items), [packages]);
  const remaining = useMemo(() => allItems.reduce((sum, i) => sum + (i.quantityRemaining ?? 0), 0), [allItems]);
  // drop ticks for items that are gone or used up (e.g. after a refetch)
  const selectedTests = useMemo(
    () => allItems.filter(i => selectedTestIds.includes(i.id) && i.quantityRemaining > 0),
    [allItems, selectedTestIds]
  );

  if (!patientId || (!isFetching && packages.length === 0)) {
    return null;
  }

  const busy = busyItemId != null || isOrderingTests;

  const orderOne = async (item: PatientPackageItem, extra: Record<string, any> = {}) => {
    if (!encounterId) return false;
    setBusyItemId(item.id);
    try {
      await orderItem({ itemId: item.id, body: { encounterId: Number(encounterId), quantity: 1, ...extra } }).unwrap();
      dispatch(notify({ msg: `${item.itemName} ordered from the package`, sev: 'success' }));
      return true;
    } catch (err) {
      dispatch(notify({ msg: extractApiErrorMessage(err), sev: 'error' }));
      return false;
    } finally {
      setBusyItemId(null);
    }
  };

  const onItemClick = (item: PatientPackageItem) => {
    if (readOnly || item.quantityRemaining <= 0 || busy) return;
    if (DIAGNOSTIC_TYPES.includes(item.itemType)) {
      setSelectedTestIds(prev => (prev.includes(item.id) ? prev.filter(id => id !== item.id) : [...prev, item.id]));
      return;
    }
    if (PROCEDURE_TYPES.includes(item.itemType)) {
      setProcedureWizard(newProcedureWizard());
      setProcedureItem(item);
      return;
    }
    if (DIRECT_TYPES.includes(item.itemType)) {
      orderOne(item);
    }
  };

  const openTestsWizard = () => {
    if (selectedTests.length === 0) return;
    setTestsWizard(newTestsWizard());
    setTestReasons({});
    setTestsWizardOpen(true);
  };

  const submitTests = async () => {
    if (!encounterId || selectedTests.length === 0) return;
    try {
      await orderDiagnostics({
        encounterId: Number(encounterId),
        isUrgent: !!testsWizard.isUrgent,
        notes: String(testsWizard.notes ?? '').trim() || null,
        icdDiagnosisId: testsWizard.icdDiagnosisId ?? null,
        items: selectedTests.map(t => ({ itemId: t.id, reason: testReasons[t.id] || null }))
      }).unwrap();
      dispatch(notify({ msg: `${selectedTests.length} test(s) ordered in one order`, sev: 'success' }));
      setSelectedTestIds([]);
      setTestsWizardOpen(false);
    } catch (err) {
      dispatch(notify({ msg: extractApiErrorMessage(err), sev: 'error' }));
    }
  };

  const submitProcedure = async () => {
    if (!procedureItem) return;
    const w = procedureWizard;
    if (!w.procedureLevel || !w.priority || !String(w.bodyPart ?? '').trim() || !w.scheduledDateTime) {
      dispatch(notify({ msg: 'Level, priority, body part and schedule are required', sev: 'warning' }));
      return;
    }
    const ok = await orderOne(procedureItem, {
      indicationId: w.indicationId ?? null,
      procedureLevel: w.procedureLevel,
      priority: w.priority,
      bodyPart: String(w.bodyPart).trim(),
      side: String(w.side ?? '').trim() || null,
      scheduledDateTime: new Date(w.scheduledDateTime).toISOString(),
      notes: String(w.notes ?? '').trim() || null
    });
    if (ok) setProcedureItem(null);
  };

  const renderItem = (item: PatientPackageItem) => {
    const done = item.quantityRemaining <= 0;
    const supported = SUPPORTED_TYPES.includes(item.itemType);
    const selected = selectedTestIds.includes(item.id) && !done;
    const disabled = readOnly || done || !supported || !encounterId || busy;
    const typeKey = String(item.itemType).toLowerCase();

    const row = (
      <li
        key={item.id}
        className={`pkgp-item${done ? ' is-done' : ''}${selected ? ' is-selected' : ''}${disabled ? ' is-disabled' : ''}`}
        onClick={() => !disabled && onItemClick(item)}
        role="button"
        aria-disabled={disabled}
        aria-pressed={selected}
      >
        <span className="pkgp-box">
          {busyItemId === item.id ? (
            <Loader size="xs" />
          ) : done || selected ? (
            <FaCheck />
          ) : !supported ? (
            <FaLock />
          ) : null}
        </span>
        <span className="pkgp-item-main">
          <span className="pkgp-item-name" title={item.itemName}>{item.itemName}</span>
          <span className={`pkgp-chip pkgp-chip--${typeKey}`}>{formatEnumString(item.itemType)}</span>
        </span>
        <span className="pkgp-left">
          {done ? <Translate>Done</Translate> : <>{item.quantityRemaining}<small>/{item.quantityTotal}</small></>}
        </span>
      </li>
    );

    if (!supported && !done) {
      return (
        <Whisper key={item.id} placement="top" speaker={<Tooltip>Ordering this type from a package is not available yet</Tooltip>}>
          {row}
        </Whisper>
      );
    }
    return row;
  };

  const renderPackage = (pkg: PatientPackage) => {
    const used = pkg.quantityUsed ?? 0;
    const total = pkg.quantityTotal || 1;
    return (
      <section className="pkgp-pkg" key={pkg.id}>
        <div className="pkgp-pkg-head">
          <span className="pkgp-pkg-name" title={pkg.packageName}>{pkg.packageName}</span>
          <span className="pkgp-pkg-meta">
            {used}/{pkg.quantityTotal} <Translate>used</Translate>
          </span>
        </div>
        <div className="pkgp-progress"><span style={{ width: `${Math.round((used / total) * 100)}%` }} /></div>
        <ul className="pkgp-items">{pkg.items.map(renderItem)}</ul>
      </section>
    );
  };

  const title = packages.length === 1 ? packages[0].packageName : null;

  return (
    <>
      <div className={`pkgp${mode === 'dark' ? ' dark' : ''}`}>
        {collapsed ? (
          <button type="button" className="pkgp-pill" onClick={() => setCollapsed(false)} title="Show packages">
            <span className="pkgp-pill-ico"><FaBoxesStacked /></span>
            <span className="pkgp-pill-txt">{title ?? <Translate>Packages</Translate>}</span>
            <span className="pkgp-count">{remaining}</span>
          </button>
        ) : (
          <div className="pkgp-card">
            <header className="pkgp-head">
              <span className="pkgp-head-ico"><FaBoxesStacked /></span>
              <span className="pkgp-head-txt">
                <b><Translate>Packages</Translate></b>
                <small>
                  {remaining} <Translate>items left to order</Translate>
                </small>
              </span>
              <button type="button" className="pkgp-min" onClick={() => setCollapsed(true)} title="Minimize">
                <FaChevronDown />
              </button>
            </header>
            <div className="pkgp-body">
              {isFetching && packages.length === 0 ? <Loader center /> : packages.map(renderPackage)}
            </div>
            {selectedTests.length > 0 && (
              <footer className="pkgp-foot">
                <button type="button" className="pkgp-clear" onClick={() => setSelectedTestIds([])} title="Clear selection">
                  <FaXmark />
                </button>
                <button type="button" className="pkgp-order" onClick={openTestsWizard} disabled={busy}>
                  <Translate>Order selected tests</Translate> ({selectedTests.length})
                </button>
              </footer>
            )}
          </div>
        )}
      </div>

      {/* Tests: one diagnostic order for all ticked tests */}
      <MyModal
        open={testsWizardOpen}
        setOpen={open => !open && setTestsWizardOpen(false)}
        title="Order tests from package"
        steps={[{ title: 'Test details', icon: <FaBoxesStacked /> }]}
        size="52vw"
        position="right"
        actionButtonLabel={isOrderingTests ? 'Ordering...' : `Submit (${selectedTests.length})`}
        actionButtonLoading={isOrderingTests}
        isDisabledActionBtn={isOrderingTests || selectedTests.length === 0}
        actionButtonFunction={submitTests}
        content={
          <Form fluid layout="vertical" className="pkgp-wizard">
            <div className="pkgp-wizard-label">
              <Translate>Tests</Translate> ({selectedTests.length})
            </div>
            <ul className="pkgp-wizard-tests">
              {selectedTests.map(t => (
                <li key={t.id}>
                  <span className="pkgp-wizard-test-name">
                    {t.itemName}
                    <span className={`pkgp-chip pkgp-chip--${String(t.itemType).toLowerCase()}`}>
                      {formatEnumString(t.itemType)}
                    </span>
                  </span>
                  <MyInput
                    width={220}
                    showLabel={false}
                    fieldName="reason"
                    fieldLabel="Reason"
                    placeholder="Reason"
                    fieldType="select"
                    selectData={reasonLov?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    disableByField="isValid"
                    record={{ reason: testReasons[t.id] ?? null }}
                    setRecord={(next: any) => {
                      const value = typeof next === 'function' ? next({ reason: testReasons[t.id] ?? null }) : next;
                      setTestReasons(prev => ({ ...prev, [t.id]: value?.reason ?? null }));
                    }}
                  />
                </li>
              ))}
            </ul>

            <MyInput
              fieldName="isUrgent"
              fieldLabel="Urgent"
              fieldType="check"
              showLabel={false}
              record={testsWizard}
              setRecord={setTestsWizard}
            />
            <MyInput
              width="100%"
              fieldName="notes"
              fieldLabel="Clinical Notes"
              fieldType="textarea"
              record={testsWizard}
              setRecord={setTestsWizard}
            />
            <div className="pkgp-wizard-label">
              <Translate>Diagnosis</Translate>
            </div>
            <PatientDiagnosisTable
              patient={{ id: patientId }}
              selectMode
              selectedDiagnosisId={testsWizard.icdDiagnosisId}
              onSelectDiagnosis={(ids: number[]) =>
                setTestsWizard((prev: any) => ({ ...prev, icdDiagnosisId: ids?.[0] ?? null }))
              }
            />
          </Form>
        }
      />

      {/* Procedure: its own wizard */}
      <MyModal
        open={procedureItem != null}
        setOpen={open => !open && setProcedureItem(null)}
        title={procedureItem?.itemName ?? 'Procedure'}
        steps={[{ title: 'Procedure details', icon: <FaBoxesStacked /> }]}
        size="48vw"
        position="right"
        actionButtonLabel={isOrderingItem ? 'Ordering...' : 'Submit'}
        actionButtonLoading={isOrderingItem}
        isDisabledActionBtn={isOrderingItem}
        actionButtonFunction={submitProcedure}
        content={
          <Form fluid layout="vertical" className="pkgp-wizard">
            <div className="pkgp-wizard-row">
              <MyInput width="100%" fieldName="procedureLevel" fieldLabel="Level" fieldType="select"
                selectData={procedureLevelOptions ?? []} selectDataLabel="label" selectDataValue="value"
                record={procedureWizard} setRecord={setProcedureWizard} searchable={false} required />
              <MyInput width="100%" fieldName="priority" fieldLabel="Priority" fieldType="select"
                selectData={priorityOptions ?? []} selectDataLabel="label" selectDataValue="value"
                record={procedureWizard} setRecord={setProcedureWizard} searchable={false} required />
            </div>
            <div className="pkgp-wizard-row">
              <MyInput width="100%" fieldName="bodyPart" fieldLabel="Body Part" fieldType="select"
                selectData={bodyPartLov?.object ?? []} selectDataLabel="lovDisplayVale"
                selectDataValue="lovDisplayVale" disableByField="isValid"
                record={procedureWizard} setRecord={setProcedureWizard} required />
              <MyInput width="100%" fieldName="side" fieldLabel="Side" fieldType="select"
                selectData={sideLov?.object ?? []} selectDataLabel="lovDisplayVale"
                selectDataValue="lovDisplayVale" disableByField="isValid"
                record={procedureWizard} setRecord={setProcedureWizard} searchable={false} />
            </div>
            <MyInput width="100%" fieldName="scheduledDateTime" fieldLabel="Scheduled" fieldType="datetime"
              record={procedureWizard} setRecord={setProcedureWizard} required />
            <MyInput width="100%" fieldName="notes" fieldLabel="Notes" fieldType="textarea"
              record={procedureWizard} setRecord={setProcedureWizard} />
            <div className="pkgp-wizard-label">
              <Translate>Indication</Translate>
            </div>
            <PatientDiagnosisTable
              patient={{ id: patientId }}
              selectMode
              selectedDiagnosisId={procedureWizard.indicationId}
              onSelectDiagnosis={(ids: number[]) =>
                setProcedureWizard((prev: any) => ({ ...prev, indicationId: ids?.[0] ?? null }))
              }
            />
          </Form>
        }
      />
    </>
  );
};

export default PackageFloatingPanel;
