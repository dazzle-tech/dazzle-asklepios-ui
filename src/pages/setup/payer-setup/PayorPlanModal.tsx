import React, { useEffect, useState } from "react";
import MyModal from "@/components/MyModal/MyModal";
import MyButton from "@/components/MyButton/MyButton";
import MyInput from "@/components/MyInput";
import MyTable from "@/components/MyTable";
import { Form } from "rsuite";
import SectionContainer from "@/components/SectionsoContainer";
import { FaTrash } from "react-icons/fa";
import { MdModeEdit } from "react-icons/md";
import { FaClipboardList, FaLayerGroup } from "react-icons/fa6";
import { useEnumOptions } from "@/services/enumsApi";
import {
  useGetPlansByPayorQuery,
  useCreatePlanMutation,
  useDeletePlanMutation,
  useUpdatePlanMutation
} from "@/services/setup/payer/PayorPlanService";

import { useAppDispatch } from "@/hooks";
import { notify, showSystemLoader, hideSystemLoader } from "@/utils/uiReducerActions";
import { newPayorPlan } from "@/types/model-types-constructor-new";
import DeletionConfirmationModal from "@/components/DeletionConfirmationModal";
import PlanItemsModal from "./PlanItemsModal";
import PayorPlanCoverageClassModal from "./PayorPlanCoverageClassModal";
import "./styles.less";
import { formatEnumString } from "@/utils";

