import { useEffect, useMemo, useState } from "react";
import { supabase } from "./lib/supabase";
import "./index.css";

const INSTITUTION_ID =
  "ed465a1f-f79c-4aed-b9de-8c18d51d32b4";

const PENDING_PROFILE_KEY =
  "adustech_pending_profile";

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      const {
        data,
        error,
      } = await supabase.auth.getSession();

      if (!mounted) return;

      if (error) {
        console.error(error);
      }

      setSession(data?.session || null);

      if (data?.session?.user) {
        await loadProfile(data.session.user.id);
      }

      setAuthLoading(false);
    }

    loadSession();

    const {
      data: listener,
    } = supabase.auth.onAuthStateChange(
      async (_event, nextSession) => {
        if (!mounted) return;

        setSession(nextSession);

        if (nextSession?.user) {
          await loadProfile(nextSession.user.id);
        } else {
          setProfile(null);
        }
      }
    );

    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe();
    };
  }, []);

  async function loadProfile(userId) {
    const {
      data,
      error,
    } = await supabase
      .from("profiles")
      .select(`
        id,
        matric_number,
        institution_id,
        faculty_id,
        department_id,
        programme_id,
        level_id,
        is_student,
        is_verified,
        verification_status
      `)
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("Profile loading error:", error);
      return;
    }

    setProfile(data || null);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  }

  if (authLoading) {
    return <LoadingScreen />;
  }

  if (!session?.user) {
    return <AuthApp />;
  }

  return (
    <Platform
      user={session.user}
      profile={profile}
      onLogout={handleLogout}
    />
  );
}


/* =====================================================
   AUTH
===================================================== */

