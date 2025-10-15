import React, { useState } from "react";
import MyButton from "@/components/MyButton/MyButton";
import SectionContainer from "@/components/SectionsoContainer";
import { Form, List } from "rsuite";
import { Role } from "@/types/model-types-new";
import { notify } from "@/utils/uiReducerActions";
import {
  useAddRoleMutation,
  useGetRolesByFacilityQuery,
  useUpdateRoleMutation,
} from "@/services/security/roleService";
import { newRole } from "@/types/model-types-constructor-new";
import { useAppDispatch } from "@/hooks";
import MyInput from "@/components/MyInput";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPen } from "@fortawesome/free-solid-svg-icons";

const Roles = ({ selected, setSelected, facilityId }) => {
  const dispatch = useAppDispatch();

  const { data: rolesData, refetch: refetchRoles } =
    useGetRolesByFacilityQuery(facilityId!, { skip: !facilityId });

  const [saveRole] = useAddRoleMutation();
  const [updateRole] = useUpdateRoleMutation();

  // 🔹 حالتان منفصلتان
  const [newRoleData, setNewRoleData] = useState<Role>({ ...newRole });
  const [editRole, setEditRole] = useState<Role | null>(null);
  const [editId, setEditId] = useState<number | null>(null);

  // ✅ إضافة Role جديد
  const addRole = async () => {
    try {
      const { id, ...data } = newRoleData; // لا ترسل id
      const created = await saveRole({ ...data, facilityId }).unwrap();

      dispatch(notify({ msg: "The Role has been saved successfully", sev: "success" }));
      setNewRoleData({ ...newRole });
      setSelected(created);
      refetchRoles();
    } catch {
      dispatch(notify({ msg: "Failed to save this Role", sev: "error" }));
    }
  };

  // ✅ تعديل Role موجود
  const handleUpdate = async () => {
    if (!editRole) return;
    try {
      const updated = await updateRole({
        id: editRole.id,
        name: editRole.name,
        type: editRole.type,
      }).unwrap();

      dispatch(notify({ msg: "Role name updated successfully", sev: "success" }));
      refetchRoles();
      setEditRole(null);
      setEditId(null);
      setSelected(updated);
    } catch {
      dispatch(notify({ msg: "Failed to update role name", sev: "error" }));
    }
  };

  return (
    <SectionContainer
      title="Roles"
      content={
        <div className="list-wrapper">
          <List bordered hover>
            {rolesData?.map((r) => (
              <List.Item
                key={r.id}
                className={`list-item ${selected?.id === r.id ? "selected" : ""}`}
                onClick={() => setSelected(r)}
              >
                {editId === r.id ? (
                  <Form>
                    <MyInput
                      fieldLabel=""
                      width={160}
                      required
                      fieldName="name"
                      record={editRole!}
                      setRecord={setEditRole}
                    />
                    <MyButton onClick={handleUpdate} size="sm">
                      Save
                    </MyButton>
                    <MyButton
                      type="button"
                      size="sm"
                      onClick={() => {
                        setEditId(null);
                        setEditRole(null);
                      }}
                    >
                      Cancel
                    </MyButton>
                  </Form>
                ) : (
                  <div className="flex items-center justify-between w-full">
                    <span>{r.name}</span>
                    <FontAwesomeIcon
                      icon={faPen}
                      title="Edit"
                      style={{
                        color: "#1976d2",
                        cursor: "pointer",
                        marginLeft: 8,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditId(r.id);
                        setEditRole({ ...r });
                      }}
                    />
                  </div>
                )}
              </List.Item>
            ))}
          </List>
        </div>
      }
      button={
        <div className="add-form">
          <Form layout="inline" onSubmit={addRole}>
            <MyInput
              fieldLabel="Name"
              width={200}
              required
              fieldName="name"
              record={newRoleData}
              setRecord={setNewRoleData}
            />
            <MyButton type="submit">Add</MyButton>
          </Form>
        </div>
      }
    />
  );
};

export default Roles;