const PayorPlanModal = ({ open, setOpen, payor }) => {
  const dispatch = useAppDispatch();

  const planTypes = useEnumOptions("PayorPlanType");
const coverageTypes = useEnumOptions("CoverageType");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [sortColumn, setSortColumn] = useState("id");
  const [sortType, setSortType] = useState("asc");

  const sortValue = `${sortColumn},${sortType}`;

  const { data: plansResponse, refetch, isFetching } = useGetPlansByPayorQuery(
    { payorId: payor?.id, page, size, sort: sortValue },
    { skip: !payor?.id }
  );

  const [createPlan] = useCreatePlanMutation();
  const [deletePlan] = useDeletePlanMutation();
  const [updatePlan] = useUpdatePlanMutation();

  const [plan, setPlan] = useState({ ...newPayorPlan, payorId: payor?.id });

  const [selectedRow, setSelectedRow] = useState(null);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [planToDelete, setPlanToDelete] = useState(null);

  const [openItemsModal, setOpenItemsModal] = useState(false);
  const [selectedPlanForItems, setSelectedPlanForItems] = useState(null);

  const [openCoverageClassModal, setOpenCoverageClassModal] = useState(false);
  const [selectedPlanForCoverageClass, setSelectedPlanForCoverageClass] = useState(null);

  useEffect(() => {
    if (open) {
      setPlan({
        ...newPayorPlan,
        payorId: payor?.id
      });
      setPage(0);
      refetch();
    }
  }, [open, payor?.id]);

  const savePlanHandler = async () => {
    const missing: string[] = [];
    if (!plan.name) missing.push("Plan Name");
    if (!plan.planType) missing.push("Plan Type");

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
        ...cleanPlan
      } = plan;

      const payload = {
        ...cleanPlan,
        payorId: payor?.id
      };

      if (plan.id) {
        await updatePlan(payload).unwrap();
        dispatch(notify({ msg: "Plan updated", sev: "success" }));
      } else {
        await createPlan(payload).unwrap();
        dispatch(notify({ msg: "Plan created", sev: "success" }));
      }

      refetch();
      setPlan({ ...newPayorPlan, payorId: payor?.id });
      setSelectedRow(null);
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
    if (!planToDelete) return;

    try {
      dispatch(showSystemLoader());
      await deletePlan(planToDelete).unwrap();
      dispatch(notify({ msg: "Plan deleted", sev: "success" }));
      refetch();
    } catch (err) {
      dispatch(notify({ msg: "Delete failed", sev: "error" }));
    } finally {
      dispatch(hideSystemLoader());
      setOpenDeleteModal(false);
      setPlanToDelete(null);
    }
  };

  const columns = [
    { key: "name", title: "Plan Name", sortable: true, flexGrow: 1 },
    {
      key: "planType",
      title: "Plan Type",
      sortable: true,
      flexGrow: 1,
      render: (rowData) => <p>{formatEnumString(rowData?.planType)}</p>
    },
    {
      key: "networkId",
      title: "Network ID",
      sortable: true,
      flexGrow: 1
    },
    {
      key: "coverageType",
      title: "Coverage Type",
      sortable: true,
      flexGrow: 1
    },
    {
      key: "actions",
      title: "",
      flexGrow: 1,
      render: (row) => (
        <div style={{ display: "flex", gap: "12px" }}>
          <FaLayerGroup
            size={20}
            color="var(--primary-gray)"
            title="Coverage Classes"
            style={{ cursor: "pointer" }}
            onClick={() => {
              setSelectedPlanForCoverageClass(row);
              setOpenCoverageClassModal(true);
            }}
          />

          <FaClipboardList
            size={20}
            color="var(--primary-gray)"
            title="Plan Items"
            style={{ cursor: "pointer" }}
            onClick={() => {
              setSelectedPlanForItems(row);
              setOpenItemsModal(true);
            }}
          />

          <MdModeEdit
            size={20}
            color="var(--primary-gray)"
            title="Edit"
            style={{ cursor: "pointer" }}
            onClick={() => {
              setSelectedRow(row);
              setPlan({
                id: row.id,
                payorId: row.payorId,
                name: row.name,
                planType: row.planType,
                networkId: row.networkId ?? "",
                coverageType: row.coverageType ?? "",
                payerNphiesId: row.payerNphiesId ?? "",
                waseelPlanId: row.waseelPlanId ?? "",
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
              setPlanToDelete(row.id);
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
        title={`Payor Plans — ${payor?.name}`}
        size="40vw"
        position="right"
        content={
          <>
            <SectionContainer
              title="Add / Edit Plan"
              content={
                <Form layout="inline">
                  <MyInput
                    fieldLabel="Plan Name"
                    fieldName="name"
                    fieldType="text"
                    record={plan}
                    setRecord={setPlan}
                    column
                    required
                  />

                  <MyInput
                    fieldLabel="Plan Type"
                    fieldName="planType"
                    fieldType="select"
                    selectData={planTypes}
                    selectDataLabel="label"
                    selectDataValue="value"
                    record={plan}
                    setRecord={setPlan}
                    column
                    required
                  />

                  <MyInput
                    fieldLabel="Network ID"
                    fieldName="networkId"
                    fieldType="text"
                    record={plan}
                    setRecord={setPlan}
                    column
                  />

               <MyInput
  fieldLabel="Coverage Type"
  fieldName="coverageType"
  fieldType="select"
  selectData={coverageTypes}
  selectDataLabel="label"
  selectDataValue="value"
  record={plan}
  setRecord={setPlan}
  column
/>

                  <MyInput
                    fieldLabel="Payer NPHIES ID"
                    fieldName="payerNphiesId"
                    fieldType="text"
                    record={plan}
                    setRecord={setPlan}
                    column
                  />

                  <MyInput
                    fieldLabel="Waseel Plan ID"
                    fieldName="waseelPlanId"
                    fieldType="text"
                    record={plan}
                    setRecord={setPlan}
                    column
                  />
                </Form>
              }
            />

            <div className="payor-plan-buttons-handle">
              <MyButton onClick={savePlanHandler} color="var(--deep-blue)" width="110px">
                Save
              </MyButton>

              <MyButton
                color="var(--primary-gray)"
                width="110px"
                onClick={() => {
                  setPlan({ ...newPayorPlan, payorId: payor?.id });
                  setSelectedRow(null);
                }}
              >
                Clear
              </MyButton>
            </div>

            <SectionContainer
              title="Existing Plans"
              content={
                <MyTable
                  data={plansResponse?.data ?? []}
                  loading={isFetching}
                  columns={columns}
                  totalCount={plansResponse?.totalCount ?? 0}
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
              itemToDelete="Payor Plan"
              actionType="delete"
            />
          </>
        }
      />

      {selectedPlanForItems && (
        <PlanItemsModal
          open={openItemsModal}
          setOpen={setOpenItemsModal}
          plan={selectedPlanForItems}
        />
      )}

      {selectedPlanForCoverageClass && (
        <PayorPlanCoverageClassModal
          open={openCoverageClassModal}
          setOpen={setOpenCoverageClassModal}
          plan={selectedPlanForCoverageClass}
        />
      )}
    </>
  );
};

export default PayorPlanModal;