function AuthApp() {
  const [page, setPage] = useState("home");

  if (page === "register") {
    return (
      <Register
        onBack={() => setPage("home")}
        onLogin={() => setPage("login")}
      />
    );
  }

  if (page === "login") {
    return (
      <Login
        onBack={() => setPage("home")}
        onRegister={() => setPage("register")}
      />
    );
  }

  return (
    <div className="landing">
      <header className="navbar">
        <div className="brand">
          <div className="logo">A</div>
          <strong>ADUSTECH Connect</strong>
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

      <main className="hero">
        <div className="hero-content">
          <div className="badge">
            🎓 Built for ADUSTECH students
          </div>

          <h1>
            Your university.
            <br />
            <span>Your community.</span>
          </h1>

          <p>
            Connect with students, discover communities,
            share academic knowledge, communicate and
            build your university network.
          </p>

          <div className="hero-buttons">
            <button
              className="primary large"
              onClick={() => setPage("register")}
            >
              Get Started →
            </button>

            <button
              className="secondary large"
              onClick={() => setPage("login")}
            >
              Log In
            </button>
          </div>

          <div className="features">
            <Feature
              icon="📰"
              title="Student Feed"
              text="Share updates and follow what's happening around campus."
            />

            <Feature
              icon="👥"
              title="Communities"
              text="Connect with faculty, department and student communities."
            />

            <Feature
              icon="💬"
              title="Messenger"
              text="Communicate directly with other students."
            />

            <Feature
              icon="📚"
              title="Academic Hub"
              text="Discover assignments and useful academic resources."
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


/* =====================================================
   PLATFORM
===================================================== */

function Platform({
  user,
  profile,
  onLogout,
}) {
  const [page, setPage] = useState("feed");
  const [search, setSearch] = useState("");

  return (
    <div className="platform">

      <header className="platform-header">

        <div className="brand">
          <div className="logo">A</div>
          <strong>ADUSTECH Connect</strong>
        </div>

        <div className="search-box">
          <span>⌕</span>

          <input
            placeholder="Search students, posts and communities..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />
        </div>

        <div className="header-actions">
          <button
            className="icon-button"
            onClick={() => setPage("notifications")}
            title="Notifications"
          >
            🔔
          </button>

          <button
            className="avatar-button"
            onClick={() => setPage("profile")}
          >
            {getInitials(user.email)}
          </button>
        </div>

      </header>


      <div className="platform-body">

        <aside className="sidebar">

          <NavButton
            icon="🏠"
            text="Home"
            active={page === "feed"}
            onClick={() => setPage("feed")}
          />

          <NavButton
            icon="👥"
            text="Communities"
            active={page === "communities"}
            onClick={() => setPage("communities")}
          />

          <NavButton
            icon="💬"
            text="Messenger"
            active={page === "messages"}
            onClick={() => setPage("messages")}
          />

          <NavButton
            icon="📚"
            text="Resources"
            active={page === "resources"}
            onClick={() => setPage("resources")}
          />

          <NavButton
            icon="📝"
            text="Assignments"
            active={page === "assignments"}
            onClick={() => setPage("assignments")}
          />

          <NavButton
            icon="🔔"
            text="Notifications"
            active={page === "notifications"}
            onClick={() => setPage("notifications")}
          />

          <NavButton
            icon="👤"
            text="My Profile"
            active={page === "profile"}
            onClick={() => setPage("profile")}
          />

          <div className="sidebar-divider" />

          <button
            className="logout-button"
            onClick={onLogout}
          >
            🚪 Log out
          </button>

        </aside>


        <main className="platform-main">

          {page === "feed" && (
            <Feed
              user={user}
              profile={profile}
              search={search}
            />
          )}

          {page === "communities" && (
            <Communities
              user={user}
            />
          )}

          {page === "messages" && (
            <Messages
              user={user}
            />
          )}

          {page === "resources" && (
            <Resources />
          )}

          {page === "assignments" && (
            <Assignments />
          )}

          {page === "notifications" && (
            <Notifications
              user={user}
            />
          )}

          {page === "profile" && (
            <Profile
              user={user}
              profile={profile}
            />
          )}

        </main>

      </div>
    </div>
  );
}


/* =====================================================
   FEED
===================================================== */

function Feed({
  user,
  profile,
  search,
}) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState("");
  const [posting, setPosting] = useState(false);

  async function loadPosts() {
    setLoading(true);

    const {
      data,
      error,
    } = await supabase
      .from("posts")
      .select(`
        id,
        content,
        image_url,
        created_at,
        author_id
      `)
      .order("created_at", {
        ascending: false,
      })
      .limit(50);

    if (error) {
      console.error("Posts error:", error);
      setPosts([]);
    } else {
      setPosts(data || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadPosts();

    const channel =
      supabase
        .channel("adustech-posts")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "posts",
          },
          () => {
            loadPosts();
          }
        )
        .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function createPost() {
    const content = newPost.trim();

    if (!content || posting) {
      return;
    }

    setPosting(true);

    const {
      error,
    } = await supabase
      .from("posts")
      .insert({
        author_id: user.id,
        content,
      });

    if (error) {
      alert(error.message);
    } else {
      setNewPost("");
      await loadPosts();
    }

    setPosting(false);
  }

  const filteredPosts = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) {
      return posts;
    }

    return posts.filter((post) =>
      post.content
        ?.toLowerCase()
        .includes(term)
    );
  }, [posts, search]);

  return (
    <div className="content-page">

      <div className="page-heading">
        <div>
          <h1>Home</h1>
          <p>
            What's happening in your university community?
          </p>
        </div>
      </div>

      <section className="composer card">

        <div className="composer-avatar">
          {getInitials(user.email)}
        </div>

        <div className="composer-body">

          <textarea
            placeholder="Share something with your community..."
            value={newPost}
            onChange={(e) =>
              setNewPost(e.target.value)
            }
          />

          <div className="composer-footer">

            <span>
              🎓 Student community
            </span>

            <button
              className="primary"
              disabled={
                posting ||
                !newPost.trim()
              }
              onClick={createPost}
            >
              {posting
                ? "Posting..."
                : "Post"}
            </button>

          </div>

        </div>

      </section>


      {loading ? (
        <LoadingCard />
      ) : filteredPosts.length === 0 ? (
        <div className="empty card">
          <div className="empty-icon">📰</div>

          <h3>
            {search
              ? "No posts found"
              : "Your feed is empty"}
          </h3>

          <p>
            {search
              ? "Try another search."
              : "Be the first student to share something."}
          </p>
        </div>
      ) : (
        <div className="post-list">
          {filteredPosts.map((post) => (
            <Post
              key={post.id}
              post={post}
              currentUser={user}
              onRefresh={loadPosts}
            />
          ))}
        </div>
      )}

    </div>
  );
}


