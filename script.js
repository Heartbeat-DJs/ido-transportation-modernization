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
    title: "Airport Arrivals",
    copy:
      "Coordinate IAH and Hobby arrivals for family, wedding parties, and out-of-town guests with pickup windows that align with the full wedding-weekend plan.",
    items: ["IAH and Hobby arrivals", "Family and wedding-party pickups", "Room for luggage and formalwear"],
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

const cmsTextMappings = [
  { key: "hero-eyebrow", selector: ".hero-copy .eyebrow" },
  { key: "hero-headline", selector: "#hero-title" },
  { key: "hero-subtext", selector: ".hero-copy p:not(.eyebrow)" },
  { key: "years-in-business", selector: ".card-number" },
  { key: "director-card-sub", selector: ".director-card p" },
  { key: "director-card-strong", selector: ".director-card strong" },
  { key: "experience-headline", selector: "#experience-title" },
  { key: "experience-subtext", selector: ".experience-copy p:not(.eyebrow)" },
  { key: "experience-card-1-title", selector: ".experience-stack article:nth-child(1) h3" },
  { key: "experience-card-1-sub", selector: ".experience-stack article:nth-child(1) p" },
  { key: "experience-card-2-title", selector: ".experience-stack article:nth-child(2) h3" },
  { key: "experience-card-2-sub", selector: ".experience-stack article:nth-child(2) p" },
  { key: "experience-card-3-title", selector: ".experience-stack article:nth-child(3) h3" },
  { key: "experience-card-3-sub", selector: ".experience-stack article:nth-child(3) p" },
  { key: "packages-title", selector: "#packages-title" },
  { key: "package-btn-1-title", selector: ".package-stage button:nth-child(1) strong" },
  { key: "package-btn-1-sub", selector: ".package-stage button:nth-child(1) small" },
  { key: "package-btn-2-title", selector: ".package-stage button:nth-child(2) strong" },
  { key: "package-btn-2-sub", selector: ".package-stage button:nth-child(2) small" },
  { key: "package-btn-3-title", selector: ".package-stage button:nth-child(3) strong" },
  { key: "package-btn-3-sub", selector: ".package-stage button:nth-child(3) small" },
  { key: "fleet-headline", selector: "#fleet-title" },
  { key: "fleet-subtext", selector: ".fleet-copy p:not(.eyebrow)" },
  { key: "venue-headline", selector: "#venues-title" },
  { key: "venue-subtext", selector: ".venue-scene-content p:not(.eyebrow)" },
  { key: "quote-headline", selector: "#reserve-title" },
  { key: "quote-subtext", selector: ".quote-copy p:not(.eyebrow)" },
];

const cmsImageMappings = [
  { key: "hero-slide-1", selector: ".hero-slides img:nth-child(1)" },
  { key: "hero-slide-2", selector: ".hero-slides img:nth-child(2)" },
  { key: "hero-slide-3", selector: ".hero-slides img:nth-child(3)" },
  { key: "package-img-1", selector: ".package-stage button:nth-child(1) img" },
  { key: "package-img-2", selector: ".package-stage button:nth-child(2) img" },
  { key: "package-img-3", selector: ".package-stage button:nth-child(3) img" },
  { key: "fleet-image-1", selector: ".fleet-frame:nth-child(1) img" },
  { key: "fleet-image-2", selector: ".fleet-frame:nth-child(2) img" },
  { key: "fleet-image-3", selector: ".fleet-frame:nth-child(3) img" },
  { key: "fleet-image-4", selector: ".fleet-frame:nth-child(4) img" },
];

function updateContactLink(selector, value, kind) {
  const el = document.querySelector(selector);
  if (!el || !value) return;
  el.textContent = value;
  el.href = kind === "phone" ? `tel:${value.replace(/[^\d+]/g, "")}` : `mailto:${value}`;
}

async function applyCMSContent() {
  try {
    const res = await fetch("/api/content");
    if (!res.ok) return;

    const content = await res.json();
    const root = document.documentElement;

    if (content["accent-1-color"]) root.style.setProperty("--champagne", content["accent-1-color"]);
    if (content["accent-2-color"]) root.style.setProperty("--sage", content["accent-2-color"]);
    if (content["dark-color"]) root.style.setProperty("--ink", content["dark-color"]);
    if (content["light-color"]) root.style.setProperty("--ivory", content["light-color"]);
    if (content["white-color"]) root.style.setProperty("--white", content["white-color"]);

    cmsTextMappings.forEach(({ key, selector }) => {
      const el = document.querySelector(selector);
      if (el && content[key]) el.textContent = content[key];
    });

    cmsImageMappings.forEach(({ key, selector }) => {
      const el = document.querySelector(selector);
      if (el && content[key]) el.setAttribute("src", content[key]);
    });

    updateContactLink('.contact-line a[href^="tel"]', content["contact-phone"], "phone");
    updateContactLink('.contact-line a[href^="mailto"]', content["contact-email"], "email");
  } catch (error) {
    // Static previews do not have the CMS API; the site should continue normally.
  }
}

applyCMSContent();
