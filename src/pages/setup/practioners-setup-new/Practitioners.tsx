import DeletionConfirmationModal from "@/components/DeletionConfirmationModal";
import MyButton from "@/components/MyButton/MyButton";
import MyInput from "@/components/MyInput";
import MyTable from "@/components/MyTable";
import Translate from "@/components/Translate";
import { setDivContent, setPageCode } from "@/reducers/divSlice";
import { useEnumOptions } from "@/services/enumsApi";
import { useGetAllFacilitiesQuery } from "@/services/security/facilityService";
import {
  useCreatePractitionerMutation,
  useGetAllPractitionersQuery,
  useLazyGetPractitionerByNameQuery,
  useLazyGetPractitionersByFacilityQuery,
  useLazyGetPractitionersBySpecialtyQuery,
  useTogglePractitionerActiveMutation,
  useUpdatePractitionerMutation
} from "@/services/setup/practitioner/PractitionerService";
import { newPractitioner } from "@/types/model-types-constructor-new";
import { Practitioner } from "@/types/model-types-new";
import { formatEnumString } from "@/utils";
import { PaginationPerPage } from "@/utils/paginationPerPage";
import { notify } from "@/utils/uiReducerActions";
import AddOutlineIcon from "@rsuite/icons/AddOutline";
import React, { useEffect, useState } from "react";
import { FaUndo } from "react-icons/fa";
import { MdDelete, MdModeEdit } from "react-icons/md";
import { useDispatch } from "react-redux";
import { Form, Panel } from "rsuite";
import AddEditPractitioner from "./AddEditPractitioner";
import "./styles.less";

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
  const [valueSpecility, setValueSpecility] = useState({ specility: "" });
  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 3,
    sort: "id,asc",
    timestamp: Date.now(),
  });
  const [filterPagination, setFilterPagination] = useState({
    page: 0,
    size: 3,
    sort: "id,asc",
  });

  // ──────────────────────────── DATA ────────────────────────────
  const { data: practitionerListResponse, isFetching } =
    useGetAllPractitionersQuery(paginationParams);
  const { data: allFacilities = [] } = useGetAllFacilitiesQuery(null);
  const [createPractitioner] = useCreatePractitionerMutation();
  const [updatePractitioner] = useUpdatePractitionerMutation();
  const [togglePractitionerActive] = useTogglePractitionerActiveMutation();
  const [getPractitionersByFacility] = useLazyGetPractitionersByFacilityQuery();
  const [getPractitionersBySpecialty] = useLazyGetPractitionersBySpecialtyQuery();
  const [getPractitionerByName] = useLazyGetPractitionerByNameQuery();
  const specility = useEnumOptions('Specialty');
  const [link, setLink] = useState({})
  const totalCount = practitionerListResponse?.totalCount ?? 0;
  const links = practitionerListResponse?.links || {};
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

  useEffect(() => {
    setLink(practitionerListResponse?.links)

  }, [practitionerListResponse?.links])
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ──────────────────────────── FILTER LOGIC ────────────────────────────
  const filterFields = [
    { label: "Specialty", value: "specialty" },
    { label: "Facility", value: "facility" },
    { label: "Name", value: "name" },
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
        sort: filterPagination.sort,
      };

      if (field === "specialty") {
        response = await getPractitionersBySpecialty({ specialty: value, ...params }).unwrap();
      } else if (field === "facility") {
        response = await getPractitionersByFacility({ facilityId: value, ...params }).unwrap();
      } else if (field === "name") {
        response = await getPractitionerByName({ name: value, ...params }).unwrap();
      }

      setFilteredList(response.data ?? []);
      setFilteredTotal(response.totalCount ?? 0);
      setLink(response.links);
      setIsFiltered(true);
      setFilterPagination({ ...filterPagination, page, size: currentSize });
    } catch (error) {
      console.error("Error filtering practitioners:", error);
      dispatch(notify({ msg: "Failed to filter practitioners", sev: "error" }));
      setIsFiltered(false);
    }
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

      const Response = await createPractitioner(payload).unwrap();
      dispatch(
        notify({ msg: "Practitioner added successfully", sev: "success" })
      );
      setPaginationParams({ ...paginationParams, timestamp: Date.now() });
      setPractitioner({ ...Response });
      console.log(Response);
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
    {
      key: "facilityName", title: <Translate>Facility</Translate>, flexGrow: 4,
      render: (rowData) => <p>{rowData?.facility?.name}</p>

    },
    { key: "firstName", title: <Translate>First Name</Translate>, flexGrow: 3 },
    { key: "lastName", title: <Translate>Last Name</Translate>, flexGrow: 3 },
    {
      key: "specialty",
      title: <Translate>Specialty</Translate>,
      flexGrow: 3,
      render: (rowData) => <p>{formatEnumString(rowData?.specialty)}</p>,
    },
    {
      key: "jobRole", title: <Translate>Job Role</Translate>, flexGrow: 3,
      render: (rowData) => <p>{formatEnumString(rowData?.jobRole)}</p>,
    },
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
  const handlePageChange = (event, newPage) => {
    if (isFiltered) {

      handleFilterChange(recordOfFilter.filter, recordOfFilter.value, newPage);
    } else {

      PaginationPerPage.handlePageChange(
        event,
        newPage,
        paginationParams,
        link,
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
        setRecord={(u) => setRecordOfFilter({ filter: u.filter, value: "" })}
        placeholder="Select Filter"
        showLabel={false}
        width="180px"
      />

      {recordOfFilter.filter === "specialty" && (
        <MyInput
          fieldName="value"
          fieldType="select"
          selectData={specility ?? []}
          selectDataLabel="label"
          selectDataValue="value"
          record={recordOfFilter}
          setRecord={(u) => setRecordOfFilter({ ...recordOfFilter, value: u.value })}
          showLabel={false}
          placeholder="Select Specialty"
        />
      )}

      {recordOfFilter.filter === "facility" && (
        <MyInput
          fieldName="value"
          fieldType="select"
          selectData={allFacilities ?? []}
          selectDataLabel="name"
          selectDataValue="id"
          record={recordOfFilter}
          showLabel={false}
          setRecord={(u) => setRecordOfFilter({ ...recordOfFilter, value: u.value })}
          placeholder="Select Facility"
        />
      )}

      {recordOfFilter.filter === "name" && (
        <MyInput
          fieldName="value"
          fieldType="text"
          record={recordOfFilter}
          setRecord={setRecordOfFilter}
          showLabel={false}
          placeholder="Enter Name"
        />
      )}

      {recordOfFilter.filter !== "specialty" && recordOfFilter.filter !== "facility" && recordOfFilter.filter !== "name"
        && (
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
        onClick={() => handleFilterChange(recordOfFilter.filter, recordOfFilter.value)}
      >
        Search
      </MyButton>
    </Form>
  );


  // ──────────────────────────── RENDER ────────────────────────────
  return (
    <Panel>


      <MyTable
        data={isFiltered ? filteredList : practitionerListResponse?.data ?? []}
        totalCount={isFiltered ? filteredTotal : totalCount}
        columns={tableColumns}
        rowClassName={isSelected}
        onRowClick={(rowData) => setPractitioner(rowData)}
        filters={filters()}
        loading={isFetching}
        page={isFiltered ? filterPagination.page : pageIndex}
        rowsPerPage={isFiltered ? filterPagination.size : rowsPerPage}
        onPageChange={handlePageChange}
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
        onRowsPerPageChange={(e) => {
          const newSize = Number(e.target.value);

          if (isFiltered) {
            setFilterPagination({ ...filterPagination, size: newSize, page: 0 });
            handleFilterChange(recordOfFilter.filter, recordOfFilter.value, 0, newSize);
          } else {
            setPaginationParams({
              ...paginationParams,
              size: newSize,
              page: 0,
              timestamp: Date.now(),
            });
          }
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
