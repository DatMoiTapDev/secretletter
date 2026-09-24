import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles/index.css';
import { setupGitHubPagesMock } from './api/mockAdapter';

// Kích hoạt bộ chuyển hướng LocalStorage an toàn khi chạy trên GitHub Pages tĩnh
setupGitHubPagesMock();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
