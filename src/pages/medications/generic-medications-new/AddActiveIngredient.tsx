import MyModal from "@/components/MyModal/MyModal";
import React from "react";

const AddActiveIngredient=({ 
    open,setOpen,
    brandMedication
})=>{
    return(<>
    <MyModal
    title={"Add Active Ingredient "}
    open={open}
    setOpen={setOpen}
    content={<></>}
    size="70vh"

     />
    </>);
}

export default AddActiveIngredient ;