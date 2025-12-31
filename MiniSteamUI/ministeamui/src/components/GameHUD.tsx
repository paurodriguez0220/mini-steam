export function GameHUD({ children }: { children?: React.ReactNode }) {
  if (!children) return null;

  return (
    <div className="px-4 py-2 bg-[#16202d] border-b border-black text-[#c7d5e0] text-sm">
      {children}
    </div>
  );
}
