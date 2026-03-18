/* ---------------- Supabase 초기화 ---------------- */

const SUPABASE_URL = "https://wjjjsqquodyzjhcneoco.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Uz_EibC48Oi7PixEkI3P5g_m5S1gngz";

let supabaseClient = null;

(function initSupabase() {
  const hasSdk =
    typeof window !== "undefined" &&
    window.supabase &&
    typeof window.supabase.createClient === "function";

  const hasKeys = SUPABASE_URL && SUPABASE_ANON_KEY;

  if (!hasSdk) {
    console.warn("[Supabase] SDK 로드 안됨 → HTML 순서 확인");
    return;
  }

  if (!hasKeys) {
    console.warn("[Supabase] 키 입력 안됨");
    return;
  }

  try {
    supabaseClient = window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY
    );
    console.log("[Supabase] 연결 완료");
  } catch (error) {
    console.error("[Supabase] 초기화 실패:", error);
  }
})();

/* ---------------- 공통 ---------------- */

function getTodayString() {
  const d = new Date();
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}.${String(d.getDate()).padStart(2, "0")}`;
}

function formatDateString(dateValue) {
  if (!dateValue) return "";
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}.${String(d.getDate()).padStart(2, "0")}`;
}

function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/* ---------------- 로그인 ---------------- */

function register() {
  const id = document.getElementById("register-id")?.value.trim();
  const pw = document.getElementById("register-pw")?.value;
  const pw2 = document.getElementById("register-pw2")?.value;

  if (!id || !pw) {
    alert("입력하세요");
    return;
  }

  if (pw2 !== undefined && pw !== pw2) {
    alert("비밀번호가 일치하지 않습니다.");
    return;
  }

  localStorage.setItem("userId", id);
  localStorage.setItem("userPw", pw);

  alert("회원가입 완료");
  location.replace("login.html");
}

function login() {
  const id = document.getElementById("login-id")?.value.trim();
  const pw = document.getElementById("login-pw")?.value;

  if (
    id === localStorage.getItem("userId") &&
    pw === localStorage.getItem("userPw")
  ) {
    localStorage.setItem("isLogin", "true");
    localStorage.setItem("loginUser", id);
    alert("로그인 성공");
    location.replace("index.html");
  } else {
    alert("로그인 실패");
  }
}

function logout() {
  localStorage.removeItem("isLogin");
  localStorage.removeItem("loginUser");
  location.replace("index.html");
}

function checkLoginStatus() {
  const nav = document.querySelector("nav");
  const isLogin = localStorage.getItem("isLogin");
  const user = localStorage.getItem("loginUser");

  if (!nav) return;

  if (isLogin === "true" && user) {
    nav.innerHTML = `
      <a href="index.html">홈</a>
      <a href="posts.html">작품</a>
      <a href="notices.html">공지</a>
      <span class="nav-user">${escapeHtml(user)}님</span>
      <button onclick="logout()">로그아웃</button>
    `;
  }
}

/* ---------------- 공지 ---------------- */

async function getNotices() {
  if (!supabaseClient) {
    console.warn("Supabase 연결 안됨");
    return [];
  }

  const { data, error } = await supabaseClient
    .from("notices")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getNotices error:", error);
    return [];
  }

  return Array.isArray(data) ? data : [];
}

function saveNotices() {}

async function renderNotices() {
  const list = document.getElementById("notice-list");
  const actions = document.getElementById("notice-actions");

  if (!list) return;

  const notices = await getNotices();

  list.innerHTML = notices
    .map(
      (n) => `
      <div class="card clickable-card" onclick="location.href='notice-detail.html?id=${n.id}'">
        <h3>${escapeHtml(n.title)}</h3>
        <small>${escapeHtml(formatDateString(n.created_at))}</small>
        <p>${escapeHtml(n.content)}</p>
      </div>
    `
    )
    .join("");

  if (actions) {
    if (localStorage.getItem("isLogin") === "true") {
      actions.innerHTML = `
        <button onclick="location.href='notice-write.html'">공지 작성</button>
      `;
    } else {
      actions.innerHTML = "";
    }
  }
}

