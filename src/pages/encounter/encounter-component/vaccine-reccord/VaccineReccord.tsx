import React, { useEffect, useState } from 'react';
import { useGetPatientVaccinationRecordQuery } from '@/services/observationService'
import { initialListRequest, ListRequest } from '@/types/types';
import { useAppSelector, useAppDispatch } from '@/hooks';
import {
    InputGroup,
    Form,
    Input,
    Panel,
    DatePicker,
    Text,
    Checkbox,
    Dropdown,
    Button,
    IconButton,
    SelectPicker,
    Table,
    Modal,
    Stack,
    Divider,
    Toggle,
    ButtonToolbar,
    Grid,
    Row,
    Col,
    Loader,
} from 'rsuite';
import {
    useGetLovValuesByCodeQuery,
} from '@/services/setupService';
import MyInput from '@/components/MyInput';
import CollaspedOutlineIcon from '@rsuite/icons/CollaspedOutline';
import Translate from '@/components/Translate';
import ExpandOutlineIcon from '@rsuite/icons/ExpandOutline';
import MyLabel from '@/components/MyLabel';
const { Column, HeaderCell, Cell } = Table
const VaccineReccord = ({patient,encounter}) => {
    
    const [expandedRowKeys, setExpandedRowKeys] = React.useState([]);
    const [isCanelledValue, setIsCanelledValue] = useState("NULL")
    //LOV
    const { data: typeLovQueryResponse } = useGetLovValuesByCodeQuery('VACCIN_TYP');
    const { data: rOALovQueryResponse } = useGetLovValuesByCodeQuery('MED_ROA');
    const { data: numofDossLovQueryResponse } = useGetLovValuesByCodeQuery('NUMBERS');


    const { data: vaccineListResponseLoading, refetch,isFetching } = useGetPatientVaccinationRecordQuery({
        key: patient?.key,
        isCanelled: isCanelledValue
    });


    useEffect(() => {
        refetch();
    }, [isCanelledValue]);


    const handleExpanded = (rowData) => {
        let open = false;
        const nextExpandedRowKeys = [];

        expandedRowKeys.forEach(key => {
            if (key === rowData.key) {
                open = true;
            } else {
                nextExpandedRowKeys.push(key);
            }
        });

        if (!open) {
            nextExpandedRowKeys.push(rowData.key);
        }
        setExpandedRowKeys(nextExpandedRowKeys);
    };
    const renderRowExpanded = rowData => {

        return (

            <Table
                data={[rowData]}
                bordered
                cellBordered
                style={{ width: '100%', marginTop: '10px' }}
                height={100}
            >
                <Column flexGrow={2} align="center" fullText>
                    <HeaderCell>Created At</HeaderCell>
                    <Cell >
                        {rowData => rowData?.apEncounterVaccination?.createdAt ? new Date(rowData.createdAt).toLocaleString("en-GB") : ""}
                    </Cell>
                </Column>
                <Column flexGrow={1.5} align="center" fullText>
                    <HeaderCell>Created By</HeaderCell>
                    <Cell >
                        {rowData => rowData?.apEncounterVaccination?.createByUser?.fullName}
                    </Cell>
                </Column>
                <Column flexGrow={2} align="center" fullText>
                    <HeaderCell>Updated At</HeaderCell>
                    <Cell >

                        {rowData => rowData?.apEncounterVaccination?.updatedAt ? new Date(rowData.updatedAt).toLocaleString("en-GB") : ""}
                    </Cell>
                </Column>
                <Column flexGrow={1.5} align="center" fullText>
                    <HeaderCell>Updated By</HeaderCell>
                    <Cell >
                        {rowData => rowData?.apEncounterVaccination?.updateByUser?.fullName}
                    </Cell>
                </Column>
                <Column flexGrow={2} align="center" fullText>
                    <HeaderCell>Reviewed At</HeaderCell>
                    <Cell dataKey="reviewedAt" >
                        {rowData => rowData?.apEncounterVaccination?.reviewedAt ? new Date(rowData.reviewedAt).toLocaleString("en-GB") : ""}
                    </Cell>
                </Column>
                <Column flexGrow={1.5} align="center" fullText>
                    <HeaderCell>Reviewed By</HeaderCell>
                    <Cell >

                        {rowData => rowData?.apEncounterVaccination?.reviewedByUser?.fullName}
                    </Cell>
                </Column>
                <Column flexGrow={2} align="center" fullText>
                    <HeaderCell>Cancelled At</HeaderCell>
                    <Cell dataKey="deletedAt" >
                        {rowData => rowData?.apEncounterVaccination?.deletedAt ? new Date(rowData.deletedAt).toLocaleString("en-GB") : ""}
                    </Cell>
                </Column>
                <Column flexGrow={1.5} align="center" fullText>
                    <HeaderCell>Cancelled By</HeaderCell>
                    <Cell >
                        {rowData => rowData?.apEncounterVaccination?.deleteByUser?.fullName}
                    </Cell>
                </Column>
                <Column flexGrow={2} align="center" fullText>
                    <HeaderCell>Cancelliton Reason</HeaderCell>
                    <Cell >
                        {rowData => rowData?.apEncounterVaccination?.cancellationReason}
                    </Cell>

                </Column>
            </Table>


        );
    };
    const ExpandCell = ({ rowData, dataKey, expandedRowKeys, onChange, ...props }) => (
        <Cell {...props} style={{ padding: 5 }}>
            <IconButton
                appearance="subtle"
                onClick={() => {
                    onChange(rowData);
                }}
                icon={
                    expandedRowKeys.some(key => key === rowData["key"]) ? (
                        <CollaspedOutlineIcon />
                    ) : (
                        <ExpandOutlineIcon />
                    )
                }
            />
        </Cell>
    );






    return (
        <Panel >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '15px' }}><Checkbox

                onChange={(value, checked) => {
                    if (checked) {

                        setIsCanelledValue("NOT NULL");
                    } else {
                        setIsCanelledValue("NULL");
                    }
                }}

            /> <MyLabel label="Show Cancelled Vaccine Doses" />
            </div>
            {isFetching && <Loader center />}
            {!isFetching &&
            vaccineListResponseLoading?.object?.map((vaccine, index) => (

                <Panel header={`${vaccine.vaccineName}`} collapsible bordered key={vaccine.vaccineName}>
                    <Form layout="inline" fluid>
                        <MyInput
                            column
                            disabled
                            width={200}
                            fieldType="text"
                            fieldLabel="ATC Code"
                            fieldName='atcCode'
                            record={vaccine}

                        />

                        <MyInput
                            width={230}
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
                            width={230}
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
                            width={230}
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
                            width={230}
                            column
                            fieldLabel="Site of Administration"
                            fieldName="siteOfAdministration"
                            record={vaccine}

                            disabled
                        />

                    </Form>

                    <div key={index}>
                        <Table
                            height={300}
                            data={vaccine?.doseDetailsList ?? []}
                            rowKey="key"
                            expandedRowKeys={expandedRowKeys}
                            renderRowExpanded={renderRowExpanded}
                            shouldUpdateScroll={false}
                            bordered
                            cellBordered
                        >
                            <Column width={70} align="center">
                                <HeaderCell>#</HeaderCell>
                                <ExpandCell rowData={rowData => rowData} dataKey="key" expandedRowKeys={expandedRowKeys} onChange={handleExpanded} />
                            </Column>

                            <Column flexGrow={2} fullText>
                                <HeaderCell align="center">
                                    <Translate>Brand Name</Translate>
                                </HeaderCell>
                                <Cell>
                                    {rowData =>
                                        rowData?.apVaccineBrands?.brandName
                                    }
                                </Cell>
                            </Column>
                            <Column flexGrow={2} fullText>
                                <HeaderCell align="center">
                                    <Translate>Dose Number</Translate>
                                </HeaderCell>
                                <Cell>
                                    {rowData =>
                                        rowData?.doseNameLvalue
                                            ? rowData?.doseNameLvalue?.lovDisplayVale
                                            : rowData?.doseNameLkey
                                    }
                                </Cell>
                            </Column>
                            <Column flexGrow={2} fullText>
                                <HeaderCell align="center">
                                    <Translate>Date of Administration</Translate>
                                </HeaderCell>
                                <Cell>
                                    {rowData => {
                                        if (!rowData?.apEncounterVaccination?.dateAdministered) return "  ";
                                        const date = new Date(rowData?.apEncounterVaccination?.dateAdministered);
                                        return date.toLocaleString("en-GB");
                                    }}
                                </Cell>
                            </Column>
                            <Column flexGrow={3} fullText>
                                <HeaderCell align="center">
                                    <Translate>Actual Side and Site of Administration</Translate>
                                </HeaderCell>
                                <Cell>{rowData =>
                                    rowData?.apEncounterVaccination?.actualSide

                                }</Cell>
                            </Column>
                            <Column flexGrow={2} fullText>
                                <HeaderCell align="center">
                                    <Translate>ROA</Translate>
                                </HeaderCell>
                                <Cell>
                                    {
                                        vaccine?.roaLvalue
                                            ? vaccine?.roaLvalue?.lovDisplayVale
                                            : vaccine?.roaLkey
                                    }

                                </Cell>
                            </Column>
                            <Column flexGrow={2} fullText>
                                <HeaderCell align="center">
                                    <Translate>Vaccination Location</Translate>
                                </HeaderCell>
                                <Cell>{rowData =>
                                    rowData?.apEncounterVaccination?.externalFacilityName

                                }</Cell>
                            </Column>
                            <Column flexGrow={2} fullText>
                                <HeaderCell align="center">
                                    <Translate>Is Reviewed</Translate>
                                </HeaderCell>
                                <Cell>
                                    {rowData =>
                                        rowData?.apEncounterVaccination?.reviewedAt === 0 ? "No" : "Yes"
                                    }
                                </Cell>
                            </Column>
                            <Column flexGrow={1} fullText>
                                <HeaderCell align="center">
                                    <Translate>Status</Translate>
                                </HeaderCell>
                                <Cell>
                                    {rowData =>
                                        rowData?.apEncounterVaccination?.statusLvalue
                                            ? rowData?.apEncounterVaccination?.statusLvalue?.lovDisplayVale
                                            : rowData?.apEncounterVaccination?.statusLkey
                                    }
                                </Cell>
                            </Column>
                        </Table>
                    </div>

                </Panel>
            ))}
        </Panel>
    );

};
export default VaccineReccord;