import React, { useEffect, useState } from 'react';
import { Avatar, Panel } from 'rsuite';
import MemberIcon from '@rsuite/icons/Member';
import { useSelector } from 'react-redux';

import Translate from '@/components/Translate';

import { useGetPrimaryDocumentByPatientQuery } from '@/services/patients/patientDocumentsService';
import { useGetCountriesBulkMutation } from '@/services/setup/country/countryService';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';

import {
    conjureValueBasedOnKeyFromList,
    formatEnumString
} from '@/utils';

import { Patient } from '@/types/model-types-new';

import './style.less';

interface PatientMergeCardProps {
    patient: Patient;
}

const PatientMergeCard: React.FC<PatientMergeCardProps> = ({ patient }) => {
    const mode = useSelector((state: any) => state.ui.mode);

    const [getCountriesBulk] = useGetCountriesBulkMutation();
    const [countriesMap, setCountriesMap] = useState<Record<number, any>>({});

    const { data: countryLovQueryResponse } =
        useGetLovValuesByCodeQuery('CNTRY');

    const patientName =
        patient?.fullName?.trim() ||
        [
            patient?.firstName,
            patient?.secondName,
            patient?.thirdName,
            patient?.lastName
        ]
            .filter(Boolean)
            .join(' ')
            .trim();

    const dobValue =
        patient?.dateOfBirth ||
        (patient?.dateOfBirth &&
            typeof patient.dateOfBirth !== 'string'
            ? patient.dateOfBirth
            : undefined);

    const genderText = patient?.sexAtBirth || '';

    const genderAge = [
        formatEnumString(genderText),
        dobValue ? calculateAgeFormat(dobValue) : ''
    ]
        .filter(Boolean)
        .join(' - ');

    const registrationDate =
        patient?.createdDate
            ? new Date(
                patient?.createdDate
            ).toLocaleDateString('en-GB')
            : '';

    const patientId = patient?.id;

    const { data: primaryDocument } =
        useGetPrimaryDocumentByPatientQuery(patientId, {
            skip: !patientId
        });

    useEffect(() => {
        const loadCountry = async () => {
            if (!primaryDocument?.countryId) {
                setCountriesMap({});
                return;
            }

            try {
                const countries = await getCountriesBulk(
                    [primaryDocument.countryId] as number[]
                ).unwrap();

                const map = Object.fromEntries(
                    countries.map((c: any) => [c.id, c])
                );

                setCountriesMap(map);
            } catch (error) {
                console.error('Country bulk load failed', error);
            }
        };

        loadCountry();
    }, [primaryDocument?.countryId, getCountriesBulk]);

    const documentType =
        primaryDocument?.type
            ? formatEnumString(primaryDocument.type)
            : '';

    const documentCountry =
        primaryDocument?.countryId &&
            countriesMap[primaryDocument.countryId]
            ? conjureValueBasedOnKeyFromList(
                countryLovQueryResponse?.object ?? [],
                countriesMap[primaryDocument.countryId].name,
                'lovDisplayVale'
            )
            : '';

    const documentNumber = primaryDocument?.number || '';
    const phoneNumber = patient?.primaryMobileNumber || '';
    const medicalRecordNumber =
        patient?.medicalRecordNumber || '';
    const email = patient?.email || '';

    return (
        <Panel
            bordered
            className={`patient-info-card-container ${mode === 'light' ? 'light' : 'dark'
                }`}
        >
            <div className="mrn">
                <MemberIcon />

                <div className="mrn-content">
                    <div className="mrn-label">MRN</div>
                    <div className="mrn-value">
                        {medicalRecordNumber || '-'}
                    </div>
                </div>
            </div>

            <div className="patient-info-card-body">
                <div className="patient-info-card-avatar-wrapper">
                    <Avatar
                        circle
                        className="patient-info-card-avatar"
                        src={
                            patient?.attachmentProfilePicture
                                ?.fileContent
                                ? `data:${patient?.attachmentProfilePicture?.contentType};base64,${patient?.attachmentProfilePicture?.fileContent}`
                                : 'https://img.icons8.com/?size=150&id=ZeDjAHMOU7kw&format=png'
                        }
                    />
                </div>

                <div className="patient-info-card-grid">
                    {[
                        {
                            label: 'Patient Name',
                            value: patientName || '-'
                        },
                        {
                            label: 'Gender & Age',
                            value: genderAge || '-'
                        },
                        {
                            label: 'Date of Register',
                            value: registrationDate || '-'
                        },
                        {
                            label: 'Document Type',
                            value: documentType || '-'
                        },
                        {
                            label: 'Document Country',
                            value: formatEnumString(documentCountry) || '-'
                        },
                        {
                            label: 'Document Number',
                            value: documentNumber || '-'
                        },
                        {
                            label: 'Phone',
                            value: phoneNumber || '-'
                        },
                        {
                            label: 'Email',
                            value: email || '-'
                        }
                    ].map(item => (
                        <div
                            key={item.label}
                            className="patient-info-card-item"
                        >
                            <div className="div-data">
                                <Translate>{item.label}</Translate>
                            </div>

                            <div className="patient-info">
                                <Translate>{item.value}</Translate>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </Panel>
    );
};

export default PatientMergeCard;

export const calculateAgeFormat = (dateOfBirth: any) => {
    const today = new Date();
    const dob = new Date(dateOfBirth);

    if (isNaN(dob.getTime())) {
        return '';
    }

    let years =
        today.getFullYear() - dob.getFullYear();

    let months =
        today.getMonth() - dob.getMonth();

    let days =
        today.getDate() - dob.getDate();

    if (months < 0 || (months === 0 && days < 0)) {
        years--;
        months += 12;
    }

    if (days < 0) {
        const lastMonth = new Date(
            today.getFullYear(),
            today.getMonth(),
            0
        );

        days += lastMonth.getDate();
        months--;
    }

    let ageString = '';

    if (years > 0) {
        ageString += `${years}y `;
    }

    if (months > 0) {
        ageString += `${months}m `;
    }

    if (days > 0) {
        ageString += `${days}d`;
    }

    return ageString.trim();
};