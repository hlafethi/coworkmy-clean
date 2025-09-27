import React from 'react';
import ReactDOM from 'react-dom/client';
import { AdminNavigation } from './components/admin/AdminNavigation';
import './index.css';
import { initAccessibilityTesting } from './utils/accessibility';

// Simple test component to render AdminNavigation
const TestAdminNavigation = () => {
  const [activeView, setActiveView] = React.useState('overview');

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">AdminNavigation Component Test</h1>
      <div className="border rounded-lg shadow-sm">
        <AdminNavigation 
          activeView={activeView} 
          onViewChange={(view) => setActiveView(view)} 
        />
      </div>
    </div>
  );
};

// Render the test component
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <TestAdminNavigation />
  </React.StrictMode>,
);

// Initialize accessibility testing
initAccessibilityTesting();
