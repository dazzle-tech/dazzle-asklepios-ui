import MyModal from "@/components/MyModal/MyModal";
import MyTable from "@/components/MyTable";
import Translate from "@/components/Translate";
import React,{useState} from "react";
const FullViewTable =({open ,setOpen,list})=>{
     const columns=[
        {
            key:"platestbpSystolic",
            title:<Translate>mmgh</Translate>,
            render:(rowData:any)=>{
                return rowData?.platestbpSystolic
            }
        },
         {
            key:"latestheartrate",
            title:<Translate>Pulse</Translate>,
            render:(rowData:any)=>{
                return rowData?.latestheartrate
            }
        },
           {
            key:"latestrespiratoryrate",
            title:<Translate>R.R</Translate>,
            render:(rowData:any)=>{
                return rowData?.latestrespiratoryrate
            }
        },
        {
            key:"latestoxygensaturation",
            title:<Translate>SpO2</Translate>,
            render:(rowData:any)=>{
                return rowData?.latestoxygensaturation
            }
        }
        ,
        {
            key:"latestnotes",
            title:<Translate>Note</Translate>,
            render:(rowData:any)=>{
                return rowData?.latestnotes
            }
        },
        {
            key:"latestheadcircumference",
            title:<Translate>Head circumference</Translate>,
            render:(rowData:any)=>{
                return rowData?.latestheadcircumference
            }
        }
        ,
        {
            key:"latestpainlevelLkey",
            title:<Translate>Pain Degree</Translate>,
            render:(rowData:any)=>{
                return rowData?.latestpainlevelLvalue?.lovDisplayVale
            }
        },
        {
            key:"latestpaindescription",
            title:<Translate>Pain Description</Translate>,
            render:(rowData:any)=>{
                return rowData?.latestpaindescription
            }
        }
        
    
      ]
    return(
    <MyModal
    open={open}
    setOpen={setOpen}
    size="60vw"
    hideBack
    hideActionBtn
    title="Observation"
    content={<>
    <MyTable
    data={list??[]  }
    columns={columns}
    height={300}
    /></>}
    />)
}
export default FullViewTable