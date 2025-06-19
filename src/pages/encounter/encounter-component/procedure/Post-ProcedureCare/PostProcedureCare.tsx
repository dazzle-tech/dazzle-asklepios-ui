import MyButton from "@/components/MyButton/MyButton";
import React from "react";
const PostProcedureCare=({procedure,setActiveTab,user})=>{
    const handleClear=()=>{
        
     }
    return(<>
     <div className='bt-div'>
                
                <div className="bt-right">
                    
                     <MyButton onClick={() => setActiveTab("5")}>Complate and Next</MyButton>
                </div>
            </div></>)
}
export default PostProcedureCare;