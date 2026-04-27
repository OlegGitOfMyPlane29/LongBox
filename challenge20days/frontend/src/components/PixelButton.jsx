export default function PixelButton({ children, className = "", variant = "primary", ...props }) {
  const base =
    "inline-flex items-center justify-center border-4 border-slate-900 px-4 py-3 font-pixel text-[10px] uppercase leading-relaxed shadow-pixel transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-60 sm:text-[11px]";
  const variants = {
    primary: "bg-lime-400 hover:bg-lime-300",
    danger: "bg-rose-300 hover:bg-rose-200",
    neutral: "bg-amber-100 hover:bg-amber-50",
  };
  return (
    <button
      {...props}
      type={props.type || "button"}
      className={`${base} ${variants[variant] || variants.primary} ${className}`}
    >
      {children}
    </button>
  );
}
