import { BrowserRouter, Routes, Route, Link  } from "react-router-dom";
import GamesList from "./pages/GamesList";
import GameDetails from "./pages/GameDetails";

function App() {
  return (
    <BrowserRouter>
      {/* Header */}
      <header className="bg-[#E60012] text-white p-4 shadow-md flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          Mini Steam
        </h1>
        <nav>
          <Link to="/" className="hover:text-yellow-400 transition">
            Home
          </Link>
        </nav>
      </header>

      {/* Main content */}
      <main className="min-h-screen">
        <Routes>
          <Route path="/" element={<GamesList />} />
          <Route path="/games/:id" element={<GameDetails />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;
