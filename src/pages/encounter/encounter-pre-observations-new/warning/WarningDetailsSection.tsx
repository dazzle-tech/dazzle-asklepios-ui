import React from 'react';
import './styles.less';
import { Col, Form, Row } from 'rsuite'; // Form kept for outer <Form fluid> wrapper
import MyInput from '@/components/MyInput';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import clsx from 'clsx';
import { useEnumOptions } from '@/services/enumsApi';
import SectionContainer from '@/components/SectionsoContainer';

const WarningDetailsSection = ({
    warning,
    setWarning,
    edit,
}) => {
    // LOVs
    const { data: warningTypeLovQueryResponse } = useGetLovValuesByCodeQuery('MED_WARNING_TYPS');
    const { data: sourceofinformationLovQueryResponse } = useGetLovValuesByCodeQuery('RELATION');

    // Enum options
    const severityEnumResponse = useEnumOptions('Severity');

    return (
        <SectionContainer
            title="Warning Details"
            content={
                <div
                    className={clsx({
                        'disabled-panel': edit || warning.statusLvalue?.valueCode === 'ARS_CANCEL'
                    })}
                >
                    <Form fluid >
                        <Row className="rows-gap">
                            <Col md={8}>
                                <MyInput
                                    fieldType="select"
                                    fieldLabel="Warning Type"
                                    selectData={warningTypeLovQueryResponse?.object ?? []}
                                    selectDataLabel="lovDisplayVale"
                                    selectDataValue="key"
                                    fieldName="warningType"
                                    record={warning}
                                    setRecord={setWarning}
                                    searchable={false}
                                    required
                                    disabled
                                    width="100%"
                                />
                            </Col>
                            <Col md={8}>
                                <MyInput
                                    fieldName="warning"
                                    record={warning}
                                    setRecord={setWarning}
                                    required
                                    disabled
                                    width="100%"
                                />
                            </Col>
                            <Col md={8}>
                                <MyInput
                                    fieldType="select"
                                    fieldLabel="Severity"
                                    selectData={severityEnumResponse ?? []}
                                    selectDataLabel="label"
                                    selectDataValue="value"
                                    fieldName='severity'
                                    record={warning}
                                    setRecord={setWarning}
                                    searchable={false}
                                    required
                                    disabled
                                    width="100%"
                                />
                            </Col>
                        </Row>

                        <Row className="rows-gap">
                            <Col md={8}>
                                <MyInput
                                    width="100%"
                                    fieldType="date"
                                    fieldName="onsetDate"
                                    record={warning}
                                    setRecord={setWarning}
                                    disabled
                                />
                            </Col>
                            <Col md={8}>
                                <MyInput
                                    fieldLabel="Undefined"
                                    fieldName="onsetDateUndefined"
                                    width="100%"
                                    fieldType="checkbox"
                                    record={warning}
                                    setRecord={setWarning}
                                    disabled
                                />
                            </Col>
                        </Row>

                        <Row className="rows-gap">
                            <Col md={8}>
                                <MyInput
                                    width="100%"
                                    fieldType="select"
                                    fieldLabel="Source of Information"
                                    selectData={sourceofinformationLovQueryResponse?.object ?? []}
                                    selectDataLabel="lovDisplayVale"
                                    selectDataValue="key"
                                    fieldName='sourceOfInformation'
                                    record={warning}
                                    setRecord={setWarning}
                                    disabled
                                />
                            </Col>
                            <Col md={8}>
                                <MyInput
                                    fieldLabel="BY Patient"
                                    fieldName="byPatient"
                                    width="100%"
                                    fieldType="checkbox"
                                    record={warning}
                                    setRecord={setWarning}
                                    disabled
                                />
                            </Col>
                        </Row>

                        <Row className="rows-gap">
                            <Col md={12}>
                                <MyInput
                                    width="100%"
                                    fieldLabel="Note"
                                    fieldType="textarea"
                                    fieldName="note"
                                    record={warning}
                                    setRecord={setWarning}
                                    disabled
                                />
                            </Col>
                            <Col md={12}>
                                <MyInput
                                    width="100%"
                                    fieldType="textarea"
                                    fieldName="actionTaken"
                                    record={warning}
                                    setRecord={setWarning}
                                    disabled
                                />
                            </Col>
                        </Row>
                    </Form>
                </div>
            }
        />
    );
};
export default WarningDetailsSection;
