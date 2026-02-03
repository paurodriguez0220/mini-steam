import React, { useState } from "react";
import { HiMenu } from "react-icons/hi"; // Optional: install react-icons

const Sidebar: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile Hamburger */}
      <div className="md:hidden flex items-center p-2 bg-white dark:bg-gray-800 border-b dark:border-gray-700">
        <button onClick={() => setOpen(!open)} className="text-gray-900 dark:text-white">
          <HiMenu size={24} />
        </button>
        <div className="ml-2 font-bold text-lg text-gray-900 dark:text-white">wyre</div>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed md:static top-0 left-0 z-20 h-full bg-gray-50 dark:bg-gray-800 border-r dark:border-gray-700 px-3 lg:px-4 py-6 flex-col transform ${
          open ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 md:translate-x-0 md:flex w-64`}
      >
        <div className="text-xl font-bold mb-8 text-gray-900 dark:text-white">wyre</div>

        <nav className="space-y-2">
          {/* Sidebar items */}
        </nav>

        <div className="mt-8 text-gray-700 dark:text-gray-300 font-semibold text-xs">
          INSTALLED GAMES
        </div>

        <div className="mt-auto text-sm text-gray-400 dark:text-gray-500">Downloads</div>
      </aside>

      {/* Overlay when open on mobile */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
        />
      )}
    </>
  );
};

export default Sidebar;
