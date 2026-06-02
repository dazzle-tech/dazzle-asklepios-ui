import React, { useEffect, useMemo, useState } from 'react';
import { Panel } from 'rsuite';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { FaEye } from 'react-icons/fa';
import { MdModeEdit } from 'react-icons/md';

import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import { useAppSelector } from '@/hooks';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { notify } from '@/utils/uiReducerActions';
import { useGetUserFullNameByLoginQuery } from '@/services/userService';
import {
  useGetFormTemplatesQuery,
  useLazyGetFormTemplatesQuery
} from '@/services/setup/formTemplateService';
import {
  useLazyGetFormEntriesByTemplateQuery,
  useLazyGetFormEntriesByPatientQuery,
  useLazyGetFormEntriesByEncounterQuery,
  type PagedResult
} from '@/services/setup/formEntriesService';
import type { FormEntry } from '@/types/model-types-new';

import UseTemplateModal from './UseTemplateModal';
import EntryPreviewModal from './EntryPreviewModal';
import EditEntryModal from './EditEntryModal';
import UserDateCell from '../UserDateCell/UserDateCell';

const EMPTY_PAGED_RESULT: PagedResult<FormEntry> = {
  data: [],
  totalCount: 0,
  links: {}
};

const SCOPED_FETCH_SIZE = 1000;

const filterEntriesByTemplate = (entries: FormEntry[], templateId: number) =>
  entries.filter((entry) => Number(entry.templateId) === Number(templateId));

const paginateEntries = (entries: FormEntry[], page: number, size: number): PagedResult<FormEntry> => {
  const start = page * size;
  return {
    data: entries.slice(start, start + size),
    totalCount: entries.length,
    links: {}
  };
};

const resolveNumericId = (entity: any): number | null => {
  if (!entity) return null;
  const raw = entity.id ?? entity.key;
  if (raw == null || raw === '') return null;
  const n = Number(raw);
  return Number.isNaN(n) ? null : n;
};

