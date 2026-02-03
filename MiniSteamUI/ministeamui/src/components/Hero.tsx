import React from "react";

const Hero: React.FC = () => {
  return (
    <div className="relative h-48 sm:h-60 lg:h-72 rounded-2xl overflow-hidden">
    <img
        src="https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7"
        className="absolute inset-0 w-full h-full object-cover opacity-70"
    />
    <div className="relative z-10 p-4 sm:p-8 max-w-lg text-gray-900 dark:text-white">
        <p className="text-sm opacity-80">New Gen Released</p>
        <h1 className="text-2xl sm:text-3xl font-bold mt-2">The Witcher 3: Wild Hunt</h1>
        <p className="text-sm mt-2 sm:mt-3 opacity-90">
        Explore a massive open world filled with monsters and choices.
        </p>

        <div className="mt-4 sm:mt-6 flex items-center gap-4">
        <button className="bg-blue-500 px-4 sm:px-5 py-2 rounded-lg text-sm font-semibold">
            Buy Now
        </button>
        <span className="text-sm opacity-80">Starting at $39.99</span>
        </div>
    </div>
    </div>
  );
};

export default Hero;
