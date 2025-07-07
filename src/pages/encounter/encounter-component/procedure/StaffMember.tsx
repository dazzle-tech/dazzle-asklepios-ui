import MyButton from "@/components/MyButton/MyButton";
import MyInput from "@/components/MyInput";
import MyTable from "@/components/MyTable";
import Translate from "@/components/Translate";
import { useGetUsersQuery } from "@/services/setupService";
import { initialListRequest, ListRequest } from "@/types/types";
import React, { useState, useEffect } from "react";
import { Col, Form, Input, Panel, Row } from "rsuite";
import {
    useDeleteProceduresStaffMutation,
    useGetProceduresStaffQuery,
    useSaveProceduresStaffMutation
} from '@/services/procedureService';
import { newApProcedureStaff } from "@/types/model-types-constructor";
import { useAppDispatch } from "@/hooks";
import { notify } from "@/utils/uiReducerActions";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare } from "@fortawesome/free-solid-svg-icons";
import { IoPersonRemove } from "react-icons/io5";
import DeletionConfirmationModal from "@/components/DeletionConfirmationModal";
const StaffMember = ({ procedure }) => {
    const dispatch = useAppDispatch();
    const [activeRowKey, setActiveRowKey] = useState(null);
    const [staff, setStaff] = useState({
        ...newApProcedureStaff,
        procedureKey: procedure?.key,
      
    })
    const { data: userList } = useGetUsersQuery({ ...initialListRequest });
    const [listRequest, setListRequest] = useState<ListRequest>({
        ...initialListRequest,
        filters: [
          
            {
                fieldName: "procedure_key",
                operator: "match",
                value: procedure?.key
            }
        ]
    })
    const { data: staffList, refetch } = useGetProceduresStaffQuery(listRequest, { skip: !procedure?.key });
    const [saveStaff, saveStaffMutation] = useSaveProceduresStaffMutation();
    const [deleteProceduresStaff] = useDeleteProceduresStaffMutation();
    const [selectedUserList, setSelectedUserList] = useState<any>([]);
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
    const isSelected = rowData => {
        if (rowData && staff && rowData.key === staff.key) {
            return 'selected-row';
        } else return '';
    };
    
    const handleSave = async () => {
        
        try {
            const selectedKeys = selectedUserList?.key;
            if (!Array.isArray(selectedKeys)) {
          
                return;
            }

            const promises = selectedKeys.map((key) => {
                const user = userList?.object?.find((item) => item.key === key);
                if (user) {
                    return saveStaff({
                        ...newApProcedureStaff,
                        procedureKey: procedure?.key,
                      
                        userKey: user?.key
                    });
                }
                return null;
            });

            await Promise.all(promises.filter(Boolean));
            refetch();

            dispatch(notify({ msg: 'All user saved  successfully', sev: "success" }));
            const newselect=[]
            setSelectedUserList(newselect);
        } catch (error) {

            dispatch(notify({ msg: ' Faild to save one or more user', sev: "error" }));
        }
    };
    //table Coloumns
    const columns = [
        {
            key: "name",
            title: <Translate>Name</Translate>,
            render: (rowData: any) => {
                return rowData.user?.username
            }
        },
        {
            key: "responsibility",
            title: <Translate>responsibility</Translate>,
            render: (rowData: any) => {
                return activeRowKey === rowData.key ? (
                    <Input

                        onChange={(value) => {
                            setStaff({ ...staff, responsibility: value });
                        }}
                        onPressEnter={async (event) => {
                            try {
                                saveStaff({ ...staff }).unwrap();
                                dispatch(notify({ msg: 'Saved  Successfully', sev: "success" }));
                                refetch();
                                setActiveRowKey(null);

                            } catch (error) {
                                dispatch(notify({ msg: 'Saved  Faild', sev: "error" }));
                            }
                        }}></Input>
                ) : (
                    <span>
                        <FontAwesomeIcon
                            icon={faPenToSquare}
                            onClick={() => setActiveRowKey(rowData.key)}
                            style={{ marginRight: '8px', cursor: 'pointer' }}
                        />
                        {rowData.responsibility}
                    </span>)
            }
        },
        {
            key: "delete",
            title: <Translate>Delete</Translate>,
            render: (rowData: any) => {
                return <IoPersonRemove fill="var(--primary-gray)" size={22} 
                onClick={() => {
                    setConfirmDeleteOpen(true) ;
                     setStaff(rowData)
                }} />

            }

        }
    ]
    return (<Panel header="Staff Members" collapsible defaultExpanded className="panel-border">
        <Row>
            <Col md={24}>
                <Row className="rows-gap">
                    <Col md={10}>
                        <Form fluid>
                            <MyInput
                                width="100%"
                                menuMaxHeight='15vh'
                                placeholder="Staff"
                                showLabel={false}
                                selectData={userList?.object ?? []}
                                fieldType="multyPicker"
                                selectDataLabel="username"
                                selectDataValue="key"
                                fieldName="key"
                                record={selectedUserList}
                                setRecord={setSelectedUserList}
                            />

                        </Form></Col>
                    <Col md={12}>
                      
                    </Col>
                    <Col md={2}>  <MyButton onClick={handleSave}>Save</MyButton></Col>
                </Row>
                <Row>
                    <Col md={24}>
                        <MyTable
                            data={staffList?.object || []}
                            columns={columns}
                            onRowClick={(rowData) => {
                                setStaff(rowData)
                            }}
                            rowClassName={isSelected}
                        >

                        </MyTable>
                    </Col>
                </Row>
               
            </Col>
        </Row>
        <DeletionConfirmationModal
            open={confirmDeleteOpen}
            setOpen={setConfirmDeleteOpen}
            itemToDelete="Staff"
            actionButtonFunction={async () => {
                try {
                    const Response=await deleteProceduresStaff(staff.key).unwrap();
                   
                   dispatch(notify({ msg: 'Deleted  successfully', sev: "success" }));
                   refetch();
                } catch (error) {
                   dispatch(notify({ msg: 'Deleted  faild', sev: "error" }));
                }
            }}
            actionType="delete"
        />
    </Panel>)
}
export default StaffMember;