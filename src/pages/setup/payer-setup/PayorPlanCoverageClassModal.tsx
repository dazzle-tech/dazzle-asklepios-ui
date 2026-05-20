import React, { useEffect, useState } from "react";
import MyModal from "@/components/MyModal/MyModal";
import MyButton from "@/components/MyButton/MyButton";
import MyInput from "@/components/MyInput";
import MyTable from "@/components/MyTable";
import { Form } from "rsuite";
import SectionContainer from "@/components/SectionsoContainer";
import { FaTrash } from "react-icons/fa";
import { MdModeEdit } from "react-icons/md";
import { useEnumOptions } from "@/services/enumsApi";
import { useAppDispatch } from "@/hooks";
import { notify, showSystemLoader, hideSystemLoader } from "@/utils/uiReducerActions";
import { newPayorPlanCoverageClass } from "@/types/model-types-constructor-new";
import DeletionConfirmationModal from "@/components/DeletionConfirmationModal";
import { formatEnumString } from "@/utils";
import {
  useGetCoverageClassesByPlanQuery,
  useCreateCoverageClassMutation,
  useUpdateCoverageClassMutation,
  useDeleteCoverageClassMutation
} from "@/services/setup/payer/PayorPlanCoverageClassService";

const PayorPlanCoverageClassModal = ({ open, setOpen, plan }) => {
  const dispatch = useAppDispatch();

  const coverageClassTypes = useEnumOptions("CoverageClassType");

  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [sortColumn, setSortColumn] = useState("id");
  const [sortType, setSortType] = useState("asc");

  const sortValue = `${sortColumn},${sortType}`;

  const { data: coverageClassResponse, refetch, isFetching } = useGetCoverageClassesByPlanQuery(
    { planId: plan?.id, page, size, sort: sortValue },
    { skip: !plan?.id }
  );

  const [createCoverageClass] = useCreateCoverageClassMutation();
  const [updateCoverageClass] = useUpdateCoverageClassMutation();
  const [deleteCoverageClass] = useDeleteCoverageClassMutation();

  const [coverageClass, setCoverageClass] = useState({
    ...newPayorPlanCoverageClass,
    planId: plan?.id
  });

  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [coverageClassToDelete, setCoverageClassToDelete] = useState(null);

  useEffect(() => {
    if (open) {
      setCoverageClass({
        ...newPayorPlanCoverageClass,
        planId: plan?.id
      });
      setPage(0);
      refetch();
    }
  }, [open, plan?.id]);

  const saveCoverageClassHandler = async () => {
    const missing: string[] = [];

    if (!coverageClass.coverageClassType) missing.push("Coverage Class Type");
    if (!coverageClass.coverageClassValue) missing.push("Coverage Class Value");

    if (missing.length > 0) {
      dispatch(
        notify({
          msg: missing.map((m) => <div key={m}>• {m} is required</div>),
          sev: "warning"
        })
      );
      return;
    }

    try {
      dispatch(showSystemLoader());

      const {
        createdDate,
        lastModifiedDate,
        ...cleanCoverageClass
      } = coverageClass;

      const payload = {
        ...cleanCoverageClass,
        planId: plan?.id
      };

      if (coverageClass.id) {
        await updateCoverageClass(payload).unwrap();
        dispatch(notify({ msg: "Coverage class updated", sev: "success" }));
      } else {
        await createCoverageClass(payload).unwrap();
        dispatch(notify({ msg: "Coverage class created", sev: "success" }));
      }

      refetch();
      setCoverageClass({ ...newPayorPlanCoverageClass, planId: plan?.id });
    } catch (err: any) {
      dispatch(
        notify({
          msg: err?.data?.message || "Save failed",
          sev: "error"
        })
      );
    } finally {
      dispatch(hideSystemLoader());
    }
  };

  const confirmDeleteHandler = async () => {
    if (!coverageClassToDelete) return;

    try {
      dispatch(showSystemLoader());
      await deleteCoverageClass(coverageClassToDelete).unwrap();
      dispatch(notify({ msg: "Coverage class deleted", sev: "success" }));
      refetch();
    } catch (err) {
      dispatch(notify({ msg: "Delete failed", sev: "error" }));
    } finally {
      dispatch(hideSystemLoader());
      setOpenDeleteModal(false);
      setCoverageClassToDelete(null);
    }
  };

  const columns = [
    {
      key: "coverageClassType",
      title: "Type",
      sortable: true,
      flexGrow: 1,
      render: (rowData) => <p>{formatEnumString(rowData?.coverageClassType)}</p>
    },
    {
      key: "coverageClassValue",
      title: "Value",
      sortable: true,
      flexGrow: 1
    },
    {
      key: "coverageClassName",
      title: "Name",
      sortable: true,
      flexGrow: 1
    },
    {
      key: "actions",
      title: "",
      flexGrow: 1,
      render: (row) => (
        <div style={{ display: "flex", gap: "12px" }}>
          <MdModeEdit
            size={20}
            color="var(--primary-gray)"
            title="Edit"
            style={{ cursor: "pointer" }}
            onClick={() => {
              setCoverageClass({
                id: row.id,
                planId: row.planId,
                coverageClassType: row.coverageClassType,
                coverageClassValue: row.coverageClassValue,
                coverageClassName: row.coverageClassName ?? "",
                isActive: row.isActive
              });
            }}
          />

          <FaTrash
            size={18}
            color="var(--primary-pink)"
            title="Delete"
            style={{ cursor: "pointer" }}
            onClick={() => {
              setCoverageClassToDelete(row.id);
              setOpenDeleteModal(true);
            }}
          />
        </div>
      )
    }
  ];

  return (
    <>
      <MyModal
        open={open}
        setOpen={setOpen}
        title={`Coverage Classes — ${plan?.name}`}
        size="35vw"
        position="center"
        content={
          <>
            <SectionContainer
              title="Add / Edit Coverage Class"
              content={
                <Form layout="inline">
                  <MyInput
                    fieldLabel="Coverage Class Type"
                    fieldName="coverageClassType"
                    fieldType="select"
                    selectData={coverageClassTypes}
                    selectDataLabel="label"
                    selectDataValue="value"
                    record={coverageClass}
                    setRecord={setCoverageClass}
                    column
                    required
                  />

                  <MyInput
                    fieldLabel="Coverage Class Value"
                    fieldName="coverageClassValue"
                    fieldType="text"
                    record={coverageClass}
                    setRecord={setCoverageClass}
                    column
                    required
                  />

                  <MyInput
                    fieldLabel="Coverage Class Name"
                    fieldName="coverageClassName"
                    fieldType="text"
                    record={coverageClass}
                    setRecord={setCoverageClass}
                    column
                  />
                </Form>
              }
            />

            <div className="payor-plan-buttons-handle">
              <MyButton onClick={saveCoverageClassHandler} color="var(--deep-blue)" width="110px">
                Save
              </MyButton>

              <MyButton
                color="var(--primary-gray)"
                width="110px"
                onClick={() => {
                  setCoverageClass({ ...newPayorPlanCoverageClass, planId: plan?.id });
                }}
              >
                Clear
              </MyButton>
            </div>

            <SectionContainer
              title="Existing Coverage Classes"
              content={
                <MyTable
                  data={coverageClassResponse?.data ?? []}
                  loading={isFetching}
                  columns={columns}
                  totalCount={coverageClassResponse?.totalCount ?? 0}
                  page={page}
                  rowsPerPage={size}
                  onPageChange={(_, newPage) => setPage(newPage)}
                  onRowsPerPageChange={(e) => setSize(Number(e.target.value))}
                  sortColumn={sortColumn}
                  sortType={sortType}
                  onSortChange={(col, type) => {
                    setSortColumn(col);
                    setSortType(type);
                    setPage(0);
                  }}
                />
              }
            />

            <DeletionConfirmationModal
              open={openDeleteModal}
              setOpen={setOpenDeleteModal}
              actionButtonFunction={confirmDeleteHandler}
              itemToDelete="Coverage Class"
              actionType="delete"
            />
          </>
        }
      />
    </>
  );
};

export default PayorPlanCoverageClassModal;