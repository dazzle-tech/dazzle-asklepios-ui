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
import { useLazyGetResourcesWithAvailabilityQuery } from "@/services/appointmentService";
import { initialListRequest } from "@/types/types";
import { Table, TableHead, TableBody, TableRow, TableCell, Box, Typography, CircularProgress, Collapse, IconButton } from "@mui/material";
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
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

  const [getResourceAvailability] = useLazyGetResourcesWithAvailabilityQuery();
  const [expandedResourceAvailability, setExpandedResourceAvailability] = useState<Record<string, any[]>>({});
  const [loadingResources, setLoadingResources] = useState<Record<string, boolean>>({});
  const [expandedFacilities, setExpandedFacilities] = useState<Record<string, boolean>>({});

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
          console.log('Resource Availability Data:', rowData);
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

  const getDayName = (dayOfWeek: number): string => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayOfWeek] || '-';
  };

  const formatTime = (hour: number, minute: number): string => {
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  const fetchResourceAvailability = async (resourceKey: string) => {
    if (expandedResourceAvailability[resourceKey] || loadingResources[resourceKey]) return; 
    
    setLoadingResources(prev => ({ ...prev, [resourceKey]: true }));
    
    try {
      console.log('Fetching availability for resource:', resourceKey);
      const result = await getResourceAvailability({
        ...initialListRequest,
        filters: [{ fieldName: 'resource_key', operator: 'match', value: resourceKey }]
      }).unwrap();
      
      console.log('Availability result:', result);
      
      setExpandedResourceAvailability(prev => ({
        ...prev,
        [resourceKey]: result?.object || []
      }));
    } catch (error) {
      console.error('Error fetching availability:', error);
      setExpandedResourceAvailability(prev => ({
        ...prev,
        [resourceKey]: []
      }));
    } finally {
      setLoadingResources(prev => ({ ...prev, [resourceKey]: false }));
    }
  };

  const toggleFacilityExpand = (facilityKey: string) => {
    setExpandedFacilities(prev => ({
      ...prev,
      [facilityKey]: !prev[facilityKey]
    }));
  };

  const renderExpandedRow = (rowData: Resource) => {
    const resourceKey = rowData.resourceKey;
    const facilitiesData = expandedResourceAvailability[resourceKey];
    const isLoading = loadingResources[resourceKey];
    
    // Trigger fetch if not loaded yet
    if (!facilitiesData && !isLoading) {
      fetchResourceAvailability(resourceKey);
    }
    
    if (isLoading || !facilitiesData) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          <CircularProgress size={24} />
        </Box>
      );
    }

    if (facilitiesData.length === 0) {
      return (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="textSecondary">
            No facilities configured for this resource
          </Typography>
        </Box>
      );
    }

    return (
      <Box sx={{ p: 1 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell sx={{ width: '50px' }} />
              <TableCell sx={{ fontWeight: 600 }}>Facility</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Resource Name</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {facilitiesData.map((facilityData: any, idx: number) => {
              const facilityKey = `${resourceKey}_${facilityData.facilityKey || idx}`;
              const isExpanded = expandedFacilities[facilityKey];
              const availability = facilityData?.availability || [];
              
              return (
                <React.Fragment key={facilityKey}>
                  <TableRow 
                    sx={{ 
                      '&:hover': { backgroundColor: '#fafafa' },
                      cursor: 'pointer'
                    }}
                    onClick={() => toggleFacilityExpand(facilityKey)}
                  >
                    <TableCell sx={{ width: '50px' }}>
                      <IconButton size="small">
                        {isExpanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                      </IconButton>
                    </TableCell>
                    <TableCell>{facilityData.facilityName || facilityData.facilityKey || 'Unknown Facility'}</TableCell>
                    <TableCell>{facilityData.resourceName || '-'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={3} sx={{ p: 0, border: 0 }}>
                      <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                        <Box sx={{ p: 2, backgroundColor: '#fafafa' }}>
                          {availability.length === 0 ? (
                            <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center' }}>
                              No availability configured
                            </Typography>
                          ) : (
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell sx={{ fontWeight: 600, width: '150px' }}>Day</TableCell>
                                  <TableCell sx={{ fontWeight: 600, width: '180px' }}>Time (From - To)</TableCell>
                                  <TableCell sx={{ fontWeight: 600, width: '100px' }}>Duration</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {availability
                                  .slice()
                                  .sort((a: any, b: any) => a.dayOfWeek - b.dayOfWeek)
                                  .map((item: any, idx: number) => (
                                    <TableRow key={idx}>
                                      <TableCell sx={{ fontWeight: 500 }}>
                                        {getDayName(item.dayOfWeek)}
                                      </TableCell>
                                      <TableCell>
                                        {formatTime(item.startHour, item.startMinute)} - {formatTime(item.endHour, item.endMinute)}
                                      </TableCell>
                                      <TableCell>
                                        {item.slotDurationMinutes ? `${item.slotDurationMinutes} min` : '-'}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                              </TableBody>
                            </Table>
                          )}
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </Box>
    );
  };

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
        renderExpandedRow={renderExpandedRow}
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
          onSave={() => {
            const resourceKey = resourceAvailabilityDetails?.object?.[0]?.key;
            if (resourceKey) {
              setExpandedResourceAvailability(prev => {
                const newState = { ...prev };
                delete newState[resourceKey];
                return newState;
              });
            }
          }}
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
