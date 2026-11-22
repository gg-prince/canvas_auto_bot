const grid = document.querySelector("#intake-grid");
const yearFilter = document.querySelector("#yearFilter");
const monthFilter = document.querySelector("#monthFilter");
const filterBar = document.querySelector("#filters");
const empty = document.querySelector("#empty-state");
let intakes = [];
let activeFilter = "all";

function renderFilters() {
  const majors = [...new Set(intakes.map(i => i.major).filter(Boolean))];
  filterBar.innerHTML = `<button class="filter ${activeFilter==="all"?"active":""}" data-filter="all">All Programs</button>` +
    majors.map(m => `<button class="filter ${activeFilter===m?"active":""}" data-filter="${escapeHtml(m)}">${escapeHtml(m)}</button>`).join("");
}
function escapeHtml(s="") { return String(s).replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
function render() {
  const selectedYear = yearFilter.value;
  const selectedMonth = monthFilter.value;

  const filtered = intakes.filter(i => {
    const matchesMajor =
      activeFilter === "all" || i.major === activeFilter;

    const matchesYear =
      !selectedYear || i.name.includes(selectedYear);

    const matchesMonth =
      !selectedMonth || i.name.includes(selectedMonth);

    return matchesMajor && matchesYear && matchesMonth;
  });

  grid.innerHTML = filtered.map(i => {
    const active = Boolean(i.active && i.groupLink);

    const destination = active
      ? i.groupLink
      : `/submit.html?intake=${encodeURIComponent(i.id)}`;

    return `
      <a
        class="intake-card"
        href="${escapeHtml(destination)}"
        ${active ? 'target="_blank" rel="noopener noreferrer"' : ''}
      >
        <div class="intake-top">
          <span class="intake-code">${escapeHtml(i.code)}</span>

          <span class="status ${active ? "active" : "pending"}">
            ${active ? "Active" : "Pending..."}
          </span>
        </div>

        <h3>${escapeHtml(i.name)}</h3>

        <p>
          ${active
            ? "Join your intake's WhatsApp reminder group."
            : "Submit your Canvas calendar to activate reminders."}
        </p>

        <span class="card-action">
          ${active ? "Join WhatsApp group" : "Submit calendar link"}
          <span>↗</span>
        </span>
      </a>
`;}).join("");

  empty.hidden = filtered.length !== 0;
}
yearFilter.addEventListener("change", render);
monthFilter.addEventListener("change", render);
filterBar.addEventListener("click", e => { const b=e.target.closest("[data-filter]"); if(!b)return; activeFilter=b.dataset.filter; renderFilters();render(); });
async function init() {
  try {
    const res = await fetch("data/intakes.json");
    if (!res.ok) throw new Error("Could not load intake list");
    const data = await res.json();
    intakes = data.intakes || [];
    if (data.campaignImage) document.querySelector("#campaign-image").src = data.campaignImage;
    if (data.campaignCaption) document.querySelector("#campaign-caption").textContent = data.campaignCaption;
    renderFilters();render();
  } catch(err) {
    grid.innerHTML = `<div class="loading-card">The intake list could not be loaded. Please try refreshing.</div>`;
  }
}
init();

const adminTrigger = document.querySelector('#admin-trigger');

let clickCount = 0;
let clickTimer;

adminTrigger.addEventListener('click', (event) => {

    event.preventDefault();

    clickCount++;

    clearTimeout(clickTimer);

    if (clickCount >= 7) {
        window.location.href = '/admin/login.html';
        return;
    }

    clickTimer = setTimeout(() => {
        clickCount = 0;
    }, 3000);

});

document.addEventListener('click', (event) => {

    if (!adminTrigger.contains(event.target)) {
        clickCount = 0;
        clearTimeout(clickTimer);
    }

});