import { useState } from "react";

export default function App() {
  const [showRegister, setShowRegister] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  if (showRegister) {
    return (
      <div className="page">
        <div className="auth-card">
          <button className="back" onClick={() => setShowRegister(false)}>
            ← Back
          </button>

          <div className="brand">
            <div className="logo">A</div>
            <h1>ADUSTECH Connect</h1>
          </div>

          <h2>Create your account</h2>
          <p>Join the academic community of students.</p>

          <input placeholder="Full name" />
          <input type="email" placeholder="Student email" />
          <input type="password" placeholder="Password" />

          <button className="primary">
            Create Account
          </button>

          <p className="switch">
            Already have an account?{" "}
            <button onClick={() => {
              setShowRegister(false);
              setShowLogin(true);
            }}>
              Log in
            </button>
          </p>
        </div>
      </div>
    );
  }

  if (showLogin) {
    return (
      <div className="page">
        <div className="auth-card">
          <button className="back" onClick={() => setShowLogin(false)}>
            ← Back
          </button>

          <div className="brand">
            <div className="logo">A</div>
            <h1>ADUSTECH Connect</h1>
          </div>

          <h2>Welcome back</h2>
          <p>Log in to continue to your student community.</p>

          <input type="email" placeholder="Student email" />
          <input type="password" placeholder="Password" />

          <button className="primary">
            Log In
          </button>

          <p className="switch">
            Don't have an account?{" "}
            <button onClick={() => {
              setShowLogin(false);
              setShowRegister(true);
            }}>
              Create one
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">

      <header className="navbar">
        <div className="brand">
          <div className="logo">A</div>
          <span>ADUSTECH Connect</span>
        </div>

        <div className="nav-actions">
          <button onClick={() => setShowLogin(true)}>
            Log In
          </button>

          <button
            className="primary small"
            onClick={() => setShowRegister(true)}
          >
            Sign Up
          </button>
        </div>
      </header>

      <main className="hero">

        <div className="hero-content">

          <div className="badge">
            🎓 Built for students
          </div>

          <h1>
            Your university.
            <br />
            <span>Your community.</span>
          </h1>

          <p>
            ADUSTECH Connect brings students together to connect,
            communicate, study, share knowledge and build their
            academic community.
          </p>

          <div className="hero-buttons">
            <button
              className="primary large"
              onClick={() => setShowRegister(true)}
            >
              Get Started →
            </button>

            <button
              className="secondary large"
              onClick={() => setShowLogin(true)}
            >
              Log In
            </button>
          </div>

          <div className="features">

            <Feature
              icon="🎓"
              title="Academic"
              text="Courses, programmes and academic resources."
            />

            <Feature
              icon="👥"
              title="Communities"
              text="Join faculty, department and course groups."
            />

            <Feature
              icon="💬"
              title="Messenger"
              text="Chat privately or communicate in groups."
            />

            <Feature
              icon="📝"
              title="Assignments"
              text="Discuss assignments and share academic materials."
            />

          </div>
        </div>

      </main>

      <footer>
        <strong>ADUSTECH Connect</strong>
        <span>Student academic community platform</span>
      </footer>

    </div>
  );
}

function Feature({ icon, title, text }) {
  return (
    <div className="feature">
      <div className="feature-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
        }
