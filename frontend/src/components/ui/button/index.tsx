import React, { type ButtonHTMLAttributes, ReactNode } from "react";
import './style.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "warning";
  children?: ReactNode;
}

export function Button({variant='primary', children, ...props}: ButtonProps) {
    const buttonClass = `button button__${variant}`
    return <button className={buttonClass} { ...props }>{children}</button>;
}

