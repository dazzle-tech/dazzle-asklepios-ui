import React, { useEffect, useState } from 'react';
import './styles.less';
import { Col, Form, Row } from 'rsuite';
import MyInput from '@/components/MyInput';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import clsx from 'clsx';
import { useEnumOptions } from '@/services/enumsApi';
import {
    useGetAllergensByTypewithoutPaginationQuery,

} from '@/services/setup/allergensService';
import { useGetAllMedicationCategoriesClassesQuery } from '@/services/setup/medication-categories/MedicationCategoriesClassService';
import { useGetActiveIngredientsQuery } from '@/services/setup/activeIngredients/activeIngredientsService';
import SectionContainer from '@/components/SectionsoContainer';

const AllergyDetailsSection = ({
    allerges,
    setAllerges,
    edit,
}) => {
    const [reactions, setReactions] = useState({ reactions: [] });
    // fetch data
    const { data: onsetLovQueryResponse } = useGetLovValuesByCodeQuery('ONSET');
    const { data: reactionLovQueryResponse } = useGetLovValuesByCodeQuery('ALLRGY_REACTION_TYP');
    const { data: treatmentstrategyLovQueryResponse } = useGetLovValuesByCodeQuery('TREAT_STRATGY');
    const { data: sourceofinformationLovQueryResponse } = useGetLovValuesByCodeQuery('RELATION');
    const { data: allgPropnLovQueryResponse } = useGetLovValuesByCodeQuery('ALLG_PROPN');
    const { data: criticalityLovQueryResponse } = useGetLovValuesByCodeQuery('CRITICALITY');
    const { data: allergensListResponse } = useGetAllergensByTypewithoutPaginationQuery({
        type: allerges?.allergenType
    });
    const {
        data: medicationClassesListResponse,
        isLoading: isMedicationClassesLoaded
    } = useGetAllMedicationCategoriesClassesQuery({});
    const {
        data: activeIngredientsAll,
    } = useGetActiveIngredientsQuery({});
    // fetch enum lists 
    const allergyTypeEnumResponse = useEnumOptions('AllergenTypes');
    const severityEnumResponse = useEnumOptions('Severity');
    const [activeIngredientsObject, setActiveIngredientsObject] = useState({ activeIngredients: [] });

    useEffect(() => {
        setActiveIngredientsObject({ activeIngredients: allerges.activeIngredients?.map(ai => ai.activeIngredientId) || [] })
        setReactions({
            reactions: allerges.allergicReactions
                .split(',')
                .map(r => r.trim())
                .filter(Boolean)
        });
    }, [allerges]);

      // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';


    return (
        <SectionContainer
            title="Allergy Details"
            content={
                <div
                dir={dir}
                    className={clsx({
                        'disabled-panel': edit || allerges.statusLvalue?.valueCode === 'ARS_CANCEL'
                    })}
                >
                    <Form fluid >
                        <Form fluid layout='inline'>
                            <MyInput
                                fieldType="select"
                                fieldLabel="Allergy Type"
                                selectData={allergyTypeEnumResponse ?? []}
                                selectDataLabel="label"
                                selectDataValue="value"
                                fieldName='allergenType'
                                record={allerges}
                                setRecord={setAllerges}
                                searchable={false}
                                required
                                disabled
                            />
                            {allerges?.allergenType === "MEDICATION" ? (
                            <>
                                <MyInput
                                fieldType="select"
                                fieldLabel="Medication Class"
                                selectData={medicationClassesListResponse ?? []}
                                selectDataLabel="name"
                                selectDataValue="id"
                                fieldName='medicationClassId'
                                record={allerges}
                                setRecord={setAllerges}
                                required
                                disabled
                                />

                                <MyInput
                                fieldType="checkPicker"
                                fieldLabel="Active Ingredient"
                                selectData={activeIngredientsAll?.data ?? []}
                                selectDataLabel="name"
                                selectDataValue="id"
                                fieldName='activeIngredients'
                                record={activeIngredientsObject}
                                setRecord={setActiveIngredientsObject}
                                disabledItemValues
                                />
                            </>
                            ) : allerges?.allergenType === "OTHER" ? (

                            <MyInput
                                fieldType="text"
                                fieldLabel="Allergen"
                                fieldName="allergenName"
                                record={allerges}
                                setRecord={setAllerges}
                                disabled
                            />

                            ) : (

                            <MyInput
                                fieldType="select"
                                fieldLabel="Allergen"
                                selectData={allergensListResponse ?? []}
                                selectDataLabel="name"
                                selectDataValue="id"
                                fieldName='allergenId'
                                record={allerges}
                                setRecord={setAllerges}
                                searchable={false}
                                required
                                disabled
                            />

                            )}
                            <MyInput
                                fieldType="select"
                                fieldLabel="Severity"
                                selectData={severityEnumResponse ?? []}
                                selectDataLabel="label"
                                selectDataValue="value"
                                fieldName='severity'
                                record={allerges}
                                setRecord={setAllerges}
                                searchable={false}
                                required
                                disabled
                            />
                        </Form>
                        <Row className="rows-gap">
                            <Col md={8}>
                                <MyInput
                                    width="100%"
                                    fieldType="select"
                                    fieldLabel="Criticality"
                                    selectData={criticalityLovQueryResponse?.object ?? []}
                                    selectDataLabel="lovDisplayVale"
                                    selectDataValue="key"
                                    fieldName='criticality'
                                    record={allerges}
                                    setRecord={setAllerges}
                                    searchable={false}
                                    disabled
                                />
                            </Col>
                            <Col md={8}>
                                <MyInput
                                    width="100%"
                                    fieldName='certainty'
                                    record={allerges}
                                    setRecord={setAllerges}
                                    disabled
                                />
                            </Col>
                            <Col md={8}>
                                <MyInput
                                    width="100%"
                                    fieldType="select"
                                    fieldLabel="Treatment Strategy"
                                    selectData={treatmentstrategyLovQueryResponse?.object ?? []}
                                    selectDataLabel="lovDisplayVale"
                                    selectDataValue="key"
                                    fieldName='treatmentStrategy'
                                    record={allerges}
                                    setRecord={setAllerges}
                                    searchable={false}
                                    disabled
                                />
                            </Col>
                        </Row>
                        <Row className="rows-gap">
                            <Col md={8}>
                                <MyInput
                                    width="100%"
                                    fieldType="select"
                                    fieldLabel="Onset"
                                    selectData={onsetLovQueryResponse?.object ?? []}
                                    selectDataLabel="lovDisplayVale"
                                    selectDataValue="key"
                                    fieldName='onset'
                                    record={allerges}
                                    setRecord={setAllerges}
                                    searchable={false}
                                    disabled
                                />
                            </Col>
                            <Col md={8}>
                                <MyInput
                                    width="100%"
                                    fieldType="date"
                                    fieldName="onsetDate"
                                    record={allerges}
                                    setRecord={setAllerges}
                                    disabled
                                />
                            </Col>
                            <Col md={8}>
                                <MyInput
                                    fieldLabel="Undefined"
                                    fieldName="onsetDateUndefined"
                                    width="100%"
                                    fieldType="checkbox"
                                    record={allerges}
                                    setRecord={setAllerges}
                                    disabled
                                />
                            </Col>
                        </Row>
                        <Row className="rows-gap">
                            <Col md={8}>
                                <MyInput
                                    width="100%"
                                    fieldType="select"
                                    fieldLabel="Type of Propensity"
                                    selectData={allgPropnLovQueryResponse?.object ?? []}
                                    selectDataLabel="lovDisplayVale"
                                    selectDataValue="key"
                                    fieldName='typeOfPropensity'
                                    record={allerges}
                                    setRecord={setAllerges}
                                    searchable={false}
                                    disabled
                                />
                            </Col>
                            <Col md={8}>
                                <Form fluid>
                                    <MyInput
                                        width="100%"
                                        fieldType="select"
                                        fieldLabel="Source of Information"
                                        selectData={sourceofinformationLovQueryResponse?.object ?? []}
                                        selectDataLabel="lovDisplayVale"
                                        selectDataValue="key"
                                        fieldName='sourceOfInformation'
                                        record={allerges}
                                        setRecord={setAllerges}
                                        disabled
                                    />
                                </Form>
                            </Col>
                            <Col md={8}>
                                <Form fluid>
                                    <MyInput
                                        fieldLabel="BY Patient"
                                        fieldName="byPatient"
                                        width="100%"
                                        fieldType="checkbox"
                                        record={allerges}
                                        setRecord={setAllerges}
                                        disabled
                                    />
                                </Form>
                            </Col>
                        </Row>
                        <Row className="rows-gap">
                            <Row>
                                <Col md={24}>
                                    <MyInput
                                        width="100%"
                                        fieldType="checkPicker"
                                        fieldLabel="Allergic Reactions"
                                        selectData={reactionLovQueryResponse?.object ?? []}
                                        selectDataLabel="lovDisplayVale"
                                        selectDataValue="key"
                                        fieldName='reactions'
                                        record={reactions}
                                        setRecord={setReactions}
                                        disabledItemValues
                                    />
                                </Col>
                            </Row>
                            <MyInput
                                width="100%"
                                fieldLabel="Note"
                                fieldType="textarea"
                                fieldName="note"
                                height={90}
                                record={allerges}
                                setRecord={setAllerges}
                                disabled
                            />
                        </Row>
                    </Form>
                </div>
            }
        />
    );
};
export default AllergyDetailsSection;