/* =====================================================
   POST
===================================================== */

function Post({
  post,
  currentUser,
  onRefresh,
}) {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(0);
  const [comments, setComments] = useState([]);
  const [comment, setComment] = useState("");
  const [showComments, setShowComments] =
    useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInteractions();
  }, [post.id]);

  async function loadInteractions() {
    const [
      likesResult,
      commentsResult,
    ] = await Promise.all([
      supabase
        .from("post_likes")
        .select("user_id")
        .eq("post_id", post.id),

      supabase
        .from("comments")
        .select(`
          id,
          content,
          author_id,
          created_at
        `)
        .eq("post_id", post.id)
        .order("created_at", {
          ascending: true,
        }),
    ]);

    if (!likesResult.error) {
      const rows = likesResult.data || [];

      setLikes(rows.length);

      setLiked(
        rows.some(
          (row) =>
            row.user_id === currentUser.id
        )
      );
    }

    if (!commentsResult.error) {
      setComments(
        commentsResult.data || []
      );
    }

    setLoading(false);
  }

  async function toggleLike() {
    if (liked) {
      await supabase
        .from("post_likes")
        .delete()
        .eq("post_id", post.id)
        .eq("user_id", currentUser.id);

      setLiked(false);
      setLikes((value) =>
        Math.max(0, value - 1)
      );

      return;
    }

    const {
      error,
    } = await supabase
      .from("post_likes")
      .insert({
        post_id: post.id,
        user_id: currentUser.id,
      });

    if (!error) {
      setLiked(true);
      setLikes((value) => value + 1);
    }
  }

  async function addComment() {
    const text = comment.trim();

    if (!text) {
      return;
    }

    const {
      error,
    } = await supabase
      .from("comments")
      .insert({
        post_id: post.id,
        author_id: currentUser.id,
        content: text,
      });

    if (error) {
      alert(error.message);
      return;
    }

    setComment("");
    await loadInteractions();
  }

  return (
    <article className="post card">

      <div className="post-header">

        <div className="avatar">
          {getInitials(
            post.author_id
          )}
        </div>

        <div>
          <strong>
            ADUSTECH Student
          </strong>

          <span className="post-time">
            {formatDate(post.created_at)}
          </span>
        </div>

      </div>


      <div className="post-content">
        {post.content}
      </div>


      <div className="post-stats">
        <span>
          {likes}{" "}
          {likes === 1
            ? "like"
            : "likes"}
        </span>

        <span>
          {comments.length}{" "}
          {comments.length === 1
            ? "comment"
            : "comments"}
        </span>
      </div>


      <div className="post-actions">

        <button
          className={
            liked
              ? "post-action active"
              : "post-action"
          }
          onClick={toggleLike}
        >
          {liked
            ? "❤️ Liked"
            : "♡ Like"}
        </button>

        <button
          className="post-action"
          onClick={() =>
            setShowComments(
              (value) => !value
            )
          }
        >
          💬 Comment
        </button>

      </div>


      {showComments && (
        <div className="comments">

          {comments.map((item) => (
            <div
              className="comment"
              key={item.id}
            >
              <div className="small-avatar">
                {getInitials(
                  item.author_id
                )}
              </div>

              <div className="comment-body">
                <strong>
                  Student
                </strong>

                <p>
                  {item.content}
                </p>
              </div>
            </div>
          ))}


          <div className="comment-composer">

            <input
              placeholder="Write a comment..."
              value={comment}
              onChange={(e) =>
                setComment(
                  e.target.value
                )
              }
              onKeyDown={(e) => {
                if (
                  e.key === "Enter"
                ) {
                  addComment();
                }
              }}
            />

            <button
              className="primary"
              onClick={addComment}
            >
              Send
            </button>

          </div>

        </div>
      )}

    </article>
  );
}


