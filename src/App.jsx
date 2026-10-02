/* ===================================================================
   SmartFactory AI — Main App
   Routes, Layout Shell, Page Transitions
   =================================================================== */

import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';

import FactoryOverview from './pages/FactoryOverview';
import DigitalTwin from './pages/DigitalTwin';
import Predictions from './pages/Predictions';
import WorkOrders from './pages/WorkOrders';
import Reliability from './pages/Reliability';
import Lifecycle from './pages/Lifecycle';
import { IndustrialGateway } from './pages/IndustrialGateway';

import './styles/components.css';
import './styles/layout.css';
import './styles/pages.css';

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -8 },
};

const pageTransition = {
  type: 'tween',
  ease: 'easeOut',
  duration: 0.3,
};

function AnimatedPage({ children }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={pageTransition}
    >
      {children}
    </motion.div>
  );
}

export default function App() {
  const location = useLocation();

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-shell__content">
        <Topbar />
        <main className="app-shell__main">
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<AnimatedPage><FactoryOverview /></AnimatedPage>} />
              <Route path="/digital-twin" element={<AnimatedPage><DigitalTwin /></AnimatedPage>} />
              <Route path="/digital-twin/:machineId" element={<AnimatedPage><DigitalTwin /></AnimatedPage>} />
              <Route path="/predictions" element={<AnimatedPage><Predictions /></AnimatedPage>} />
              <Route path="/work-orders" element={<AnimatedPage><WorkOrders /></AnimatedPage>} />
              <Route path="/reliability" element={<AnimatedPage><Reliability /></AnimatedPage>} />
              <Route path="/lifecycle" element={<AnimatedPage><Lifecycle /></AnimatedPage>} />
              <Route path="/lifecycle/:machineId" element={<AnimatedPage><Lifecycle /></AnimatedPage>} />
              <Route path="/gateway" element={<AnimatedPage><IndustrialGateway /></AnimatedPage>} />
            </Routes>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
