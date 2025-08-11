import MyModal from "@/components/MyModal/MyModal";
import MyTable from "@/components/MyTable";
import Translate from "@/components/Translate";
import React from "react";

const PatientDuplicate = ({ list, handleSave, open, setOpen ,setlocalPatient }) => {
    const columns = [
        {
            key: "fullName",
            title: <Translate>Patient Full Name</Translate>,
            render: (rowData: any) => {
                return rowData?.fullName
            }

        },
        {
            key: "patientMrn",
            title: <Translate>MRN</Translate>,
            render: (rowData: any) => {
                return rowData?.patientMrn
            }

        },
        {
            key: "dob",
            title: <Translate>DOB</Translate>,
            render: (rowData: any) => {
                return rowData.dob
            }

        },
        {
            key: "genderLkey",
            title: <Translate>Sex at Birth</Translate>,
            render: (rowData: any) => {
                return rowData.genderLvalue ? rowData.genderLvalue?.lovDisplayVale : rowData.genderLkey
            }

        },
        {
            key: "",
            title: <Translate>Document Type</Translate>,
            render: (rowData: any) => {
                return rowData.documentTypeLvalue ? rowData.documentTypeLvalue?.lovDisplayVale : rowData.documentTypeLkey
            }

        }
        , {
            key: "documentNo",
            title: <Translate>Document Number</Translate>,
            render: (rowData: any) => {
                return rowData.documentNo
            }

        }
        , {
            key: "mobileNumber",
            title: <Translate> Primary Mobile Number</Translate>,
            render: (rowData: any) => {
                return rowData.mobileNumber
            }

        }

    ]
    return (<>
        <MyModal
            open={open}
            setOpen={setOpen}
            title={"Potential Duplicate"}
            actionButtonLabel="Ignore,and Proceed"
            cancelButtonLabel="Cancel Registration"
            actionButtonFunction={handleSave}
            content={<>
                <MyTable
                    data={list ?? []}
                    columns={columns}
                    onRowClick={rowData=>
                        setlocalPatient(rowData)
                    }

                />

            </>}



        />
    </>)
}

export default PatientDuplicate;