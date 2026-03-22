import React from "react";
import Translate from "@/components/Translate";
import { Panel, Form } from "rsuite";
import AddOutlineIcon from "@rsuite/icons/AddOutline";
import { MdModeEdit, MdDelete } from "react-icons/md";
import { FaUndo } from "react-icons/fa";
import { GrScheduleNew } from "react-icons/gr";
import { useDispatch } from "react-redux";
import { setDivContent, setPageCode } from "@/reducers/divSlice";
import MyButton from "@/components/MyButton/MyButton";
import MyTable from "@/components/MyTable";
import MyInput from "@/components/MyInput";
import DeletionConfirmationModal from "@/components/DeletionConfirmationModal";
import AddEditResources from "./AddEditResources";
import NewAvailabilityTimeModal from "./NewAvailabilityTimeModal";
import { notify } from "@/utils/uiReducerActions";
import {
  useGetAllResourcesQuery,
  useCreateResourceMutation,
  useUpdateResourceMutation,
  useToggleResourceActiveMutation,
  useLazyGetResourcesByTypeQuery,
} from "@/services/setup/resource/ResourceService";
import "./styles.less";
import { formatEnumString } from "@/utils";
import { PaginationPerPage } from "@/utils/paginationPerPage";
import { useEnumOptions } from "@/services/enumsApi";
import { useState, useEffect } from "react";

// Resource type definition
type Resource = {
  id?: number;
  resourceType: string;
  resourceKey: string;
  isAllowParallel?: boolean;
  isActive?: boolean;
  resourceName?: string;
};

const newResource: Resource = {
  resourceType: "",
  resourceKey: "",
  isAllowParallel: true,
  isActive: true,
};

