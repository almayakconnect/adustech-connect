import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export default function App() {
  const [showRegister, setShowRegister] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  return (
    <div className="app">

      <header className="navbar">
        <div className="brand">
          <div className="logo">A</div>
          <span>ADUSTECH Connect</span>
        </div>

        <div className="nav-actions">
          <button onClick={() => setShowLogin(true)}>Log In</button>

          <button
            className="primary small"
            onClick={() => setShowRegister(true)}
          >
            Sign Up
          </button>
        </div>
      </header>

      {showRegister ? (
        <Register onBack={() => setShowRegister(false)} />
      ) : showLogin ? (
        <Login
          onBack={() => setShowLogin(false)}
          onRegister={() => {
            setShowLogin(false);
            setShowRegister(true);
          }}
        />
      ) : (
        <Home
          onRegister={() => setShowRegister(true)}
          onLogin={() => setShowLogin(true)}
        />
      )}

      <footer>
        <strong>ADUSTECH Connect</strong>
        <span>Student academic community platform</span>
      </footer>

    </div>
  );
}


/* =========================
   HOME
========================= */

function Home({ onRegister, onLogin }) {
  return (
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
            onClick={onRegister}
          >
            Get Started →
          </button>

          <button
            className="secondary large"
            onClick={onLogin}
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
  );
}


/* =========================
   REGISTER
========================= */

