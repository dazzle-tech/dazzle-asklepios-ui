import React, { useState } from "react";
import FullViewTable from "./FullViewTable";
import MyTable from "@/components/MyTable";
import { Divider, Text } from "rsuite";
import { initialListRequest, ListRequest } from "@/types/types";
import { useGetObservationSummariesQuery } from "@/services/observationService";
import Translate from "@/components/Translate";
const PreObservation=({patient})=>{
    const [open, setOpen] = useState(false);
    const [listRequest,setListRequest]=useState<ListRequest>({
        ...initialListRequest,
        filters:[
         {
                fieldName: "patient_key",
                operator: "match",
                value: patient?.key
            },
        ]
    })
 const { data: getObservationSummaries } = useGetObservationSummariesQuery({
    ...listRequest,
  });

  const columns=[
    {
        key:"visitKey",
        title:<Translate>Visit Date</Translate>,
        render:(rowData:any)=>{
            return rowData?.encounter?.plannedStartDate
        }
    },

    {
        key:"latestheight",
        title:<Translate>Height</Translate>,
        render:(rowData:any)=>{
            return rowData?.latestheight
        }
    },
     {
        key:"latestweight",
        title:<Translate>Weight</Translate>,
        render:(rowData:any)=>{
            return rowData?.latestweight
        }
    },
       {
        key:"latestbpSystolic",
        title:<Translate>BP</Translate>,
        render:(rowData:any)=>{
            return rowData?.latestbpSystolic
        }
    },
    {
        key:"latesttemperature",
        title:<Translate>Temp</Translate>,
        render:(rowData:any)=>{
            return rowData?.latesttemperature
        }
    }
    

  ]
    return(<>
      <div className='medical-dashboard-main-container'>
                <div className='medical-dashboard-container-div'>
                    <div className='medical-dashboard-header-div'>
                        <div className='medical-dashboard-title-div'>
                            Patient Observation 
                        </div>
                        <div className='bt-right'>
                            <Text onClick={() => setOpen(true)} className="clickable-link">Full view</Text>
                        </div>
                    </div>
                    <Divider className="divider-line" />
                    <div className='medical-dashboard-table-div'>
                        <MyTable
                            data={getObservationSummaries?.object ?? []}
                            columns={columns}
                            height={250}
                            onRowClick={(rowData) => {
                            }}
                        />
                    </div>
                </div>
                <FullViewTable open={open} setOpen={setOpen} list={getObservationSummaries?.object}/>
            </div></>)
}
export default PreObservation;