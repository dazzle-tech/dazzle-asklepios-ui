import MyModal from "@/components/MyModal/MyModal";
import MyTable from "@/components/MyTable";
import Translate from "@/components/Translate";
import { useGetLabResultLogListQuery } from "@/services/labService";
import { initialListRequest } from "@/types/types";
import React,{useState,useEffect} from "react";
const LogResult = ({open,setOpen,result}) => {
      const [listLogRequest, setListLogRequest] = useState({
        ...initialListRequest,
        filters: [
          {
    
            fieldName: "result_key",
            operator: "match",
            value: result?.key ?? undefined,
    
          }
        ]
    
      })
     const { data: resultLogList, refetch: fetchLogs, isFetching: fetchLog } = useGetLabResultLogListQuery({ ...listLogRequest });
      useEffect(() => {
     
         const updatedFilter = [
           {
     
             fieldName: "result_key",
             operator: "match",
             value: result?.key ?? undefined,
     
           }
         ];
         setListLogRequest((prevRequest) => ({
           ...prevRequest,
           filters: updatedFilter,
         }));
         fetchLogs();
       }, [result]);
    const tablesModal =[
        {
            key: "resultValue",
            dataKey: "resultValue",
            title:<Translate>RESULT </Translate>,
            fullText: true,
            flexGrow: 1,
            render: (rowData) =>{
                return rowData?.resultValue
            },
        },
        {
            key: "createdAt",
            dataKey: "createdAt",
            title:<Translate>Time</Translate>,
            fullText: true,
            flexGrow: 2,
            render: (rowData) => rowData.createdAt ? new Date(rowData.createdAt).toLocaleString() : "",
        },
        {
            key: "createdBy",
            dataKey: "createdBy",
            title:<Translate>log </Translate>,
            fullText: true,
            flexGrow: 1,
            
        }
    ]
    return(<>
    <MyModal
    open={open}
    setOpen={setOpen}
    title="Log Result"
    size="md"
    position="right"
    content={
    <MyTable
    height={300}
     columns={tablesModal}
     data={resultLogList?.object ?? []}
     loading={fetchLog}
    ></MyTable>}

></MyModal>
    </>);
};
export default LogResult;