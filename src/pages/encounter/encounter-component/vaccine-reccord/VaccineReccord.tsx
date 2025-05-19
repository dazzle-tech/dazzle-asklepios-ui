import React, { useEffect, useState } from 'react';
import { useGetPatientVaccinationRecordQuery } from '@/services/observationService';
import { Form, Panel, Checkbox, Loader, List, Tooltip, Whisper } from 'rsuite';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import './styles.less';
import MyLabel from '@/components/MyLabel';
import MyButton from '@/components/MyButton/MyButton';
import MyTable from '@/components/MyTable';
import { formatDateWithoutSeconds } from '@/utils';
const VaccineReccord = ({ patient }) => {
    const [isCanelledValue, setIsCanelledValue] = useState("NULL");
    const [vaccine, setVaccine] = useState<any>();
    const [selectedVaccine, setSelectedVaccine] = useState(null);


    // Fetch LOV data for various fields
    const { data: typeLovQueryResponse } = useGetLovValuesByCodeQuery('VACCIN_TYP');
    const { data: rOALovQueryResponse } = useGetLovValuesByCodeQuery('MED_ROA');
    const { data: numofDossLovQueryResponse } = useGetLovValuesByCodeQuery('NUMBERS');

    // Fetch the patient's vaccination history
    const { data: vaccineListResponseLoading, refetch, isFetching } = useGetPatientVaccinationRecordQuery({ key: patient?.key, isCanelled: isCanelledValue });
    // Table columns
    const columns = [
        {
            key: 'expand',
            title: '#',
            width: 70,
            expandable: true,
            render: (_, index) => index + 1
        },
        {
            key: 'location',
            title: 'VACCINATION LOCATION',
            expandable: true,
            render: (row) =>
                row?.apEncounterVaccination?.externalFacilityName ?? ''
        },
        {
            key: 'createdAt',
            title: 'CREATED AT/BY',
            expandable: true,
            render: (row: any) => row?.apEncounterVaccination?.createdAt ? <>{row?.apEncounterVaccination?.createByUser?.fullName}<br /><span className='date-table-style'>{formatDateWithoutSeconds(row?.apEncounterVaccination?.createdAt)}</span> </> : ' '
        },
        {
            key: 'updatedAt',
            title: 'UPDATED AT/BY',
            expandable: true,
            render: (row: any) => row?.apEncounterVaccination?.updatedAt ? <>{row?.apEncounterVaccination?.updateByUser?.fullName}<br /><span className='date-table-style'>{formatDateWithoutSeconds(row?.apEncounterVaccination?.updatedAt)}</span> </> : ' '
        },
        {
            key: 'reviewedAt',
            title: 'REVIEWED AT/BY',
            expandable: true,
            render: (row: any) => row?.apEncounterVaccination?.reviewedAt ? <>{row?.apEncounterVaccination?.reviewedByUser?.fullName}<br /><span className='date-table-style'>{formatDateWithoutSeconds(row?.apEncounterVaccination?.reviewedAt)}</span> </> : ' '
        },
        {
            key: 'cancelledAt',
            title: 'CANCELLED AT/BY',
            expandable: true,
            render: (row: any) => row?.apEncounterVaccination?.deletedAt ? <>{row?.apEncounterVaccination?.deleteByUser?.fullName}<br /><span className='date-table-style'>{formatDateWithoutSeconds(row?.apEncounterVaccination?.deletedAt)}</span> </> : ' '
        },
        {
            key: 'cancellationReason',
            title: <Translate>CANCELLATION REASON</Translate>,
            expandable: true,
            render: (rowData) => rowData?.apEncounterVaccination?.cancellationReason,
        },
        {
            key: 'brandName',
            title: 'BRAND NAME',
            render: (row) => row?.apVaccineBrands?.brandName ?? ''
        },
        {
            key: 'doseNumber',
            title: 'DOSE NUMBER',
            render: (row) =>
                row?.doseNameLvalue?.lovDisplayVale ?? row?.doseNameLkey ?? ''
        },
        {
            key: 'dateAdministered',
            title: 'DATE OF ADMINISTRATION',
            render: (row) => {
                return row?.apEncounterVaccination?.dateAdministered ? formatDateWithoutSeconds(row?.apEncounterVaccination?.dateAdministered) : '';
            }
        },
        {
            key: 'actualSide',
            title: 'ACTUAL SIDE AND SITE OF ADMINISTRATION',
            render: (row) =>
                row?.apEncounterVaccination?.actualSide ?? ''
        },
        {
            key: 'roa',
            title: 'ROA',
            render: () =>
                vaccine?.roaLvalue?.lovDisplayVale ?? vaccine?.roaLkey ?? ''
        },
        {
            key: 'reviewed',
            title: 'IS REVIEWED',
            render: (row) =>
                row?.apEncounterVaccination?.reviewedAt === 0 ? 'No' : 'Yes'
        },
        {
            key: 'status',
            title: 'STATUS',
            render: (row) =>
                row?.apEncounterVaccination?.statusLvalue?.lovDisplayVale ??
                row?.apEncounterVaccination?.statusLkey ?? ''
        }
    ];

    // Form and table displaying the patient's vaccination details
    const formAndTable = (
        <>
            <Form layout="inline" fluid className="form-content-vaccine-fields">
                <Form layout="inline" fluid>
                    <MyInput
                        column
                        disabled
                        fieldType="text"
                        fieldLabel="ATC Code"
                        fieldName="atcCode"
                        record={vaccine}
                    />
                    <MyInput
                        column
                        fieldLabel="Type"
                        fieldType="select"
                        fieldName="typeLkey"
                        selectData={typeLovQueryResponse?.object ?? []}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        record={vaccine}
                        disabled
                    />
                    <MyInput
                        column
                        fieldLabel="Number of Doses"
                        fieldType="select"
                        fieldName="numberOfDosesLkey"
                        selectData={numofDossLovQueryResponse?.object ?? []}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        record={vaccine}
                        disabled
                    />
                    <MyInput
                        column
                        fieldLabel="ROA"
                        fieldType="select"
                        fieldName="roaLkey"
                        selectData={rOALovQueryResponse?.object ?? []}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        record={vaccine}
                        disabled
                    />
                    <MyInput
                        column
                        fieldLabel="Site of Administration"
                        fieldName="siteOfAdministration"
                        record={vaccine}
                        disabled
                    />
                </Form>
                <div className="cancel-checkbox-container">
                    <Checkbox
                        checked={isCanelledValue === 'NOT NULL'}
                        onChange={(value, checked) => {
                            setIsCanelledValue(checked ? 'NOT NULL' : 'NULL');
                            if (!checked) {
                                setSelectedVaccine(null);
                            }
                        }}
                    />
                    <MyLabel label="Show Cancelled Vaccine Doses" />
                </div>
            </Form>
            <MyTable
                data={vaccine?.doseDetailsList ?? []}
                columns={columns}
                height={600}
                loading={false}
            />
        </>
    );
    // Effects
    useEffect(() => {
        setSelectedVaccine(null);
        setVaccine(null);
        refetch();
    }, [isCanelledValue]);

    return (
        <>
            {isFetching && !vaccineListResponseLoading?.object?.length && (
                <div className="loader">
                    <Loader content="Loading Vaccines ..." />
                </div>
            )}
            <div className='main-container-btns'>
                {vaccineListResponseLoading?.object?.map((vaccine, index) => (
                    <MyButton
                        key={index}
                        className='main-content-btn'
                        onClick={() => {
                            setSelectedVaccine(vaccine);
                            setVaccine(vaccine);
                        }}
                        appearance={selectedVaccine?.vaccineName === vaccine.vaccineName ? 'primary' : 'ghost'}
                    >
                        {vaccine.vaccineName}
                    </MyButton>
                ))}
            </div>
            {formAndTable}
        </>
    );
};
export default VaccineReccord;