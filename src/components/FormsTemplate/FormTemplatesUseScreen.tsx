import Translate from '@/components/Translate';
import React, { useEffect, useState } from 'react';
import { Panel } from 'rsuite';
import { useDispatch, useSelector } from 'react-redux';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import { notify } from '@/utils/uiReducerActions';

import { useGetFormTemplatesQuery, useLazyGetFormTemplateQuery } from '@/services/setup/formTemplateService';
import { useLazyGetFormEntriesByTemplateQuery } from '@/services/setup/formEntriesService';

import UseTemplateModal from './UseTemplateModal';
import EntryPreviewModal from './EntryPreviewModal';
import EditEntryModal from './EditEntryModal';

// ✅ icons like system
import { MdPrint } from 'react-icons/md';
import { FaEye } from 'react-icons/fa';
import { MdModeEdit } from 'react-icons/md';

const FormTemplatesUseScreen = () => {
  const dispatch = useDispatch();
  const mode = useSelector((state: any) => state.ui.mode);

  // templates pagination
  const [tplParams, setTplParams] = useState({ page: 0, size: 15, sort: 'id,asc', timestamp: Date.now() });
  const { data: templatesResp, isFetching: tplFetching } = useGetFormTemplatesQuery(tplParams);

  // selected template
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

  // entries pagination
  const [entryParams, setEntryParams] = useState({ page: 0, size: 15, sort: 'id,desc', timestamp: Date.now() });
  const [loadEntries, entriesQueryState] = useLazyGetFormEntriesByTemplateQuery();
  const [entriesResp, setEntriesResp] = useState<any>({ data: [], totalCount: 0, links: {} });

  // Use modal
  const [useOpen, setUseOpen] = useState(false);

  // Preview modal
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewEntry, setPreviewEntry] = useState<any>(null);

  // Edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<any>(null);

  // template full (formJson) for preview/edit/print
  const [tplFull, setTplFull] = useState<any>(null);
  const [loadTemplate] = useLazyGetFormTemplateQuery();

  useEffect(() => {
    dispatch(setPageCode('UseFormTemplates'));
    dispatch(setDivContent('Use Form Templates'));
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch]);

  const fetchEntries = async (templateId: number, params = entryParams) => {
    try {
      const resp = await loadEntries({
        templateId,
        page: params.page,
        size: params.size,
        sort: params.sort,
        timestamp: Date.now()
      }).unwrap();
      setEntriesResp(resp ?? { data: [], totalCount: 0, links: {} });
    } catch (e) {
      console.error(e);
      setEntriesResp({ data: [], totalCount: 0, links: {} });
      dispatch(notify({ msg: 'Failed to load saved forms', sev: 'error' }));
    }
  };

  useEffect(() => {
    if (!selectedTemplate?.id) return;
    fetchEntries(selectedTemplate.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTemplate?.id, entryParams.page, entryParams.size, entryParams.sort]);

  const ensureTemplateLoaded = async () => {
    if (tplFull?.id === selectedTemplate?.id) return tplFull;
    const full = await loadTemplate(Number(selectedTemplate?.id)).unwrap();
    setTplFull(full);
    return full;
  };

  const handleOpenPreview = async (entryRow: any) => {
    try {
      if (!selectedTemplate?.id) return;
      await ensureTemplateLoaded();
      setPreviewEntry(entryRow);
      setPreviewOpen(true);
    } catch (e) {
      console.error(e);
      dispatch(notify({ msg: 'Failed to open preview', sev: 'error' }));
    }
  };

  const handleOpenEdit = async (entryRow: any) => {
    try {
      if (!selectedTemplate?.id) return;
      await ensureTemplateLoaded();
      setEditEntry(entryRow);
      setEditOpen(true);
    } catch (e) {
      console.error(e);
      dispatch(notify({ msg: 'Failed to open edit', sev: 'error' }));
    }
  };

  const handlePrint = async (entryRow: any) => {
    try {
      if (!selectedTemplate?.id) return;
      const full = await ensureTemplateLoaded();

      // open print window and render survey preview (not json)
      const html = buildPrintHtml(full?.formJson, entryRow?.dataJson, entryRow?.title);
      const w = window.open('', '_blank', 'width=1100,height=800');
      if (!w) return;
      w.document.open();
      w.document.write(html);
      w.document.close();
    } catch (e) {
      console.error(e);
      dispatch(notify({ msg: 'Failed to print', sev: 'error' }));
    }
  };

  const isTemplateSelected = (rowData: any) => (rowData?.id === selectedTemplate?.id ? 'selected-row' : '');

  // TEMPLATE TABLE columns
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
            onClick={() => {
              setSelectedTemplate(row);
              setUseOpen(true);
            }}
          >
            Use
          </MyButton>
        </div>
      )
    }
  ];

  // ENTRIES TABLE columns (✅ 3 icons: View + Edit + Print)
  const entriesColumns = [
    { key: 'title', title: <Translate>Title</Translate>, flexGrow: 6 },
    { key: 'createdBy', title: <Translate>Created By</Translate>, flexGrow: 3, render: (r: any) => r.createdBy ?? '-' },
    { key: 'createdDate', title: <Translate>Created Date</Translate>, flexGrow: 3, render: (r: any) => r.createdDate ?? '-' },
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
          <MdPrint
            title="Print"
            size={22}
            fill="var(--primary-gray)"
            className="icons-style"
            onClick={() => handlePrint(row)}
          />
        </div>
      )
    }
  ];

  return (
    <Panel className={mode === 'dark' ? 'dashboard-dark' : ''}>
      {/* TOP TABLE: Templates */}
      <MyTable
        height={400}
        data={templatesResp?.data ?? []}
        totalCount={templatesResp?.totalCount ?? 0}
        columns={templateColumns}
        loading={tplFetching}
        rowClassName={isTemplateSelected}
        onRowClick={(row: any) => {
          setSelectedTemplate(row);
          setEntryParams(prev => ({ ...prev, page: 0 }));
          setTplFull(null); // reset cached full template
        }}
        page={tplParams.page}
        rowsPerPage={tplParams.size}
        onPageChange={(e: any, newPage: number) => setTplParams(prev => ({ ...prev, page: newPage }))}
        onRowsPerPageChange={(e: any) => setTplParams(prev => ({ ...prev, size: parseInt(e.target.value, 10), page: 0 }))}
      />

      {/* BOTTOM TABLE: Entries */}
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
          onPageChange={(e: any, newPage: number) => setEntryParams(prev => ({ ...prev, page: newPage }))}
          onRowsPerPageChange={(e: any) => setEntryParams(prev => ({ ...prev, size: parseInt(e.target.value, 10), page: 0 }))}
        />
      </div>

      {/* Use Modal */}
      <UseTemplateModal
        open={useOpen}
        setOpen={(v: boolean) => {
          setUseOpen(v);
          if (!v && selectedTemplate?.id) {
            fetchEntries(selectedTemplate.id, { ...entryParams, page: 0, timestamp: Date.now() });
          }
        }}
        templateRow={selectedTemplate}
      />

      {/* Preview Modal */}
      <EntryPreviewModal
        open={previewOpen}
        setOpen={setPreviewOpen}
        template={tplFull}
        entry={previewEntry}
      />

      {/* Edit Modal */}
      <EditEntryModal
        open={editOpen}
        setOpen={setEditOpen}
        template={tplFull}
        entry={editEntry}
        onSaved={() => {
          if (selectedTemplate?.id) fetchEntries(selectedTemplate.id, { ...entryParams, timestamp: Date.now() });
        }}
      />
    </Panel>
  );
};