async function renderNoticeDetail() {
  const container = document.getElementById("notice-detail");
  if (!container) return;

  const id = Number(getQueryParam("id"));
  if (!id) {
    container.innerHTML = `<p>존재하지 않는 공지입니다.</p>`;
    return;
  }

  if (!supabaseClient) {
    container.innerHTML = `<p>Supabase 연결 안됨</p>`;
    return;
  }

  const { data, error } = await supabaseClient
    .from("notices")
    .select("*")
    .eq("id", id)
    .single();

  const isLogin = localStorage.getItem("isLogin") === "true";

  if (error || !data) {
    console.error(error);
    container.innerHTML = `<p>존재하지 않는 공지입니다.</p>`;
    return;
  }

  container.innerHTML = `
    <h2>${escapeHtml(data.title)}</h2>
    <small class="detail-date">${escapeHtml(formatDateString(data.created_at))}</small>
    <div class="detail-content">${escapeHtml(data.content).replace(/\n/g, "<br>")}</div>

    ${
      isLogin
        ? `
        <div class="detail-actions">
          <button type="button" onclick="location.href='notice-write.html?id=${id}'">수정</button>
          <button type="button" class="cancel-btn" onclick="deleteNotice(${id})">삭제</button>
        </div>
      `
        : ""
    }
  `;
}

async function addNotice() {
  const title = document.getElementById("notice-title")?.value.trim();
  const content = document.getElementById("notice-content")?.value.trim();

  if (!title || !content) {
    alert("입력하세요");
    return;
  }

  if (!supabaseClient) {
    alert("Supabase 연결 안됨");
    return;
  }

  const { error } = await supabaseClient.from("notices").insert([
    {
      title,
      content
    }
  ]);

  if (error) {
    console.error(error);
    alert("공지 저장 실패");
    return;
  }

  alert("공지 저장 완료");
  location.replace("notices.html");
}

async function loadNoticeToForm() {
  const titleInput = document.getElementById("notice-title");
  const contentInput = document.getElementById("notice-content");
  const submitBtn = document.getElementById("notice-submit-btn");

  if (!titleInput || !contentInput) return;

  const id = getQueryParam("id");
  if (id === null) return;

  if (!supabaseClient) return;

  const { data, error } = await supabaseClient
    .from("notices")
    .select("*")
    .eq("id", Number(id))
    .single();

  if (error || !data) {
    console.error(error);
    return;
  }

  titleInput.value = data.title || "";
  contentInput.value = data.content || "";

  if (submitBtn) {
    submitBtn.textContent = "공지 수정";
    submitBtn.onclick = () => updateNotice(Number(id));
  }
}

async function updateNotice(id) {
  const title = document.getElementById("notice-title")?.value.trim();
  const content = document.getElementById("notice-content")?.value.trim();

  if (!title || !content) {
    alert("입력하세요");
    return;
  }

  if (!supabaseClient) {
    alert("Supabase 연결 안됨");
    return;
  }

  const { error } = await supabaseClient
    .from("notices")
    .update({
      title,
      content
    })
    .eq("id", id);

  if (error) {
    console.error(error);
    alert("공지 수정 실패");
    return;
  }

  location.replace(`notice-detail.html?id=${id}`);
}

async function deleteNotice(id) {
  if (!confirm("이 공지를 삭제하시겠습니까?")) return;

  if (!supabaseClient) {
    alert("Supabase 연결 안됨");
    return;
  }

  const { error } = await supabaseClient
    .from("notices")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(error);
    alert("공지 삭제 실패");
    return;
  }

  location.replace("notices.html");
}

/* ---------------- 홈 하이라이트 ---------------- */

