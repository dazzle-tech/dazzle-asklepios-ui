import MyButton from "@/components/MyButton/MyButton";
import React from "react";
const EquipmentAndLogistics=({procedure,setActiveTab,user})=>{
    const handleClear=()=>{
        
     }
    return(<>
      <div className='bt-div'>
                
                <div className="bt-right">
                   
                     <MyButton onClick={() => setActiveTab("1")}>Complate and Next</MyButton>
                </div>
            </div>
    </>)
}
export default EquipmentAndLogistics;