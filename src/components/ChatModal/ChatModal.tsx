import React, { useEffect, useState, useRef } from "react";
import MyButton from "../MyButton/MyButton";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faComments, faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import MyInput from "../MyInput";
import { Form } from "rsuite";
import MyModal from "../MyModal/MyModal";
import "./styles.less";
import { formatDateWithoutSeconds } from "@/utils";
import { useSelector } from "react-redux";
const ChatModal = ({ title, open, setOpen, handleSendMessage, list, fieldShowName }) => {
    const [newMessage, setNewMessage] = useState({ message: "" });
    const endOfMessagesRef = useRef(null);
    const mode = useSelector((state: any) => state.ui.mode);
    useEffect(() => {

        const timeout = setTimeout(() => {
            if (endOfMessagesRef.current) {
                endOfMessagesRef.current.scrollIntoView({ behavior: "smooth" });
            }
        }, 100);

        return () => clearTimeout(timeout);
    }, [list]);

    return (
        <div className='chat-modal'>
            <MyModal
                hideCancel
                hideActionBtn
                title={title}
                open={open}
                setOpen={setOpen}
                size="xs"
                bodyheight="60vh"
                steps={[{ title: title, icon: <FontAwesomeIcon icon={faComments} /> }]}
                content={
                    <div className="basic-div">
                        <div className="chat-box">
                            {list?.length > 0 ? (
                                list?.map((msg, index) => (
                                    <div key={index} className="message-box">
                                        <span
                                            className="message-text"
                                        >
                                            {msg[fieldShowName]}
                                        </span>
                                        <div className="message-date">
                                            {formatDateWithoutSeconds(msg.createdAt)}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="no-data">No data found</p>
                            )}

                            <div ref={endOfMessagesRef}></div>
                        </div>
                        <div className={`send-message-box ${mode === 'light' ? 'light' : 'dark'}`}>
                            <Form fluid className="fill-width">
                                <MyInput
                                    placeholder="write note.."
                                    showLabel={false}
                                    fieldName={"message"}
                                    record={newMessage}
                                    setRecord={setNewMessage}
                                    width={"95%"}
                                    enterClick={()=> {handleSendMessage(newMessage.message);
                                        setNewMessage({ message: "" })
                                    }}
                                ></MyInput></Form>

                            <MyButton appearance="primary" onClick={() => {
                                handleSendMessage(newMessage.message);
                                setNewMessage({ message: "" })
                            }

                            }>
                                <FontAwesomeIcon icon={faPaperPlane} />
                            </MyButton>
                        </div>
                    </div>
                }
            ></MyModal>
        </div>
    );
}
export default ChatModal;