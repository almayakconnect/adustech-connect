import { useEffect, useState } from "react";
import { supabase } from "./supabase";

const INSTITUTION_ID =
  "ed465a1f-f79c-4aed-b9de-8c18d51d32b4";

const PENDING_PROFILE_KEY = "adustech_pending_profile";


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
  const [levelsLoading, setLevelsLoading] = useState(true);

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
        .select("id, name, abbreviation")
        .eq("institution_id", INSTITUTION_ID)
        .order("name", {
          ascending: true
        });

      if (error) {

        console.error(
          "Faculty loading error:",
          error
        );

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

      setLevelsLoading(true);

      const { data, error } = await supabase
        .from("levels")
        .select("id, name")
        .order("created_at", {
          ascending: true
        });

      if (error) {

        console.error(
          "Level loading error:",
          error
        );

        setLevels([]);

      } else {

        setLevels(data || []);

      }

      setLevelsLoading(false);
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
        .select("id, name, abbreviation")
        .eq("faculty_id", facultyId)
        .order("name", {
          ascending: true
        });

      if (error) {

        console.error(
          "Department loading error:",
          error
        );

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
          "id, name, programme_code, degree_type, duration_years"
        )
        .eq("department_id", departmentId)
        .order("name", {
          ascending: true
        });

      if (error) {

        console.error(
          "Programme loading error:",
          error
        );

        setProgrammes([]);
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

  function updateForm(event) {

    const {
      name,
      value
    } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value
    }));

  }


  /* =====================================================
     REGISTER
  ===================================================== */

  async function handleRegister(event) {

    event.preventDefault();

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
      alert(
        "Password must contain at least 6 characters."
      );
      return;
    }

    setLoading(true);

    try {

      const pendingProfile = {
        matric_number:
          form.matric_number.trim(),

        institution_id:
          INSTITUTION_ID,

        faculty_id:
          facultyId,

        department_id:
          departmentId,

        programme_id:
          programmeId,

        level_id:
          form.level_id
      };


      /*
       * Save the selections temporarily in the browser.
       * This allows us to finish the profile after
       * email verification.
       */

      localStorage.setItem(
        PENDING_PROFILE_KEY,
        JSON.stringify({
          email:
            form.email.trim().toLowerCase(),

          profile:
            pendingProfile
        })
      );


      const {
        data,
        error
      } = await supabase.auth.signUp({

        email:
          form.email.trim(),

        password:
          form.password,

        options: {

          data: {

            full_name:
              form.full_name.trim(),

            matric_number:
              form.matric_number.trim()

          }

        }

      });


      if (error) {
        throw error;
      }


      if (!data?.user) {
        throw new Error(
          "Account could not be created."
        );
      }


      /*
       * If email confirmation is disabled,
       * Supabase gives us a session immediately.
       */

      if (data.session) {

        await saveAcademicProfile(
          data.user.id,
          pendingProfile
        );

        localStorage.removeItem(
          PENDING_PROFILE_KEY
        );

        alert(
          "Account created successfully!"
        );

      } else {

        alert(
          "Account created successfully. Please verify your email, then log in to complete your student profile."
        );

      }


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

          <div className="logo">
            A
          </div>

          <h1>
            ADUSTECH Connect
          </h1>

        </div>


        <h2>
          Create your account
        </h2>

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


          {/* FACULTY */}

          <select
            value={facultyId}
            onChange={(event) =>
              setFacultyId(
                event.target.value
              )
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


          {/* DEPARTMENT */}

          <select
            value={departmentId}
            onChange={(event) =>
              setDepartmentId(
                event.target.value
              )
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
                {department.abbreviation
                  ? ` (${department.abbreviation})`
                  : ""}
              </option>

            ))}

          </select>


          {/* PROGRAMME */}

          <select
            value={programmeId}
            onChange={(event) =>
              setProgrammeId(
                event.target.value
              )
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
              levelsLoading
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
   SAVE ACADEMIC PROFILE
===================================================== */

async function saveAcademicProfile(
  userId,
  profile
) {

  const {
    data: {
      user
    }
  } =
    await supabase.auth.getUser();


  if (!user || user.id !== userId) {

    throw new Error(
      "Your session is not ready. Please log in again."
    );

  }


  const {
    error
  } =
    await supabase.rpc(
      "complete_student_profile",
      {

        p_user_id:
          userId,

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
          profile.level_id

      }
    );


  if (error) {

    console.error(
      "Academic profile error:",
      error
    );

    throw error;

  }

}


/* =====================================================
   LOGIN
===================================================== */

function Login({ onBack, onRegister }) {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);


  /* =====================================================
     LOGIN
  ===================================================== */

  async function handleLogin(event) {

    event.preventDefault();

    setLoading(true);

    try {

      const {
        data,
        error
      } =
        await supabase.auth.signInWithPassword({

          email:
            email.trim(),

          password

        });


      if (error) {
        throw error;
      }


      if (!data?.user) {

        throw new Error(
          "Login failed."
        );

      }


      /*
       * Check whether we have pending academic
       * information from registration.
       */

      const pendingRaw =
        localStorage.getItem(
          PENDING_PROFILE_KEY
        );


      if (pendingRaw) {

        try {

          const pending =
            JSON.parse(
              pendingRaw
            );


          /*
           * Only use the pending information if
           * it belongs to the email that just logged in.
           */

          if (
            pending.email ===
            data.user.email?.toLowerCase()
          ) {

            await saveAcademicProfile(
              data.user.id,
              pending.profile
            );


            localStorage.removeItem(
              PENDING_PROFILE_KEY
            );


            alert(
              "Welcome to ADUSTECH Connect! Your student profile has been completed successfully."
            );

            setLoading(false);

            return;

          }

        } catch (profileError) {

          console.error(
            "Pending profile error:",
            profileError
          );

          alert(
            "You logged in successfully, but your academic information could not be saved yet. Please try logging in again."
          );

          setLoading(false);

          return;

        }

      }


      /*
       * If there is no pending registration data,
       * simply log the user in.
       */

      alert(
        "Login successful!"
      );


    } catch (error) {

      console.error(
        "Login error:",
        error
      );

      alert(
        error?.message ||
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
          type="button"
          onClick={onBack}
        >
          ← Back
        </button>


        <div className="brand">

          <div className="logo">
            A
          </div>

          <h1>
            ADUSTECH Connect
          </h1>

        </div>


        <h2>
          Welcome back
        </h2>

        <p>
          Log in to continue to your student community.
        </p>


        <form onSubmit={handleLogin}>

          <input
            type="email"
            placeholder="Student email"
            value={email}
            onChange={(event) =>
              setEmail(
                event.target.value
              )
            }
            required
          />


          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) =>
              setPassword(
                event.target.value
              )
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
   FEATURE
===================================================== */

function Feature({
  icon,
  title,
  text
}) {

  return (
    <div className="feature">

      <div className="feature-icon">
        {icon}
      </div>

      <h3>
        {title}
      </h3>

      <p>
        {text}
      </p>

    </div>
  );
      }
