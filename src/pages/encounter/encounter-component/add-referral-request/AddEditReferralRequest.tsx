import MyModal from "@/components/MyModal/MyModal";
import React, { useEffect } from "react";
import MyInput from "@/components/MyInput";
import { Form } from "rsuite";
import "./styles.less";
import { FaComment } from "react-icons/fa";
import { useEnumOptions } from "@/services/enumsApi";
import { useGetAllFacilitiesQuery } from "@/services/security/facilityService";
import { useGetDepartmentByFacilityQuery } from "@/services/security/departmentService";
import { useAppSelector } from "@/hooks";
import { skipToken } from "@reduxjs/toolkit/query";

const AddEditReferralRequest = ({ open, setOpen, width, referral, setReferral, handleSave }) => {
  // Enums
  const referralTypeOptions = useEnumOptions("ReferralType");
  const priorityOptions = useEnumOptions("ReferralPriority");

  const selectedFacility = useAppSelector(
    (state) => state.auth?.tenant?.selectedFacility
  );

  console.log("Selected Facility", selectedFacility);

  // Facility list from RTK
  const { data: facilityResponse } = useGetAllFacilitiesQuery({});

  console.log("Facility Response", facilityResponse);

  // Map facilities for select
  const facilityOptions =
    facilityResponse?.map((f) => ({
      label: f.name ?? "",
      value: f.id,
    })) ?? [];

  console.log("Facility Options", facilityOptions);



  const facilityIdForDepartments = referral.referralType === "INTERNAL"
    ? selectedFacility?.id
    : referral.facilityId;  // EXTERNAL: depends on selected external facility

  // Fetch departments dynamically
  const {
    data: departmentResponse,
    isFetching: isDeptLoading,
  } = useGetDepartmentByFacilityQuery(
    facilityIdForDepartments
      ? { facilityId: facilityIdForDepartments, page: 0, size: 100 }
      : skipToken
  );


  const departmentOptions =
    departmentResponse?.data?.map((d) => ({
      label: d.name,
      value: d.id,
    })) ?? [];


useEffect(() => {
  if (referral.referralType === "INTERNAL" && selectedFacility?.id) {
    setReferral(prev => ({
      ...prev,
      facilityId: selectedFacility.id
    }));
  }
}, [referral.referralType, selectedFacility]);

useEffect(() => {
  if (referral.referralType === "EXTERNAL") {
    setReferral(prev => ({
      ...prev,
      facilityId: null,
    }));
  }
}, [referral.referralType]);



  const conjureFormContent = () => {
    return (
      <Form fluid>
        {/* Referral Type */}
        <MyInput
          width="100%"
          fieldName="referralType"
          fieldType="select"
          selectData={referralTypeOptions ?? []}
          selectDataLabel="label"
          selectDataValue="value"
          record={referral}
          setRecord={setReferral}
          required
        />

      {referral.referralType === "INTERNAL" ? (
        <div style={{ width: "100%" }}>
          <label className="my-label">Facility</label>
          <input
            className="rs-input rs-input-disabled"
            style={{ width: "100%" }}
            value={selectedFacility?.name || ""}
            disabled
          />
        </div>
      ) : (
        <MyInput
          width="100%"
          fieldName="facilityId"
          fieldLabel="External Facility"
          fieldType="select"
          selectData={facilityOptions}
          selectDataLabel="label"
          selectDataValue="value"
          record={referral}
          setRecord={setReferral}
          required
        />
      )}



          <MyInput
            width="100%"
            fieldName="departmentId"
            fieldLabel="Department"
            fieldType="select"
            selectData={departmentOptions}
            selectDataLabel="label"
            selectDataValue="value"
            record={referral}
            setRecord={setReferral}
            loading={isDeptLoading}
            required
          />

          <MyInput
            width="100%"
            fieldName="priority"
            fieldType="select"
            selectData={priorityOptions ?? []}
            selectDataLabel="label"
            selectDataValue="value"
            record={referral}
            setRecord={setReferral}
            required
          />


          <MyInput
            width="100%"
            fieldName="referralReason"
            fieldLabel="Referral Reason"
            fieldType="textarea"
            record={referral}
            setRecord={setReferral}
            required
          />

      </Form>
    );
  };

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={referral?.id ? "Edit Referral Request" : "New Referral Request"}
      position="right"
      content={conjureFormContent}
      actionButtonLabel={referral?.id ? "Save" : "Create"}
      actionButtonFunction={handleSave}
      steps={[{ title: "Referral Request Info", icon: <FaComment /> }]}
      size={width > 600 ? "36vw" : "70vw"}
    />
  );
};

export default AddEditReferralRequest;