/* =====================================================
   COMMUNITIES
===================================================== */

function Communities({ user }) {
  const [communities, setCommunities] =
    useState([]);

  const [name, setName] = useState("");
  const [description, setDescription] =
    useState("");

  const [creating, setCreating] =
    useState(false);

  async function loadCommunities() {
    const {
      data,
      error,
    } = await supabase
      .from("communities")
      .select(`
        id,
        name,
        description,
        created_at
      `)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(error);
      return;
    }

    setCommunities(data || []);
  }

  useEffect(() => {
    loadCommunities();
  }, []);

  async function createCommunity() {
    if (!name.trim()) {
      return;
    }

    setCreating(true);

    const {
      data,
      error,
    } = await supabase
      .from("communities")
      .insert({
        name: name.trim(),
        description:
          description.trim(),
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      alert(error.message);
    } else if (data) {
      await supabase
        .from("community_members")
        .insert({
          community_id: data.id,
          user_id: user.id,
          role: "admin",
        });

      setName("");
      setDescription("");

      await loadCommunities();
    }

    setCreating(false);
  }

  return (
    <div className="content-page">

      <div className="page-heading">
        <div>
          <h1>Communities</h1>
          <p>
            Find people with the same academic interests.
          </p>
        </div>
      </div>


      <section className="card create-community">

        <h2>
          Create a community
        </h2>

        <input
          placeholder="Community name"
          value={name}
          onChange={(e) =>
            setName(e.target.value)
          }
        />

        <textarea
          placeholder="Describe your community..."
          value={description}
          onChange={(e) =>
            setDescription(
              e.target.value
            )
          }
        />

        <button
          className="primary"
          disabled={
            creating ||
            !name.trim()
          }
          onClick={createCommunity}
        >
          {creating
            ? "Creating..."
            : "Create Community"}
        </button>

      </section>


      <div className="community-grid">

        {communities.length === 0 ? (
          <div className="empty card">
            <div className="empty-icon">
              👥
            </div>

            <h3>
              No communities yet
            </h3>

            <p>
              Create the first student community.
            </p>
          </div>
        ) : (
          communities.map(
            (community) => (
              <div
                className="community-card card"
                key={community.id}
              >
                <div className="community-icon">
                  👥
                </div>

                <h3>
                  {community.name}
                </h3>

                <p>
                  {community.description ||
                    "Student community"}
                </p>

                <button
                  className="secondary"
                  onClick={async () => {
                    const {
                      error,
                    } =
                      await supabase
                        .from(
                          "community_members"
                        )
                        .upsert({
                          community_id:
                            community.id,
                          user_id:
                            user.id,
                          role:
                            "member",
                        });

                    if (error) {
                      alert(
                        error.message
                      );
                    } else {
                      alert(
                        "You joined the community."
                      );
                    }
                  }}
                >
                  Join Community
                </button>
              </div>
            )
          )
        )}

      </div>

    </div>
  );
}


/* =====================================================
   MESSAGES
===================================================== */

