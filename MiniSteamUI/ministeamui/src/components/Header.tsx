import React from "react";

interface HeaderProps {
  toggleTheme: () => void;
  theme: "light" | "dark";
}

const Header: React.FC<HeaderProps> = ({ toggleTheme, theme }) => {
  return (
    <header className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 sm:px-8 py-4 bg-white dark:bg-gray-800 border-b dark:border-gray-700">
        <input
            placeholder="Search..."
            className="w-full sm:w-80 px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white text-sm outline-none"
        />

        <div className="flex gap-4 sm:ml-auto text-sm font-medium text-gray-900 dark:text-white mt-2 sm:mt-0 flex-wrap">
            <button className="px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition">Discover</button>
            <button className="px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition">Browse</button>
            <button className="px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition">Wishlist</button>
            <button
            className="ml-0 sm:ml-4 px-3 py-1 rounded bg-gray-200 dark:bg-gray-600 text-sm"
            onClick={() => theme === "light" ? toggleTheme() : toggleTheme()}
            >
            {theme === "light" ? "Dark" : "Light"}
            </button>
        </div>
    </header>
  );
};

export default Header;
