import React, { useState } from "react";
import { Form, Row, Col } from "rsuite";
import { useAppDispatch } from "@/hooks";
import { notify } from "@/utils/uiReducerActions";
import {
  useAddUserRoleMutation,
  useDeleteUserRoleMutation,
  useGetUserRolesByUserIdQuery
} from "@/services/security/UserRoleService";
import { useGetAllFacilitiesQuery } from "@/services/security/facilityService";
import { useGetAllRolesQuery, useGetRolesByFacilityQuery } from "@/services/security/roleService";
import MyInput from "@/components/MyInput";
import MyButton from "@/components/MyButton/MyButton";
import MyTable from "@/components/MyTable";
import Translate from "@/components/Translate";
import { conjureValueBasedOnIDFromList } from "@/utils";
import TrashIcon from "@rsuite/icons/Trash";

const AccessRole = ({ user }) => {
  const dispatch = useAppDispatch();

  // state
  const [selectedFacility, setSelectedFacility] = useState<any>(null);
  const [selectedRole, setSelectedRole] = useState<any>(null);

  // queries
  const { data: allFacilities = [] } = useGetAllFacilitiesQuery(null);
  const { data: rolesByFacility = [] } = useGetRolesByFacilityQuery(
    selectedFacility ? selectedFacility.id : null,
    { skip: !selectedFacility }
  );
  const { data: allRoles = [] } = useGetAllRolesQuery(null);
  const { data: userRoles = [], refetch: refetchUserRoles } =
    useGetUserRolesByUserIdQuery(user?.id, { skip: !user?.id });

  // mutations
  const [addUserRole] = useAddUserRoleMutation();
  const [deleteUserRole] = useDeleteUserRoleMutation();

  // save role for user
  const handleSave = async () => {
  if (!user?.id || !selectedFacility || !selectedRole) {
    dispatch(notify({ msg: "Please select both Facility and Role", sev: "warning" }));
    return;
  }

  // check if already has role in same facility
  const hasRoleInFacility = userRoles.some((ur) => {
    const roleFacilityId = conjureValueBasedOnIDFromList(allRoles ?? [], ur.roleId, "facilityId");
    return roleFacilityId && roleFacilityId === selectedFacility.id;
  });

  if (hasRoleInFacility) {
    dispatch(
      notify({
        msg: `User already has a role in facility ${selectedFacility.name}. Delete it first.`,
        sev: "warning",
      })
    );
    return;
  }

  try {
    await addUserRole({
      userId: user.id,
      roleId: selectedRole.id,
    }).unwrap();

    dispatch(notify({ msg: "Access Role assigned successfully", sev: "success" }));
    refetchUserRoles();

    // reset
    setSelectedFacility(null);
    setSelectedRole(null);
  } catch (err) {
    dispatch(notify({ msg: "Failed to assign role", sev: "error" }));
  }
};

  // delete role
  const handleDelete = async (rowData: any) => {
    try {
      await deleteUserRole({ userId: rowData.userId, roleId: rowData.roleId }).unwrap();
      dispatch(notify({ msg: "Role removed successfully", sev: "success" }));
      refetchUserRoles();
    } catch (err) {
      dispatch(notify({ msg: "Failed to remove role", sev: "error" }));
    }
  };

  const columns = [
    {
      key: "roleName",
      title: <Translate>Role Name</Translate>,
      render: (rowData) => {
        const roleName = conjureValueBasedOnIDFromList(
          allRoles ?? [],
          rowData.roleId,
          "name"
        );
        const facilityName = conjureValueBasedOnIDFromList(
          allRoles ?? [],
          rowData.roleId,
          "facilityName"
        );

        return (
          <span>
            <div style={{ fontWeight: "bold" }}>{roleName}</div>
            {facilityName && (
              <div style={{ fontSize: "12px", color: "gray" }}>
                {facilityName}
              </div>
            )}
          </span>
        );
      },
    },
    {
      key: "actions",
      title: <Translate>Actions</Translate>,
      render: (rowData) => (
        <MyButton
          prefixIcon={() => <TrashIcon />}
          color="red"
          appearance="subtle"
          onClick={() => handleDelete(rowData)}
        />
      ),
    },
  ];

  return (
    <>
      <Form fluid>
        <Row>
          <Col md={10} xs={10} xl={10}>
            <MyInput
              width={"100%"}
              fieldLabel="Facility"
              fieldType="select"
              fieldName="id"
              selectData={allFacilities ?? []}
              selectDataLabel="name"
              selectDataValue="id"
              record={selectedFacility}
              setRecord={setSelectedFacility}
            />
          </Col>
          <Col md={10} xs={10} xl={10}>
            <MyInput
              width={"100%"}
              fieldLabel="Role"
              fieldType="select"
              fieldName="id"
              selectData={rolesByFacility ?? []}
              selectDataLabel="name"
              selectDataValue="id"
              record={selectedRole}
              setRecord={setSelectedRole}
            />
          </Col>
        
        <Col md={4} xs={4} xl={4} >
        <br/>
        <MyButton onClick={handleSave} disabled={!selectedRole}>
          Save
        </MyButton></Col>
        </Row>
      </Form>

      <MyTable data={userRoles} columns={columns} />
    </>
  )

};

export default AccessRole;
