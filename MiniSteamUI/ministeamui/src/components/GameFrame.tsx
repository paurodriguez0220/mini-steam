import React, { isValidElement, useState, useEffect } from "react";
import type { ReactElement } from "react";

type Props = {
  children: React.ReactNode;
};

export function GameFrame({ children }: Props) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-2 sm:p-4 relative">
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
        {React.Children.map(children, (child) => {
          if (isValidElement(child)) {
            const type = child.type;
            if (typeof type === "function" && type.name === "GameIframe") {
              return React.cloneElement(child as ReactElement<any>, {
                onLoad: () => setIsLoading(false),
              });
            }
          }
          return child;
        })}
      </div>
    </div>
  );
}