async function renderHomeHighlights() {
  const container = document.getElementById("home-highlight-list");
  if (!container) return;

  const notices = await getNotices();
  const posts = (await getPosts()).map(ensurePostFields);

  const latestNotice = notices.length > 0 ? notices[0] : null;
  const topLikedPost =
    posts.length > 0 ? [...posts].sort((a, b) => b.likes - a.likes)[0] : null;
  const topViewedPost =
    posts.length > 0 ? [...posts].sort((a, b) => b.views - a.views)[0] : null;

  const cards = [];

  if (latestNotice) {
    cards.push(`
      <div class="card highlight-card">
        <div class="badge">최신 공지</div>
        <h3>${escapeHtml(latestNotice.title)}</h3>
        <small>${escapeHtml(formatDateString(latestNotice.created_at))}</small>
        <p>${escapeHtml(String(latestNotice.content).slice(0, 120))}${
      String(latestNotice.content).length > 120 ? "..." : ""
    }</p>
        <a href="notice-detail.html?id=${latestNotice.id}">바로 보기</a>
      </div>
    `);
  } else {
    cards.push(`
      <div class="card highlight-card">
        <div class="badge">최신 공지</div>
        <h3>등록된 공지가 없습니다</h3>
        <p>새로운 공지가 올라오면 이곳에 표시됩니다.</p>
      </div>
    `);
  }

  if (topLikedPost) {
    cards.push(`
      <div class="card highlight-card">
        <div class="badge">좋아요 최다</div>
        <h3>${escapeHtml(topLikedPost.title)}</h3>
        <small>${escapeHtml(topLikedPost.category)} · ${escapeHtml(
      formatDateString(topLikedPost.created_at)
    )} · ${escapeHtml(topLikedPost.author || "익명")}</small>
        <p>${escapeHtml(String(topLikedPost.content).slice(0, 120))}${
      String(topLikedPost.content).length > 120 ? "..." : ""
    }</p>
        <div class="post-meta">
          <span>❤️ ${topLikedPost.likes}</span>
          <span>👁 ${topLikedPost.views}</span>
          <span>💬 ${topLikedPost.comments.length}</span>
        </div>
        <a href="post-detail.html?id=${topLikedPost.id}">작품 보기</a>
      </div>
    `);
  } else {
    cards.push(`
      <div class="card highlight-card">
        <div class="badge">좋아요 최다</div>
        <h3>등록된 작품이 없습니다</h3>
        <p>첫 작품이 등록되면 이곳에 표시됩니다.</p>
      </div>
    `);
  }

  if (topViewedPost) {
    cards.push(`
      <div class="card highlight-card">
        <div class="badge">조회수 최다</div>
        <h3>${escapeHtml(topViewedPost.title)}</h3>
        <small>${escapeHtml(topViewedPost.category)} · ${escapeHtml(
      formatDateString(topViewedPost.created_at)
    )} · ${escapeHtml(topViewedPost.author || "익명")}</small>
        <p>${escapeHtml(String(topViewedPost.content).slice(0, 120))}${
      String(topViewedPost.content).length > 120 ? "..." : ""
    }</p>
        <div class="post-meta">
          <span>❤️ ${topViewedPost.likes}</span>
          <span>👁 ${topViewedPost.views}</span>
          <span>💬 ${topViewedPost.comments.length}</span>
        </div>
        <a href="post-detail.html?id=${topViewedPost.id}">작품 보기</a>
      </div>
    `);
  } else {
    cards.push(`
      <div class="card highlight-card">
        <div class="badge">조회수 최다</div>
        <h3>등록된 작품이 없습니다</h3>
        <p>작품이 등록되면 이곳에 표시됩니다.</p>
      </div>
    `);
  }

  container.innerHTML = cards.join("");
}

/* ---------------- 작품 ---------------- */

async function getPosts() {
  if (!supabaseClient) {
    console.warn("Supabase 연결 안됨");
    return [];
  }

  const { data, error } = await supabaseClient
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getPosts error:", error);
    return [];
  }

  return Array.isArray(data) ? data : [];
}

function savePosts(data) {
  localStorage.setItem("posts", JSON.stringify(data));
}

function ensurePostFields(post) {
  return {
    ...post,
    author: post.author || "익명",
    timestamp: Number(post.timestamp || 0),
    likes: Number(post.likes || 0),
    views: Number(post.views || 0),
    comments: Array.isArray(post.comments)
      ? post.comments.map((c) => ({
          ...c,
          likes: Number(c.likes || 0)
        }))
      : []
  };
}

