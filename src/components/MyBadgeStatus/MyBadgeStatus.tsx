import React from "react";
import { Badge } from "rsuite";
const MyBadgeStatus = ({
    backgroundColor =null,
    color="#000000",
    contant
}) => {
    function hexToRGBA(hex, opacity = 0.2) {
    hex = hex.replace("#", "");
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);

    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

    return (<>
        <Badge content={contant}
            style={{
                backgroundColor:backgroundColor?backgroundColor:hexToRGBA(color,0.2),
                color:color,
                height: "25px",
                borderRadius: "10px",
                fontFamily: "Inter Regular",
                fontSize: "12px",
                display: "flex",
                alignItems: "center",      
                justifyContent: "center",  
                padding: "0 10px"
            }} />

    </>)
}
export default MyBadgeStatus