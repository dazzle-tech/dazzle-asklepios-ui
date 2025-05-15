import MyInput from "@/components/MyInput";
import MyModal from "@/components/MyModal/MyModal";
import { useAppDispatch } from "@/hooks";
import { useGetDiagnosticOrderTestReportNotesByReportIdQuery, useSaveDiagnosticOrderTestReportNotesMutation } from "@/services/radService";
import { useGetLovValuesByCodeQuery } from "@/services/setupService";
import { newApDiagnosticOrderTests, newApDiagnosticOrderTestsResultNotes } from "@/types/model-types-constructor";
import { notify } from "@/utils/uiReducerActions";
import { faFileLines } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Image } from "@rsuite/icons";
import React, { useState, useEffect, useRef } from "react";
import { FaBold, FaItalic, FaLink } from "react-icons/fa6";
import { ButtonGroup, Col, Form, IconButton, List, Row } from "rsuite";
const AddReportModal = ({ open, setOpen, saveReport, report, setReport, saveTest, test, setTest, resultFetch}) => {
    const dispatch = useAppDispatch();
    
    const { data: severityLovQueryResponse } = useGetLovValuesByCodeQuery('SEVERITY');
    


    return (<>
        <MyModal
            title="Add Report"
            open={open}
            setOpen={setOpen}
            steps={[{ title: "Report", icon: <FontAwesomeIcon icon={faFileLines} /> }]}
            actionButtonFunction={async () => {
                saveReport({ ...report, statusLkey: '265123250697000' }).unwrap();

                const Response = await saveTest({
                    ...test,
                    processingStatusLkey: '265123250697000'
                }).unwrap();

                setTest({ ...newApDiagnosticOrderTests });
                dispatch(notify({ msg: 'Saved successfully', sev: 'success' }));
                setTest({ ...Response });
                // await fetchTest();
                await resultFetch();

                setOpen(false);
            }}
            size="30vw"
            bodyheight="65vh"
            content={<>
                <Row>
                    <Col md={24}>
                        <ButtonGroup>
                            <IconButton icon={<FaBold />} />
                            <IconButton icon={<FaItalic />} />
                            <IconButton icon={<List />} />
                            <IconButton icon={<FaLink />} />
                            <IconButton icon={<Image />} />

                        </ButtonGroup>
                    </Col>
                </Row>
                <Row >
                    <Col md={24}>
                        <Form fluid>
                            <MyInput
                                width="100%"
                                disabled={report.statusLkey == '265089168359400' ? true : false}
                                fieldName={'severityLkey'}
                                fieldType="select"
                                selectData={severityLovQueryResponse?.object ?? []}
                                selectDataLabel="lovDisplayVale"
                                selectDataValue="key"
                                record={report}
                                setRecord={setReport}
                            />
                        </Form>
                    </Col>
                </Row>
                <Row >
                    <Col md={24}>
                        <Form fluid>
                            <MyInput
                                disabled={report.statusLkey == '265089168359400' ? true : false}
                                width="100%"
                                hight={200}
                                fieldLabel={''}
                                fieldName={'reportValue'}
                                fieldType="textarea"
                                record={report}
                                setRecord={setReport}
                            />
                        </Form></Col>

                </Row>
            </>}
        ></MyModal></>)
}
export default AddReportModal;