function getLikedPosts() {
  return JSON.parse(localStorage.getItem("likedPosts") || "[]");
}

function saveLikedPosts(data) {
  localStorage.setItem("likedPosts", JSON.stringify(data));
}

function hasLikedPost(postId) {
  const liked = getLikedPosts();
  return liked.includes(postId);
}

async function togglePostLike(postId) {
  const posts = (await getPosts()).map(ensurePostFields);
  const targetIndex = posts.findIndex((p) => Number(p.id) === Number(postId));
  if (targetIndex === -1) return;

  const liked = getLikedPosts();
  const likedIndex = liked.indexOf(postId);

  posts[targetIndex] = ensurePostFields(posts[targetIndex]);

  if (likedIndex !== -1) {
    posts[targetIndex].likes = Math.max(0, posts[targetIndex].likes - 1);
    liked.splice(likedIndex, 1);
  } else {
    posts[targetIndex].likes += 1;
    liked.push(postId);
  }

  if (supabaseClient) {
    const { error } = await supabaseClient
      .from("posts")
      .update({ likes: posts[targetIndex].likes })
      .eq("id", postId);

    if (error) {
      console.error(error);
      alert("좋아요 저장 실패");
      return;
    }
  }

  saveLikedPosts(liked);

  await renderPostDetail();
  await renderPosts();
  await renderHomeHighlights();
}

async function increasePostView(postId) {
  const viewKey = `viewed_post_${postId}`;
  const alreadyViewed = sessionStorage.getItem(viewKey);

  if (alreadyViewed === "true") return;

  const posts = (await getPosts()).map(ensurePostFields);
  const target = posts.find((p) => Number(p.id) === Number(postId));
  if (!target) return;

  const nextViews = Number(target.views || 0) + 1;

  if (supabaseClient) {
    const { error } = await supabaseClient
      .from("posts")
      .update({ views: nextViews })
      .eq("id", postId);

    if (error) {
      console.error(error);
      return;
    }
  }

  sessionStorage.setItem(viewKey, "true");
}

function getLikedComments() {
  return JSON.parse(localStorage.getItem("likedComments") || "[]");
}

function saveLikedComments(data) {
  localStorage.setItem("likedComments", JSON.stringify(data));
}

function hasLikedComment(postId, commentIndex) {
  const liked = getLikedComments();
  return liked.includes(`${postId}_${commentIndex}`);
}

async function toggleCommentLike(postId, commentIndex) {
  const posts = (await getPosts()).map(ensurePostFields);
  const targetIndex = posts.findIndex((p) => Number(p.id) === Number(postId));
  if (targetIndex === -1) return;

  const comment = posts[targetIndex].comments[commentIndex];
  if (!comment) return;

  const liked = getLikedComments();
  const key = `${postId}_${commentIndex}`;
  const likedIndex = liked.indexOf(key);

  if (likedIndex !== -1) {
    comment.likes = Math.max(0, Number(comment.likes || 0) - 1);
    liked.splice(likedIndex, 1);
  } else {
    comment.likes = Number(comment.likes || 0) + 1;
    liked.push(key);
  }

  if (supabaseClient) {
    const { error } = await supabaseClient
      .from("posts")
      .update({ comments: posts[targetIndex].comments })
      .eq("id", postId);

    if (error) {
      console.error(error);
      alert("댓글 좋아요 저장 실패");
      return;
    }
  }

  saveLikedComments(liked);
  await renderPostDetail();
  await renderPosts();
}

async function addComment(postId) {
  const isLogin = localStorage.getItem("isLogin") === "true";
  const loginUser = localStorage.getItem("loginUser");
  const input = document.getElementById("comment-input");

  if (!input) return;

  const text = input.value.trim();

  if (!isLogin || !loginUser) {
    alert("로그인 후 댓글을 작성할 수 있습니다.");
    return;
  }

  if (!text) {
    alert("댓글 내용을 입력하세요");
    return;
  }

  const posts = (await getPosts()).map(ensurePostFields);
  const targetIndex = posts.findIndex((p) => Number(p.id) === Number(postId));
  if (targetIndex === -1) return;

  posts[targetIndex].comments.unshift({
    user: loginUser,
    text,
    date: getTodayString(),
    likes: 0
  });

  if (supabaseClient) {
    const { error } = await supabaseClient
      .from("posts")
      .update({ comments: posts[targetIndex].comments })
      .eq("id", postId);

    if (error) {
      console.error(error);
      alert("댓글 저장 실패");
      return;
    }
  }

  input.value = "";
  await renderPostDetail();
  await renderPosts();
}

