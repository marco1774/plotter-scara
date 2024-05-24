import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import { HomePage } from './pages/Homepage';
import { ScaraSimulation2d } from './containers/ScaraSimulation2d';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/simulation2d" element={<ScaraSimulation2d />} />
      </Routes>
    </Router>
  );
}
