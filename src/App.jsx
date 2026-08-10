import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

const INSTITUTION_ID =
  "ed465a1f-f79c-4aed-b9de-8c18d51d32b4";

const PENDING_PROFILE_KEY = "adustech_pending_profile";

/* =====================================================
   APP
===================================================== */

export default function App() {
  const [page, setPage] = useState("home");
  const [user, setUser] = useState(null);

  useEffect(() => {
    checkUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function checkUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      setUser(user);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setUser(null);
    setPage("home");
  }

  if (user) {
    return (
      <div className="app">
        <Dashboard
          user={user}
          onLogout={handleLogout}
        />
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
          ADUSTECH Connect brings students together to
          connect, communicate, study and build their
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
            text="Chat privately with other students."
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
  const [levelsLoading, setLevelsLoading] = useState(true);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    matric_number: "",
    level_id: "",
  });

  useEffect(() => {
    async function loadFaculties() {
      const { data, error } = await supabase
        .from("faculties")
        .select("id, name, abbreviation")
        .eq("institution_id", INSTITUTION_ID)
        .order("name", { ascending: true });

      if (error) {
        console.error(error);
        setFaculties([]);
        return;
      }

      setFaculties(data || []);
    }

    loadFaculties();
  }, []);

  useEffect(() => {
    async function loadLevels() {
      setLevelsLoading(true);

      const { data, error } = await supabase
        .from("levels")
        .select("id, name")
        .order("created_at", {
          ascending: true,
        });

      if (error) {
        console.error(error);
        setLevels([]);
      } else {
        setLevels(data || []);
      }

      setLevelsLoading(false);
    }

    loadLevels();
  }, []);

  useEffect(() => {
    async function loadDepartments() {
      if (!facultyId) {
        setDepartments([]);
        return;
      }

      const { data, error } = await supabase
        .from("departments")
        .select("id, name, abbreviation")
        .eq("faculty_id", facultyId)
        .order("name", {
          ascending: true,
        });

      if (error) {
        console.error(error);
        setDepartments([]);
        return;
      }

      setDepartments(data || []);
    }

    loadDepartments();

    setDepartmentId("");
    setProgrammeId("");
    setProgrammes([]);
  }, [facultyId]);

  useEffect(() => {
    async function loadProgrammes() {
      if (!departmentId) {
        setProgrammes([]);
        return;
      }

      const { data, error } = await supabase
        .from("programmes")
        .select(
          "id, name, programme_code, degree_type, duration_years"
        )
        .eq("department_id", departmentId)
        .order("name", {
          ascending: true,
        });

      if (error) {
        console.error(error);
        setProgrammes([]);
        return;
      }

      setProgrammes(data || []);
    }

    loadProgrammes();

    setProgrammeId("");
  }, [departmentId]);

  function updateForm(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function validateAcademicSelections() {
    if (!facultyId) {
      throw new Error("Please select your faculty.");
    }

    if (!departmentId) {
      throw new Error("Please select your department.");
    }

    if (!programmeId) {
      throw new Error("Please select your programme.");
    }

    if (!form.level_id) {
      throw new Error("Please select your level.");
    }
  }

  async function handleRegister(event) {
    event.preventDefault();

    if (loading) return;

    setLoading(true);

    try {
      validateAcademicSelections();

      if (form.password.length < 6) {
        throw new Error(
          "Password must contain at least 6 characters."
        );
      }

      const email = form.email
        .trim()
        .toLowerCase();

      const matricNumber =
        form.matric_number.trim();

      const pendingProfile = {
        matric_number: matricNumber,
        institution_id: INSTITUTION_ID,
        faculty_id: facultyId,
        department_id: departmentId,
        programme_id: programmeId,
        level_id: form.level_id,
      };

      localStorage.setItem(
        PENDING_PROFILE_KEY,
        JSON.stringify({
          email,
          profile: pendingProfile,
        })
      );

      const { data, error } =
        await supabase.auth.signUp({
          email,
          password: form.password,
          options: {
            data: {
              full_name:
                form.full_name.trim(),

              matric_number:
                matricNumber,
            },
          },
        });

      if (error) throw error;

      if (!data?.user) {
        throw new Error(
          "Supabase did not return a user account."
        );
      }

      if (data.session) {
        await saveAcademicProfile(
          data.user.id,
          pendingProfile,
          form.full_name.trim()
        );

        localStorage.removeItem(
          PENDING_PROFILE_KEY
        );

        alert(
          "Account created successfully!"
        );

        window.location.reload();

        return;
      }

      alert(
        "Account created. Please log in to complete your profile."
      );

      resetRegistrationForm();

      setTimeout(() => onLogin(), 300);
    } catch (error) {
      console.error(
        "Registration error:",
        error
      );

      alert(
        error?.message ||
          "Registration failed."
      );
    } finally {
      setLoading(false);
    }
  }

  function resetRegistrationForm() {
    setForm({
      full_name: "",
      email: "",
      password: "",
      matric_number: "",
      level_id: "",
    });

    setFacultyId("");
    setDepartmentId("");
    setProgrammeId("");
    setDepartments([]);
    setProgrammes([]);
  }

  return (
    <main className="page">
      <div className="auth-card">
        <button
          className="back"
          type="button"
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
            type="text"
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
            type="text"
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
            minLength={6}
            required
          />

          <select
            value={facultyId}
            onChange={(event) =>
              setFacultyId(event.target.value)
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
                {faculty.abbreviation
                  ? ` (${faculty.abbreviation})`
                  : ""}
              </option>
            ))}
          </select>

          <select
            value={departmentId}
            onChange={(event) =>
              setDepartmentId(event.target.value)
            }
            disabled={!facultyId}
            required
          >
            <option value="">
              {!facultyId
                ? "Select Faculty First"
                : departments.length === 0
                ? "No Departments Available"
                : "Select Department"}
            </option>

            {departments.map((department) => (
              <option
                key={department.id}
                value={department.id}
              >
                {department.name}
                {department.abbreviation
                  ? ` (${department.abbreviation})`
                  : ""}
              </option>
            ))}
          </select>

          <select
            value={programmeId}
            onChange={(event) =>
              setProgrammeId(event.target.value)
            }
            disabled={!departmentId}
            required
          >
            <option value="">
              {!departmentId
                ? "Select Department First"
                : programmes.length === 0
                ? "No Programmes Available"
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

          <select
            name="level_id"
            value={form.level_id}
            onChange={updateForm}
            disabled={
              levelsLoading ||
              levels.length === 0
            }
            required
          >
            <option value="">
              {levelsLoading
                ? "Loading Levels..."
                : levels.length === 0
                ? "No Levels Available"
                : "Select Level"}
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

          <button
            className="primary"
            type="submit"
            disabled={
              loading ||
              levelsLoading ||
              levels.length === 0
            }
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
   SAVE PROFILE
===================================================== */

async function saveAcademicProfile(
  userId,
  profile,
  fullName
) {
  if (!userId) {
    throw new Error(
      "User ID is missing."
    );
  }

  if (!profile?.level_id) {
    throw new Error(
      "Level information is missing."
    );
  }

  const { data: levelExists, error: levelError } =
    await supabase
      .from("levels")
      .select("id")
      .eq("id", profile.level_id)
      .maybeSingle();

  if (levelError) {
    throw new Error(
      `Could not verify level: ${levelError.message}`
    );
  }

  if (!levelExists) {
    throw new Error(
      "The selected level does not exist."
    );
  }

  const {
    data: userData,
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;

  const user = userData?.user;

  if (!user) {
    throw new Error(
      "Your login session is unavailable."
    );
  }

  const { error } = await supabase.rpc(
    "complete_student_profile",
    {
      p_user_id: userId,

      p_matric_number:
        profile.matric_number,

      p_institution_id:
        profile.institution_id,

      p_faculty_id:
        profile.faculty_id,

      p_department_id:
        profile.department_id,

      p_programme_id:
        profile.programme_id,

      p_level_id:
        profile.level_id,
    }
  );

  if (error) {
    throw new Error(
      `Academic profile could not be saved: ${error.message}`
    );
  }

  /*
   * Try to update the student's name if the
   * profiles table contains full_name.
   */

  if (fullName) {
    await supabase
      .from("profiles")
      .update({
        full_name: fullName,
      })
      .eq("id", userId);
  }
}

/* =====================================================
   LOGIN
===================================================== */

function Login({ onBack, onRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event) {
    event.preventDefault();

    if (loading) return;

    setLoading(true);

    try {
      const {
        data,
        error,
      } =
        await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });

      if (error) throw error;

      if (!data?.user) {
        throw new Error(
          "Login failed."
        );
      }

      const pendingRaw =
        localStorage.getItem(
          PENDING_PROFILE_KEY
        );

      if (pendingRaw) {
        let pending = null;

        try {
          pending = JSON.parse(
            pendingRaw
          );
        } catch {
          localStorage.removeItem(
            PENDING_PROFILE_KEY
          );
        }

        if (
          pending &&
          pending.email ===
            data.user.email?.toLowerCase()
        ) {
          try {
            await saveAcademicProfile(
              data.user.id,
              pending.profile
            );

            localStorage.removeItem(
              PENDING_PROFILE_KEY
            );
          } catch (profileError) {
            console.error(
              profileError
            );
          }
        }
      }

      window.location.reload();
    } catch (error) {
      console.error(
        "Login error:",
        error
      );

      alert(
        error?.message ||
          "Login failed. Check your email and password."
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
          type="button"
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
            onChange={(event) =>
              setEmail(event.target.value)
            }
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            required
          />

          <button
            className="primary"
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Logging in..."
              : "Log In"}
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
   DASHBOARD
===================================================== */

function Dashboard({ user, onLogout }) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedStudent, setSelectedStudent] =
    useState(null);

  const [profile, setProfile] = useState(null);

  useEffect(() => {
    loadMyProfile();
  }, [user]);

  async function loadMyProfile() {
    const { data, error } = await supabase
      .from("profiles")
      .select(
        `
        id,
        full_name,
        matric_number,
        faculty_id,
        department_id,
        programme_id,
        level_id
        `
      )
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.error(
        "Profile error:",
        error
      );
      return;
    }

    setProfile(data);
  }

  async function searchStudents(event) {
    event.preventDefault();

    const query = search.trim();

    if (!query) {
      setResults([]);
      return;
    }

    setSearching(true);

    try {
      /*
       * Search by name or matric number.
       */

      const { data, error } = await supabase
        .from("profiles")
        .select(
          `
          id,
          full_name,
          matric_number,
          faculty_id,
          department_id,
          programme_id,
          level_id
          `
        )
        .eq(
          "institution_id",
          INSTITUTION_ID
        )
        .or(
          `full_name.ilike.%${query}%,matric_number.ilike.%${query}%`
        )
        .neq("id", user.id)
        .limit(30);

      if (error) {
        console.error(
          "Search error:",
          error
        );

        alert(
          `Search failed: ${error.message}`
        );

        setResults([]);
        return;
      }

      setResults(data || []);
    } catch (error) {
      console.error(error);
      setResults([]);
    } finally {
      setSearching(false);
    }
  }

  return (
    <main className="dashboard">
      <header className="dashboard-header">
        <div className="dashboard-brand">
          <div className="logo">A</div>

          <div>
            <strong>
              ADUSTECH Connect
            </strong>

            <small>
              Student Community
            </small>
          </div>
        </div>

        <button
          className="logout"
          onClick={onLogout}
        >
          Logout
        </button>
      </header>

      <section className="dashboard-content">
        <div className="welcome">
          <p>Welcome back 👋</p>

          <h1>
            {profile?.full_name ||
              user.user_metadata
                ?.full_name ||
              "Student"}
          </h1>

          <span>
            Connect with students across
            ADUSTECH.
          </span>
        </div>

        {/* SEARCH BAR */}

        <form
          className="search-box"
          onSubmit={searchStudents}
        >
          <span className="search-icon">
            🔎
          </span>

          <input
            type="search"
            placeholder="Search students by name or matric number..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />

          {search && (
            <button
              type="button"
              className="clear-search"
              onClick={() => {
                setSearch("");
                setResults([]);
              }}
            >
              ×
            </button>
          )}

          <button
            className="primary search-button"
            type="submit"
            disabled={searching}
          >
            {searching
              ? "Searching..."
              : "Search"}
          </button>
        </form>

        {/* SEARCH RESULTS */}

        {searching && (
          <div className="search-status">
            Searching students...
          </div>
        )}

        {!searching &&
          search.trim() &&
          results.length === 0 && (
            <div className="empty-search">
              <div>🔍</div>

              <h3>
                No students found
              </h3>

              <p>
                Try another name or matric
                number.
              </p>
            </div>
          )}

        {results.length > 0 && (
          <section className="search-results">
            <div className="section-title">
              <h2>
                Search Results
              </h2>

              <span>
                {results.length} student
                {results.length === 1
                  ? ""
                  : "s"}
              </span>
            </div>

            <div className="student-grid">
              {results.map((student) => (
                <StudentCard
                  key={student.id}
                  student={student}
                  onClick={() =>
                    setSelectedStudent(
                      student
                    )
                  }
                />
              ))}
            </div>
          </section>
        )}

        {/* DEFAULT DASHBOARD */}

        {!search.trim() && (
          <section className="dashboard-cards">
            <DashboardCard
              icon="👥"
              title="Find Students"
              text="Search for students by name or matric number."
              onClick={() => {
                document
                  .querySelector(
                    ".search-box input"
                  )
                  ?.focus();
              }}
            />

            <DashboardCard
              icon="💬"
              title="Messages"
              text="Your private student conversations will appear here."
            />

            <DashboardCard
              icon="🎓"
              title="Academic Community"
              text="Connect with students from your faculty and department."
            />

            <DashboardCard
              icon="📝"
              title="Assignments"
              text="Discuss assignments and share academic materials."
            />
          </section>
        )}
      </section>

      {/* STUDENT PROFILE MODAL */}

      {selectedStudent && (
        <StudentModal
          student={selectedStudent}
          onClose={() =>
            setSelectedStudent(null)
          }
        />
      )}
    </main>
  );
}

/* =====================================================
   STUDENT CARD
===================================================== */

function StudentCard({ student, onClick }) {
  const initials = getInitials(
    student.full_name
  );

  return (
    <button
      className="student-card"
      onClick={onClick}
    >
      <div className="avatar">
        {initials}
      </div>

      <div className="student-info">
        <h3>
          {student.full_name ||
            "Student"}
        </h3>

        <p>
          {student.matric_number ||
            "Matric number unavailable"}
        </p>

        <span>
          🎓 ADUSTECH Student
        </span>
      </div>

      <div className="arrow">
        →
      </div>
    </button>
  );
}

/* =====================================================
   STUDENT MODAL
===================================================== */

function StudentModal({
  student,
  onClose,
}) {
  const initials = getInitials(
    student.full_name
  );

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
    >
      <div
        className="student-modal"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <button
          className="modal-close"
          onClick={onClose}
        >
          ×
        </button>

        <div className="large-avatar">
          {initials}
        </div>

        <h2>
          {student.full_name ||
            "Student"}
        </h2>

        <p className="matric">
          {student.matric_number ||
            "Matric number unavailable"}
        </p>

        <div className="profile-details">
          <div>
            <strong>
              Institution
            </strong>
            <span>
              Aliko Dangote University
              of Science and Technology
            </span>
          </div>

          <div>
            <strong>
              Student ID
            </strong>
            <span>
              {student.matric_number ||
                "Not available"}
            </span>
          </div>
        </div>

        <button
          className="primary full-button"
          onClick={() =>
            alert(
              "Messaging will be connected next."
            )
          }
        >
          💬 Message Student
        </button>
      </div>
    </div>
  );
}

/* =====================================================
   DASHBOARD CARD
===================================================== */

function DashboardCard({
  icon,
  title,
  text,
  onClick,
}) {
  return (
    <button
      className="dashboard-card"
      onClick={onClick}
    >
      <div className="dashboard-card-icon">
        {icon}
      </div>

      <h3>{title}</h3>

      <p>{text}</p>

      <span>
        Open →
      </span>
    </button>
  );
}

/* =====================================================
   FEATURE
===================================================== */

function Feature({
  icon,
  title,
  text,
}) {
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

/* =====================================================
   HELPERS
===================================================== */

function getInitials(name) {
  if (!name) return "A";

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(
      (word) => word[0]?.toUpperCase()
    )
    .join("");
      }
