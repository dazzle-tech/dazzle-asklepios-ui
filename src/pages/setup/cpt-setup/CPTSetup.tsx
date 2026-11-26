import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import MyTable from '@/components/MyTable';
import MyModal from '@/components/MyModal/MyModal';
import {
  useGetAllCptQuery,
  useImportCptMutation,
  type ImportResult,
  type Conflict
} from '@/services/setup/cptCodeService';
import MyButton from '@/components/MyButton/MyButton';
import { notify } from '@/utils/uiReducerActions';
import CodesExcelCsvImportModal from '@/components/CodesExcelCsvImportModal/CodesExcelCsvImportModal';

const CPTSetup: React.FC = () => {
  const dispatch = useDispatch();

  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 15,
    sort: 'id,asc'
  });

  // Header filters: draft values typed in the inputs, applied on Enter.
  // Everything is sent to one endpoint and combined with AND (CPT codes have no active flag).
  const emptyHeaderFilters = { code: '', serviceCategory: '', mainCategory: '', description: '' };
  type HeaderFilterField = keyof typeof emptyHeaderFilters;
  const [headerFilters, setHeaderFilters] = useState(emptyHeaderFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyHeaderFilters);

  // Import modal (conflicts)
  const [conflicts, setConflicts] = useState<Conflict[] | null>(null);
  const [conflictModalOpen, setConflictModalOpen] = useState(false);
  const [lastUploadedFile, setLastUploadedFile] = useState<File | null>(null);
  const [conflictsPage, setConflictsPage] = useState(0);
  const [conflictsPageSize, setConflictsPageSize] = useState(10);

  // Main list
  const { data: cptListResponse, isFetching, refetch } = useGetAllCptQuery({
    ...paginationParams,
    ...appliedFilters
  });

  const totalCount = cptListResponse?.totalCount ?? 0;
  const tableData = useMemo(() => cptListResponse?.data ?? [], [cptListResponse?.data]);

  // Header
  useEffect(() => {
    dispatch(setPageCode('CPT'));
    dispatch(setDivContent('CPT Procedures List'));
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch]);

  // Reload the list with the current filters (after imports, also from other screens)
  useEffect(() => {
    const onAdded = () => refetch();
    window.addEventListener('cpt:added', onAdded);
    return () => window.removeEventListener('cpt:added', onAdded);
  }, [refetch]);

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

  const [importCpt, { isLoading: isImporting }] = useImportCptMutation();

  const handleImportFile = async (file: File) => {
    try {
      const res: ImportResult = await importCpt({ file }).unwrap();

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

        const newItems: any[] = (res as any)?.items || (res as any)?.insertedItems || [];
        window.dispatchEvent(new CustomEvent('cpt:added', { detail: { items: newItems } }));
      }
    } catch (error: any) {
      dispatch(
        notify({
          msg: error?.data?.detail || 'Error importing CPT file',
          sev: 'error'
        })
      );
    }
  };

  // Overwrite
  const handleReplaceAll = async () => {
    if (!lastUploadedFile) return;
    try {
      const res: ImportResult = await importCpt({
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

      const newItems: any[] =
        (res as any)?.items || (res as any)?.insertedItems || (res as any)?.updatedItems || [];
      window.dispatchEvent(new CustomEvent('cpt:added', { detail: { items: newItems } }));
    } catch (error: any) {
      dispatch(
        notify({
          msg: error?.data?.detail || 'Overwrite failed',
          sev: 'error'
        })
      );
    }
  };

  // Table columns
  const columns = [
    {
      key: 'code',
      title: 'Code',
      width: 130,
      ...headerSearch('code', 'Search code'),
      render: (row: any) => row?.code ?? ''
    },
    {
      key: 'codeCategory',
      title: 'Code Category',
      render: (row: any) => row?.codeCategory ?? ''
    },
    {
      key: 'serviceCategory',
      title: 'Service Category',
      width: 180,
      ...headerSearch('serviceCategory', 'Search'),
      render: (row: any) => row?.serviceCategory ?? ''
    },
    {
      key: 'mainCategory',
      title: 'Main Category',
      width: 180,
      ...headerSearch('mainCategory', 'Search'),
      render: (row: any) => row?.mainCategory ?? ''
    },
    {
      key: 'description',
      title: 'Description',
      width: 320,
      ...headerSearch('description', 'Search description'),
      render: (row: any) => row?.description ?? ''
    },
    {
      key: 'lastUpdated',
      title: 'Last Updated',
      render: (row: any) => {
        if (!row?.lastUpdated) return '';
        const d = new Date(row.lastUpdated);
        return d.toLocaleDateString();
      }
    }
  ];

  // Conflict columns
  const conflictColumns = [
    { key: 'code', title: 'Code', render: (row: Conflict) => row.code },
    {
      key: 'incomingDescription',
      title: 'Incoming Description',
      render: (row: Conflict) => row.incomingDescription
    },
    {
      key: 'incomingCodeCategory',
      title: 'Incoming Code Category',
      render: (row: Conflict) => row.incomingCodeCategory
    },
    {
      key: 'incomingServiceCategory',
      title: 'Incoming Service Category',
      render: (row: Conflict) => row.incomingServiceCategory
    },
    {
      key: 'incomingMainCategory',
      title: 'Incoming Main Category',
      render: (row: Conflict) => row.incomingMainCategory
    },
    {
      key: 'existingDescription',
      title: 'Existing Description',
      render: (row: Conflict) => row.existingDescription
    },
    {
      key: 'existingCodeCategory',
      title: 'Existing Code Category',
      render: (row: Conflict) => row.existingCodeCategory
    },
    {
      key: 'existingServiceCategory',
      title: 'Existing Service Category',
      render: (row: Conflict) => row.existingServiceCategory
    },
    {
      key: 'existingMainCategory',
      title: 'Existing Main Category',
      render: (row: Conflict) => row.existingMainCategory
    }
  ];

  // Paged conflicts
  const pagedConflicts =
    conflicts?.slice(
      conflictsPage * conflictsPageSize,
      conflictsPage * conflictsPageSize + conflictsPageSize
    ) || [];

  const [openCodesImportModal, setOpenCodesImportModal] = useState(false);

  const downloadPublicFile = (url: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = `${url}?v=${Date.now()}`;
    link.download = fileName;
    link.click();
  };

  // Direction handling for RTL/LTR
  const direction = localStorage.getItem('direction') || 'LTR';
  const isRTL = direction === 'RTL';

  const dir = isRTL ? 'rtl' : 'ltr';

  return (
    <div dir={dir}>
      <MyTable
        data={tableData}
        columns={columns}
        tableButtons={
          <div className="container-of-add-new-button">
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <MyButton
                appearance="ghost"
                onClick={() => downloadPublicFile('/templates/CPT_Code.xlsx', 'CPT_Code.xlsx')}
              >
                Download Template
              </MyButton>
              <MyButton
                appearance="ghost"
                onClick={() =>
                  downloadPublicFile('/templates/CPT_Code_Sample.xlsx', 'CPT_Code_Sample.xlsx')
                }
              >
                Download Sample
              </MyButton>
              <MyButton onClick={() => setOpenCodesImportModal(true)}>
                Import CPT (Excel / CSV)
              </MyButton>
            </div>
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
        title="CPT Codes Import"
        excelTemplateUrl="/templates/CPT_Code.xlsx"
        excelTemplateFileName="CPT_Code.xlsx"
        onImport={handleImportFile}
      />
      <MyModal
        open={conflictModalOpen}
        setOpen={setConflictModalOpen}
        title="CPT Import Conflicts"
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
    </div>
  );
};

export default CPTSetup;
