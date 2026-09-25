import React, { useEffect, useMemo, useState } from 'react';
import { Panel } from 'rsuite';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { FaEye } from 'react-icons/fa';
import { MdModeEdit, MdDownload } from 'react-icons/md';
import jsPDF from 'jspdf';

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
import { formatDateWithoutSeconds } from '@/utils';

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

const humanizeKey = (key: string): string =>
  key
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());

const flattenAnswers = (value: any, prefix = ''): Array<{ key: string; value: string }> => {
  if (value === null || value === undefined) return [{ key: prefix || 'Value', value: '-' }];
  if (typeof value !== 'object') return [{ key: prefix || 'Value', value: String(value) }];

  if (Array.isArray(value)) {
    if (!value.length) return [{ key: prefix || 'Value', value: '-' }];
    if (value.every((item) => item === null || ['string', 'number', 'boolean'].includes(typeof item))) {
      return [{ key: prefix || 'Value', value: value.map((v) => String(v)).join(', ') }];
    }
    return value.flatMap((item, idx) => flattenAnswers(item, `${prefix || 'Item'} ${idx + 1}`));
  }

  const entries = Object.entries(value);
  if (!entries.length) return [{ key: prefix || 'Value', value: '-' }];

  return entries.flatMap(([childKey, childVal]) =>
    flattenAnswers(childVal, prefix ? `${prefix} - ${humanizeKey(childKey)}` : humanizeKey(childKey))
  );
};

const getPatientDisplayName = (patient: any): string => {
  if (!patient) return '-';
  const fullName = patient.fullName || patient.patientName || patient.name;
  if (fullName) return String(fullName);
  const nameFromParts = [patient.firstName, patient.middleName, patient.lastName]
    .filter(Boolean)
    .join(' ')
    .trim();
  return nameFromParts || '-';
};

const formatEncounterNumber = (value: any): string => {
  if (value === null || value === undefined || value === '') return '-';
  const raw = String(value).trim();
  if (/^E\d+$/i.test(raw)) return raw.toUpperCase();
  if (/^\d+$/.test(raw)) return `E${raw.padStart(5, '0')}`;
  return raw;
};

const resolveNumericId = (entity: any): number | null => {
  if (!entity) return null;
  const raw = entity.id ?? entity.key;
  if (raw == null || raw === '') return null;
  const n = Number(raw);
  return Number.isNaN(n) ? null : n;
};

