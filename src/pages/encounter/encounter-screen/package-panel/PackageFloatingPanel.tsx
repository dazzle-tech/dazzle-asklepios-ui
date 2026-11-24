import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Form, Loader, Tooltip, Whisper } from 'rsuite';
import { FaBoxesStacked, FaChevronDown, FaCheck, FaClockRotateLeft, FaWandMagicSparkles, FaXmark, FaTrashCan } from 'react-icons/fa6';
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
  useGetPatientPackagesByEncounterQuery,
  useOrderPackageDiagnosticsMutation,
  useOrderPatientPackageItemMutation
} from '@/services/patient/patientPackageService';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { useEnumOptions } from '@/services/enumsApi';
import { useSortedLovQuery } from '../../encounter-component/procedure-new/useSortedLovQuery';
import PatientDiagnosisTable from '../../medical-notes-and-assessments/patient-diagnosis/PatientDiagnosisTable';
import CategoryTestPicker from './CategoryTestPicker';
import PackageHistoryModal from './PackageHistoryModal';
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

type PickedTest = { testId: number; name: string; code?: string };

/** "Any Laboratory" for a category line, the item name otherwise. */
const itemLabel = (item: PatientPackageItem) =>
  item.isCategory ? `Any ${formatEnumString(item.itemType)}` : item.itemName ?? '';

/** Given on their own screens (UCC medication orders, vaccinations) and taken from the package there. */
const OWN_SCREEN_TYPES = ['MEDICATION', 'VACCINE'];

