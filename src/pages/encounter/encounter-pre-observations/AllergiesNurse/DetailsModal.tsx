import React, { useEffect, useState } from 'react';
import './styles.less';
import MyModal from '@/components/MyModal/MyModal';
import MyButton from '@/components/MyButton/MyButton';
import { faPersonDotsFromLine } from '@fortawesome/free-solid-svg-icons';
import { DatePicker, Form, Input } from 'rsuite';
import MyInput from '@/components/MyInput';
import {
    useGetLovValuesByCodeQuery,
    useGetAllergensQuery
} from '@/services/setupService';
import { initialListRequest } from '@/types/types';
import MyLabel from '@/components/MyLabel';
const DetailsModal = ({ open, setOpen, allerges, setAllerges, edit, editing, handleSave ,handleClear }) => {
    const { data: allergyTypeLovQueryResponse } = useGetLovValuesByCodeQuery('ALLERGEN_TYPES');
    const { data: severityLovQueryResponse } = useGetLovValuesByCodeQuery('SEVERITY');
    const { data: onsetLovQueryResponse } = useGetLovValuesByCodeQuery('ONSET');
    const { data: reactionLovQueryResponse } = useGetLovValuesByCodeQuery('ALLRGY_REACTION_TYP');
    const { data: treatmentstrategyLovQueryResponse } = useGetLovValuesByCodeQuery('TREAT_STRATGY');
    const { data: sourceofinformationLovQueryResponse } = useGetLovValuesByCodeQuery('RELATION');
    const { data: allgPropnLovQueryResponse } = useGetLovValuesByCodeQuery('ALLG_PROPN');
    const { data: criticalityLovQueryResponse } = useGetLovValuesByCodeQuery('CRITICALITY');
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
             setSelectedOnsetDate(new Date(allerges.onsetDate));
           }
           if (allerges.sourceOfInformationLkey != null) {
             seteditSourceof({ editSource: false });
           }
         }, [allerges]);
     const handleDateChange = date => {
        if (date) {
          if (!editOnset) {
            setSelectedOnsetDate(date);
          }
        }
      };
    return (<>
        <MyModal
            open={open}
            setOpen={setOpen}
            title="Add Allergy"
            actionButtonFunction={handleSave}
            bodyheight={550}
            size='700px'
            position='right'
            steps={[

                {
                    title: 'Allergy', icon: faPersonDotsFromLine, footer: <MyButton

                        onClick={handleClear}
                    >Clear</MyButton>
                },
            ]}
            content={

                <div className={edit ? 'disabled-panel' : ""} >
                    <div className="div-parent">
                        <div style={{ flex: 1 }}>
                            <Form layout="inline" fluid>
                                <MyInput
                                    column
                                    disabled={editing}
                                    width={200}
                                    fieldType="select"
                                    fieldLabel="Allergy Type"
                                    selectData={allergyTypeLovQueryResponse?.object ?? []}
                                    selectDataLabel="lovDisplayVale"
                                    selectDataValue="key"
                                    fieldName={'allergyTypeLkey'}
                                    record={allerges}
                                    setRecord={setAllerges}
                                />
                            </Form>
                        </div>
                        <div style={{ flex: 1 }}>
                            <Form layout="inline" fluid>
                                <MyInput
                                    column
                                    disabled={editing}
                                    width={200}
                                    fieldType="select"
                                    fieldLabel="Allergen"
                                    selectData={allergensListResponse?.object ?? []}
                                    selectDataLabel="allergenName"
                                    selectDataValue="key"
                                    fieldName={'allergenKey'}
                                    record={allerges}
                                    setRecord={setAllerges}
                                />
                            </Form>
                        </div>
                        <div style={{ flex: 1 }}>
                            <Form layout="inline" fluid>
                                <MyInput
                                    column
                                    disabled={editing}
                                    width={200}
                                    fieldType="select"
                                    fieldLabel="Severity"
                                    selectData={severityLovQueryResponse?.object ?? []}
                                    selectDataLabel="lovDisplayVale"
                                    selectDataValue="key"
                                    fieldName={'severityLkey'}
                                    record={allerges}
                                    setRecord={setAllerges}
                                />
                            </Form>
                        </div>

                    </div>
                    <div className="div-parent">
                        <div style={{ flex: 1 }}>
                            <Form layout="inline" fluid>
                                <MyInput
                                    column
                                    disabled={editing}
                                    width={200}
                                    fieldType="select"
                                    fieldLabel="Criticality"
                                    selectData={criticalityLovQueryResponse?.object ?? []}
                                    selectDataLabel="lovDisplayVale"
                                    selectDataValue="key"
                                    fieldName={'criticalityLkey'}
                                    record={allerges}
                                    setRecord={setAllerges}
                                />
                            </Form>
                        </div>
                        <div style={{ flex: 1 }}>
                            <Form layout="inline" fluid>
                                <MyInput
                                    column
                                    disabled={editing}
                                    width={200}
                                    fieldName={'certainty'}
                                    record={allerges}
                                    setRecord={setAllerges}
                                />
                            </Form>
                        </div>
                        <div style={{ flex: 1 }}>
                            <Form layout="inline" fluid>
                                <MyInput
                                    column
                                    disabled={editing}
                                    width={200}
                                    fieldType="select"
                                    fieldLabel="Treatment Strategy"
                                    selectData={treatmentstrategyLovQueryResponse?.object ?? []}
                                    selectDataLabel="lovDisplayVale"
                                    selectDataValue="key"
                                    fieldName={'treatmentStrategyLkey'}
                                    record={allerges}
                                    setRecord={setAllerges}
                                />
                            </Form>
                        </div>

                    </div>
                    <div className="div-parent">
                        <div style={{ flex: 1 }}>
                            <Form layout="inline" fluid>
                                <MyInput
                                    column
                                    disabled={editing}
                                    width={200}
                                    fieldType="select"
                                    fieldLabel="Onset"
                                    selectData={onsetLovQueryResponse?.object ?? []}
                                    selectDataLabel="lovDisplayVale"
                                    selectDataValue="key"
                                    fieldName={'onsetLkey'}
                                    record={allerges}
                                    setRecord={setAllerges}
                                />
                            </Form>
                        </div>
                        <div style={{ flex: 1 }}>
                            <div>
                                <Form className='margin-label'>
                                    <MyLabel label='Onset Date' />
                                </Form>

                                <DatePicker
                                    className='date-width'
                                    format="MM/dd/yyyy hh:mm aa"
                                    showMeridian
                                    value={selectedOnsetDate}
                                    onChange={handleDateChange}
                                    disabled={editOnset.editdate}
                                />
                            </div>
                        </div>
                        <div style={{ flex: 1 }}>
                            <Form layout="inline" fluid>
                                <MyInput
                                    fieldLabel="Undefined"
                                    fieldName="editdate"
                                    column
                                    width={67}
                                    fieldType='checkbox'
                                    record={editOnset}
                                    setRecord={setEditOnset}
                                />
                            </Form>
                        </div>

                    </div>
                    <div className="div-parent">
                    <div style={{ flex: 1 }}>
                            <Form layout="inline" fluid>
                                <MyInput
                                    column
                                    disabled={editing}
                                    width={200}
                                    fieldType="select"
                                    fieldLabel="Type of Propensity"
                                    selectData={allgPropnLovQueryResponse?.object ?? []}
                                    selectDataLabel="lovDisplayVale"
                                    selectDataValue="key"
                                    fieldName={'typeOfPropensityLkey'}
                                    record={allerges}
                                    setRecord={setAllerges}
                                />
                            </Form>
                        </div>
                        <div style={{ flex: 1 }}>
                            <Form layout="inline" fluid>
                                <MyInput
                                    column
                                    disabled={editSourceof.editSource}
                                    width={200}
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
                        </div>
                        <div style={{ flex: 1 }}>
                            <Form layout="inline" fluid>
                                <MyInput
                                    fieldLabel="BY Patient"
                                    fieldName="editSource"
                                    column
                                    width={67}
                                    fieldType='checkbox'
                                    record={editSourceof}
                                    setRecord={seteditSourceof}
                                />
                            </Form>
                        </div>
                     

                    </div>
                    <div className="div-parent">
                        <div style={{ flex: 1 }}>
                            <Form fluid>
                                <div className='column-div'>
                                    <MyInput
                                        column
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
                                    <Input
                                        as="textarea"
                                        disabled={editing}
                                        onChange={e => setReactionDescription(e)}
                                        value={reactionDescription}
                                        className='fill-width'
                                        rows={3}
                                    />
                                </div>
                            </Form>
                        </div>
                        <div style={{ flex: 1 }}>
                            <Form fluid>
                                <MyInput
                                    width='100%'
                                    column
                                    fieldLabel="Note"
                                    fieldType="textarea"
                                    fieldName="notes"
                                    height={148}
                                    record={allerges}
                                    setRecord={setAllerges}
                                    disabled={editing}
                                />
                            </Form>
                        </div>
                    </div>


                </div>
            }
        />
    </>)
}
export default DetailsModal;