import React, { useEffect, useMemo, useState } from 'react';
import { Form, Nav, Panel } from 'rsuite';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { MdModeEdit, MdToggleOff, MdToggleOn } from 'react-icons/md';
import Translate from '@/components/Translate';
import MyInput from '@/components/MyInput';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { extractApiErrorMessage } from '@/utils/apiErrorMessage';
import { formatEnumString } from '@/utils';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import {
  useGetActivityPlansQuery,
  useSaveActivityCategoryMutation,
  useSaveActivityPlanMutation,
  useSaveActivityTemplateMutation,
  useToggleActivityCategoryMutation,
  useToggleActivityPlanMutation,
  useToggleActivityTemplateMutation
} from '@/services/patients/patientActivityService';
import type { ActivityCategory, ActivityPlan, ActivityTemplate } from '@/types/model-types-new';
import {
  ActivityIcon,
  DEFAULT_CATEGORY_COLOR,
  describeDueRule,
  useActivityCatalog
} from '@/pages/patient/patient-profile/tabs/Activities/activityCatalog';
import AddEditActivityTemplate from './AddEditActivityTemplate';
import AddEditActivityCategory from './AddEditActivityCategory';
import AddEditActivityPlan, { emptyPlanItem, itemDueRule } from './AddEditActivityPlan';
import './styles.less';

const emptyTemplate = (categoryCode = ''): ActivityTemplate => ({
  code: '',
  name: '',
  description: '',
  categoryCode,
  kind: 'TASK',
  defaultPriority: 'NORMAL',
  dueOffset: 1,
  dueUnit: 'DAYS',
  assigneeRoles: [],
  creatorRoles: [],
  outcomeOptions: [],
  checklist: [],
  requireOutcome: false,
  viewOrder: 0,
  isActive: true
});

const emptyCategory = (): ActivityCategory => ({
  code: '',
  name: '',
  icon: 'clipboard',
  color: DEFAULT_CATEGORY_COLOR,
  viewOrder: 0,
  isActive: true
});

const emptyPlan = (): ActivityPlan => ({
  code: '',
  name: '',
  description: '',
  items: [emptyPlanItem()],
  viewOrder: 0,
  isActive: true
});

type View = 'templates' | 'categories' | 'plans';

const ALL = 'all';