function renderComments(post, postId) {
  const comments = Array.isArray(post.comments) ? post.comments : [];

  if (comments.length === 0) {
    return `<p class="empty-comment">아직 댓글이 없습니다.</p>`;
  }

  return comments
    .map((c, i) => {
      const liked = hasLikedComment(postId, i);

      return `
        <div class="comment-item">
          <div class="comment-head">
            <strong>${escapeHtml(c.user)}</strong>
            <small>${escapeHtml(c.date)}</small>
          </div>
          <p>${escapeHtml(c.text).replace(/\n/g, "<br>")}</p>
          <button
            type="button"
            class="like-btn comment-like-btn ${liked ? "liked" : ""}"
            onclick="toggleCommentLike(${postId}, ${i})"
            aria-label="댓글 좋아요"
          >
            <span class="like-icon">${liked ? "❤️" : "🤍"}</span>
            <span class="like-count">${Number(c.likes || 0)}</span>
          </button>
        </div>
      `;
    })
    .join("");
}

async function renderPosts() {
  const list = document.getElementById("post-list");
  const actions = document.getElementById("post-actions");
  const searchInput = document.getElementById("post-search");
  const categorySelect = document.getElementById("post-filter-category");
  const sortSelect = document.getElementById("post-sort");

  if (!list) return;

  const originalPosts = (await getPosts()).map(ensurePostFields);
  const keyword = searchInput?.value.trim().toLowerCase() || "";
  const selectedCategory = categorySelect?.value || "전체";
  const sortType = sortSelect?.value || "latest";

  let posts = [...originalPosts];

  if (keyword) {
    posts = posts.filter((p) => {
      const title = String(p.title || "").toLowerCase();
      const content = String(p.content || "").toLowerCase();
      const category = String(p.category || "").toLowerCase();
      const author = String(p.author || "").toLowerCase();

      return (
        title.includes(keyword) ||
        content.includes(keyword) ||
        category.includes(keyword) ||
        author.includes(keyword)
      );
    });
  }

  if (selectedCategory !== "전체") {
    posts = posts.filter((p) => p.category === selectedCategory);
  }

  if (sortType === "views") {
    posts.sort((a, b) => b.views - a.views);
  } else if (sortType === "likes") {
    posts.sort((a, b) => b.likes - a.likes);
  } else if (sortType === "comments") {
    posts.sort((a, b) => b.comments.length - a.comments.length);
  } else {
    posts.sort((a, b) => {
      const bTime = new Date(b.created_at || 0).getTime();
      const aTime = new Date(a.created_at || 0).getTime();
      return bTime - aTime;
    });
  }

  if (posts.length === 0) {
    list.innerHTML = `<p>조건에 맞는 작품이 없습니다.</p>`;
  } else {
    list.innerHTML = posts
      .map(
        (p) => `
        <div class="card">
          <h3>${escapeHtml(p.title)}</h3>
          <small>${escapeHtml(p.category)} · ${escapeHtml(
          formatDateString(p.created_at)
        )} · ${escapeHtml(p.author || "익명")}</small>
          <p>${escapeHtml(String(p.content).slice(0, 120))}${
            String(p.content).length > 120 ? "..." : ""
          }</p>
          <div class="post-meta">
            <span>❤️ ${Number(p.likes || 0)}</span>
            <span>👁 ${Number(p.views || 0)}</span>
            <span>💬 ${
              Array.isArray(p.comments) ? p.comments.length : 0
            }</span>
          </div>
          <a href="post-detail.html?id=${p.id}">읽어보기</a>
        </div>
      `
      )
      .join("");
  }

  if (actions) {
    if (localStorage.getItem("isLogin") === "true") {
      actions.innerHTML = `
        <button onclick="location.href='post-write.html'">작품 작성</button>
      `;
    } else {
      actions.innerHTML = "";
    }
  }
}

