import React from 'react';
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import { faBan } from '@fortawesome/free-solid-svg-icons';
import { Form } from 'rsuite';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const CancellationModal = ({
    open,
    setOpen,
    handleCancle,
    object,
    setObject,
    fieldLabel = null,
    title,
    fieldName = "",
    statusField = "statusLkey",
    statusKey = "CANCELLED",
    withReason = true,
    required = false,
}) => {

    const isEmpty = required && !object?.[fieldName];

    return (
        <MyModal
            open={open}
            setOpen={setOpen}
            title={`Confirm ${title}`}
            actionButtonLabel="Confirm"
            actionButtonFunction={handleCancle}
            isDisabledActionBtn={
                object?.[statusField] === statusKey ||
                (required && !object?.[fieldName])
            }
            steps={[
                { title, icon: <FontAwesomeIcon icon={faBan} /> },
            ]}
            content={() =>
                withReason ? (
                    <Form fluid style={{ width: "100%" }}>
                            <MyInput
                                width="100%"
                                fieldType="textarea"
                                fieldLabel={fieldLabel}
                                fieldName={fieldName}
                                height={120}
                                record={object}
                                setRecord={setObject}
                                disabled={object?.[statusField] === statusKey}
                                required={required}
                            />
                    </Form>
                ) : (
                    <></>
                )
            }
            size="30vw"
            bodyheight="55vh"
            cancelButtonLabel="Close"
        />
    );
};

export default CancellationModal;
