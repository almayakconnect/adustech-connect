import { useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [showRegister, setShowRegister] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const registerStudent = async (e) => {
    e.preventDefault();

    if (!form.fullName || !form.email || !form.password) {
      alert("Please fill in all fields.");
      return;
    }

    if (form.password.length < 6) {
      alert("Password must contain at least 6 characters.");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          id: data.user.id,
          full_name: form.fullName,
          email: form.email,
        });

      if (profileError) {
        alert(profileError.message);
      } else {
        alert(
          "Account created successfully. Check your email if verification is required."
        );

        setShowRegister(false);

        setForm({
          fullName: "",
          email: "",
          password: "",
        });
      }
    }

    setLoading(false);
  };

  if (showRegister) {
    return (
      <div className="page">
        <div className="auth-card">
          <button
            className="back-button"
            onClick={() => setShowRegister(false)}
          >
            ← Back
          </button>

          <div className="logo-circle">🎓</div>

          <h1>Create your ADUSTECH Connect account</h1>

          <p>
            Join students, departments, courses and academic communities.
          </p>

          <form onSubmit={registerStudent}>
            <input
              type="text"
              name="fullName"
              placeholder="Full name"
              value={form.fullName}
              onChange={handleChange}
            />

            <input
              type="email"
              name="email"
              placeholder="Student email"
              value={form.email}
              onChange={handleChange}
            />

            <input
              type="password"
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
            />

            <button type="submit" disabled={loading}>
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <small>
            By creating an account, you agree to use ADUSTECH Connect
            responsibly.
          </small>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <main className="hero">
        <div className="logo-circle">🎓</div>

        <h1>Welcome to ADUSTECH Connect</h1>

        <p>
          Connect with students, join departmental groups, discuss courses,
          share assignments and build your academic community.
        </p>

        <div className="features">
          <div className="feature">
            <span>🎓</span>
            <strong>Academic</strong>
            <small>Courses & assignments</small>
          </div>

          <div className="feature">
            <span>👥</span>
            <strong>Community</strong>
            <small>Students & groups</small>
          </div>

          <div className="feature">
            <span>💬</span>
            <strong>Messenger</strong>
            <small>Private & group chat</small>
          </div>
        </div>

        <button
          className="get-started"
          onClick={() => setShowRegister(true)}
        >
          Get Started
        </button>
      </main>
    </div>
  );
              }
