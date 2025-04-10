import React from "react";
import { Button } from "rsuite";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { Icon } from '@rsuite/icons';
import './styles.less';
type Appearance = "primary" | "default" | "link" | "subtle" | "ghost";
const MyButton = ({ 
    prefixIcon: Prefix=null,
     postfixIcon: Postfix = null
    , children:children=null
    ,onClick=()=>{}, 
    width = "auto",
    appearance = "primary"  as Appearance,
    size='medium',
    disabled=false,

    ...props 
}) => {


    return (
        <Button
        className={`bt ${size}`} 
        appearance={appearance} 
         disabled={props.disabled}


            style={{
                color: appearance === "ghost" ||appearance === "link" ||appearance === "subtle"
                ? props.color ?? "var(--primary-blue)"
                : 'white',
                width: props.width,
              
                borderRadius:props.radius,
                backgroundColor: appearance === "ghost"||appearance === "link" ||appearance === "subtle"
                ? 'white'
                : props.backgroundColor ?? "var(--primary-blue)",
                border: appearance === "ghost"
                ? `2px solid ${props.color ??  "var(--primary-blue)"}`
                : 'none',
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