const FormTemplatesUseScreen = (props) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const edit = props.edit ?? location.state?.edit ?? false;
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
  const [pendingRefreshAfterUseClose, setPendingRefreshAfterUseClose] = useState(false);
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

  useEffect(() => {
    if (useOpen || !pendingRefreshAfterUseClose || !selectedTemplate?.id) return;

    const timer = setTimeout(() => {
      fetchEntries(selectedTemplate.id, {
        ...entryParams,
        page: 0,
        timestamp: Date.now()
      });
      setPendingRefreshAfterUseClose(false);
    }, 200);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useOpen, pendingRefreshAfterUseClose, selectedTemplate?.id]);

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

  const handleDownloadPdf = (entryRow: any) => {
    try {
      const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const marginX = 12;
      const contentWidth = pageWidth - marginX * 2;

      const templateName = selectedTemplate?.name || 'Form Name';
      const generatedAt = formatDateWithoutSeconds(new Date().toISOString());
      const patientName = getPatientDisplayName(patient);
      const authAny = authSlice as any;
      const facilityName =
        authSlice?.selectedDepartment?.facilityName ||
        authSlice?.selectedDepartment?.facility?.name ||
        authAny?.tenant?.selectedFacility?.name ||
        authAny?.tenant?.selectedFacility?.facilityName ||
        authAny?.selectedFacility?.name ||
        authAny?.selectedFacility?.facilityName ||
        authAny?.facility?.name ||
        '-';
      const departmentName =
        authSlice?.selectedDepartment?.name ||
        authSlice?.selectedDepartment?.departmentName ||
        'Department';
      const headerTitle = facilityName;
      const headerSubTitle = departmentName;
      const encounterNumber = formatEncounterNumber(
        encounter?.encounterNumber ?? encounter?.encounterNo ?? encounter?.number ?? encounterId
      );

      let parsedData: any = {};
      try {
        parsedData = entryRow?.dataJson ? JSON.parse(entryRow.dataJson) : {};
      } catch {
        parsedData = { RawData: entryRow?.dataJson ?? '' };
      }

      const answers = flattenAnswers(parsedData);

      let y = 0;

      doc.setFillColor(236, 243, 255);
      doc.rect(0, 0, pageWidth, 24, 'F');
      doc.setDrawColor(33, 79, 171);
      doc.setLineWidth(0.8);
      doc.line(0, 24, pageWidth, 24);
      doc.setTextColor(33, 79, 171);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text(headerTitle, pageWidth / 2, 13.5, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(93, 112, 138);
      doc.text(headerSubTitle, pageWidth / 2, 18.5, { align: 'center' });

      // Real form-paper style compact boxed header row
      const boxTop = 28;
      const boxHeight = 13;
      const boxGap = 2;
      const boxW = (contentWidth - boxGap * 2) / 3;

      const boxX1 = marginX;
      const boxX2 = boxX1 + boxW + boxGap;
      const boxX3 = boxX2 + boxW + boxGap;

      const drawHeaderField = (
        label: string,
        value: string,
        x: number,
        top: number,
        width: number,
        height: number
      ) => {
        doc.setDrawColor(210, 219, 232);
        doc.roundedRect(x, top, width, height, 1.2, 1.2, 'S');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(93, 112, 138);
        doc.text(label, x + 1.8, top + 3.8);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.4);
        doc.setTextColor(30, 41, 59);
        const lines = doc.splitTextToSize(value || '-', width - 3.6).slice(0, 2);
        const valueStartY = top + 7.8;
        const maxY = top + height - 1.4;
        lines.forEach((line, idx) => {
          const lineY = valueStartY + idx * 3.6;
          if (lineY <= maxY) {
            doc.text(line, x + 1.8, lineY);
          }
        });
      };

      // Order requested: Patient Name, Date, Encounter Number, Form Name, Form Title, Created By
      drawHeaderField('Patient Name', patientName, boxX1, boxTop, boxW, boxHeight);
      drawHeaderField('Date', generatedAt || '-', boxX2, boxTop, boxW, boxHeight);
      drawHeaderField('Encounter Number', encounterNumber, boxX3, boxTop, boxW, boxHeight);

      const row2Top = boxTop + boxHeight + 3;
      const row2H = 13;
      drawHeaderField('Form Name', templateName || '-', boxX1, row2Top, boxW, row2H);
      drawHeaderField('Form Title', entryRow?.title || '-', boxX2, row2Top, boxW, row2H);
      drawHeaderField('Created By', entryRow?.createdBy || '-', boxX3, row2Top, boxW, row2H);

      y = row2Top + row2H + 6;

      answers.forEach((answer, idx) => {
        const questionLines = doc.splitTextToSize(answer.key, 72);
        const valueLines = doc.splitTextToSize(answer.value || '-', contentWidth - 84);
        const rowHeight = Math.max(questionLines.length, valueLines.length) * 4.5 + 4;

        if (y + rowHeight > pageHeight - 12) {
          doc.addPage();
          y = 14;
        }

        if (idx % 2 === 0) {
          doc.setFillColor(248, 250, 253);
          doc.rect(marginX, y - 3, contentWidth, rowHeight, 'F');
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(62, 81, 101);
        doc.text(questionLines, marginX + 2, y + 1);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(38, 38, 38);
        doc.text(valueLines, marginX + 78, y + 1);
        y += rowHeight;
      });

      const pdfUrl = doc.output('bloburl');
      const popup = window.open(pdfUrl, '_blank');
      if (!popup) {
        dispatch(notify({ msg: 'Popup blocked. Please allow popups to preview PDF.', sev: 'warning' }));
      }
    } catch {
      dispatch(notify({ msg: 'Failed to generate PDF', sev: 'error' }));
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
            disabled={edit}
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
            style={{
              cursor: edit
                ? 'not-allowed'
                : 'pointer',

              opacity: edit
                ? 0.5
                : 1
            }}
            onClick={
              () => { 
                if (edit) return 
                handleOpenEdit(row) 
                   }}

          />
          <MdDownload
            title="Download PDF"
            size={22}
            fill="var(--deep-blue)"
            className="icons-style"
            onClick={() => handleDownloadPdf(row)}
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
        onSaved={async (savedEntry: any) => {
          if (!selectedTemplate?.id) return;
          setPendingRefreshAfterUseClose(true);

          const refreshedParams = {
            ...entryParams,
            page: 0,
            timestamp: Date.now()
          };

          setEntryParams((prev) => ({
            ...prev,
            page: 0,
            timestamp: Date.now()
          }));

          if (savedEntry) {
            setEntriesResp((prev: any) => ({
              ...prev,
              data: [savedEntry, ...((prev?.data ?? []).filter((x: any) => x?.id !== savedEntry?.id))],
              totalCount: (prev?.totalCount ?? 0) + 1
            }));
          }

          await fetchEntries(selectedTemplate.id, refreshedParams);
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