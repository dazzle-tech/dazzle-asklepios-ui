import React, { useEffect, useState } from "react";
import { Panel, Form, Stack, Divider } from "rsuite";
import { Uploader } from "rsuite";
import MyButton from "@/components/MyButton/MyButton";
import MyInput from "@/components/MyInput";
import AdvancedModal from "@/components/AdvancedModal";
import { FaCalendarAlt, FaInfoCircle } from "react-icons/fa";
import { FaPaperclip, FaUser, FaWarehouse } from "react-icons/fa6";
import authSlice from "@/reducers/authSlice";
import { useAppSelector } from "@/hooks";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import AddEditWarehouse from "@/pages/setup/warehouse-setup/AddEditWarehouse";
import { ApWarehouse } from "@/types/model-types";
import { newApWarehouse } from "@/types/model-types-constructor";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { useGetLovValuesByCodeQuery, useGetWarehouseQuery } from "@/services/setupService";
import { Plus } from "@rsuite/icons";
import { initialListRequest, ListRequest } from "@/types/types";
import AddEditTransferProduct from "./AddEditTransferProduct";
import { useSelector } from "react-redux";
import { useUploadAttachmentsMutation, useGetInventoryTransferAttachmentsQuery, useDeleteAttachmentMutation, useGetDownloadUrlMutation } from "@/services/inventory/inventory-transfer/attachmentService";
import { notify } from "@/utils/uiReducerActions";
import { useDispatch } from "react-redux";

interface AddEditTransferProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    transfer: any;
    setTransfer: (t: any) => void;
    refetch: () => void;
}

