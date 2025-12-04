import React, { useEffect, useState } from "react";
import MyModal from "@/components/MyModal/MyModal";
import MyButton from "@/components/MyButton/MyButton";
import MyInput from "@/components/MyInput";
import MyTable from "@/components/MyTable";
import { Form } from "rsuite";
import SectionContainer from "@/components/SectionsoContainer";
import { FaTrash } from "react-icons/fa";
import { useEnumOptions } from "@/services/enumsApi";
import {
    useGetPayorPlansByPayorQuery,
    useCreatePayorPlanMutation,
    useDeletePayorPlanMutation,
    useUpdatePayorPlanMutation,
} from "@/services/setup/payer/PayorPlanService";
import { useAppDispatch } from "@/hooks";
import { hideSystemLoader, notify, showSystemLoader } from "@/utils/uiReducerActions";
import { newPayorPlan } from "@/types/model-types-constructor-new";
import { PayorPlan } from "@/types/model-types-new";
import { MdModeEdit } from "react-icons/md";
import DeletionConfirmationModal from "@/components/DeletionConfirmationModal";
import { formatEnumString } from "@/utils";
import './styles.less';

interface PayorPlanModalProps {
    open: boolean;
    setOpen: (v: boolean) => void;
    payor: any;
}

const PayorPlanModal: React.FC<PayorPlanModalProps> = ({
    open,
    setOpen,
    payor,
}) => {
    const dispatch = useAppDispatch();

    // LOVs
    const planTypes = useEnumOptions("PayorPlanType");
    const itemTypes = useEnumOptions("BillingItemTypes");
    const coverageTypes = useEnumOptions("InsuranceCoverageType");

    // Pagination + Sorting
    const [page, setPage] = useState(0);
    const [size, setSize] = useState(10);
    const [sortColumn, setSortColumn] = useState("id");
    const [sortType, setSortType] = useState<"asc" | "desc">("asc");
    const [selectedRow, setSelectedRow] = useState<any>(null);
    const [openDeleteModal, setOpenDeleteModal] = useState(false);
    const [planToDelete, setPlanToDelete] = useState<number | null>(null);

    const sortValue = `${sortColumn},${sortType}`;

    // Fetch Payor Plans
    const { data: plansResponse, refetch, isFetching } = useGetPayorPlansByPayorQuery(
        {
            payorId: payor?.id,
            page,
            size,
            sort: sortValue,
        },
        { skip: !payor?.id }
    );

    const [createPlan] = useCreatePayorPlanMutation();
    const [deletePlan] = useDeletePayorPlanMutation();
    const [updatePlan] = useUpdatePayorPlanMutation();

    // New plan state
        const [plan, setPlan] = useState<PayorPlan>({
        ...newPayorPlan,
        payorId: payor?.id,
        });


    useEffect(() => {
        if (open) {
            setPlan({
                id: undefined,
                payorId: payor?.id,
                name: "",
                planType: "",
                itemType: "",
                coverageType: "",
                amount: null,
                isActive: true,
            });
            setPage(0);
            refetch();
        }
    }, [open, payor?.id]);

    // Save Handler
    const savePlanHandler = async () => {
    const missingFields: string[] = [];

    if (!plan.name?.trim()) missingFields.push("Plan Name");
    if (!plan.planType) missingFields.push("Plan Type");
    if (!plan.itemType) missingFields.push("Item Type");
    if (!plan.coverageType) missingFields.push("Coverage Type");
    if (plan.amount === null || plan.amount === undefined) missingFields.push("Amount");

    if (missingFields.length > 0) {
        dispatch(
        notify({
            msg: missingFields.map(f => <div>• {f} can't be empty</div>),
            sev: "error",
        })
        );
        return;
    }

    try {
        dispatch(showSystemLoader());

        const payload = {
        id: plan.id,               // مهم للتعديل
        payorId: plan.payorId,
        name: plan.name,
        planType: plan.planType,
        itemType: plan.itemType,
        coverageType: plan.coverageType,
        amount: plan.amount,
        isActive: true,
        };

        if (plan.id) {
        // 🔥 UPDATE MODE:
        await updatePlan(payload).unwrap();

        dispatch(
            notify({
            msg: "Payor Plan updated successfully",
            sev: "success",
            })
        );
        } else {
        // 🔥 CREATE MODE:
        await createPlan(payload).unwrap();

        dispatch(
            notify({
            msg: "Payor Plan saved successfully",
            sev: "success",
            })
        );
        }

        refetch();

        // Reset after save
        setSelectedRow(null);
        setPlan({
        ...newPayorPlan,
        payorId: payor?.id,
        });

    } catch (err) {
        dispatch(
        notify({
            msg: err?.data?.message || "Failed to save Payor Plan",
            sev: "error",
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

    dispatch(notify({ msg: "Payor Plan deleted successfully", sev: "success" }));
    refetch();

  } catch (err) {
    dispatch(
      notify({
        msg: err?.data?.message || "Failed to delete Payor Plan",
        sev: "error",
      })
    );
  } finally {
    dispatch(hideSystemLoader());
    setOpenDeleteModal(false);
    setPlanToDelete(null);
  }
};


    // Sorting Handler
    const handleSortChange = (column: string, type: "asc" | "desc") => {
        setSortColumn(column);
        setSortType(type);
        setPage(0);
    };

    const columns = [
    { key: "name", title: "Plan Name", sortable: true, flexGrow: 1 },
    { key: "planType", title: "Plan Type", sortable: true, flexGrow: 1,
    render: (rowData) => <p>{formatEnumString(rowData?.planType)}</p>,
     },
    { key: "itemType", title: "Item Type", sortable: true, flexGrow: 1,
    render: (rowData) => <p>{formatEnumString(rowData?.itemType)}</p>,
     },
    { key: "coverageType", title: "Coverage Type", sortable: true, flexGrow: 1,
    render: (rowData) => <p>{formatEnumString(rowData?.coverageType)}</p>,
     },
    { key: "amount", title: "Amount", sortable: true, flexGrow: 1 },

    {
        key: "actions",
        title: "",
        flexGrow: 1,
        render: (row: any) => (
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>

            {/* Edit */}
            <MdModeEdit
            size={20}
            color="var(--primary-gray)"
            style={{ cursor: "pointer" }}
            title="Edit"
            onClick={() => {
                setSelectedRow(row);
                setPlan({
                id: row.id,
                payorId: row.payorId,
                name: row.name,
                planType: row.planType,
                itemType: row.itemType,
                coverageType: row.coverageType,
                amount: row.amount,
                isActive: row.isActive,
                });
            }}
            />

            {/* Delete */}
            <FaTrash
            size={18}
            color="var(--primary-pink)"
            style={{ cursor: "pointer" }}
            title="Delete"
            onClick={() => {
                setPlanToDelete(row.id);
                setOpenDeleteModal(true);
            }}
            />


        </div>
        ),
    },
    ];


    const data = plansResponse?.data ?? [];


        const isSelected = (row: any) => {
        return selectedRow && row.id === selectedRow.id ? "selected-row" : "";
        };

    return (
        <MyModal
            open={open}
            setOpen={setOpen}
            title={`Payor Plans — ${payor?.name}`}
            size="60vw"
            bodyheight="75vh"
            content={
                <>
                    <SectionContainer
                        title="Add New Plan"
                        content={
                            <Form fluid layout="inline">
                                <MyInput
                                key={`plan-name-${plan.id ?? "new"}`}
                                fieldLabel="Plan Name"
                                fieldName="name"
                                fieldType="text"
                                record={plan}
                                setRecord={setPlan}
                                column
                                required
                                />
                                <MyInput fieldLabel="Plan Type" fieldName="planType" fieldType="select" selectData={planTypes} selectDataLabel="label" selectDataValue="value" record={plan} setRecord={setPlan} column required/>
                                <MyInput fieldLabel="Item Type" fieldName="itemType" fieldType="select" selectData={itemTypes} selectDataLabel="label" selectDataValue="value" record={plan} setRecord={setPlan} column required/>
                                <MyInput fieldLabel="Coverage Type" fieldName="coverageType" fieldType="select" selectData={coverageTypes} selectDataLabel="label" selectDataValue="value" record={plan} setRecord={setPlan} column required/>
                                <MyInput fieldLabel="Amount" fieldName="amount" fieldType="number" record={plan} setRecord={setPlan} width="120px" column required/>

                            </Form>
                        }
                    />

                        <div className="payor-plan-buttons-handle">
                                                        <MyButton color="var(--deep-blue)" onClick={savePlanHandler} width="110px">
                                                            Save
                                                        </MyButton>
                                                        <MyButton
                                                            color="var(--primary-gray)"
                                                            width="110px"
                                                            onClick={() => {
                                                                setSelectedRow(null);
                                                                setPlan({
                                                                ...newPayorPlan,
                                                                payorId: payor?.id,
                                                                });
                                                            }}
                                                            >
                                                            Clear
                                                        </MyButton>
                        </div>
                    <SectionContainer
                        title="Existing Plans"
                        content={
                            <MyTable
                                data={data}
                                loading={isFetching}
                                columns={columns}
                                totalCount={plansResponse?.totalCount ?? 0}
                                page={page}
                                rowsPerPage={size}
                                onPageChange={(_, newPage) => setPage(newPage)}
                                onRowsPerPageChange={(e: any) => setSize(Number(e.target.value))}
                                sortColumn={sortColumn}
                                sortType={sortType}
                                onSortChange={handleSortChange}
                                rowClassName={isSelected}
                                onRowClick={(row) => setSelectedRow(row)}
                            />
                        }
                    />
                    <DeletionConfirmationModal
                        open={openDeleteModal}
                        setOpen={setOpenDeleteModal}
                        itemToDelete="Payor Plan"
                        actionType="delete"
                        actionButtonFunction={confirmDeleteHandler}
                        />

                </>
            }
            
        />
        
    );
};

export default PayorPlanModal;
