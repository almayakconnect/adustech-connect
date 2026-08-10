import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [showRegister, setShowRegister] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  return (
    <div className="app">
      {showRegister ? (
        <Register
          goBack={() => setShowRegister(false)}
          goLogin={() => {
            setShowRegister(false);
            setShowLogin(true);
          }}
        />
      ) : showLogin ? (
        <Login
          goBack={() => setShowLogin(false)}
          goRegister={() => {
            setShowLogin(false);
            setShowRegister(true);
          }}
        />
      ) : (
        <Home
          goRegister={() => setShowRegister(true)}
          goLogin={() => setShowLogin(true)}
        />
      )}
    </div>
  );
}

/* =========================
   HOME PAGE
========================= */

function Home({ goRegister, goLogin }) {
  return (
    <>
      <header className="navbar">
        <div className="brand">
          <div className="logo">A</div>
          <span>ADUSTECH Connect</span>
        </div>

        <div className="nav-actions">
          <button onClick={goLogin}>Log In</button>

          <button className="primary small" onClick={goRegister}>
            Sign Up
          </button>
        </div>
      </header>

      <main className="hero">
        <div className="hero-content">
          <div className="badge">🎓 Built for students</div>

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
            <button className="primary large" onClick={goRegister}>
              Get Started →
            </button>

            <button className="secondary large" onClick={goLogin}>
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
    </>
  );
}

/* =========================
   REGISTER
========================= */

