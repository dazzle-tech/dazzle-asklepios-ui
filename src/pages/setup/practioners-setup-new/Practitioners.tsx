import React, { useState, useEffect } from "react";
import Translate from "@/components/Translate";
import { Panel, Form } from "rsuite";
import AddOutlineIcon from "@rsuite/icons/AddOutline";
import { MdModeEdit, MdDelete } from "react-icons/md";
import { FaUndo } from "react-icons/fa";
import { useDispatch } from "react-redux";
import ReactDOMServer from "react-dom/server";
import { setDivContent, setPageCode } from "@/reducers/divSlice";
import MyButton from "@/components/MyButton/MyButton";
import MyTable from "@/components/MyTable";
import MyInput from "@/components/MyInput";
import DeletionConfirmationModal from "@/components/DeletionConfirmationModal";
import AddEditPractitioner from "./AddEditPractitioner";
import { notify } from "@/utils/uiReducerActions";
import {
  useGetAllPractitionersQuery,
  useCreatePractitionerMutation,
  useUpdatePractitionerMutation,
  useTogglePractitionerActiveMutation,
} from "@/services/practitioner/PractitionerService";
import "./styles.less";
import { Practitioner } from "@/types/model-types-new";
import { newPractitioner } from "@/types/model-types-constructor-new";
import { formatEnumString } from "@/utils";
import { extractPaginationFromLink } from "@/utils/paginationHelper";

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
  const [recordOfFilter, setRecordOfFilter] = useState({
    filter: "",
    value: "",
  });
  const [isFiltered, setIsFiltered] = useState(false);
  const [filteredList, setFilteredList] = useState<Practitioner[]>([]);
  const [filteredTotal, setFilteredTotal] = useState<number>(0);

  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 5,
    sort: "id,asc",
    timestamp: Date.now(),
  });

  // ──────────────────────────── DATA ────────────────────────────
  const { data: practitionerListResponse, isFetching } =
    useGetAllPractitionersQuery(paginationParams);

  const [createPractitioner] = useCreatePractitionerMutation();
  const [updatePractitioner] = useUpdatePractitionerMutation();
  const [togglePractitionerActive] = useTogglePractitionerActiveMutation();

  const totalCount = practitionerListResponse?.totalCount ?? 0;
  const links = practitionerListResponse?.links || {};
  const pageIndex = paginationParams.page;
  const rowsPerPage = paginationParams.size;

  // ──────────────────────────── EFFECTS ────────────────────────────
  useEffect(() => {
    const divContent = (
      <div className="page-title">
        <h5><Translate>Practitioners</Translate></h5>
      </div>
    );
    dispatch(setPageCode("Practitioners"));
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
    { label: "Practitioner Name", value: "firstName" },
    { label: "Specialty", value: "specialty" },
    { label: "Job Role", value: "jobRole" },
  ];

  const handleFilterChange = async (field: string, value: string) => {
    if (!value) {
      setIsFiltered(false);
      setFilteredList([]);
      return;
    }

    const data = practitionerListResponse?.data ?? [];
    const filtered = data.filter((item) =>
      String(item[field] ?? "").toLowerCase().includes(value.toLowerCase())
    );
    setFilteredList(filtered);
    setFilteredTotal(filtered.length);
    setIsFiltered(true);
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
        gender: practitioner.gender,
        isActive: practitioner.isActive,
      };

     const Response= await createPractitioner(payload).unwrap();
      dispatch(
        notify({ msg: "Practitioner added successfully", sev: "success" })
      );
      setPaginationParams({ ...paginationParams, timestamp: Date.now() });
      setPractitioner({...Response});
      console.log(Response);
    }   catch (error) {
    console.error("Error updating practitioner:", error);

    
    if (error?.data?.fieldErrors?.length) {
      const messages = error.data.fieldErrors
        .map((fe) => `${fe.field}: ${fe.message}`)
        .join("\n");
      dispatch(notify({ msg: messages, sev: "error" }));
    } else if (error?.data?.detail) {
      dispatch(notify({ msg: error.data.detail, sev: "error" }));
    } else {
      dispatch(notify({ msg: "Failed to update practitioner", sev: "error" }));
    }
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
        gender: practitioner.gender || null,
        isActive: practitioner.isActive,
      };

      await updatePractitioner(payload).unwrap();

      dispatch(
        notify({ msg: "Practitioner updated successfully", sev: "success" })
      );
      setPaginationParams({ ...paginationParams, timestamp: Date.now() });
    } catch (error) {
    console.error("Error updating practitioner:", error);

   
    if (error?.data?.fieldErrors?.length) {
      const messages = error.data.fieldErrors
        .map((fe) => `${fe.field}: ${fe.message}`)
        .join("\n");
      dispatch(notify({ msg: messages, sev: "error" }));
    } else if (error?.data?.detail) {
      dispatch(notify({ msg: error.data.detail, sev: "error" }));
    } else {
      dispatch(notify({ msg: "Failed to update practitioner", sev: "error" }));
    }
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
    </div>
  );

  const tableColumns = [
    { key: "firstName", title: <Translate>First Name</Translate>, flexGrow: 3 },
    { key: "lastName", title: <Translate>Last Name</Translate>, flexGrow: 3 },
    {
      key: "specialty",
      title: <Translate>Specialty</Translate>,
      flexGrow: 3,
      render: (rowData) => <p>{formatEnumString(rowData?.specialty)}</p>,
    },
    { key: "jobRole", title: <Translate>Job Role</Translate>, flexGrow: 3 },
    {
      key: "isActive",
      title: <Translate>Status</Translate>,
      flexGrow: 2,
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

  // ──────────────────────────── PAGINATION ────────────────────────────
  const handlePageChange = (_: unknown, newPage: number) => {
    let targetLink: string | null | undefined = null;

    if (newPage > paginationParams.page && links.next) targetLink = links.next;
    else if (newPage < paginationParams.page && links.prev)
      targetLink = links.prev;
    else if (newPage === 0 && links.first) targetLink = links.first;
    else if (newPage > paginationParams.page + 1 && links.last)
      targetLink = links.last;

    if (targetLink) {
      const { page, size } = extractPaginationFromLink(targetLink);
      setPaginationParams({
        ...paginationParams,
        page,
        size,
        timestamp: Date.now(),
      });
    }
  };

  // ──────────────────────────── FILTER UI ────────────────────────────
  const filters = () => (
    <Form layout="inline" fluid style={{ display: "flex", gap: "10px" }}>
      <MyInput
        selectDataValue="value"
        selectDataLabel="label"
        selectData={filterFields}
        fieldName="filter"
        fieldType="select"
        record={recordOfFilter}
        setRecord={(updatedRecord) => {
          setRecordOfFilter({
            filter: updatedRecord.filter,
            value: "",
          });
        }}
        showLabel={false}
        placeholder="Select Filter"
        searchable={false}
        width="180px"
      />
      <MyInput
        fieldName="value"
        fieldType="text"
        record={recordOfFilter}
        setRecord={setRecordOfFilter}
        showLabel={false}
        placeholder="Enter Value"
      />
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
      <div className="container-of-add-new-button">
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
      </div>

      <MyTable
        data={isFiltered ? filteredList : practitionerListResponse?.data ?? []}
        totalCount={isFiltered ? filteredTotal : totalCount}
        columns={tableColumns}
        rowClassName={isSelected}
        onRowClick={(rowData) => setPractitioner(rowData)}
        filters={filters()}
        loading={isFetching}
        page={pageIndex}
        rowsPerPage={rowsPerPage}
        onPageChange={handlePageChange}
        onRowsPerPageChange={(e) => {
          setPaginationParams({
            ...paginationParams,
            size: Number(e.target.value),
            page: 0,
            timestamp: Date.now(),
          });
        }}
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

      <DeletionConfirmationModal
        open={openConfirmDeletePractitionerModal}
        setOpen={setOpenConfirmDeletePractitionerModal}
        itemToDelete="Practitioner"
        actionButtonFunction={handleDeactiveReactivatePractitioner}
        actionType={stateOfDeleteModal}
      />
    </Panel>
  );
};

export default Practitioners;
