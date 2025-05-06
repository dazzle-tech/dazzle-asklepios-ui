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
            key: 'createdAt',
            title: <Translate>Created At</Translate>,
            expandable: true,
            render: (rowData) => rowData?.apEncounterVaccination?.createdAt
                ? new Date(rowData.createdAt).toLocaleString("en-GB")
                : "",
        },
        {
            key: 'createdBy',
            title: <Translate>Created By</Translate>,
            expandable: true,
            render: (rowData) => rowData?.apEncounterVaccination?.createByUser?.fullName,
        },
        {
            key: 'updatedAt',
            title: <Translate>Updated At</Translate>,
            expandable: true,
            render: (rowData) => rowData?.apEncounterVaccination?.updatedAt
                ? new Date(rowData.updatedAt).toLocaleString("en-GB")
                : "",
        },
        {
            key: 'updatedBy',
            title: <Translate>Updated By</Translate>,
            expandable: true,
            render: (rowData) => rowData?.apEncounterVaccination?.updateByUser?.fullName,
        },
        {
            key: 'reviewedAt',
            title: <Translate>Reviewed At</Translate>,
            expandable: true,
            render: (rowData) => rowData?.apEncounterVaccination?.reviewedAt
                ? new Date(rowData.reviewedAt).toLocaleString("en-GB")
                : "",
        },
        {
            key: 'reviewedBy',
            title: <Translate>Reviewed By</Translate>,
            expandable: true,
            render: (rowData) => rowData?.apEncounterVaccination?.reviewedByUser?.fullName,
        },
        {
            key: 'cancelledAt',
            title: <Translate>Cancelled At</Translate>,
            expandable: true,
            render: (rowData) => rowData?.apEncounterVaccination?.deletedAt
                ? new Date(rowData.deletedAt).toLocaleString("en-GB")
                : "",
        },
        {
            key: 'cancelledBy',
            title: <Translate>Cancelled By</Translate>,
            expandable: true,
            render: (rowData) => rowData?.apEncounterVaccination?.deleteByUser?.fullName,
        },
        {
            key: 'cancellationReason',
            title: <Translate>Cancellation Reason</Translate>,
            expandable: true,
            render: (rowData) => rowData?.apEncounterVaccination?.cancellationReason,
        },
        {
            key: 'brandName',
            title: 'Brand Name',
            render: (row) => row?.apVaccineBrands?.brandName ?? ''
        },
        {
            key: 'doseNumber',
            title: 'Dose Number',
            render: (row) =>
                row?.doseNameLvalue?.lovDisplayVale ?? row?.doseNameLkey ?? ''
        },
        {
            key: 'dateAdministered',
            title: 'Date of Administration',
            render: (row) => {
                const date = row?.apEncounterVaccination?.dateAdministered;
                return date ? new Date(date).toLocaleString('en-GB') : '';
            }
        },
        {
            key: 'actualSide',
            title: 'Actual Side and Site of Administration',
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
            key: 'location',
            title: 'Vaccination Location',
            render: (row) =>
                row?.apEncounterVaccination?.externalFacilityName ?? ''
        },
        {
            key: 'reviewed',
            title: 'Is Reviewed',
            render: (row) =>
                row?.apEncounterVaccination?.reviewedAt === 0 ? 'No' : 'Yes'
        },
        {
            key: 'status',
            title: 'Status',
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