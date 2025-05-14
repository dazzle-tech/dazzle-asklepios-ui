import React from "react";
import { Badge } from "rsuite";
const MyBadgeStatus = ({
    backgroundColor = "#ffffff",
    color=null,
    contant
}) => {
    //use to get dark color from background color to use it in text color
    function darkenColor(hex, percent = 20) {
        let num = parseInt(hex.replace("#", ""), 16),
            amt = Math.round(2.55 * percent),
            R = (num >> 16) - amt,
            G = ((num >> 8) & 0x00FF) - amt,
            B = (num & 0x0000FF) - amt;

      
        R = Math.max(R, 0);
        G = Math.max(G, 0);
        B = Math.max(B, 0);

       
        return "#" + (
            (1 << 24) + (R << 16) + (G << 8) + B
        ).toString(16).slice(1);
    }
    return (<>
        <Badge content={contant}
            style={{
                backgroundColor: backgroundColor,
                color:color?color: darkenColor(backgroundColor, 40),
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