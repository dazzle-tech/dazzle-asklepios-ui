import React, { useState, useEffect } from "react";
import Diagnosis from "../procedure/Diagnosis";
import MyInput from "@/components/MyInput";
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import AttachmentModal from "@/components/AttachmentUploadModal/AttachmentUploadModal";
import AdvancedModal from "@/components/AdvancedModal";
import MyButton from "@/components/MyButton/MyButton";
import { Form } from "rsuite";
import { useSaveConsultationOrdersMutation } from "@/services/encounterService";
import { newApConsultationOrder } from "@/types/model-types-constructor";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBroom, faFile } from "@fortawesome/free-solid-svg-icons";
import { useGetLovValuesByCodeQuery, useGetPractitionersQuery } from "@/services/setupService";
import { initialListRequest, ListRequest } from "@/types/types";


const Details = ({ patient, encounter, consultationOrders, setConsultationOrder, open, setOpen, refetchCon, editing, editable }) => {
    const dispatch = useAppDispatch();
    const [attachmentsModalOpen, setAttachmentsModalOpen] = useState(false);
    const [saveconsultationOrders, saveConsultationOrdersMutation] =
        useSaveConsultationOrdersMutation();

    const { data: practitionerListResponse } = useGetPractitionersQuery({ ...initialListRequest });
    const { data: consultantSpecialtyLovQueryResponse } =
        useGetLovValuesByCodeQuery('PRACT_SUB_SPECIALTY ');
    const { data: cityLovQueryResponse } = useGetLovValuesByCodeQuery('CITY');
    const { data: consultationMethodLovQueryResponse } = useGetLovValuesByCodeQuery('CONSULT_METHOD');
    const { data: consultationTypeLovQueryResponse } = useGetLovValuesByCodeQuery('CONSULT_TYPE');


    const handleClear = async () => {
        setConsultationOrder({
            ...newApConsultationOrder,
            consultationMethodLkey: null,
            consultationTypeLkey: null,
            cityLkey: null,
            consultantSpecialtyLkey: null,
            preferredConsultantKey: null
        });
    };
    const handleSave = async () => {
        try {
            await saveconsultationOrders({
                ...consultationOrders,
                patientKey: patient.key,
                visitKey: encounter.key,
                statusLkey: '164797574082125',
                createdBy: 'Admin'
            }).unwrap();
            dispatch(notify({ msg: 'saved  Successfully', sev: "success" }));
            refetchCon()
                .then(() => {
                    setOpen(false);
                    handleClear();
                })
                .catch(error => {
                    console.error('Refetch failed:', error);
                });

        } catch (error) {
            dispatch(notify('Save Failed'));
        }
    };

    return (<>
    
       
 
        <AdvancedModal
            open={open}
            setOpen={setOpen}
            size="800px"
            leftWidth="40%"
            rightWidth="60%"
            actionButtonFunction={handleSave}
            isDisabledActionBtn={editable}
            footerButtons={<div style={{ display: 'flex', gap: '5px' }}>
                <MyButton
                    disabled={consultationOrders.key?editable:true}
                    onClick={() => setAttachmentsModalOpen(true)}
                    prefixIcon={() => <FontAwesomeIcon icon={faFile} />}
                >Attachment File</MyButton>


                <MyButton
                    disabled={editable}
                    prefixIcon={() => <FontAwesomeIcon icon={faBroom} />}
                    onClick={handleClear}
                >Clear</MyButton>
            </div>}
            rightTitle='Add Consultation'
            rightContent={
                <Form fluid layout="inline" className={editable ? "disabled-panel" : ""}>
                    <MyInput
                        column
                        disabled={editing}
                        width={200}
                        fieldType="select"
                        fieldLabel="Consultant Specialty"
                        selectData={consultantSpecialtyLovQueryResponse?.object ?? []}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        fieldName={'consultantSpecialtyLkey'}
                        record={consultationOrders}
                        setRecord={setConsultationOrder}
                    />
                    <MyInput
                        column
                        width={200}
                        disabled={editing}
                        fieldType="select"
                        fieldLabel="City"
                        selectData={cityLovQueryResponse?.object ?? []}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        fieldName={'cityLkey'}
                        record={consultationOrders}
                        setRecord={setConsultationOrder}
                    />
                    <MyInput
                        column
                        width={200}
                        disabled={editing}
                        fieldType="select"
                        fieldLabel="Preferred Consultant"
                        fieldName={'preferredConsultantKey'}
                        selectData={practitionerListResponse?.object ?? []}
                        selectDataLabel="practitionerFullName"
                        selectDataValue="key"
                        record={consultationOrders}
                        setRecord={setConsultationOrder}
                    />
                    <MyInput
                        column
                        width={200}
                        disabled={editing}
                        fieldType="select"
                        fieldLabel="Consultation Method"
                        selectData={consultationMethodLovQueryResponse?.object ?? []}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        fieldName={'consultationMethodLkey'}
                        record={consultationOrders}
                        setRecord={setConsultationOrder}
                        searchable={false}
                    />
                    <MyInput
                        column
                        width={200}
                        disabled={editing}
                        fieldType="select"
                        fieldLabel="Consultation Type"
                        selectData={consultationTypeLovQueryResponse?.object ?? []}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        fieldName={'consultationTypeLkey'}
                        record={consultationOrders}
                        setRecord={setConsultationOrder}
                        searchable={false}
                    />
                    <MyInput
                        column
                        width={400}
                        disabled={editing}
                        fieldName="consultationContent"
                        rows={6}
                        fieldType="textarea"
                        record={consultationOrders}
                        setRecord={setConsultationOrder}
                    />
                    <MyInput
                        column
                        width={400}
                        disabled={editing}
                        fieldName="notes"
                        rows={6}
                        fieldType="textarea"
                        record={consultationOrders}
                        setRecord={setConsultationOrder}
                    />
                </Form>
            }
            leftContent={<Diagnosis patient={patient} encounter={encounter} />}
        ></AdvancedModal>
    </>
    );
}
export default Details;