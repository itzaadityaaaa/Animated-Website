
const $ = (selector, parent = document) =>
  parent.querySelector(selector);

const $$ = (selector, parent = document) =>
  [...parent.querySelectorAll(selector)];

const reduceMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

// 1. LOADING SCREEN
const loader = $(".loader");

if (!reduceMotion) {
  window.addEventListener("load", () => {
    setTimeout(() => loader.classList.add("done"), 900);
  });

  // Fallback if external images load slowly
  setTimeout(() => loader.classList.add("done"), 2500);
} else {
  loader.classList.add("done");
}

// 2. SCROLL PROGRESS + STICKY NAVBAR
const progressBar = $(".progress span");
const navbar = $(".navbar");

function updateScroll() {
  const maxScroll =
    document.documentElement.scrollHeight - window.innerHeight;

  const percentage = maxScroll > 0
    ? window.scrollY / maxScroll
    : 0;

  progressBar.style.transform = `scaleX(${percentage})`;

  navbar.classList.toggle("scrolled", window.scrollY > 30);
}

window.addEventListener("scroll", updateScroll, {
  passive: true
});

updateScroll();

// 3. REVEAL SECTIONS WHILE SCROLLING
const revealObserver = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.12,
    rootMargin: "0px 0px -30px 0px"
  }
);

$$(".reveal").forEach(element => {
  revealObserver.observe(element);
});

// Make content visible if JavaScript is running but
// IntersectionObserver is not supported.
if (!("IntersectionObserver" in window)) {
  $$(".reveal").forEach(element => {
    element.classList.add("visible");
  });
}

// 4. MOBILE NAVIGATION
const menuButton = $(".menu-button");
const mobileMenu = $(".mobile-menu");

function closeMenu() {
  mobileMenu.classList.remove("open");
  document.body.classList.remove("menu-open");
  menuButton.textContent = "☰";
  menuButton.setAttribute("aria-expanded", "false");
}

menuButton.setAttribute("aria-expanded", "false");

menuButton.addEventListener("click", () => {
  const isOpen = mobileMenu.classList.toggle("open");

  document.body.classList.toggle("menu-open", isOpen);
  menuButton.textContent = isOpen ? "✕" : "☰";
  menuButton.setAttribute("aria-expanded", String(isOpen));
});

$$(".mobile-menu a").forEach(link => {
  link.addEventListener("click", closeMenu);
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") closeMenu();
});

// 5. ACCORDION FOR PRODUCT DETAILS
$$(".accordion-button").forEach(button => {
  button.addEventListener("click", () => {
    const content = button.nextElementSibling;
    const wasOpen = content.classList.contains("open");

    // Close other rows
    $$(".accordion-content").forEach(item => {
      item.classList.remove("open");
    });

    $$(".accordion-button").forEach(item => {
      item.classList.remove("active");
      item.setAttribute("aria-expanded", "false");
    });

    // Toggle the selected row
    if (!wasOpen) {
      content.classList.add("open");
      button.classList.add("active");
      button.setAttribute("aria-expanded", "true");
    }
  });
});

// 6. BATTERY COUNTER + PROGRESS LINE
const batteryCard = $(".battery-card");

const batteryObserver = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;

      const counter = $(".counter", entry.target);
      const target = Number(counter.dataset.target);

      if (reduceMotion) {
        counter.textContent = target;
      } else {
        const start = performance.now();
        const duration = 1400;

        function countUp(now) {
          const progress = Math.min(
            (now - start) / duration,
            1
          );

          // Smooth ease-out
          const eased = 1 - Math.pow(1 - progress, 4);

          counter.textContent = Math.round(target * eased);

          if (progress < 1) {
            requestAnimationFrame(countUp);
          }
        }

        requestAnimationFrame(countUp);
      }

      $(".battery-line", entry.target)
        .classList.add("active");

      observer.unobserve(entry.target);
    });
  },
  { threshold: 0.35 }
);

if (batteryCard) batteryObserver.observe(batteryCard);

// 7. PRODUCT COLOUR PICKER
const productImage = $("#buyProduct img");
const colourName = $(".colour-name");