async function renderPostDetail() {
  const container = document.getElementById("post-detail");
  if (!container) return;

  const id = Number(getQueryParam("id"));
  if (!id) {
    container.innerHTML = `<p>존재하지 않는 작품입니다.</p>`;
    return;
  }

  if (!supabaseClient) {
    container.innerHTML = `<p>Supabase 연결 안됨</p>`;
    return;
  }

  const { data, error } = await supabaseClient
    .from("posts")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    console.error(error);
    container.innerHTML = `<p>존재하지 않는 작품입니다.</p>`;
    return;
  }

  await increasePostView(id);

  const { data: refreshedData, error: refreshedError } = await supabaseClient
    .from("posts")
    .select("*")
    .eq("id", id)
    .single();

  if (refreshedError || !refreshedData) {
    console.error(refreshedError);
    container.innerHTML = `<p>존재하지 않는 작품입니다.</p>`;
    return;
  }

  const post = ensurePostFields(refreshedData);
  const liked = hasLikedPost(id);
  const isLogin = localStorage.getItem("isLogin") === "true";

  container.innerHTML = `
    <h2>${escapeHtml(post.title)}</h2>
    <small class="detail-date">${escapeHtml(post.category)} · ${escapeHtml(
    formatDateString(post.created_at)
  )} · ${escapeHtml(post.author || "익명")}</small>

    <div class="detail-content">${escapeHtml(post.content).replace(
      /\n/g,
      "<br>"
    )}</div>

    <div class="detail-stats">
      <span>❤️ 좋아요 ${Number(post.likes || 0)}</span>
      <span>👁 조회수 ${Number(post.views || 0)}</span>
      <span>💬 댓글 ${
        Array.isArray(post.comments) ? post.comments.length : 0
      }</span>
    </div>

    <div class="detail-actions">
      <button
        type="button"
        class="like-btn post-like-btn ${liked ? "liked" : ""}"
        onclick="togglePostLike(${id})"
        aria-label="작품 좋아요"
      >
        <span class="like-icon">${liked ? "❤️" : "🤍"}</span>
        <span class="like-count">${Number(post.likes || 0)}</span>
      </button>

      ${
        isLogin
          ? `
          <button type="button" onclick="location.href='post-write.html?id=${id}'">수정</button>
          <button type="button" class="cancel-btn" onclick="deletePost(${id})">삭제</button>
        `
          : ""
      }
    </div>

    <section class="comment-section">
      <h3>댓글</h3>

      ${
        isLogin
          ? `
          <div class="comment-form">
            <textarea id="comment-input" placeholder="댓글을 입력하세요"></textarea>
            <button type="button" onclick="addComment(${id})">댓글 작성</button>
          </div>
        `
          : `
          <p class="comment-login-msg">댓글 작성은 로그인 후 가능합니다.</p>
        `
      }

      <div class="comment-list">
        ${renderComments(post, id)}
      </div>
    </section>
  `;
}

async function addPost() {
  const title = document.getElementById("post-title")?.value.trim();
  const category = document.getElementById("post-category")?.value.trim();
  const content = document.getElementById("post-content")?.value.trim();
  const loginUser = localStorage.getItem("loginUser") || "익명";

  if (!title) {
    alert("제목을 입력하세요");
    return;
  }

  if (!category) {
    alert("장르를 선택하세요");
    return;
  }

  if (!content) {
    alert("내용을 입력하세요");
    return;
  }

  if (!supabaseClient) {
    alert("Supabase 연결 안됨");
    return;
  }

  const { error } = await supabaseClient.from("posts").insert([
    {
      title,
      content,
      category,
      author: loginUser,
      likes: 0,
      views: 0,
      comments: []
    }
  ]);

  if (error) {
    console.error(error);
    alert("저장 실패");
    return;
  }

  alert("저장 완료");
  location.replace("posts.html");
}

