
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

// 10. POINTER PARALLAX
if (window.matchMedia("(pointer: fine)").matches && !reduceMotion) {
  const parallaxTargets = $$(".image-box,.gallery-item,.details-image,.buy-product");

  parallaxTargets.forEach(target => {
    target.addEventListener("pointermove", event => {
      const rect = target.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;

      target.style.setProperty("--parallax-x", `${x * -14}px`);
      target.style.setProperty("--parallax-y", `${y * -14}px`);
      target.style.setProperty("--parallax-rotate", `${x * 1.5}deg`);
    });

    target.addEventListener("pointerleave", () => {
      target.style.removeProperty("--parallax-x");
      target.style.removeProperty("--parallax-y");
      target.style.removeProperty("--parallax-rotate");
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

// 12. GALLERY PREVIEW WITH FLIP TRANSITIONS
const galleryFigures = $$(".gallery-item");
const lightbox = $(".gallery-lightbox");
const lightboxImage = $(".lightbox-image");
const lightboxCaption = $(".lightbox-caption");
const lightboxFrame = $(".lightbox-image-frame");
const lightboxClose = $(".lightbox-close");
let activeGalleryIndex = -1;
let lastFocusedElement = null;
let lightboxTransitioning = false;
let closeRequested = false;
let previousBodyOverflow = "";
let swipeStartX = null;

galleryFigures.forEach((figure, index) => {
  figure.tabIndex = 0;
  figure.setAttribute("role", "button");
  figure.setAttribute(
    "aria-label",
    `Open ${$("img", figure).alt} in gallery preview`
  );
  figure.addEventListener("click", () => openGalleryImage(index, figure));
  figure.addEventListener("keydown", event => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openGalleryImage(index, figure);
    }
  });
});

function setGalleryImage(index) {
  activeGalleryIndex = (index + galleryFigures.length) % galleryFigures.length;
  const figure = galleryFigures[activeGalleryIndex];
  const image = $("img", figure);

  lightboxImage.src = image.currentSrc || image.src;
  lightboxImage.alt = image.alt;
  lightboxCaption.textContent = $("figcaption", figure).textContent.trim();
}

function playFlip(sourceImage, targetImage) {
  const start = sourceImage.getBoundingClientRect();
  const end = targetImage.getBoundingClientRect();
  const clone = sourceImage.cloneNode();
  const scaleX = end.width / start.width;
  const scaleY = end.height / start.height;

  clone.className = "flip-image";
  clone.alt = "";
  clone.setAttribute("aria-hidden", "true");
  clone.style.left = `${start.left}px`;
  clone.style.top = `${start.top}px`;
  clone.style.width = `${start.width}px`;
  clone.style.height = `${start.height}px`;
  document.body.append(clone);

  const animation = clone.animate(
    [
      { transform: "translate(0,0) scale(1,1)" },
      {
        transform:
          `translate(${end.left - start.left}px,${end.top - start.top}px) ` +
          `scale(${scaleX},${scaleY})`
      }
    ],
    {
      duration: reduceMotion ? 0 : 680,
      easing: "cubic-bezier(.22,.8,.2,1)",
      fill: "forwards"
    }
  );

  return animation.finished.finally(() => clone.remove());
}

function finishLightboxTransition() {
  lightboxTransitioning = false;

  if (closeRequested) {
    closeRequested = false;
    closeGalleryImage();
  }
}

async function openGalleryImage(index, figure) {
  if (lightbox.classList.contains("is-open") || lightboxTransitioning) return;

  lightboxTransitioning = true;
  lastFocusedElement = figure;
  setGalleryImage(index);
  previousBodyOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";
  lightbox.classList.remove("is-closing");
  lightbox.classList.add("is-open");
  lightbox.setAttribute("aria-hidden", "false");
  lightboxImage.style.opacity = "0";

  try {
    await playFlip($("img", figure), lightboxImage);
    lightboxImage.style.opacity = "1";
    lightboxClose.focus({ preventScroll: true });
  } finally {
    finishLightboxTransition();
  }
}

async function closeGalleryImage() {
  if (!lightbox.classList.contains("is-open")) return;
  if (lightboxTransitioning) {
    closeRequested = true;
    return;
  }

  lightboxTransitioning = true;
  const sourceFigure = galleryFigures[activeGalleryIndex];
  const sourceImage = $("img", sourceFigure);

  lightboxImage.style.opacity = "0";
  lightbox.classList.add("is-closing");

  try {
    await playFlip(lightboxImage, sourceImage);
  } finally {
    lightbox.classList.remove("is-open", "is-closing");
    lightbox.setAttribute("aria-hidden", "true");
    lightboxImage.style.opacity = "";
    document.body.style.overflow = previousBodyOverflow;
    finishLightboxTransition();
    lastFocusedElement?.focus({ preventScroll: true });
  }
}

async function moveGalleryImage(direction) {
  if (!lightbox.classList.contains("is-open") || lightboxTransitioning) return;

  lightboxTransitioning = true;
  const exit = lightboxImage.animate(
    [
      { opacity: 1, transform: "scale(1)" },
      { opacity: 0, transform: `translateX(${direction * -16}px) scale(.98)` }
    ],
    { duration: reduceMotion ? 0 : 180, easing: "ease-in", fill: "forwards" }
  );

  try {
    await exit.finished;
    setGalleryImage(activeGalleryIndex + direction);

    const enter = lightboxImage.animate(
      [
        { opacity: 0, transform: `translateX(${direction * 16}px) scale(.98)` },
        { opacity: 1, transform: "translateX(0) scale(1)" }
      ],
      { duration: reduceMotion ? 0 : 300, easing: "cubic-bezier(.22,.8,.2,1)" }
    );

    await enter.finished;
  } finally {
    finishLightboxTransition();
  }
}

$(".lightbox-backdrop").addEventListener("click", closeGalleryImage);
lightboxClose.addEventListener("click", closeGalleryImage);
$(".lightbox-previous").addEventListener("click", () => moveGalleryImage(-1));
$(".lightbox-next").addEventListener("click", () => moveGalleryImage(1));

lightboxFrame.addEventListener("pointerdown", event => {
  if (event.pointerType === "touch") swipeStartX = event.clientX;
});

lightboxFrame.addEventListener("pointerup", event => {
  if (swipeStartX === null) return;

  const swipeDistance = event.clientX - swipeStartX;
  swipeStartX = null;

  if (Math.abs(swipeDistance) > 50) {
    moveGalleryImage(swipeDistance < 0 ? 1 : -1);
  }
});

lightboxFrame.addEventListener("pointercancel", () => {
  swipeStartX = null;
});

document.addEventListener("keydown", event => {
  if (!lightbox.classList.contains("is-open")) return;

  if (event.key === "Escape") closeGalleryImage();
  if (event.key === "ArrowRight") moveGalleryImage(1);
  if (event.key === "ArrowLeft") moveGalleryImage(-1);

  if (event.key === "Tab") {
    const controls = $$(".lightbox-content button", lightbox);
    const first = controls[0];
    const last = controls[controls.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
});

// 13. PAUSE INFINITE ANIMATIONS WHEN TAB IS HIDDEN
document.addEventListener("visibilitychange", () => {
  document.body.classList.toggle(
    "tab-hidden",
    document.hidden
  );
});
