import React, { useState } from 'react';
import { Form } from 'rsuite';
import './styles.less';
import Translate from '@/components/Translate';
import { PlusRound } from '@rsuite/icons';
import { MdDelete } from 'react-icons/md';
import MyButton from '@/components/MyButton/MyButton';
import { faUsersBetweenLines } from '@fortawesome/free-solid-svg-icons';
import { useAppDispatch } from '@/hooks';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import { ApPatientInsuranceCoverage } from '@/types/model-types';
import MyTable from '@/components/MyTable';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useSavePatientInsuranceCovgMutation, useDeletePatientInsuranceCovgMutation } from '@/services/patientService';
import { notify } from '@/utils/uiReducerActions';
import { newApPatientInsuranceCoverage } from '@/types/model-types-constructor';
import { useGetPatientInsuranceCovgQuery } from '@/services/patientService';
import { initialListRequest, ListRequest } from '@/types/types';
const SpecificCoverageModa = ({ open, setOpen, insurance }) => {
    const [patientInsuranceCoverage, setPatientInsuranceCoverage] = useState<ApPatientInsuranceCoverage>({ ...newApPatientInsuranceCoverage });
    const [saveCoverage] = useSavePatientInsuranceCovgMutation();
    const [deleteInsuranceCoverage] = useDeletePatientInsuranceCovgMutation()
    const dispatch = useAppDispatch();

    // Fetch LOV data for various fields
    const { data: isnuranceCovgTypResponse } = useGetLovValuesByCodeQuery('COVERAGE_ITEMS');
    const { data: isnuranceCovgItemsResponse } = useGetLovValuesByCodeQuery('INS_COVG_TYP');

    // Initialize List Request Filters
    const [patientInsuranceCovgListRequest, setPatientInsuranceCovgListRequest] = useState<ListRequest>({
        ...initialListRequest,
        pageSize: 1000
    });

    //List Responses
    // Fetch Patient Insurance CovgResponse
    const { data: patientInsuranceCovgResponse, refetch } = useGetPatientInsuranceCovgQuery({
        listRequest: patientInsuranceCovgListRequest,
        key: insurance
    }
        , { skip: !insurance }
    );
    // Check if the current row is selected by comparing keys, and return the 'selected-row' class if matched
    const isSelected = rowData => {
        if (rowData && patientInsuranceCoverage && rowData.key === patientInsuranceCoverage.key) {
            return 'selected-row';
        } else return '';
    };
    // Function handle Save covgInsurance
    const handelSave = () => {
        saveCoverage({
            ...patientInsuranceCoverage,
            patientInsuranceKey: insurance
        }).unwrap().then(() => {
            refetch(),
                dispatch(notify({msg:'Coverage Saved Successfully',sev: 'success'})),
                handleClearModalFields()
        });
        console.log(patientInsuranceCoverage)

    }
    // Function handle delete covgInsurance
    const handleDeleteInsurance = (rowData: any) => {
        deleteInsuranceCoverage({
            key: rowData.key
        }).then(() => {
            refetch();
            dispatch(notify({msg:'Coverage Deleted Successfully',sev: 'success'}));
        }).catch((error) => {
            dispatch(notify({msg:'Failed to delete coverage',sev:'error'}));
        });
    };
    // Function handle Clear Modal Fields covgInsurance
    const handleClearModalFields = () => {
        setPatientInsuranceCoverage({
            ...newApPatientInsuranceCoverage, typeLkey: null,
            coverageTypeLkey: null
        })
    };
    // MyModal  Content
    const CoverageContent = () => (
        <div className='covg-conrainer'>
            <Form layout="inline" fluid className="covg-content">
                <div className="covg-content-fields">
                    <MyInput
                        column
                        fieldLabel="Type"
                        fieldType="select"
                        fieldName="typeLkey"
                        selectData={isnuranceCovgTypResponse?.object ?? []}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        record={patientInsuranceCoverage}
                        setRecord={setPatientInsuranceCoverage}
                        searchable={false}
                    />
                    <MyInput
                        column
                        fieldLabel="Coverage Type"
                        fieldType="select"
                        fieldName="coverageTypeLkey"
                        selectData={isnuranceCovgItemsResponse?.object ?? []}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        record={patientInsuranceCoverage}
                        setRecord={setPatientInsuranceCoverage}
                        searchable={false}

                    />
                    <MyInput
                        column
                        fieldLabel="Amount"
                        fieldName="coveredAmount"
                        record={patientInsuranceCoverage}
                        setRecord={setPatientInsuranceCoverage}
                    /></div><div className="covg-content-right-btn">
                    <MyButton
                        onClick={() => { handelSave() }}
                        prefixIcon={() => <PlusRound />}
                    > New
                    </MyButton>
                </div>
            </Form>
            <small>* <Translate>Click to select Coverage</Translate></small>
            <MyTable
                height={200}
                rowClassName={isSelected}
                data={patientInsuranceCovgResponse?.object ?? []}
                onRowClick={setPatientInsuranceCoverage}
                columns={[
                    {
                        key: 'type',
                        title: 'Type',
                        dataKey: 'type'
                    },
                    {
                        key: 'coverageType',
                        title: 'Coverage Type',
                        dataKey: 'coverageType'
                    },
                    {
                        key: 'coveredAmount',
                        title: 'Covered Amount',
                        dataKey: 'coveredAmount'
                    },
                    {
                        key: 'actions',
                        title: 'Actions',
                        render: (rowData: any) => (
                            <MdDelete
                                title="Deactivate"
                                fill="var(--primary-pink)"
                                size={24}
                                style={{ cursor: 'pointer' }}
                                onClick={() => handleDeleteInsurance(rowData)}
                            />
                        )
                    }
                ]}
            />
        </div>
    );
    return (
        <MyModal
            open={open}
            setOpen={setOpen}
            title="Coverage List"
            position="right"
            size="sm"
            hideActionBtn={true}
            content={CoverageContent}
            steps={[
                {
                    title: "Coverage", icon:<FontAwesomeIcon icon={ faUsersBetweenLines}/>,
                },
            ]}
        />
    );
};

export default SpecificCoverageModa;
