import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import MyTable from '@/components/MyTable';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import MyModal from '@/components/MyModal/MyModal';
import MyButton from '@/components/MyButton/MyButton';
import { notify } from '@/utils/uiReducerActions';
import { formatEnumString } from '@/utils';
import { IconButton, Tooltip, Whisper } from 'rsuite';
import { useEnumOptions } from '@/services/enumsApi';
import { MdLink, MdVisibility } from 'react-icons/md';
import LinkServices, { ServiceLite } from './LinkServices';
import SelectedServicesPreview from './SelectedServicesPreview';
import { useGetServicesQuery } from '@/services/setup/serviceService';
import {
  useGetAllCdtQuery,
  useImportCdtMutation,
  type CdtImportResult,
  type CdtConflict
} from '@/services/setup/cdtCodeService';
import CodesExcelCsvImportModal from '@/components/CodesExcelCsvImportModal/CodesExcelCsvImportModal';

const CDTSetup: React.FC = () => {
  const dispatch = useDispatch();

  // Tenant / facility context (from localStorage)
  const tenant = JSON.parse(localStorage.getItem('tenant') || 'null');
  const selectedFacility = tenant?.selectedFacility || null;
  const facilityId: number | undefined = selectedFacility?.id;

  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 15,
    sort: 'id,asc'
  });

  // Header filters: draft values typed in the inputs, applied on Enter / select change.
  // Everything is sent to one endpoint and combined with AND.
  const emptyHeaderFilters = { code: '', cdtClass: '', description: '' };
  type HeaderFilterField = keyof typeof emptyHeaderFilters;
  const [headerFilters, setHeaderFilters] = useState(emptyHeaderFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyHeaderFilters);
  // 'all' sends no isActive param
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | 'all'>('active');
  const activeFilter = statusFilter === 'all' ? undefined : statusFilter === 'active';

  // Enum options for CDT Class
  const cdtClassOptions = useEnumOptions('CdtClass');

  const { data: cdtListResponse, isFetching, refetch } = useGetAllCdtQuery({
    ...paginationParams,
    ...appliedFilters,
    isActive: activeFilter
  });

  const totalCount = cdtListResponse?.totalCount ?? 0;
  const tableData = useMemo(() => cdtListResponse?.data ?? [], [cdtListResponse?.data]);

  // ----------------------------------------
  // Page shell (title)
  // ----------------------------------------
  useEffect(() => {
    dispatch(setPageCode('CDT'));
    dispatch(setDivContent('CDT Procedures List'));
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch]);

  const handlePageChange = (_: unknown, newPage: number) => {
    setPaginationParams(prev => ({ ...prev, page: newPage }));
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSize = parseInt(event.target.value, 10);
    setPaginationParams(prev => ({ ...prev, size: newSize, page: 0 }));
  };

  // Applying one header filter also applies whatever is typed in the others
  const applyHeaderFilter = (field: HeaderFilterField, value: string) => {
    const next = { ...headerFilters, [field]: value };
    setHeaderFilters(next);
    setAppliedFilters(next);
    setPaginationParams(prev => ({ ...prev, page: 0 }));
  };

  const headerSearch = (field: HeaderFilterField, placeholder?: string) => ({
    searchable: true,
    searchPlaceholder: placeholder,
    searchValue: headerFilters[field],
    onSearchChange: (value: string) => setHeaderFilters(prev => ({ ...prev, [field]: value })),
    onSearchSubmit: (value?: string) => applyHeaderFilter(field, value ?? headerFilters[field])
  });

  // Changing the status filter starts again from the first page
  useEffect(() => {
    setPaginationParams(prev => ({ ...prev, page: 0 }));
  }, [statusFilter]);

  // Reload the list with the current filters after an import
  const refreshAfterMutation = async () => {
    await refetch();
  };

  const [importCdt, { isLoading: isImporting }] = useImportCdtMutation();

  const [conflicts, setConflicts] = useState<CdtConflict[] | null>(null);
  const [conflictModalOpen, setConflictModalOpen] = useState(false);
  const [lastUploadedFile, setLastUploadedFile] = useState<File | null>(null);
  const [conflictsPage, setConflictsPage] = useState(0);
  const [conflictsPageSize, setConflictsPageSize] = useState(10);

  const pagedConflicts = conflicts
    ? conflicts.slice(
        conflictsPage * conflictsPageSize,
        conflictsPage * conflictsPageSize + conflictsPageSize
      )
    : [];

  const handleImportFile = async (file: File) => {
    try {
      const res: CdtImportResult = await importCdt({ file }).unwrap();

      if (res.conflicts?.length) {
        setLastUploadedFile(file);
        setConflicts(res.conflicts);
        setConflictsPage(0);
        setConflictModalOpen(true);
        dispatch(
          notify({
            msg: `Found ${res.conflicts.length} conflict(s). You can replace or close.`,
            sev: 'warning'
          })
        );
      } else {
        dispatch(
          notify({
            msg: `Imported successfully. Inserted ${res.inserted}${
              res.updated ? `, Updated ${res.updated}` : ''
            }.`,
            sev: 'success'
          })
        );
        await refreshAfterMutation();
      }
    } catch (error: any) {
      const detail: string = error?.data?.detail ?? '';
      const innerTitle = detail.match(/title='([^']+)'/)?.[1];
      const msg = innerTitle || error?.data?.title || 'Error importing CDT file';
      dispatch(notify({ msg, sev: 'error' }));
    }
  };

  const handleReplaceAll = async () => {
    if (!lastUploadedFile) return;

    try {
      const res: CdtImportResult = await importCdt({
        file: lastUploadedFile,
        overwrite: true
      }).unwrap();
      setConflictModalOpen(false);
      setConflicts(null);
      setLastUploadedFile(null);

      dispatch(
        notify({
          msg: `Re-imported with overwrite. Inserted ${res.inserted}${
            res.updated ? `, Updated ${res.updated}` : ''
          }.`,
          sev: 'success'
        })
      );
      await refreshAfterMutation();
    } catch (error: any) {
      dispatch(
        notify({
          msg: error?.data?.detail || 'Overwrite failed',
          sev: 'error'
        })
      );
    }
  };
  const [openCodesImportModal, setOpenCodesImportModal] = useState(false);

  // ----------------------------------------
  // Services picker state (link Services to CDT rows)
  // ----------------------------------------
  const [servicesPager, setServicesPager] = useState({ page: 0, size: 15, sort: 'id,asc' });
  const { data: servicesPage, isFetching: isFetchingServices } = useGetServicesQuery(
    { facilityId, page: servicesPager.page, size: servicesPager.size, sort: servicesPager.sort },
    { skip: !facilityId }
  );
  const servicesTotalCount = servicesPage?.totalCount ?? 0;
  const servicesTableData = servicesPage?.data ?? [];

  const servicesForPicker: ServiceLite[] = useMemo(() => {
    return (servicesTableData ?? []).map((s: any) => ({
      id: s.id,
      name: s.name,
      code: s.code,
      category: s.category ?? null,
      isActive: s.isActive ?? true,
      abbreviation: s.abbreviation ?? null,
      price: s.price ?? null,
      currency: s.currency ?? null
    }));
  }, [servicesTableData]);

  const handleServicesPageChange = useCallback((_: unknown, newPage: number) => {
    setServicesPager(prev => ({ ...prev, page: newPage }));
  }, []);

  const handleServicesRowsPerPageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setServicesPager(prev => ({ ...prev, size: parseInt(e.target.value, 10), page: 0 }));
  }, []);

  const [openServicesPicker, setOpenServicesPicker] = useState(false);
  const [selectedCdtRow, setSelectedCdtRow] = useState<any | null>(null);
  const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>([]);

  const handleLinkServicesConfirmed = (ids: number[]) => {
    dispatch(
      notify({
        msg: `Linked ${ids.length} service(s) to CDT ${selectedCdtRow?.code || ''}`,
        sev: 'success'
      })
    );
  };

  const [openSelectedPreview, setOpenSelectedPreview] = useState(false);

  // ----------------------------------------
  // Main CDT table columns
  // ----------------------------------------
  const columns = [
    {
      key: 'code',
      title: 'Code',
      width: 140,
      ...headerSearch('code', 'Search code'),
      render: (row: any) => row?.code ?? ''
    },
    {
      key: 'cdtClass',
      title: 'Class',
      width: 200,
      ...headerSearch('cdtClass'),
      searchType: 'select' as const,
      searchOptions: [{ label: 'All', value: '' }, ...(cdtClassOptions ?? [])],
      render: (row: any) => (row?.cdtClass ? formatEnumString(row?.cdtClass) : '')
    },
    {
      key: 'description',
      title: 'Description',
      width: 320,
      ...headerSearch('description', 'Search description'),
      render: (row: any) => row?.description ?? ''
    },
    {
      key: 'isActive',
      title: 'Status',
      width: 120,
      searchable: true,
      searchType: 'select' as const,
      searchOptions: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
        { label: 'All', value: 'all' }
      ],
      searchValue: statusFilter,
      onSearchChange: (value: string) => setStatusFilter(value as 'active' | 'inactive' | 'all'),
      render: (row: any) => (
        <MyBadgeStatus
          contant={row?.isActive ? 'Active' : 'Inactive'}
          color={row?.isActive ? '#415be7' : '#b1acacff'}
        />
      )
    },
    {
      key: 'lastUpdated',
      title: 'Last Updated',
      render: (row: any) => {
        if (!row?.lastUpdated) return '';
        const d = new Date(row.lastUpdated);
        return d.toLocaleDateString();
      }
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (row: any) => (
        <>
          <Whisper placement="top" trigger="hover" speaker={<Tooltip>Link Services</Tooltip>}>
            <IconButton
              appearance="subtle"
              icon={<MdLink size={18} />}
              style={{ color: '#777c87ff' }}
              onClick={e => {
                e.stopPropagation();
                setSelectedCdtRow(row);
                setSelectedServiceIds([]);
                setOpenServicesPicker(true);
              }}
            />
          </Whisper>

          {/* View Linked Services */}
          <Whisper
            placement="top"
            trigger="hover"
            speaker={<Tooltip>View linked services</Tooltip>}
          >
            <IconButton
              appearance="subtle"
              icon={<MdVisibility size={18} />}
              style={{ color: '#777c87ff' }}
              onClick={e => {
                e.stopPropagation();
                setSelectedCdtRow(row);
                setOpenSelectedPreview(true);
              }}
            />
          </Whisper>
        </>
      ),
      align: 'right' as const
    }
  ];

  // ----------------------------------------
  // Conflict table columns
  // ----------------------------------------
  const conflictColumns = [
    { key: 'code', title: 'Code', render: (row: CdtConflict) => row.code },
    {
      key: 'incomingDescription',
      title: 'Incoming Description',
      render: (row: CdtConflict) => row.incomingDescription
    },
    {
      key: 'incomingClass',
      title: 'Incoming Class',
      render: (row: CdtConflict) => (row.incomingClass ? formatEnumString(row.incomingClass) : '')
    },
    {
      key: 'incomingIsActive',
      title: 'Incoming Active',
      render: (row: CdtConflict) => String(row.incomingIsActive)
    },
    {
      key: 'existingDescription',
      title: 'Existing Description',
      render: (row: CdtConflict) => row.existingDescription
    },
    {
      key: 'existingClass',
      title: 'Existing Class',
      render: (row: CdtConflict) => (row.existingClass ? formatEnumString(row.existingClass) : '')
    },
    {
      key: 'existingIsActive',
      title: 'Existing Active',
      render: (row: CdtConflict) => String(row.existingIsActive)
    }
  ];

  // ----------------------------------------
  // Render
  // ----------------------------------------

  // Direction handling for RTL/LTR
  const direction = localStorage.getItem('direction') || 'LTR';
  const isRTL = direction === 'RTL';

  const dir = isRTL ? 'rtl' : 'ltr';

  return (
    <div dir={dir}>
      {/* Main CDT table */}
      <MyTable
        data={tableData}
        columns={columns}
        tableButtons={
          <div className="container-of-add-new-button">
            <MyButton onClick={() => setOpenCodesImportModal(true)}>
              Import Codes (Excel / CSV)
            </MyButton>
          </div>
        }
        totalCount={totalCount}
        loading={isFetching}
        page={paginationParams.page}
        rowsPerPage={paginationParams.size}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
      />

      <CodesExcelCsvImportModal
        open={openCodesImportModal}
        setOpen={setOpenCodesImportModal}
        title="CDT Codes Import"
        excelTemplateUrl="/templates/CDT_Codes.xlsx"
        excelTemplateFileName="CDT_Codes.xlsx"
        onImport={handleImportFile}
      />
      {/* Import conflicts modal */}
      <MyModal
        open={conflictModalOpen}
        setOpen={setConflictModalOpen}
        title="CDT Import Conflicts"
        size="70vw"
        pagesCount={1}
        hideActionBtn={true}
        content={
          <div dir={dir}>
            {conflicts && conflicts.length > 0 ? (
              <MyTable
                data={pagedConflicts}
                columns={conflictColumns}
                totalCount={conflicts.length}
                loading={false}
                page={conflictsPage}
                rowsPerPage={conflictsPageSize}
                onPageChange={(_, newPage: number) => setConflictsPage(newPage)}
                onRowsPerPageChange={(e: any) => {
                  setConflictsPageSize(Number(e.target?.value));
                  setConflictsPage(0);
                }}
              />
            ) : (
              <p>No conflicts.</p>
            )}
          </div>
        }
        footerButtons={
          <MyButton onClick={handleReplaceAll} disabled={!lastUploadedFile} loading={isImporting}>
            Replace All
          </MyButton>
        }
      />

      {/* Link Services modal */}
      <LinkServices
        open={openServicesPicker}
        setOpen={setOpenServicesPicker}
        cdtId={selectedCdtRow?.id}
        data={servicesForPicker}
        loading={isFetchingServices}
        totalCount={servicesTotalCount}
        page={servicesPager.page}
        rowsPerPage={servicesPager.size}
        onPageChange={handleServicesPageChange}
        onRowsPerPageChange={handleServicesRowsPerPageChange}
        selectedIds={selectedServiceIds}
        setSelectedIds={setSelectedServiceIds}
        onConfirm={handleLinkServicesConfirmed}
      />

      {/* Selected services preview for the chosen CDT row */}
      {selectedCdtRow?.id ? (
        <SelectedServicesPreview
          open={openSelectedPreview}
          setOpen={setOpenSelectedPreview}
          cdtId={selectedCdtRow.id}
        />
      ) : null}
    </div>
  );
};

export default CDTSetup;