$$(".swatch").forEach(button => {
  button.addEventListener("click", () => {
    $$(".swatch").forEach(swatch => {
      swatch.classList.remove("active");
    });

    button.classList.add("active");

    const colour = button.dataset.colour;
    colourName.textContent = colour.toUpperCase();

    // These are visual filters for the concept preview.
    // Real colour variants should use separate product images.
    const filters = {
      Midnight: "grayscale(.8) contrast(1.1)",
      Stone: "grayscale(.2) brightness(1.18)",
      Lime: "sepia(.35) saturate(1.6) hue-rotate(18deg)"
    };

    productImage.style.filter = filters[colour] || "none";

    productImage.animate(
      [
        { opacity: 0.4, transform: "rotate(-8deg) scale(.96)" },
        { opacity: 1, transform: "rotate(-12deg) scale(1)" }
      ],
      {
        duration: 450,
        easing: "ease-out"
      }
    );
  });
});

// 8. SUBTLE 3D MOUSE TILT
if (window.matchMedia("(pointer: fine)").matches && !reduceMotion) {
  const heroStage = $("#heroStage");
  const heroProduct = $(".hero-product");

  heroStage.addEventListener("pointermove", event => {
    const rect = heroStage.getBoundingClientRect();

    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;

    heroProduct.style.transform =
      `translate(calc(-50% + ${x * 16}px), ` +
      `calc(-50% + ${y * 16}px)) rotate(${x * 7 - 6}deg)`;
  });

  heroStage.addEventListener("pointerleave", () => {
    heroProduct.style.transform = "";
  });
}

// 9. MAGNETIC BUTTON HOVER
if (window.matchMedia("(pointer: fine)").matches && !reduceMotion) {
  $$(".magnetic").forEach(element => {
    element.addEventListener("pointermove", event => {
      const rect = element.getBoundingClientRect();

      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;

      element.style.transform =
        `translate(${x * 0.12}px, ${y * 0.12}px)`;
    });

    element.addEventListener("pointerleave", () => {
      element.style.transform = "";
    });
  });
}

// 10. CUSTOM DESKTOP CURSOR
const cursor = $(".cursor");

if (window.matchMedia("(pointer: fine)").matches && !reduceMotion) {
  const hoverTargets = [
    "a", "button", "summary", ".feature-card", ".image-box",
    ".gallery-item", ".details-image", ".sound-visual", ".hero-product"
  ].join(", ");

  window.addEventListener("pointermove", event => {
    cursor.style.opacity = "1";
    cursor.style.left = `${event.clientX}px`;
    cursor.style.top = `${event.clientY}px`;
  });

  document.addEventListener("pointerover", event => {
    if (event.target instanceof Element && event.target.closest(hoverTargets)) {
      cursor.classList.add("is-hovering");
    }
  });

  document.addEventListener("pointerout", event => {
    const nextTarget = event.relatedTarget;

    if (
      !(nextTarget instanceof Element) ||
      !nextTarget.closest(hoverTargets)
    ) {
      cursor.classList.remove("is-hovering");
    }
  });

  window.addEventListener("pointerleave", () => {
    cursor.style.opacity = "0";
    cursor.classList.remove("is-hovering");
  });

  $$(".feature-card").forEach(card => {
    card.addEventListener("pointermove", event => {
      const rect = card.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;

      card.style.setProperty("--pointer-x", `${x}%`);
      card.style.setProperty("--pointer-y", `${y}%`);
    });
  });
}

// 11. SUBTLE PARALLAX ON GALLERY IMAGES
let parallaxRunning = false;

window.addEventListener("scroll", () => {
  if (reduceMotion || parallaxRunning) return;

  parallaxRunning = true;

  requestAnimationFrame(() => {
    $$(".gallery-item").forEach(item => {
      const rect = item.getBoundingClientRect();

      if (rect.bottom > 0 && rect.top < window.innerHeight) {
        const distance =
          (window.innerHeight - rect.top) / window.innerHeight;

        const image = $("img", item);

        image.style.objectPosition =
          `center ${45 + distance * 8}%`;
      }
    });

    parallaxRunning = false;
  });
}, { passive: true });

// 12. PAUSE INFINITE ANIMATIONS WHEN TAB IS HIDDEN
document.addEventListener("visibilitychange", () => {
  document.body.classList.toggle(
    "tab-hidden",
    document.hidden
  );
});
