import React, { useState, useEffect } from "react";
import "./styles.less";
import Translate from "@/components/Translate";
import MyTable from "@/components/MyTable";
import MyButton from "@/components/MyButton/MyButton";
import { Panel, Form } from "rsuite";
import AddOutlineIcon from "@rsuite/icons/AddOutline";
import CloseOutlineIcon from "@rsuite/icons/CloseOutline";
import { Checkbox } from "rsuite";
import CancellationModal from "@/components/CancellationModal";
import AddEditReferralRequest from "./AddEditReferralRequest";
import ReferralRequestPreview from "./ReferralRequestPreview";
import {
  useGetReferralRequestsByPatientAndEncounterQuery,
  useCreateReferralRequestMutation,
  useUpdateReferralRequestMutation,
}from "@/services/encounters/referralRequestService";
import { useAppDispatch, useAppSelector } from "@/hooks";
import { notify, showSystemLoader, hideSystemLoader } from "@/utils/uiReducerActions";
import { formatDateWithoutSeconds, formatEnumString } from "@/utils";
import { newReferralRequest } from "@/types/model-types-constructor-new";
import { skipToken } from "@reduxjs/toolkit/query";
import { useLocation } from "react-router-dom";
import { useGetDepartmentsQuery } from "@/services/security/departmentService";
import { MdModeEdit } from "react-icons/md";

const ReferralRequest = () => {
  const { state } = useLocation();
  const { patient, encounter } = state || {};

    const selectedFacility = useAppSelector(
      (state) => state.auth?.tenant?.selectedFacility
    );

const patientId = patient?.key ? Number(patient.key) : undefined;
const encounterId = encounter?.key ? Number(encounter.key) : undefined;

  const dispatch = useAppDispatch();

  const [referral, setReferral] = useState<any>({ ...newReferralRequest });
  const [openPopup, setOpenPopup] = useState(false);
  const [openPreview, setOpenPreview] = useState(false);

  const [width, setWidth] = useState(window.innerWidth);
  const [openCancelModal, setOpenCancelModal] = useState(false);
  const [cancelObject, setCancelObject] = useState({});

  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 10,
    sort: "id,desc",
  });

  const [sortColumn, setSortColumn] = useState("id");
  const [sortType, setSortType] = useState<"asc" | "desc">("desc");

  const {
    data: referralListResponse,
    isFetching,
  } = useGetReferralRequestsByPatientAndEncounterQuery(
    patientId && encounterId
      ? {
          patientId,
          encounterId,
          page: paginationParams.page,
          size: paginationParams.size,
          sort: paginationParams.sort,
        }
      : skipToken
  );

  const tableData = referralListResponse?.data ?? [];
  const totalCount = referralListResponse?.totalCount ?? 0;

  const [createReferral] = useCreateReferralRequestMutation();
  const [updateReferral] = useUpdateReferralRequestMutation();


    const handleSave = async () => {
      const requiredFields = {
        referralType: "Referral Type",
        priority: "Priority",
        referralReason: "Referral Reason",
        departmentId: "Department",
      };

      if (referral.referralType === "EXTERNAL") {
        requiredFields["facilityId"] = "Facility";
      }

      const isEmpty = (val: any) =>
        val === null ||
        val === undefined ||
        (typeof val === "string" && val.trim() === "");

      for (const field in requiredFields) {
        if (isEmpty(referral[field])) {
          dispatch(
            notify({
              msg: `${requiredFields[field]}, Can Not Be Empty`,
              sev: "warning",
            })
          );
          return false;
        }
      }

      try {
        dispatch(showSystemLoader());

        const resolvedFacilityId =
          referral.referralType === "INTERNAL"
            ? selectedFacility?.id
            : referral.facilityId;

        const payload = {
          patientId,
          encounterId,
          referralType: referral.referralType,
          facilityId: resolvedFacilityId ? Number(resolvedFacilityId) : null,
          departmentId: referral.departmentId ? Number(referral.departmentId) : null,
          referralReason: referral.referralReason,
          priority: referral.priority,
          approvalNumber: referral.approvalNumber,
          isActive: referral.isActive ?? true,
        };


        if (referral.id) {
          await updateReferral({ ...payload, id: referral.id }).unwrap();
          dispatch(
            notify({ msg: "Referral updated successfully", sev: "success" })
          );
        } else {
          await createReferral(payload).unwrap();
          dispatch(
            notify({ msg: "Referral created successfully", sev: "success" })
          );
        }

        setOpenPopup(false);
        return true;

      } catch (err) {
        dispatch(notify({ msg: "Failed to save referral", sev: "error" }));
        return false;
      } finally {
        dispatch(hideSystemLoader());
      }
    };



  const isSelected = (rowData: any) =>
    rowData?.id === referral?.id ? "selected-row" : "";

