import { useState } from "react";
export default function App() {
  const [showRegister, setShowRegister] = useState(false);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "30px",
      fontFamily: "Arial, sans-serif",
      background: "#f0f2f5"
    }}>
      <div style={{
        maxWidth: "600px",
        width: "100%",
        textAlign: "center",
        background: "white",
        padding: "40px",
        borderRadius: "20px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.1)"
      }}>
        <div style={{ fontSize: "50px" }}>🎓</div>

        <h1>Welcome to ADUSTECH Connect</h1>

        <p>
          Connect with students, join departmental groups,
          discuss courses, share assignments and build your
          academic community.
        </p>

        {!showRegister ? (
          <>
            <div style={{
              display: "grid",
              gap: "15px",
              margin: "30px 0"
            }}>
              <div>🎓 <strong>Academic</strong><br />
                Courses & assignments
              </div>

              <div>👥 <strong>Community</strong><br />
                Students & groups
              </div>

              <div>💬 <strong>Messenger</strong><br />
                Private & group chat
              </div>
            </div>

            <button
              onClick={() => setShowRegister(true)}
              style={{
                padding: "15px 30px",
                border: "none",
                borderRadius: "10px",
                cursor: "pointer",
                fontSize: "16px"
              }}
            >
              Get Started
            </button>
          </>
        ) : (
          <div>
            <h2>Create Account</h2>

            <input
              placeholder="Full name"
              style={inputStyle}
            />

            <input
              placeholder="Student email"
              type="email"
              style={inputStyle}
            />

            <input
              placeholder="Password"
              type="password"
              style={inputStyle}
            />

            <button style={buttonStyle}>
              Create Account
            </button>

            <br />

            <button
              onClick={() => setShowRegister(false)}
              style={{
                marginTop: "15px",
                border: "none",
                background: "transparent",
                cursor: "pointer"
              }}
            >
              ← Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const inputStyle = {
  display: "block",
  width: "100%",
  boxSizing: "border-box",
  padding: "14px",
  margin: "10px 0",
  border: "1px solid #ddd",
  borderRadius: "8px",
  fontSize: "16px"
};

const buttonStyle = {
  width: "100%",
  padding: "14px",
  marginTop: "10px",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontSize: "16px"
};