/** Category lines of these types are picked in the panel; the others are ordered from their usual screens. */
const canOrderFromPanel = (item: PatientPackageItem) =>
  item.isCategory ? DIAGNOSTIC_TYPES.includes(item.itemType) : SUPPORTED_TYPES.includes(item.itemType);

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
  const [historyPackageId, setHistoryPackageId] = useState<number | null>(null);
  const [busyItemId, setBusyItemId] = useState<number | null>(null);

  // tests ticked for one order
  const [selectedTestIds, setSelectedTestIds] = useState<number[]>([]);
  const [testsWizardOpen, setTestsWizardOpen] = useState(false);
  const [testsWizard, setTestsWizard] = useState<any>(newTestsWizard());
  /** keyed by item id for an item line, `c:<itemId>:<testId>` for a test picked under a category */
  const [testReasons, setTestReasons] = useState<Record<string, string | null>>({});
  const [categoryTests, setCategoryTests] = useState<Record<number, PickedTest[]>>({});
  /** what was left on each chosen line when its wizard opened, to tell the user if it changed meanwhile */
  const [openedRemaining, setOpenedRemaining] = useState<Record<number, number>>({});

  // one procedure at a time
  const [procedureItem, setProcedureItem] = useState<PatientPackageItem | null>(null);
  const [procedureWizard, setProcedureWizard] = useState<any>(newProcedureWizard());

  // a package belongs to the visit it was chosen in; cancelled ones are hidden
  // refreshed now and then: orders made on the usual screens are taken from the package too
  const { data: encounterPackages, isFetching, refetch } = useGetPatientPackagesByEncounterQuery(encounterId as number, {
    skip: !encounterId,
    pollingInterval: 30000,
    refetchOnFocus: true
  });
  const packages = useMemo(
    () => (encounterPackages ?? []).filter(p => p.status !== 'CANCELLED'),
    [encounterPackages]
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
  // drop ticks for items that are gone or used up (e.g. after a refetch); while the wizard is open they stay,
  // marked as charged as usual, so nothing disappears under the user's eyes
  const selectedTests = useMemo(
    () => allItems.filter(i => selectedTestIds.includes(i.id) && (testsWizardOpen || i.quantityRemaining > 0)),
    [allItems, selectedTestIds, testsWizardOpen]
  );
  // lines that lost room since their wizard opened (ordered elsewhere in the meantime)
  const changedLines = selectedTests.filter(
    t => openedRemaining[t.id] != null && t.quantityRemaining < openedRemaining[t.id]
  );
  const selectedItemTests = selectedTests.filter(t => !t.isCategory);
  const selectedCategories = selectedTests.filter(t => t.isCategory);
  const pickedCount = selectedCategories.reduce((sum, c) => sum + (categoryTests[c.id]?.length ?? 0), 0);
  const orderCount = selectedItemTests.length + pickedCount;
  // tests already in this order (greyed out in the pickers)
  const testIdsInOrder = useMemo(
    () => [
      ...selectedItemTests.map(t => Number(t.sourceId)),
      ...Object.values(categoryTests).flat().map(t => t.testId)
    ],
    [selectedItemTests, categoryTests]
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
      dispatch(notify({ msg: `${itemLabel(item)} ordered from the package`, sev: 'success' }));
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
      setOpenedRemaining({ [item.id]: item.quantityRemaining });
      setProcedureItem(item);
      refetch(); // latest quantities before ordering
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
    setCategoryTests({});
    setOpenedRemaining(Object.fromEntries(selectedTests.map(t => [t.id, t.quantityRemaining])));
    setTestsWizardOpen(true);
    refetch(); // latest quantities before ordering
  };

  const submitTests = async () => {
    if (!encounterId || selectedTests.length === 0) return;
    const emptyCategory = selectedCategories.find(c => (categoryTests[c.id] ?? []).length === 0);
    if (emptyCategory) {
      dispatch(notify({ msg: `Add at least one test for ${itemLabel(emptyCategory)}`, sev: 'warning' }));
      return;
    }
    const items = [
      ...selectedItemTests.map(t => ({ itemId: t.id, reason: testReasons[String(t.id)] || null })),
      ...selectedCategories.flatMap(c =>
        (categoryTests[c.id] ?? []).map(t => ({
          itemId: c.id,
          testId: t.testId,
          reason: testReasons[`c:${c.id}:${t.testId}`] || null
        }))
      )
    ];
    try {
      const result = await orderDiagnostics({
        encounterId: Number(encounterId),
        isUrgent: !!testsWizard.isUrgent,
        notes: String(testsWizard.notes ?? '').trim() || null,
        icdDiagnosisId: testsWizard.icdDiagnosisId ?? null,
        items
      }).unwrap();
      const counted = result.countedTestIds?.length ?? 0;
      const extra = items.length - counted;
      dispatch(
        notify({
          msg:
            extra > 0
              ? `${items.length} test(s) ordered: ${counted} from the package, ${extra} charged as usual`
              : `${items.length} test(s) ordered from the package in one order`,
          sev: extra > 0 ? 'info' : 'success'
        })
      );
      setSelectedTestIds([]);
      setCategoryTests({});
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
    const supported = canOrderFromPanel(item);
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
            // taken from the package automatically when given on its own screen
            <FaWandMagicSparkles />
          ) : null}
        </span>
        <span className="pkgp-item-main">
          <span className="pkgp-item-name" title={itemLabel(item)}>{itemLabel(item)}</span>
          <span className="pkgp-item-tags">
            <span className={`pkgp-chip pkgp-chip--${typeKey}`}>{formatEnumString(item.itemType)}</span>
            {item.isCategory && item.maxRepeat != null && (
              <span className="pkgp-chip" title="How many times the same item can be counted">
                ≤{item.maxRepeat}× <Translate>each</Translate>
              </span>
            )}
            {item.discountPercent != null && Number(item.discountPercent) > 0 && (
              <span className="pkgp-chip pkgp-chip--discount">-{Number(item.discountPercent)}%</span>
            )}
          </span>
        </span>
        <span className="pkgp-left">
          {done ? <Translate>Done</Translate> : <>{item.quantityRemaining}<small>/{item.quantityTotal}</small></>}
        </span>
      </li>
    );

    if (!supported && !done) {
      const tip =
        item.isCategory || OWN_SCREEN_TYPES.includes(item.itemType)
          ? item.itemType === 'MEDICATION'
            ? 'Give it from the UCC medication orders: it is taken from the package automatically'
            : item.itemType === 'VACCINE'
              ? 'Give it from the vaccinations: it is taken from the package automatically'
              : 'Order it from its usual screen: it is taken from the package automatically'
          : 'Ordering this type from a package is not available yet';
      return (
        <Whisper key={item.id} placement="top" speaker={<Tooltip>{tip}</Tooltip>}>
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
          <button
            type="button"
            className="pkgp-history"
            title="History"
            onClick={() => setHistoryPackageId(pkg.id)}
          >
            <FaClockRotateLeft />
          </button>
        </div>
        <div className="pkgp-progress"><span style={{ width: `${Math.round((used / total) * 100)}%` }} /></div>
        <ul className="pkgp-items">{pkg.items.map(renderItem)}</ul>
      </section>
    );
  };

  const title = packages.length === 1 ? packages[0].packageName : null;
  // the procedure line as it is now (it may have been ordered elsewhere since the wizard opened)
  const currentProcedureLine = procedureItem ? allItems.find(i => i.id === procedureItem.id) : undefined;
  const procedureNoRoom = !!currentProcedureLine && currentProcedureLine.quantityRemaining <= 0;

  const reasonInput = (key: string) => (
    <MyInput
      width={200}
      showLabel={false}
      fieldName="reason"
      fieldLabel="Reason"
      placeholder="Reason"
      fieldType="select"
      selectData={reasonLov?.object ?? []}
      selectDataLabel="lovDisplayVale"
      selectDataValue="key"
      disableByField="isValid"
      record={{ reason: testReasons[key] ?? null }}
      setRecord={(next: any) => {
        const value = typeof next === 'function' ? next({ reason: testReasons[key] ?? null }) : next;
        setTestReasons(prev => ({ ...prev, [key]: value?.reason ?? null }));
      }}
    />
  );

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
        actionButtonLabel={isOrderingTests ? 'Ordering...' : `Submit (${orderCount})`}
        actionButtonLoading={isOrderingTests}
        isDisabledActionBtn={isOrderingTests || orderCount === 0}
        actionButtonFunction={submitTests}
        content={
          <Form fluid layout="vertical" className="pkgp-wizard">
            {changedLines.length > 0 && (
              <div className="pkgp-wizard-alert">
                <Translate>The package changed since you opened this:</Translate>{' '}
                {changedLines
                  .map(l => `${itemLabel(l)} ${l.quantityRemaining} left (was ${openedRemaining[l.id]})`)
                  .join(', ')}
                . <Translate>Tests without room are charged as usual.</Translate>
              </div>
            )}
            {selectedItemTests.length > 0 && (
              <>
                <div className="pkgp-wizard-label">
                  <Translate>Tests</Translate> ({selectedItemTests.length})
                </div>
                <ul className="pkgp-wizard-tests">
                  {selectedItemTests.map(t => (
                    <li key={t.id}>
                      <span className="pkgp-wizard-test-name">
                        {t.itemName}
                        <span className={`pkgp-chip pkgp-chip--${String(t.itemType).toLowerCase()}`}>
                          {formatEnumString(t.itemType)}
                        </span>
                        {t.quantityRemaining <= 0 && (
                          <span className="pkgp-chip pkgp-chip--extra">
                            <Translate>Charged as usual</Translate>
                          </span>
                        )}
                      </span>
                      {reasonInput(String(t.id))}
                    </li>
                  ))}
                </ul>
              </>
            )}

            {selectedCategories.map(c => {
              const picked = categoryTests[c.id] ?? [];
              const over = picked.length - c.quantityRemaining;
              return (
                <div className="pkgp-wizard-category" key={c.id}>
                  <div className="pkgp-wizard-label">
                    {itemLabel(c)}
                    <span className="pkgp-wizard-sub">
                      {c.quantityRemaining} <Translate>left</Translate>
                      {c.maxRepeat != null && (
                        <>
                          {' '}· <Translate>same test up to</Translate> {c.maxRepeat}×
                        </>
                      )}
                    </span>
                  </div>
                  <CategoryTestPicker
                    itemType={c.itemType}
                    excludeIds={testIdsInOrder}
                    onPick={test =>
                      setCategoryTests(prev => ({
                        ...prev,
                        [c.id]: [...(prev[c.id] ?? []), { testId: test.sourceId, name: test.name, code: test.code }]
                      }))
                    }
                  />
                  {picked.length > 0 && (
                    <ul className="pkgp-wizard-tests">
                      {picked.map((t, index) => (
                        <li key={t.testId} className={index >= c.quantityRemaining ? 'is-extra' : ''}>
                          <span className="pkgp-wizard-test-name">
                            {t.name}
                            {index >= c.quantityRemaining && (
                              <span className="pkgp-chip pkgp-chip--extra">
                                <Translate>Charged as usual</Translate>
                              </span>
                            )}
                          </span>
                          {reasonInput(`c:${c.id}:${t.testId}`)}
                          <button
                            type="button"
                            className="pkgp-remove"
                            title="Remove"
                            onClick={() =>
                              setCategoryTests(prev => ({
                                ...prev,
                                [c.id]: (prev[c.id] ?? []).filter(x => x.testId !== t.testId)
                              }))
                            }
                          >
                            <FaTrashCan />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {over > 0 && (
                    <div className="pkgp-wizard-note">
                      <Translate>Only the first</Translate> {c.quantityRemaining}{' '}
                      <Translate>are taken from the package; the rest are charged as usual.</Translate>
                    </div>
                  )}
                </div>
              );
            })}

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

      <PackageHistoryModal patientPackageId={historyPackageId} onClose={() => setHistoryPackageId(null)} />

      {/* Procedure: its own wizard */}
      <MyModal
        open={procedureItem != null}
        setOpen={open => !open && setProcedureItem(null)}
        title={procedureItem ? itemLabel(procedureItem) : 'Procedure'}
        steps={[{ title: 'Procedure details', icon: <FaBoxesStacked /> }]}
        size="48vw"
        position="right"
        actionButtonLabel={isOrderingItem ? 'Ordering...' : 'Submit'}
        actionButtonLoading={isOrderingItem}
        isDisabledActionBtn={isOrderingItem || procedureNoRoom}
        actionButtonFunction={submitProcedure}
        content={
          <Form fluid layout="vertical" className="pkgp-wizard">
            {procedureNoRoom && (
              <div className="pkgp-wizard-alert">
                <Translate>Nothing is left of this procedure in the package any more (it was ordered elsewhere).</Translate>
              </div>
            )}
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
