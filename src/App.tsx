
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from '@/components/Layout';

// Импортируем страницы
import Home from '@/pages/Home';
import Supplies from '@/pages/Supplies';
import AutoAssembly from '@/pages/AutoAssembly';
import Settings from '@/pages/Settings';
import NotFound from '@/pages/NotFound';
import TrbxManager from '@/pages/TrbxManager';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="supplies" element={<Supplies />} />
          <Route path="auto-assembly" element={<AutoAssembly />} />
          <Route path="trbx/:supplyId" element={<TrbxManager />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
