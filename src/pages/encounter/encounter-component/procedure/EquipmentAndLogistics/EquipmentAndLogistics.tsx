import MyButton from "@/components/MyButton/MyButton";
import MyTable from "@/components/MyTable";
import Translate from "@/components/Translate";
import { useGetLovValuesByCodeQuery, useGetServicesQuery } from "@/services/setupService";
import React, { useState } from "react";
import { Col, Form, Row } from "rsuite";

import { useGetProcedurServiceEquipmentListQuery, useSaveProcedureEquipmentServiceMutation } from "@/services/procedureService";
import { initialListRequest } from "@/types/types";
import MyIconInput from "@/components/MyInput/MyIconInput";
import MyInput from "@/components/MyInput";
import { notify } from "@/utils/uiReducerActions";
import { useAppDispatch } from "@/hooks";
import { newApProcedureServiceEquipment } from "@/types/model-types-constructor";

const EquipmentAndLogistics = ({ procedure, setActiveTab, user }) => {
    const dispatch = useAppDispatch();
    const [selectedUserList, setSelectedUserList] = useState<any>([]);
    const {data:serviceList}=useGetServicesQuery({...initialListRequest});
    const [saveEquipment]=useSaveProcedureEquipmentServiceMutation();
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
    ]
    return (<>


        <Row>
            <Col md={10}><Form fluid>
                    <MyInput
                        width="100%"
                        menuMaxHeight='15vh'
                        placeholder="Select Staff"
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
                    columns={columns} /></Col>
        </Row>

        <div className='bt-div'>
            <div className="bt-right">

                <MyButton onClick={() => setActiveTab("1")}>Complete and Next</MyButton>
            </div>
        </div>
    </>)
}
export default EquipmentAndLogistics;