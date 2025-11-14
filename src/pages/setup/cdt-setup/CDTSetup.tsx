import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useDispatch } from "react-redux";
import { setDivContent, setPageCode } from "@/reducers/divSlice";
import MyTable from "@/components/MyTable";
import MyModal from "@/components/MyModal/MyModal";
import MyButton from "@/components/MyButton/MyButton";
import MyInput from "@/components/MyInput";
import { notify } from "@/utils/uiReducerActions";
import { extractPaginationFromLink } from "@/utils/paginationHelper";
import { formatEnumString } from "@/utils";
import { Form, IconButton, Tooltip, Whisper } from "rsuite";
import { useEnumOptions } from "@/services/enumsApi";
import { MdLink, MdVisibility } from "react-icons/md";
import LinkServices, { ServiceLite } from "./LinkServices";
import SelectedServicesPreview from "./SelectedServicesPreview";
import { useGetServicesQuery } from "@/services/setup/serviceService";
import {
  useGetAllCdtQuery,
  useImportCdtMutation,
  useLazyGetCdtByClassQuery,
  useLazyGetCdtByCodeQuery,
  useLazyGetCdtByDescriptionQuery,
  type CdtImportResult,
  type CdtConflict,
} from "@/services/setup/cdtCodeService";
import { Translate } from "@mui/icons-material";

