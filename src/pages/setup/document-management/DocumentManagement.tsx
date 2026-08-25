import React, { useEffect, useState } from 'react';
import { Form, Panel } from 'rsuite';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { MdArchive, MdCloudUpload, MdDelete, MdModeEdit } from 'react-icons/md';
import { FaUndo } from 'react-icons/fa';
import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import { useAppDispatch } from '@/hooks';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { formatEnumString } from '@/utils';
import { extractApiErrorMessage } from '@/utils/apiErrorMessage';
import { hideSystemLoader, notify, showSystemLoader } from '@/utils/uiReducerActions';
import { useEnumOptions } from '@/services/enumsApi';
import {
  useLazyDownloadDocumentTemplateQuery,
  useSearchDocumentsQuery,
  useUpdateDocumentMutation,
  type DocumentDefinitionDTO,
  type DocumentDefinitionResponseVM
} from '@/services/patients/documentManagementService';
import AddEditDocument from './AddEditDocument';
import DocumentVersionsModal from './DocumentVersionsModal';
import './styles.less';

const DOCUMENT_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  ARCHIVED: 'ARCHIVED'
} as const;

type StatusAction = 'deactivate' | 'reactivate' | 'archive';

const statusColor = (status?: string) => {
  const value = (status ?? '').toUpperCase();
  if (value === DOCUMENT_STATUS.ACTIVE) return '#45b887';
  if (value === 'DRAFT') return '#5b8def';
  if (value === DOCUMENT_STATUS.ARCHIVED) return '#6b7280';
  return '#969fb0';
};

const toStatusPayload = (
  row: DocumentDefinitionResponseVM,
  status: string
): DocumentDefinitionDTO => ({
  code: row.code,
  name: row.name,
  ...(row.description ? { description: row.description } : {}),
  ...(row.category ? { category: row.category } : {}),
  status
});

