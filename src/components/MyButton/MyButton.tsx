import React from "react";
import { Button } from "rsuite";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { Icon } from '@rsuite/icons';
import './styles.less';
const MyButton = ({ prefixIcon: Prefix=null, postfixIcon: Postfix = null, children,onClick=()=>{}, width = "auto",...props }) => {
    return (
        <Button
        className="bt"
            appearance={props.ghost ? "ghost" : "primary"}
            disabled={props.disabled}
            style={{
                color: props.ghost ? props.color ?? "var(--primary-blue)" : 'white',
                width: props.width,
                height:props.height,
                borderRadius:props.radius,
                backgroundColor: props.ghost ? 'white' : props.color ?? "var(--primary-blue)",
                border: props.ghost ? `2px solid ${props.color ?? "var(--primary-blue)"}` : 'none', 
                transition: "all 0.3s ease",
            }}
            {...props}
            onClick={onClick}
        >

            {Prefix && <Prefix style={{ marginRight: "8px" }} />}

            {children}


            {Postfix && <Postfix style={{ marginLeft: "8px" }} />}
        </Button>
    );
};

export default MyButton;