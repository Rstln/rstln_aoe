import React from 'react';
import { createRoot } from 'react-dom/client';
import Graph from './App';
const container = document.getElementById('root');
const root = createRoot(container);
root.render( /*#__PURE__*/React.createElement(Graph, {
  aoe_path: "./json_files/aoe_heater_controller",
  aoe_result_path: "./json_files/aoe_result1"
})); // If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals