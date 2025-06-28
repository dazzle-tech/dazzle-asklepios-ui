import { useAppDispatch } from "@/hooks";
import { useGetProceduresQuery } from "@/services/procedureService";
import { useGetLovValuesByCodeQuery } from "@/services/setupService";
import { newApProcedure } from "@/types/model-types-constructor";
import { initialListRequest, ListRequest } from "@/types/types";
import React, { useEffect, useState } from "react";
import Perform from "../encounter/encounter-component/procedure/Perform";
import MyModal from "@/components/MyModal/MyModal";
import MyTable from "@/components/MyTable";
import { Checkbox, HStack, Tooltip, Whisper } from "rsuite";
import Translate from "@/components/Translate";
import { formatDateWithoutSeconds } from "@/utils";
import { FaBedPulse, FaFileArrowDown } from "react-icons/fa6";
import { MdAttachFile } from "react-icons/md";
import { notify } from "@/utils/uiReducerActions";
import { useGetPatientAttachmentsListQuery } from "@/services/attachmentService";
import { useGetPatientByIdQuery, useLazyGetPatientByIdQuery } from "@/services/patientService";
import { useGetEncounterByIdQuery } from "@/services/encounterService";
import { title } from "process";
import { render } from "react-dom";
const handleDownload = attachment => {
    const byteCharacters = atob(attachment.fileContent);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: attachment.contentType });

    // Create a temporary  element and trigger the download
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = attachment.fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
};
const ProcedureModule = () => {

    const dispatch = useAppDispatch();
    const [showCanceled, setShowCanceled] = useState(true);
    const [attachmentsModalOpen, setAttachmentsModalOpen] = useState(false);
    const [procedure, setProcedure] = useState<any>({
        ...newApProcedure,
    });

    const { data: patient } = useGetPatientByIdQuery(procedure?.patientKey, { skip: !procedure?.patientKey });
    const { data: encounter } = useGetEncounterByIdQuery(procedure?.encounterKey, { skip: !procedure?.encounterKey });
    const [openPerformModal, setOpenPerformModal] = useState(false);
    const { data: CategoryLovQueryResponse } = useGetLovValuesByCodeQuery('PROCEDURE_CAT');
    const isSelected = rowData => {
        if (rowData && procedure && rowData.key === procedure.key) {
            return 'selected-row';
        } else return '';
    };


    const [listRequest, setListRequest] = useState<ListRequest>({
        ...initialListRequest,
        filters: [
            {
                fieldName: 'current_department',
                operator: 'match',
                value: "false"
            },

            {
                fieldName: 'status_lkey',
                operator: showCanceled ? 'notMatch' : 'match',
                value: '3621690096636149'
            }
        ]
    });
    const { data: procedures, refetch: proRefetch, isLoading: procedureLoding } = useGetProceduresQuery(listRequest);
    const [attachmentsListRequest, setAttachmentsListRequest] = useState<ListRequest>({
        ...initialListRequest,
        filters: [
            {
                fieldName: 'deleted_at',
                operator: 'isNull',
                value: undefined
            }

            ,
            {
                fieldName: 'attachment_type',
                operator: "match",
                value: "PROCEDURE"
            }
        ]
    });

    const { data: fetchPatintAttachmentsResponce, refetch: attachmentRefetch, isLoading: loadAttachment } = useGetPatientAttachmentsListQuery(attachmentsListRequest);
    const [trigger] = useLazyGetPatientByIdQuery();
    useEffect(() => {

        if (!attachmentsModalOpen) {

            const updatedFilters = [
                {
                    fieldName: 'deleted_at',
                    operator: 'isNull',
                    value: undefined
                }

                ,
                {
                    fieldName: 'attachment_type',
                    operator: "match",
                    value: "PROCEDURE"
                }
            ];
            setAttachmentsListRequest((prevRequest) => ({
                ...prevRequest,
                filters: updatedFilters,
            }));
        }
        attachmentRefetch()

    }, [attachmentsModalOpen])

    useEffect(() => {
        const upateFilter = [
            {
                fieldName: 'current_department',
                operator: 'match',
                value: "false"
            },

            {
                fieldName: 'status_lkey',
                operator: showCanceled ? 'notMatch' : 'match',
                value: '3621690096636149'
            }
        ]
        setListRequest((prevRequest) => ({
            ...prevRequest,
            filters: upateFilter,
        }));
    }, [showCanceled]);
    const [patients, setPatients] = useState({});

    useEffect(() => {

        const fetchPatients = async () => {
            for (const procedure of procedures?.object) {

                const key = procedure.patientKey;
                if (!patients[key]) {
                    const result = await trigger(key).unwrap();
                    setPatients(prev => ({ ...prev, [key]: result }));
                }
            }
        };

        fetchPatients();
    }, [procedures]);
    const OpenPerformModel = () => {
        setOpenPerformModal(true);
    };


    const tableColumns = [
        {
            key: "patientKey",
            title: <Translate>Patient</Translate>,
            render: (rowData: any) => {
                return <Whisper placement="top" speaker={<Tooltip>{patients[rowData.patientKey]?.patientMrn}</Tooltip>}>
                    {patients[rowData.patientKey]?.fullName}
                </Whisper>

            }
        },
        {
            key: "procedureId",
            dataKey: "procedureId",
            title: <Translate>PROCEDURE ID</Translate>,
            flexGrow: 1,
            render: (rowData: any) => {

                return rowData.procedureId;
            }
        },
        {
            key: "procedureName",
            dataKey: "procedureName",
            title: <Translate>Procedure Name</Translate>,
            flexGrow: 1,

        },
        {
            key: "scheduledDateTime",
            dataKey: "scheduledDateTime",
            title: <Translate>SCHEDULED DATE TIME</Translate>,
            flexGrow: 1,
            render: (rowData: any) => {
                return rowData.scheduledDateTime ? formatDateWithoutSeconds(rowData.scheduledDateTime) : ' '
            }
        },
        {
            key: "categoryKey",
            dataKey: "categoryKey",
            title: <Translate>CATEGORY</Translate>,
            flexGrow: 1,
            render: (rowData: any) => {
                const category = CategoryLovQueryResponse?.object?.find(item => {
                    return item.key === rowData.categoryKey;
                });

                return category?.lovDisplayVale || ' ';
            }
        },
        {
            key: "priorityLkey",
            dataKey: "priorityLkey",
            title: <Translate>PRIORITY</Translate>,
            flexGrow: 1,
            render: (rowData: any) => {
                return rowData.priorityLkey ? rowData.priorityLvalue?.lovDisplayVale : rowData.priorityLkey
            }
        },
        {
            key: "procedureLevelLkey",
            dataKey: "procedureLevelLkey",
            title: <Translate>LEVEL</Translate>,
            flexGrow: 1,
            render: (rowData: any) => {
                return rowData.procedureLevelLkey
                    ? rowData.procedureLevelLvalue?.lovDisplayVale
                    : rowData.procedureLevelLkey
            }
        },
        {
            key: "indications",
            dataKey: "indications",
            title: <Translate>INDICATIONS</Translate>,
            flexGrow: 1,

        },
        {
            key: "statusLkey",
            dataKey: "statusLkey",
            title: <Translate>STATUS</Translate>,
            flexGrow: 1,
            render: (rowData: any) => {
                return rowData.statusLvalue?.lovDisplayVale ?? null
            }
        },
        {
            key: "",
            dataKey: "",
            title: <Translate>ATTACHED FILE</Translate>,
            flexGrow: 1,
            render: (rowData: any) => {
                const matchingAttachments = fetchPatintAttachmentsResponce?.object?.filter(
                    item => item.referenceObjectKey === rowData.key
                );
                const lastAttachment = matchingAttachments?.[matchingAttachments.length - 1];

                return (
                    <HStack spacing={2}>
                        {lastAttachment && (
                            <FaFileArrowDown
                                size={20}
                                fill="var(--primary-gray)"
                                onClick={() => handleDownload(lastAttachment)}
                                style={{ cursor: 'pointer' }}
                            />
                        )}

                        <MdAttachFile
                            size={20}
                            fill="var(--primary-gray)"
                            onClick={() => setAttachmentsModalOpen(true)}
                            style={{ cursor: 'pointer' }}
                        />
                    </HStack>
                );
            }
        },
        {
            key: "",
            dataKey: "",
            title: <Translate>PERFORM</Translate>,
            flexGrow: 1,
            render: (rowData: any) => {
                const isDisabled = rowData.currentDepartment;

                return (
                    <FaBedPulse
                        size={22}
                        fill={isDisabled ? "#ccc" : "var(--primary-gray)"}
                        style={{ cursor: isDisabled ? "not-allowed" : "pointer" }}
                        onClick={!isDisabled ? OpenPerformModel : undefined}
                    />
                );
            }
        },

        {
            key: "facilityKey",
            dataKey: "facilityKey",
            title: <Translate>FACILITY</Translate>,
            flexGrow: 1,
            expandable: true,
            render: (rowData: any) => { return rowData.facilityKey ? rowData.facility?.facilityName : "" }
        },
        {
            key: "departmentTypeLkey",
            dataKey: "departmentTypeLkey",
            title: <Translate>DEPARTMENT</Translate>,
            flexGrow: 1,
            expandable: true,
            render: (rowData: any) => {
                return rowData.departmentKey ? rowData.department?.departmentTypeLvalue?.lovDisplayVale : ""
            }
        },

        {
            key: "bodyPartLkey",
            dataKey: "bodyPartLkey",
            title: <Translate>BODY PART</Translate>,
            flexGrow: 1,
            expandable: true,
            render: (rowData: any) => {
                return rowData.bodyPartLkey ? rowData.bodyPartLvalue.lovDisplayVale : rowData.bodyPartLkey
            }
        },
        {
            key: "sideLkey",
            dataKey: "sideLkey",
            title: <Translate>SIDE</Translate>,
            flexGrow: 1,
            expandable: true,
            render: (rowData: any) => {
                return rowData.sideLkey ? rowData.sideLvalue.lovDisplayVale : rowData.sideLkey;
            }
        },
        {
            key: "notes",
            dataKey: "notes",
            title: <Translate>NOTE</Translate>,
            flexGrow: 1,
            expandable: true,

        },
        ,
        {
            key: "",
            title: <Translate>CREATED AT/BY</Translate>,
            expandable: true,
            render: (rowData: any) => {
                return (<>
                    <span>{rowData.createdBy}</span>
                    <br />
                    <span className='date-table-style'>{rowData.createdAt ? formatDateWithoutSeconds(rowData.createdAt) : ''}</span>
                </>)
            }

        },
        {
            key: "",
            title: <Translate>UPDATED AT/BY</Translate>,
            expandable: true,
            render: (rowData: any) => {
                return (<>
                    <span>{rowData.updatedBy}</span>
                    <br />
                    <span className='date-table-style'>{rowData.createdAt ? formatDateWithoutSeconds(rowData.updatedAt) : ''}</span>
                </>)
            }

        },
        {
            key: "",
            title: <Translate>CANCELLED AT/BY</Translate>,
            expandable: true,
            render: (rowData: any) => {
                return (<>
                    <span>{rowData.deletedBy}</span>
                    <br />
                    <span className='date-table-style'>{rowData.deletedAt ? formatDateWithoutSeconds(rowData.deletedAt) : ''}</span>
                </>)
            }

        },
        {
            key: "cancellationReason",
            dataKey: "cancellationReason",
            title: <Translate>CANCELLITON REASON</Translate>,
            flexGrow: 1,
            expandable: true
        }

    ]
    const pageIndex = listRequest.pageNumber - 1;

    // how many rows per page:
    const rowsPerPage = listRequest.pageSize;

    // total number of items in the backend:
    const totalCount = procedures?.extraNumeric ?? 0;

    // handler when the user clicks a new page number:
    const handlePageChange = (_: unknown, newPage: number) => {
        // MUI gives you a zero-based page, so add 1 for your API

        setListRequest({ ...listRequest, pageNumber: newPage + 1 });
    };

    // handler when the user chooses a different rows-per-page:
    const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {

        setListRequest({
            ...listRequest,
            pageSize: parseInt(event.target.value, 10),
            pageNumber: 1 // reset to first page
        });
    };
    return (
        <>

            <div className='bt-div'>

                <Checkbox
                    checked={!showCanceled}
                    onChange={() => {
                        setShowCanceled(!showCanceled);

                    }}
                >
                    Show Cancelled
                </Checkbox>

            </div>

            <MyTable
                columns={tableColumns}
                data={procedures?.object ?? []}
                onRowClick={rowData => {
                    setProcedure(rowData);

                }}
                loading={procedureLoding}
                rowClassName={isSelected}
                sortColumn={listRequest.sortBy}
                sortType={listRequest.sortType}
                onSortChange={(sortBy, sortType) => {
                    setListRequest({ ...listRequest, sortBy, sortType });
                }}
                page={pageIndex}
                rowsPerPage={rowsPerPage}
                totalCount={totalCount}
                onPageChange={handlePageChange}
                onRowsPerPageChange={handleRowsPerPageChange}
            />

            <MyModal
                open={openPerformModal}
                setOpen={setOpenPerformModal}
                title='Perform Details'
                hideActionBtn
                size='full'
                content={<Perform proRefetch={proRefetch} encounter={encounter} patient={patient} procedure={procedure} setProcedure={setProcedure} edit={false} />}
            ></MyModal>








        </>
    );
}
export default ProcedureModule;