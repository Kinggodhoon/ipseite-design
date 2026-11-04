const { screens, principles } = await (await fetch("./catalog.json")).json();
const labels = {
  all: "전체",
  app: "선수 앱",
  admin: "관리자·지도자 웹",
  athlete: "선수 웹",
  system: "공통",
};
const grid = document.querySelector("#screen-grid"),
  search = document.querySelector("input[type=search]"),
  viewer = document.querySelector("#viewer");
let category = "all",
  query = "",
  selected = null,
  returnFocus = null;
const escape = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const filtered = () =>
  screens.filter(
    (s) =>
      (category === "all" || s.category === category) &&
      `${s.id} ${s.title} ${s.group} ${s.description}`
        .toLocaleLowerCase()
        .includes(query),
  );
document.querySelector("#principles").innerHTML = principles
  .map(
    ([title, text]) =>
      `<div><h3>${escape(title)}</h3><p>${escape(text)}</p></div>`,
  )
  .join("");
document.querySelector(".category-tabs").innerHTML = Object.entries(labels)
  .map(
    ([key, label]) =>
      `<button data-category="${key}" aria-pressed="${key === category}">${label}<small>${key === "all" ? screens.length : screens.filter((s) => s.category === key).length}</small></button>`,
  )
  .join("");
function render() {
  const rows = filtered();
  document.querySelector("#result-count").textContent = `${rows.length}개 화면`;
  document.querySelector("#empty").hidden = rows.length > 0;
  grid.innerHTML = rows
    .map(
      (s) =>
        `<article class="screen-card" data-category="${s.category}"><button data-screen="${s.id}" aria-label="${escape(s.id + " " + s.title + " 크게 보기")}"><div class="shot-stage"><img src="${s.thumbnail}" alt="${escape(s.title + " 화면 시안")}" width="${s.thumbnailWidth}" height="${s.thumbnailHeight}" loading="lazy"></div><div class="card-copy"><div class="card-meta"><span>${labels[s.category]} · ${escape(s.group)}</span><span>${s.id}</span></div><h3>${escape(s.title)}</h3><p>${escape(s.headline)}</p></div></button></article>`,
    )
    .join("");
}
function show(id, { hash = true, focus = true } = {}) {
  const s = screens.find((s) => s.id === id);
  if (!s) return;
  if (!viewer.open) returnFocus = document.activeElement;
  selected = id;
  viewer.dataset.category = s.category;
  document.querySelector("#viewer-category").textContent =
    `${labels[s.category]} · ${s.group} · ${s.id}`;
  document.querySelector("#viewer-title").textContent = s.title;
  document.querySelector("#viewer-description").textContent = s.description;
  document.querySelector("#viewer-rules").innerHTML = s.rules
    .map((r) => `<li>${escape(r)}</li>`)
    .join("");
  const image = document.querySelector("#viewer-image");
  image.src = s.image;
  image.alt = `${s.title} 전체 화면 시안`;
  image.width = s.imageWidth;
  image.height = s.imageHeight;
  document.querySelector("#full-image").href = s.image;
  const list = filtered(),
    i = list.findIndex((x) => x.id === id);
  document.querySelector("#viewer-position").textContent =
    i >= 0
      ? `${i + 1} / ${list.length}`
      : `${screens.findIndex((x) => x.id === id) + 1} / ${screens.length}`;
  document.querySelector("#previous-screen").disabled = i <= 0;
  document.querySelector("#next-screen").disabled =
    i < 0 || i === list.length - 1;
  document.querySelector(".screen-stage").scrollTop = 0;
  document.querySelector(".viewer-body").scrollTop = 0;
  if (hash) history.replaceState(null, "", `#${id}`);
  if (!viewer.open) {
    viewer.showModal();
    document.body.style.overflow = "hidden";
    if (focus) document.querySelector("#close-viewer").focus();
  }
}
function close() {
  viewer.close();
  selected = null;
  document.body.style.overflow = "";
  history.replaceState(null, "", location.pathname + location.search);
  if (returnFocus?.isConnected) returnFocus.focus();
}
function step(direction) {
  const rows = filtered(),
    i = rows.findIndex((s) => s.id === selected);
  if (rows[i + direction]) show(rows[i + direction].id);
}
grid.addEventListener("click", (e) => {
  const b = e.target.closest("[data-screen]");
  if (b) show(b.dataset.screen);
});
document.querySelector(".category-tabs").addEventListener("click", (e) => {
  const b = e.target.closest("[data-category]");
  if (!b) return;
  category = b.dataset.category;
  document
    .querySelectorAll(".category-tabs button")
    .forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
  render();
});
search.addEventListener("input", () => {
  query = search.value.trim().toLocaleLowerCase();
  render();
});
document.querySelector("#close-viewer").addEventListener("click", close);
viewer.addEventListener("cancel", (e) => {
  e.preventDefault();
  close();
});
viewer.addEventListener("click", (e) => {
  if (e.target === viewer) {
    const r = viewer.getBoundingClientRect();
    if (
      e.clientX < r.left ||
      e.clientX > r.right ||
      e.clientY < r.top ||
      e.clientY > r.bottom
    )
      close();
  }
});
document
  .querySelector("#previous-screen")
  .addEventListener("click", () => step(-1));
document.querySelector("#next-screen").addEventListener("click", () => step(1));
document.addEventListener("keydown", (e) => {
  if (!viewer.open || ["INPUT", "TEXTAREA"].includes(e.target.tagName)) return;
  if (e.key === "ArrowLeft") step(-1);
  if (e.key === "ArrowRight") step(1);
});
window.addEventListener("hashchange", () => {
  const id = location.hash.slice(1);
  if (id) show(id, { hash: false });
  else if (viewer.open) close();
});
render();
if (location.hash) show(location.hash.slice(1), { hash: false });
