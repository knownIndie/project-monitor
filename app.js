const grid = document.querySelector("#project-grid");
const emptyState = document.querySelector("#empty-state");
const template = document.querySelector("#project-card-template");
const filters = document.querySelectorAll("[data-filter]");

const statusRank = { active: 0, complete: 1, inactive: 2, archived: 3 };
let projects = [];

function sortProjects(items) {
  return [...items].sort((a, b) => {
    if (a.pinned !== b.pinned) return Number(b.pinned) - Number(a.pinned);
    const aRank = statusRank[a.status] ?? Number.MAX_SAFE_INTEGER;
    const bRank = statusRank[b.status] ?? Number.MAX_SAFE_INTEGER;
    if (aRank !== bRank) return aRank - bRank;
    return new Date(b.updatedAt) - new Date(a.updatedAt);
  });
}

function render(filter = "all") {
  const visible = projects.filter((project) => filter === "all" || project.status === filter);
  grid.replaceChildren();
  emptyState.hidden = visible.length > 0;

  for (const project of sortProjects(visible)) {
    const card = template.content.firstElementChild.cloneNode(true);
    card.classList.toggle("is-pinned", project.pinned);
    card.querySelector("h3").textContent = project.title;
    card.querySelector(".description").textContent = project.description;

    const status = card.querySelector(".status");
    status.textContent = project.status;
    status.classList.add(`status-${project.status}`);

    const date = card.querySelector("time");
    date.dateTime = project.updatedAt;
    date.textContent = `Updated ${new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(project.updatedAt))}`;

    const openProject = card.querySelector(".open-project");
    openProject.href = project.path;
    openProject.setAttribute("aria-label", `Open ${project.title}`);
    const source = card.querySelector(".source-link");
    source.hidden = !project.sourceRepository;
    if (project.sourceRepository) source.href = project.sourceRepository;
    grid.append(card);
  }
}

filters.forEach((button) => {
  button.addEventListener("click", () => {
    filters.forEach((item) => item.classList.toggle("is-active", item === button));
    render(button.dataset.filter);
  });
});

try {
  const response = await fetch("/data/projects.json");
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  projects = await response.json();
  render();
} catch (error) {
  emptyState.hidden = false;
  emptyState.textContent = "The project index could not be loaded.";
  console.error(error);
}