async function loadPostToForm() {
  const titleInput = document.getElementById("post-title");
  const categoryInput = document.getElementById("post-category");
  const contentInput = document.getElementById("post-content");
  const submitBtn = document.getElementById("post-submit-btn");

  if (!titleInput || !categoryInput || !contentInput) return;

  const id = getQueryParam("id");
  if (id === null) return;

  if (!supabaseClient) return;

  const { data, error } = await supabaseClient
    .from("posts")
    .select("*")
    .eq("id", Number(id))
    .single();

  if (error || !data) {
    console.error(error);
    return;
  }

  titleInput.value = data.title || "";
  categoryInput.value = data.category || "";
  contentInput.value = data.content || "";

  if (submitBtn) {
    submitBtn.textContent = "작품 수정";
    submitBtn.onclick = () => updatePost(Number(id));
  }
}

async function updatePost(id) {
  const title = document.getElementById("post-title")?.value.trim();
  const category = document.getElementById("post-category")?.value.trim();
  const content = document.getElementById("post-content")?.value.trim();

  if (!title) {
    alert("제목을 입력하세요");
    return;
  }

  if (!category) {
    alert("장르를 선택하세요");
    return;
  }

  if (!content) {
    alert("내용을 입력하세요");
    return;
  }

  if (!supabaseClient) {
    alert("Supabase 연결 안됨");
    return;
  }

  const { error } = await supabaseClient
    .from("posts")
    .update({
      title,
      category,
      content
    })
    .eq("id", id);

  if (error) {
    console.error(error);
    alert("수정 실패");
    return;
  }

  location.replace(`post-detail.html?id=${id}`);
}

async function deletePost(id) {
  if (!confirm("이 작품을 삭제하시겠습니까?")) return;

  if (!supabaseClient) {
    alert("Supabase 연결 안됨");
    return;
  }

  const { error } = await supabaseClient.from("posts").delete().eq("id", id);

  if (error) {
    console.error(error);
    alert("삭제 실패");
    return;
  }

  location.replace("posts.html");
}

/* ---------------- 갤러리 ---------------- */

function getGallery() {
  return JSON.parse(localStorage.getItem("gallery") || "[]");
}

function saveGallery(data) {
  localStorage.setItem("gallery", JSON.stringify(data));
}

function renderGallery(category = "전체") {
  const list = document.getElementById("gallery-list");
  const actions = document.getElementById("gallery-actions");
  const isLogin = localStorage.getItem("isLogin") === "true";

  if (!list) return;

  const data = getGallery();

  const filtered =
    category === "전체"
      ? data
      : data.filter((d) => d.category === category);

  list.innerHTML = filtered
    .map((g) => {
      const originalIndex = data.findIndex((item) => {
        return (
          item.title === g.title &&
          item.date === g.date &&
          item.desc === g.desc &&
          item.image === g.image
        );
      });

      return `
        <div class="gallery-card">
          <img src="${g.image}" alt="${escapeHtml(
        g.title
      )}" onclick="openImageModal('${g.image}')" />
          <h3>${escapeHtml(g.title)}</h3>
          <small>${escapeHtml(g.category)} · ${escapeHtml(g.date)}</small>
          <p>${escapeHtml(g.desc)}</p>

          ${
            isLogin
              ? `
              <div class="detail-actions">
                <button type="button" onclick="location.href='gallery-write.html?id=${originalIndex}'">수정</button>
                <button type="button" class="cancel-btn" onclick="deleteGallery(${originalIndex})">삭제</button>
              </div>
            `
              : ""
          }
        </div>
      `;
    })
    .join("");

  if (actions) {
    if (isLogin) {
      actions.innerHTML = `
        <button onclick="location.href='gallery-write.html'">사진 추가</button>
      `;
    } else {
      actions.innerHTML = "";
    }
  }
}

function filterGallery(category) {
  renderGallery(category);
}

