import MyButton from "@/components/MyButton/MyButton";
import MyInput from "@/components/MyInput";
import MyModal from "@/components/MyModal/MyModal";
import { useAppDispatch } from "@/hooks";
import { useSaveWarningsMutation } from "@/services/observationService";
import { useGetLovValuesByCodeQuery } from "@/services/setupService";
import { newApVisitWarning } from "@/types/model-types-constructor";
import { notify } from "@/utils/uiReducerActions";
import { faWarning } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import clsx from "clsx";
import React, { useState, useEffect } from "react";
import { Col, Form, Row, Text } from "rsuite";
const DetailsModal = ({ open, setOpen, warning, setWarning, fetchwarnings, patient, encounter, editing, edit }) => {
    const [editDate, setEditDate] = useState({ editdate: true });
    const [editSourceof, seteditSourceof] = useState({ editSource: true });
    const dispatch = useAppDispatch();
    const { data: warningTypeLovQueryResponse } = useGetLovValuesByCodeQuery('MED_WARNING_TYPS');
    const { data: severityLovQueryResponse } = useGetLovValuesByCodeQuery('SEVERITY');
    const { data: sourceofinformationLovQueryResponse } = useGetLovValuesByCodeQuery('RELATION');
    const [saveWarning, saveWarningMutation] = useSaveWarningsMutation();
    const handleSave = async () => {

        try {
            const Response = await saveWarning({
                ...warning,
                patientKey: patient.key,
                visitKey: encounter.key,
                statusLkey: '9766169155908512',
                firstTimeRecorded: warning.firstTimeRecorded ? new Date(warning.firstTimeRecorded).getTime() : null
            }).unwrap();
            setWarning({ ...newApVisitWarning });
            dispatch(notify('saved  Successfully'));

            //  setShowPrev(false);
            setOpen(false);
            await fetchwarnings();

            handleClear();
            //setShowPrev(true);
        } catch (error) {
            dispatch(notify('Save Failed'));
            console.error('An error occurred:', error);
        }
    };
    const handleClear = () => {
        setWarning({
            ...newApVisitWarning,
            sourceOfInformationLkey: null,
            severityLkey: null,
            warningTypeLkey: null
        });

        setEditDate({ editdate: true });
        seteditSourceof({ editSource: true });
    };
    return (<>
        <MyModal
            open={open}
            setOpen={setOpen}
            title="Add Warning"
            actionButtonFunction={handleSave}
            isDisabledActionBtn={!edit ? warning.statusLvalue?.valueCode == "ARS_CANCEL" ? true : false : true}
            size='40vw'
            position='right'
            steps={[

                {
                    title: 'Warning', icon: <FontAwesomeIcon icon={faWarning} />
                    , footer: <MyButton

                        onClick={handleClear}
                    >Clear</MyButton>
                },
            ]}
            content={
                <Row gutter={20} className={clsx({ "disabled-panel": edit || warning.statusLvalue?.valueCode === "ARS_CANCEL" })}>
                    <Col md={12}>
                        <Row>
                            <Col md={12}>
                                <Form fluid>
                                    <MyInput

                                        disabled={editing}
                                        width="100%"
                                        fieldType="select"
                                        fieldLabel="Warning Type"
                                        selectData={warningTypeLovQueryResponse?.object ?? []}
                                        selectDataLabel="lovDisplayVale"
                                        selectDataValue="key"
                                        fieldName={'warningTypeLkey'}
                                        record={warning}
                                        setRecord={setWarning}
                                    />
                                </Form>
                            </Col>
                            <Col md={12}>
                                <Form fluid>
                                    <MyInput

                                        disabled={editing}
                                        width="100%"
                                        fieldName={'warning'}
                                        record={warning}
                                        setRecord={setWarning}
                                    />

                                </Form>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={12}>
                                <Form fluid>
                                    <MyInput

                                        disabled={editing}
                                        width="100%"
                                        fieldType="select"
                                        fieldLabel="Severity"
                                        selectData={severityLovQueryResponse?.object ?? []}
                                        selectDataLabel="lovDisplayVale"
                                        selectDataValue="key"
                                        fieldName={'severityLkey'}
                                        record={warning}
                                        setRecord={setWarning}
                                        searchable={false}
                                    />
                                </Form></Col>
                            <Col md={12}>
                                <Form fluid>

                                </Form></Col>
                        </Row>
                        <Row>
                            <Col md={24}>
                                <Form fluid>
                                    <MyInput
                                        width='100%'

                                        fieldLabel="Notes"
                                        fieldType="textarea"
                                        fieldName="notes"
                                        height={100}
                                        record={warning}
                                        setRecord={setWarning}
                                        disabled={editing}
                                    />
                                </Form>
                            </Col>
                        </Row>
                    </Col>
                    <Col md={12}>
                        <Row>
                            <Col md={12}>
                                <Form fluid>
                                    <MyInput
                                        disabled={editSourceof.editSource}
                                        width="100%"
                                        fieldType="select"
                                        selectData={sourceofinformationLovQueryResponse?.object ?? []}
                                        selectDataLabel="lovDisplayVale"
                                        selectDataValue="key"
                                        fieldName={'sourceOfInformationLkey'}
                                        record={warning}
                                        setRecord={setWarning}
                                        searchable={false}
                                    />
                                </Form>
                            </Col>
                            <Col md={12}>
                                <Form fluid>
                                    <MyInput
                                        fieldLabel="By Patient"
                                        fieldName="editSource"
                                        width="100%"
                                        fieldType='checkbox'
                                        record={editSourceof}
                                        setRecord={seteditSourceof}
                                    />
                                </Form>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={12}>
                                <Form fluid>
                                    <MyInput
                                        disabled={editDate.editdate}
                                        width="100%"
                                        fieldName="firstTimeRecorded"
                                        fieldType="date"
                                        record={warning}
                                        setRecord={setWarning}
                                    />
                                </Form>
                            </Col>
                            <Col md={12}>
                                <Form fluid>
                                    <MyInput
                                        fieldLabel="Undefined"
                                        fieldName="editdate"

                                        width="100%"
                                        fieldType='checkbox'
                                        record={editDate}
                                        setRecord={setEditDate}
                                    />
                                </Form>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={24}>
                                <Form fluid>
                                    <MyInput
                                        width='100%'
                                        fieldLabel="Action Taken"
                                        fieldType="textarea"
                                        fieldName="actionTake"
                                        height={100}
                                        record={warning}
                                        setRecord={setWarning}
                                        disabled={editing}
                                    />
                                </Form>
                            </Col>
                        </Row>
                    </Col>
                </Row>



            }

        />
    </>)
}
export default DetailsModal;