const CDTSetup: React.FC = () => {
  const dispatch = useDispatch();
  // Tenant / facility context (from localStorage)
  const tenant = JSON.parse(localStorage.getItem("tenant") || "null");
  const selectedFacility = tenant?.selectedFacility || null;
  const facilityId: number | undefined = selectedFacility?.id;

  // Pagination state for the main CDT table
  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 15,
    sort: "id,asc",
    timestamp: Date.now(), // bump to force refetch when needed
  });

  // Filter/search state (mirrors CPT UX with guarded setters)
  const [recordOfFilter, setRecordOfFilter] = useState<{ filter: string; value: any }>({
    filter: "",
    value: "",
  });
  const [isFiltered, setIsFiltered] = useState(false);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [filteredTotal, setFilteredTotal] = useState<number>(0);
  const [filteredLinks, setFilteredLinks] = useState<any | undefined>(undefined);

  // Lazy queries for filter operations
  const [fetchByClass] = useLazyGetCdtByClassQuery();
  const [fetchByCode] = useLazyGetCdtByCodeQuery();
  const [fetchByDescription] = useLazyGetCdtByDescriptionQuery();

  // Options for CDT Class enum
  const cdtClassOptions = useEnumOptions("CdtClass");

  // Main list query (auto-refetch on pagination params)
  const { data: cdtListResponse, isFetching, refetch } = useGetAllCdtQuery(paginationParams);

  // Derived table state (switch between filtered & unfiltered)
  const totalCount = useMemo(
    () => (isFiltered ? filteredTotal : cdtListResponse?.totalCount ?? 0),
    [isFiltered, filteredTotal, cdtListResponse?.totalCount]
  );
  const links = (isFiltered ? filteredLinks : cdtListResponse?.links) || {};
  const tableData = useMemo(
    () => (isFiltered ? filteredData : cdtListResponse?.data ?? []),
    [isFiltered, filteredData, cdtListResponse?.data]
  );

  const pageIndex = paginationParams.page;
  const rowsPerPage = paginationParams.size;


  // Page shell (breadcrumb / title) lifecycle
  useEffect(() => {
    dispatch(setPageCode("CDT"));
    dispatch(setDivContent("CDT Procedures List"));
    return () => {
      dispatch(setPageCode(""));
      dispatch(setDivContent(""));
    };
  }, [dispatch]);

  // Pagination handlers
  const handlePageChange = (_: unknown, newPage: number) => {
    const currentPage = paginationParams.page;
    let targetLink: string | null | undefined = null;

    // Choose correct HATEOAS link based on direction
    if (newPage > currentPage && links.next) targetLink = links.next;
    else if (newPage < currentPage && links.prev) targetLink = links.prev;
    else if (newPage === 0 && links.first) targetLink = links.first;
    else if (newPage > currentPage + 1 && links.last) targetLink = links.last;

    // Update pagination from link (server is the source of truth)
    if (targetLink) {
      const { page, size } = extractPaginationFromLink(targetLink);
      setPaginationParams((prev) => ({
        ...prev,
        page,
        size,
        timestamp: Date.now(),
      }));
    }
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPaginationParams((prev) => ({
      ...prev,
      size: parseInt(event.target.value, 10),
      page: 0,
      timestamp: Date.now(),
    }));
  };

  // Filters (Class/Code/Description) — guarded state updates
  const filterFields = [
    { label: "Class", value: "class" },
    { label: "Code", value: "code" },
    { label: "Description", value: "description" },
  ];

  // Execute filter and store results in local filtered state
  const handleFilterChange = async (fieldName: string, value: any, silent = false) => {
    // Clear filters and reset to first page
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

      // Route to the correct lazy query based on the field
      if (fieldName === "class") {
        const v = typeof value === "object" && value !== null ? value.value ?? value : value;
        resp = await fetchByClass({
          cdtClass: String(v).toUpperCase(),
          page: 0,
          size: paginationParams.size,
          sort: paginationParams.sort,
        }).unwrap();
      } else if (fieldName === "code") {
        resp = await fetchByCode({
          code: typeof value === "object" ? String(value.value ?? value) : value,
          page: 0,
          size: paginationParams.size,
          sort: paginationParams.sort,
        }).unwrap();
      } else if (fieldName === "description") {
        resp = await fetchByDescription({
          description: typeof value === "object" ? String(value.value ?? value) : value,
          page: 0,
          size: paginationParams.size,
          sort: paginationParams.sort,
        }).unwrap();
      }

      // Store filtered snapshot
      setFilteredData(resp?.data ?? []);
      setFilteredTotal(resp?.totalCount ?? 0);
      setFilteredLinks(resp?.links || {});
      setIsFiltered(true);
      setPaginationParams((prev) => ({ ...prev, page: 0, timestamp: Date.now() }));
    } catch {
      // On failure, revert to unfiltered list
      setIsFiltered(false);
      setFilteredData([]);
      setFilteredTotal(0);
      setFilteredLinks(undefined);
      setPaginationParams((prev) => ({ ...prev, page: 0, timestamp: Date.now() }));
      if (!silent) refetch();
    }
  };

  // Auto-reset when filter input is cleared (same as CPT behavior)
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

  // Render filter controls
  const filters = () => (
    <Form layout="inline" fluid>
      {/* Filter type selector (guarded setState to avoid needless renders) */}
      <MyInput
        selectDataValue="value"
        selectDataLabel="label"
        selectData={filterFields}
        fieldName="filter"
        fieldType="select"
        record={recordOfFilter}
        setRecord={(updated: any) => {
          const nextFilter = updated?.filter ?? "";
          setRecordOfFilter((prev) => {
            // Do not update state if the value has not actually changed
            if (prev.filter === nextFilter) return prev;
            return { filter: nextFilter, value: "" };
          });
        }}
        showLabel={false}
        placeholder="Select Filter"
        searchable={false}
        width="170px"
      />

      {/* Conditional input: Class uses enum select; Code/Description use text */}
      {recordOfFilter.filter === "class" ? (
        <MyInput
          width={300}
          fieldName="value"
          fieldLabel=""
          fieldType="select"
          selectData={cdtClassOptions ?? []}
          selectDataLabel="label"
          selectDataValue="value"
          record={recordOfFilter}
          setRecord={(updated: any) => {
            const raw = updated?.value;
            const nextValue = typeof raw === "object" && raw !== null ? raw.value ?? raw : raw ?? "";
            setRecordOfFilter((prev) => (prev.value === nextValue ? prev : { ...prev, value: nextValue }));
          }}
        />
      ) : (
        <MyInput
          fieldName="value"
          fieldType="text"
          record={recordOfFilter}
          setRecord={(updated: any) => {
            const next = updated?.value ?? "";
            setRecordOfFilter((prev) => (prev.value === next ? prev : { ...prev, value: next }));
          }}
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

      {/* Trigger filter execution */}
      <MyButton
        color="var(--deep-blue)"
        onClick={() => handleFilterChange(recordOfFilter.filter, recordOfFilter.value)}
        width="80px"
      >
        Search
      </MyButton>
    </Form>
  );

  // Template download + CSV upload/import
  const handleDownloadTemplate = () => {
    // Force download from public /templates directory
    const link = document.createElement("a");
    link.href = "/templates/CDT_Codes.xlsx";
    link.download = "CDT_Codes.xlsx";
    link.click();
  };

  const [importCdt, { isLoading: isImporting }] = useImportCdtMutation();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const handleClickUpload = () => fileInputRef.current?.click();

  // Import conflict handling state
  const [conflicts, setConflicts] = useState<CdtConflict[] | null>(null);
  const [conflictModalOpen, setConflictModalOpen] = useState(false);
  const [lastUploadedFile, setLastUploadedFile] = useState<File | null>(null);
  const [conflictsPage, setConflictsPage] = useState(0);
  const [conflictsPageSize, setConflictsPageSize] = useState(10);

  // Services picker state (link Services to CDT rows)
  const [servicesPager, setServicesPager] = useState({ page: 0, size: 15, sort: "id,asc" });
  const { data: servicesPage, isFetching: isFetchingServices } = useGetServicesQuery(
    { facilityId, page: servicesPager.page, size: servicesPager.size, sort: servicesPager.sort },
    { skip: !facilityId }
  );
  const servicesTotalCount = servicesPage?.totalCount ?? 0;
  const servicesTableData = servicesPage?.data ?? [];

  // Normalize services into the lightweight shape required by the picker
  const servicesForPicker: ServiceLite[] = useMemo(() => {
    return (servicesTableData ?? []).map((s: any) => ({
      id: s.id,
      name: s.name,
      code: s.code,
      category: s.category ?? null,
      isActive: s.isActive ?? true,
      abbreviation: s.abbreviation ?? null,
      price: s.price ?? null,
      currency: s.currency ?? null,
    }));
  }, [servicesTableData]);

  // Pager handlers for the Services table inside the picker
  const handleServicesPageChange = useCallback((_: unknown, newPage: number) => {
    setServicesPager((prev) => ({ ...prev, page: newPage }));
  }, []);
  const handleServicesRowsPerPageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setServicesPager((prev) => ({ ...prev, size: parseInt(e.target.value, 10), page: 0 }));
  }, []);

  const [openServicesPicker, setOpenServicesPicker] = useState(false);
  const [selectedCdtRow, setSelectedCdtRow] = useState<any | null>(null);
  const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>([]);

  // Confirmation callback after linking services
  const handleLinkServicesConfirmed = (ids: number[]) => {
    dispatch(
      notify({
        msg: `Linked ${ids.length} service(s) to CDT ${selectedCdtRow?.code || ""}`,
        sev: "success",
      })
    );
  };

  const [openSelectedPreview, setOpenSelectedPreview] = useState(false);

  // Main table column definitions
  const columns = [
    { key: "code", title: "Code", render: (row: any) => row?.code ?? "" },
    {
      key: "cdtClass",
      title: "Class",
      render: (row: any) => (row?.cdtClass ? formatEnumString(row?.cdtClass) : ""),
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
    {
      key: "actions",
      title: "Actions",
      render: (row: any) => (
        <>
          <Whisper placement="top" trigger="hover" speaker={<Tooltip>Link Services</Tooltip>}>
            <IconButton
              appearance="subtle"
              icon={<MdLink size={18} />}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedCdtRow(row);
                setSelectedServiceIds([]);
                setOpenServicesPicker(true);
              }}
            />
          </Whisper>

          {/* View Linked Services */}
          <Whisper placement="top" trigger="hover" speaker={<Tooltip>View linked services</Tooltip>}>
            <IconButton
              appearance="subtle"
              icon={<MdVisibility size={18} />}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedCdtRow(row);
                setOpenSelectedPreview(true);
              }}
            />
          </Whisper>
        </>
      ),
      align: "right" as const,
    },
  ];

  // ----------------------------------------
  // Import conflict table columns
  // ----------------------------------------
  const conflictColumns = [
    { key: "code", title: "Code", render: (row: CdtConflict) => row.code },
    { key: "incomingDescription", title: "Incoming Description", render: (row: CdtConflict) => row.incomingDescription },
    {
      key: "incomingClass",
      title: "Incoming Class",
      render: (row: CdtConflict) => (row.incomingClass ? formatEnumString(row.incomingClass) : ""),
    },
    { key: "incomingIsActive", title: "Incoming Active", render: (row: CdtConflict) => String(row.incomingIsActive) },
    { key: "existingDescription", title: "Existing Description", render: (row: CdtConflict) => row.existingDescription },
    {
      key: "existingClass",
      title: "Existing Class",
      render: (row: CdtConflict) => (row.existingClass ? formatEnumString(row.existingClass) : ""),
    },
    { key: "existingIsActive", title: "Existing Active", render: (row: CdtConflict) => String(row.existingIsActive) },
  ];

  // Paged slice for conflict table
  const pagedConflicts = conflicts
    ? conflicts.slice(conflictsPage * conflictsPageSize, conflictsPage * conflictsPageSize + conflictsPageSize)
    : [];

  // Handle file selection + import round-trip
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
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
        if (isFiltered) {
          await handleFilterChange(recordOfFilter.filter, recordOfFilter.value, true);
        } else {
          refetch();
        }
      }
    } catch (error: any) {
      dispatch(
        notify({
          msg: error?.data?.detail || "Error importing CDT file",
          sev: "error",
        })
      );
    } finally {
      // Reset input to allow re-selecting the same file if needed
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Overwrite flow for conflicts (re-import with overwrite flag)
  const handleReplaceAll = async () => {
    if (!lastUploadedFile) return;
    try {
      const res: CdtImportResult = await importCdt({ file: lastUploadedFile, overwrite: true }).unwrap();
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
      dispatch(
        notify({
          msg: error?.data?.detail || "Overwrite failed",
          sev: "error",
        })
      );
    }
  };

  // ----------------------------------------
  // Render
  // ----------------------------------------
  return (
    <>
      {/* Hidden file input for CSV uploads */}
      <input type="file" accept=".csv" ref={fileInputRef} style={{ display: "none" }} onChange={handleFileUpload} />

      {/* Main CDT table */}
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
                Upload CDT CSV
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

      {/* Import conflicts modal */}
      <MyModal
        open={conflictModalOpen}
        setOpen={setConflictModalOpen}
        title="CDT Import Conflicts"
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
        <SelectedServicesPreview open={openSelectedPreview} setOpen={setOpenSelectedPreview} cdtId={selectedCdtRow.id} />
      ) : null}
    </>
  );
};

export default CDTSetup;