function addGallery() {
  const title = document.getElementById("gallery-title")?.value.trim();
  const category = document.getElementById("gallery-category")?.value;
  const file = document.getElementById("gallery-file")?.files[0];
  const desc = document.getElementById("gallery-desc")?.value.trim();

  if (!title || !file) {
    alert("입력하세요");
    return;
  }

  const reader = new FileReader();

  reader.onload = function (e) {
    const data = getGallery();

    data.unshift({
      title,
      category,
      desc,
      image: e.target.result,
      date: getTodayString(),
      timestamp: Date.now()
    });

    saveGallery(data);
    location.replace("gallery.html");
  };

  reader.readAsDataURL(file);
}

function loadGalleryToForm() {
  const titleInput = document.getElementById("gallery-title");
  const categoryInput = document.getElementById("gallery-category");
  const descInput = document.getElementById("gallery-desc");
  const submitBtn = document.getElementById("gallery-submit-btn");

  if (!titleInput || !categoryInput || !descInput) return;

  const id = getQueryParam("id");
  if (id === null) return;

  const gallery = getGallery();
  const item = gallery[Number(id)];
  if (!item) return;

  titleInput.value = item.title || "";
  categoryInput.value = item.category || "";
  descInput.value = item.desc || "";

  if (submitBtn) {
    submitBtn.textContent = "사진 수정";
    submitBtn.onclick = () => updateGallery(Number(id));
  }
}

function updateGallery(id) {
  const title = document.getElementById("gallery-title")?.value.trim();
  const category = document.getElementById("gallery-category")?.value;
  const desc = document.getElementById("gallery-desc")?.value.trim();
  const file = document.getElementById("gallery-file")?.files[0];

  if (!title) {
    alert("제목을 입력하세요");
    return;
  }

  const gallery = getGallery();
  if (!gallery[id]) return;

  const applyUpdate = (imageValue) => {
    gallery[id] = {
      ...gallery[id],
      title,
      category,
      desc,
      image: imageValue
    };

    saveGallery(gallery);
    location.replace("gallery.html");
  };

  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      applyUpdate(e.target.result);
    };
    reader.readAsDataURL(file);
  } else {
    applyUpdate(gallery[id].image);
  }
}

function deleteGallery(id) {
  const gallery = getGallery();
  if (!gallery[id]) return;

  if (!confirm("이 사진을 삭제하시겠습니까?")) return;

  gallery.splice(id, 1);
  saveGallery(gallery);
  location.replace("gallery.html");
}

/* ---------------- 이미지 모달 ---------------- */

function openImageModal(src) {
  const modal = document.getElementById("image-modal");
  const image = document.getElementById("modal-image");

  if (!modal || !image) return;

  image.src = src;
  modal.classList.add("show");
}

function closeImageModal() {
  const modal = document.getElementById("image-modal");
  if (!modal) return;
  modal.classList.remove("show");
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeImageModal();
  }
});

/* ---------------- 자동 실행 ---------------- */

document.addEventListener("DOMContentLoaded", async () => {
  checkLoginStatus();

  await renderNotices();
  await renderNoticeDetail();

  await renderPosts();
  await renderPostDetail();

  renderGallery();

  if (document.getElementById("home-highlight-list")) {
    await renderHomeHighlights();
  }

  await loadNoticeToForm();
  await loadPostToForm();
  loadGalleryToForm();

  const searchInput = document.getElementById("post-search");
  const categorySelect = document.getElementById("post-filter-category");
  const sortSelect = document.getElementById("post-sort");

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      renderPosts();
    });
  }

  if (categorySelect) {
    categorySelect.addEventListener("change", () => {
      renderPosts();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener("change", () => {
      renderPosts();
    });
  }
});

function cancelTo(fallbackUrl) {
  const referrer = document.referrer;

  if (referrer) {
    try {
      const refUrl = new URL(referrer);
      const currentOrigin = window.location.origin;

      if (
        refUrl.origin === currentOrigin &&
        !refUrl.pathname.endsWith("notice-write.html") &&
        !refUrl.pathname.endsWith("post-write.html") &&
        !refUrl.pathname.endsWith("gallery-write.html")
      ) {
        history.back();
        return;
      }
    } catch (e) {
      // 무시하고 fallback으로 이동
    }
  }

  location.replace(fallbackUrl);
}