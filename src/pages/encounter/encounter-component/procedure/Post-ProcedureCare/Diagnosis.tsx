import React, { useState } from "react";
import { Col, Divider, Dropdown, Form, Input, InputGroup, Row, Text } from "rsuite";
import SearchIcon from '@rsuite/icons/Search';
import { useGetIcdListQuery } from "@/services/setupService";
import { initialListRequest } from "@/types/types";
import MyInput from "@/components/MyInput";
import { newApPostProcedureCare } from "@/types/model-types-constructor";
import { useSavePostProcedureCareMutation } from "@/services/procedureService";
import MyButton from "@/components/MyButton/MyButton";
import { useAppDispatch } from "@/hooks";
import { notify } from "@/utils/uiReducerActions";
import '../styles.less'
const Diagnosis = ({ procedure, user }) => {
    const dispatch = useAppDispatch();
    const [diagno, setDiagno] = useState({ ...newApPostProcedureCare });
    const [saveProcedureCare] = useSavePostProcedureCareMutation();
    const [searchKeyword, setSearchKeyword] = useState('');
    const [listIcdRequest, setListIcdRequest] = useState({ ...initialListRequest, pageSize: 1000 });
    const { data: icdListResponseData } = useGetIcdListQuery(listIcdRequest);
    const modifiedData = (icdListResponseData?.object ?? []).map(item => ({
        ...item,
        combinedLabel: `${item.icdCode} - ${item.description}`
    }));
    const handleSave = async () => {
        try {
            const response = await saveProcedureCare({
                ...diagno,
                procedureKey: procedure?.key,
                createdBy: user?.key,
            }).unwrap();
            dispatch(notify({ msg: 'Saved Successfully', sev: "success" }));
        } catch (error) {
            console.error("Error saving procedure care:", error);
            dispatch(notify({ msg: 'Error saving procedure care', sev: "error" }));
        }
    };
    const handleSearch = value => {
        setSearchKeyword(value);
    };
    return (
        <div className='container-form'>
            <div className='title-div'>
                <Text>Procedure Care</Text>
            </div>
            <Divider />
            <Row>


                <Col md={12}>
                    <Row>
                        <Col md={24}>
                            <Text>Diagnosis</Text>

                      
                            <div style={{ position: 'relative' }}>
                                <InputGroup inside>
                                    <Input
                                        placeholder="Search ICD-10"
                                        value={searchKeyword}
                                        onChange={handleSearch}
                                    />
                                    <InputGroup.Button>
                                        <SearchIcon />
                                    </InputGroup.Button>
                                </InputGroup>
                
                                {searchKeyword && (
                                    <div
                                        style={{
                                            position: 'absolute',
                                            top: '100%',
                                            left: 0,
                                            width: '100%',
                                            maxHeight: '150px',
                                            overflowY: 'auto',
                                            zIndex: 9999,
                                            backgroundColor: 'white',
                                            border: '1px solid #ccc',
                                            borderRadius: '4px',
                                            boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                                            marginTop: '4px',
                                        }}
                                    >
                                        <Dropdown.Menu>
                                            {modifiedData?.map((mod) => (
                                                <Dropdown.Item
                                                    key={mod.key}
                                                    eventKey={mod.key}
                                                    onClick={() => {
                                                        setDiagno({
                                                            ...diagno,
                                                            diagnoseKey: mod.key,
                                                        });
                                                        setSearchKeyword('');
                                                    }}
                                                >
                                                    <span>{mod.icdCode}</span>
                                                    <span>&nbsp;&nbsp;</span>
                                                    <span>{mod.description}</span>
                                                </Dropdown.Item>
                                            ))}
                                        </Dropdown.Menu>
                                    </div>
                                )}
                            </div>
                        </Col>

                    </Row>
                    <Row>
                        <Col md={24}>
                         
                            <InputGroup>
                                <Input
                                    disabled={true}
                                    value={
                                        diagno?.diagnoseKey
                                            ? `${modifiedData?.find(item => item.key === diagno?.diagnoseKey)?.icdCode}, ${modifiedData?.find(item => item.key === diagno?.diagnoseKey)?.description}`
                                            : ''
                                    }
                                />
                            </InputGroup>
                        </Col>
                    </Row>

                </Col>
                <Col md={12}>
                    <Form fluid>
                        <MyInput
                            width="100%"
                            fieldType="textarea"
                            fieldName='patientCondition'
                            record={diagno}
                            setRecord={setDiagno}
                        />
                    </Form>
                </Col>

            </Row>
            <Row>
                <div className='bt-div'>
                    <div className="bt-right">
                        <MyButton>Create Follow-up</MyButton>
                        <MyButton onClick={handleSave}>Save </MyButton>
                    </div>
                </div>
            </Row>
        </div>
    )
}
export default Diagnosis;