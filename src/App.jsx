import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

const INSTITUTION_ID =
"ed465a1f-f79c-4aed-b9de-8c18d51d32b4";

const PENDING_PROFILE_KEY =
"adustech_pending_profile";

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
    <span>
      Student academic community platform
    </span>
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
      ADUSTECH Connect brings students together
      to connect, communicate, study and build
      their academic community.
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
const [levelsLoading, setLevelsLoading] =
useState(true);

const [form, setForm] = useState({
full_name: "",
email: "",
password: "",
matric_number: "",
level_id: "",
});

/* ---------------------------------------------------
LOAD FACULTIES
--------------------------------------------------- */

useEffect(() => {
async function loadFaculties() {
const { data, error } = await supabase
.from("faculties")
.select("id, name, abbreviation")
.eq(
"institution_id",
INSTITUTION_ID
)
.order("name", {
ascending: true,
});

  if (error) {
    console.error(
      "Faculty loading error:",
      error
    );
    setFaculties([]);
    return;
  }

  setFaculties(data || []);
}

loadFaculties();

}, []);

/* ---------------------------------------------------
LOAD LEVELS
--------------------------------------------------- */

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

/* ---------------------------------------------------
LOAD DEPARTMENTS
--------------------------------------------------- */

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

/* ---------------------------------------------------
LOAD PROGRAMMES
--------------------------------------------------- */

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
    .eq(
      "department_id",
      departmentId
    )
    .order("name", {
      ascending: true,
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

/* ---------------------------------------------------
FORM UPDATE
--------------------------------------------------- */

function updateForm(event) {
const {
name,
value,
} = event.target;

setForm((previous) => ({
  ...previous,
  [name]: value,
}));

}

/* ---------------------------------------------------
VALIDATION
--------------------------------------------------- */

function validateAcademicSelections() {
if (!facultyId) {
throw new Error(
"Please select your faculty."
);
}

if (!departmentId) {
  throw new Error(
    "Please select your department."
  );
}

if (!programmeId) {
  throw new Error(
    "Please select your programme."
  );
}

if (!form.level_id) {
  throw new Error(
    "Please select your level."
  );
}

const selectedLevel =
  levels.find(
    (level) =>
      level.id === form.level_id
  );

if (!selectedLevel) {
  throw new Error(
    "The selected level is no longer available."
  );
}

}

/* ---------------------------------------------------
REGISTER
--------------------------------------------------- */

async function handleRegister(event) {
event.preventDefault();

if (loading) {
  return;
}

setLoading(true);

try {
  validateAcademicSelections();

  if (form.password.length < 6) {
    throw new Error(
      "Password must contain at least 6 characters."
    );
  }

  const email =
    form.email
      .trim()
      .toLowerCase();

  const matricNumber =
    form.matric_number.trim();

  const pendingProfile = {
    matric_number:
      matricNumber,

    institution_id:
      INSTITUTION_ID,

    faculty_id:
      facultyId,

    department_id:
      departmentId,

    programme_id:
      programmeId,

    level_id:
      form.level_id,
  };

  localStorage.setItem(
    PENDING_PROFILE_KEY,
    JSON.stringify({
      email,
      profile:
        pendingProfile,
    })
  );

  const {
    data,
    error,
  } =
    await supabase.auth.signUp({
      email,
      password:
        form.password,

      options: {
        data: {
          full_name:
            form.full_name.trim(),

          matric_number:
            matricNumber,
        },
      },
    });

  if (error) {
    throw error;
  }

  if (!data?.user) {
    throw new Error(
      "Supabase did not return a user account."
    );
  }

  if (data.session) {
    await saveAcademicProfile(
      data.user.id,
      pendingProfile
    );

    localStorage.removeItem(
      PENDING_PROFILE_KEY
    );

    alert(
      "Account created successfully! Welcome to ADUSTECH Connect."
    );

    resetRegistrationForm();
    return;
  }

  alert(
    "Your account was created. Please log in to complete your student profile."
  );

  resetRegistrationForm();

  setTimeout(
    () => onLogin(),
    300
  );

} catch (error) {
  console.error(
    "Registration error:",
    error
  );

  alert(
    error?.message ||
    "Registration failed. Please try again."
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

    <form
      onSubmit={handleRegister}
    >

      <input
        name="full_name"
        type="text"
        placeholder="Full name"
        value={
          form.full_name
        }
        onChange={
          updateForm
        }
        required
      />

      <input
        name="email"
        type="email"
        placeholder="Student email"
        value={
          form.email
        }
        onChange={
          updateForm
        }
        required
      />

      <input
        name="matric_number"
        type="text"
        placeholder="Matric number"
        value={
          form.matric_number
        }
        onChange={
          updateForm
        }
        required
      />

      <input
        name="password"
        type="password"
        placeholder="Password"
        value={
          form.password
        }
        onChange={
          updateForm
        }
        minLength={6}
        required
      />

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

        {faculties.map(
          (faculty) => (
            <option
              key={
                faculty.id
              }
              value={
                faculty.id
              }
            >
              {faculty.name}
              {faculty.abbreviation
                ? ` (${faculty.abbreviation})`
                : ""}
            </option>
          )
        )}
      </select>

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
            : departments.length ===
              0
            ? "No Departments Available"
            : "Select Department"}
        </option>

        {departments.map(
          (department) => (
            <option
              key={
                department.id
              }
              value={
                department.id
              }
            >
              {department.name}
              {department.abbreviation
                ? ` (${department.abbreviation})`
                : ""}
            </option>
          )
        )}
      </select>

      <select
        value={programmeId}
        onChange={(event) =>
          setProgrammeId(
            event.target.value
          )
        }
        disabled={
          !departmentId
        }
        required
      >
        <option value="">
          {!departmentId
            ? "Select Department First"
            : programmes.length ===
              0
            ? "No Programmes Available"
            : "Select Programme"}
        </option>

        {programmes.map(
          (programme) => (
            <option
              key={
                programme.id
              }
              value={
                programme.id
              }
            >
              {programme.name}
            </option>
          )
        )}
      </select>

      <select
        name="level_id"
        value={
          form.level_id
        }
        onChange={
          updateForm
        }
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

        {levels.map(
          (level) => (
            <option
              key={level.id}
              value={level.id}
            >
              {level.name}
            </option>
          )
        )}
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
SAVE ACADEMIC PROFILE
===================================================== */

async function saveAcademicProfile(
userId,
profile
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

const {
data: userData,
error: userError,
} =
await supabase.auth.getUser();

if (userError) {
throw userError;
}

const user =
userData?.user;

if (!user) {
throw new Error(
"Your login session is not available. Please log in again."
);
}

if (user.id !== userId) {
throw new Error(
"The authenticated user does not match the profile being updated."
);
}

const {
error,
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
      profile.level_id,
  }
);

if (error) {
console.error(
"Academic profile RPC error:",
error
);

throw new Error(
  `Academic profile could not be saved: ${error.message}`
);

}
}

/* =====================================================
LOGIN
===================================================== */

function Login({
onBack,
onRegister,
}) {
const [email, setEmail] =
useState("");

const [password, setPassword] =
useState("");

const [loading, setLoading] =
useState(false);

async function handleLogin(
event
) {
event.preventDefault();

if (loading) {
  return;
}

setLoading(true);

try {
  const {
    data,
    error,
  } =
    await supabase.auth.signInWithPassword(
      {
        email:
          email
            .trim()
            .toLowerCase(),

        password,
      }
    );

  if (error) {
    throw error;
  }

  if (!data?.user) {
    throw new Error(
      "Login failed. No user was returned."
    );
  }

  const pendingRaw =
    localStorage.getItem(
      PENDING_PROFILE_KEY
    );

  if (pendingRaw) {
    let pending =
      null;

    try {
      pending =
        JSON.parse(
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

        alert(
          "Login successful! Your academic profile has been completed."
        );

        return;

      } catch (
        profileError
      ) {
        console.error(
          "Pending academic profile error:",
          profileError
        );

        alert(
          "Login successful, but your academic information could not be saved.\n\n" +
          profileError.message
        );

        return;
      }
    }
  }

  alert(
    "Login successful! Welcome to ADUSTECH Connect."
  );

} catch (error) {
  console.error(
    "Login error:",
    error
  );

  alert(
    error?.message ||
    "Login failed. Please check your email and password."
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

    <form
      onSubmit={
        handleLogin
      }
    >

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
        onClick={
          onRegister
        }
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
text,
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
