import React from "react";

function App() {
  return (
    <div className="app">
      <header className="header">
        <div className="logo">
          ADUSTECH <span>Connect</span>
        </div>

        <div className="header-text">
          Student Social & Academic Network
        </div>
      </header>

      <main className="welcome">
        <div className="welcome-card">
          <div className="school-logo-placeholder">
            A
          </div>

          <h1>Welcome to ADUSTECH Connect</h1>

          <p>
            Connect with students, join departmental groups,
            discuss courses, share assignments and build your
            academic community.
          </p>

          <div className="features">
            <div>
              <strong>🎓 Academic</strong>
              <span>Courses & assignments</span>
            </div>

            <div>
              <strong>👥 Community</strong>
              <span>Students & groups</span>
            </div>

            <div>
              <strong>💬 Messenger</strong>
              <span>Private & group chat</span>
            </div>
          </div>

          <button className="start-button">
            Get Started
          </button>
        </div>
      </main>
    </div>
  );
}

export default App;
