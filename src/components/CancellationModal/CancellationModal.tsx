import React from 'react';
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import { faBan } from '@fortawesome/free-solid-svg-icons';
import {Form} from 'rsuite';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";;
const CancellationModal = ({
    open,
    setOpen,
    handleCancle,
    object,
    setObject,
    fieldLabel=null,
    title,
    fieldName="",
    statusField="statusLkey",
    statusKey="3196709905099521" ,
    withReason=true // TODO update status to be a LOV value
}) => {
    return (
        <MyModal
            open={open}
            setOpen={setOpen}
            title={`Confirm ${title}`}
            actionButtonLabel="Confirm"
            actionButtonFunction={handleCancle}
            isDisabledActionBtn={object?.[statusField] === statusKey}
            steps={[
                {title:title,icon: <FontAwesomeIcon icon={faBan }/>},
            ]}
            content={(step) => withReason?<Form layout="inline" fluid>
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
            </Form>:<></>}
            size="450px"
            bodyheight={350}
            cancelButtonLabel='Close'
        />
    );
};
export default CancellationModal;