function Messages({ user }) {
  const [people, setPeople] = useState([]);
  const [selectedUser, setSelectedUser] =
    useState(null);

  const [messages, setMessages] =
    useState([]);

  const [text, setText] =
    useState("");

  const [conversationId, setConversationId] =
    useState(null);

  useEffect(() => {
    loadPeople();
  }, []);

  async function loadPeople() {
    const {
      data,
      error,
    } = await supabase
      .from("profiles")
      .select(`
        id,
        matric_number
      `)
      .neq("id", user.id)
      .limit(30);

    if (error) {
      console.error(error);
      return;
    }

    setPeople(data || []);
  }

  async function openConversation(person) {
    setSelectedUser(person);

    const {
      data: mine,
    } =
      await supabase
        .from("conversation_members")
        .select("conversation_id")
        .eq("user_id", user.id);

    const {
      data: theirs,
    } =
      await supabase
        .from("conversation_members")
        .select("conversation_id")
        .eq("user_id", person.id);

    const mineIds =
      (mine || []).map(
        (row) =>
          row.conversation_id
      );

    const existing =
      (theirs || []).find(
        (row) =>
          mineIds.includes(
            row.conversation_id
          )
      );

    let id =
      existing?.conversation_id;

    if (!id) {
      const {
        data: conversation,
        error,
      } = await supabase
        .from("conversations")
        .insert({})
        .select()
        .single();

      if (error) {
        alert(error.message);
        return;
      }

      id = conversation.id;

      const {
        error: memberError,
      } = await supabase
        .from("conversation_members")
        .insert([
          {
            conversation_id: id,
            user_id: user.id,
          },
          {
            conversation_id: id,
            user_id: person.id,
          },
        ]);

      if (memberError) {
        alert(
          memberError.message
        );
        return;
      }
    }

    setConversationId(id);

    await loadMessages(id);
  }

  async function loadMessages(id) {
    const {
      data,
      error,
    } = await supabase
      .from("messages")
      .select(`
        id,
        sender_id,
        content,
        created_at
      `)
      .eq(
        "conversation_id",
        id
      )
      .order("created_at", {
        ascending: true,
      });

    if (!error) {
      setMessages(data || []);
    }
  }

  async function sendMessage() {
    if (
      !conversationId ||
      !text.trim()
    ) {
      return;
    }

    const {
      error,
    } = await supabase
      .from("messages")
      .insert({
        conversation_id:
          conversationId,
        sender_id: user.id,
        content: text.trim(),
      });

    if (error) {
      alert(error.message);
      return;
    }

    setText("");
    await loadMessages(
      conversationId
    );
  }

  return (
    <div className="content-page">

      <div className="page-heading">
        <div>
          <h1>Messenger</h1>
          <p>
            Connect privately with other students.
          </p>
        </div>
      </div>

      <div className="messenger card">

        <aside className="people-list">

          <h3>
            Students
          </h3>

          {people.map((person) => (
            <button
              className={
                selectedUser?.id ===
                person.id
                  ? "person active"
                  : "person"
              }
              key={person.id}
              onClick={() =>
                openConversation(
                  person
                )
              }
            >
              <span className="avatar">
                {getInitials(
                  person.matric_number ||
                    person.id
                )}
              </span>

              <span>
                {person.matric_number ||
                  "ADUSTECH Student"}
              </span>
            </button>
          ))}

        </aside>


        <section className="chat">

          {!selectedUser ? (
            <div className="chat-empty">
              <div>💬</div>
              <h3>
                Select a student
              </h3>
              <p>
                Choose someone to start a conversation.
              </p>
            </div>
          ) : (
            <>
              <div className="chat-header">
                <div className="avatar">
                  {getInitials(
                    selectedUser.matric_number ||
                      selectedUser.id
                  )}
                </div>

                <strong>
                  {selectedUser.matric_number ||
                    "ADUSTECH Student"}
                </strong>
              </div>


              <div className="message-list">

                {messages.map(
                  (message) => (
                    <div
                      key={message.id}
                      className={
                        message.sender_id ===
                        user.id
                          ? "message mine"
                          : "message"
                      }
                    >
                      {message.content}
                    </div>
                  )
                )}

              </div>


              <div className="message-composer">

                <input
                  placeholder="Write a message..."
                  value={text}
                  onChange={(e) =>
                    setText(
                      e.target.value
                    )
                  }
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter"
                    ) {
                      sendMessage();
                    }
                  }}
                />

                <button
                  className="primary"
                  onClick={sendMessage}
                >
                  Send
                </button>

              </div>
            </>
          )}

        </section>

      </div>

    </div>
  );
}


