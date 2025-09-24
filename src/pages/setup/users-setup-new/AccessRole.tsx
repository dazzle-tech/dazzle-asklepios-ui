import React, { useState } from "react";
import { Form, SelectPicker, Button, Table, Row, Col } from "rsuite";
import { useAppDispatch } from "@/hooks";
import { notify } from "@/utils/uiReducerActions";
import {
    useAddUserRoleMutation,
    useDeleteUserRoleMutation,
    useGetUserRolesByUserIdQuery
} from "@/services/security/UserRoleService";
import { useGetAllFacilitiesQuery } from "@/services/security/facilityService";
import { useGetRolesByFacilityQuery } from "@/services/security/roleService";
import MyIconInput from "@/components/MyInput/MyIconInput";
import MyInput from "@/components/MyInput";
import MyButton from "@/components/MyButton/MyButton";
import { Translate } from "@mui/icons-material";
import { render } from "react-dom";
import MyTable from "@/components/MyTable";


const { Column, HeaderCell, Cell } = Table;

const AccessRole = ({ user }) => {
    const dispatch = useAppDispatch();

    // state
    const [selectedFacility, setSelectedFacility] = useState<any>({ id: null });
    const [selectedRole, setSelectedRole] = useState<any>({id:null});

    // queries
    const { data: allFacilities = [] } = useGetAllFacilitiesQuery(null);
    const { data: rolesByFacility = [] } = useGetRolesByFacilityQuery(
        selectedFacility ? selectedFacility.id : null,
        { skip: !selectedFacility }
    );
    const { data: userRoles = [], refetch: refetchUserRoles } =
        useGetUserRolesByUserIdQuery(user?.id, { skip: !user?.id });
console.log("userRoles",userRoles);
    // mutations
    const [addUserRole] = useAddUserRoleMutation();
    const [deleteUserRole] = useDeleteUserRoleMutation();

    // save role for user
    const handleSave = async () => {
        if (!user?.id || !selectedFacility || !selectedRole) {
            dispatch(notify({ msg: "Please select both Facility and Role", sev: "warning" }));
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
const columns=[
    {key:'roleName',
    title:<Translate>Role Name</Translate>,
    renderer:(rowData)=><span>{rowData.roleName}</span>
    }
]
    return (
        <>
            <Form fluid>
                <Row>
                    <Col md={12} xs={24} xl={12}>
                        <MyInput
                            width={'100%'}
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
                    <Col md={12} xs={24} xl={12}>
                        <MyInput
                            width={'100%'}
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
                </Row>






                <MyButton  onClick={handleSave} disabled={!selectedRole}>
                    Save
                </MyButton>
            </Form>

<MyTable data={userRoles} columns={columns}/>
        </>
    );
};

export default AccessRole;
