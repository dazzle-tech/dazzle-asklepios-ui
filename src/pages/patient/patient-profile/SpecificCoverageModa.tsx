import React, { useEffect, useState } from 'react';
import { Modal, Button, Placeholder, Form, InputGroup, Input, Toggle, RadioGroup, Radio, Table, IconButton, ButtonToolbar, Drawer, Pagination } from 'rsuite';
import './styles.less';
import Translate from '@/components/Translate';
import { Block, Check, DocPass, Edit, History, Icon, PlusRound, Detail } from '@rsuite/icons';
import TrashIcon from '@rsuite/icons/Trash';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { faLock } from '@fortawesome/free-solid-svg-icons';


const { Column, HeaderCell, Cell } = Table;
import { useAppDispatch, useAppSelector } from '@/hooks';
import { setEncounter, setPatient } from '@/reducers/patientSlice';
import {
    useGetLovValuesByCodeAndParentQuery,
    useGetLovValuesByCodeQuery
} from '@/services/setupService';
import MyInput from '@/components/MyInput';
// import { ApPatient } from '@/types/model-types';
import { ApPatientInsuranceCoverage } from '@/types/model-types';

import { useSavePatientInsuranceCovgMutation,useDeletePatientInsuranceCovgMutation } from '@/services/patientService';
import { notify } from '@/utils/uiReducerActions';
import { newApPatientInsurance, newApPatientInsuranceCoverage } from '@/types/model-types-constructor';
import { useGetPatientInsuranceCovgQuery } from '@/services/patientService';
import { initialListRequest, ListRequest } from '@/types/types';

