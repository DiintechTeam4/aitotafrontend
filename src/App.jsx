import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/index";
import "./App.css";

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
