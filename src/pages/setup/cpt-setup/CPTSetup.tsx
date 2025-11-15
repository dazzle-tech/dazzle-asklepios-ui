import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useDispatch } from "react-redux";
import { setDivContent, setPageCode } from "@/reducers/divSlice";
import MyTable from "@/components/MyTable";
import MyModal from "@/components/MyModal/MyModal";
import {
  useGetAllCptQuery,
  useImportCptMutation,
  useLazyGetCptByCategoryQuery,
  useLazyGetCptByCodeQuery,
  useLazyGetCptByDescriptionQuery,
  type ImportResult,
  type Conflict,
} from "@/services/setup/cptCodeService";
import MyButton from "@/components/MyButton/MyButton";
import { notify } from "@/utils/uiReducerActions";
import { extractPaginationFromLink } from "@/utils/paginationHelper";
import { Form } from "rsuite";
import MyInput from "@/components/MyInput";
import { useEnumOptions } from "@/services/enumsApi";
import { formatEnumString } from "@/utils";
import CodesExcelCsvImportModal from "@/components/CodesExcelCsvImportModal/CodesExcelCsvImportModal";

const CPTSetup: React.FC = () => {
  const dispatch = useDispatch();

  // Unfiltered pagination (Link header)
  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 15,
    sort: "id,asc",
    timestamp: Date.now(),
  });

  // Filtered pagination (client-driven)
  const [filterPagination, setFilterPagination] = useState({
    page: 0,
    size: 15,
    sort: "id,desc",
  });

  // A nonce to bust cache for filtered queries
  const [filterTs, setFilterTs] = useState<number>(Date.now());

  // Filter state
  const [recordOfFilter, setRecordOfFilter] = useState<{ filter: string; value: any }>({
    filter: "",
    value: "",
  });
  const [isFiltered, setIsFiltered] = useState(false);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [filteredTotal, setFilteredTotal] = useState<number>(0);
  const [filteredLinks, setFilteredLinks] = useState<any | undefined>(undefined);

  // Lazy queries
  const [fetchByCategory] = useLazyGetCptByCategoryQuery();
  const [fetchByCode] = useLazyGetCptByCodeQuery();
  const [fetchByDescription] = useLazyGetCptByDescriptionQuery();

  // Import modal (conflicts)
  const [conflicts, setConflicts] = useState<Conflict[] | null>(null);
  const [conflictModalOpen, setConflictModalOpen] = useState(false);
  const [lastUploadedFile, setLastUploadedFile] = useState<File | null>(null);
  const [conflictsPage, setConflictsPage] = useState(0);
  const [conflictsPageSize, setConflictsPageSize] = useState(10);

  // Enums
  const cptCategoryOptions = useEnumOptions("CptCategory");

  // Main list
  const { data: cptListResponse, isFetching, refetch } = useGetAllCptQuery(paginationParams);

  // Derived values
  const totalCount = useMemo(
    () => (isFiltered ? filteredTotal : cptListResponse?.totalCount ?? 0),
    [isFiltered, filteredTotal, cptListResponse?.totalCount]
  );
  const links = (isFiltered ? filteredLinks : cptListResponse?.links) || {};
  const tableData = useMemo(
    () => (isFiltered ? filteredData : cptListResponse?.data ?? []),
    [isFiltered, filteredData, cptListResponse?.data]
  );

  // Header
  useEffect(() => {
    dispatch(setPageCode("CPT"));
    dispatch(setDivContent("CPT Diagnosis List"));
    return () => {
      dispatch(setPageCode(""));
      dispatch(setDivContent(""));
    };
  }, [dispatch]);

  // Reset to unfiltered
  const resetToUnfiltered = () => {
    setIsFiltered(false);
    setFilteredData([]);
    setFilteredTotal(0);
    setFilteredLinks(undefined);
    setFilterPagination((prev) => ({ ...prev, page: 0, sort: prev.sort || "id,desc" }));
    setPaginationParams((prev) => ({ ...prev, page: 0, sort: "id,asc", timestamp: Date.now() }));
    refetch();
  };

  // Sort helper to show newest first
  const nextFilteredSort = (current?: string) => {
    if (!current) return "id,desc";
    return current.toLowerCase().startsWith("id,asc") ? "id,desc" : current;
  };

  // Check row matches current filter
  const matchesCurrentFilter = useCallback(
    (row: any) => {
      const f = recordOfFilter.filter;
      const v = recordOfFilter.value;
      if (!f || v === undefined || v === null || v === "") return true;
      if (f === "category") return String(row?.category ?? "").toUpperCase() === String(v).toUpperCase();
      if (f === "code") return String(row?.code ?? "").toLowerCase().includes(String(v).toLowerCase());
      if (f === "description") return String(row?.description ?? "").toLowerCase().includes(String(v).toLowerCase());
      return true;
    },
    [recordOfFilter]
  );

  // Optimistic prepend while filtered
  const applyImmediatePrepend = useCallback(
    (items: any[]) => {
      if (!isFiltered) return false;
      const visible = (items || []).filter(matchesCurrentFilter);
      if (visible.length === 0) return false;
      const sort = nextFilteredSort(filterPagination.sort);
      setFilterPagination((p) => ({ ...p, page: 0, sort }));
      setFilteredData((prev) => [...visible, ...prev]);
      setFilteredTotal((prev) => prev + visible.length);
      return true;
    },
    [isFiltered, matchesCurrentFilter, filterPagination.sort]
  );

  // Global event to refresh after external add
  useEffect(() => {
    const onAdded = async (e: any) => {
      const raw = e?.detail;
      const items = Array.isArray(raw?.items) ? raw.items : raw ? [raw.item ?? raw] : [];
      const clean = items.filter(Boolean);
      applyImmediatePrepend(clean);
      if (isFiltered) {
        const sort = nextFilteredSort(filterPagination.sort);
        setFilterTs(Date.now());
        await handleFilterChange(
          recordOfFilter.filter,
          recordOfFilter.value,
          0,
          filterPagination.size,
          sort,
          true
        );
      } else {
        setPaginationParams((prev) => ({ ...prev, page: 0, timestamp: Date.now() }));
        refetch();
      }
    };
    window.addEventListener("cpt:added", onAdded as any);
    return () => window.removeEventListener("cpt:added", onAdded as any);
  }, [
    isFiltered,
    filterPagination.size,
    filterPagination.sort,
    recordOfFilter.filter,
    recordOfFilter.value,
    applyImmediatePrepend,
    refetch,
  ]);

  // Page change
  const handlePageChange = (_: unknown, newPage: number) => {
    if (isFiltered) {
      handleFilterChange(
        recordOfFilter.filter,
        recordOfFilter.value,
        newPage,
        filterPagination.size,
        filterPagination.sort
      );
      return;
    }
    const currentPage = paginationParams.page;
    let targetLink: string | null | undefined = null;
    if (newPage > currentPage && links.next) targetLink = links.next;
    else if (newPage < currentPage && links.prev) targetLink = links.prev;
    else if (newPage === 0 && links.first) targetLink = links.first;
    else if (newPage > currentPage + 1 && links.last) targetLink = links.last;
    if (targetLink) {
      const { page, size } = extractPaginationFromLink(targetLink);
      setPaginationParams((prev) => ({ ...prev, page, size, timestamp: Date.now() }));
    }
  };

  // Rows per page
  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSize = parseInt(event.target.value, 10);
    if (isFiltered) {
      setFilterPagination((prev) => ({ ...prev, size: newSize, page: 0 }));
      setFilterTs(Date.now());
      handleFilterChange(recordOfFilter.filter, recordOfFilter.value, 0, newSize, filterPagination.sort);
    } else {
      setPaginationParams((prev) => ({ ...prev, size: newSize, page: 0, timestamp: Date.now() }));
    }
  };

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
            sev: "warning",
          })
        );
      } else {
        dispatch(
          notify({
            msg: `Imported successfully. Inserted ${res.inserted}${res.updated ? `, Updated ${res.updated}` : ""}.`,
            sev: "success",
          })
        );

        const newItems: any[] = (res as any)?.items || (res as any)?.insertedItems || [];
        if (newItems.length) applyImmediatePrepend(newItems);
        window.dispatchEvent(new CustomEvent("cpt:added", { detail: { items: newItems } }));

        if (isFiltered) {
          const sort = nextFilteredSort(filterPagination.sort);
          setFilterPagination((prev) => ({ ...prev, page: 0, sort }));
          setFilterTs(Date.now());
          await handleFilterChange(
            recordOfFilter.filter,
            recordOfFilter.value,
            0,
            filterPagination.size,
            sort,
            true
          );
        } else {
          setPaginationParams((prev) => ({ ...prev, page: 0, timestamp: Date.now() }));
          refetch();
        }
      }
    } catch (error: any) {
      dispatch(
        notify({
          msg: error?.data?.detail || "Error importing CPT file",
          sev: "error",
        })
      );
    }
  };

  // Overwrite
  const handleReplaceAll = async () => {
    if (!lastUploadedFile) return;
    try {
      const res: ImportResult = await importCpt({ file: lastUploadedFile, overwrite: true }).unwrap();
      setConflictModalOpen(false);
      setConflicts(null);
      setLastUploadedFile(null);
      dispatch(
        notify({
          msg: `Re-imported with overwrite. Inserted ${res.inserted}${res.updated ? `, Updated ${res.updated}` : ""}.`,
          sev: "success",
        })
      );

      const newItems: any[] =
        (res as any)?.items || (res as any)?.insertedItems || (res as any)?.updatedItems || [];
      if (newItems.length) applyImmediatePrepend(newItems);
      window.dispatchEvent(new CustomEvent("cpt:added", { detail: { items: newItems } }));

      if (isFiltered) {
        const sort = nextFilteredSort(filterPagination.sort);
        setFilterPagination((prev) => ({ ...prev, page: 0, sort }));
        setFilterTs(Date.now());
        await handleFilterChange(
          recordOfFilter.filter,
          recordOfFilter.value,
          0,
          filterPagination.size,
          sort,
          true
        );
      } else {
        setPaginationParams((prev) => ({ ...prev, page: 0, timestamp: Date.now() }));
        refetch();
      }
    } catch (error: any) {
      dispatch(
        notify({
          msg: error?.data?.detail || "Overwrite failed",
          sev: "error",
        })
      );
    }
  };

  // Filter fields
  const filterFields = [
    { label: "Category", value: "category" },
    { label: "Code", value: "code" },
    { label: "Description", value: "description" },
  ];

  // Centralized filtered fetch (adds ts to bust cache)
  const runFilterQuery = async (
    fieldName: string,
    value: any,
    page = 0,
    size = filterPagination.size,
    sort = filterPagination.sort || paginationParams.sort,
    ts?: number
  ) => {
    if (!value) return undefined;
    const common = { page, size, sort, ts: ts ?? filterTs };
    if (fieldName === "category") {
      return await fetchByCategory({
        category: String(value).toUpperCase(),
        ...common,
      }).unwrap();
    } else if (fieldName === "code") {
      return await fetchByCode({
        code: value,
        ...common,
      }).unwrap();
    } else if (fieldName === "description") {
      return await fetchByDescription({
        description: value,
        ...common,
      }).unwrap();
    }
    return undefined;
  };

  // Apply or clear filter
  const handleFilterChange = async (
    fieldName: string,
    value: any,
    page = 0,
    size = filterPagination.size,
    sort = filterPagination.sort,
    silent = false
  ) => {
    if (!value) {
      resetToUnfiltered();
      if (!silent) refetch();
      return;
    }
    try {
      const resp = await runFilterQuery(fieldName, value, page, size, sort, Date.now());
      setFilteredData(resp?.data ?? []);
      setFilteredTotal(resp?.totalCount ?? 0);
      setFilteredLinks(resp?.links || {});
      setIsFiltered(true);
      setFilterPagination({ page, size, sort });
    } catch {
      resetToUnfiltered();
      if (!silent) refetch();
    }
  };

  // Auto reset when filter value cleared
  useEffect(() => {
    if (!recordOfFilter.value && isFiltered) {
      resetToUnfiltered();
    }
  }, [recordOfFilter.value, isFiltered]); // eslint-disable-line react-hooks/exhaustive-deps

  // Filters UI
  const filters = () => (
    <Form layout="inline" fluid>
      <MyInput
        selectDataValue="value"
        selectDataLabel="label"
        selectData={filterFields}
        fieldName="filter"
        fieldType="select"
        record={recordOfFilter}
        setRecord={(updated: any) => {
          setRecordOfFilter({ filter: updated.filter, value: "" });
        }}
        showLabel={false}
        placeholder="Select Filter"
        searchable={false}
        width="170px"
      />

      {recordOfFilter.filter === "category" ? (
        <MyInput
          width={300}
          fieldName="value"
          fieldLabel=""
          fieldType="select"
          selectData={cptCategoryOptions ?? []}
          selectDataLabel="label"
          selectDataValue="value"
          record={recordOfFilter}
          setRecord={setRecordOfFilter}
        />
      ) : (
        <MyInput
          fieldName="value"
          fieldType="text"
          record={recordOfFilter}
          setRecord={setRecordOfFilter}
          showLabel={false}
          placeholder={
            recordOfFilter.filter === "code"
              ? "Enter Code"
              : recordOfFilter.filter === "description"
              ? "Enter description"
              : "Enter value"
          }
          width={300}
        />
      )}

      <MyButton
        color="var(--deep-blue)"
        onClick={() => {
          if (!recordOfFilter.value) {
            resetToUnfiltered();
          } else {
            setFilterTs(Date.now());
            handleFilterChange(
              recordOfFilter.filter,
              recordOfFilter.value,
              0,
              filterPagination.size,
              filterPagination.sort || "id,desc"
            );
          }
        }}
        width="80px"
      >
        Search
      </MyButton>
    </Form>
  );

  // Table columns
  const columns = [
    { key: "code", title: "Code", render: (row: any) => row?.code ?? "" },
    {
      key: "category",
      title: "Category",
      render: (row: any) => (row?.category ? formatEnumString(row?.category) : ""),
    },
    { key: "description", title: "Description", render: (row: any) => row?.description ?? "" },
    {
      key: "lastUpdated",
      title: "Last Updated",
      render: (row: any) => {
        if (!row?.lastUpdated) return "";
        const d = new Date(row.lastUpdated);
        return d.toLocaleDateString();
      },
    },
  ];

  // Conflict columns
  const conflictColumns = [
    { key: "code", title: "Code", render: (row: Conflict) => row.code },
    {
      key: "incomingDescription",
      title: "Incoming Description",
      render: (row: Conflict) => row.incomingDescription,
    },
    {
      key: "incomingCategory",
      title: "Incoming Category",
      render: (row: Conflict) =>
        row.incomingCategory ? formatEnumString(row.incomingCategory) : "",
    },
    {
      key: "existingDescription",
      title: "Existing Description",
      render: (row: Conflict) => row.existingDescription,
    },
    {
      key: "existingCategory",
      title: "Existing Category",
      render: (row: Conflict) =>
        row.existingCategory ? formatEnumString(row.existingCategory) : "",
    },
  ];

  // Paged conflicts
  const pagedConflicts =
    conflicts?.slice(
      conflictsPage * conflictsPageSize,
      conflictsPage * conflictsPageSize + conflictsPageSize
    ) || [];

  const [openCodesImportModal, setOpenCodesImportModal] = useState(false);

  return (
    <>
      <MyTable
        data={tableData}
        columns={columns}
        filters={
          <div
            className="mb-3"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              justifyContent: "space-between",
              flexWrap: "wrap",
            }}
          >
            <div>{filters()}</div>

            <div style={{ display: "flex", gap: 10 }}>
              <MyButton onClick={() => setOpenCodesImportModal(true)}>
                Import CPT (Excel / CSV)
              </MyButton>
            </div>
          </div>
        }
        totalCount={totalCount}
        loading={isFetching}
        page={isFiltered ? filterPagination.page : paginationParams.page}
        rowsPerPage={isFiltered ? filterPagination.size : paginationParams.size}
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
    </>
  );
};

export default CPTSetup;
