import React, { useState } from 'react';
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import { faBan } from '@fortawesome/free-solid-svg-icons';
import {Form} from 'rsuite';
const CancellationVaccine = ({
    open,
    setOpen,
    handleCancle,
    object,
    setObject
}) => {


    return (
        <MyModal
            open={open}
            setOpen={setOpen}
            title="Confirm Cancel"
            actionButtonLabel="Submit"
            actionButtonFunction={handleCancle}
            isDisabledActionBtn={object?.statusLkey === '3196709905099521'}
            steps={[
                { title: 'Cancel', icon: faBan },
            ]}
            content={(step) => <Form layout="inline" fluid>
                <MyInput
                    width={"400px"}
                    column
                    fieldLabel="Cancellation Reason"
                    fieldType="textarea"
                    fieldName="cancellationReason"
                    height={120}
                    record={object}
                    setRecord={object}
                    disabled={setObject?.statusLkey === '3196709905099521'}
                />
            </Form>}
            size="450px"
            bodyhieght={300}
        />
    );
};
export default CancellationVaccine;
