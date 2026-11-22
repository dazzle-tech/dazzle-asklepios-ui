import DeletionConfirmationModal from "@/components/DeletionConfirmationModal";
import MyButton from "@/components/MyButton/MyButton";
import MyTable from "@/components/MyTable";
import MyModal from '@/components/MyModal/MyModal';
import Translate from "@/components/Translate";
import { setDivContent, setPageCode } from "@/reducers/divSlice";
import { useEnumOptions } from "@/services/enumsApi";
import { useGetAllFacilitiesQuery } from "@/services/security/facilityService";
import {
  useCreatePractitionerMutation,
  useGetAllPractitionersQuery,
  useTogglePractitionerActiveMutation,
  useUpdatePractitionerMutation
} from "@/services/setup/practitioner/PractitionerService";
import { newPractitioner } from "@/types/model-types-constructor-new";
import { Practitioner } from "@/types/model-types-new";
import { formatEnumString } from "@/utils";
import { notify } from "@/utils/uiReducerActions";
import AddOutlineIcon from "@rsuite/icons/AddOutline";
import React, { useEffect, useState } from "react";
import { FaUndo } from "react-icons/fa";
import { MdDelete, MdModeEdit } from "react-icons/md";
import { useDispatch } from "react-redux";
import { Panel, Tooltip, Whisper } from "rsuite";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClipboardList } from '@fortawesome/free-solid-svg-icons';
import PolicyAssignmentManager from '@/components/PolicyAssignment';
import AddEditPractitioner from "./AddEditPractitioner";
import "./styles.less";
import { useGetLovValuesByCodeQuery } from "@/services/setupService";
import TranslationModal from "@/components/TranslationModal";

