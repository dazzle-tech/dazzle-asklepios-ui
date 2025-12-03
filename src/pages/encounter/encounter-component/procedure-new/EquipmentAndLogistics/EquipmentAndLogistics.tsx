import MyButton from "@/components/MyButton/MyButton";
import MyTable from "@/components/MyTable";
import Translate from "@/components/Translate";
import { useGetLovValuesByCodeQuery, useGetServicesQuery } from "@/services/setupService";
import React, { useState } from "react";
import { Col, Form, Row } from "rsuite";

import { useDeleteProcedureserviceEquipmentMutation, useGetProcedurServiceEquipmentListQuery, useSaveProcedureEquipmentServiceMutation } from "@/services/procedureService";
import { initialListRequest } from "@/types/types";
import MyIconInput from "@/components/MyInput/MyIconInput";
import MyInput from "@/components/MyInput";
import { notify } from "@/utils/uiReducerActions";
import { useAppDispatch } from "@/hooks";
import { newApProcedureServiceEquipment } from "@/types/model-types-constructor";
import DeletionConfirmationModal from "@/components/DeletionConfirmationModal";
import { IoPersonRemove } from "react-icons/io5";

const EquipmentAndLogistics = ({ procedure, setActiveTab, user }) => {
    const dispatch = useAppDispatch();
     const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
    const [selectedUserList, setSelectedUserList] = useState<any>([]);
    const {data:serviceList}=useGetServicesQuery({...initialListRequest});
    const [saveEquipment]=useSaveProcedureEquipmentServiceMutation();
    const[deleteEquipment]=useDeleteProcedureserviceEquipmentMutation();;
    const { data: equipmentList, refetch } = useGetProcedurServiceEquipmentListQuery({
        ...initialListRequest,
        filters: [
            {
                fieldName: "procedure_key",
                operator: "match",
                value: procedure?.key
            }
        ]
    }, { skip: !procedure?.key });
    const [ProcedureServiceEquipment, setProcedureServiceEquipment] = useState({
        ...newApProcedureServiceEquipment,
       
    });

const handleSave = async () => {
        try {
            const selectedKeys = selectedUserList?.key;
            if (!Array.isArray(selectedKeys)) {
                console.error("selectedUserList.key is not an array:", selectedKeys);
                return;
            }

            const promises = selectedKeys.map((key) => {
                const service = serviceList?.object?.find((item) => item.key === key);
                if (service) {
                    return saveEquipment({
                        ...newApProcedureServiceEquipment,
                        procedureKey: procedure?.key,
                      serviceKey: service?.key
                    });
                }
                return null;
            });

            await Promise.all(promises.filter(Boolean));
            refetch();

            dispatch(notify({ msg: 'All Services saved  successfully', sev: "success" }));
        } catch (error) {

            dispatch(notify({ msg: ' Faild to save one or more Service', sev: "error" }));
        }
    };



    const columns = [
        {
            key: "Type",
            title: <Translate>Type</Translate>,
            render: (rowData: any) => {
                return rowData?.service?.typeLvalue?.lovDisplayVale || "";
            }

        },
        {
            key: "Name",
            title: <Translate>Name</Translate>,
            render: (rowData: any) => {
                return rowData?.service?.name || "";
            }

        },
        {
            key: "Category",
            title: <Translate>Category</Translate>,
            render: (rowData: any) => {
                return rowData?.service?.categoryLvalue?.lovDisplayVale || "";
            }

        },
        {
            key: "Price",
            title: <Translate>Price</Translate>,
            render: (rowData: any) => {
                return rowData?.service?.price || "";
            }

        }
        ,
        {
            key: "Currency",
            title: <Translate>Currency</Translate>,
            render: (rowData: any) => {
                return rowData?.service?.currency || "";
            }

        }
        ,
        {
            key: "delete",
            title: <Translate>Delete</Translate>,
            render: (rowData: any) => {
                return <IoPersonRemove fill="var(--primary-gray)" size={22} 
                onClick={() => {
                    setConfirmDeleteOpen(true) ;
                     setProcedureServiceEquipment(rowData)
                }} />

            }

        }
    ]
    return (<>


        <Row>
            <Col md={10}><Form fluid>
                    <MyInput
                        width="100%"
                        menuMaxHeight='15vh'
                        placeholder="Service"
                        showLabel={false}
                        selectData={serviceList?.object ?? []}
                        fieldType="multyPicker"
                        selectDataLabel="name"
                        selectDataValue="key"
                        fieldName="key"
                        record={selectedUserList}
                        setRecord={setSelectedUserList}
                    />

                </Form></Col>
             <Col md={12}></Col>
              <Col md={2}><MyButton  onClick={handleSave}>Save</MyButton></Col>
      
        </Row>
        <Row>
            <Col md={24}>
                <MyTable
                    data={equipmentList?.object ?? []}
                    columns={columns} 
                    onRowClick={(rowData)=>{
                        setProcedureServiceEquipment
                    }}/></Col>
        </Row>
       <DeletionConfirmationModal
                  open={confirmDeleteOpen}
                  setOpen={setConfirmDeleteOpen}
                  itemToDelete="Service"
                  actionButtonFunction={async () => {
                      try {
                          const Response=await deleteEquipment(ProcedureServiceEquipment.key).unwrap();
                          console.log("Response",Response);
                         dispatch(notify({ msg:Response.msg, sev: "success" }));
                         refetch();
                         setConfirmDeleteOpen(false);
                      } catch (error) {
                         dispatch(notify({ msg: 'Deleted  faild', sev: "error" }));
                      }
                  }}
                  actionType="delete"
              />
        <div className='bt-div'>
            <div className="bt-right">

                <MyButton onClick={() => setActiveTab("1")}>Complete and Next</MyButton>
            </div>
        </div>
    </>)
}
export default EquipmentAndLogistics;