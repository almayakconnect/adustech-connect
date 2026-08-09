const rootElement = document.getElementById("root");

rootElement.innerHTML = `
  <div style="
    padding:30px;
    font-family:Arial,sans-serif;
    text-align:center;
  ">
    <h2>Starting ADUSTECH Connect...</h2>
  </div>
`;

try {
  const React = await import("react");
  const ReactDOM = await import("react-dom/client");
  const AppModule = await import("./App.jsx");

  const App = AppModule.default;

  const root = ReactDOM.createRoot(rootElement);

  root.render(
    React.createElement(App)
  );

} catch (error) {
  rootElement.innerHTML = `
    <div style="
      padding:30px;
      font-family:Arial,sans-serif;
      color:#b00020;
      background:#fff;
    ">
      <h2>React startup error</h2>
      <pre style="
        white-space:pre-wrap;
        text-align:left;
        overflow-wrap:break-word;
      ">${String(error?.stack || error)}</pre>
    </div>
  `;
        }
