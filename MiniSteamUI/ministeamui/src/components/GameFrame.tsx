export interface GameFrameProps {
  children: React.ReactNode;
  /** Shows a spinner over the frame until the embedded game reports it has loaded. */
  isLoading?: boolean;
}

export function GameFrame({ children, isLoading = false }: GameFrameProps) {
  return (
    <div className="h-full flex items-center justify-center p-2 sm:p-4 relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-50">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[#ff4b5c]"></div>
        </div>
      )}

      <div
        className={`w-full max-w-5xl bg-white rounded-lg border border-[#ff4b5c] shadow-[0_15px_50px_rgba(0,0,0,0.3)] overflow-hidden ${
          isLoading ? "pointer-events-none opacity-50" : ""
        }`}
      >
        {children}
      </div>
    </div>
  );
}
