import './polyfill';
import './index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';

// 引入你的主程式元件
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
    throw new Error("找不到 root 節點，請確認 HTML 中是否有 <div id='root'></div>");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);