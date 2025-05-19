import React, { useState, useEffect } from 'react';
import { Divider, Form } from 'rsuite';
import MyInput from '@/components/MyInput';
import { ApEncounter } from '@/types/model-types';
import { newApEncounter } from '@/types/model-types-constructor';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { useGetPatientDiagnosisQuery } from '@/services/encounterService';
import { useGetEncountersQuery } from '@/services/encounterService';
import { initialListRequest, ListRequest } from '@/types/types';
const PreviuosVisitData = ({ patient, encounter }) => {
    const [prevencounter, setPrevencounter] = useState<ApEncounter>({ ...newApEncounter });

    const { data: encounterTypeLovQueryResponse } = useGetLovValuesByCodeQuery('BOOK_VISIT_TYPE');
    const { data: encounterReasonLovQueryResponse } = useGetLovValuesByCodeQuery('ENC_REASON');
    const [patientVisitListRequest, setPatientVisitListReques] = useState<ListRequest>({
        ...initialListRequest,

        sortBy: 'plannedStartDate',
        sortType:"desc",
        filters: [
            {

                fieldName: 'patient_key',
                operator: 'match',
                value: patient?.key
            },
            {
                fieldName: 'planned_start_date',
                operator: 'lt',
                value: encounter?.plannedStartDate
            }

        ],

    });
    const [listdRequest, setListdRequest] = useState({
        ...initialListRequest,
        pageSize: 100,
        timestamp: new Date().getMilliseconds(),
        sortBy: 'createdAt',
        sortType: 'desc',
        filters: [
            {
                fieldName: 'patient_key',
                operator: 'match',
                value: patient?.key
            },
            {
                fieldName: 'visit_key',
                operator: 'match',
                value: prevencounter?.key
            }


        ]
    });
    const { data: Diagnoses, refetch: fetchlastDiag } = useGetPatientDiagnosisQuery(listdRequest
        , {
            refetchOnMountOrArgChange: true,
            refetchOnFocus: true
        }

    )
    const { data: encounterPatientList } = useGetEncountersQuery({ ...patientVisitListRequest }, {
        refetchOnMountOrArgChange: true,
        refetchOnFocus: true,
    });

    useEffect(() => {
        setPrevencounter(encounterPatientList?.object[0]);
    }, [encounterPatientList])
    useEffect(() => {
        const updatedFilters = [
            {
                fieldName: 'patient_key',
                operator: 'match',
                value: patient?.key
            },
            {
                fieldName: 'visit_key',
                operator: 'match',
                value: prevencounter?.key
            }
        ];
        setListdRequest((prevRequest) => ({

            ...prevRequest,
            filters: updatedFilters,

        }));
    }, [prevencounter]);
    return (
        <div className='medical-dashboard-main-container'>
            <div className='medical-dashboard-container-div'>
                <div className='medical-dashboard-header-div'>
                    <div className='medical-dashboard-title-div'>
                        Previuos Visit
                    </div>
                </div>
                <Divider className="divider-line" />
                <div className='medical-dashboard-content-div'>
                    <Form disabled layout="inline" fluid >
                        <MyInput
                            column
                            width={140}
                            fieldLabel="Visit Date"
                            fieldType="date"
                            fieldName="plannedStartDate"
                            record={prevencounter || {}}
                        />
                        <MyInput
                            column
                            width={140}
                            fieldType="select"
                            fieldLabel="Visit Type"
                            fieldName="visitTypeLkey"
                            selectData={encounterTypeLovQueryResponse?.object ?? []}
                            selectDataLabel="lovDisplayVale"
                            selectDataValue="key"
                            record={prevencounter || {}}
                        />
                        <MyInput
                            column
                            width={140}
                            fieldType="select"
                            fieldLabel="Reason"
                            fieldName="reasonLkey"
                            selectData={encounterReasonLovQueryResponse?.object ?? []}
                            selectDataLabel="lovDisplayVale"
                            selectDataValue="key"
                            record={prevencounter || {}}
                        />

                        <MyInput
                            column
                            width={140}
                            fieldLabel="Diagnosis Description"
                            fieldName="description"
                            record={Diagnoses?.object[0]?.diagnosisObject || {}}
                        />
                    </Form>

                </div>
            </div>

        </div>
    );
};
export default PreviuosVisitData;