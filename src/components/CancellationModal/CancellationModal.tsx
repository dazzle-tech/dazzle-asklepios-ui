import React from 'react';
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import { faBan } from '@fortawesome/free-solid-svg-icons';
import {Form} from 'rsuite';
import { title } from 'process';
const CancellationModal = ({
    open,
    setOpen,
    handleCancle,
    object,
    setObject,
    fieldLabel,
    title
    ,
    fieldName="",
    statusField="statusLkey",
    statusKey="3196709905099521"  // TODO update status to be a LOV value
}) => {
    return (
        <MyModal
            open={open}
            setOpen={setOpen}
            title={`Confirm ${title}`}
            actionButtonLabel="Submit"
            actionButtonFunction={handleCancle}
            isDisabledActionBtn={object?.[statusField] === statusKey}
            steps={[
                {title:title,icon: faBan },
            ]}
            content={(step) => <Form layout="inline" fluid>
                <MyInput
                    width={"400px"}
                    column
                    fieldType="textarea"
                   fieldLabel={fieldLabel}
                    fieldName={fieldName}
                    height={120}
                    record={object}
                    setRecord={setObject}
                    disabled={object?.statusLkey === statusKey}
                />
            </Form>}
            size="450px"
            bodyheight={300}
        />
    );
};
export default CancellationModal;
