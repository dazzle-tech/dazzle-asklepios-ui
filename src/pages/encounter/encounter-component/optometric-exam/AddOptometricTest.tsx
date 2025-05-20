import React, { useEffect, useState } from 'react';
import { InputGroup, Form, Input } from 'rsuite';
import './styles.less'
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import { useGetIcdListQuery } from '@/services/setupService'
import SearchIcon from '@rsuite/icons/Search';
import { useAppSelector, useAppDispatch } from '@/hooks';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { initialListRequest, ListRequest } from '@/types/types';
import { useSaveOptometricExamMutation } from '@/services/encounterService';
import { newApOptometricExam } from '@/types/model-types-constructor';
import { notify } from '@/utils/uiReducerActions';
import AdvancedModal from '@/components/AdvancedModal';
const AddOptometricTest = ({ patient, encounter, open, setOpen, optometricObject, refetch, secondSelectedicd10, setSecondSelectedicd10, selectedicd10, setSelectedIcd10, timeM,edit }) => {
    const authSlice = useAppSelector(state => state.auth);
    const [optometricExam, setOptometricExam] = useState<any>(optometricObject);
    const [openTest, setOpenTest] = useState("Visual Acuity Test");
    const [searchKeyword, setSearchKeyword] = useState('');
    const [isDisabledField, setIsDisabledField] = useState(false);
    const [isEncounterStatusClosed, setIsEncounterStatusClosed] = useState(false);
    const [isEncounterOptometricExamStatusClose, setIsEncounterOptometricExamStatusClose] = useState(false);
    const [time, setTime] = useState({ time: ' ' });
    const [secondSearchKeyword, setSecondSearchKeyword] = useState('');
    const [saveOptometricExam, saveOptometricExamMutation] = useSaveOptometricExamMutation();
    const dispatch = useAppDispatch();
    // Fetch LOV data for various fields
    const { data: medicalHistoryLovQueryResponse } = useGetLovValuesByCodeQuery('EYE_MEDICAL_HISTORY');
    const { data: performedWithLovQueryResponse } = useGetLovValuesByCodeQuery('EYE_VISUAL_ACUITY');
    const { data: improvmentsStatusLovQueryResponse } = useGetLovValuesByCodeQuery('IMPROVEMENTS_STATUS');
    const { data: colorBlindTestLovQueryResponse } = useGetLovValuesByCodeQuery('COLOR_BLIND_TEST');
    const { data: lowModHighLovQueryResponse } = useGetLovValuesByCodeQuery('LOW_MOD_HIGH');

    // Initialize the state for ICD list request with default values
    const [listIcdRequest, setListIcdRequest] = useState({ ...initialListRequest });

    // Fetch ICD list data based on the current request parameters
    const { data: icdListResponseData } = useGetIcdListQuery(listIcdRequest);

    // Transform the ICD list data by adding a combined label with code and description
    const modifiedData = (icdListResponseData?.object ?? []).map(item => ({
        ...item,
        combinedLabel: `${item.icdCode} - ${item.description}`
    }));

    // Assign the modified data to secondData 
    const secondData = modifiedData;

    // Calculate the time of measurement in seconds since midnight
    const timeOfMeasurement = (() => {
        try {
            const date = new Date(time?.time || '');
            if (isNaN(date.getTime())) return 0; // Return 0 if the date is invalid
            return date.getHours() * 3600 + date.getMinutes() * 60; // Convert to seconds
        } catch {
            return 0; // Fallback in case of error
        }
    })();
    // Handle the search input for the first search field
    const handleSearch = value => {
        setSearchKeyword(value);
    };

    // Handle the search input for the second search field
    const handleSecondSearch = value => {
        setSecondSearchKeyword(value);
    };
    // Handle Clear Field 
    const handleClearField = () => {
        setOptometricExam({
            ...newApOptometricExam,
            medicalHistoryLkey: null,
            followUpRequired: false,
            fundoscopySlitlampDone: false,
            performedWithLkey: null,
            pinholeTestResultLkey: null,
            deficiencyTypeLkey: null,
            glaucomaRiskAssessmentLkey: null
        });
        setTime({ time: null });
        setSecondSelectedicd10({ text: ' ' });
        setSelectedIcd10({ text: ' ' });
    };
    // handle Save & Update Optometric Exam Record
    const handleSave = async () => {
        //TODO convert key to code
        try {
            if (optometricExam.key === undefined) {
                await saveOptometricExam({
                    ...optometricExam,
                    patientKey: patient.key,
                    encounterKey: encounter.key,
                    followUpDate: optometricExam?.followUpDate
                        ? new Date(optometricExam?.followUpDate).getTime()
                        : 0,
                    statusLkey: '9766169155908512',
                    createdBy: authSlice.user.key,
                    timeOfMeasurement,
                }).unwrap();
                dispatch(notify('Patient Optometric Exam Added Successfully'));
            } else {
                await saveOptometricExam({
                    ...optometricExam,
                    patientKey: patient.key,
                    encounterKey: encounter.key,
                    followUpDate: optometricExam?.followUpDate
                        ? new Date(optometricExam?.followUpDate).getTime()
                        : 0,
                    updatedBy: authSlice.user.key,
                    timeOfMeasurement,

                }).unwrap();
                dispatch(notify('Patient Optometric Exam Updated Successfully'));
            }
            await refetch();
        } catch (error) {
            console.error('Error saving Patient Optometric Exam:', error);
            dispatch(notify('Failed to save Patient Optometric Exam'));
        }
    };
    // Effects
    useEffect(() => {
        if (searchKeyword.trim() !== '') {
            setListIcdRequest({
                ...initialListRequest,
                filterLogic: 'or',
                filters: [
                    {
                        fieldName: 'icd_code',
                        operator: 'containsIgnoreCase',
                        value: searchKeyword
                    },
                    {
                        fieldName: 'description',
                        operator: 'containsIgnoreCase',
                        value: searchKeyword
                    }
                ]
            });
        }
    }, [searchKeyword]);
    useEffect(() => {
        if (secondSearchKeyword.trim() !== '') {
            setListIcdRequest({
                ...initialListRequest,
                filterLogic: 'or',
                filters: [
                    {
                        fieldName: 'icd_code',
                        operator: 'containsIgnoreCase',
                        value: secondSearchKeyword
                    },
                    {
                        fieldName: 'description',
                        operator: 'containsIgnoreCase',
                        value: secondSearchKeyword
                    }
                ]
            });
        }
    }, [secondSearchKeyword]);
    useEffect(() => {
        setOptometricExam({ ...optometricObject });
    }, [optometricObject]);
    useEffect(() => {
        // TODO update status to be a LOV value
        if (optometricExam?.statusLkey === '3196709905099521') {
            setIsEncounterOptometricExamStatusClose(true);
        } else {
            setIsEncounterOptometricExamStatusClose(false);
        }
    }, [optometricExam?.statusLkey]);
    useEffect(() => {
        if (saveOptometricExamMutation && saveOptometricExamMutation.status === 'fulfilled') {
            setOptometricExam(saveOptometricExamMutation.data);
        }
    }, [saveOptometricExamMutation]);
    useEffect(() => {
        // TODO update status to be a LOV value
        if (encounter?.encounterStatusLkey === '91109811181900') {
            setIsEncounterStatusClosed(true);
        }
    }, [encounter?.encounterStatusLkey]);
    useEffect(() => {
        if (isEncounterStatusClosed || isEncounterOptometricExamStatusClose) {
            setIsDisabledField(true);
        } else {
            setIsDisabledField(false);
        }
    }, [isEncounterStatusClosed, isEncounterOptometricExamStatusClose]);
    useEffect(() => {
        setTime({ ...timeM });
    }, [timeM]);
    // lift Content Modal
    const liftContent = (
        <div className="test-list-btn">
            <MyButton appearance="subtle" color="#1C2836" className="test-btn" radius="10px" onClick={() => setOpenTest("Visual Acuity Test")}>
                Visual Acuity
            </MyButton>
            <MyButton appearance="subtle" color="#1C2836" className="test-btn" radius="10px" onClick={() => setOpenTest("Ishihara Color Blindness Test")}>
                Ishihara Color Blindness
            </MyButton>
            <MyButton appearance="subtle" color="#1C2836" className="test-btn" radius="10px" onClick={() => setOpenTest("Refraction Test Results")}>
                Refraction Results
            </MyButton>
            <MyButton appearance="subtle" color="#1C2836" className="test-btn" radius="10px" onClick={() => setOpenTest("Intraocular Pressure (IOP)")}>
                Intraocular Pressure (IOP)
            </MyButton>
            <MyButton appearance="subtle" color="#1C2836" className="test-btn" radius="10px" onClick={() => setOpenTest("Interpretation & Diagnosis")}>
                Interpretation & Diagnosis
            </MyButton>
        </div>
    );
    // Right Content Modal
    const rightContent = (
        <div className={edit?"disabled-panel":""}>
        <Form fluid layout="inline">
            <MyInput
                width={200}
                column
                fieldLabel="Test Reason"
                fieldName="testReason"
                record={optometricExam}
                setRecord={setOptometricExam}
                disabled={isDisabledField}
            />
            <MyInput
                width={200}
                column
                fieldLabel="Medical History"
                fieldType="select"
                fieldName="medicalHistoryLkey"
                selectData={medicalHistoryLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={optometricExam}
                setRecord={setOptometricExam}
                searchable={false}
                disabled={isDisabledField}
            />
            {openTest === "Visual Acuity Test" && <>
                <MyInput
                    width={200}
                    column
                    fieldLabel="Test Performed With"
                    fieldType="select"
                    fieldName="performedWithLkey"
                    selectData={performedWithLovQueryResponse?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    record={optometricExam}
                    setRecord={setOptometricExam}
                    searchable={false}
                    disabled={isDisabledField}
                />
                <MyInput
                    width={200}
                    column
                    fieldLabel="Pinhole Test Result"
                    fieldType="select"
                    fieldName="pinholeTestResultLkey"
                    selectData={improvmentsStatusLovQueryResponse?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    record={optometricExam}
                    setRecord={setOptometricExam}
                    searchable={false}
                    disabled={isDisabledField}
                />
                <div className='form-container-visual-fields'>
                    <div className='visual-form-content-fields'>
                        <div className='visual-form-title-fields'>Distance</div>
                        <div>
                            <MyInput
                                column
                                width={150}
                                fieldLabel="Distance Acuity"
                                fieldType="number"
                                fieldName="distanceAcuity"
                                record={optometricExam}
                                setRecord={setOptometricExam}
                                rightAddon="m"
                                rightAddonwidth={50}
                                disabled={isDisabledField}
                            />
                        </div>
                        <div className='visual-form-sub-fields'>
                            <MyInput
                                column
                                width={60}
                                fieldLabel="Right Eye"
                                fieldType="number"
                                fieldName="rightEyeOd"
                                record={optometricExam}
                                setRecord={setOptometricExam}
                                leftAddon="20/"
                                leftAddonwidth={38}
                                disabled={isDisabledField}
                            />
                            <MyInput
                                column
                                width={60}
                                fieldLabel="Left Eye"
                                fieldType="number"
                                fieldName="leftEyeOd"
                                record={optometricExam}
                                setRecord={setOptometricExam}
                                leftAddon="20/"
                                leftAddonwidth={38}
                                disabled={isDisabledField}
                            />
                        </div>
                    </div>
                    <div className='visual-form-content-fields'>
                        <div className='visual-form-title-fields'>Near</div>
                        <div>
                            <MyInput
                                column
                                width={150}
                                fieldLabel="Bone Conduction Thresholds"
                                fieldType="number"
                                fieldName="nearAcuity"
                                record={optometricExam}
                                setRecord={setOptometricExam}
                                rightAddon="cm"
                                rightAddonwidth={50}
                                disabled={isDisabledField}
                            />
                        </div>
                        <div className='visual-form-sub-fields'>
                            <MyInput
                                column
                                width={60}
                                fieldLabel="Right Eye"
                                fieldType="number"
                                fieldName="rightEyeOs"
                                record={optometricExam}
                                setRecord={setOptometricExam}
                                leftAddon="J"
                                leftAddonwidth={38}
                                disabled={isDisabledField}
                            />
                            <MyInput
                                className="number-input"
                                column
                                width={60}
                                fieldLabel="Left Eye"
                                fieldType="number"
                                fieldName="leftEyeOs"
                                record={optometricExam}
                                setRecord={setOptometricExam}
                                leftAddon="J"
                                leftAddonwidth={38}
                                disabled={isDisabledField}
                            />
                        </div>
                    </div>
                </div>
            </>}
            {openTest === "Ishihara Color Blindness Test" && <>
                <MyInput
                    width={200}
                    column
                    fieldType="number"
                    fieldLabel="Number of Plates Tested"
                    fieldName="numberOfPlatesTested"
                    record={optometricExam}
                    setRecord={setOptometricExam}
                    disabled={isDisabledField}
                />
                <MyInput
                    width={200}
                    column
                    fieldType="number"
                    fieldLabel="Correct Answers Count"
                    fieldName="correctAnswersCount"
                    record={optometricExam}
                    setRecord={setOptometricExam}
                    disabled={isDisabledField}
                />
                <MyInput
                    width={200}
                    column
                    fieldLabel="Deficiency Type"
                    fieldType="select"
                    fieldName="deficiencyTypeLkey"
                    selectData={colorBlindTestLovQueryResponse?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    record={optometricExam}
                    setRecord={setOptometricExam}
                    searchable={false}
                    disabled={isDisabledField}
                />
            </>}
            {openTest === "Refraction Test Results" && <>
                <div className='refraction-form-title-fields'>Right</div>
                <MyInput
                    width={130}
                    column
                    fieldType="number"
                    fieldLabel="Sphere"
                    fieldName="rightEyeSphere"
                    record={optometricExam}
                    setRecord={setOptometricExam}
                    disabled={isDisabledField}
                />
                <MyInput
                    width={130}
                    column
                    fieldType="number"
                    fieldLabel="Cylinder"
                    fieldName="rightCylinder"
                    record={optometricExam}
                    setRecord={setOptometricExam}
                    disabled={isDisabledField}
                />
                <MyInput
                    width={130}
                    column
                    fieldType="number"
                    fieldLabel="Axis"
                    fieldName="rightAxis"
                    record={optometricExam}
                    setRecord={setOptometricExam}
                    disabled={isDisabledField}
                />
                <div className='refraction-form-title-fields'>Left</div>
                <MyInput
                    width={130}
                    column
                    fieldType="number"
                    fieldLabel="Sphere"
                    fieldName="leftEyeSphere"
                    record={optometricExam}
                    setRecord={setOptometricExam}
                    disabled={isDisabledField}
                />
                <MyInput
                    width={130}
                    column
                    fieldType="number"
                    fieldLabel="Cylinder"
                    fieldName="leftCylinder"
                    record={optometricExam}
                    setRecord={setOptometricExam}
                    disabled={isDisabledField}
                />
                <MyInput
                    width={130}
                    column
                    fieldType="number"
                    fieldLabel="Axis"
                    fieldName="leftAxis"
                    record={optometricExam}
                    setRecord={setOptometricExam}
                    disabled={isDisabledField}
                />
            </>}
            {openTest === "Intraocular Pressure (IOP)" && <>
                <MyInput
                    column
                    width={120}
                    fieldLabel="Right Eye"
                    fieldType="number"
                    fieldName="rightEye"
                    record={optometricExam}
                    setRecord={setOptometricExam}
                    rightAddon="mmHg"
                    rightAddonwidth={80}
                    disabled={isDisabledField}
                />
                <MyInput
                    column
                    width={120}
                    fieldLabel="Left Eye"
                    fieldType="number"
                    fieldName="leftEye"
                    record={optometricExam}
                    setRecord={setOptometricExam}
                    rightAddon="mmHg"
                    rightAddonwidth={80}
                    disabled={isDisabledField}
                />
                <MyInput
                    width={200}
                    column
                    fieldLabel="Measurement Method"
                    fieldName="measurementMethod"
                    record={optometricExam}
                    setRecord={setOptometricExam}
                    disabled={isDisabledField}
                />
                <MyInput
                    width={200}
                    column
                    fieldLabel="Start Time"
                    fieldName="time"
                    fieldType="time"
                    record={{ time: time?.time ? (typeof time?.time === 'string' ? new Date(`1970-01-01T${time.time}:00`) : time?.time) : null }}
                    setRecord={(value) => { setTime(value) }}
                    disabled={isDisabledField}
                />
                <MyInput
                    column
                    width={110}
                    fieldLabel="Corneal Thickness"
                    fieldType="number"
                    fieldName="cornealThickness"
                    record={optometricExam}
                    setRecord={setOptometricExam}
                    rightAddon="microns"
                    rightAddonwidth={90}
                    disabled={isDisabledField}
                />
                <MyInput
                    width={200}
                    column
                    fieldLabel="Glaucoma Risk Assessment"
                    fieldType="select"
                    fieldName="glaucomaRiskAssessmentLkey"
                    selectData={lowModHighLovQueryResponse?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    record={optometricExam}
                    setRecord={setOptometricExam}
                    searchable={false}
                    disabled={isDisabledField}
                />
                <MyInput
                    width={400}
                    column
                    fieldLabel="Fundoscopy & Slit Lamp Exam Done?"
                    fieldType="checkbox"
                    fieldName="fundoscopySlitlampDone"
                    record={optometricExam}
                    setRecord={setOptometricExam}
                    disabled={isDisabledField}
                />
                <MyInput
                    width={400}
                    column
                    fieldLabel="Clinical Observations"
                    fieldType="textarea"
                    fieldName="examFindings"
                    record={optometricExam}
                    setRecord={setOptometricExam}
                    disabled={!optometricExam?.fundoscopySlitlampDone || isDisabledField}
                />

            </>}
            {openTest === "Interpretation & Diagnosis" && <>
                <Form fluid layout="inline" className='container-search-field'>
                    <div className='content-div-search-field'>
                        <InputGroup className='content-input-search-field' inside>
                            <Input placeholder={'Search ICD-10'} value={searchKeyword} onChange={handleSearch} disabled={isDisabledField} />
                            <InputGroup.Button>
                                <SearchIcon />
                            </InputGroup.Button>
                        </InputGroup>

                        {searchKeyword && (
                            <div className="dropdown-menu-icd">
                                {modifiedData?.map(mod => (
                                    <div
                                        key={mod.key}
                                        onClick={() => {
                                            setOptometricExam({
                                                ...optometricExam,
                                                visionDiagnosis: mod.key
                                            });
                                            setSelectedIcd10({ text: mod.combinedLabel });
                                            setSearchKeyword('');
                                        }}
                                        className='dropdown-menu-icd-item' >
                                        <span>{mod.icdCode}</span>
                                        <span>{mod.description}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <MyInput
                        width={200}
                        column
                        fieldLabel="Vision Diagnosis"
                        fieldName="text"
                        record={selectedicd10}
                        disabled={true}
                    />
                </Form>
                <Form fluid layout="inline" className='container-search-field'>
                    <div className='content-div-search-field'>
                        <InputGroup inside className='content-input-search-field'>
                            <Input
                                placeholder={'Search ICD-10'}
                                value={secondSearchKeyword}
                                onChange={handleSecondSearch}
                                disabled={isDisabledField}
                            />
                            <InputGroup.Button>
                                <SearchIcon />
                            </InputGroup.Button>
                        </InputGroup>

                        {secondSearchKeyword && (
                            <div className='dropdown-menu-icd'>
                                {secondData?.map(mod => (
                                    <div
                                        key={mod.key}
                                        onClick={() => {
                                            setOptometricExam({
                                                ...optometricExam,
                                                colorVisionDiagnosis: mod.key
                                            });
                                            setSecondSelectedicd10({ text: mod.combinedLabel });
                                            setSecondSearchKeyword('');
                                        }}
                                        className='dropdown-menu-icd-item' >
                                        <span>{mod.icdCode}</span>
                                        <span>{mod.description}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <MyInput
                        width={200}
                        column
                        fieldLabel="Vision Diagnosis"
                        fieldName="text"
                        record={secondSelectedicd10}
                        disabled={true}
                    />
                </Form>
                {/* <MyInput
                    width={200}
                    column
                    fieldLabel="Require Follow-up"
                    fieldType="checkbox"
                    fieldName="followUpRequired"
                    record={optometricExam}
                    setRecord={setOptometricExam}
                    disabled={isDisabledField}
                />
                <MyInput
                    width={200}
                    column
                    fieldType="date"
                    fieldLabel="Require Follow-up"
                    fieldName="followUpDate"
                    record={optometricExam}
                    setRecord={setOptometricExam}
                    disabled={!optometricExam?.followUpRequired || isDisabledField}
                /> */}
                <MyInput
                    width={200}
                    column
                    fieldType="textarea"
                    fieldLabel="Recommendations"
                    fieldName="recommendations"
                    record={optometricExam}
                    setRecord={setOptometricExam}
                    disabled={isDisabledField}
                />
                <MyInput
                    width={200}
                    column
                    fieldType="textarea"
                    fieldLabel="Additional Notes"
                    fieldName="additionalNotes"
                    record={optometricExam}
                    setRecord={setOptometricExam}
                    disabled={isDisabledField}
                />
            </>}
        </Form></div>
    );
    return (
        <AdvancedModal
            open={open}
            setOpen={setOpen}
            leftTitle="Test Type"
            rightTitle={`${openTest}`}
            position='right'
            size='50vw'
            leftWidth='40%'
            rightWidth='60%'    
            actionButtonFunction={handleSave}
            footerButtons={<>
                <MyButton appearance='ghost' onClick={handleClearField}>Clear</MyButton>
                <MyButton   disabled={isDisabledField} onClick={() => { handleSave(); setOpen(false); }}>Save & Close</MyButton>
            </>
            }
            rightContent={rightContent}
            leftContent={liftContent}
            isDisabledActionBtn={!edit ? isDisabledField:true}
        ></AdvancedModal>
    );
};
export default AddOptometricTest;