const Practitioners = () => {
  const dispatch = useDispatch();

  // ──────────────────────────── STATE ────────────────────────────
  const [practitioner, setPractitioner] = useState<Practitioner>({
    ...newPractitioner,
  });

  const [width, setWidth] = useState<number>(window.innerWidth);
  const [openAddEditPractitioner, setOpenAddEditPractitioner] =
    useState<boolean>(false);
  const [
    openConfirmDeletePractitionerModal,
    setOpenConfirmDeletePractitionerModal,
  ] = useState<boolean>(false);
  const [stateOfDeleteModal, setStateOfDeleteModal] =
    useState<string>("deactivate");
  const [openPolicyAssignmentModal, setOpenPolicyAssignmentModal] = useState<boolean>(false);
  const [showTranslationModal, setShowTranslationModal] = useState<boolean>(false);
  const [selectedPractitionerForPolicyAssignment, setSelectedPractitionerForPolicyAssignment] =
    useState<Practitioner | null>(null);
  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 15,
    sort: "id,asc",
    timestamp: Date.now(),
  });
  const [sortColumn, setSortColumn] = useState("id");
  const [sortType, setSortType] = useState<"asc" | "desc">("asc");



  // ──────────────────────────── DATA ────────────────────────────
  // Header filters: draft values typed in the inputs, applied on Enter / select change.
  // Everything is sent to one endpoint and combined with AND.
  const emptyHeaderFilters = { facilityId: '', name: '', specialty: '', jobRole: '', linkedToUser: '' };
  type HeaderFilterField = keyof typeof emptyHeaderFilters;
  const [headerFilters, setHeaderFilters] = useState(emptyHeaderFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyHeaderFilters);
  // 'all' sends no isActive param
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | 'all'>('active');
  const activeFilter = statusFilter === 'all' ? undefined : statusFilter === 'active';

  const { data: practitionerListResponse, isFetching } = useGetAllPractitionersQuery({
    ...paginationParams,
    ...appliedFilters,
    isActive: activeFilter
  });
  const { data: allFacilities = [] } = useGetAllFacilitiesQuery(null);
  const [createPractitioner] = useCreatePractitionerMutation();
  const [updatePractitioner] = useUpdatePractitionerMutation();
  const [togglePractitionerActive] = useTogglePractitionerActiveMutation();
  const specility = useEnumOptions('Specialty');
  const jobRole = useEnumOptions('JobRole');
  const totalCount = practitionerListResponse?.totalCount ?? 0;
  const pageIndex = paginationParams.page;
  const rowsPerPage = paginationParams.size;

  // ──────────────────────────── EFFECTS ────────────────────────────
  useEffect(() => {
    const divContent = (
      "Practitioners"
    );
    dispatch(setPageCode("Practitioners"));
    dispatch(setDivContent(divContent));
    return () => {
      dispatch(setPageCode(""));
      dispatch(setDivContent(""));
    };
  }, [dispatch]);

  // Changing the status filter starts again from the first page
  useEffect(() => {
    setPaginationParams(prev => ({ ...prev, page: 0 }));
  }, [statusFilter]);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ──────────────────────────── HEADER FILTERS ────────────────────────────
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

  const headerSelect = (field: HeaderFilterField, options: { label: string; value: string }[]) => ({
    ...headerSearch(field),
    searchType: 'select' as const,
    searchOptions: [{ label: 'All', value: '' }, ...options]
  });

  const facilityOptions = (allFacilities ?? []).map((f: any) => ({ label: f.name, value: String(f.id) }));

  //_________________________SORT LOGIC______________________
  const handleSortChange = (sortColumn: string, sortType: "asc" | "desc") => {
    setSortColumn(sortColumn);
    setSortType(sortType);

    const sortValue = `${sortColumn},${sortType}`;

    setPaginationParams({
      ...paginationParams,
      sort: sortValue,
      page: 0,
      timestamp: Date.now(),
    });
  };

  const PRACTITIONER_ERROR_MAP: Record<string, string> = {
    "error.userexists": "User already exists",
  };


    // ──────────────────────────── CRUD HANDLERS ────────────────────────────
  const handleAddNew = async () => {
    try {
      const payload = {
        facilityId: practitioner.facilityId,
        firstName: practitioner.firstName,
        lastName: practitioner.lastName,
        email: practitioner.email,
        phoneNumber: practitioner.phoneNumber,
        specialty: practitioner.specialty,
        subSpecialty: practitioner.subSpecialty,
        defaultMedicalLicense: practitioner.defaultMedicalLicense,
        secondaryMedicalLicense: practitioner.secondaryMedicalLicense,
        educationalLevel: practitioner.educationalLevel,
        appointable: practitioner.appointable,
        userId: practitioner.userId,
        defaultLicenseValidUntil: practitioner.defaultLicenseValidUntil,
        secondaryLicenseValidUntil: practitioner.secondaryLicenseValidUntil,
        dateOfBirth: practitioner.dateOfBirth,
        jobRole: practitioner.jobRole,
        gender: practitioner.gender?.toUpperCase(),
        isActive: practitioner.isActive,
        parallelCapacityValue: practitioner.parallelCapacityValue ?? 1,
        defaultDurationMinutes: practitioner?.defaultDurationMinutes,
        defaultBufferBeforeMinutes: practitioner.defaultBufferBeforeMinutes ?? 0,
        defaultBufferAfterMinutes: practitioner.defaultBufferAfterMinutes ?? 0,
        workingDays: practitioner.workingDays ?? [],
        nationalNumber:practitioner.nationalNumber
        
      };

      const Response = await createPractitioner(payload).unwrap();

      dispatch(
        notify({ msg: "Practitioner added successfully", sev: "success" })
      );
      setShowTranslationModal(true)
      setPaginationParams({ ...paginationParams, timestamp: Date.now() });
      setPractitioner({ ...Response });

    } catch (error: any) {
      console.log("FULL ERROR:", error);

      const data = error?.data ?? {};

      if (Array.isArray(data?.fieldErrors) && data.fieldErrors.length > 0) {
        const messages = data.fieldErrors
          .map((fe: any) => `${fe.field}: ${fe.message}`)
          .join("\n");

        dispatch(notify({ msg: messages, sev: "error" }));
        return;
      }

let backendKey = data?.properties?.message;

if (!backendKey && typeof data?.properties === "string") {
  const match = data.properties.match(/message=([^,}]+)/);
  backendKey = match?.[1];
}

if (!backendKey && typeof data?.message === "string") {
  backendKey = data.message;
}

if (!backendKey && typeof error === "string") {
  const match = error.match(/error\.[a-zA-Z0-9]+/);
  backendKey = match?.[0];
}

      // 🟩 mapping
      if (backendKey && PRACTITIONER_ERROR_MAP[backendKey]) {
        dispatch(
          notify({
            msg: PRACTITIONER_ERROR_MAP[backendKey],
            sev: "error",
          })
        );
        return;
      }

      // 🟦 fallback
      dispatch(
        notify({
          msg:
            backendKey ||
            data?.detail ||
            data?.title ||
            "Something went wrong",
          sev: "error",
        })
      );
    }
  };

  const handleUpdate = async () => {
    try {
      const payload = {
        id: practitioner.id,
        facilityId: practitioner.facilityId,
        firstName: practitioner.firstName,
        lastName: practitioner.lastName,
        email: practitioner.email || null,
        phoneNumber: practitioner.phoneNumber || null,
        specialty: practitioner.specialty,
        subSpecialty: practitioner.subSpecialty || null,
        defaultMedicalLicense: practitioner.defaultMedicalLicense || null,
        secondaryMedicalLicense:
          practitioner.secondaryMedicalLicense || null,
        educationalLevel: practitioner.educationalLevel || null,
        appointable: practitioner.appointable,
        userId: practitioner.userId || null,
        defaultLicenseValidUntil:
          practitioner.defaultLicenseValidUntil || null,
        secondaryLicenseValidUntil:
          practitioner.secondaryLicenseValidUntil || null,
        dateOfBirth: practitioner.dateOfBirth || null,
        jobRole: practitioner.jobRole || null,
        gender: practitioner.gender?.toUpperCase() || null,
        isActive: practitioner.isActive,
        parallelCapacityValue: practitioner.parallelCapacityValue ?? 1,
        defaultDurationMinutes: practitioner?.defaultDurationMinutes,
        defaultBufferBeforeMinutes: practitioner.defaultBufferBeforeMinutes ?? 0,
        defaultBufferAfterMinutes: practitioner.defaultBufferAfterMinutes ?? 0,
        workingDays: practitioner.workingDays ?? [],
        nationalNumber:practitioner?.nationalNumber
      };

      await updatePractitioner(payload).unwrap();

      dispatch(
        notify({ msg: "Practitioner updated successfully", sev: "success" })
      );
      setShowTranslationModal(true)
      setPaginationParams({ ...paginationParams, timestamp: Date.now() });

    } catch (error: any) {
      console.log("FULL ERROR:", error);

      const data = error?.data ?? {};

      // 🟥 validation errors
      if (Array.isArray(data?.fieldErrors) && data.fieldErrors.length > 0) {
        const messages = data.fieldErrors
          .map((fe: any) => `${fe.field}: ${fe.message}`)
          .join("\n");

        dispatch(notify({ msg: messages, sev: "error" }));
        return;
      }

      // 🟨 extract message (object أو string)
      let backendKey = data?.properties?.message;

      if (!backendKey && typeof data?.properties === "string") {
        const match = data.properties.match(/message=([^,}]+)/);
        backendKey = match?.[1];
      }

      // 🟩 mapping
      if (backendKey && PRACTITIONER_ERROR_MAP[backendKey]) {
        dispatch(
          notify({
            msg: PRACTITIONER_ERROR_MAP[backendKey],
            sev: "error",
          })
        );
        return;
      }

      // 🟦 fallback
      dispatch(
        notify({
          msg:
            backendKey ||
            data?.detail ||
            data?.title ||
            "Something went wrong",
          sev: "error",
        })
      );
    }
  };

  const handleToggleActive = async (id: number) => {
    try {
      await togglePractitionerActive(id).unwrap();
      dispatch(notify({ msg: "Status updated successfully", sev: "success" }));
      setPaginationParams({ ...paginationParams, timestamp: Date.now() });
    } catch {
      dispatch(notify({ msg: "Failed to update status", sev: "error" }));
    }
  };

  const handleDeactiveReactivatePractitioner = () => {
    handleToggleActive(practitioner.id);
    setOpenConfirmDeletePractitionerModal(false);
  };

  // ──────────────────────────── TABLE LOGIC ────────────────────────────
  const isSelected = (rowData: Practitioner) =>
    rowData?.id === practitioner?.id ? "selected-row" : "";

  const iconsForActions = (rowData: Practitioner) => (
    <div className="container-of-icons">
      <MdModeEdit
        title="Edit"
        size={24}
        fill="var(--primary-gray)"
        className="icons-style"
        onClick={() => {
          setPractitioner(rowData);
          setOpenAddEditPractitioner(true);
        }}
      />
      {rowData?.isActive ? (
        <MdDelete
          title="Deactivate"
          size={24}
          fill="var(--primary-pink)"
          className="icons-style"
          onClick={() => {
            setPractitioner(rowData);
            setStateOfDeleteModal("deactivate");
            setOpenConfirmDeletePractitionerModal(true);
          }}
        />
      ) : (
        <FaUndo
          title="Activate"
          size={24}
          fill="var(--primary-gray)"
          className="icons-style"
          onClick={() => {
            setPractitioner(rowData);
            setStateOfDeleteModal("reactivate");
            setOpenConfirmDeletePractitionerModal(true);
          }}
        />
      )}
      <FontAwesomeIcon
        icon={faClipboardList}
        title="Policy Assignment"
        className="icons-style"
        style={{ color: 'var(--deep-blue)', cursor: 'pointer' }}
        size="lg"
        onClick={() => {
          setSelectedPractitionerForPolicyAssignment(rowData);
          setOpenPolicyAssignmentModal(true);
        }}
      />
    </div>
  );

  const { data: subSpecialityLovQueryResponse } = useGetLovValuesByCodeQuery('PRACT_SUB_SPECIALTY');

  const tableColumns = [
    {
      key: "facilityName", title: <Translate>Facility</Translate>, width: 200,
      ...headerSelect('facilityId', facilityOptions),
      render: (rowData) => <p>{rowData?.facility?.name}</p>

    },
    // Name filter matches the first or the last name
    { key: "firstName", title: <Translate>First Name</Translate>, width: 160, ...headerSearch('name', 'Name') },
    { key: "lastName", title: <Translate>Last Name</Translate>, flexGrow: 3 },
    {
      key: "specialty",
      title: <Translate>Specialty</Translate>,
      width: 170,
      ...headerSelect('specialty', specility ?? []),
      render: (rowData) => {
        const isSpecialist = rowData?.specialty === "SPECIALIST";

        const list = subSpecialityLovQueryResponse?.object ?? [];
        const matched = list.find((x) => x.key === rowData?.subSpecialty);
        const subSpecName = matched?.lovDisplayVale ?? "No Sub Specialty";

        
        return (
          <div style={{ display: "inline-block", position: "relative" }}>
            <Whisper
              placement="topStart" 
              trigger={isSpecialist ? "hover" : "none"}
              speaker={
                isSpecialist ? (
                  <Tooltip>
                    {subSpecName}
                  </Tooltip>
                ) : null
              }
            >
              <span
                style={{
                  cursor: isSpecialist ? "pointer" : "default",
                  display: "inline-block",
                  padding: "2px 4px"
                }}
              >
                {formatEnumString(rowData?.specialty)}
              </span>
            </Whisper>
          </div>
        );
      },
    },
    {
      key: "jobRole", title: <Translate>Job Role</Translate>, width: 170,
      ...headerSelect('jobRole', jobRole ?? []),
      render: (rowData) => <p>{formatEnumString(rowData?.jobRole)}</p>,
    },
    {
      key: "userId", title: <Translate>Linked to User</Translate>, width: 140,
      ...headerSelect('linkedToUser', [
        { label: "Yes", value: "true" },
        { label: "No", value: "false" },
      ]),
      render: (rowData) => <p>{rowData?.userId ? "Yes" : "No"}</p>
    },
    {
      key: "isActive",
      title: <Translate>Status</Translate>,
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
      render: (rowData: Practitioner) => (
        <p>{rowData?.isActive ? "Active" : "Inactive"}</p>
      ),
    },
    {
      key: "icons",
      title: "",
      flexGrow: 2,
      render: (rowData: Practitioner) => iconsForActions(rowData),
    },
  ];

  // ──────────────────────────── RENDER ────────────────────────────

          // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';


  return (
    <Panel dir={dir}>


      <MyTable
        data={practitionerListResponse?.data ?? []}
        totalCount={totalCount}
        columns={tableColumns}
        rowClassName={isSelected}
        onRowClick={(rowData) => setPractitioner(rowData)}
        loading={isFetching}
        page={pageIndex}
        rowsPerPage={rowsPerPage}
        onPageChange={(_: unknown, newPage: number) => {
          setPaginationParams(prev => ({ ...prev, page: newPage, timestamp: Date.now() }));
        }}
        onRowsPerPageChange={(e) => {
          const newSize = Number(e.target.value);
          setPaginationParams({
            ...paginationParams,
            size: newSize,
            page: 0,
            timestamp: Date.now(),
          });
        }}
        sortColumn={sortColumn}
        sortType={sortType}
        onSortChange={handleSortChange}

        tableButtons={<div className="container-of-add-new-button">
          <MyButton
            prefixIcon={() => <AddOutlineIcon />}
            color="var(--deep-blue)"
            onClick={() => {
              setPractitioner({ ...newPractitioner });
              setOpenAddEditPractitioner(true);
            }}
            width="109px"
          >
            Add New
          </MyButton>
        </div>}
        dontTranslateData 

      />

      <AddEditPractitioner
        open={openAddEditPractitioner}
        setOpen={setOpenAddEditPractitioner}
        practitioner={practitioner}
        setPractitioner={setPractitioner}
        handleAddNew={handleAddNew}
        handleUpdate={handleUpdate}
        width={width}
      />

      <MyModal
        open={openPolicyAssignmentModal}
        setOpen={setOpenPolicyAssignmentModal}
        title="Practitioner Policy Assignment"
        bodyheight="70vh"
        size="70vw"
        hideBack
        hideActionBtn
        content={
          selectedPractitionerForPolicyAssignment ? (
            <PolicyAssignmentManager
              resourceType="PRACTITIONER"
              resourceId={selectedPractitionerForPolicyAssignment.id ?? 0}
              facilityId={selectedPractitionerForPolicyAssignment.facilityId ?? 0}
              showHeader={false}
            />
          ) : null
        }
      />

      <DeletionConfirmationModal
        open={openConfirmDeletePractitionerModal}
        setOpen={setOpenConfirmDeletePractitionerModal}
        itemToDelete="Practitioner"
        actionButtonFunction={handleDeactiveReactivatePractitioner}
        actionType={stateOfDeleteModal}
      />
      <TranslationModal
                    open={showTranslationModal}
                    setOpen={setShowTranslationModal}
                    fields={[
                      {
                        fieldName: 'Full Name',
                        value: practitioner.firstName + " " + practitioner.lastName
                      }
                    ]}
                  />
    </Panel>
  );
};

export default Practitioners;