const ActivitySetup = () => {
  const dispatch = useAppDispatch();
  const catalog = useActivityCatalog();
  const { categories, templates, categoryByCode, templateByCode } = catalog;
  const { data: plans = [], isFetching: loadingPlans } = useGetActivityPlansQuery();

  const [view, setView] = useState<View>('templates');
  const [filter, setFilter] = useState({ search: '', categoryCode: ALL, kind: ALL });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);

  const [templateOpen, setTemplateOpen] = useState(false);
  const [template, setTemplate] = useState<ActivityTemplate>(emptyTemplate());
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [category, setCategory] = useState<ActivityCategory>(emptyCategory());
  const [planOpen, setPlanOpen] = useState(false);
  const [plan, setPlan] = useState<ActivityPlan>(emptyPlan());

  const [saveTemplate, { isLoading: savingTemplate }] = useSaveActivityTemplateMutation();
  const [toggleTemplate] = useToggleActivityTemplateMutation();
  const [saveCategory, { isLoading: savingCategory }] = useSaveActivityCategoryMutation();
  const [toggleCategory] = useToggleActivityCategoryMutation();
  const [savePlan, { isLoading: savingPlan }] = useSaveActivityPlanMutation();
  const [togglePlan] = useToggleActivityPlanMutation();

  useEffect(() => {
    dispatch(setPageCode('ActivitySetup'));
    dispatch(setDivContent('Tasks and Activities Setup'));
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch]);

  useEffect(() => setPage(0), [filter, view]);

  const filteredTemplates = useMemo(() => {
    const term = filter.search.trim().toLowerCase();
    return templates.filter(t => {
      if (filter.categoryCode !== ALL && t.categoryCode !== filter.categoryCode) return false;
      if (filter.kind !== ALL && t.kind !== filter.kind) return false;
      if (!term) return true;
      return [t.name, t.code, t.description, ...(t.assigneeRoles ?? [])]
        .filter(Boolean)
        .some(value => String(value).toLowerCase().includes(term));
    });
  }, [templates, filter]);

  const templateCount = useMemo(() => {
    const counts = new Map<string, number>();
    templates.forEach(t => counts.set(t.categoryCode, (counts.get(t.categoryCode) ?? 0) + 1));
    return counts;
  }, [templates]);

  const rows: any[] = view === 'templates' ? filteredTemplates : view === 'categories' ? categories : plans;
  const pagedRows = rows.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

  const showError = (error: unknown, fallback: string) =>
    dispatch(notify({ msg: extractApiErrorMessage(error) || fallback, sev: 'warning' }));

  const handleSaveTemplate = async () => {
    if (!template.name?.trim() || !template.code || !template.categoryCode) {
      dispatch(notify({ msg: 'Name, code and category are required', sev: 'warning' }));
      return;
    }
    const hasOffset = template.dueOffset != null && String(template.dueOffset) !== '';
    if (template.kind === 'TASK' && hasOffset !== Boolean(template.dueUnit)) {
      dispatch(notify({ msg: 'Set both the due time and its unit, or neither', sev: 'warning' }));
      return;
    }
    try {
      await saveTemplate({
        ...template,
        dueOffset: hasOffset ? Number(template.dueOffset) : null,
        dueUnit: hasOffset ? template.dueUnit : null,
        viewOrder: Number(template.viewOrder) || 0
      }).unwrap();
      dispatch(notify({ msg: 'Activity type saved', sev: 'success' }));
      setTemplateOpen(false);
    } catch (error) {
      showError(error, 'Failed to save activity type');
    }
  };

  const handleSaveCategory = async () => {
    if (!category.name?.trim() || !category.code) {
      dispatch(notify({ msg: 'Name and code are required', sev: 'warning' }));
      return;
    }
    try {
      await saveCategory({ ...category, viewOrder: Number(category.viewOrder) || 0 }).unwrap();
      dispatch(notify({ msg: 'Category saved', sev: 'success' }));
      setCategoryOpen(false);
    } catch (error) {
      showError(error, 'Failed to save category');
    }
  };

  const handleSavePlan = async () => {
    if (!plan.name?.trim() || !plan.code) {
      dispatch(notify({ msg: 'Name and code are required', sev: 'warning' }));
      return;
    }
    const items = plan.items ?? [];
    if (!items.length || items.some(item => !item.templateCode)) {
      dispatch(notify({ msg: 'Pick a task for every row', sev: 'warning' }));
      return;
    }
    const hasOffset = (item: ActivityPlan['items'][number]) =>
      item.dueOffset != null && String(item.dueOffset) !== '';
    if (items.some(item => hasOffset(item) !== Boolean(item.dueUnit))) {
      dispatch(notify({ msg: 'Set both the due time and its unit, or neither', sev: 'warning' }));
      return;
    }
    try {
      await savePlan({
        ...plan,
        viewOrder: Number(plan.viewOrder) || 0,
        items: items.map(item => ({
          ...item,
          dueOffset: hasOffset(item) ? Number(item.dueOffset) : null,
          dueUnit: hasOffset(item) ? item.dueUnit : null,
          note: item.note?.trim() || null
        }))
      }).unwrap();
      dispatch(notify({ msg: 'Task plan saved', sev: 'success' }));
      setPlanOpen(false);
    } catch (error) {
      showError(error, 'Failed to save task plan');
    }
  };

  const handleToggle = async (row: ActivityTemplate | ActivityCategory | ActivityPlan) => {
    try {
      if (view === 'templates') await toggleTemplate(row.id as number).unwrap();
      else if (view === 'plans') await togglePlan(row.id as number).unwrap();
      else await toggleCategory(row.id as number).unwrap();
    } catch (error) {
      showError(error, 'Failed to change status');
    }
  };

  const openNew = () => {
    if (view === 'templates') {
      setTemplate(emptyTemplate(filter.categoryCode === ALL ? '' : filter.categoryCode));
      setTemplateOpen(true);
    } else if (view === 'plans') {
      setPlan(emptyPlan());
      setPlanOpen(true);
    } else {
      setCategory(emptyCategory());
      setCategoryOpen(true);
    }
  };

  const openEdit = (row: any) => {
    if (view === 'templates') {
      setTemplate({ ...emptyTemplate(), ...row });
      setTemplateOpen(true);
    } else if (view === 'plans') {
      setPlan({ ...emptyPlan(), ...row, items: (row.items ?? []).map((item: any) => ({ ...item })) });
      setPlanOpen(true);
    } else {
      setCategory({ ...emptyCategory(), ...row });
      setCategoryOpen(true);
    }
  };

  const actions = (row: any) => (
    <div className="container-of-icons">
      <MdModeEdit
        className="icons-style"
        title="Edit"
        size={22}
        fill="var(--primary-gray)"
        onClick={() => openEdit(row)}
      />
      {row.isActive ? (
        <MdToggleOn
          className="icons-style"
          title="Deactivate"
          size={26}
          fill="var(--primary-green, #22a06b)"
          onClick={() => handleToggle(row)}
        />
      ) : (
        <MdToggleOff
          className="icons-style"
          title="Activate"
          size={26}
          fill="var(--primary-gray)"
          onClick={() => handleToggle(row)}
        />
      )}
    </div>
  );

  const statusBadge = (active?: boolean) => (
    <span className={`activity-setup-badge ${active ? 'is-active' : 'is-inactive'}`}>
      {active ? 'Active' : 'Inactive'}
    </span>
  );

  const categoryChip = (code: string) => {
    const c = categoryByCode.get(code);
    const color = c?.color || DEFAULT_CATEGORY_COLOR;
    return (
      <span className="activity-setup-category">
        <span className="activity-setup-category-icon" style={{ color, background: `${color}1f` }}>
          <ActivityIcon icon={c?.icon} />
        </span>
        {c?.name ?? formatEnumString(code)}
      </span>
    );
  };

  const templateColumns = [
    {
      key: 'name',
      title: <Translate>Name</Translate>,
      render: (row: ActivityTemplate) => (
        <div>
          <div className="activity-setup-name">
            {row.name}
            {row.isSystem && <span className="activity-setup-badge is-auto">Auto</span>}
          </div>
          <div className="activity-setup-code">{row.code}</div>
        </div>
      )
    },
    { key: 'categoryCode', title: <Translate>Category</Translate>, render: (row: ActivityTemplate) => categoryChip(row.categoryCode) },
    {
      key: 'kind',
      title: <Translate>Kind</Translate>,
      render: (row: ActivityTemplate) => (
        <span className={`activity-setup-badge kind-${row.kind.toLowerCase()}`}>{formatEnumString(row.kind)}</span>
      )
    },
    {
      key: 'defaultPriority',
      title: <Translate>Priority</Translate>,
      render: (row: ActivityTemplate) => (
        <span className={`activity-priority priority-${(row.defaultPriority ?? 'NORMAL').toLowerCase()}`}>
          {formatEnumString(row.defaultPriority ?? 'NORMAL')}
        </span>
      )
    },
    {
      key: 'dueOffset',
      title: <Translate>Due</Translate>,
      render: (row: ActivityTemplate) => (row.kind === 'TASK' ? describeDueRule(row) || 'Manual' : '—')
    },
    {
      key: 'assigneeRoles',
      title: <Translate>Team</Translate>,
      render: (row: ActivityTemplate) =>
        row.assigneeRoles?.length ? row.assigneeRoles.map(formatEnumString).join(', ') : '—'
    },
    { key: 'isActive', title: <Translate>Status</Translate>, render: (row: ActivityTemplate) => statusBadge(row.isActive) },
    { key: 'actions', title: <Translate></Translate>, render: actions }
  ];

  const categoryColumns = [
    { key: 'name', title: <Translate>Name</Translate>, render: (row: ActivityCategory) => categoryChip(row.code) },
    { key: 'code', title: <Translate>Code</Translate> },
    {
      key: 'templates',
      title: <Translate>Activity Types</Translate>,
      render: (row: ActivityCategory) => templateCount.get(row.code) ?? 0
    },
    { key: 'viewOrder', title: <Translate>View Order</Translate> },
    { key: 'isActive', title: <Translate>Status</Translate>, render: (row: ActivityCategory) => statusBadge(row.isActive) },
    { key: 'actions', title: <Translate></Translate>, render: actions }
  ];

  const planColumns = [
    {
      key: 'name',
      title: <Translate>Name</Translate>,
      render: (row: ActivityPlan) => (
        <div>
          <div className="activity-setup-name">{row.name}</div>
          <div className="activity-setup-code">{row.code}</div>
        </div>
      )
    },
    {
      key: 'items',
      title: <Translate>Tasks</Translate>,
      render: (row: ActivityPlan) => (
        <ol className="activity-plan-summary">
          {row.items.map((item, index) => {
            const rule = itemDueRule(item, templateByCode.get(item.templateCode));
            return (
              <li key={`${item.templateCode}-${index}`}>
                {catalog.templateName(item.templateCode)}
                {rule && <span className="activity-setup-code"> · +{rule}</span>}
              </li>
            );
          })}
        </ol>
      )
    },
    { key: 'isActive', title: <Translate>Status</Translate>, render: (row: ActivityPlan) => statusBadge(row.isActive) },
    { key: 'actions', title: <Translate></Translate>, render: actions }
  ];

  const columnsByView = { templates: templateColumns, categories: categoryColumns, plans: planColumns };
  const newLabel = { templates: 'New Activity Type', categories: 'New Category', plans: 'New Task Plan' };

  const filters =
    view === 'templates' ? (
      <Form fluid layout="inline" className="form-of-filters-set-up">
        <MyInput
          fieldName="search"
          showLabel={false}
          placeholder="Search name, code or role"
          record={filter}
          setRecord={setFilter}
        />
        <MyInput
          fieldType="select"
          fieldName="categoryCode"
          showLabel={false}
          selectData={[{ value: ALL, label: 'All categories' }, ...categories.map(c => ({ value: c.code, label: c.name }))]}
          selectDataLabel="label"
          selectDataValue="value"
          record={filter}
          setRecord={setFilter}
        />
        <MyInput
          fieldType="select"
          fieldName="kind"
          showLabel={false}
          selectData={[
            { value: ALL, label: 'Tasks and activities' },
            { value: 'TASK', label: 'Tasks' },
            { value: 'ACTIVITY', label: 'Activities' }
          ]}
          selectDataLabel="label"
          selectDataValue="value"
          record={filter}
          setRecord={setFilter}
          searchable={false}
        />
      </Form>
    ) : null;

  return (
    <Panel className="activity-setup">
      <Nav appearance="subtle" activeKey={view} onSelect={key => key && setView(key)} className="activity-setup-nav">
        <Nav.Item eventKey="templates">
          <Translate>Activity Types</Translate> <span className="activity-setup-count">{templates.length}</span>
        </Nav.Item>
        <Nav.Item eventKey="categories">
          <Translate>Categories</Translate> <span className="activity-setup-count">{categories.length}</span>
        </Nav.Item>
        <Nav.Item eventKey="plans">
          <Translate>Task Plans</Translate> <span className="activity-setup-count">{plans.length}</span>
        </Nav.Item>
      </Nav>

      <MyTable
        height={560}
        data={pagedRows}
        loading={catalog.loading || loadingPlans}
        columns={columnsByView[view]}
        filters={filters}
        rowClassName={(row: any) => (row.isActive ? '' : 'activity-setup-row-inactive')}
        page={page}
        rowsPerPage={rowsPerPage}
        totalCount={rows.length}
        onPageChange={(_, next) => setPage(next)}
        onRowsPerPageChange={event => {
          setRowsPerPage(parseInt(event.target.value, 10));
          setPage(0);
        }}
        tableButtons={
          <MyButton prefixIcon={() => <AddOutlineIcon />} color="var(--deep-blue)" onClick={openNew}>
            {newLabel[view]}
          </MyButton>
        }
      />

      <AddEditActivityTemplate
        open={templateOpen}
        setOpen={setTemplateOpen}
        record={template}
        setRecord={setTemplate}
        categories={categories}
        onSave={handleSaveTemplate}
        loading={savingTemplate}
      />
      <AddEditActivityCategory
        open={categoryOpen}
        setOpen={setCategoryOpen}
        record={category}
        setRecord={setCategory}
        onSave={handleSaveCategory}
        loading={savingCategory}
      />
      <AddEditActivityPlan
        open={planOpen}
        setOpen={setPlanOpen}
        record={plan}
        setRecord={setPlan}
        onSave={handleSavePlan}
        loading={savingPlan}
      />
    </Panel>
  );
};

export default ActivitySetup;
