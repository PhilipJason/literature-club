/* ---------------- 공통 ---------------- */

function getTodayString() {
  const d = new Date();
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

/* ---------------- 로그인 ---------------- */

function register() {
  const id = document.getElementById("register-id")?.value.trim();
  const pw = document.getElementById("register-pw")?.value;

  if (!id || !pw) {
    alert("입력하세요");
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
      <span class="nav-user">${user}님</span>
      <button onclick="logout()">로그아웃</button>
    `;
  }
}

/* ---------------- 공지 ---------------- */

function getNotices() {
  return JSON.parse(localStorage.getItem("notices") || "[]");
}

function saveNotices(data) {
  localStorage.setItem("notices", JSON.stringify(data));
}

function renderNotices() {
  const list = document.getElementById("notice-list");
  const actions = document.getElementById("notice-actions");

  if (!list) return;

  const notices = getNotices();

  list.innerHTML = notices
    .map(
      (n, index) => `
      <div class="card clickable-card" onclick="location.href='notice-detail.html?id=${index}'">
        <h3>${n.title}</h3>
        <small>${n.date}</small>
        <p>${n.content}</p>
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

function renderNoticeDetail() {
  const container = document.getElementById("notice-detail");
  if (!container) return;

  const id = Number(getQueryParam("id"));
  const notices = getNotices();
  const notice = notices[id];

  if (!notice) {
    container.innerHTML = `<p>존재하지 않는 공지입니다.</p>`;
    return;
  }

  container.innerHTML = `
    <h2>${notice.title}</h2>
    <small class="detail-date">${notice.date}</small>
    <div class="detail-content">${notice.content}</div>
  `;
}

function addNotice() {
  const title = document.getElementById("notice-title")?.value.trim();
  const content = document.getElementById("notice-content")?.value.trim();

  if (!title || !content) {
    alert("입력하세요");
    return;
  }

  const data = getNotices();

  data.unshift({
    title,
    content,
    date: getTodayString()
  });

  saveNotices(data);
  location.replace("notices.html");
}

/* ---------------- 작품 ---------------- */

function getPosts() {
  return JSON.parse(localStorage.getItem("posts") || "[]");
}

function savePosts(data) {
  localStorage.setItem("posts", JSON.stringify(data));
}

function renderPosts() {
  const list = document.getElementById("post-list");
  const actions = document.getElementById("post-actions");

  if (!list) return;

  const posts = getPosts();

  list.innerHTML = posts
    .map(
      (p, index) => `
      <div class="card">
        <h3>${p.title}</h3>
        <small>${p.category} · ${p.date}</small>
        <p>${p.content}</p>
        <a href="post-detail.html?id=${index}">읽어보기</a>
      </div>
    `
    )
    .join("");

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

function renderPostDetail() {
  const container = document.getElementById("post-detail");
  if (!container) return;

  const id = Number(getQueryParam("id"));
  const posts = getPosts();
  const post = posts[id];

  if (!post) {
    container.innerHTML = `<p>존재하지 않는 작품입니다.</p>`;
    return;
  }

  container.innerHTML = `
    <h2>${post.title}</h2>
    <small class="detail-date">${post.category} · ${post.date}</small>
    <div class="detail-content">${post.content}</div>
  `;
}

function addPost() {
  const title = document.getElementById("post-title")?.value.trim();
  const category = document.getElementById("post-category")?.value.trim();
  const content = document.getElementById("post-content")?.value.trim();

  if (!title || !category || !content) {
    alert("입력하세요");
    return;
  }

  const data = getPosts();

  data.unshift({
    title,
    category,
    content,
    date: getTodayString()
  });

  savePosts(data);
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

  if (!list) return;

  const data = getGallery();

  const filtered =
    category === "전체"
      ? data
      : data.filter((d) => d.category === category);

  list.innerHTML = filtered
    .map(
      (g) => `
      <div class="gallery-card">
        <img src="${g.image}" alt="${g.title}" onclick="openImageModal('${g.image}')" />
        <h3>${g.title}</h3>
        <small>${g.category} · ${g.date}</small>
        <p>${g.desc}</p>
      </div>
    `
    )
    .join("");

  if (actions) {
    if (localStorage.getItem("isLogin") === "true") {
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
      date: getTodayString()
    });

    saveGallery(data);
    location.replace("gallery.html");
  };

  reader.readAsDataURL(file);
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

document.addEventListener("DOMContentLoaded", () => {
  checkLoginStatus();
  renderNotices();
  renderPosts();
  renderGallery();
  renderNoticeDetail();
  renderPostDetail();
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