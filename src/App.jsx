import { BrowserRouter, Routes, Route } from "react-router-dom";
import SimpleAside from "./components/aside/SimpleAside";
import CountryPage from "./page/CountryPage";
import StatePage from "./page/StatePage";
import CityPage from "./page/CityPage";
import PincodeTable from "./components/tables/PincodeTable";

function App() {
  return (
    <BrowserRouter>
      <div style={{ display: "flex" }}>
        <SimpleAside />

        <div style={{ flex: 1, padding: "20px" }}>
          <Routes>
            <Route path="/country" element={<CountryPage />} />
            <Route path="/state" element={<StatePage />} />
            <Route path="/city" element={<CityPage />} />
            <Route path="/pincode" element={<PincodeTable />} />
            <Route path="/" element={<h2>Welcome Admin</h2>} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
