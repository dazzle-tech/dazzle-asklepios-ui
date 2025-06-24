import MyTable from "@/components/MyTable";
import Translate from "@/components/Translate";
import { useGetEncounterByIdQuery } from "@/services/encounterService";
import { useGetProceduresQuery } from "@/services/procedureService";
import { initialListRequest, ListRequest } from "@/types/types";
import React, { useState } from "react";
import { Divider, Text } from "rsuite";
import FullViewTable from "./FullViewTable";
const Procedures=({patient})=>{
    const [open, setOpen] =useState(false);
    
      const [listRequest, setListRequest] = useState<ListRequest>({
        ...initialListRequest,
        filters: [
          {
            fieldName: 'patient_key',
            operator: 'match',
            value: patient.key
          },
       
        ]
      });
      const { data: procedures, refetch: proRefetch, isLoading: procedureLoding } = useGetProceduresQuery(listRequest);
    const columns=[
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
    ]
    return (
       <div className='medical-dashboard-main-container'>
            <div className='medical-dashboard-container-div'>
                <div className='medical-dashboard-header-div'>
                    <div className='medical-dashboard-title-div'>
                       Procedures
                    </div>
                      <div className='bt-right'>
                            <Text onClick={() => setOpen(true)} className="clickable-link">Full view</Text>
                        </div>
                </div>
                <Divider className="divider-line" />
                <div className='medical-dashboard-table-div'>
                    <MyTable
                        data={procedures?.object||[]}
                        columns={columns}
                        height={250}
                       
                    />
                </div>
            </div>
            <FullViewTable open={open} setOpen={setOpen} procedures={procedures?.object}/>
        </div>
    );
}
export default Procedures;