const SpecificCoverageModa = ({ open, onClose, insurance }) => {
    const [isUnknown, setIsUnknown] = useState(false);
    const [validationResult, setValidationResult] = useState({});
    const { data: isnuranceCovgTypResponse } = useGetLovValuesByCodeQuery('COVERAGE_ITEMS');
    const { data: isnuranceCovgItemsResponse } = useGetLovValuesByCodeQuery('INS_COVG_TYP');

    const [patientInsuranceCovgListRequest, setPatientInsuranceCovgListRequest] = useState<ListRequest>({
        ...initialListRequest,
        pageSize: 1000
    });
    const dispatch = useAppDispatch();
    const [patientInsuranceCoverage, setPatientInsuranceCoverage] = useState<ApPatientInsuranceCoverage>({ ...newApPatientInsuranceCoverage });
    const [saveCoverage, savePatientInsuranceCoverageMutation] = useSavePatientInsuranceCovgMutation();
    const [deleteInsuranceCoverage, deleteInsuranceCoverageMutation] = useDeletePatientInsuranceCovgMutation()
    const [covgList,setCovgList] = useState()

    const [selectedCoverage, setSelectedCoverage] = useState()

 
  
    const { data:patientInsuranceCovgResponse, error, isLoading,refetch } = useGetPatientInsuranceCovgQuery({
        listRequest: patientInsuranceCovgListRequest,
        key:insurance
      }
      , { skip: !insurance }
    );




  
    const handelSave = () => {
        saveCoverage({...patientInsuranceCoverage,
            patientInsuranceKey:insurance
        }).unwrap().then(()=>{
            refetch(),
            handleClearModal()
                });
        console.log(patientInsuranceCoverage)

    }
    const handleDeleteInsurance = () => {

  

        deleteInsuranceCoverage({
          key: selectedCoverage.key
        }).then(
          () => (
            refetch(),
            setSelectedCoverage(null)
          )
        );
      }
    const handleClearModal = () => {
        onClose();
        setPatientInsuranceCoverage(newApPatientInsuranceCoverage)
    };

    return (
        <div>
            <Drawer
                size="lg"
                placement={'left'}
                open={open} onClose={handleClearModal}
            >
                <Drawer.Header>
                    <Drawer.Title>Coverage List</Drawer.Title>
                    {/* <Drawer.Actions>{conjurePatientSearchBar(patientSearchTarget)}</Drawer.Actions> */}

                </Drawer.Header>
                <Drawer.Body>
                    <Form layout="inline" fluid>
                        <MyInput
                            vr={validationResult}
                            column
                            fieldLabel="Type"
                            fieldType="select"
                            fieldName="typeLkey"
                            selectData={isnuranceCovgTypResponse?.object ?? []}
                            selectDataLabel="lovDisplayVale"
                            selectDataValue="key"
                            record={patientInsuranceCoverage}
                            setRecord={setPatientInsuranceCoverage}
                        />

                        <MyInput
                            vr={validationResult}
                            column
                            fieldLabel="Coverage Type"
                            fieldType="select"
                            fieldName="coverageTypeLkey"
                            selectData={isnuranceCovgItemsResponse?.object ?? []}
                            selectDataLabel="lovDisplayVale"
                            selectDataValue="key"
                            record={patientInsuranceCoverage}
                            setRecord={setPatientInsuranceCoverage}
                        />

                        <MyInput
                            vr={validationResult}
                            column
                            fieldLabel="Amount"

                            fieldName="coveredAmount"
                            record={patientInsuranceCoverage}
                            setRecord={setPatientInsuranceCoverage}
                        />

                    </Form>


                    <ButtonToolbar>
                        <IconButton
                            appearance="primary"
                            color="cyan"
                            icon={<PlusRound />}
                            onClick={() => { handelSave() }}
                        >
                            <Translate>New Coverage</Translate>
                        </IconButton>

                        <IconButton 
                        onClick={()=>{handleDeleteInsurance()}}
                        appearance="primary" color="red" icon={<TrashIcon />}  >
                            <Translate>Delete</Translate>
                        </IconButton>


                    </ButtonToolbar>
                    <br />
                    <small>
                        * <Translate>Click to select Coverage</Translate>
                    </small>

                    <div>
                        <Table
                            sortColumn={patientInsuranceCovgListRequest.sortBy}
                            sortType={patientInsuranceCovgListRequest.sortType}
                            onSortColumn={(sortBy, sortType) => {
                                if (sortBy)
                                    setPatientInsuranceCovgListRequest({
                                        ...patientInsuranceCovgListRequest,
                                        sortBy,
                                        sortType
                                    });
                            }}
                            height={400}
                            headerHeight={30}
                            rowHeight={50}
                            bordered
                            cellBordered
                            onRowClick={setSelectedCoverage}
                            data={patientInsuranceCovgResponse?.object ?? []}
                        >

                            <Column sortable flexGrow={5}>
                                <HeaderCell>Type</HeaderCell>
                                <Cell dataKey="type" />
                            </Column>

                            <Column sortable flexGrow={4}>
                                <HeaderCell>Coverage Type</HeaderCell>
                                <Cell dataKey="coverageType" />
                            </Column>

                            <Column sortable flexGrow={4}>
                                <HeaderCell>Covered Amount</HeaderCell>
                                <Cell dataKey="coveredAmount" />
                            </Column>

                        </Table>
                    </div>
                    <div style={{ padding: 20 }}>
                        <Pagination
                            prev
                            next
                            first
                            last
                            ellipsis
                            boundaryLinks
                            maxButtons={5}
                            size="xs"
                            layout={['limit', '|', 'pager']}
                            limitOptions={[5, 15, 30]}
                            limit={patientInsuranceCovgListRequest.pageSize}
                            activePage={patientInsuranceCovgListRequest.pageNumber}
                            onChangePage={pageNumber => {
                                setPatientInsuranceCovgListRequest({ ...patientInsuranceCovgListRequest, pageNumber });
                            }}
                            onChangeLimit={pageSize => {
                                setPatientInsuranceCovgListRequest({ ...patientInsuranceCovgListRequest, pageSize });
                            }}
                            total={patientInsuranceCovgResponse?.extraNumeric ?? 0}
                        />
                    </div>
                </Drawer.Body>
            </Drawer>








        </div>
    );
};

export default SpecificCoverageModa;
