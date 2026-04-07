import React, { useEffect, useState } from 'react';
import { Panel } from 'rsuite';
import { useDispatch, useSelector } from 'react-redux';
import { FaEye } from 'react-icons/fa';
import { MdModeEdit } from 'react-icons/md';

import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import { useAppSelector } from '@/hooks';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { notify } from '@/utils/uiReducerActions';

import {
  useGetFormTemplatesQuery,
  useLazyGetFormTemplatesQuery
} from '@/services/setup/formTemplateService';
import { useLazyGetFormEntriesByTemplateQuery } from '@/services/setup/formEntriesService';

import UseTemplateModal from './UseTemplateModal';
import EntryPreviewModal from './EntryPreviewModal';
import EditEntryModal from './EditEntryModal';

const EMPTY_PAGED_RESULT = {
  data: [],
  totalCount: 0,
  links: {}
};

const FormTemplatesUseScreen = () => {
  const dispatch = useDispatch();
  const mode = useSelector((state: any) => state.ui.mode);
  const authSlice = useAppSelector((s) => s.auth);

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
  const [loadEntries, entriesQueryState] = useLazyGetFormEntriesByTemplateQuery();

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
      console.log('fetchEntries resp =', resp);
      setEntriesResp(resp ?? EMPTY_PAGED_RESULT);
    } catch (e) {
      console.error(e);
      setEntriesResp(EMPTY_PAGED_RESULT);
      dispatch(notify({ msg: 'Failed to load saved forms', sev: 'error' }));
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
  }, [selectedTemplate?.id, entryParams.page, entryParams.size, entryParams.sort]);

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
      console.error(e);
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
      console.error(e);
      dispatch(notify({ msg: 'Failed to open edit', sev: 'error' }));
    }
  };

  const isTemplateSelected = (rowData: any) =>
    rowData?.id === selectedTemplate?.id ? 'selected-row' : '';

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
        onSaved={async (savedEntry: any) => {
          if (savedEntry) {
            setEntriesResp((prev: any) => ({
              ...prev,
              data: [savedEntry, ...(prev?.data ?? [])],
              totalCount: (prev?.totalCount ?? 0) + 1
            }));
          }

          if (selectedTemplate?.id) {
            setTimeout(async () => {
              await fetchEntries(selectedTemplate.id, {
                ...entryParams,
                page: 0,
                timestamp: Date.now()
              });
            }, 500);
          }
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