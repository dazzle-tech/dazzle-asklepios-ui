import React, { useEffect, useState } from 'react';
import './styles.less';
import MyModal from '@/components/MyModal/MyModal';
import MyButton from '@/components/MyButton/MyButton';
import { faPersonDotsFromLine } from '@fortawesome/free-solid-svg-icons';
import { Col, DatePicker, Form, Input, Row } from 'rsuite';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import MyInput from '@/components/MyInput';
import {
    useGetLovValuesByCodeQuery,
    useGetAllergensQuery
} from '@/services/setupService';
import { initialListRequest } from '@/types/types';
import MyLabel from '@/components/MyLabel';
import { useSaveAllergiesMutation } from '@/services/observationService';
import { notify } from '@/utils/uiReducerActions';
import { useAppDispatch } from '@/hooks';
const DetailsModal = ({ open, setOpen, allerges, setAllerges, edit, editing, patient, encounter, handleClear, fetchallerges }) => {
    const dispatch = useAppDispatch();
    const { data: allergyTypeLovQueryResponse } = useGetLovValuesByCodeQuery('ALLERGEN_TYPES');
    const { data: severityLovQueryResponse } = useGetLovValuesByCodeQuery('SEVERITY');
    const { data: onsetLovQueryResponse } = useGetLovValuesByCodeQuery('ONSET');
    const { data: reactionLovQueryResponse } = useGetLovValuesByCodeQuery('ALLRGY_REACTION_TYP');
    const { data: treatmentstrategyLovQueryResponse } = useGetLovValuesByCodeQuery('TREAT_STRATGY');
    const { data: sourceofinformationLovQueryResponse } = useGetLovValuesByCodeQuery('RELATION');
    const { data: allgPropnLovQueryResponse } = useGetLovValuesByCodeQuery('ALLG_PROPN');
    const { data: criticalityLovQueryResponse } = useGetLovValuesByCodeQuery('CRITICALITY');
    const [saveAllergies, saveAllergiesMutation] = useSaveAllergiesMutation();
    const [selectedOnsetDate, setSelectedOnsetDate] = useState(null);
    const [reactionDescription, setReactionDescription] = useState();
    const [editOnset, setEditOnset] = useState({ editdate: true });
    const [editSourceof, seteditSourceof] = useState({ editSource: true });
    const { data: allergensListResponse } = useGetAllergensQuery({
        ...initialListRequest,
        filters: [
            {
                fieldName: 'allergen_type_lkey',
                operator: 'match',
                value: allerges.allergyTypeLkey
            }
        ]
    });
    useEffect(() => {
        if (allerges.reactionDescription != null) {

            setReactionDescription(prevadminInstructions =>
                prevadminInstructions
                    ? `${prevadminInstructions}, ${reactionLovQueryResponse?.object?.find(
                        item => item.key === allerges.reactionDescription
                    )?.lovDisplayVale
                    }`
                    : reactionLovQueryResponse?.object?.find(
                        item => item.key === allerges.reactionDescription
                    )?.lovDisplayVale
            );
        }
    }, [allerges.reactionDescription]);
    useEffect(() => {
        if (allerges.onsetDate != 0) {
            setEditOnset({ editdate: false });

        }
        if (allerges.sourceOfInformationLkey != null) {
            seteditSourceof({ editSource: false });
        }
    }, [allerges]);
    useEffect(() => {
        if (editOnset.editdate) {
            setAllerges({ ...allerges, onsetDate: 0 })
        }
    }, [editOnset.editdate])

    const handleSave = async () => {

        try {
            await saveAllergies({
                ...allerges,
                patientKey: patient?.key,
                visitKey: encounter?.key,
                statusLkey: '9766169155908512',
                reactionDescription: reactionDescription,
                onsetDate: allerges.onsetDate ? new Date(allerges.onsetDate).getTime() : null
            }).unwrap();
            dispatch(notify({ msg: 'Saved Successfully', sev: "success" }));
            setOpen(false)
            await fetchallerges()
            await handleClear();

        } catch (error) {
            dispatch(notify({ msg: 'Save Failed', sev: "error" }));


        }
    };

    return (<>
        <MyModal
            open={open}
            setOpen={setOpen}
            title="Add Allergy"
            actionButtonFunction={handleSave}
            bodyheight={550}
            isDisabledActionBtn={!edit?allerges.statusLvalue?.valueCode=="ARS_CANCEL"?true:false:true}
            size='700px'
            position='right'
            steps={[

                {
                    title: 'Allergy', icon: <FontAwesomeIcon icon={faPersonDotsFromLine} />, footer: <MyButton

                        onClick={handleClear}
                    >Clear</MyButton>
                },
            ]}
            content={

                <div className={!edit?allerges.statusLvalue?.valueCode=="ARS_CANCEL"?"disabled-panel":"":"disabled-panel"}>
                    <Row className='rows-gap' >
                        <Col md={8}>
                            <Form fluid>
                                <MyInput

                                    disabled={editing}
                                    width="100%"
                                    fieldType="select"
                                    fieldLabel="Allergy Type"
                                    selectData={allergyTypeLovQueryResponse?.object ?? []}
                                    selectDataLabel="lovDisplayVale"
                                    selectDataValue="key"
                                    fieldName={'allergyTypeLkey'}
                                    record={allerges}
                                    setRecord={setAllerges}
                                    searchable={false}
                                />
                            </Form>
                        </Col>
                        <Col md={8}>
                            <Form fluid>
                                <MyInput

                                    disabled={editing}
                                    width="100%"
                                    fieldType="select"
                                    fieldLabel="Allergen"
                                    selectData={allergensListResponse?.object ?? []}
                                    selectDataLabel="allergenName"
                                    selectDataValue="key"
                                    fieldName={'allergenKey'}
                                    record={allerges}
                                    setRecord={setAllerges}
                                    searchable={false}
                                />
                            </Form>
                        </Col>
                        <Col md={8}>
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
                                    record={allerges}
                                    setRecord={setAllerges}
                                    searchable={false}
                                />
                            </Form>
                        </Col>
                    </Row>
                    <Row className='rows-gap'>
                        <Col md={8}>
                            <Form fluid>
                                <MyInput

                                    disabled={editing}
                                    width="100%"
                                    fieldType="select"
                                    fieldLabel="Criticality"
                                    selectData={criticalityLovQueryResponse?.object ?? []}
                                    selectDataLabel="lovDisplayVale"
                                    selectDataValue="key"
                                    fieldName={'criticalityLkey'}
                                    record={allerges}
                                    setRecord={setAllerges}
                                    searchable={false}
                                />
                            </Form>
                        </Col>
                        <Col md={8}>
                            <Form fluid>
                                <MyInput

                                    disabled={editing}
                                    width="100%"
                                    fieldName={'certainty'}
                                    record={allerges}
                                    setRecord={setAllerges}
                                />
                            </Form>
                        </Col>
                        <Col md={8}>
                            <Form fluid>
                                <MyInput

                                    disabled={editing}
                                    width="100%"
                                    fieldType="select"
                                    fieldLabel="Treatment Strategy"
                                    selectData={treatmentstrategyLovQueryResponse?.object ?? []}
                                    selectDataLabel="lovDisplayVale"
                                    selectDataValue="key"
                                    fieldName={'treatmentStrategyLkey'}
                                    record={allerges}
                                    setRecord={setAllerges}
                                    searchable={false}
                                />
                            </Form>
                        </Col>
                    </Row>
                    <Row className='rows-gap'>
                        <Col md={8}>
                            <Form fluid>
                                <MyInput
                                    disabled={editing}
                                    width="100%"
                                    fieldType="select"
                                    fieldLabel="Onset"
                                    selectData={onsetLovQueryResponse?.object ?? []}
                                    selectDataLabel="lovDisplayVale"
                                    selectDataValue="key"
                                    fieldName={'onsetLkey'}
                                    record={allerges}
                                    setRecord={setAllerges}
                                    searchable={false}
                                />
                            </Form>
                        </Col>
                        <Col md={8}>
                            <Form fluid>
                                <MyInput
                                    width="100%"
                                    fieldType='date'
                                    fieldName="onsetDate"
                                    record={allerges}
                                    setRecord={setAllerges}
                                    disabled={editOnset.editdate}
                                />
                            </Form>
                        </Col>
                        <Col md={8}>
                            <Form fluid>
                                <MyInput
                                    fieldLabel="Undefined"
                                    fieldName="editdate"
                                    width="100%"
                                    fieldType='checkbox'
                                    record={editOnset}
                                    setRecord={setEditOnset}
                                />
                            </Form>
                        </Col>
                    </Row>
                    <Row className='rows-gap'>
                        <Col md={8}>
                            <Form fluid>
                                <MyInput

                                    disabled={editing}
                                    width="100%"
                                    fieldType="select"
                                    fieldLabel="Type of Propensity"
                                    selectData={allgPropnLovQueryResponse?.object ?? []}
                                    selectDataLabel="lovDisplayVale"
                                    selectDataValue="key"
                                    fieldName={'typeOfPropensityLkey'}
                                    record={allerges}
                                    setRecord={setAllerges}
                                    searchable={false}
                                />
                            </Form>
                        </Col>
                        <Col md={8}>
                            <Form fluid>
                                <MyInput

                                    disabled={editSourceof.editSource}
                                    width="100%"
                                    fieldType="select"
                                    fieldLabel="Source of Information"
                                    selectData={sourceofinformationLovQueryResponse?.object ?? []}
                                    selectDataLabel="lovDisplayVale"
                                    selectDataValue="key"
                                    fieldName={'sourceOfInformationLkey'}
                                    record={allerges}
                                    setRecord={setAllerges}
                                />
                            </Form>
                        </Col>
                        <Col md={8}>
                            <Form fluid>
                                <MyInput
                                    fieldLabel="BY Patient"
                                    fieldName="editSource"
                                    width="100%"
                                    fieldType='checkbox'
                                    record={editSourceof}
                                    setRecord={seteditSourceof}
                                />
                            </Form>
                        </Col>
                    </Row>
                    <Row className='rows-gap'>
                        <Col md={12}>
                            <Row>
                                <Col md={24}>
                                    <Form fluid>
                                        <MyInput

                                            disabled={editing}
                                            width='100%'
                                            fieldType="select"
                                            fieldLabel="Allergic Reactions"
                                            selectData={reactionLovQueryResponse?.object ?? []}
                                            selectDataLabel="lovDisplayVale"
                                            selectDataValue="key"
                                            fieldName={'reactionDescription'}
                                            record={allerges}
                                            setRecord={setAllerges}
                                        />
                                    </Form>
                                </Col>
                            </Row>
                            <Row>
                                <Col md={24}>
                                    <Input
                                        as="textarea"
                                        disabled={editing}
                                        onChange={e => setReactionDescription(e)}
                                        value={reactionDescription}
                                        className='fill-width'
                                        rows={2}
                                    />
                                </Col>
                            </Row>
                        </Col>
                        <Col md={12}>
                            <Form fluid>
                                <MyInput
                                    width='100%'
                                    fieldLabel="Note"
                                    fieldType="textarea"
                                    fieldName="notes"
                                    height={90}
                                    record={allerges}
                                    setRecord={setAllerges}
                                    disabled={editing}
                                />
                            </Form></Col>
                    </Row>
                </div>
            }
        />
    </>)
}
export default DetailsModal;