const { data: departmentsResponse } = useGetDepartmentsQuery({
  page: 0,
  size: 500,
  sort: "id,asc"
});


const departmentMap = {};
departmentsResponse?.data?.forEach((dep) => {
  departmentMap[dep.id] = dep.name;
});


  const tableColumns = [
    { key: "referralType", title: <Translate>Referral Type</Translate>, flexGrow: 2,
      render: (rowData) => <p>{formatEnumString(rowData?.referralType)}</p>,
     },
    {
      key: "departmentId",
      title: <Translate>Department</Translate>,
      render: (row) => departmentMap[row.departmentId] ?? "-",
      flexGrow: 2
    },
    {
      key: "priority",
      title: <Translate>Priority</Translate>,
      flexGrow: 2,
      render: (rowData) => <p>{formatEnumString(rowData?.priority)}</p>,
    },
    {
      key: "referralReason",
      title: <Translate>Reason</Translate>,
      flexGrow: 3,
    },
    {
      key: "createdBy",
      title: <Translate>Created By/At</Translate>,
      render: (row) => (
        <>
          {row.createdBy}
          <br />
          <span className="date-table-style">
            {formatDateWithoutSeconds(row.createdDate)}
          </span>
        </>
      ),
      flexGrow: 3,
    },
    {
  key: "actions",
  title: <Translate>Actions</Translate>,
  flexGrow: 1,
  align: "center",
  render: (rowData) => (
    <MdModeEdit
      className="icons-style"
      title="Edit"
      size={24}
      fill="var(--primary-gray)"
      onClick={(e) => {
        e.stopPropagation();
        setReferral(rowData);
        setOpenPopup(true);
      }}
    />
  ),
}

  ];

  const handlePageChange = (event, newPage) => {
    setPaginationParams({ ...paginationParams, page: newPage });
  };

  const handleSortChange = (column, type) => {
    const sortValue = `${column},${type}`;
    setSortColumn(column);
    setSortType(type);
    setPaginationParams({ ...paginationParams, sort: sortValue, page: 0 });
  };

  return (
    <Panel>
      <MyTable
        data={tableData}
        totalCount={totalCount}
        loading={isFetching}
        columns={tableColumns}
        rowClassName={isSelected}
        onRowClick={(rowData) => {
          setReferral(rowData);
          setOpenPreview(true);
        }}
        page={paginationParams.page}
        rowsPerPage={paginationParams.size}
        onPageChange={handlePageChange}
        onRowsPerPageChange={(e) => {
          const newSize = Number(e.target.value);
          setPaginationParams({ ...paginationParams, size: newSize, page: 0 });
        }}
        sortColumn={sortColumn}
        sortType={sortType}
        onSortChange={handleSortChange}
        tableButtons={
          <MyButton
            prefixIcon={() => <AddOutlineIcon />}
            color="var(--deep-blue)"
            onClick={() => {
              setReferral({ ...newReferralRequest });
              setOpenPopup(true);
            }}
            width="109px"
          >
            Add New
          </MyButton>
        }
      />

      {/* ADD / EDIT */}
      <AddEditReferralRequest
        open={openPopup}
        setOpen={setOpenPopup}
        referral={referral}
        setReferral={setReferral}
        handleSave={handleSave}
        width={width}
      />

      {openPreview && (
        <ReferralRequestPreview referral={referral} onClose={() => setOpenPreview(false)} />
      )}

      <CancellationModal
        open={openCancelModal}
        setOpen={setOpenCancelModal}
        object={cancelObject}
        setObject={setCancelObject}
        handleCancle={() => {
          setOpenCancelModal(false);
        }}
        title="Cancel Referral"
        fieldLabel="Reason for cancellation"
        fieldName="cancelReason"
      />
    </Panel>
  );
};

export default ReferralRequest;

