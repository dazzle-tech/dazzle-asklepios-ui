import React from "react";
import { Button } from "rsuite";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { Icon } from '@rsuite/icons';
import './styles.less';
const MyButton = ({ prefixIcon: Prefix, postfixIcon: Postfix, children,onClick, ...props }) => {
    return (
        <Button
        className="bt"
            appearance={props.ghost ? "ghost" : "primary"}
            style={{
                color: props.ghost ? props.color ?? "var(--primary-blue)" : 'white',
                width: props.width,
                backgroundColor: props.ghost ? 'white' : props.color ?? "var(--primary-blue)",
                border: props.ghost ? `2px solid ${props.color ?? "var(--primary-blue)"}` : 'none', // إضافة border عند الـ ghost
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