const AddEditTransfer: React.FC<AddEditTransferProps> = ({
    open,
    setOpen,
    transfer,
    setTransfer,
    refetch,
}) => {
    const mode = useSelector((state: any) => state.ui.mode);
    const dispatch = useDispatch();
    const [attachments, setAttachments] = useState<any[]>([]);
    const [edit_new, setEdit_new] = useState(false);
    const [warehouse, setWarehouse] = useState<ApWarehouse>({ ...newApWarehouse });
    const [generateCode, setGenerateCode] = useState();
    const [recordOfTransferCode, setRecordOfTransferCode] = useState({ transNo: '' });
    
    // Attachment service hooks
    const [uploadAttachment] = useUploadAttachmentsMutation();
    const [deleteAttachment] = useDeleteAttachmentMutation();
    const [getDownloadUrl] = useGetDownloadUrlMutation();
    
    // Fetch attachments if transfer has an ID
    const { data: existingAttachments, refetch: refetchAttachments } = useGetInventoryTransferAttachmentsQuery(
        { transactionId: transfer?.key },
        { skip: !transfer?.key }
    );
    // Generate code for transfer
    const generateFiveDigitCode = () => {
        const code = Math.floor(10000 + Math.random() * 90000);
        setTransfer({ ...transfer, transNo: code })
    };
    const authSlice = useAppSelector(state => state.auth);
    const [openAddEditWarehousePopup, setOpenAddEditWarehousePopup] = useState(false);
    const { data: transTypeListResponse } = useGetLovValuesByCodeQuery('STOCK_TRANSACTION_TYPES');
    const [warehouseListRequest, setWarehouseListRequest] = useState<ListRequest>({
        ...initialListRequest,
        filters: [
            {
                fieldName: 'deleted_at',
                operator: 'isNull',
                value: undefined,
            },
        ],
    });

    const { data: warehouseListResponse } = useGetWarehouseQuery(warehouseListRequest);
    
    const handleSave = async () => {
        try {
            // TODO: call API to save transfer first and get the transaction ID
            // For now, assuming transfer.key exists or will be created
            
            // Upload attachments only if transfer exists and there are files to upload
            if (transfer?.key && attachments.length > 0) {
                for (const file of attachments) {
                    await uploadAttachment({
                        transactionId: transfer.key,
                        file: file.blobFile || file
                    }).unwrap();
                }
                dispatch(notify({ sev: 'success', msg: 'Attachments uploaded successfully' }));
                refetchAttachments();
                setAttachments([]);
            }
            
            refetch();
            setOpen(false);
        } catch (error) {
            console.error('Error saving transfer:', error);
            dispatch(notify({ sev: 'error', msg: 'Failed to save transfer or upload attachments' }));
        }
    };

    const handleUploadChange = (fileList: File[]) => {
        setAttachments(fileList);
    };
    
    const handleDownloadAttachment = async (attachmentId: number) => {
        try {
            const response = await getDownloadUrl(attachmentId).unwrap();
            window.open(response.url, '_blank');
        } catch (error) {
            console.error('Error downloading attachment:', error);
            dispatch(notify({ sev: 'error', msg: 'Failed to download attachment' }));
        }
    };
    
    const handleDeleteAttachment = async (attachmentId: number) => {
        try {
            await deleteAttachment({ id: attachmentId, transactionId: transfer?.key }).unwrap();
            dispatch(notify({ sev: 'success', msg: 'Attachment deleted successfully' }));
            refetchAttachments();
        } catch (error) {
            console.error('Error deleting attachment:', error);
            dispatch(notify({ sev: 'error', msg: 'Failed to delete attachment' }));
        }
    };

    useEffect(() => {
        if (transfer?.transNo) {
            setRecordOfTransferCode({ transNo: transfer.transNo });
            return;
        }
        generateFiveDigitCode();
        setRecordOfTransferCode({ transNo: transfer?.transNo ?? generateCode });
        console.log(recordOfTransferCode);
    }, [transfer?.transNo?.length]);

    const leftContent = () => {

        return (
            <>
                {/* Transfer Details */}
                <Stack alignItems="center" spacing={8}>
                    <FaInfoCircle color="#2264E5" />
                    <h4 style={{ margin: 0, fontWeight: '600', fontSize: '1.1rem', color: mode === 'light' ? '#333' : 'var(--white)' }}>
                        Transfer Details
                    </h4>
                </Stack>
                <Divider style={{ margin: '10px 0' }} />
                <p><b>Transfer ID:</b> {transfer.transNo}</p>
                <p><b>Performed By:</b> <FaUser style={{ marginRight: 5, color: '#666' }} /> {authSlice.user.username}</p>
                <p><b>Date & Time:</b> <FaCalendarAlt style={{ marginRight: 5, color: '#666' }} /> {new Date().toLocaleString()}</p>

                {/* Attachments */}
                <Divider style={{ margin: '20px 0' }} />
                <Stack alignItems="center" spacing={8}>
                    <FaPaperclip color="#FF6384" />
                    <h5 style={{ margin: 0, fontWeight: '600', color: mode === 'light' ? '#444' : 'var(--white)'}}>Attachments</h5>
                </Stack>
                
                {/* Existing Attachments */}
                {existingAttachments && existingAttachments.data && existingAttachments.data.length > 0 && (
                    <div style={{ marginTop: 10, marginBottom: 10 }}>
                        <p style={{ fontSize: '0.85rem', fontWeight: '500', marginBottom: 5 }}>Uploaded Files:</p>
                        {existingAttachments.data.map((attachment) => (
                            <div key={attachment.id} style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center',
                                padding: '5px 0',
                                fontSize: '0.9rem',
                                color: mode === 'light' ? '#555' : '#ccc'
                            }}>
                                <span 
                                    style={{ cursor: 'pointer', color: '#2264E5' }}
                                    onClick={() => handleDownloadAttachment(attachment.id)}
                                >
                                    {attachment.filename}
                                </span>
                                <MyButton 
                                    size="xs" 
                                    appearance="ghost" 
                                    color="red"
                                    onClick={() => handleDeleteAttachment(attachment.id)}
                                >
                                    Delete
                                </MyButton>
                            </div>
                        ))}
                    </div>
                )}
                
                {/* Upload New Attachments */}
                {!transfer?.key && (
                    <p style={{ fontSize: '0.85rem', color: '#999', marginTop: 10 }}>
                        Save the transfer first to upload attachments
                    </p>
                )}
                <Uploader
                    action=""
                    autoUpload={false}
                    multiple
                    fileListVisible
                    onChange={handleUploadChange}
                    listType="picture-text"
                    style={{ marginTop: 10 }}
                />
                <Stack style={{ marginTop: 10 }}>
                    {attachments.map((file, idx) => (
                        <div key={idx} style={{ fontSize: '0.9rem', color: '#555' }}>
                            {file.name}
                        </div>
                    ))}
                </Stack>

                {/* Warehouse Details Section - Conditional */}
                {transfer?.warehouseKey !== null && (
                    <>
                        <Divider style={{ margin: "20px 0" }} />
                        <Stack alignItems="center" spacing={8}>
                            <FaWarehouse color="#c7be0eff" />
                            <h4
                                style={{
                                    margin: 0,
                                    fontWeight: "600",
                                    fontSize: "1.1rem",
                                    color: mode === 'light' ? '#333' : 'var(--white)',
                                }}
                            >
                                Warehouse Details
                            </h4>
                        </Stack>
                        <Divider style={{ margin: "10px 0" }} />
                        <p>
                            <b>Warehouse Key:</b> {transfer.warehouseKey}
                        </p>
                        <p>
                            <b>Warehouse Name:</b> {"N/A"}
                        </p>
                    </>
                )}

            </>
        );
    }

    const topContent = () => {

        return (
            <>
                <Panel
                    header="Transfer Information"
                    bordered
                    style={{ marginBottom: 20, backgroundColor: mode === "light" ? "white" : 'var(--dark-black)', padding: 20, borderRadius: 6, height: 350, overflowY: "auto" }}
                >

                    <div className="table-buttons-right">
                        <AddEditWarehouse
                            open={openAddEditWarehousePopup}
                            setOpen={setOpenAddEditWarehousePopup}
                            warehouse={warehouse}
                            setWarehouse={setWarehouse}
                            edit_new={edit_new}
                            setEdit_new={setEdit_new}
                            refetch={refetch}
                        />
                    </div>
                    <Form fluid>

                        <div className='container-of-three-fields' >
                            <div className='container-of-field' >
                                     <MyInput
                                    width="100%"
                                    fieldLabel="From Warehouse"
                                    fieldName="fromWarehouseKey"
                                    fieldType="select"
                                    selectData={warehouseListResponse?.object ?? []}
                                    selectDataLabel="warehouseName"
                                    selectDataValue="key"
                                    record={transfer}
                                    setRecord={setTransfer}
                                />
                            </div>
                            <div className='container-of-field' >
                               <MyInput
                                    width="100%"
                                    fieldLabel="To Warehouse"
                                    fieldName="toWarehouseKey"
                                    fieldType="select"
                                    selectData={warehouseListResponse?.object ?? []}
                                    selectDataLabel="warehouseName"
                                    selectDataValue="key"
                                    record={transfer}
                                    setRecord={setTransfer}
                                />
                            </div>
                            <div className='container-of-field' >
                                    <MyInput
                                    width="100%"
                                    fieldLabel="Reason"
                                    fieldName="transReason"
                                    record={transfer}
                                    setRecord={setTransfer}
                                />
                            </div>
                        </div>
                        <div className='container-of-three-fields' >
                            <div className='container-of-field' >
                                <MyInput
                                    width="100%"
                                    disabled={transfer?.key}
                                    fieldLabel="Reference Doc Num."
                                    fieldName="docNum"
                                    record={transfer}
                                    setRecord={setTransfer}
                                />
                            </div>
                            <div className='container-of-field' >

                                <MyInput width="100%" fieldLabel="Approved By" disabled fieldName="updateBy" record={transfer} setRecord={setTransfer} />
                            </div>
                            <div className='container-of-field' >
                                <MyInput
                                    width="100%"
                                    disabled
                                    fieldLabel="Approval Status "
                                    fieldName="docNum"
                                    record={transfer}
                                    setRecord={setTransfer}
                                />
                            </div>

                        </div>
                        <div className='container-of-three-fields' >
                            <div className='container-of-field' >
                                <MyInput
                                    width="100%"
                                    disabled
                                    fieldLabel="Vender"
                                    fieldName="remarks"
                                    hight="50%"
                                    record={transfer}
                                    setRecord={setTransfer}
                                />
                            </div>

                            <div className='container-of-field' >

                                <MyInput width="100%" fieldLabel="Serial Number" disabled fieldName="serialNumber" record={transfer} setRecord={setTransfer} />
                            </div>
                            <div className='container-of-field' >

                                <MyInput width="100%" fieldLabel="Invoice Number" disabled fieldName="InvoiceNumber" record={transfer} setRecord={setTransfer} />
                            </div>

                        </div>
                        <div className='container-of-three-fields' >
                            <div className='container-of-field' >
                                <MyInput
                                    width="100%"
                                    disabled={transfer?.key}
                                    fieldLabel="Remarks"
                                    fieldName="remarks"
                                    fieldType="textarea"
                                    hight="50%"
                                    record={transfer}
                                    setRecord={setTransfer}
                                />
                            </div>

                            <div className="table-buttons-right">
                                <MyButton appearance="primary" onClick={handleSave} disabled={transfer?.key}>
                                    Save Transfer
                                </MyButton>
                                <MyButton
                                    appearance="ghost"
                                    title="Add New Warehouse"
                                    disabled={transfer?.key}
                                    onClick={() => setOpenAddEditWarehousePopup(true)}
                                >
                                    <FontAwesomeIcon icon={faPlus} /> Add New Warehouse
                                </MyButton>

                            </div>
                        </div>
                    </Form>
                </Panel>
            </>
        );
    }

    const rightContent = () => {
        return (
            <div>
                {topContent()}
              

                <div style={{ marginTop: 20 }}>
              <AddEditTransferProduct transProduct={null} setTransProduct={null} transaction={transfer} setTransaction={setTransfer} refetch={refetch} />
                </div>
            </div>


        );
    }
    return (
        <AdvancedModal
            open={open}
            setOpen={setOpen}
            //   title={transfer?.key ? "Edit Inventory Transfer" : "New Inventory Transfer"}
            leftContent={leftContent()}
            rightContent={rightContent()}
            leftWidth="20%"
            rightWidth="80%"
        />
    );
};

export default AddEditTransfer;
