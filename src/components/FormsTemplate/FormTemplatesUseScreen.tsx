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

    const formatDateTime = (date?: string) => {
      if (!date) return '';
      const d = new Date(date);
      if (isNaN(d.getTime())) return date;

      return d.toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    };




  // ENTRIES TABLE columns (✅ 3 icons: View + Edit + Print)
  const entriesColumns = [
    { key: 'title', title: <Translate>Title</Translate>, flexGrow: 6 },
  {
    key: 'createdByAt',
    title: 'Created By\\At',
    dataKey: 'createdByAt',
    width: 200,
    render: (row: any) => (
      <>
        {row.createdBy}
        <br />
        <span className="date-table-style">
          {formatDateTime(row.createdDate)}
        </span>
          </>
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