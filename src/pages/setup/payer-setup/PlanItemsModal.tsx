import React, { useEffect, useState } from "react";
import MyModal from "@/components/MyModal/MyModal";
import MyTable from "@/components/MyTable";
import MyButton from "@/components/MyButton/MyButton";
import MyInput from "@/components/MyInput";
import { Form } from "rsuite";
import {
    useGetItemsByPlanQuery,
    useCreatePlanItemMutation,
    useUpdatePlanItemMutation,
    useDeletePlanItemMutation,
} from "@/services/setup/payer/PayorPlanService";
import { useEnumOptions } from "@/services/enumsApi";
import { useAppDispatch } from "@/hooks";
import {
    notify,
    showSystemLoader,
    hideSystemLoader,
} from "@/utils/uiReducerActions";
import { FaTrash } from "react-icons/fa";
import { MdModeEdit } from "react-icons/md";
import { formatEnumString } from "@/utils";
import DeletionConfirmationModal from "@/components/DeletionConfirmationModal";

const PlanItemsModal = ({ open, setOpen, plan }) => {
    if (!plan) return null;

    const dispatch = useAppDispatch();

    const itemTypes = useEnumOptions("BillingItemTypes");
    const coverageTypes = useEnumOptions("InsuranceCoverageType");

    const [page, setPage] = useState(0);
    const [size, setSize] = useState(10);

    const { data: itemsResp, refetch, isFetching } = useGetItemsByPlanQuery(
        { planId: plan?.id, page, size },
        { skip: !plan?.id }
    );


    const [createItem] = useCreatePlanItemMutation();
    const [updateItem] = useUpdatePlanItemMutation();
    const [deleteItem] = useDeletePlanItemMutation();

    const [selectedRow, setSelectedRow] = useState(null);
    const [openDeleteModal, setOpenDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    const [item, setItem] = useState({
        id: undefined,
        planId: plan?.id,
        itemType: "",
        coverageType: "",
        amount: null,
    });

    useEffect(() => {
        if (open) {
            resetForm();
            refetch();
            setSelectedRow(null);
        }
    }, [open]);

    const resetForm = () => {
        setItem({
            id: undefined,
            planId: plan.id,
            itemType: "",
            coverageType: "",
            amount: null,
        });
    };

    const saveItemHandler = async () => {
        if (!item.itemType || !item.coverageType || !item.amount) {
            dispatch(notify({ msg: "All fields are required", sev: "warning" }));
            return;
        }

        try {
            dispatch(showSystemLoader());

            if (item.id) {
                await updateItem(item).unwrap();
                dispatch(notify({ msg: "Item updated successfully", sev: "success" }));
            } else {
                await createItem(item).unwrap();
                dispatch(notify({ msg: "Item added successfully", sev: "success" }));
            }

            resetForm();
            setSelectedRow(null);
            refetch();
        } catch (err) {
            dispatch(
                notify({
                    msg: err?.data?.message || "Failed to save item",
                    sev: "error",
                })
            );
        } finally {
            dispatch(hideSystemLoader());
        }
    };

  const confirmDeleteHandler = async () => {
    try {
      dispatch(showSystemLoader());

      await deleteItem(itemToDelete).unwrap();
      dispatch(notify({ msg: "Item deleted successfully", sev: "success" }));

      refetch();
    } catch {
      dispatch(notify({ msg: "Failed to delete", sev: "error" }));
    } finally {
      dispatch(hideSystemLoader());
      setOpenDeleteModal(false);
      setItemToDelete(null);
    }
  };

    const columns = [
        {
            key: "itemType",
            title: "Item Type",
            flexGrow: 1,
            render: (rowData) => <p>{formatEnumString(rowData?.itemType)}</p>,
        },
        {
            key: "coverageType",
            title: "Coverage Type",
            flexGrow: 1,
            render: (rowData) => <p>{formatEnumString(rowData?.coverageType)}</p>,
        },
        { key: "amount", title: "Amount", flexGrow: 1 },

        {
            key: "actions",
            title: "",
            flexGrow: 1,
            render: (row) => (
                <div style={{ display: "flex", gap: "14px" }}>
                    <MdModeEdit
                        size={20}
                        color="var(--primary-gray)"
                        style={{ cursor: "pointer" }}
                        onClick={() => {
                            setSelectedRow(row);
                            setItem({
                                id: row.id,
                                planId: row.planId,
                                itemType: row.itemType,
                                coverageType: row.coverageType,
                                amount: row.amount,
                            });
                        }}
                    />

                    <FaTrash
                        size={18}
                        color="var(--primary-pink)"
                        style={{ cursor: "pointer" }}
                        onClick={() => {
                        setItemToDelete(row.id);
                        setOpenDeleteModal(true);
                        }}
                    />
                </div>
            ),
        },
    ];

    const isSelected = (row) =>
        selectedRow && row.id === selectedRow.id ? "selected-row" : "";

    const tablefilters = (<Form fluid layout="inline">

        <MyInput
            fieldLabel="Item Type"
            fieldName="itemType"
            fieldType="select"
            selectData={itemTypes}
            selectDataLabel="label"
            selectDataValue="value"
            record={item}
            setRecord={setItem}
            column
            required
        />

        <MyInput
            fieldLabel="Coverage Type"
            fieldName="coverageType"
            fieldType="select"
            selectData={coverageTypes}
            selectDataLabel="label"
            selectDataValue="value"
            record={item}
            setRecord={setItem}
            column
            required
        />

        <MyInput
            fieldLabel="Amount"
            fieldName="amount"
            fieldType="number"
            width="120px"
            record={item}
            setRecord={setItem}
            column
            required
        />

    </Form>);

    const tablebuttons = (<>
        <div className="payor-plan-buttons-handle">
            <MyButton
                color="var(--deep-blue)"
                width="100px"
                onClick={saveItemHandler}
            >
                Save
            </MyButton>

            <MyButton
                color="var(--primary-gray)"
                width="100px"
                onClick={resetForm}
            >
                Cancel
            </MyButton>
        </div>
    </>);

    return (
        <MyModal
            open={open}
            setOpen={setOpen}
            size="34vw"
            position="center"
            title={`Manage Items — ${plan?.name}`}
            content={
                <>

                    <MyTable
                        data={itemsResp?.data ?? []}
                        loading={isFetching}
                        columns={columns}
                        totalCount={itemsResp?.totalCount ?? 0}
                        page={page}
                        rowsPerPage={size}
                        onPageChange={(_, newPage) => setPage(newPage)}
                        onRowsPerPageChange={(e) => setSize(Number(e.target.value))}
                        rowClassName={isSelected}
                        onRowClick={(row) => setSelectedRow(row)}
                        tableButtons={tablebuttons}
                        filters={tablefilters}
                    />

          <DeletionConfirmationModal
            open={openDeleteModal}
            setOpen={setOpenDeleteModal}
            itemToDelete="Item"
            actionType="delete"
            actionButtonFunction={confirmDeleteHandler}
          />

                </>
            }
        />
    );
};

export default PlanItemsModal;
