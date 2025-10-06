import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { MemoProvider } from './contexts/MemoContext';
import HomePage from './pages/HomePage';
import MemoListPage from './pages/MemoListPage';
import MemoDetailPage from './pages/MemoDetailPage';
import CollectionsPage from './pages/CollectionsPage';
import CollectionDetailPage from './pages/CollectionDetailPage';

function App() {
  return (
    <MemoProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/memos" element={<MemoListPage />} />
          <Route path="/memo/:id" element={<MemoDetailPage />} />
          <Route path="/collections" element={<CollectionsPage />} />
          <Route path="/collections/:id" element={<CollectionDetailPage />} />
        </Routes>
      </Router>
    </MemoProvider>
  );
}

export default App;
