import MyInput from '@/components/MyInput';
import React, { useEffect, useState } from 'react';
import { InputGroup, Form, Drawer, Input } from 'rsuite';
import 'react-tabs/style/react-tabs.css';
import '../styles.less';
import { initialListRequest, ListRequest } from '@/types/types';
import MyCard from '@/components/MyCard';
import { useGetPatientsQuery } from '@/services/patientService';
import SearchIcon from '@rsuite/icons/Search';
import { fromCamelCaseToDBName } from '@/utils';
import { Box, Skeleton } from '@mui/material';
import SearchPatientCriteria from '@/components/SearchPatientCriteria';

const PatientSearch = ({ selectedPatientRelation, setSelectedPatientRelation, searchResultVisible, setSearchResultVisible, patientSearchTarget, setPatientSearchTarget }) => {
    const [searchKeyword, setSearchKeyword] = useState('');
    const [selectedCriterion, setSelectedCriterion] = useState('fullName');
    
    // Define state to store the initial list request, ignoring the search if the keyword is too short
    const [listRequest, setListRequest] = useState<ListRequest>({
        ...initialListRequest,
        ignore: !searchKeyword || searchKeyword.length < 3
    });
    // Fetch the patient list based on the current request
    const { data: patientListResponse, isFetching: isFetchingPatients } = useGetPatientsQuery({ ...listRequest, filterLogic: 'or' });

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
            <Form layout='inline' fluid className='patient-search-fields-container'>
            <SearchPatientCriteria
                record={{
                    searchByField: selectedCriterion || 'fullName',
                    patientName: searchKeyword || '',
                }}
                setRecord={(newRecord) => {
                    setSelectedCriterion(newRecord?.searchByField);
                    setSearchKeyword(newRecord?.patientName);
                }}
                onSearchClick={() => search(target)}
                />

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
    // Handle Close Drawet
    const handleClose = () => {
        setSearchResultVisible(false);
        setSelectedCriterion('');
        setSearchKeyword('');
        setListRequest({ ...initialListRequest, ignore: true });
    }
    // Effects
    useEffect(() => {
        setSearchKeyword('');
    }, [selectedCriterion]);
    return (
        <Drawer
            size="xs"
            placement={'left'}
            open={searchResultVisible}
            onClose={handleClose}

        >
            <Drawer.Header>
                <Drawer.Title>Patient List - Search Results</Drawer.Title>
            </Drawer.Header>
            <Drawer.Actions>{conjurePatientSearchBar(patientSearchTarget)}</Drawer.Actions>
            <Drawer.Body>

                <Box className="patient-search-list">
                    {isFetchingPatients ? (
                        // Show 4 skeleton cards as placeholder
                        Array.from({ length: 4 }).map((_, index) => (
                            <Box width={250} key={index} className="patient-list-loader" >
                                <div  className="patient-list-loader-circle"> 
                                    <Skeleton variant="circular" width={40} height={40} className='loader-circle' />
                                    <Skeleton variant="text" width="80%" height={25} className='loader-text'/>
                                </div>
                                <Skeleton variant="rectangular" height={90} className='loader-rectangular' />
                                <Skeleton width="100%" />
                            </Box>
                        ))
                    ) : (
                        patientListResponse?.object?.map(patient => (
                            <MyCard
                                width={250}
                                showArrow={true}
                                key={patient.key}
                                variant="profile"
                                leftArrow={false}
                                avatar={
                                    patient?.attachmentProfilePicture?.fileContent
                                        ? `data:${patient?.attachmentProfilePicture?.contentType};base64,${patient?.attachmentProfilePicture?.fileContent}`
                                        : 'https://img.icons8.com/?size=150&id=ZeDjAHMOU7kw&format=png'
                                }
                                title={patient.fullName}
                                contant={
                                    <>
                                        {patient.createdAt
                                            ? new Date(patient?.createdAt).toLocaleString('en-GB')
                                            : ''}
                                    </>
                                }
                                showMore={true}
                                arrowClick={() => {
                                    handleSelectPatient(patient);
                                    setSearchKeyword(null);
                                    handleClose();
                                }}
                                footerContant={`# ${patient.patientMrn}`}
                            />
                        ))
                    )}
                </Box>
            </Drawer.Body>
        </Drawer>
    );
};

export default PatientSearch;
