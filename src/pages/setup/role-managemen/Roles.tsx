import React, { useEffect, useState } from "react";
import MyButton from "@/components/MyButton/MyButton";
import SectionContainer from "@/components/SectionsoContainer";
import { Form, List } from "rsuite";
import { Role } from '@/types/model-types-new';
import { notify } from '@/utils/uiReducerActions';
import { useAddRoleMutation, useGetRolesByFacilityQuery } from "@/services/security/roleService";
import { newRole } from "@/types/model-types-constructor-new";
import { useAppDispatch } from "@/hooks";
import MyInput from "@/components/MyInput";

const Roles = ({ selected, setSelected, facilityId }) => {
  const dispatch = useAppDispatch();
  const { data: rolesData, isLoading: rolesLoading, refetch: refetchRoles } =
    useGetRolesByFacilityQuery(facilityId!, { skip: !facilityId });

  const [saveRole, saveRoleMutation] = useAddRoleMutation();
  const [role, setRole] = useState<Role>({ ...newRole });

  const addRole = async () => {
    try {
      const created = await saveRole({ ...role, facilityId }).unwrap();
      dispatch(notify({ msg: 'The Role has been saved successfully', sev: 'success' }));

      setRole({ ...newRole });
      setSelected(created);

      // Refresh the list
      refetchRoles();
    } catch (e) {
      dispatch(notify({ msg: 'Failed to save this Role', sev: 'error' }));
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
                <div className="item-name">{r.name}</div>
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
              record={role}
              setRecord={setRole}
            />
            <MyButton type="submit">Add</MyButton>
          </Form>
        </div>
      }
    />
  );
};

export default Roles;