/* =====================================================
   RESOURCES
===================================================== */

function Resources() {
  const [resources, setResources] =
    useState([]);

  useEffect(() => {
    async function load() {
      const {
        data,
        error,
      } = await supabase
        .from("resources")
        .select(`
          id,
          title,
          description,
          file_url,
          course_code,
          created_at
        `)
        .order("created_at", {
          ascending: false,
        });

      if (!error) {
        setResources(data || []);
      }
    }

    load();
  }, []);

  return (
    <div className="content-page">

      <div className="page-heading">
        <div>
          <h1>Academic Resources</h1>
          <p>
            Study materials shared by the student community.
          </p>
        </div>
      </div>


      <div className="resource-list">

        {resources.length === 0 ? (
          <div className="empty card">
            <div className="empty-icon">
              📚
            </div>

            <h3>
              No resources yet
            </h3>

            <p>
              Academic resources will appear here.
            </p>
          </div>
        ) : (
          resources.map(
            (resource) => (
              <div
                className="resource card"
                key={resource.id}
              >
                <div className="resource-icon">
                  📄
                </div>

                <div className="resource-info">
                  <h3>
                    {resource.title}
                  </h3>

                  <p>
                    {resource.description ||
                      "Academic resource"}
                  </p>

                  {resource.course_code && (
                    <span className="tag">
                      {resource.course_code}
                    </span>
                  )}
                </div>

                <a
                  href={
                    resource.file_url
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="secondary"
                >
                  Open
                </a>
              </div>
            )
          )
        )}

      </div>

    </div>
  );
}


/* =====================================================
   ASSIGNMENTS
===================================================== */

function Assignments() {
  const [assignments, setAssignments] =
    useState([]);

  useEffect(() => {
    async function load() {
      const {
        data,
        error,
      } = await supabase
        .from("assignments")
        .select(`
          id,
          title,
          description,
          due_date,
          course_code,
          created_at
        `)
        .order("created_at", {
          ascending: false,
        });

      if (!error) {
        setAssignments(data || []);
      }
    }

    load();
  }, []);

  return (
    <div className="content-page">

      <div className="page-heading">
        <div>
          <h1>Assignments</h1>
          <p>
            Keep track of academic work shared by students.
          </p>
        </div>
      </div>


      <div className="assignment-list">

        {assignments.length === 0 ? (
          <div className="empty card">
            <div className="empty-icon">
              📝
            </div>

            <h3>
              No assignments yet
            </h3>

            <p>
              Assignments will appear here.
            </p>
          </div>
        ) : (
          assignments.map(
            (assignment) => (
              <div
                className="assignment card"
                key={assignment.id}
              >
                <div>
                  <h3>
                    {assignment.title}
                  </h3>

                  <p>
                    {assignment.description ||
                      "Academic assignment"}
                  </p>

                  {assignment.course_code && (
                    <span className="tag">
                      {assignment.course_code}
                    </span>
                  )}
                </div>

                <div className="due">
                  {assignment.due_date
                    ? `Due ${formatDate(
                        assignment.due_date
                      )}`
                    : "No due date"}
                </div>
              </div>
            )
          )
        )}

      </div>

    </div>
  );
}


/* =====================================================
   NOTIFICATIONS
===================================================== */

function Notifications({ user }) {
  const [notifications, setNotifications] =
    useState([]);

  useEffect(() => {
    loadNotifications();
  }, []);

  async function loadNotifications() {
    const {
      data,
      error,
    } = await supabase
      .from("notifications")
      .select(`
        id,
        message,
        type,
        created_at,
        read_at
      `)
      .eq("user_id", user.id)
      .order("created_at", {
        ascending: false,
      });

    if (!error) {
      setNotifications(
        data || []
      );
    }
  }

  async function markRead(id) {
    await supabase
      .from("notifications")
      .update({
        read_at:
          new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id);

    await loadNotifications();
  }

  return (
    <div className="content-page">

      <div className="page-heading">
        <div>
          <h1>Notifications</h1>
          <p>
            Stay updated with your community.
          </p>
        </div>
      </div>


      <div className="notification-list">

        {notifications.length === 0 ? (
          <div className="empty card">
            <div className="empty-icon">
              🔔
            </div>

            <h3>
              You're all caught up
            </h3>

            <p>
              New notifications will appear here.
            </p>
          </div>
        ) : (
          notifications.map(
            (item) => (
              <button
                className={
                  item.read_at
                    ? "notification card read"
                    : "notification card"
                }
                key={item.id}
                onClick={() =>
                  markRead(item.id)
                }
              >
                <div className="notification-icon">
                  🔔
                </div>

                <div>
                  <strong>
                    {item.message}
                  </strong>

                  <span>
                    {formatDate(
                      item.created_at
                    )}
                  </span>
                </div>
              </button>
            )
          )
        )}

      </div>

    </div>
  );
}


/* =====================================================
   PROFILE
===================================================== */

function Profile({
  user,
  profile,
}) {
  return (
    <div className="content-page">

      <div className="profile-cover">
        <div className="profile-avatar">
          {getInitials(
            user.email
          )}
        </div>
      </div>


      <section className="profile-card card">

        <h1>
          ADUSTECH Student
        </h1>

        <p className="profile-email">
          {user.email}
        </p>


        <div className="profile-grid">

          <ProfileField
            label="Matric Number"
            value={
              profile?.matric_number ||
              "Not provided"
            }
          />

          <ProfileField
            label="Student Status"
            value={
              profile?.is_student
                ? "Student"
                : "Not verified"
            }
          />

          <ProfileField
            label="Verification"
            value={
              profile?.verification_status ||
              "pending"
            }
          />

          <ProfileField
            label="Level"
            value={
              profile?.level_id
                ? "Academic level selected"
                : "Not provided"
            }
          />

        </div>

      </section>

    </div>
  );
}


/* =====================================================
   REGISTER
===================================================== */

function Register({
  onBack,
  onLogin,
}) {
  const [faculties, setFaculties] =
    useState([]);

  const [departments, setDepartments] =
    useState([]);

  const [programmes, setProgrammes] =
    useState([]);

  const [levels, setLevels] =
    useState([]);

  const [facultyId, setFacultyId] =
    useState("");

  const [departmentId, setDepartmentId] =
    useState("");

  const [programmeId, setProgrammeId] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [levelsLoading, setLevelsLoading] =
    useState(true);

  const [form, setForm] =
    useState({
      full_name: "",
      email: "",
      password: "",
      matric_number: "",
      level_id: "",
    });

  useEffect(() => {
    async function load() {
      const {
        data,
        error,
      } = await supabase
        .from("faculties")
        .select(
          "id, name, abbreviation"
        )
        .eq(
          "institution_id",
          INSTITUTION_ID
        )
        .order("name");

      if (!error) {
        setFaculties(data || []);
      }
    }

    load();
  }, []);

  useEffect(() => {
    async function loadLevels() {
      setLevelsLoading(true);

      const {
        data,
        error,
      } = await supabase
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

  useEffect(() => {
    async function loadDepartments() {
      if (!facultyId) {
        setDepartments([]);
        return;
      }

      const {
        data,
        error,
      } = await supabase
        .from("departments")
        .select(
          "id, name, abbreviation"
        )
        .eq(
          "faculty_id",
          facultyId
        )
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

  useEffect(() => {
    async function loadProgrammes() {
      if (!departmentId) {
        setProgrammes([]);
        return;
      }

      const {
        data,
        error,
      } = await supabase
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
          level.id ===
          form.level_id
      );

    if (!selectedLevel) {
      throw new Error(
        "The selected level is no longer available."
      );
    }
  }

  async function handleRegister(event) {
    event.preventDefault();

    if (loading) {
      return;
    }

    setLoading(true);

    try {
      validateAcademicSelections();

      const fullName =
        form.full_name.trim();

      const email =
        form.email
          .trim()
          .toLowerCase();

      const matricNumber =
        form.matric_number.trim();

      if (!fullName) {
        throw new Error(
          "Please enter your full name."
        );
      }

      if (!email) {
        throw new Error(
          "Please enter your email address."
        );
      }

      if (!matricNumber) {
        throw new Error(
          "Please enter your matric number."
        );
      }

      if (
        form.password.length <
        6
      ) {
        throw new Error(
          "Password must contain at least 6 characters."
        );
      }

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
                fullName,

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
          "Account created successfully! Welcome to ADUSTECH Connect."
        );

        resetRegistrationForm();

        return;
      }

      /*
       * If email confirmation is enabled,
       * the user must log in after confirming.
       */
      alert(
        "Account created successfully. Please confirm your email if required, then log in to complete your student profile."
      );

      resetRegistrationForm();

      setTimeout(() => {
        onLogin();
      }, 300);

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
          onSubmit={
            handleRegister
          }
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
            disabled={
              !facultyId
            }
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
                : levels.length ===
                  0
                ? "No Levels Available"
                : "Select Level"}
            </option>

            {levels.map(
              (level) => (
                <option
                  key={
                    level.id
                  }
                  value={
                    level.id
                  }
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
   LOADING SCREEN
===================================================== */

function LoadingScreen() {
  return (
    <main className="loading-screen">
      <div className="loading-box">
        <div className="logo">
          A
        </div>

        <h2>
          ADUSTECH Connect
        </h2>

        <p>
          Loading your student community...
        </p>
      </div>
    </main>
  );
}


/* =====================================================
   LOADING CARD
===================================================== */

function LoadingCard() {
  return (
    <div className="empty card">
      <div className="empty-icon">
        ⏳
      </div>

      <h3>
        Loading...
      </h3>

      <p>
        Please wait while we load the community.
      </p>
    </div>
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


/* =====================================================
   NAV BUTTON
===================================================== */

function NavButton({
  icon,
  text,
  active,
  onClick,
}) {
  return (
    <button
      className={
        active
          ? "nav-button active"
          : "nav-button"
      }
      onClick={onClick}
      type="button"
    >
      <span>
        {icon}
      </span>

      <span>
        {text}
      </span>
    </button>
  );
}


/* =====================================================
   PROFILE FIELD
===================================================== */

function ProfileField({
  label,
  value,
}) {
  return (
    <div className="profile-field">
      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>
    </div>
  );
}


/* =====================================================
   HELPERS
===================================================== */

function getInitials(value) {
  if (!value) {
    return "A";
  }

  const text =
    String(value).trim();

  if (!text) {
    return "A";
  }

  /*
   * Email address
   */
  if (
    text.includes("@")
  ) {
    const emailName =
      text.split("@")[0];

    if (!emailName) {
      return "A";
    }

    return emailName
      .slice(0, 2)
      .toUpperCase();
  }

  /*
   * Normal name / matric number
   */
  const parts =
    text
      .split(/\s+/)
      .filter(Boolean);

  if (
    parts.length >= 2
  ) {
    return (
      parts[0][0] +
      parts[parts.length - 1][0]
    ).toUpperCase();
  }

  return text
    .slice(0, 2)
    .toUpperCase();
}


function formatDate(value) {
  if (!value) {
    return "";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  return date.toLocaleString(
    undefined,
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  );
  }
