import React, { type InputHTMLAttributes } from "react";
import './style.css';

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
    return <input className='input' { ...props } />;
}

