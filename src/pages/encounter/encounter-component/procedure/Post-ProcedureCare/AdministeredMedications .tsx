import MyButton from "@/components/MyButton/MyButton";
import MyInput from "@/components/MyInput";
import MyTable from "@/components/MyTable";
import Translate from "@/components/Translate";
import { useAppDispatch } from "@/hooks";
import { useGetActiveIngredientQuery } from "@/services/medicationsSetupService";
import { useGetProcedureAdministeredMedicationsQuery, useSaveProcedureAdministeredMedicationsMutation } from "@/services/procedureService";
import { useGetLovValuesByCodeQuery } from "@/services/setupService";
import { newApProcedureAdministeredMedications } from "@/types/model-types-constructor";
import { initialListRequest, ListRequest } from "@/types/types";
import { notify } from "@/utils/uiReducerActions";
import { faPenToSquare } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useState, useEffect } from "react";
import { Col, Divider, Form, Input, Row, SelectPicker, Text } from "rsuite";
const AdministeredMedications = ({ procedure, user }) => {
    const dispatch = useAppDispatch();
    const [activeRowKey, setActiveRowKey] = useState(null);
    const [selectedIngredientList, setSelectedIngredientList] = useState<any>([]);
    const [saveProcedureAdministeredMedications] = useSaveProcedureAdministeredMedicationsMutation();
    const { data: unitLovQueryResponse } = useGetLovValuesByCodeQuery('UOM');
    console.log("unitLovQueryResponse", unitLovQueryResponse?.object);
    const [medication, setMedication] = useState({ ...newApProcedureAdministeredMedications, procedureKey: procedure?.key });
    const { data: activeIngredients, isLoading: loadingActiveIngredients } = useGetActiveIngredientQuery({ ...initialListRequest });
    const [listRequest, setListRequest] = useState<ListRequest>({
        ...initialListRequest,
        filters: [

            {
                fieldName: "procedure_key",
                operator: "match",
                value: procedure?.key
            }
        ]
    });
    const { data: medicationsList, refetch } = useGetProcedureAdministeredMedicationsQuery(listRequest, { skip: !procedure?.key });
    const isSelected = rowData => {
        if (rowData && medication && rowData.key === medication.key) {
            return 'selected-row';
        } else return '';
    };

    const handleSave = async () => {
        try {
            const selectedKeys = selectedIngredientList?.key;
            if (!Array.isArray(selectedKeys)) {
                console.error("selectedIngredientList.key is not an array:", selectedKeys);
                return;
            }
            const promises = selectedKeys.map((key) => {
                const newMedication = { ...medication, activeIngredientKey: key };
                return saveProcedureAdministeredMedications(newMedication).unwrap();
            });
            await Promise.all(promises);
            dispatch(notify({ msg: 'Saved Successfully', sev: "success" }));
            refetch();
            setSelectedIngredientList([]);
        } catch (error) {
            console.error("Error saving medications:", error);
        }

    }
    const columns = [
        {
            key: "name",
            title: <Translate>Active Ingredient</Translate>,
            render: (rowData: any) => {
                return <Text>{rowData?.activeIngredient?.name}</Text>
            }
        },
        {
            key: "dose",
            title: <Translate>Dose</Translate>,
            render: (rowData: any) => {
                return activeRowKey === rowData.key ? (
                    <Input
                        type="number"

                        onChange={(value) => {
                            setMedication({ ...medication, dose: Number(value) });
                        }}
                        onPressEnter={async (event) => {
                            try {
                                await saveProcedureAdministeredMedications({ ...medication }).unwrap();
                                refetch();
                                dispatch(notify({ msg: 'Saved  Successfully', sev: "success" }));
                                setActiveRowKey(null);

                            } catch (error) {
                                dispatch(notify({ msg: 'Saved  Faild', sev: "error" }));
                            }
                        }}></Input>
                ) :
                    (
                        <span>
                            <FontAwesomeIcon
                                icon={faPenToSquare}
                                onClick={() => setActiveRowKey(rowData.key)}
                                style={{ marginRight: '8px', cursor: 'pointer' }}
                            />
                            {rowData?.dose}
                        </span>

                    )
            }
        },
        {
            key: "route",
            title: <Translate>Unit</Translate>,
            render: (rowData: any) => {
                return activeRowKey === rowData.key ? (
                    <SelectPicker
                        data={unitLovQueryResponse?.object?? []}
                        value={rowData.unitLkey}
                        valueKey="key"
                        labelKey="lovDisplayVale"
                        onChange={async(value)=> {
                            await saveProcedureAdministeredMedications({
                                ...rowData,
                                unitLkey: value
                            }).unwrap();
                            refetch();
                            dispatch(notify({ msg: 'Saved  Successfully', sev: "success" }));
                            setActiveRowKey(null);
                        }}
                        style={{ width: 100 }}
                    />): (<span>
                        <FontAwesomeIcon
                            icon={faPenToSquare}
                            onClick={() => setActiveRowKey(rowData.key)}
                            style={{ marginRight: '8px', cursor: 'pointer' }}
                        />
                        {rowData?.unitLvalue?.lovDisplayVale}
                    </span>
                    )
            }
        }
    ]
    return (<div className='container-form'>
        <div className='title-div'>
            <Text>Administered Medications </Text>
        </div>
        <Divider />
        <Row>
            <Col md={24}>
                <Row className="rows-gap">
                    <Col md={10}>
                        <Form fluid>
                            <MyInput
                                width="100%"
                                menuMaxHeight='15vh'
                                placeholder="Select Ingredient"
                                showLabel={false}
                                selectData={activeIngredients?.object ?? []}
                                fieldType="multyPicker"
                                selectDataLabel="name"
                                selectDataValue="key"
                                fieldName="key"
                                record={selectedIngredientList}
                                setRecord={setSelectedIngredientList}
                            />

                        </Form></Col>
                    <Col md={11}>

                    </Col>
                    <Col md={3}>  <MyButton onClick={handleSave}>Save</MyButton></Col>
                </Row>
                <Row>
                    <Col md={24}>
                        <MyTable
                            data={medicationsList?.object || []}
                            columns={columns}
                            onRowClick={(rowData) => {
                                setMedication(rowData)
                            }}
                            rowClassName={isSelected}
                        >

                        </MyTable>
                    </Col>
                </Row>

            </Col>
        </Row>

    </div>)
}
export default AdministeredMedications;