const FormTemplatesUseScreen = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const mode = useSelector((state: any) => state.ui.mode);
  const authSlice = useAppSelector((s) => s.auth);
  const reduxPatient = useAppSelector((s) => s.patient.patient);
  const reduxEncounter = useAppSelector((s) => s.patient.encounter);

  const locationState = (location.state || {}) as { patient?: any; encounter?: any };
  const patient = locationState.patient ?? reduxPatient;
  const encounter = locationState.encounter ?? reduxEncounter;

  const patientId =
    resolveNumericId(patient) ??
    resolveNumericId(encounter?.patient) ??
    (encounter?.patientId != null && encounter.patientId !== ''
      ? Number(encounter.patientId)
      : null);
  const encounterId = resolveNumericId(encounter);
  const inEncounterRoute = location.pathname.includes('/encounter');
  const isFromEncounter = inEncounterRoute;
  const isPatientScoped = Boolean(patientId);
  const isEncounterScoped = Boolean(encounterId);
  const hasEncounterContext = isFromEncounter && Boolean(patientId && encounterId);

  const warnMissingEncounterContext = (): boolean => {
    if (!isFromEncounter) return false;

    if (!patientId && !encounterId) {
      dispatch(
        notify({
          msg: 'Patient and encounter are required to use forms from encounter',
          sev: 'warning'
        })
      );
      return true;
    }

    if (!patientId) {
      dispatch(
        notify({
          msg: 'Patient is required to use forms from encounter',
          sev: 'warning'
        })
      );
      return true;
    }

    if (!encounterId) {
      dispatch(
        notify({
          msg: 'Encounter is required to use forms from encounter',
          sev: 'warning'
        })
      );
      return true;
    }

    return false;
  };

  const handleOpenUseTemplate = (row: any) => {
    if (warnMissingEncounterContext()) return;
    setSelectedTemplate(row);
    setUseOpen(true);
  }

  const selectedDepartmentId = authSlice.selectedDepartment?.departmentId;

  const [tplParams, setTplParams] = useState({
    page: 0,
    size: 15,
    sort: 'id,asc',
    timestamp: Date.now()
  });

  const [entryParams, setEntryParams] = useState({
    page: 0,
    size: 15,
    sort: 'id,desc',
    timestamp: Date.now()
  });

  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [entriesResp, setEntriesResp] = useState<any>(EMPTY_PAGED_RESULT);

  const [useOpen, setUseOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewEntry, setPreviewEntry] = useState<any>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<any>(null);

  const [tplFull, setTplFull] = useState<any>(null);

  const {
    data: templatesResp,
    isFetching: tplFetching
  } = useGetFormTemplatesQuery(
    {
      page: tplParams.page,
      size: tplParams.size,
      sort: tplParams.sort,
      timestamp: tplParams.timestamp,
      params: {
        departmentId: selectedDepartmentId
      }
    },
    {
      skip: !selectedDepartmentId
    }
  );

  const [loadTemplate] = useLazyGetFormTemplatesQuery();
  const [loadEntriesByTemplate, entriesByTemplateState] = useLazyGetFormEntriesByTemplateQuery();
  const [loadEntriesByPatient, entriesByPatientState] = useLazyGetFormEntriesByPatientQuery();
  const [loadEntriesByEncounter, entriesByEncounterState] = useLazyGetFormEntriesByEncounterQuery();

  const entriesQueryState = useMemo(() => {
    if (hasEncounterContext) return entriesByEncounterState;
    if (isPatientScoped) return entriesByPatientState;
    return entriesByTemplateState;
  }, [
    hasEncounterContext,
    isPatientScoped,
    entriesByEncounterState,
    entriesByPatientState,
    entriesByTemplateState
  ]);

  useEffect(() => {
    dispatch(setPageCode('UseFormTemplates'));
    dispatch(setDivContent('Use Form Templates'));

    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch]);

  const fetchEntries = async (templateId: number, params = entryParams) => {
    if (isFromEncounter && (!patientId || !encounterId)) {
      setEntriesResp(EMPTY_PAGED_RESULT);
      return;
    }

    try {
      const queryBase = {
        page: params.page,
        size: params.size,
        sort: params.sort,
        timestamp: Date.now()
      };

      if (hasEncounterContext && encounterId) {
        const resp = await loadEntriesByEncounter({
          encounterId,
          page: 0,
          size: SCOPED_FETCH_SIZE,
          sort: params.sort,
          timestamp: Date.now()
        }).unwrap();
        const filtered = filterEntriesByTemplate(resp?.data ?? [], templateId);
        setEntriesResp(paginateEntries(filtered, params.page, params.size));
        return;
      }

      if (isPatientScoped && patientId) {
        const resp = await loadEntriesByPatient({
          patientId,
          page: 0,
          size: SCOPED_FETCH_SIZE,
          sort: params.sort,
          timestamp: Date.now()
        }).unwrap();
        const filtered = filterEntriesByTemplate(resp?.data ?? [], templateId);
        setEntriesResp(paginateEntries(filtered, params.page, params.size));
        return;
      }

      const resp = await loadEntriesByTemplate({
        templateId,
        ...queryBase
      }).unwrap();
      setEntriesResp(resp ?? EMPTY_PAGED_RESULT);
    } catch (e) {
      setEntriesResp(EMPTY_PAGED_RESULT);
      if (patientId) {
        dispatch(notify({ msg: 'Failed to load saved forms', sev: 'error' }));
      }
    }
  };

  useEffect(() => {
    setTplParams((prev) => ({ ...prev, page: 0, timestamp: Date.now() }));
    setEntryParams((prev) => ({ ...prev, page: 0 }));
    setSelectedTemplate(null);
    setTplFull(null);
    setEntriesResp(EMPTY_PAGED_RESULT);
  }, [selectedDepartmentId]);

  useEffect(() => {
    if (!selectedTemplate?.id) {
      setEntriesResp(EMPTY_PAGED_RESULT);
      return;
    }

    fetchEntries(selectedTemplate.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedTemplate?.id,
    entryParams.page,
    entryParams.size,
    entryParams.sort,
    patientId,
    encounterId
  ]);

  const ensureTemplateLoaded = async () => {
    const alreadySelected =
      tplFull?.data?.find((x: any) => x.id === selectedTemplate?.id) ?? null;

    if (alreadySelected) return alreadySelected;

    const resp = await loadTemplate({
      page: 0,
      size: 50,
      sort: 'id,asc',
      timestamp: Date.now(),
      params: {
        departmentId: selectedDepartmentId
      }
    }).unwrap();

    setTplFull(resp);

    const full =
      resp?.data?.find((x: any) => x.id === selectedTemplate?.id) ?? null;

    return full;
  };

  const handleOpenPreview = async (entryRow: any) => {
    try {
      if (!selectedTemplate?.id) return;

      const full = await ensureTemplateLoaded();
      if (!full) {
        dispatch(notify({ msg: 'Template details not found', sev: 'error' }));
        return;
      }

      setPreviewEntry(entryRow);
      setPreviewOpen(true);
    } catch (e) {
      dispatch(notify({ msg: 'Failed to open preview', sev: 'error' }));
    }
  };

  const handleOpenEdit = async (entryRow: any) => {
    try {
      if (!selectedTemplate?.id) return;

      const full = await ensureTemplateLoaded();
      if (!full) {
        dispatch(notify({ msg: 'Template details not found', sev: 'error' }));
        return;
      }

      setEditEntry(entryRow);
      setEditOpen(true);
    } catch (e) {
      dispatch(notify({ msg: 'Failed to open edit', sev: 'error' }));
    }
  };

  const isTemplateSelected = (rowData: any) =>
    rowData?.id === selectedTemplate?.id ? 'selected-row' : '';

  const templateColumns = [
    { key: 'name', title: <Translate>Template</Translate>, flexGrow: 4 },
    { key: 'description', title: <Translate>Description</Translate>, flexGrow: 6 },
    {
      key: 'actions',
      title: '',
      flexGrow: 3,
      render: (row: any) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <MyButton
            color="var(--deep-blue)"
            width="90px"
            onClick={() => handleOpenUseTemplate(row)}
          >
            Use
          </MyButton>
        </div>
      )
    }
  ];

  const entriesColumns = [
    { key: 'title', title: <Translate>Title</Translate>, flexGrow: 6 },
    {
      key: 'createdByAt',
      title: 'Created By\\At',
      dataKey: 'createdByAt',
      width: 200,
      render: (row: any) => (
        <UserDateCell
          login={row.createdBy}
          date={row.createdDate}
        />
      )
    },
    {
      key: 'icons',
      title: '',
      flexGrow: 2,
      render: (row: any) => (
        <div className="container-of-icons">
          <FaEye
            title="Preview"
            size={20}
            fill="var(--primary-gray)"
            className="icons-style"
            onClick={() => handleOpenPreview(row)}
          />
          <MdModeEdit
            title="Edit"
            size={22}
            fill="var(--primary-gray)"
            className="icons-style"
            onClick={() => handleOpenEdit(row)}
          />
        </div>
      )
    }
  ];

  const currentTemplateFull =
    tplFull?.data?.find((x: any) => x.id === selectedTemplate?.id) ?? null;

  return (
    <Panel className={mode === 'dark' ? 'dashboard-dark' : ''}>
      <MyTable
        height={400}
        data={templatesResp?.data ?? []}
        totalCount={templatesResp?.totalCount ?? 0}
        columns={templateColumns}
        loading={tplFetching}
        rowClassName={isTemplateSelected}
        onRowClick={(row: any) => {
          setSelectedTemplate(row);
          setEntryParams((prev) => ({ ...prev, page: 0 }));
          setTplFull(null);
        }}
        page={tplParams.page}
        rowsPerPage={tplParams.size}
        onPageChange={(e: any, newPage: number) =>
          setTplParams((prev) => ({
            ...prev,
            page: newPage,
            timestamp: Date.now()
          }))
        }
        onRowsPerPageChange={(e: any) =>
          setTplParams((prev) => ({
            ...prev,
            size: parseInt(e.target.value, 10),
            page: 0,
            timestamp: Date.now()
          }))
        }
      />

      <div style={{ marginTop: 14 }}>
        <div style={{ fontWeight: 800, marginBottom: 8 }}>
          <Translate>Saved Forms</Translate>
          {selectedTemplate?.name ? ` - ${selectedTemplate.name}` : ''}
        </div>

        <MyTable
          height={400}
          data={entriesResp?.data ?? []}
          totalCount={entriesResp?.totalCount ?? 0}
          columns={entriesColumns}
          loading={entriesQueryState.isFetching}
          page={entryParams.page}
          rowsPerPage={entryParams.size}
          onPageChange={(e: any, newPage: number) =>
            setEntryParams((prev) => ({ ...prev, page: newPage }))
          }
          onRowsPerPageChange={(e: any) =>
            setEntryParams((prev) => ({
              ...prev,
              size: parseInt(e.target.value, 10),
              page: 0
            }))
          }
        />
      </div>

      <UseTemplateModal
        open={useOpen}
        setOpen={setUseOpen}
        templateRow={selectedTemplate}
        fromEncounter={isFromEncounter}
        patientId={patientId}
        encounterId={encounterId}
        onSaved={async () => {
          if (!selectedTemplate?.id) return;

          await fetchEntries(selectedTemplate.id, {
            ...entryParams,
            page: 0,
            timestamp: Date.now()
          });
        }}
      />

      <EntryPreviewModal
        open={previewOpen}
        setOpen={setPreviewOpen}
        template={currentTemplateFull}
        entry={previewEntry}
      />

      <EditEntryModal
        open={editOpen}
        setOpen={setEditOpen}
        template={currentTemplateFull}
        entry={editEntry}
        onSaved={() => {
          if (selectedTemplate?.id) {
            fetchEntries(selectedTemplate.id, {
              ...entryParams,
              timestamp: Date.now()
            });
          }
        }}
      />
    </Panel>
  );
};

export default FormTemplatesUseScreen;