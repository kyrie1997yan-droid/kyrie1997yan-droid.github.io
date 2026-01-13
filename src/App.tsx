import { Routes, Route, Navigate } from "react-router-dom";
import Home from "@/pages/Home";
import TopicsList from "@/pages/TopicsList";
import GravityPage from "@/pages/GravityPage";
import MechanicsPage from "@/pages/MechanicsPage";
import WaveMechanicsPage from "@/pages/WaveMechanicsPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      {/* 将topics路由重定向到首页，因为我们已经将目录整合到首页 */}
      <Route path="/topics" element={<Navigate to="/" replace />} />
       <Route path="/gravity" element={<GravityPage />} />
      <Route path="/mechanics" element={<MechanicsPage />} />
      <Route path="/wave-mechanics" element={<WaveMechanicsPage />} />
    </Routes>
  );
}
