import { Link } from "@remix-run/react";
import { type ButtonHTMLAttributes, type ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "outline" | "blue";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  asLink?: boolean;
  to?: string;
  href?: string;
  outlineColor?: string;
}

export default function Button({
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  asLink = false,
  to,
  href,
  outlineColor,
  className = "",
  ...props
}: ButtonProps) {
  const baseClasses =
    "font-medium rounded-full transition-all duration-300 inline-flex items-center justify-center gap-2";

  const sizeClasses = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-sm",
    lg: "px-8 py-4 text-base",
  };

  const variantClasses = {
    primary:
      "bg-gradient-primary text-black hover:shadow-glow-green hover:scale-105",
    secondary:
      "bg-transparent border border-gray-600 text-white hover:border-pricing-green/50 hover:bg-pricing-green/10",
    outline:
      "bg-transparent border-1 border-gray-500 text-white hover:bg-gray-500/10",
    blue: "bg-primary text-white hover:bg-primary/90 hover:scale-105 hover:shadow-lg",
  };

  const widthClass = fullWidth ? "w-full" : "";

  // Apply custom outline color if provided and variant is outline
  let finalClassName = `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${widthClass} ${className}`;
  const customStyle =
    variant === "outline" && outlineColor
      ? { borderColor: outlineColor }
      : undefined;

  // If it's a Link component
  if (asLink && to) {
    return (
      <Link to={to} className={finalClassName} style={customStyle}>
        {children}
      </Link>
    );
  }

  // If it's an anchor tag
  if (href) {
    return (
      <a href={href} className={finalClassName} style={customStyle}>
        {children}
      </a>
    );
  }

  // Default button
  return (
    <button className={finalClassName} style={customStyle} {...props}>
      {children}
    </button>
  );
}