const DocumentManagement: React.FC = () => {
  const dispatch = useAppDispatch();
  const [selected, setSelected] = useState<DocumentDefinitionResponseVM | null>(null);
  const [openAddEdit, setOpenAddEdit] = useState(false);
  const [openVersions, setOpenVersions] = useState(false);
  const [openConfirmStatus, setOpenConfirmStatus] = useState(false);
  const [statusAction, setStatusAction] = useState<StatusAction>('deactivate');

  const [updateDocument] = useUpdateDocumentMutation();
  const [downloadTemplate] = useLazyDownloadDocumentTemplateQuery();

  const [filterDraft, setFilterDraft] = useState({ search: '', status: 'all' });
  const [appliedFilters, setAppliedFilters] = useState({ search: '', status: 'all' });
  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 15,
    sort: 'id,desc'
  });
  const [sortColumn, setSortColumn] = useState('id');
  const [sortType, setSortType] = useState<'asc' | 'desc'>('desc');

  const statusOptions = useEnumOptions('DocumentStatus');
  const statusFilterOptions = [
    { label: 'All', value: 'all' },
    ...statusOptions
  ];

  const { data, isFetching, refetch } = useSearchDocumentsQuery({
    search: appliedFilters.search || undefined,
    status: appliedFilters.status === 'all' ? undefined : appliedFilters.status,
    page: paginationParams.page,
    size: paginationParams.size,
    sort: paginationParams.sort
  });

  useEffect(() => {
    dispatch(setPageCode('DOCUMENT_MANAGEMENT'));
    dispatch(setDivContent('Document Management'));
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch]);

  const handleNew = () => {
    setSelected(null);
    setOpenAddEdit(true);
  };

  const handleEdit = (row: DocumentDefinitionResponseVM) => {
    setSelected(row);
    setOpenAddEdit(true);
  };

  const handleVersions = (row: DocumentDefinitionResponseVM) => {
    setSelected(row);
    setOpenVersions(true);
  };

  const openStatusConfirm = (row: DocumentDefinitionResponseVM, action: StatusAction) => {
    setSelected(row);
    setStatusAction(action);
    setOpenConfirmStatus(true);
  };

  const nextStatusForAction = (action: StatusAction) => {
    if (action === 'reactivate') return DOCUMENT_STATUS.ACTIVE;
    if (action === 'archive') return DOCUMENT_STATUS.ARCHIVED;
    return DOCUMENT_STATUS.INACTIVE;
  };

  const handleUpdateStatus = async () => {
    if (!selected?.id) return;

    try {
      dispatch(showSystemLoader());
      await updateDocument({
        id: selected.id,
        body: toStatusPayload(selected, nextStatusForAction(statusAction))
      }).unwrap();
      setOpenConfirmStatus(false);
      dispatch(
        notify({
          msg:
            statusAction === 'archive'
              ? 'Document archived successfully'
              : statusAction === 'reactivate'
                ? 'Document activated successfully'
                : 'Document deactivated successfully',
          sev: 'success'
        })
      );
      refetch();
    } catch (error) {
      dispatch(
        notify({
          msg: extractApiErrorMessage(error) || 'Action failed, please try again',
          sev: 'warning'
        })
      );
    } finally {
      dispatch(hideSystemLoader());
    }
  };

  const handleAfterSave = (
    action: 'create' | 'update',
    saved: DocumentDefinitionResponseVM
  ) => {
    setSelected(saved);
    setPaginationParams(prev => ({ ...prev, page: 0 }));
    refetch();
    if (action === 'create' && saved?.id) {
      setOpenVersions(true);
    }
  };

  const handleDownloadActiveVersion = async (
    event: React.MouseEvent,
    row: DocumentDefinitionResponseVM
  ) => {
    event.stopPropagation();
    if (!row.id || !row.activeVersion) return;

    try {
      dispatch(showSystemLoader());
      const url = row.activeVersion.url || (await downloadTemplate(row.id).unwrap())?.url;
      if (!url) {
        dispatch(notify({ msg: 'Template download URL is not available', sev: 'warning' }));
        return;
      }

      const link = window.document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      if (row.activeVersion.fileName) {
        link.download = row.activeVersion.fileName;
      }
      window.document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      dispatch(
        notify({
          msg: extractApiErrorMessage(error) || 'Failed to download template',
          sev: 'warning'
        })
      );
    } finally {
      dispatch(hideSystemLoader());
    }
  };

  const handleSearch = () => {
    setAppliedFilters({ ...filterDraft });
    setPaginationParams(prev => ({ ...prev, page: 0 }));
  };

  const handlePageChange = (_event: unknown, newPage: number) => {
    setPaginationParams(prev => ({ ...prev, page: newPage }));
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPaginationParams(prev => ({
      ...prev,
      size: Number(event.target.value),
      page: 0
    }));
  };

  const handleSortChange = (column: string, type: 'asc' | 'desc') => {
    setSortColumn(column);
    setSortType(type);
    setPaginationParams(prev => ({
      ...prev,
      sort: `${column},${type}`,
      page: 0
    }));
  };

  const isSelected = (rowData: DocumentDefinitionResponseVM) =>
    rowData && selected && rowData.id === selected.id ? 'selected-row' : '';

  const tableColumns = [
    {
      key: 'code',
      title: <Translate>Code</Translate>
    },
    {
      key: 'name',
      title: <Translate>Name</Translate>
    },
    {
      key: 'category',
      title: <Translate>Category</Translate>,
      render: (row: DocumentDefinitionResponseVM) => formatEnumString(row.category)
    },
    {
      key: 'status',
      title: <Translate>Status</Translate>,
      render: (row: DocumentDefinitionResponseVM) => (
        <MyBadgeStatus
          color={statusColor(row.status)}
          contant={formatEnumString(row.status) || row.status || '-'}
        />
      )
    },
    {
      key: 'activeVersion',
      title: <Translate>Active Version</Translate>,
      render: (row: DocumentDefinitionResponseVM) => {
        const activeVersion = row.activeVersion;
        if (activeVersion?.version == null) return '-';

        return (
          <span className="document-active-version">
            <span>{`v${activeVersion.version}`}</span>
            {activeVersion.fileName ? (
              <>
                {' ('}
                <span
                  className="table-link"
                  title="Download"
                  onClick={event => handleDownloadActiveVersion(event, row)}
                >
                  {activeVersion.fileName}
                </span>
                {')'}
              </>
            ) : null}
          </span>
        );
      }
    },
    {
      key: 'actions',
      title: <Translate></Translate>,
      render: (row: DocumentDefinitionResponseVM) => {
        const status = (row.status || '').toUpperCase();
        const isActive = status === DOCUMENT_STATUS.ACTIVE;
        const isArchived = status === DOCUMENT_STATUS.ARCHIVED;

        return (
          <div className="container-of-icons">
            <MdModeEdit
              className="icons-style"
              title="Edit"
              size={24}
              fill="var(--primary-gray)"
              onClick={() => handleEdit(row)}
            />
            <MdCloudUpload
              className="icons-style"
              title="Upload Version"
              size={24}
              fill="var(--primary-gray)"
              onClick={() => handleVersions(row)}
            />
            {isActive ? (
              <MdDelete
                className="icons-style"
                title="Deactivate"
                size={24}
                fill="var(--primary-pink)"
                onClick={() => openStatusConfirm(row, 'deactivate')}
              />
            ) : (
              <FaUndo
                className="icons-style"
                title="Activate"
                size={20}
                fill="var(--primary-gray)"
                onClick={() => openStatusConfirm(row, 'reactivate')}
              />
            )}
            {!isArchived && (
              <MdArchive
                className="icons-style"
                title="Archive"
                size={22}
                fill="var(--primary-gray)"
                onClick={() => openStatusConfirm(row, 'archive')}
              />
            )}
          </div>
        );
      }
    }
  ];

  const filters = () => (
    <Form fluid className="form-of-filters-set-up">
      <MyInput
        width={220}
        fieldName="search"
        fieldType="text"
        record={filterDraft}
        setRecord={setFilterDraft}
        showLabel={false}
        placeholder="Search by name or code"
      />
      <MyInput
        width={160}
        fieldName="status"
        fieldType="select"
        selectData={statusFilterOptions}
        selectDataLabel="label"
        selectDataValue="value"
        record={filterDraft}
        setRecord={setFilterDraft}
        showLabel={false}
        searchable={false}
      />
      <MyButton color="var(--deep-blue)" onClick={handleSearch} width="80px">
        Search
      </MyButton>
    </Form>
  );

  const direction = localStorage.getItem('direction') || 'LTR';
  const dir = direction === 'RTL' ? 'rtl' : 'ltr';

  return (
    <Panel dir={dir}>
      <MyTable
        data={data?.data ?? []}
        totalCount={data?.totalCount ?? 0}
        loading={isFetching}
        columns={tableColumns}
        rowClassName={isSelected}
        onRowClick={rowData => setSelected(rowData)}
        filters={filters()}
        page={paginationParams.page}
        rowsPerPage={paginationParams.size}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        sortColumn={sortColumn}
        sortType={sortType}
        onSortChange={handleSortChange}
        tableButtons={
          <div className="container-of-add-new-button">
            <MyButton
              prefixIcon={() => <AddOutlineIcon />}
              color="var(--deep-blue)"
              onClick={handleNew}
              width="109px"
            >
              Add New
            </MyButton>
          </div>
        }
      />

      <AddEditDocument
        open={openAddEdit}
        setOpen={setOpenAddEdit}
        document={selected}
        onSaved={handleAfterSave}
      />

      <DocumentVersionsModal
        open={openVersions}
        setOpen={setOpenVersions}
        document={selected}
      />

      <DeletionConfirmationModal
        open={openConfirmStatus}
        setOpen={setOpenConfirmStatus}
        itemToDelete="document"
        actionType={statusAction}
        actionButtonFunction={handleUpdateStatus}
      />
    </Panel>
  );
};

export default DocumentManagement;
