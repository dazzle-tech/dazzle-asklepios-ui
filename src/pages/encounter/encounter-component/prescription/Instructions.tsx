import MyInput from "@/components/MyInput";
import { useGetPrescriptionInstructionQuery } from "@/services/medicationsSetupService";
import { useGetLovValuesByCodeQuery } from "@/services/setupService";
import { initialListRequest } from "@/types/types";
import React, { useState, useEffect } from "react";
import { Col, Dropdown, Form, Row } from "rsuite";
const Instructions = ({prescriptionMedication, selectedOption, customeinst, setCustomeinst, selectedGeneric,setInst }) => {
    const { data: unitLovQueryResponse } = useGetLovValuesByCodeQuery('UOM');
    const { data: FrequencyLovQueryResponse } = useGetLovValuesByCodeQuery('MED_FREQUENCY');
    const { data: roaLovQueryResponse } = useGetLovValuesByCodeQuery('MED_ROA');
    const { data: predefinedInstructionsListResponse } = useGetPrescriptionInstructionQuery({ ...initialListRequest });
    const [filteredList, setFilteredList] = useState([]);
    const [selectedPreDefine, setSelectedPreDefine] = useState(null);
    const [munial, setMunial] = useState(null);
    const [adminInstructions, setAdminInstructions] = useState("");

    useEffect(() => {
        const newList = roaLovQueryResponse?.object?.filter((item) =>
            (selectedGeneric?.roaList)?.includes(item.key)
        );
        setFilteredList(newList);
    }, [selectedGeneric]);
  useEffect(()=>{
    if(selectedOption==="3010606785535008")//Custome  Instruction
        {
       
    }
    else if(selectedOption ==="3010591042600262") // Pre defined Instruction
    {
        const t=predefinedInstructionsListResponse?.object?.find((item)=>item.key===prescriptionMedication.instructions)
        console.log("t" ,t)
        setSelectedPreDefine(t)
    }
    else if(selectedOption==="3010573499898196") //Mnuil  Instruction
    {
      setMunial(prescriptionMedication.instructions)
    }
  },[selectedOption])
    useEffect(()=>{
        setInst(munial);
    },[munial])
    useEffect(()=>{
        setInst(selectedPreDefine?.key)
    },[selectedPreDefine])
    return (<>
        <div >
            {selectedOption === "3010606785535008" &&
                <Row>
                    <Col md={6}>
                        <Form fluid>
                            <MyInput
                            width="100%"
                                fieldType='number'
                                fieldName={'dose'}
                                record={customeinst}
                                setRecord={setCustomeinst}
                            />

                        </Form>
                    </Col>
                    <Col md={6}>
                        <Form fluid>
                            <MyInput
                                 width="100%"
                                fieldType="select"
                                fieldLabel="Unit"
                                selectData={unitLovQueryResponse?.object ?? []}
                                selectDataLabel="lovDisplayVale"
                                selectDataValue="key"
                                fieldName={'unit'}
                                record={customeinst}
                                setRecord={setCustomeinst}
                            />

                        </Form>
                    </Col>
                    <Col md={6}>
                        <Form fluid>


                            <MyInput
                               width="100%"
                                fieldType="select"
                                fieldLabel="Frequency"
                                selectData={FrequencyLovQueryResponse?.object ?? []}
                                selectDataLabel="lovDisplayVale"
                                selectDataValue="key"
                                fieldName={'frequency'}
                                record={customeinst}
                                setRecord={setCustomeinst}
                            />
                        </Form>
                    </Col>
                    <Col md={6}>
                        <Form  fluid>
                            <MyInput
                             
                                width="100%"
                                fieldType="select"
                                fieldLabel="ROA"
                                selectData={filteredList ?? []}
                                selectDataLabel="lovDisplayVale"
                                selectDataValue="key"
                                fieldName={'roa'}
                                record={customeinst}
                                setRecord={setCustomeinst}
                            />

                        </Form>
                    </Col>
                </Row>

            }
            {selectedOption === "3010591042600262" &&
                <Form layout="inline" fluid>

                    <Dropdown style={{ width: "200px" }} title={!selectedPreDefine ? "Pre-defined Instructions" : [
                        selectedPreDefine.dose,

                        selectedPreDefine.unitLvalue?.lovDisplayVale,
                        selectedPreDefine.routLvalue?.lovDisplayVale,
                        selectedPreDefine.frequencyLvalue?.lovDisplayVale
                    ]
                        .filter(Boolean)
                        .join(', ')}>
                        {predefinedInstructionsListResponse && predefinedInstructionsListResponse?.object?.map((item, index) => (
                            <Dropdown.Item key={index}
                                onClick={() => setSelectedPreDefine(item)}>
                                {[item.dose,

                                item.unitLvalue?.lovDisplayVale,
                                item.routLvalue?.lovDisplayVale,
                                item.frequencyLvalue?.lovDisplayVale
                                ]
                                    .filter(Boolean)
                                    .join(', ')}</Dropdown.Item>
                        ))}
                    </Dropdown>
                </Form>
            }
            {selectedOption === "3010573499898196" &&
                <Form layout="inline" fluid>
                    <textarea
                        rows={4}
                        style={{ width: '350px' }}
                        disabled={false}
                        value={munial}
                        onChange={(e) => setMunial(e.target.value)}

                    />


                </Form>
            }

        </div>
    </>)
}
export default Instructions;