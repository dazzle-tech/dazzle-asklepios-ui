import React, { useState, useEffect } from 'react';
import { Panel, Form } from 'rsuite';
import MyInput from '@/components/MyInput';
import SectionContainer from '@/components/SectionsoContainer';
import Icd10Search from '@/pages/medical-component/Icd10Search';
import './style.less';
interface PreviewRequestProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    request: any;
    patient: any;
    encounter: any;
}

const PreviewRequest: React.FC<PreviewRequestProps> = ({
    open,
    setOpen,
    request,
    patient,
    encounter
}) => {
    const [isAttachmentModalOpen, setIsAttachmentModalOpen] = useState(false);
    const [previewData, setPreviewData] = useState<any>({});

    useEffect(() => {
        if (request) {
            setPreviewData({
                facilityName: request.facility?.facilityName || '',
                departmentName: request.department?.name || '',
                operationDateTime: request.operationDateTime || '',
                priority: request.priorityLvalue?.lovDisplayVale || '',
                operationName: request.operation?.name || '',
                operationLevel: request.operationLevelLvalue?.lovDisplayVale || '',
                operationType: request.operationTypeLvalue?.lovDisplayVale || '',
                bodyPart: request.bodyPartLvalue?.lovDisplayVale || '',
                sideOfProcedure: request.sideOfProcedureLvalue?.lovDisplayVale || '',
                plannedAnesthesiaType: request.plannedAnesthesiaTypeLvalue?.lovDisplayVale || '',
                implantOrDeviceExpected: request.implantOrDeviceExpected || false,
                needBloodProducts: request.needBloodProducts || false,
                extraDocumentation: request.extraDocumentation || '',
                notes: request.notes || '',
                diagnosisKey: request.diagnosisKey || ''
            });
        }
    }, [request]);

    if (!request) return null;

    return (
        <Panel
            bordered
            className="preview-request"
            header={
                <div className="preview-header">
                    <span>Request Preview</span>
                </div>
            }
        >
            <Form fluid>

                <div className='main-sections-preview-request-container'>
                    {/* Basic Info */}
                    <SectionContainer
                        title="Basic Info"
                        content={
                            <div className="preview-field-group">
                                <MyInput fieldType="text" fieldLabel="Facility" record={previewData} fieldName="facilityName" disabled />
                                <MyInput fieldType="text" fieldLabel="Department" record={previewData} fieldName="departmentName" disabled />
                                <MyInput fieldType="datetime" fieldLabel="Operation Date Time" record={previewData} fieldName="operationDateTime" width={250} disabled />
                                <MyInput fieldType="text" fieldLabel="Priority" record={previewData} fieldName="priority" disabled />
                            </div>
                        }
                    />

                    {/* Operation Details */}
                    <SectionContainer
                        title="Operation Details"
                        content={
                            <div className="preview-field-group">
                                <MyInput fieldType="text" fieldLabel="Operation" record={previewData} fieldName="operationName" disabled />
                                <MyInput fieldType="text" fieldLabel="Operation Level" record={previewData} fieldName="operationLevel" disabled />
                                <MyInput fieldType="text" fieldLabel="Operation Type" record={previewData} fieldName="operationType" disabled />
                                <MyInput fieldType="text" fieldLabel="Body Part" record={previewData} fieldName="bodyPart" disabled />
                                <MyInput fieldType="text" fieldLabel="Side Of Procedure" record={previewData} fieldName="sideOfProcedure" disabled />
                                <MyInput fieldType="text" fieldLabel="Planned Anesthesia Type" record={previewData} fieldName="plannedAnesthesiaType" disabled />
                            </div>
                        }
                    />

                    {/* Diagnosis & Checkboxes */}
                    <SectionContainer
                        title="Diagnosis & Checkboxes"
                        content={
                            <div className="preview-field-group">
                                <div className='icd-10-search-input-handle'>
                                    <Icd10Search object={request} setOpject={() => { }} fieldName="diagnosisKey" fieldLabel="Diagnosis" readOnly />
                                </div>
                                <MyInput fieldType="checkbox" fieldLabel="Implant Or Device Expected" record={previewData} fieldName="implantOrDeviceExpected" disabled />
                                <MyInput fieldType="checkbox" fieldLabel="Need Blood Products" record={previewData} fieldName="needBloodProducts" disabled />
                            </div>
                        }
                    />

                    {/* Notes & Documentation */}
                    <SectionContainer
                        title="Notes & Documentation"
                        content={
                            <div className="preview-field-group">
                                <MyInput fieldType="textarea" fieldLabel="Extra Documentation" record={previewData} fieldName="extraDocumentation" disabled />
                                <MyInput fieldType="textarea" fieldLabel="Notes" record={previewData} fieldName="notes" disabled />
                            </div>
                        }
                    />

                </div>
            </Form>
        </Panel>
    );
};

export default PreviewRequest;
