import MyInput from '@/components/MyInput';
import React, { useEffect, useState } from 'react';
import { InputGroup, Form, Drawer, } from 'rsuite';
import 'react-tabs/style/react-tabs.css';
import '../styles.less';
import { initialListRequest, ListRequest } from '@/types/types';
import MyCard from '@/components/MyCard';
import { useGetPatientsQuery } from '@/services/patientService';
import SearchIcon from '@rsuite/icons/Search';
import { fromCamelCaseToDBName } from '@/utils';
const PatientSearch = ({ selectedPatientRelation, setSelectedPatientRelation, searchResultVisible, setSearchResultVisible, patientSearchTarget, setPatientSearchTarget }) => {
    const [searchKeyword, setSearchKeyword] = useState('');
    const [selectedCriterion, setSelectedCriterion] = useState('');
    // Define the available search criteria options
    const searchCriteriaOptions = [
        { label: 'MRN', value: 'patientMrn' },
        { label: 'Document Number', value: 'documentNo' },
        { label: 'Full Name', value: 'fullName' },
        { label: 'Archiving Number', value: 'archivingNumber' },
        { label: 'Primary Phone Number', value: 'phoneNumber' },
        { label: 'Date of Birth', value: 'dob' }
    ];
    // Define state to store the initial list request, ignoring the search if the keyword is too short
    const [listRequest, setListRequest] = useState<ListRequest>({
        ...initialListRequest,
        ignore: !searchKeyword || searchKeyword.length < 3
    });
    // Fetch the patient list based on the current request
    const { data: patientListResponse } = useGetPatientsQuery({ ...listRequest, filterLogic: 'or' });

    // Function to handle the selection of a patient
    const handleSelectPatient = data => {
        if (patientSearchTarget === 'primary') {
        } else if (patientSearchTarget === 'relation') {
            setSelectedPatientRelation({
                ...selectedPatientRelation,
                relativePatientKey: data.key,
                relativePatientObject: data
            });
        }
        setSearchResultVisible(false);
    };
    // Function to render the patient search bar based on the target (primary or relation)
    const conjurePatientSearchBar = target => {
        return (
            <Form fluid className='patient-search-fields-container'>
                <MyInput
                    fieldType="select"
                    fieldName="searchCriteria"
                    selectData={searchCriteriaOptions}
                    selectDataLabel="label"
                    selectDataValue="value"
                    showLabel={false}
                    record={{ searchCriteria: selectedCriterion }}
                    setRecord={record => {
                        const newValue = record?.searchCriteria;
                        setSelectedCriterion(newValue);
                    }}
                    placeholder="Select Search Criteria"
                    searchable={false}
                    width="250px"
                />
                <InputGroup className='input-search' inside>
                    <Form fluid style={{ width: '100%' }}>
                        <MyInput
                            fieldType="input"
                            fieldName="searchKeyword"
                            showLabel={false}
                            record={{ searchKeyword }}
                            setRecord={record => setSearchKeyword(record.searchKeyword)}
                            placeholder="Search Patients"
                            onKeyDown={e => {
                                if (e.key === 'Enter') {
                                    search(target);
                                }
                            }}
                            width="100%"
                        />
                    </Form>
                    <InputGroup.Button onClick={() => search(target)}>
                        <SearchIcon />
                    </InputGroup.Button>
                </InputGroup>
            </Form>
        );
    };
    // handle Search Function
    const search = target => {
        setPatientSearchTarget(target);
        setSearchResultVisible(true);

        if (searchKeyword && searchKeyword.length >= 3 && selectedCriterion) {
            setListRequest({
                ...listRequest,
                ignore: false,
                filters: [
                    {
                        fieldName: fromCamelCaseToDBName(selectedCriterion),
                        operator: 'containsIgnoreCase',
                        value: searchKeyword
                    }
                ]
            });
        }
    };
    // Effects
    useEffect(() => {
        setSearchKeyword('');
    }, [selectedCriterion]);
    return (
        <Drawer
            size="xs"
            placement={'left'}
            open={searchResultVisible}
            onClose={() => {
                setSearchResultVisible(false);
            }}
        >
            <Drawer.Header>
                <Drawer.Title>Patient List - Search Results</Drawer.Title>
            </Drawer.Header>
            <Drawer.Actions>{conjurePatientSearchBar(patientSearchTarget)}</Drawer.Actions>
            <Drawer.Body>
                <div className="patient-search-list">
                    {patientListResponse?.object?.map(patient => (
                        <MyCard
                            width={250}
                            showArrow={true}
                            key={patient.key}
                            variant='profile'
                            leftArrow={false}
                            avatar={patient?.attachmentProfilePicture?.fileContent
                                ? `data:${patient?.attachmentProfilePicture?.contentType};base64,${patient?.attachmentProfilePicture?.fileContent}`
                                : 'https://img.icons8.com/?size=150&id=ZeDjAHMOU7kw&format=png'}
                            title={patient.fullName}
                            contant={
                                <>
                                    {patient.createdAt ? new Date(patient?.createdAt).toLocaleString('en-GB') : ''}{' '}
                                </>
                            }
                            showMore={true}
                            arrowClick={() => {
                                console.log("Selected patient:", patient);
                                handleSelectPatient(patient);
                                setSearchKeyword(null);
                            }}
                            footerContant={`# ${patient.patientMrn}`}
                        />
                    ))}
                </div>
            </Drawer.Body>
        </Drawer>
    );
};

export default PatientSearch;
