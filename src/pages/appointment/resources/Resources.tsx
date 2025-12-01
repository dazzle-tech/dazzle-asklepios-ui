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
import appConfig from "../../../../app-config";

// Resource type definition
type Resource = {
  id?: number;
  resourceType: string;
  resourceKey: string;
  isAllowParallel?: boolean;
  isActive?: boolean;
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
    size: 5,
    sort: "id,asc",
    timestamp: Date.now(),
  });

  // ──────────────────────────── DATA ────────────────────────────
  const { data: resourceListResponse, isFetching } =
    useGetAllResourcesQuery(paginationParams);
  const [createResource] = useCreateResourceMutation();
  const [updateResource] = useUpdateResourceMutation();
  const [toggleResourceActive] = useToggleResourceActiveMutation();
  const [getResourcesByType] = useLazyGetResourcesByTypeQuery();
  const resourceTypeEnum = useEnumOptions("ResourceType");
  const [resourceNamesCache, setResourceNamesCache] = useState<Record<string, string>>({});

  const totalCount = resourceListResponse?.totalCount ?? 0;
  const links = resourceListResponse?.links || {};
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

  // ──────────────────────────── FILTER LOGIC ────────────────────────────
  const filterFields = [
    { label: "Resource Type", value: "resourceType" },
    { label: "Resource Name", value: "resourceName" },
  ];

  const handleFilterChange = async (field: string, value: string) => {
    try {
      if (!field || !value) {
        setIsFiltered(false);
        setFilteredList([]);
        return;
      }

      let response;

      if (field === "resourceType") {
        response = await getResourcesByType({
          resourceType: value,
          page: 0,
          size: paginationParams.size,
          sort: paginationParams.sort,
        }).unwrap();
        setFilteredList(response.data ?? []);
        setFilteredTotal(response.totalCount ?? 0);
        setIsFiltered(true);
      } else if (field === "resourceName") {
        // Filter by resource name - search in the current list
        const allResources = resourceListResponse?.data ?? [];
        const searchTerm = value.toLowerCase().trim();
        
        const filtered = allResources.filter((r: Resource) => {
          const resourceName = getResourceName(r.resourceType, r.resourceKey).toLowerCase();
          return resourceName.includes(searchTerm);
        });
        
        setFilteredList(filtered);
        setFilteredTotal(filtered.length);
        setIsFiltered(true);
      } else {
        setIsFiltered(false);
        return;
      }
    } catch (error) {
      console.error("Error filtering resources:", error);
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
  const handleAddNew = async () => {
    try {
      const payload = {
        resourceType: resource.resourceType,
        resourceKey: resource.resourceKey,
        isAllowParallel: resource.isAllowParallel ?? true,
        isActive: resource.isActive ?? true,
      };

      const Response = await createResource(payload).unwrap();
        dispatch(
        notify({ msg: "Resource added successfully", sev: "success" })
      );
      setPaginationParams({ ...paginationParams, timestamp: Date.now() });
      setResource({ ...Response });
      setOpenAddEditResource(false);
    } catch (error) {
      console.error("Error creating resource:", error);

      if (error?.data?.fieldErrors?.length) {
        const messages = error.data.fieldErrors
          .map((fe) => `${fe.field}: ${fe.message}`)
          .join("\n");
        dispatch(notify({ msg: messages, sev: "error" }));
      } else if (error?.data?.detail) {
        dispatch(notify({ msg: error.data.detail, sev: "error" }));
      } else {
        dispatch(notify({ msg: "Failed to create resource", sev: "error" }));
      }
    }
  };

  const handleUpdate = async () => {
    try {
      const payload = {
        resourceType: resource.resourceType,
        resourceKey: resource.resourceKey,
        isAllowParallel: resource.isAllowParallel ?? true,
        isActive: resource.isActive ?? true,
      };

      await updateResource({ id: resource.id!, ...payload }).unwrap();

      dispatch(
        notify({ msg: "Resource updated successfully", sev: "success" })
      );
      setPaginationParams({ ...paginationParams, timestamp: Date.now() });
      setOpenAddEditResource(false);
    } catch (error) {
      console.error("Error updating resource:", error);

      if (error?.data?.fieldErrors?.length) {
        const messages = error.data.fieldErrors
          .map((fe) => `${fe.field}: ${fe.message}`)
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

  // ──────────────────────────── RESOURCE NAME FETCHING ────────────────────────────
  // Fetch resource names for all resources in the current page - Static implementation
  useEffect(() => {
    const fetchResourceNames = async () => {
      if (!resourceListResponse?.data) return;

      const resourcesToFetch = resourceListResponse.data.filter(
        (r: Resource) => {
          const cacheKey = `${r.resourceType}_${r.resourceKey}`;
          return r.resourceType && r.resourceKey && !resourceNamesCache[cacheKey];
        }
      );

      if (resourcesToFetch.length === 0) return;

      const newNames: Record<string, string> = {};
      const baseURL = appConfig.backendBaseURL || 'http://localhost:8080';
      const jwt = localStorage.getItem('id_token') || localStorage.getItem('token');

      await Promise.all(
        resourcesToFetch.map(async (r: Resource) => {
          try {
            let endpoint = '';
            let name = '';

            // Static switch statement - easy to read and edit
            switch (r.resourceType) {
              case 'PRACTITIONER':
                endpoint = `/api/setup/practitioner/${r.resourceKey}`;
                break;
              case 'MEDICAL_TEST':
                endpoint = `/api/setup/diagnostic-test/${r.resourceKey}`;
                break;
              case 'CLINIC':
                endpoint = `/api/setup/department/${r.resourceKey}`;
                break;
              // case 'INPATIENT_ADMISSION':
              //   endpoint = `/api/setup/inpatient-admission/${r.resourceKey}`;
              //   break;
              // case 'DAY_CASE':
              //   endpoint = `/api/setup/day-case/${r.resourceKey}`;
              //   break;
              // case 'EMERGENCY':
              //   endpoint = `/api/setup/emergency/${r.resourceKey}`;
              //   break;
              // case 'OPERATION':
              //   endpoint = `/api/setup/operation/${r.resourceKey}`;
              //   break;
              default:
                return; // Skip unknown resource types
            }

            if (!endpoint) return;

            const response = await fetch(`${baseURL}${endpoint}`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                ...(jwt && { Authorization: `Bearer ${jwt}` }),
              },
            });

            if (response.ok) {
              const data = await response.json();
              
              if (r.resourceType === 'PRACTITIONER') {
                name = `${data.firstName || ''} ${data.lastName || ''}`.trim() || `Practitioner ${r.resourceKey}`;
              } else if (r.resourceType === 'MEDICAL_TEST') {
                name = data.name || r.resourceKey;
              } else if (r.resourceType === 'CLINIC') {
                name = data.name || r.resourceKey;
              }
              // else if (r.resourceType === 'INPATIENT_ADMISSION') {
              //   name = data.name || r.resourceKey;
              // }

              if (name) {
                newNames[`${r.resourceType}_${r.resourceKey}`] = name;
              }
            }
          } catch (error) {
            console.error(`Error fetching resource name for ${r.resourceType} ${r.resourceKey}:`, error);
          }
        })
      );

      if (Object.keys(newNames).length > 0) {
        setResourceNamesCache((prev) => ({ ...prev, ...newNames }));
      }
    };

    fetchResourceNames();
  }, [resourceListResponse?.data]);

  const getResourceName = (resourceType: string, resourceKey: string): string => {
    const cacheKey = `${resourceType}_${resourceKey}`;
    return resourceNamesCache[cacheKey] || resourceKey;
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
      render: (rowData) => <p>{formatEnumString(rowData?.resourceType)}</p>,
    },
    {
      key: "resourceKey",
      title: <Translate>Resource</Translate>,
      flexGrow: 3,
      render: (rowData: Resource) => (
        <p>{getResourceName(rowData.resourceType, rowData.resourceKey)}</p>
      ),
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
  const handlePageChange = (event: unknown, newPage: number) => {
    PaginationPerPage.handlePageChange(
      event,
      newPage,
      paginationParams,
      links,
      setPaginationParams
    );
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
        setRecord={(u) => setRecordOfFilter({ filter: u.filter, value: "" })}
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
          setRecord={(u) => setRecordOfFilter({ ...recordOfFilter, value: u.value })}
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
        onRowClick={(rowData) => setResource(rowData)}
        filters={filters()}
        loading={isFetching}
        page={pageIndex}
        rowsPerPage={rowsPerPage}
        onPageChange={handlePageChange}
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