function Register({ onBack }) {

  const [faculties, setFaculties] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [programmes, setProgrammes] = useState([]);

  const [facultyId, setFacultyId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [programmeId, setProgrammeId] = useState("");

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    matric_number: "",
    level: ""
  });


  /* LOAD FACULTIES */

  useEffect(() => {

    async function loadFaculties() {

      const { data, error } = await supabase
        .from("faculties")
        .select("id,name,abbreviation")
        .eq(
          "institution_id",
          "ed465a1f-f79c-4aed-b9de-8c18d51d32b4"
        )
        .order("name");

      if (error) {
        console.error(error);
        return;
      }

      setFaculties(data || []);
    }

    loadFaculties();

  }, []);


  /* LOAD DEPARTMENTS */

  useEffect(() => {

    async function loadDepartments() {

      if (!facultyId) {
        setDepartments([]);
        return;
      }

      const { data, error } = await supabase
        .from("departments")
        .select("id,name,abbreviation")
        .eq("faculty_id", facultyId)
        .order("name");

      if (error) {
        console.error(error);
        return;
      }

      setDepartments(data || []);

    }

    loadDepartments();

    setDepartmentId("");
    setProgrammeId("");
    setProgrammes([]);

  }, [facultyId]);


  /* LOAD PROGRAMMES */

  useEffect(() => {

    async function loadProgrammes() {

      if (!departmentId) {
        setProgrammes([]);
        return;
      }

      const { data, error } = await supabase
        .from("programmes")
        .select(
          "id,name,programme_code,degree_type,duration_years"
        )
        .eq("department_id", departmentId)
        .order("name");

      if (error) {
        console.error(error);
        return;
      }

      setProgrammes(data || []);

    }

    loadProgrammes();

    setProgrammeId("");

  }, [departmentId]);


  /* UPDATE FORM */

  function updateForm(e) {

    setForm({
      ...form,
      [e.target.name]: e.target.value
    });

  }


  /* SIGN UP */

  async function handleRegister(e) {

    e.preventDefault();

    if (
      !facultyId ||
      !departmentId ||
      !programmeId ||
      !form.level
    ) {
      alert("Please complete your academic information.");
      return;
    }

    setLoading(true);

    try {

      const {
        data: authData,
        error: authError
      } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            full_name: form.full_name
          }
        }
      });

      if (authError) {
        throw authError;
      }

      const userId = authData.user?.id;

      if (!userId) {
        throw new Error("Account was not created.");
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          id: userId,
          full_name: form.full_name,
          email: form.email,
          matric_number: form.matric_number,
          institution_id:
            "ed465a1f-f79c-4aed-b9de-8c18d51d32b4",
          faculty_id: facultyId,
          department_id: departmentId,
          programme_id: programmeId,
          level_id: form.level,
          is_student: true,
          is_verified: false,
          verification_status: "pending"
        });

      if (profileError) {
        throw profileError;
      }

      alert(
        "Account created successfully! Check your email to verify your account."
      );

    } catch (error) {

      console.error(error);

      alert(
        error.message ||
        "Unable to create your account."
      );

    } finally {

      setLoading(false);

    }

  }


  return (
    <main className="page">

      <div className="auth-card">

        <button
          className="back"
          onClick={onBack}
        >
          ← Back
        </button>

        <div className="brand">
          <div className="logo">A</div>
          <h1>ADUSTECH Connect</h1>
        </div>

        <h2>Create your account</h2>

        <p>
          Join the academic community of students.
        </p>

        <form onSubmit={handleRegister}>

          <input
            name="full_name"
            placeholder="Full name"
            value={form.full_name}
            onChange={updateForm}
            required
          />

          <input
            name="email"
            type="email"
            placeholder="Student email"
            value={form.email}
            onChange={updateForm}
            required
          />

          <input
            name="matric_number"
            placeholder="Matric number"
            value={form.matric_number}
            onChange={updateForm}
            required
          />

          <input
            name="password"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={updateForm}
            required
            minLength={6}
          />


          {/* FACULTY */}

          <select
            value={facultyId}
            onChange={(e) =>
              setFacultyId(e.target.value)
            }
            required
          >

            <option value="">
              Select Faculty
            </option>

            {faculties.map((faculty) => (

              <option
                key={faculty.id}
                value={faculty.id}
              >
                {faculty.name}
              </option>

            ))}

          </select>


          {/* DEPARTMENT */}

          <select
            value={departmentId}
            onChange={(e) =>
              setDepartmentId(e.target.value)
            }
            disabled={!facultyId}
            required
          >

            <option value="">
              {facultyId
                ? "Select Department"
                : "Select Faculty First"}
            </option>

            {departments.map((department) => (

              <option
                key={department.id}
                value={department.id}
              >
                {department.name}
              </option>

            ))}

          </select>


          {/* PROGRAMME */}

          <select
            value={programmeId}
            onChange={(e) =>
              setProgrammeId(e.target.value)
            }
            disabled={!departmentId}
            required
          >

            <option value="">
              {departmentId
                ? "Select Programme"
                : "Select Department First"}
            </option>

            {programmes.map((programme) => (

              <option
                key={programme.id}
                value={programme.id}
              >
                {programme.name}
              </option>

            ))}

          </select>


          {/* LEVEL */}

          <select
            name="level"
            value={form.level}
            onChange={updateForm}
            required
          >

            <option value="">
              Select Level
            </option>

            <option value="100">
              100 Level
            </option>

            <option value="200">
              200 Level
            </option>

            <option value="300">
              300 Level
            </option>

            <option value="400">
              400 Level
            </option>

            <option value="500">
              500 Level
            </option>

            <option value="600">
              600 Level
            </option>

          </select>


          <button
            className="primary"
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Creating Account..."
              : "Create Account"}
          </button>

        </form>

      </div>

    </main>
  );
}


/* =========================
   LOGIN
========================= */

function Login({ onBack, onRegister }) {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleLogin(e) {

    e.preventDefault();

    const { error } =
      await supabase.auth.signInWithPassword({
        email,
        password
      });

    if (error) {
      alert(error.message);
      return;
    }

    alert("Login successful!");

  }

  return (
    <main className="page">

      <div className="auth-card">

        <button
          className="back"
          onClick={onBack}
        >
          ← Back
        </button>

        <div className="brand">
          <div className="logo">A</div>
          <h1>ADUSTECH Connect</h1>
        </div>

        <h2>Welcome back</h2>

        <p>
          Log in to continue to your student community.
        </p>

        <form onSubmit={handleLogin}>

          <input
            type="email"
            placeholder="Student email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            required
          />

          <button
            className="primary"
            type="submit"
          >
            Log In
          </button>

        </form>

        <p className="switch">
          Don't have an account?{" "}

          <button onClick={onRegister}>
            Create one
          </button>
        </p>

      </div>

    </main>
  );
}


/* =========================
   FEATURE
========================= */

function Feature({ icon, title, text }) {

  return (
    <div className="feature">

      <div className="feature-icon">
        {icon}
      </div>

      <h3>{title}</h3>

      <p>{text}</p>

    </div>
  );

               }
