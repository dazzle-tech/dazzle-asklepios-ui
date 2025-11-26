import React, { useEffect, useState } from "react";
import MyModal from "@/components/MyModal/MyModal";
import MyInput from "@/components/MyInput";
import MyButton from "@/components/MyButton/MyButton";
import MyTable from "@/components/MyTable";
import { HiOutlineSwitchHorizontal } from "react-icons/hi";
import { useDispatch } from "react-redux";
import { notify } from "@/utils/uiReducerActions";

import {
  useGetAllBrandMedicationsQuery,
} from "@/services/setup/brandmedication/BrandMedicationService ";

import {
  useCreateBrandMedicationSubstituteMutation,
  useGetBrandMedicationSubstitutesByBrandQuery,
  useDeleteBrandMedicationSubstituteByBrandIdAndAlternativeBrandIdMutation,
} from "@/services/setup/brandmedication/BrandMedicationSubstituteService";

import { newSubstitute } from "@/types/model-types-constructor-new";
import { Form } from "rsuite";

const AddBrandSubstitute = ({ open, setOpen, brandMedication }) => {
  const dispatch = useDispatch();

  // ---------- STATE ----------
  const [substitute, setSubstitute] = useState({ ...newSubstitute });
  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 5,
    sort: "id,asc",
    timestamp: Date.now(),
  });

  // ---------- API ----------
  const { data: allMedications, isFetching: loadingMeds } =
    useGetAllBrandMedicationsQuery(paginationParams);

  const {
    data: substitutesData,
    isFetching: loadingSubs,
    refetch,
  } = useGetBrandMedicationSubstitutesByBrandQuery(brandMedication?.id, {
    skip: !brandMedication?.id,
  });

  const [createSubstitute, { isLoading: creating }] =
    useCreateBrandMedicationSubstituteMutation();
  const [deleteSubstitute] = useDeleteBrandMedicationSubstituteByBrandIdAndAlternativeBrandIdMutation();

  // ---------- EFFECT ----------
  useEffect(() => {
    if (brandMedication?.id) {
      setSubstitute((prev) => ({ ...prev, brandId: brandMedication.id }));
    }
  }, [brandMedication]);

  // ---------- HANDLERS ----------
  const handleAdd = async () => {
    try {
      if (!substitute.alternativeBrandId) {
        dispatch(notify({ msg: "Select a substitute medication", sev: "warning" }));
        return;
      }
      await createSubstitute(substitute).unwrap();
      dispatch(notify({ msg: "Substitute added successfully", sev: "success" }));
      refetch();
      setSubstitute({ ...newSubstitute, brandId: brandMedication.id });
    } catch (err) {
      dispatch(notify({ msg: "Failed to add substitute", sev: "error" }));
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteSubstitute(id).unwrap();
      dispatch(notify({ msg: "Substitute deleted successfully", sev: "success" }));
      refetch();
    } catch {
      dispatch(notify({ msg: "Failed to delete substitute", sev: "error" }));
    }
  };

  // ---------- TABLE CONFIG ----------
  const columns = [
    {
      key: "alternativeName",
      title: "Alternative Name",
      flexGrow: 3,
      render: (rowData) => rowData?.name,
    },
    {
      key: "actions",
      title: "",
      flexGrow: 1,
      render: (rowData) => (
        <MyButton
          color="var(--primary-pink)"
          onClick={() => handleDelete({ brandId: brandMedication.id, alternativeBrandId:rowData.id })}
        >
          Delete
        </MyButton>
      ),
    },
  ];

  // ---------- RENDER ----------
  const modalContent = (
    <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        <Form>
      <MyInput
        fieldName="alternativeBrandId"
        fieldType="select"
        selectData={allMedications?.data ?? []}
        selectDataLabel="name"
        selectDataValue="id"
        record={substitute}
        showLabel
        label="Select Substitute"
        placeholder="Choose substitute medication"
        setRecord={setSubstitute }
        loading={loadingMeds}
      />

      <MyButton
        color="var(--deep-blue)"
        onClick={handleAdd}
        disabled={creating}
        width="150px"
      >
        Add Substitute
      </MyButton>
      </Form>

      <MyTable
        data={substitutesData ?? []}
        columns={columns}
        loading={loadingSubs}
        height={300}
        totalCount={substitutesData?.length ?? 0}
        page={0}
        rowsPerPage={5}
        onPageChange={() => {}}
        onRowsPerPageChange={() => {}}
      />
    </div>
  );

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={`Substitutes for ${brandMedication?.name ?? ""}`}
      content={modalContent}
      steps={[
        { title: "Substitute", icon: <HiOutlineSwitchHorizontal /> },
      ]}
    />
  );
};

export default AddBrandSubstitute;
