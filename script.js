const body = document.body;
const header = document.querySelector("[data-header]");
const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.querySelector(".site-nav");
const heroSlides = [...document.querySelectorAll(".hero-slides img")];
const packageButtons = [...document.querySelectorAll("[data-package]")];
const quoteForm = document.querySelector("[data-quote-form]");
const successMessage = document.querySelector("[data-form-success]");
const revealItems = [...document.querySelectorAll("[data-reveal]")];

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const packageSummaries = {
  wedding: {
    title: "Wedding Weekend",
    copy:
      "Build a transportation timeline around hotel blocks, venue arrivals, ceremony windows, photo moves, reception returns, and a private getaway ride.",
    items: ["Guest shuttle loops", "Wedding party movement", "Late-night return schedule"],
  },
  airport: {
    title: "Airport Transfer",
    copy:
      "Coordinate one-way or round-trip airport service for IAH and Hobby with pickup windows that align with wedding-weekend or group travel plans.",
    items: ["IAH and Hobby routes", "Round-trip planning", "Luggage-aware vehicle matching"],
  },
  events: {
    title: "Night Out",
    copy:
      "Create a safe, organized ride plan for concerts, games, birthdays, rodeo nights, and private celebrations with multiple stops.",
    items: ["Point-to-point rides", "Multi-stop expeditions", "Group safety planning"],
  },
};

function syncHeader() {
  if (!header) return;
  header.classList.toggle("is-scrolled", window.scrollY > 24);
}

if (navToggle && siteNav) {
  navToggle.addEventListener("click", () => {
    const isOpen = body.classList.toggle("nav-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  siteNav.addEventListener("click", (event) => {
    if (event.target instanceof HTMLAnchorElement) {
      body.classList.remove("nav-open");
      navToggle.setAttribute("aria-expanded", "false");
    }
  });
}

syncHeader();
window.addEventListener("scroll", syncHeader, { passive: true });

if (!reduceMotion && heroSlides.length > 1) {
  let activeSlide = 0;
  window.setInterval(() => {
    heroSlides[activeSlide].classList.remove("is-active");
    activeSlide = (activeSlide + 1) % heroSlides.length;
    heroSlides[activeSlide].classList.add("is-active");
  }, 5200);
}

function updatePackageSummary(packageKey) {
  const summary = packageSummaries[packageKey];
  const title = document.querySelector("[data-summary-title]");
  const copy = document.querySelector("[data-summary-copy]");
  const list = document.querySelector("[data-summary-list]");

  if (!summary || !title || !copy || !list) return;

  title.textContent = summary.title;
  copy.textContent = summary.copy;
  list.replaceChildren(
    ...summary.items.map((item) => {
      const listItem = document.createElement("li");
      listItem.textContent = item;
      return listItem;
    }),
  );
}

packageButtons.forEach((button) => {
  button.addEventListener("click", () => {
    packageButtons.forEach((currentButton) => currentButton.classList.remove("is-selected"));
    button.classList.add("is-selected");
    updatePackageSummary(button.dataset.package);
  });
});

if (revealItems.length) {
  if (reduceMotion) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  } else {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.16 },
    );

    revealItems.forEach((item) => observer.observe(item));
  }
}

if (quoteForm && successMessage) {
  quoteForm.addEventListener("submit", (event) => {
    event.preventDefault();
    successMessage.hidden = false;
    successMessage.focus?.();
  });
}
