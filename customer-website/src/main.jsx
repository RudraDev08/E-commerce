import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

// Trigger rebuild
ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
