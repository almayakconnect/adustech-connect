import { useEffect, useState } from "react";
import { supabase } from "./supabase";

const INSTITUTION_ID = "ed465a1f-f79c-4aed-b9de-8c18d51d32b4";

export default function App() {
  const [page, setPage] = useState("home");

  return (
    <div className="app">
      <header className="navbar">
        <div className="brand">
          <div className="logo">A</div>
          <span>ADUSTECH Connect</span>
        </div>

        <div className="nav-actions">
          <button onClick={() => setPage("login")}>
            Log In
          </button>

          <button
            className="primary small"
            onClick={() => setPage("register")}
          >
            Sign Up
          </button>
        </div>
      </header>

      {page === "home" && (
        <Home
          onRegister={() => setPage("register")}
          onLogin={() => setPage("login")}
        />
      )}

      {page === "register" && (
        <Register
          onBack={() => setPage("home")}
          onLogin={() => setPage("login")}
        />
      )}

      {page === "login" && (
        <Login
          onBack={() => setPage("home")}
          onRegister={() => setPage("register")}
        />
      )}

      <footer>
        <strong>ADUSTECH Connect</strong>
        <span>Student academic community platform</span>
      </footer>
    </div>
  );
}


/* =====================================================
   HOME
===================================================== */

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


/* =====================================================
   REGISTER
===================================================== */

function Register({ onBack, onLogin }) {

  const [faculties, setFaculties] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [programmes, setProgrammes] = useState([]);
  const [levels, setLevels] = useState([]);

  const [facultyId, setFacultyId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [programmeId, setProgrammeId] = useState("");

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    matric_number: "",
    level_id: ""
  });


  /* =====================================================
     LOAD FACULTIES
  ===================================================== */

  useEffect(() => {

    async function loadFaculties() {

      const { data, error } = await supabase
        .from("faculties")
        .select("id,name,abbreviation")
        .eq("institution_id", INSTITUTION_ID)
        .order("name");

      if (error) {
        console.error("Faculty error:", error);
        alert("Unable to load faculties.");
        return;
      }

      setFaculties(data || []);
    }

    loadFaculties();

  }, []);


  /* =====================================================
     LOAD LEVELS
  ===================================================== */

  useEffect(() => {

    async function loadLevels() {

      const { data, error } = await supabase
        .from("levels")
        .select("id,name")
        .order("created_at");

      if (error) {
        console.error("Level error:", error);
        alert("Unable to load levels.");
        return;
      }

      setLevels(data || []);
    }

    loadLevels();

  }, []);


  /* =====================================================
     LOAD DEPARTMENTS
  ===================================================== */

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
        console.error("Department error:", error);
        alert("Unable to load departments.");
        return;
      }

      setDepartments(data || []);
    }

    loadDepartments();

    setDepartmentId("");
    setProgrammeId("");
    setProgrammes([]);

  }, [facultyId]);


  /* =====================================================
     LOAD PROGRAMMES
  ===================================================== */

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
        console.error("Programme error:", error);
        alert("Unable to load programmes.");
        return;
      }

      setProgrammes(data || []);
    }

    loadProgrammes();

    setProgrammeId("");

  }, [departmentId]);


  /* =====================================================
     FORM UPDATE
  ===================================================== */

  function updateForm(e) {

    setForm({
      ...form,
      [e.target.name]: e.target.value
    });

  }


  /* =====================================================
     REGISTER
  ===================================================== */

  async function handleRegister(e) {

    e.preventDefault();

    if (!facultyId) {
      alert("Please select your faculty.");
      return;
    }

    if (!departmentId) {
      alert("Please select your department.");
      return;
    }

    if (!programmeId) {
      alert("Please select your programme.");
      return;
    }

    if (!form.level_id) {
      alert("Please select your level.");
      return;
    }

    if (form.password.length < 6) {
      alert("Password must contain at least 6 characters.");
      return;
    }

    setLoading(true);

    try {

      /* CREATE AUTH ACCOUNT */

      const {
        data: authData,
        error: authError
      } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: {
          data: {
            full_name: form.full_name.trim()
          }
        }
      });

      if (authError) {
        throw authError;
      }

      const userId = authData.user?.id;

      if (!userId) {
        throw new Error(
          "Account could not be created."
        );
      }


      /* CREATE PROFILE */

      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          id: userId,
          full_name: form.full_name.trim(),
          email: form.email.trim(),
          matric_number: form.matric_number.trim(),

          institution_id: INSTITUTION_ID,

          faculty_id: facultyId,
          department_id: departmentId,
          programme_id: programmeId,
          level_id: form.level_id,

          is_student: true,
          is_verified: false,
          verification_status: "pending"
        });

      if (profileError) {
        throw profileError;
      }


      /* SUCCESS */

      alert(
        "Account created successfully! Please check your email to verify your account."
      );

      setForm({
        full_name: "",
        email: "",
        password: "",
        matric_number: "",
        level_id: ""
      });

      setFacultyId("");
      setDepartmentId("");
      setProgrammeId("");

    } catch (error) {

      console.error("Registration error:", error);

      alert(
        error.message ||
        "Registration failed. Please try again."
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
          type="button"
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

          {/* FULL NAME */}

          <input
            name="full_name"
            placeholder="Full name"
            value={form.full_name}
            onChange={updateForm}
            required
          />


          {/* EMAIL */}

          <input
            name="email"
            type="email"
            placeholder="Student email"
            value={form.email}
            onChange={updateForm}
            required
          />


          {/* MATRIC NUMBER */}

          <input
            name="matric_number"
            placeholder="Matric number"
            value={form.matric_number}
            onChange={updateForm}
            required
          />


          {/* PASSWORD */}

          <input
            name="password"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={updateForm}
            minLength={6}
            required
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
              {!facultyId
                ? "Select Faculty First"
                : "Select Department"}
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
              {!departmentId
                ? "Select Department First"
                : "Select Programme"}
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
            name="level_id"
            value={form.level_id}
            onChange={updateForm}
            required
          >

            <option value="">
              Select Level
            </option>

            {levels.map((level) => (

              <option
                key={level.id}
                value={level.id}
              >
                {level.name}
              </option>

            ))}

          </select>


          {/* SUBMIT */}

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

        <p className="switch">
          Already have an account?{" "}

          <button
            type="button"
            onClick={onLogin}
          >
            Log in
          </button>
        </p>

      </div>

    </main>
  );
}


/* =====================================================
   LOGIN
===================================================== */

function Login({ onBack, onRegister }) {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);


  async function handleLogin(e) {

    e.preventDefault();

    setLoading(true);

    try {

      const { error } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password
        });

      if (error) {
        throw error;
      }

      alert("Login successful!");

    } catch (error) {

      console.error("Login error:", error);

      alert(
        error.message ||
        "Login failed."
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
          type="button"
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
            disabled={loading}
          >
            {loading ? "Logging in..." : "Log In"}
          </button>

        </form>

        <p className="switch">
          Don't have an account?{" "}

          <button
            type="button"
            onClick={onRegister}
          >
            Create one
          </button>
        </p>

      </div>

    </main>
  );
}


/* =====================================================
   FEATURE
===================================================== */

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