const Resources = () => {
  const dispatch = useDispatch();

  // ──────────────────────────── STATE ────────────────────────────
  const [resource, setResource] = useState<Resource>({ ...newResource });
  const [width, setWidth] = useState<number>(window.innerWidth);
  const [openAddEditResource, setOpenAddEditResource] = useState<boolean>(false);
  const [
    openConfirmDeleteResourceModal,
    setOpenConfirmDeleteResourceModal,
  ] = useState<boolean>(false);
  const [stateOfDeleteModal, setStateOfDeleteModal] =
    useState<string>("deactivate");
  const [openAvailabilityTimePopup, setOpenAvailabilityTimePopup] = useState<boolean>(false);
  const [resourceAvailabilityDetails, setResourceAvailabilityDetails] = useState<any>(null);
  const [recordOfFilter, setRecordOfFilter] = useState({
    filter: "",
    value: "",
  });
  const [isFiltered, setIsFiltered] = useState(false);
  const [filteredList, setFilteredList] = useState<Resource[]>([]);
  const [filteredTotal, setFilteredTotal] = useState<number>(0);
  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 15,
    sort: "id,asc",
    timestamp: Date.now(),
  });
  const [filterPagination, setFilterPagination] = useState({
      page: 0,
      size: 15,
      sort: 'id,asc'
    });

  // ──────────────────────────── DATA ────────────────────────────
  const { data: resourceListResponse, refetch ,isFetching } =
    useGetAllResourcesQuery(paginationParams);

  const [createResource] = useCreateResourceMutation();
  const [updateResource] = useUpdateResourceMutation();
  const [toggleResourceActive] = useToggleResourceActiveMutation();
  const [getResourcesByType] = useLazyGetResourcesByTypeQuery();
  const resourceTypeEnum = useEnumOptions("ResourceType");

  const totalCount = resourceListResponse?.totalCount ?? 0;
  const [links, setLinks] = useState({});
 
  const pageIndex = paginationParams.page;
  const rowsPerPage = paginationParams.size;

  // ──────────────────────────── EFFECTS ────────────────────────────
  useEffect(() => {
    const divContent = "Resources";
    dispatch(setPageCode("Resources"));
    dispatch(setDivContent(divContent));
    return () => {
      dispatch(setPageCode(""));
      dispatch(setDivContent(""));
    };
  }, [dispatch]);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

   useEffect(() => {
      setLinks(resourceListResponse?.links);
    }, [resourceListResponse?.links]);

    useEffect(() => {
         if(!openAddEditResource && isFiltered){
          handleFilterChange(recordOfFilter.filter, recordOfFilter.value, 0, filterPagination.size);
         }
      },[resourceListResponse]);

  // ──────────────────────────── FILTER LOGIC ────────────────────────────
  const filterFields = [
    { label: "Resource Type", value: "resourceType" },
    { label: "Resource Name", value: "resourceName" },
  ];

  const handleFilterChange = async (field: string, value: string, page = 0, size?: number) => {
    try {
      if (!field || !value) {
        setIsFiltered(false);
        setFilteredList([]);
        return;
      }
       const currentSize = size ?? filterPagination.size;

      let response;
      const params = {
        page,
        size: currentSize,
        sort: filterPagination.sort
      };

      if (field === "resourceType") {
        response = await getResourcesByType({
          resourceType: value,
          ...params
        }).unwrap();
        setFilteredList(response.data ?? []);
        setFilteredTotal(response.totalCount ?? 0);
        setIsFiltered(true);
        setFilterPagination({ ...filterPagination, page, size: currentSize });
      } else if (field === "resourceName") {
        // Filter by resource name - search in the current list
        const allResources = resourceListResponse?.data ?? [];
        const searchTerm = value.toLowerCase().trim();
        
        const filtered = allResources.filter((r: Resource) => {
          const resourceName = (r.resourceName || r.resourceKey || '').toLowerCase();
          return resourceName.includes(searchTerm);
        });

         
        setFilteredList(filtered);
        setFilteredTotal(filtered.length);
        setIsFiltered(true);
        setFilterPagination({ ...filterPagination, page, size: currentSize });
      } else {
        setIsFiltered(false);
        return;
      }
    } catch (error) {
        dispatch(
          notify({
          msg: "Failed to filter resources",
          sev: "error",
        })
      );
      setIsFiltered(false);
    }
  };

  // ──────────────────────────── CRUD HANDLERS ────────────────────────────
  const getErrorText = (err: any) => {
    if (!err) return '';

    // RTK Query commonly provides: { status, data } where data can be string or object
    const data = (err as any)?.data;

    const parts: string[] = [];
    if (typeof (err as any)?.error === 'string') parts.push((err as any).error);
    if (typeof (err as any)?.message === 'string') parts.push((err as any).message);

    if (typeof data === 'string') parts.push(data);
    if (data && typeof data === 'object') {
      if (typeof (data as any)?.detail === 'string') parts.push((data as any).detail);
      if (typeof (data as any)?.message === 'string') parts.push((data as any).message);
      if (typeof (data as any)?.error === 'string') parts.push((data as any).error);
      try {
        parts.push(JSON.stringify(data));
      } catch {
        // ignore stringify issues
      }
    }

    // last resort
    try {
      parts.push(String(err));
    } catch {
      // ignore
    }

    return parts.filter(Boolean).join(' | ');
  };

  const normalizeResourceUniquenessError = (error: any, fallbackName?: string) => {
    const text = getErrorText(error);
    const lower = text.toLowerCase();

    // Example backend:
    // Key (resource_type, resource_key)=(CLINIC, 5001) already exists.
    if (
      lower.includes('duplicate key value violates unique constraint') ||
      lower.includes('uk_resource_type_key')
    ) {
      const m = text.match(
        /Key\s*\(resource_type,\s*resource_key\)\s*=\s*\(([^,]+),\s*([^)]+)\)\s*already exists/i
      );
      if (m) {
        const type = String(m[1]).trim();
        const key = String(m[2]).trim();

        // Prefer showing display name instead of raw key (e.g. department/clinic name)
        const allLoaded = [
          ...((resourceListResponse?.data as Resource[]) ?? []),
          ...((filteredList as Resource[]) ?? [])
        ];
        const existing = allLoaded.find(
          r =>
            String(r?.resourceType ?? '').toUpperCase() === String(type).toUpperCase() &&
            String(r?.resourceKey ?? '') === key
        );
        const displayName =
          String(existing?.resourceName ?? '').trim() ||
          String(fallbackName ?? '').trim() ||
          key;

        const typeLabel =
          resourceTypeEnum?.find((x: any) => String(x?.value) === String(type))?.label ??
          formatEnumString(type);

        return {
          msg: `Duplicate resource: ${typeLabel} - ${displayName} already exists.`,
          sev: 'warning'
        };
      }

      return {
        msg: 'Duplicate resource: a record with the same Resource Type and Resource already exists.',
        sev: 'warning'
      };
    }

    return null;
  };

  const handleAddNew = async (resourceNameParam?: string) => {
    try {
      // Get resourceName from parameter (passed from AddEditResources) or from state or use resourceKey as fallback
      const resourceName = resourceNameParam || resource.resourceName || resource.resourceKey;
      
      const payload = {
        resourceType: resource.resourceType,
        resourceKey: resource.resourceKey,
        isAllowParallel: resource.isAllowParallel ?? true,
        isActive: resource.isActive ?? true,
        resourceName: resourceName
      };

      const Response = await createResource(payload).unwrap();
      dispatch(
        notify({ msg: "Resource added successfully", sev: "success" })
      );
      setPaginationParams({ ...paginationParams, timestamp: Date.now() });
      refetch();
      setResource({ ...Response });
      setOpenAddEditResource(false);
    } catch (error) {
      const normalized = normalizeResourceUniquenessError(
        error,
        resourceNameParam || resource.resourceName || resource.resourceKey
      );
      if (normalized) {
        dispatch(notify(normalized));
        return;
      }

      if (error?.data?.fieldErrors?.length) {
        const messages = error.data.fieldErrors
          .map(fe => `${fe.field}: ${fe.message}`)
          .join("\n");
        dispatch(notify({ msg: messages, sev: "warning" }));
      } else if (error?.data?.detail) {
        dispatch(notify({ msg: error.data.detail, sev: "warning" }));
      } else {
        dispatch(notify({ msg: "Failed to create resource", sev: "error" }));
      }
    }
  };

  const handleUpdate = async (resourceNameParam?: string) => {
    try {
      // Get resourceName from parameter (passed from AddEditResources) or from state or use resourceKey as fallback
      const resourceName = resourceNameParam || resource.resourceName || resource.resourceKey;
      
      const payload = {
        resourceType: resource.resourceType,
        resourceKey: resource.resourceKey,
        isAllowParallel: resource.isAllowParallel ?? true,
        isActive: resource.isActive ?? true,
        resourceName: resourceName
      };

      await updateResource({ id: resource.id!, ...payload }).unwrap();

      dispatch(
        notify({ msg: "Resource updated successfully", sev: "success" })
      );
      setPaginationParams({ ...paginationParams, timestamp: Date.now() });
      setOpenAddEditResource(false);
    } catch (error) {
      console.error("Error updating resource:", error);

      const normalized = normalizeResourceUniquenessError(
        error,
        resourceNameParam || resource.resourceName || resource.resourceKey
      );
      if (normalized) {
        dispatch(notify(normalized));
        return;
      }

      if (error?.data?.fieldErrors?.length) {
        const messages = error.data.fieldErrors
          .map(fe => `${fe.field}: ${fe.message}`)
          .join("\n");
        dispatch(notify({ msg: messages, sev: "error" }));
      } else if (error?.data?.detail) {
        dispatch(notify({ msg: error.data.detail, sev: "error" }));
    } else {
        dispatch(notify({ msg: "Failed to update resource", sev: "error" }));
      }
    }
  };

  const handleToggleActive = async (id: number) => {
    try {
      await toggleResourceActive(id).unwrap();
      dispatch(notify({ msg: "Status updated successfully", sev: "success" }));
      setPaginationParams({ ...paginationParams, timestamp: Date.now() });
    } catch {
      dispatch(notify({ msg: "Failed to update status", sev: "error" }));
    }
  };

  const handleDeactiveReactivateResource = () => {
    handleToggleActive(resource.id!);
    setOpenConfirmDeleteResourceModal(false);
  };


  // ──────────────────────────── TABLE LOGIC ────────────────────────────
  const isSelected = (rowData: Resource) =>
    rowData?.id === resource?.id ? "selected-row" : "";

  const iconsForActions = (rowData: Resource) => (
    <div className="container-of-icons">
      <GrScheduleNew
        title="Availability"
        size={24}
        fill="var(--primary-gray)"
        className="icons-style"
        onClick={() => {
          setResourceAvailabilityDetails({
            object: [{
              key: rowData.resourceKey,
              resourceType: rowData.resourceType,
            }]
          });
          setOpenAvailabilityTimePopup(true);
        }}
      />
      <MdModeEdit
        title="Edit"
        size={24}
        fill="var(--primary-gray)"
        className="icons-style"
        onClick={() => {
          setResource(rowData);
          setOpenAddEditResource(true);
        }}
      />
      {rowData?.isActive ? (
        <MdDelete
          title="Deactivate"
          size={24}
          fill="var(--primary-pink)"
          className="icons-style"
          onClick={() => {
            setResource(rowData);
            setStateOfDeleteModal("deactivate");
            setOpenConfirmDeleteResourceModal(true);
          }}
        />
      ) : (
        <FaUndo
          title="Activate"
          size={24}
          fill="var(--primary-gray)"
          className="icons-style"
          onClick={() => {
            setResource(rowData);
            setStateOfDeleteModal("reactivate");
            setOpenConfirmDeleteResourceModal(true);
          }}
        />
      )}
    </div>
  );

  const tableColumns = [
    {
      key: "resourceType",
      title: <Translate>Resource Type</Translate>,
      flexGrow: 3,
      render: rowData => <p>{formatEnumString(rowData?.resourceType)}</p>,
    },
    {
      key: "resourceKey",
      title: <Translate>Resource</Translate>,
      flexGrow: 3,
      render: (rowData: Resource) => {
        const displayName = rowData?.resourceName || rowData?.resourceKey || '-';
        return <p>{displayName}</p>;
      },
    },
    {
      key: "isAllowParallel",
      title: <Translate>Allow Parallel</Translate>,
      flexGrow: 2,
      render: (rowData: Resource) => (
        <p>{rowData?.isAllowParallel ? "Yes" : "No"}</p>
      ),
    },
    {
      key: "isActive",
      title: <Translate>Status</Translate>,
      flexGrow: 2,
      render: (rowData: Resource) => (
        <p>{rowData?.isActive ? "Active" : "Inactive"}</p>
      ),
    },
    {
      key: 'createdBy',
      title: <Translate>Created By</Translate>,
      flexGrow: 4
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
      flexGrow: 3,
      render: rowData => iconsForActions(rowData)
    }
  ];

  // ──────────────────────────── PAGINATION ────────────────────────────
  const handlePageChange = (event, newPage) => {
      if (isFiltered) {
        handleFilterChange(recordOfFilter.filter, recordOfFilter.value, newPage);
      } else {
        PaginationPerPage.handlePageChange(
          event,
          newPage,
          paginationParams,
          links,
          setPaginationParams
        );
      }
    };

  // ──────────────────────────── FILTER UI ────────────────────────────
  const filters = () => (
    <Form layout="inline" style={{ display: "flex", gap: "10px" }}>
      <MyInput
        fieldName="filter"
        fieldType="select"
        selectData={filterFields}
        selectDataLabel="label"
        selectDataValue="value"
        record={recordOfFilter}
        setRecord={u => setRecordOfFilter({ filter: u.filter, value: "" })}
        placeholder="Select Filter"
        showLabel={false}
        width="180px"
      />

      {recordOfFilter.filter === "resourceType" && (
        <MyInput
          fieldName="value"
          fieldType="select"
          selectData={resourceTypeEnum ?? []}
          selectDataLabel="label"
          selectDataValue="value"
          record={recordOfFilter}
          setRecord={u => setRecordOfFilter({ ...recordOfFilter, value: u.value })}
          showLabel={false}
          placeholder="Select Resource Type"
        />
      )}

      {recordOfFilter.filter === "resourceName" && (
        <MyInput
          fieldName="value"
          fieldType="text"
          record={recordOfFilter}
          setRecord={setRecordOfFilter}
          placeholder="Enter Resource Name"
          showLabel={false}
        />
      )}

      {recordOfFilter.filter !== "resourceType" && recordOfFilter.filter !== "resourceName" && (
        <MyInput
          fieldName="value"
          fieldType="text"
          record={recordOfFilter}
          setRecord={setRecordOfFilter}
          placeholder="Enter Value"
          showLabel={false}
        />
      )}

      <MyButton
        color="var(--deep-blue)"
        width="80px"
        onClick={() =>
          handleFilterChange(recordOfFilter.filter, recordOfFilter.value)
        }
      >
        Search
      </MyButton>
    </Form>
  );

  // ──────────────────────────── RENDER ────────────────────────────
  return (
    <Panel>
      <MyTable
        data={isFiltered ? filteredList : resourceListResponse?.data ?? []}
        totalCount={isFiltered ? filteredTotal : totalCount}
        columns={tableColumns}
        rowClassName={isSelected}
        onRowClick={rowData => setResource(rowData)}
        filters={filters()}
        loading={isFetching}
       page={isFiltered ? filterPagination.page : pageIndex}
        rowsPerPage={isFiltered ? filterPagination.size : rowsPerPage}
        onPageChange={handlePageChange}
        onRowsPerPageChange={e => {
          const newSize = Number(e.target.value);

          if (isFiltered) {
            setFilterPagination({ ...filterPagination, size: newSize, page: 0 });
            handleFilterChange(recordOfFilter.filter, recordOfFilter.value, 0, newSize);
          } else {
            setPaginationParams({
              ...paginationParams,
              size: newSize,
              page: 0,
              timestamp: Date.now()
            });
          }
        }}
        tableButtons={
          <div className="container-of-add-new-button">
        <MyButton
          prefixIcon={() => <AddOutlineIcon />}
          color="var(--deep-blue)"
              onClick={() => {
                setResource({ ...newResource });
                setOpenAddEditResource(true);
              }}
          width="109px"
        >
          Add New
        </MyButton>
      </div>}
      />
      {resourceAvailabilityDetails && (
        <NewAvailabilityTimeModal
          open={openAvailabilityTimePopup}
          setOpen={setOpenAvailabilityTimePopup}
          selectedResource={resourceAvailabilityDetails}
        />
      )}

      <AddEditResources
        open={openAddEditResource}
        setOpen={setOpenAddEditResource}
        resource={resource}
        setResource={setResource}
        handleAddNew={handleAddNew}
        handleUpdate={handleUpdate}
        width={width}
      />

      <DeletionConfirmationModal
        open={openConfirmDeleteResourceModal}
        setOpen={setOpenConfirmDeleteResourceModal}
        itemToDelete="Resource"
        actionButtonFunction={handleDeactiveReactivateResource}
        actionType={stateOfDeleteModal}
      />
    </Panel>
  );
};

export default Resources;