function Register({ goBack, goLogin }) {
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [matricNumber, setMatricNumber] = useState("");
  const [password, setPassword] = useState("");

  const [institutions, setInstitutions] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [programmes, setProgrammes] = useState([]);
  const [levels, setLevels] = useState([]);

  const [institutionId, setInstitutionId] = useState("");
  const [facultyId, setFacultyId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [programmeId, setProgrammeId] = useState("");
  const [levelId, setLevelId] = useState("");

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  /* Load institutions and levels */
  useEffect(() => {
    async function loadInitialData() {
      setLoadingData(true);

      const [institutionResult, levelResult] = await Promise.all([
        supabase
          .from("institutions")
          .select("id, name, short_name")
          .eq("is_active", true)
          .order("name"),

        supabase
          .from("levels")
          .select("id, name")
          .order("name"),
      ]);

      if (institutionResult.error) {
        setError(institutionResult.error.message);
      } else {
        setInstitutions(institutionResult.data || []);
      }

      if (levelResult.error) {
        setError(levelResult.error.message);
      } else {
        setLevels(levelResult.data || []);
      }

      setLoadingData(false);
    }

    loadInitialData();
  }, []);

  /* Load faculties */
  async function handleInstitutionChange(value) {
    setInstitutionId(value);

    setFacultyId("");
    setDepartmentId("");
    setProgrammeId("");

    setFaculties([]);
    setDepartments([]);
    setProgrammes([]);

    if (!value) return;

    const { data, error } = await supabase
      .from("faculties")
      .select("id, name, abbreviation")
      .eq("institution_id", value)
      .order("name");

    if (error) {
      setError(error.message);
      return;
    }

    setFaculties(data || []);
  }

  /* Load departments */
  async function handleFacultyChange(value) {
    setFacultyId(value);

    setDepartmentId("");
    setProgrammeId("");

    setDepartments([]);
    setProgrammes([]);

    if (!value) return;

    const { data, error } = await supabase
      .from("departments")
      .select("id, name, abbreviation")
      .eq("faculty_id", value)
      .order("name");

    if (error) {
      setError(error.message);
      return;
    }

    setDepartments(data || []);
  }

  /* Load programmes */
  async function handleDepartmentChange(value) {
    setDepartmentId(value);

    setProgrammeId("");
    setProgrammes([]);

    if (!value) return;

    const { data, error } = await supabase
      .from("programmes")
      .select(
        "id, name, programme_code, degree_type, duration_years"
      )
      .eq("department_id", value)
      .order("name");

    if (error) {
      setError(error.message);
      return;
    }

    setProgrammes(data || []);
  }

  async function handleRegister(event) {
    event.preventDefault();

    setError("");
    setMessage("");

    if (
      !fullName ||
      !username ||
      !email ||
      !phone ||
      !matricNumber ||
      !password ||
      !institutionId ||
      !facultyId ||
      !departmentId ||
      !programmeId ||
      !levelId
    ) {
      setError("Please complete every field.");
      return;
    }

    if (password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          username: username.trim(),
          phone: phone.trim(),
          matric_number: matricNumber.trim(),
          institution_id: institutionId,
          faculty_id: facultyId,
          department_id: departmentId,
          programme_id: programmeId,
          level_id: levelId,
        },
      },
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setMessage(
      "Account created successfully! Check your email to confirm your account before logging in."
    );
  }

  if (message) {
    return (
      <div className="page">
        <div className="auth-card">
          <div className="brand">
            <div className="logo">A</div>
            <h1>ADUSTECH Connect</h1>
          </div>

          <div style={{ fontSize: "50px", margin: "20px 0" }}>
            📧
          </div>

          <h2>Check your email</h2>

          <p>{message}</p>

          <button className="primary" onClick={goLogin}>
            Go to Log In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="auth-card">
        <button className="back" onClick={goBack}>
          ← Back
        </button>

        <div className="brand">
          <div className="logo">A</div>
          <h1>ADUSTECH Connect</h1>
        </div>

        <h2>Create your account</h2>
        <p>Join the academic community of students.</p>

        {error && (
          <div
            style={{
              background: "#fee2e2",
              color: "#991b1b",
              padding: "12px",
              borderRadius: "8px",
              marginBottom: "15px",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleRegister}>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Full name"
          />

          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
          />

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Student email"
          />

          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone number"
          />

          <input
            value={matricNumber}
            onChange={(e) => setMatricNumber(e.target.value)}
            placeholder="Matriculation number"
          />

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
          />

          <select
            value={institutionId}
            onChange={(e) => handleInstitutionChange(e.target.value)}
            disabled={loadingData}
          >
            <option value="">
              {loadingData
                ? "Loading institutions..."
                : "Select institution"}
            </option>

            {institutions.map((institution) => (
              <option key={institution.id} value={institution.id}>
                {institution.name}
                {institution.short_name
                  ? ` (${institution.short_name})`
                  : ""}
              </option>
            ))}
          </select>

          <select
            value={facultyId}
            onChange={(e) => handleFacultyChange(e.target.value)}
            disabled={!institutionId}
          >
            <option value="">Select faculty</option>

            {faculties.map((faculty) => (
              <option key={faculty.id} value={faculty.id}>
                {faculty.name}
                {faculty.abbreviation
                  ? ` (${faculty.abbreviation})`
                  : ""}
              </option>
            ))}
          </select>

          <select
            value={departmentId}
            onChange={(e) => handleDepartmentChange(e.target.value)}
            disabled={!facultyId}
          >
            <option value="">Select department</option>

            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
                {department.abbreviation
                  ? ` (${department.abbreviation})`
                  : ""}
              </option>
            ))}
          </select>

          <select
            value={programmeId}
            onChange={(e) => setProgrammeId(e.target.value)}
            disabled={!departmentId}
          >
            <option value="">Select programme</option>

            {programmes.map((programme) => (
              <option key={programme.id} value={programme.id}>
                {programme.name}
                {programme.programme_code
                  ? ` — ${programme.programme_code}`
                  : ""}
              </option>
            ))}
          </select>

          <select
            value={levelId}
            onChange={(e) => setLevelId(e.target.value)}
          >
            <option value="">Select level</option>

            {levels.map((level) => (
              <option key={level.id} value={level.id}>
                {level.name}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="primary"
            disabled={loading}
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="switch">
          Already have an account?{" "}
          <button onClick={goLogin}>Log in</button>
        </p>
      </div>
    </div>
  );
}

/* =========================
   LOGIN
========================= */

function Login({ goBack, goRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleLogin(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!email || !password) {
      setError("Enter your email and password.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setSuccess("Login successful. Welcome to ADUSTECH Connect!");
  }

  return (
    <div className="page">
      <div className="auth-card">
        <button className="back" onClick={goBack}>
          ← Back
        </button>

        <div className="brand">
          <div className="logo">A</div>
          <h1>ADUSTECH Connect</h1>
        </div>

        <h2>Welcome back</h2>
        <p>Log in to continue to your student community.</p>

        {error && (
          <div
            style={{
              background: "#fee2e2",
              color: "#991b1b",
              padding: "12px",
              borderRadius: "8px",
              marginBottom: "15px",
            }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            style={{
              background: "#dcfce7",
              color: "#166534",
              padding: "12px",
              borderRadius: "8px",
              marginBottom: "15px",
            }}
          >
            {success}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Student email"
          />

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
          />

          <button
            type="submit"
            className="primary"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>

        <p className="switch">
          Don't have an account?{" "}
          <button onClick={goRegister}>Create one</button>
        </p>
      </div>
    </div>
  );
}

/* =========================
   FEATURE
========================= */

function Feature({ icon, title, text }) {
  return (
    <div className="feature">
      <div className="feature-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
      }
