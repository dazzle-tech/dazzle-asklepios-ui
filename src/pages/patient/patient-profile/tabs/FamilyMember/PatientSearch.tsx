import MyInput from '@/components/MyInput';
import React, { useEffect, useState } from 'react';
import { InputGroup, Form, Drawer, Input, Button, DatePicker } from 'rsuite';
import 'react-tabs/style/react-tabs.css';
import '../styles.less';
import { initialListRequest, ListRequest } from '@/types/types';
import MyCard from '@/components/MyCard';
import { useGetPatientsQuery } from '@/services/patientService';
import SearchIcon from '@rsuite/icons/Search';
import { fromCamelCaseToDBName } from '@/utils';
import { Box, Skeleton } from '@mui/material';
import Translate from '@/components/Translate';

const PatientSearch = ({ selectedPatientRelation, setSelectedPatientRelation, searchResultVisible, setSearchResultVisible, patientSearchTarget, setPatientSearchTarget }) => {
    const [searchKeyword, setSearchKeyword] = useState('');
    const [selectedCriterion, setSelectedCriterion] = useState({searchCriteria:'fullName'});
    const [dateValue, setDateValue] = useState<Date | null>(null);
    
    // Define state to store the initial list request, ignoring the search if the keyword is too short
    const [listRequest, setListRequest] = useState<ListRequest>({
        ...initialListRequest,
        ignore: !searchKeyword || searchKeyword.length < 3
    });
    
    // Fetch the patient list based on the current request
    const { data: patientListResponse, isFetching: isFetchingPatients } = useGetPatientsQuery({ ...listRequest, filterLogic: 'or' });

    // Search criteria options
    const searchCriteriaOptions = [
        { label: <Translate>MRN</Translate>, value: 'patientMrn' },
        { label: <Translate>Primary Document</Translate>, value: 'documentNo' },
        { label: <Translate>Full Name</Translate>, value: 'fullName' },
        { label: <Translate>Archiving Number</Translate>, value: 'archivingNumber' },
        { label: <Translate>Primary Phone Number</Translate>, value: 'phoneNumber' },
        { label: <Translate>Date Of Birth</Translate>, value: 'dob' }
    ].map(option => ({
        ...option,
        label: <span style={{ textTransform: 'capitalize' }}>{option.label}</span>
    }));

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

    // handle Search Function
    const search = target => {
        setPatientSearchTarget(target);
        setSearchResultVisible(true);

        let searchValue = searchKeyword;
        
        if (selectedCriterion?.searchCriteria === 'dob' && dateValue) {
            try {
                // Format date safely
                const year = dateValue.getFullYear();
                const month = String(dateValue.getMonth() + 1).padStart(2, '0');
                const day = String(dateValue.getDate()).padStart(2, '0');
                searchValue = `${year}-${month}-${day}`;
            } catch (error) {
                console.error('Invalid date:', error);
                return;
            }
        }

        if ((searchKeyword && searchKeyword.length >= 3 && selectedCriterion?.searchCriteria !== 'dob') || 
            (selectedCriterion?.searchCriteria === 'dob' && dateValue && searchValue)) {
            setListRequest({
                ...listRequest,
                ignore: false,
                filters: [
                    {
                        fieldName: fromCamelCaseToDBName(selectedCriterion?.searchCriteria),
                        operator: selectedCriterion?.searchCriteria === 'dob' ? 'equals' : 'containsIgnoreCase',
                        value: searchValue
                    }
                ]
            });
        }
    };

    // Function to render the patient search bar based on the target (primary or relation)
    const conjurePatientSearchBar = target => {
        return (
            <div className="patient-search-container" style={{ display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative', zIndex: 1000 , alignItems: 'center' }}>
                <Form fluid>
                    <MyInput
                        fieldType="select"
                        fieldName="searchCriteria"
                        selectData={searchCriteriaOptions ?? []}
                        selectDataLabel="label"
                        selectDataValue="value"
                        showLabel={false}
                        record={selectedCriterion}
                        setRecord={setSelectedCriterion}
                        placeholder="Select Search Criteria"
                        searchable={false}
                        width="300px"
                        container={() => document.body}
                    />
                </Form>

                {selectedCriterion?.searchCriteria === 'dob' ? (
                    <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                        <DatePicker
                            format="yyyy-MM-dd"
                            placeholder="Select Date of Birth"
                            value={dateValue}
                            onChange={(value) => {
                                setDateValue(value);
                            }}
                            oneTap
                            style={{ flex: 1 }}
                            container={() => document.body}
                        />
                        <Button 
                            appearance="primary" 
                            onClick={() => search(target)}
                            disabled={!dateValue}
                        >
                            <SearchIcon />
                        </Button>
                    </div>
                ) : (
                    <InputGroup inside  style={{ width: '300px' }}>
                        <Input
                            onKeyDown={e => {
                                if (e.key === 'Enter') {
                                    search(target);
                                }
                            }}
                            placeholder={'Search Patients'}
                            value={searchKeyword}
                            onChange={e => setSearchKeyword(e)}
                            
                        />
                        <InputGroup.Button onClick={() => search(target)}>
                            <SearchIcon />
                        </InputGroup.Button>
                    </InputGroup>
                )}
            </div>
        );
    };

    // Handle Close Drawer
    const handleClose = () => {
        setSearchResultVisible(false);
        setSelectedCriterion({searchCriteria:'fullName'});
        setSearchKeyword('');
        setDateValue(null);
        setListRequest({ ...initialListRequest, ignore: true });
    }

    // Effects - Reset search keyword when criterion changes
    useEffect(() => {
        setSearchKeyword('');
        setDateValue(null);
        // Reset list to show all patients when clearing filters
        setListRequest({
            ...initialListRequest,
            ignore: true
        });
    }, [selectedCriterion]);

    return (
        <Drawer
            size="xs"
            placement={'left'}
            open={searchResultVisible}
            onClose={handleClose}
        >
            <Drawer.Header>
                <Drawer.Title>
                    <Translate>Patient List - Search Results</Translate>
                </Drawer.Title>
            </Drawer.Header>
            <Drawer.Actions style={{ position: 'relative', zIndex: 1000 }}>
                {conjurePatientSearchBar(patientSearchTarget)}
            </Drawer.Actions>
            <Drawer.Body>
                <Box className="patient-search-list">
                    {isFetchingPatients ? (
                        // Show 4 skeleton cards as placeholder
                        Array.from({ length: 4 }).map((_, index) => (
                            <Box width={250} key={index} className="patient-list-loader">
                                <div className="patient-list-loader-circle"> 
                                    <Skeleton variant="circular" width={40} height={40} className='loader-circle' />
                                    <Skeleton variant="text" width="80%" height={25} className='loader-text'/>
                                </div>
                                <Skeleton variant="rectangular" height={90} className='loader-rectangular' />
                                <Skeleton width="100%" />
                            </Box>
                        ))
                    ) : patientListResponse?.object?.length > 0 ? (
                        patientListResponse.object.map(patient => (
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
                                arrowClick={() => {
                                    handleSelectPatient(patient);
                                    setSearchKeyword('');
                                    setDateValue(null);
                                    handleClose();
                                }}
                                footerContant={`# ${patient.patientMrn}`}
                            />
                        ))
                    ) : (
                        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#999' }}>
                            <SearchIcon style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }} />
                            <p><Translate>No patients found</Translate></p>
                            <p style={{ fontSize: '13px' }}><Translate>Try adjusting your search criteria</Translate></p>
                        </div>
                    )}
                </Box>
            </Drawer.Body>
        </Drawer>
    );
};

export default PatientSearch;