"use client";

export default function Toast(props: { message: string; show: boolean }) {
  const message = props.message;
  const show = props.show;
  return (
    <div
      className={
        "fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] transition-all duration-300 " +
        (show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none")
      }
    >
      <div className="bg-forest text-cream font-mono text-xs uppercase tracking-widest px-5 py-3 rounded-full shadow-lg flex items-center gap-2 whitespace-nowrap">
        <span className="text-ochre">&#10003;</span>
        <span>{message}</span>
      </div>
    </div>
  );
}
