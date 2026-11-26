import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import MyTable from '@/components/MyTable';
import MyModal from '@/components/MyModal/MyModal';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { MdModeEdit } from 'react-icons/md';
import {
  useGetAllLoincQuery,
  useCreateLoincMutation,
  useUpdateLoincMutation,
  useImportLoincMutation,
  type ImportResult,
  type Conflict
} from '@/services/setup/loincCodeService';
import MyButton from '@/components/MyButton/MyButton';
import { notify } from '@/utils/uiReducerActions';
import { useEnumOptions } from '@/services/enumsApi';
import { formatEnumString } from '@/utils';
import CodesExcelCsvImportModal from '@/components/CodesExcelCsvImportModal/CodesExcelCsvImportModal';
import AddLoincCode from './AddLoincCode';

const newLoincCode = { code: '', category: '', description: '' };

const LOINCSetup: React.FC = () => {
  const dispatch = useDispatch();

  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 15,
    sort: 'id,asc'
  });

  // Header filters: draft values typed in the inputs, applied on Enter / select change.
  // Everything is sent to one endpoint and combined with AND (LOINC codes have no active flag).
  const emptyHeaderFilters = { code: '', category: '', description: '' };
  type HeaderFilterField = keyof typeof emptyHeaderFilters;
  const [headerFilters, setHeaderFilters] = useState(emptyHeaderFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyHeaderFilters);

  // import modal state (conflicts)
  const [conflicts, setConflicts] = useState<Conflict[] | null>(null);
  const [conflictModalOpen, setConflictModalOpen] = useState(false);
  const [lastUploadedFile, setLastUploadedFile] = useState<File | null>(null);
  const [conflictsPage, setConflictsPage] = useState(0);
  const [conflictsPageSize, setConflictsPageSize] = useState(10);

  // enum options
  const loincCategoryOptions = useEnumOptions('LoincCategory');

  const { data: loincListResponse, isFetching, refetch } = useGetAllLoincQuery({
    ...paginationParams,
    ...appliedFilters
  });

  const totalCount = loincListResponse?.totalCount ?? 0;
  const tableData = useMemo(() => loincListResponse?.data ?? [], [loincListResponse?.data]);
  const pageIndex = paginationParams.page;
  const rowsPerPage = paginationParams.size;

  // set page header
  useEffect(() => {
    dispatch(setPageCode('LOINC'));
    dispatch(setDivContent('LOINC List'));
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

  // import LOINC CSV mutation
  const [importLoinc, { isLoading: isImporting }] = useImportLoincMutation();
  const handleImportFile = async (file: File) => {
    try {
      const res: ImportResult = await importLoinc({ file }).unwrap();

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

        refetch();
      }
    } catch (error: any) {
      dispatch(
        notify({
          msg: error?.data?.detail || 'Error importing LOINC file',
          sev: 'error'
        })
      );
    }
  };

  // overwrite all conflicts and refresh accordingly
  const handleReplaceAll = async () => {
    if (!lastUploadedFile) return;
    try {
      const res: ImportResult = await importLoinc({
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

      refetch();
    } catch (error: any) {
      dispatch(
        notify({
          msg: error?.data?.detail || 'Overwrite failed',
          sev: 'error'
        })
      );
    }
  };

  // add / edit LOINC code
  const [createLoinc] = useCreateLoincMutation();
  const [updateLoinc] = useUpdateLoincMutation();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [loincCode, setLoincCode] = useState<any>({ ...newLoincCode });
  const [width, setWidth] = useState<number>(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleNew = () => {
    setLoincCode({ ...newLoincCode });
    setAddModalOpen(true);
  };

  const handleEdit = (row: any) => {
    setLoincCode({ id: row.id, code: row.code, category: row.category, description: row.description });
    setAddModalOpen(true);
  };

  const handleSave = async () => {
    const code = loincCode.code?.trim();
    const description = loincCode.description?.trim();
    if (!code || !loincCode.category || !description) {
      dispatch(notify({ msg: 'Code, category and description are required', sev: 'warning' }));
      return;
    }
    try {
      const isEdit = !!loincCode.id;
      if (isEdit) {
        await updateLoinc({ id: loincCode.id, code, category: loincCode.category, description }).unwrap();
      } else {
        await createLoinc({ code, category: loincCode.category, description }).unwrap();
      }
      setAddModalOpen(false);
      dispatch(
        notify({
          msg: isEdit ? 'LOINC code updated successfully' : 'LOINC code added successfully',
          sev: 'success'
        })
      );

      refetch();
    } catch (error: any) {
      dispatch(
        notify({
          msg: error?.data?.detail || error?.data?.message || 'Error saving LOINC code',
          sev: 'error'
        })
      );
    }
  };

  // table columns
  const columns = [
    {
      key: 'code',
      title: 'Code',
      width: 140,
      ...headerSearch('code', 'Search code'),
      render: (row: any) => row?.code ?? ''
    },
    {
      key: 'category',
      title: 'Category',
      width: 200,
      ...headerSearch('category'),
      searchType: 'select' as const,
      searchOptions: [{ label: 'All', value: '' }, ...(loincCategoryOptions ?? [])],
      render: (row: any) => (row?.category ? formatEnumString(row?.category) : '')
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
    },
    {
      key: 'icons',
      title: '',
      render: (row: any) => (
        <div className="container-of-icons">
          <MdModeEdit
            className="icons-style"
            title="Edit"
            size={24}
            fill="var(--primary-gray)"
            onClick={() => handleEdit(row)}
          />
        </div>
      )
    }
  ];

  // conflict modal columns
  const conflictColumns = [
    { key: 'code', title: 'Code', render: (row: Conflict) => row.code },
    {
      key: 'incomingDescription',
      title: 'Incoming Description',
      render: (row: Conflict) => row.incomingDescription
    },
    {
      key: 'incomingCategory',
      title: 'Incoming Category',
      render: (row: Conflict) =>
        row.incomingCategory ? formatEnumString(row.incomingCategory) : ''
    },
    {
      key: 'existingDescription',
      title: 'Existing Description',
      render: (row: Conflict) => row.existingDescription
    },
    {
      key: 'existingCategory',
      title: 'Existing Category',
      render: (row: Conflict) =>
        row.existingCategory ? formatEnumString(row.existingCategory) : ''
    }
  ];

  const pagedConflicts =
    conflicts?.slice(
      conflictsPage * conflictsPageSize,
      conflictsPage * conflictsPageSize + conflictsPageSize
    ) || [];

  const [openCodesImportModal, setOpenCodesImportModal] = useState(false);

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
            <div style={{ display: 'flex', gap: 10 }}>
              <MyButton
                prefixIcon={() => <AddOutlineIcon />}
                color="var(--deep-blue)"
                onClick={handleNew}
                width="109px"
              >
                Add New
              </MyButton>
              <MyButton onClick={() => setOpenCodesImportModal(true)}>
                Import LOINC (Excel / CSV)
              </MyButton>
            </div>
          </div>
        }
        totalCount={totalCount}
        loading={isFetching}
        page={pageIndex}
        rowsPerPage={rowsPerPage}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
      />

      {/* Add / edit LOINC code */}
      <AddLoincCode
        open={addModalOpen}
        setOpen={setAddModalOpen}
        loincCode={loincCode}
        setLoincCode={setLoincCode}
        handleSave={handleSave}
        width={width}
      />

      {/* Import modal (Excel/CSV) */}
      <CodesExcelCsvImportModal
        open={openCodesImportModal}
        setOpen={setOpenCodesImportModal}
        title="LOINC Codes Import"
        excelTemplateUrl="/templates/LOINC_Code.xlsx"
        excelTemplateFileName="LOINC_Code.xlsx"
        onImport={handleImportFile}
      />

      {/* Conflicts modal */}
      <MyModal
        open={conflictModalOpen}
        setOpen={setConflictModalOpen}
        title="LOINC Import Conflicts"
        size="70vw"
        pagesCount={1}
        hideActionBtn={true}
        content={
          <div>
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

export default LOINCSetup;
