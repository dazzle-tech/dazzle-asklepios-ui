import React, { useState, useEffect, useRef, useMemo } from "react";
import { useDispatch } from "react-redux";
import { setDivContent, setPageCode } from "@/reducers/divSlice";
import MyTable from "@/components/MyTable";
import MyModal from "@/components/MyModal/MyModal";
import {
  useGetAllLoincQuery,
  useImportLoincMutation,
  useLazyGetLoincByCategoryQuery,
  useLazyGetLoincByCodeQuery,
  useLazyGetLoincByDescriptionQuery,
  type ImportResult,
  type Conflict,
} from "@/services/setup/loincCodeService";
import MyButton from "@/components/MyButton/MyButton";
import { notify } from "@/utils/uiReducerActions";
import { extractPaginationFromLink } from "@/utils/paginationHelper";
import { Form } from "rsuite";
import MyInput from "@/components/MyInput";
import { useEnumOptions } from "@/services/enumsApi";
import { formatEnumString } from "@/utils";

const LOINCSetup: React.FC = () => {
  const dispatch = useDispatch();

  // main pagination (unfiltered mode - follows Link headers)
  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 15,
    sort: "id,asc",
    timestamp: Date.now(),
  });

  // filtered pagination (client-driven page/size/sort during filtered mode only)
  const [filterPagination, setFilterPagination] = useState({
    page: 0,
    size: 15,
    sort: "id,desc",
  });

  // filtering state (original logic preserved)
  const [recordOfFilter, setRecordOfFilter] = useState<{ filter: string; value: any }>({
    filter: "",
    value: "",
  });
  const [isFiltered, setIsFiltered] = useState(false);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [filteredTotal, setFilteredTotal] = useState<number>(0);
  const [filteredLinks, setFilteredLinks] = useState<any | undefined>(undefined);

  // lazy filter queries
  const [fetchByCategory] = useLazyGetLoincByCategoryQuery();
  const [fetchByCode] = useLazyGetLoincByCodeQuery();
  const [fetchByDescription] = useLazyGetLoincByDescriptionQuery();

  // import modal state
  const [conflicts, setConflicts] = useState<Conflict[] | null>(null);
  const [conflictModalOpen, setConflictModalOpen] = useState(false);
  const [lastUploadedFile, setLastUploadedFile] = useState<File | null>(null);
  const [conflictsPage, setConflictsPage] = useState(0);
  const [conflictsPageSize, setConflictsPageSize] = useState(10);

  // enum options
  const loincCategoryOptions = useEnumOptions("LoincCategory");

  // main list query (unfiltered)
  const { data: loincListResponse, isFetching, refetch } = useGetAllLoincQuery(paginationParams);

  // derived table state (switch between filtered/unfiltered)
  const totalCount = useMemo(
    () => (isFiltered ? filteredTotal : loincListResponse?.totalCount ?? 0),
    [isFiltered, filteredTotal, loincListResponse?.totalCount]
  );
  const links = (isFiltered ? filteredLinks : loincListResponse?.links) || {};
  const tableData = useMemo(
    () => (isFiltered ? filteredData : loincListResponse?.data ?? []),
    [isFiltered, filteredData, loincListResponse?.data]
  );

  // current page/rows based on mode
  const pageIndex = isFiltered ? filterPagination.page : paginationParams.page;
  const rowsPerPage = isFiltered ? filterPagination.size : paginationParams.size;

  // set page header
  useEffect(() => {
    dispatch(setPageCode("LOINC"));
    dispatch(setDivContent("LOINC List"));
    return () => {
      dispatch(setPageCode(""));
      dispatch(setDivContent(""));
    };
  }, [dispatch]);

  // fetch a filtered page (used only during filtered pagination)
  const fetchFilteredPage = async (page: number, size: number, sort: string) => {
    try {
      let resp: { data: any[]; totalCount: number; links?: any } | undefined;

      if (recordOfFilter.filter === "category") {
        resp = await fetchByCategory({ category: recordOfFilter.value, page, size, sort }).unwrap();
      } else if (recordOfFilter.filter === "code") {
        resp = await fetchByCode({ code: recordOfFilter.value, page, size, sort }).unwrap();
      } else if (recordOfFilter.filter === "description") {
        resp = await fetchByDescription({ description: recordOfFilter.value, page, size, sort }).unwrap();
      }

      setFilteredData(resp?.data ?? []);
      setFilteredTotal(resp?.totalCount ?? 0);
      setFilteredLinks(resp?.links || {});
      setFilterPagination({ page, size, sort });
    } catch {
      // fallback to unfiltered mode if filtered page fetch fails
      setIsFiltered(false);
      setFilteredData([]);
      setFilteredTotal(0);
      setFilteredLinks(undefined);
      setPaginationParams((prev) => ({ ...prev, page: 0, timestamp: Date.now() }));
      refetch();
    }
  };

  // pagination change (filtered mode re-runs filter; unfiltered follows Link headers)
  const handlePageChange = (_: unknown, newPage: number) => {
    if (isFiltered) {
      fetchFilteredPage(newPage, filterPagination.size, filterPagination.sort);
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

  // rows-per-page change (filtered mode re-runs filter; unfiltered updates params)
  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSize = parseInt(event.target.value, 10);
    if (isFiltered) {
      setFilterPagination((prev) => ({ ...prev, size: newSize, page: 0 }));
      fetchFilteredPage(0, newSize, filterPagination.sort);
    } else {
      setPaginationParams((prev) => ({ ...prev, size: newSize, page: 0, timestamp: Date.now() }));
    }
  };

  // download template (xlsx)
  const handleDownloadTemplate = () => {
    const link = document.createElement("a");
    link.href = "/templates/LOINC_Code.xlsx";
    link.download = "LOINC_Code.xlsx";
    link.click();
  };

  // import LOINC CSV
  const [importLoinc, { isLoading: isImporting }] = useImportLoincMutation();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const handleClickUpload = () => fileInputRef.current?.click();

  // file upload handler (preserves original filter logic)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res: ImportResult = await importLoinc({ file }).unwrap();

      if (res.conflicts?.length) {
        setLastUploadedFile(file);
        setConflicts(res.conflicts);
        setConflictsPage(0);
        setConflictModalOpen(true);
        dispatch(notify({ msg: `Found ${res.conflicts.length} conflict(s). You can replace or close.`, sev: "warning" }));
      } else {
        dispatch(
          notify({
            msg: `Imported successfully. Inserted ${res.inserted}${res.updated ? `, Updated ${res.updated}` : ""}.`,
            sev: "success",
          })
        );

        // if filtered, re-apply current filter from page 0 (original behavior)
        if (isFiltered) {
          await handleFilterChange(recordOfFilter.filter, recordOfFilter.value, true);
        } else {
          refetch();
        }
      }
    } catch (error: any) {
      dispatch(notify({ msg: error?.data?.detail || "Error importing LOINC file", sev: "error" }));
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // overwrite all conflicts and refresh accordingly
  const handleReplaceAll = async () => {
    if (!lastUploadedFile) return;
    try {
      const res: ImportResult = await importLoinc({ file: lastUploadedFile, overwrite: true }).unwrap();
      setConflictModalOpen(false);
      setConflicts(null);
      setLastUploadedFile(null);
      dispatch(
        notify({
          msg: `Re-imported with overwrite. Inserted ${res.inserted}${res.updated ? `, Updated ${res.updated}` : ""}.`,
          sev: "success",
        })
      );

      if (isFiltered) {
        await handleFilterChange(recordOfFilter.filter, recordOfFilter.value, true);
      } else {
        refetch();
      }
    } catch (error: any) {
      dispatch(notify({ msg: error?.data?.detail || "Overwrite failed", sev: "error" }));
    }
  };

  // filter fields
  const filterFields = [
    { label: "Category", value: "category" },
    { label: "Code", value: "code" },
    { label: "Description", value: "description" },
  ];

  // original filtering logic (unchanged)
  const handleFilterChange = async (fieldName: string, value: any, silent = false) => {
    if (!value) {
      setIsFiltered(false);
      setFilteredData([]);
      setFilteredTotal(0);
      setFilteredLinks(undefined);
      setPaginationParams((prev) => ({ ...prev, page: 0, timestamp: Date.now() }));
      if (!silent) refetch();
      return;
    }
    try {
      let resp: { data: any[]; totalCount: number; links?: any } | undefined;

      if (fieldName === "category") {
        resp = await fetchByCategory({
          category: value,
          page: 0,
          size: paginationParams.size,
          sort: paginationParams.sort,
        }).unwrap();
      } else if (fieldName === "code") {
        resp = await fetchByCode({
          code: value,
          page: 0,
          size: paginationParams.size,
          sort: paginationParams.sort,
        }).unwrap();
      } else if (fieldName === "description") {
        resp = await fetchByDescription({
          description: value,
          page: 0,
          size: paginationParams.size,
          sort: paginationParams.sort,
        }).unwrap();
      }

      setFilteredData(resp?.data ?? []);
      setFilteredTotal(resp?.totalCount ?? 0);
      setFilteredLinks(resp?.links || {});
      setIsFiltered(true);

      // initialize filtered pagination at page 0 using current table size
      setFilterPagination((prev) => ({ ...prev, page: 0, size: paginationParams.size }));
      setPaginationParams((prev) => ({ ...prev, page: 0, timestamp: Date.now() }));
    } catch {
      setIsFiltered(false);
      setFilteredData([]);
      setFilteredTotal(0);
      setFilteredLinks(undefined);
      setPaginationParams((prev) => ({ ...prev, page: 0, timestamp: Date.now() }));
      if (!silent) refetch();
    }
  };

  // auto-reset to unfiltered when filter value cleared
  useEffect(() => {
    if (!recordOfFilter.value) {
      setIsFiltered(false);
      setFilteredData([]);
      setFilteredTotal(0);
      setFilteredLinks(undefined);
      setPaginationParams((prev) => ({ ...prev, page: 0, timestamp: Date.now() }));
      refetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordOfFilter.value]);

  // filters UI
  const filters = () => (
    <Form layout="inline" fluid>
      <MyInput
        selectDataValue="value"
        selectDataLabel="label"
        selectData={filterFields}
        fieldName="filter"
        fieldType="select"
        record={recordOfFilter}
        setRecord={(updated: any) => setRecordOfFilter({ filter: updated.filter, value: "" })}
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
          selectData={loincCategoryOptions ?? []}
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
        onClick={() => handleFilterChange(recordOfFilter.filter, recordOfFilter.value)}
        width="80px"
      >
        Search
      </MyButton>
    </Form>
  );

  // table columns
  const columns = [
    { key: "code", title: "Code", render: (row: any) => row?.code ?? "" },
    { key: "category", title: "Category", render: (row: any) => (row?.category ? formatEnumString(row?.category) : "") },
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

  // conflict modal columns
  const conflictColumns = [
    { key: "code", title: "Code", render: (row: Conflict) => row.code },
    { key: "incomingDescription", title: "Incoming Description", render: (row: Conflict) => row.incomingDescription },
    { key: "incomingCategory", title: "Incoming Category", render: (row: Conflict) => (row.incomingCategory ? formatEnumString(row.incomingCategory) : "") },
    { key: "existingDescription", title: "Existing Description", render: (row: Conflict) => row.existingDescription },
    { key: "existingCategory", title: "Existing Category", render: (row: Conflict) => (row.existingCategory ? formatEnumString(row.existingCategory) : "") },
  ];

  const pagedConflicts =
    conflicts?.slice(conflictsPage * conflictsPageSize, conflictsPage * conflictsPageSize + conflictsPageSize) || [];

  return (
    <>
      <input
        type="file"
        accept=".csv"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleFileUpload}
      />

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
              <MyButton appearance="ghost" onClick={handleDownloadTemplate}>
                Download Template
              </MyButton>
              <MyButton onClick={handleClickUpload} loading={isImporting}>
                Upload LOINC CSV
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
    </>
  );
};

export default LOINCSetup;
