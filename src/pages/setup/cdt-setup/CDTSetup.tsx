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

const CDTSetup: React.FC = () => {
  const dispatch = useDispatch();

  // Tenant / facility context (from localStorage)
  const tenant = JSON.parse(localStorage.getItem("tenant") || "null");
  const selectedFacility = tenant?.selectedFacility || null;
  const facilityId: number | undefined = selectedFacility?.id;

  // ----------------------------------------
  // MAIN pagination (unfiltered mode)
  // ----------------------------------------
  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 15,
    sort: "id,asc",
    timestamp: Date.now(),
  });

  // ----------------------------------------
  // FILTERED pagination (client-driven)
  // ----------------------------------------
  const [filterPagination, setFilterPagination] = useState({
    page: 0,
    size: 15,
    sort: "id,asc",
  });

  // ----------------------------------------
  // Filter/search state
  // ----------------------------------------
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

  // Enum options for CDT Class
  const cdtClassOptions = useEnumOptions("CdtClass");

  // Main list query (unfiltered)
  const { data: cdtListResponse, isFetching, refetch } = useGetAllCdtQuery(paginationParams);

  // ----------------------------------------
  // Derived table state (filtered / unfiltered)
  // ----------------------------------------
  const totalCount = useMemo(
    () => (isFiltered ? filteredTotal : cdtListResponse?.totalCount ?? 0),
    [isFiltered, filteredTotal, cdtListResponse?.totalCount]
  );

  const links = (isFiltered ? filteredLinks : cdtListResponse?.links) || {};

  const tableData = useMemo(
    () => (isFiltered ? filteredData : cdtListResponse?.data ?? []),
    [isFiltered, filteredData, cdtListResponse?.data]
  );

  const pageIndex = isFiltered ? filterPagination.page : paginationParams.page;
  const rowsPerPage = isFiltered ? filterPagination.size : paginationParams.size;

  // ----------------------------------------
  // Page shell (title)
  // ----------------------------------------
  useEffect(() => {
    dispatch(setPageCode("CDT"));
    dispatch(setDivContent("CDT Procedures List"));
    return () => {
      dispatch(setPageCode(""));
      dispatch(setDivContent(""));
    };
  }, [dispatch]);

  // ----------------------------------------
  // Fetch one filtered page (used only in filtered mode)
  // ----------------------------------------
  const fetchFilteredPage = async (page: number, size: number, sort: string) => {
    try {
      let resp: { data: any[]; totalCount: number; links?: any } | undefined;

      if (recordOfFilter.filter === "class") {
        const classValue = String(recordOfFilter.value ?? "").toUpperCase();
        resp = await fetchByClass({ cdtClass: classValue, page, size, sort }).unwrap();
      } else if (recordOfFilter.filter === "code") {
        const codeValue = String(recordOfFilter.value ?? "");
        resp = await fetchByCode({ code: codeValue, page, size, sort }).unwrap();
      } else if (recordOfFilter.filter === "description") {
        const descValue = String(recordOfFilter.value ?? "");
        resp = await fetchByDescription({ description: descValue, page, size, sort }).unwrap();
      }

      setFilteredData(resp?.data ?? []);
      setFilteredTotal(resp?.totalCount ?? 0);
      setFilteredLinks(resp?.links || {});
      setFilterPagination({ page, size, sort });
    } catch {
      setIsFiltered(false);
      setFilteredData([]);
      setFilteredTotal(0);
      setFilteredLinks(undefined);
      setPaginationParams((prev) => ({ ...prev, page: 0, timestamp: Date.now() }));
      refetch();
    }
  };

  // ----------------------------------------
  // Pagination handlers
  // ----------------------------------------
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
      setPaginationParams((prev) => ({
        ...prev,
        page,
        size,
        timestamp: Date.now(),
      }));
    }
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSize = parseInt(event.target.value, 10);

    if (isFiltered) {
      setFilterPagination((prev) => ({ ...prev, size: newSize, page: 0 }));
      fetchFilteredPage(0, newSize, filterPagination.sort);
    } else {
      setPaginationParams((prev) => ({
        ...prev,
        size: newSize,
        page: 0,
        timestamp: Date.now(),
      }));
    }
  };

  // ----------------------------------------
  // Filters (Class/Code/Description)
  // ----------------------------------------
  const filterFields = [
    { label: "Class", value: "class" },
    { label: "Code", value: "code" },
    { label: "Description", value: "description" },
  ];

  const handleFilterChange = async (fieldName: string, value: any, silent = false) => {
    if (!value) {
      // clear filter
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

      if (fieldName === "class") {
        const v = typeof value === "object" && value !== null ? value.value ?? value : value;
        resp = await fetchByClass({
          cdtClass: String(v).toUpperCase(),
          page: 0,
          size: paginationParams.size,
          sort: paginationParams.sort,
        }).unwrap();
      } else if (fieldName === "code") {
        const v = typeof value === "object" ? String(value.value ?? value) : value;
        resp = await fetchByCode({
          code: v,
          page: 0,
          size: paginationParams.size,
          sort: paginationParams.sort,
        }).unwrap();
      } else if (fieldName === "description") {
        const v = typeof value === "object" ? String(value.value ?? value) : value;
        resp = await fetchByDescription({
          description: v,
          page: 0,
          size: paginationParams.size,
          sort: paginationParams.sort,
        }).unwrap();
      }

      setFilteredData(resp?.data ?? []);
      setFilteredTotal(resp?.totalCount ?? 0);
      setFilteredLinks(resp?.links || {});
      setIsFiltered(true);

      setFilterPagination({
        page: 0,
        size: paginationParams.size,
        sort: paginationParams.sort,
      });

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

  const refreshAfterMutation = async () => {
    if (isFiltered && recordOfFilter.filter && recordOfFilter.value) {
      await fetchFilteredPage(filterPagination.page, filterPagination.size, filterPagination.sort);
    } else {
      refetch();
    }
  };

  // ----------------------------------------
  // Filters UI
  // ----------------------------------------
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
          const nextFilter = updated?.filter ?? "";
          setRecordOfFilter((prev) => {
            if (prev.filter === nextFilter) return prev;
            return { filter: nextFilter, value: "" };
          });
        }}
        showLabel={false}
        placeholder="Select Filter"
        searchable={false}
        width="170px"
      />

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

      <MyButton
        color="var(--deep-blue)"
        onClick={() => handleFilterChange(recordOfFilter.filter, recordOfFilter.value)}
        width="80px"
      >
        Search
      </MyButton>
    </Form>
  );

  // ----------------------------------------
  // Template download + CSV upload/import
  // ----------------------------------------
  const handleDownloadTemplate = () => {
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

  const pagedConflicts = conflicts
    ? conflicts.slice(conflictsPage * conflictsPageSize, conflictsPage * conflictsPageSize + conflictsPageSize)
    : [];

  // ----------------------------------------
  // Services picker state (link Services to CDT rows)
  // ----------------------------------------
  const [servicesPager, setServicesPager] = useState({ page: 0, size: 15, sort: "id,asc" });
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
      currency: s.currency ?? null,
    }));
  }, [servicesTableData]);

  const handleServicesPageChange = useCallback((_: unknown, newPage: number) => {
    setServicesPager((prev) => ({ ...prev, page: newPage }));
  }, []);

  const handleServicesRowsPerPageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setServicesPager((prev) => ({ ...prev, size: parseInt(e.target.value, 10), page: 0 }));
  }, []);

  const [openServicesPicker, setOpenServicesPicker] = useState(false);
  const [selectedCdtRow, setSelectedCdtRow] = useState<any | null>(null);
  const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>([]);

  const handleLinkServicesConfirmed = (ids: number[]) => {
    dispatch(
      notify({
        msg: `Linked ${ids.length} service(s) to CDT ${selectedCdtRow?.code || ""}`,
        sev: "success",
      })
    );
  };

  const [openSelectedPreview, setOpenSelectedPreview] = useState(false);

  // ----------------------------------------
  // Main CDT table columns
  // ----------------------------------------
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
  // Conflict table columns
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

  // ----------------------------------------
  // File upload / import CDT
  // ----------------------------------------
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
        await refreshAfterMutation();
      }
    } catch (error: any) {
      dispatch(
        notify({
          msg: error?.data?.detail || "Error importing CDT file",
          sev: "error",
        })
      );
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

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
      await refreshAfterMutation();
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
