
import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import React, { useState } from 'react';
import 'react-tabs/style/react-tabs.css';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import '../styles.less';
import { initialListRequest, ListRequest } from '@/types/types';
import MyButton from '@/components/MyButton/MyButton';
import { useGetPatientRelationsQuery, useDeletePatientRelationMutation, } from '@/services/patientService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserPen } from '@fortawesome/free-solid-svg-icons';
import { newApPatientRelation } from '@/types/model-types-constructor';
import { PlusRound } from '@rsuite/icons';
import MyTable from '@/components/MyTable';
import { notify } from '@/utils/uiReducerActions';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import AddFamilyMember from './AddFamilyMember';
const PatientFamilyMembers = ({ localPatient }) => {
    const dispatch = useAppDispatch();
    const [relationModalOpen, setRelationModalOpen] = useState(false);
    const [deleteRelativeModalOpen, setDeleteRelativeModalOpen] = useState(false);
    const [selectedPatientRelation, setSelectedPatientRelation] = useState<any>({ ...newApPatientRelation });
    const [deleteRelation] = useDeletePatientRelationMutation();
    //Table columns
    const columns = [
        {
            key: 'relationType',
            title: <Translate>Relation Type</Translate>,
            flexGrow: 4,
            render: (row: any) =>
                row?.relationTypeLvalue
                    ? row.relationTypeLvalue.lovDisplayVale
                    : row.relationTypeLkey,
        },
        {
            key: 'relativePatientName',
            title: <Translate>Relative Patient Name</Translate>,
            flexGrow: 4,
            render: (row: any) =>row?.relativePatientObject?.fullName
        },
        {
            key: 'relationCategory',
            title: <Translate>Relation Category</Translate>,
            flexGrow: 4,
            render: (row: any) =>
                row?.categoryTypeLvalue
                    ? row.categoryTypeLvalue.lovDisplayVale
                    : row.categoryTypeLkey,
        }
    ];
    // Initialize patient Relation list request with default filters
    const [patientRelationListRequest, setPatientRelationListRequest] = useState<ListRequest>({
        ...initialListRequest,
        pageSize: 1000
    });
    // Fetch patient Relations
    const { data: patientRelationsResponse, refetch: patientRelationsRefetch } =
        useGetPatientRelationsQuery(
            {
                listRequest: patientRelationListRequest,
                key: localPatient?.key
            },
            { skip: !localPatient.key }
        );
    // Function to check if the current row is the selected one
    const isSelectedRelation = rowData => {
        if (rowData && selectedPatientRelation && selectedPatientRelation.key === rowData.key) {
            return 'selected-row';
        } else return '';
    };
    // Handle deleting a relation
    const handleDeleteRelation = () => {
        deleteRelation({
            key: selectedPatientRelation.key
        }).then(
            () => (
                patientRelationsRefetch(),
                dispatch(notify({msg:'Relation Deleted Successfully',sev: 'success'})),
                setSelectedPatientRelation(newApPatientRelation),
                setDeleteRelativeModalOpen(false),
                handleClearRelative()
            )
        );
    };
    // Handle clearing and closing delete modal
    const handleClearRelative = () => {
        setSelectedPatientRelation(newApPatientRelation);
        setDeleteRelativeModalOpen(false);
    }
    // Handle adding a new Relative
    const handleNewRelative = () => {
        setSelectedPatientRelation({ ...newApPatientRelation });
        setRelationModalOpen(true);
    };
    return (
        <div className="tab-main-container">
            <div className="tab-content-btns">
                <MyButton
                    onClick={handleNewRelative}
                    disabled={!localPatient.key}
                    prefixIcon={() => <PlusRound />}>
                    New Relative
                </MyButton>
                <MyButton
                    disabled={!selectedPatientRelation.key}
                    onClick={() => { setRelationModalOpen(true); }}
                    prefixIcon={() => <FontAwesomeIcon icon={faUserPen} />}>
                    Edit
                </MyButton>
                <MyButton
                    disabled={!selectedPatientRelation.key}
                    onClick={() => { setDeleteRelativeModalOpen(true) }}
                    prefixIcon={() => <FontAwesomeIcon icon={faTrash} />}>
                    Delete
                </MyButton>
            </div>
            <AddFamilyMember
                open={relationModalOpen}
                setOpen={setRelationModalOpen}
                localPatient={localPatient}
                selectedPatientRelation={selectedPatientRelation}
                setSelectedPatientRelation={setSelectedPatientRelation}
                refetch={patientRelationsRefetch}
            />
            <MyTable
                data={patientRelationsResponse?.object ?? []}
                sortColumn={patientRelationListRequest.sortBy}
                sortType={patientRelationListRequest.sortType}
                onSortChange={(sortBy, sortType) => {
                    if (sortBy) {
                        setPatientRelationListRequest({
                            ...patientRelationListRequest,
                            sortBy,
                            sortType
                        });
                    }
                }}
                onRowClick={rowData => {
                    setSelectedPatientRelation(rowData);
                }}
                rowClassName={isSelectedRelation}
                columns={columns}
            />
            <DeletionConfirmationModal
                open={deleteRelativeModalOpen}
                setOpen={setDeleteRelativeModalOpen}
                itemToDelete='Relation'
                actionButtonFunction={handleDeleteRelation}>
            </DeletionConfirmationModal>
        </div>
    );
};

export default PatientFamilyMembers;