export default FormTemplatesUseScreen;

/** Print HTML (Survey preview, not json) */
function buildPrintHtml(formJsonStr: string, dataJsonStr: string, title: string) {
  // NOTE: we render via surveyjs in print window (CDN)
  // If your project blocks CDN, tell me and I’ll do iframe + internal rendering instead.
  const safeTitle = escapeHtml(title ?? 'Form');

  return `
  <html>
    <head>
      <title>${safeTitle}</title>
      <meta charset="utf-8" />
      <style>
        body { font-family: Arial, sans-serif; padding: 18px; }
        h2 { margin: 0 0 12px 0; }
        .box { border:1px solid #e6edf5; border-radius:12px; padding:14px; }
      </style>

      <script src="https://unpkg.com/survey-core/survey.core.min.js"></script>
      <script src="https://unpkg.com/survey-js-ui/survey-js-ui.min.js"></script>
      <link rel="stylesheet" href="https://unpkg.com/survey-core/defaultV2.min.css" />
    </head>
    <body>
      <h2>${safeTitle}</h2>
      <div class="box">
        <div id="surveyContainer"></div>
      </div>

      <script>
        const formJson = ${JSON.stringify(formJsonStr ? JSON.parse(formJsonStr) : {})};
        const dataJson = ${JSON.stringify(dataJsonStr ? JSON.parse(dataJsonStr) : {})};

        const model = new SurveyCore.Model(formJson);
        model.data = dataJson;
        model.mode = "display";
        model.showNavigationButtons = false;
        model.showCompletedPage = false;

        SurveyUI.Survey({ model: model }, document.getElementById("surveyContainer"));

        window.onload = () => window.print();
      </script>
    </body>
  </html>`;
}

function escapeHtml(str: string) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
