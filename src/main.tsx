import React from "react";
import ReactDOM from "react-dom/client";
import AuthProvider from "./components/auth/context/AuthProvider.tsx";
import TaskModalProvider from "./components/task/context/TaskModalProvider";
import "./index.css";
import App from "./App.tsx";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <TaskModalProvider>
        <App />
      </TaskModalProvider>
    </AuthProvider>
  </React.StrictMode>,
);

// Use contextBridge
window.ipcRenderer.on("main-process-message", (_event, message) => {
  console.log(message);
});
