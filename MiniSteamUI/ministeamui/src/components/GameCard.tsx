import React from "react";

interface GameCardProps {
  title: string;
  price: string;
  discount?: string;
  imageUrl?: string; // optional game image
}

const GameCard: React.FC<GameCardProps> = ({ title, price, discount, imageUrl }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition flex flex-col overflow-hidden text-gray-900 dark:text-white">
      
      {/* Image */}
      <div className="h-32 sm:h-36 bg-gray-200 dark:bg-gray-700 overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
            No Image
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <h3 className="text-sm sm:text-base font-semibold">{title}</h3>
        <div className="flex items-center gap-2 mt-2 text-sm sm:text-base">
          <span>{price}</span>
          {discount && <span className="text-red-500 font-semibold">-{discount}</span>}
        </div>

        <button className="mt-4 bg-blue-500 hover:bg-blue-600 text-white text-sm sm:text-base font-medium py-1 sm:py-2 rounded transition">
          Buy
        </button>
      </div>
    </div>
  );
};

export default GameCard;
