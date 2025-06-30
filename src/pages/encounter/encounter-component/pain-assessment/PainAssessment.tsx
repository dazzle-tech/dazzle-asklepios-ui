import React, { useEffect, useState } from 'react';
import { initialListRequest, ListRequest } from '@/types/types';
import { useAppSelector, useAppDispatch } from '@/hooks';
import { Checkbox } from 'rsuite';
import { useSaveComplaintSymptomsMutation, useGetComplaintSymptomsQuery } from '@/services/encounterService';
import PlusIcon from '@rsuite/icons/Plus';
import MyButton from '@/components/MyButton/MyButton';
import Translate from '@/components/Translate';
import { newApComplaintSymptoms } from '@/types/model-types-constructor';
import { ApComplaintSymptoms } from '@/types/model-types';
import { notify } from '@/utils/uiReducerActions';
import CloseOutlineIcon from '@rsuite/icons/CloseOutline';
import CancellationModal from '@/components/CancellationModal';
import { MdModeEdit } from 'react-icons/md';
import MyTable from '@/components/MyTable';
import { formatDateWithoutSeconds } from '@/utils';
import AddPainAssessment from './AddPainAssessment';
const PainAssessment = ({ patient, encounter,edit }) => {
 

    return (
        <div>
            <div className='bt-div'>
                <MyButton onClick={() => { }} prefixIcon={() => <CloseOutlineIcon />} >
                    <Translate>Cancel</Translate>
                </MyButton>
                <Checkbox onChange={(value, checked) => {
                   
                }}>
                    Show Cancelled
                </Checkbox>
                <Checkbox onChange={(value, checked) => {
                    // if (checked) {
                    //     setAllData(true);
                    // }
                    // else {
                    //     setAllData(false);
                    // }
                }}>
                    Show All
                </Checkbox>
                <div className='bt-right'>
                    <MyButton 
                    disabled={edit}
                     prefixIcon={() => <PlusIcon />} >Add </MyButton>
                </div>
            </div>
            <AddPainAssessment 
            <MyTable
                data={[]}
                columns={null}
                height={600}
                // loading={isLoading}
                onRowClick={rowData => {
                  //  setComplaintSymptoms({ ...rowData });
                }}
                // rowClassName={isSelected}
                // page={pageIndex}
                // rowsPerPage={rowsPerPage}
                // totalCount={totalCount}
                // onPageChange={handlePageChange}
                // onRowsPerPageChange={handleRowsPerPageChange}
            />
           {/* <CancellationModal title="Cancel Chief Complaint" fieldLabel="Cancellation Reason" open={popupCancelOpen} setOpen={setPopupCancelOpen} object={complaintSymptoms} setObject={setComplaintSymptoms} handleCancle={handleCancle} fieldName="cancellationReason" /> */}
        </div>
    );
};
export default PainAssessment;