import React, { useEffect, useState } from "react";
import {
  useGetUserQuery
} from "@/services/userService";
import {
  useGetWarehouseUsersByWarehouseQuery,
  useAddWarehouseUserMutation,
  useUpdateWarehouseUserMutation,
} from "@/services/inventory/inventory-warehouse/warehouseUserService";
import MyInput from "@/components/MyInput";
import MyTable from "@/components/MyTable";
import MyButton from "@/components/MyButton/MyButton";
import ChildModal from "@/components/ChildModal";
import DeletionConfirmationModal from "@/components/DeletionConfirmationModal";
import { notify } from "@/utils/uiReducerActions";
import { useAppDispatch } from "@/hooks";
import { FaUser } from "react-icons/fa6";
import AddOutlineIcon from "@rsuite/icons/AddOutline";
import { newWarehouseUser } from "@/types/model-types-constructor-new";
import { MdDelete, MdModeEdit } from "react-icons/md";
import { Form } from "rsuite";

const Users = ({ open, setOpen, warehouse }) => {
  const dispatch = useAppDispatch();

  const [warehouseUser, setWarehouseUser] = useState({ ...newWarehouseUser });

  const [openChildModal, setOpenChildModal] = useState(false);

  const { data: usersResponse } = useGetUserQuery();

  const users =
    (usersResponse ?? []).map((u) => ({
      ...u,
      fullName: `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim(),
    }));

  const {
    data: warehouseUsersResponse,
    refetch: refetchWarehouseUsers,
  } = useGetWarehouseUsersByWarehouseQuery({
    warehouseId: warehouse.id,
    page: 0,
    size: 500,
    sort: "id,asc",
  });

  const warehouseUsers = warehouseUsersResponse?.data ?? [];

  const [addWarehouseUser] = useAddWarehouseUserMutation();
  const [updateWarehouseUser] = useUpdateWarehouseUserMutation();

  const isSelected = (row) =>
    row.id === warehouseUser?.id ? "selected-row" : "";

  const handleSaveWarehouseUser = async () => {
    try {
      if (!warehouseUser.userId) {
        dispatch(notify({ msg: "Select user first!", sev: "error" }));
        return;
      }

      if (warehouseUser.id) {
        await updateWarehouseUser({
          id: warehouseUser.id,
          warehouseId: warehouse.id,
          userId: warehouseUser.userId,
        }).unwrap();

        dispatch(notify({ msg: "Warehouse User updated", sev: "success" }));
      } else {
        await addWarehouseUser({
          warehouseId: warehouse.id,
          userId: warehouseUser.userId,
        }).unwrap();

        dispatch(notify({ msg: "User added to warehouse", sev: "success" }));
      }

      setOpenChildModal(false);
      refetchWarehouseUsers();
    } catch (err) {
      console.log(err);
      dispatch(notify({ msg: "Error saving user", sev: "error" }));
    }
  };

  const tableColumns = [
    {
      key: "userId",
      title: "User",
      flexGrow: 3,
      render: (row) => {
        const u = users.find((x) => x.id === row.userId);
        return u?.fullName ?? "—";
      },
    },
    {
      key: "actions",
      title: "",
      flexGrow: 2,
      render: (row) => (
        <div className="container-of-icons">
          <MdModeEdit
            className="icons"
            size={20}
            fill="var(--primary-gray)"
            title="Edit"
            onClick={() => {
              setWarehouseUser(row);
              setOpenChildModal(true);
            }}
          />
        </div>
      ),
    },
  ];

  const mainContent = () => (
    <div>
      <div className="container-of-add-new-button">
        <MyButton
          prefixIcon={() => <AddOutlineIcon />}
          color="var(--deep-blue)"
          onClick={() => {
            setWarehouseUser({
              ...newWarehouseUser,
              warehouseId: warehouse.id,
            });
            setOpenChildModal(true);
          }}
        >
          Add User
        </MyButton>
      </div>

      <MyTable
        height={400}
        data={warehouseUsers}
        columns={tableColumns}
        rowClassName={isSelected}
        onRowClick={(row) => setWarehouseUser(row)}
      />

    </div>
  );

  const childContent = () => (
    <Form>
      <MyInput
        required
        width="350px"
        fieldType="select"
        fieldName="userId"
        fieldLabel="User"
        selectData={users}
        selectDataLabel="fullName"
        selectDataValue="id"
        record={warehouseUser}
        setRecord={setWarehouseUser}
      />
    </Form>
  );

  return (
    <ChildModal
      open={open}
      setOpen={setOpen}
      title="Warehouse Users"
      mainContent={mainContent}
      mainStep={[
        {
          title: "Users",
          icon: <FaUser />,
          disabledNext: !warehouse?.id,
        },
      ]}
      showChild={openChildModal}
      setShowChild={setOpenChildModal}
      childTitle="Add User"
      childContent={childContent}
      actionChildButtonFunction={handleSaveWarehouseUser}
      actionButtonLabel="Close"
      actionButtonFunction={() => setOpen(false)}
      mainSize="sm"
    />
  );
};

export default Users;
