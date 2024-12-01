import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import { HomePage } from './pages/Homepage';
import { ScaraSimulation2d } from './containers/ScaraSimulation2d';
import NewScaraSimulation2d from './containers/NewScaraSimulation2d';

export default function App() {
  return (
    <div data-theme="light">
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/simulation2d" element={<ScaraSimulation2d />} />
          <Route path="/newSimulation2d" element={<NewScaraSimulation2d />} />
        </Routes>
      </Router>
    </div>
  );
}
