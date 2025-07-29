import React, { useEffect, useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/hooks';
import { Form, Panel } from 'rsuite';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import { newApInpatientChiefComplain } from '@/types/model-types-constructor';
import { ApInpatientChiefComplain } from '@/types/model-types';
import { notify } from '@/utils/uiReducerActions';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import './styles.less';
import Translate from '@/components/Translate';
import { faCheckDouble } from '@fortawesome/free-solid-svg-icons';
import { initialListRequest, ListRequest } from '@/types/types';
import { useSaveChiefComplainMutation, useGetChiefComplainQuery } from '@/services/encounterService';

const ChiefComplainTriage = ({ patient, encounter ,readOnly=false}) => {
    const authSlice = useAppSelector(state => state.auth);
    const [chiefComplain, setChiefComplain] = useState<ApInpatientChiefComplain>({ ...newApInpatientChiefComplain });
    const [isDisabledField, setIsDisabledField] = useState(false);
    const [isEncounterChiefComplainStatusClose, setIsEncounterChiefComplainStatusClose] = useState(false);
    const [isEncounterStatusClosed, setIsEncounterStatusClosed] = useState(false);
    const [saveChiefComplain] = useSaveChiefComplainMutation();
    const dispatch = useAppDispatch();

    // Initialize list request with default filters
    const [chiefComplaintListRequest, setChiefComplainListRequest] = useState<ListRequest>({
        ...initialListRequest,
        filters: [
            {
                fieldName: 'deleted_at',
                operator: 'isNull',
                value: undefined
            }
            , {
                fieldName: 'patient_key',
                operator: 'match',
                value: patient?.key
            },
            {
                fieldName: 'encounter_key',
                operator: 'match',
                value: encounter?.key
            }
        ],
    });

    // Fetch the list of Chief Complain based on the provided request, and provide a refetch function
    const { data: chiefComplainResponse, refetch, isLoading } = useGetChiefComplainQuery(chiefComplaintListRequest);

    // Fetch LOV data for various fields

    const { data: bodyPartsLovQueryResponse } = useGetLovValuesByCodeQuery('BODY_PARTS');
    const { data: painPatternLovQueryResponse } = useGetLovValuesByCodeQuery('PAIN_PATTERN');
    const { data: severityLovQueryResponse } = useGetLovValuesByCodeQuery('SEVERITY');

    // Handle Save Chief Complain
    const handleSave = async () => {
        //  TODO convert key to code
        try {
            if (chiefComplain.key === undefined) {
                await saveChiefComplain({
                    ...chiefComplain,
                    patientKey: patient.key,
                    encounterKey: encounter.key,
                    statusLkey: "9766169155908512",
                    createdBy: authSlice.user.key,
                    onsetDateTime: chiefComplain.onsetDateTime ? new Date(chiefComplain?.onsetDateTime)?.getTime() : null,

                }).unwrap();

                dispatch(notify({ msg: 'Chief Complain Added Successfully', sev: 'success' }));
                //TODO convert key to code
                setChiefComplain({ ...chiefComplain, statusLkey: "9766169155908512" });
            } else {
                await saveChiefComplain({
                    ...chiefComplain,
                    patientKey: patient.key,
                    encounterKey: encounter.key,
                    updatedBy: authSlice.user.key,
                    onsetDateTime: chiefComplain.onsetDateTime ? new Date(chiefComplain?.onsetDateTime)?.getTime() : null,

                }).unwrap();
                dispatch(notify({ msg: 'Chief Complain Updated Successfully', sev: 'success' }));
            }

        } catch (error) {
            console.error("Error saving Chief Complain:", error);
            dispatch(notify({ msg: 'Failed to Save Chief Complain', sev: 'error' }));
        }
    };

    // Effects
    useEffect(() => {
        // TODO update status to be a LOV value
        if (chiefComplain?.statusLkey === '3196709905099521') {
            setIsEncounterChiefComplainStatusClose(true);
        } else {
            setIsEncounterChiefComplainStatusClose(false);
        }
    }, [chiefComplain?.statusLkey]);
    useEffect(() => {
        if (chiefComplainResponse?.object?.length === 1) {
            setChiefComplain(chiefComplainResponse.object[0]);
        }
    }, [chiefComplainResponse]);
    useEffect(() => {
        // TODO update status to be a LOV value
        if (encounter?.encounterStatusLkey === '91109811181900' || encounter?.discharge) {
            setIsEncounterStatusClosed(true);
        }
    }, [encounter?.encounterStatusLkey]);
    useEffect(() => {
        if (isEncounterStatusClosed || isEncounterChiefComplainStatusClose) {
            setIsDisabledField(true);
        } else {
            setIsDisabledField(false);
        }
    }, [isEncounterStatusClosed, isEncounterChiefComplainStatusClose]);
    return (
        <Panel header="Chief Complain">
            <Form fluid layout='inline' className="form-inline-wrap">
                <MyInput
                    column
                    width={200}
                    fieldLabel="Chief Complain"
                    fieldType="textarea"
                    fieldName="chiefComplaint"
                    record={chiefComplain}
                    setRecord={setChiefComplain}
                    disabled={isDisabledField || readOnly}
                    searchable={false}
                />
                <MyInput
                    column
                    width={200}
                    fieldLabel="Provocation"
                    fieldName="provocation"
                    record={chiefComplain}
                    setRecord={setChiefComplain}
                    disabled={isDisabledField || readOnly}
                    searchable={false}
                />
                <MyInput
                    column
                    width={200}
                    fieldLabel="Palliation"
                    fieldName="palliation"
                    record={chiefComplain}
                    setRecord={setChiefComplain}
                    disabled={isDisabledField || readOnly}
                    searchable={false}
                />
                <MyInput
                    column
                    width={200}
                    fieldLabel="Quality"
                    fieldType="select"
                    fieldName="qualityLkey"
                    selectData={painPatternLovQueryResponse?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    record={chiefComplain}
                    setRecord={setChiefComplain}
                    disabled={isDisabledField || readOnly}
                    searchable={false}
                />
                <MyInput
                    column
                    width={200}
                    fieldLabel="Region"
                    fieldType="select"
                    fieldName="regionLkey"
                    selectData={bodyPartsLovQueryResponse?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    record={chiefComplain}
                    setRecord={setChiefComplain}
                    disabled={isDisabledField || readOnly}
                    searchable={false}
                />
                <MyInput
                    column
                    width={200}
                    fieldLabel="Severity"
                    fieldType="select"
                    fieldName="severityLkey"
                    selectData={severityLovQueryResponse?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    record={chiefComplain}
                    setRecord={setChiefComplain}
                    disabled={isDisabledField || readOnly}
                    searchable={false}
                />
                <MyInput
                    column
                    width={200}
                    fieldLabel="Onset"
                    disabled={isDisabledField || readOnly}
                    fieldName='onsetDateTime'
                    fieldType='datetime'
                    record={chiefComplain}
                    setRecord={setChiefComplain}
                />
                <MyInput
                    column
                    width={200}
                    fieldLabel="Understanding"
                    fieldName="understanding"
                    record={chiefComplain}
                    setRecord={setChiefComplain}
                    disabled={isDisabledField || readOnly}
                />
              {!readOnly && <MyButton
                    prefixIcon={() => <FontAwesomeIcon icon={faCheckDouble} />}
                    onClick={handleSave}
                    className="button-bottom-align"
                >
                    <Translate>  Save </Translate>
                </MyButton> } 
            </Form>
        </Panel>
    );
};

export default ChiefComplainTriage;