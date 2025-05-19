import MyInput from '@/components/MyInput';
import { useAppDispatch, useAppSelector } from '@/hooks';
import React from 'react';
import { Form } from 'rsuite';
import 'react-tabs/style/react-tabs.css';
import { useSaveNewSecondaryDocumentMutation } from '@/services/patientService'
import { newApPatientSecondaryDocuments } from '@/types/model-types-constructor';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { notify } from '@/utils/uiReducerActions';
import { faIdCard } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import '../styles.less'
import MyModal from '@/components/MyModal/MyModal';
const AddExtraDetails = ({ localPatient, open, setOpen, secondaryDocument, setSecondaryDocument, refetch }) => {
    const authSlice = useAppSelector(state => state.auth);
    const [saveSecondaryDocument] = useSaveNewSecondaryDocumentMutation();
    // Fetch LOV data for various fields
    const { data: docTypeLovQueryResponse } = useGetLovValuesByCodeQuery('DOC_TYPE');
    const { data: countryLovQueryResponse } = useGetLovValuesByCodeQuery('CNTRY');
    const dispatch = useAppDispatch();
    // MyModal Content
    const content = () => (
        <Form layout="inline" fluid className='patient-doc-secondary-container'>
            <MyInput
                required
                column
                width={300}
                fieldLabel="Document Country"
                fieldType="select"
                fieldName="documentCountryLkey"
                selectData={countryLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={secondaryDocument}
                setRecord={newRecord =>
                    setSecondaryDocument({
                        ...secondaryDocument,
                        ...newRecord
                    })
                }
            />
            <MyInput
                required
                column
                width={300}
                fieldLabel="Document Type"
                fieldType="select"
                fieldName="documentTypeLkey"
                selectData={docTypeLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={secondaryDocument}
                setRecord={newRecord =>
                    setSecondaryDocument({
                        ...secondaryDocument,
                        ...newRecord
                    })
                }
                searchable={false}
            />
            <MyInput
                required
                column
                width={300}
                fieldLabel="Document Number"
                fieldName="documentNo"
                record={secondaryDocument}
                setRecord={newRecord =>
                    setSecondaryDocument({
                        ...secondaryDocument,
                        ...newRecord,
                        documentNo:
                            secondaryDocument.documentTypeLkey === 'NO_DOC'
                                ? 'NO_DOC'
                                : newRecord.documentNo
                    })
                }
                disabled={secondaryDocument.documentTypeLkey === 'NO_DOC'}
            />
        </Form>)
    // handle Clear Secondary Document
    const handleCleareSecondaryDocument = () => {
        setOpen(false);
        setSecondaryDocument(newApPatientSecondaryDocuments);
    };
    // handle Save Secondary Document
    const handleSaveSecondaryDocument = () => {
        if (secondaryDocument.key === undefined) {
            saveSecondaryDocument({
                ...secondaryDocument,
                patientKey: localPatient.key,
                createdBy: authSlice.user.key,
                documentNo:
                    secondaryDocument.documentTypeLkey === 'NO_DOC'
                        ? 'No Document '
                        : secondaryDocument.documentNo
            })
                .unwrap()
                .then(() => {
                    dispatch(notify({msg:'Document Added Successfully',sev: 'success'}));
                    refetch();
                    handleCleareSecondaryDocument();
                });
        }
        else if (secondaryDocument.key) {
            saveSecondaryDocument({
                ...secondaryDocument,
                patientKey: localPatient.key,
                updatedBy: authSlice.user.key,
                documentNo:
                    secondaryDocument.documentTypeLkey === 'NO_DOC'
                        ? 'No Document '
                        : secondaryDocument.documentNo
            })
                .unwrap()
                .then(() => {
                    dispatch(notify({msg:'Document Updated Successfully',sev: 'success'}));
                    refetch();
                    handleCleareSecondaryDocument();
                });
        }

    };
    return (
        <MyModal
            open={open}
            setOpen={setOpen}
            size="xs"
            bodyheight="60vh"
            title="Secondary Document"
            content={content}
            actionButtonFunction={handleSaveSecondaryDocument}
            actionButtonLabel="Save"
            hideBack={true}
            hideCanel={false}
            steps={[{ title: 'Secondary Document', icon:<FontAwesomeIcon icon={ faIdCard }/>}]}
        />
    );
};

export default AddExtraDetails;
