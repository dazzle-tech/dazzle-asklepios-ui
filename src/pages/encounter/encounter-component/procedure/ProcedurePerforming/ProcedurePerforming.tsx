import MyButton from "@/components/MyButton/MyButton";
import React from "react";
const ProcedurePerforming=({procedure,setActiveTab,user})=>{
    return(<>
      <div className='bt-div'>
                
                <div className="bt-right">
                  
                     <MyButton onClick={() => setActiveTab("4")}>Complate and Next</MyButton>
                </div>
            </div>
    </>)
}
export default ProcedurePerforming;