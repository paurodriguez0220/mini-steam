import { BrowserRouter, Routes, Route } from "react-router-dom";
import GamesList from "./pages/GamesList";
import GameDetails from "./pages/GameDetails";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<GamesList />} />
        <Route path="/games/:id" element={<GameDetails />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
