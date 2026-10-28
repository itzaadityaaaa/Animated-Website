 const $ = (selector, parent = document) =>
  parent.querySelector(selector);

const $$ = (selector, parent = document) =>
  [...parent.querySelectorAll(selector)];

const reduceMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

/* ========================================
   WELCOME SCREEN CONTROLLER
======================================== */

const welcomeScreen = document.getElementById("welcome-screen");
const homepage = document.getElementById("homepage");

if (welcomeScreen) {
  // Prepare the homepage for its entrance
  if (homepage) {
    document.body.classList.add("homepage-entering");
  }

  // Prevent scrolling during the welcome animation
  document.body.style.overflow = "hidden";

  // Wait for the welcome animation
  setTimeout(() => {
    welcomeScreen.classList.add("hide-welcome");

    // Remove the welcome overlay after its exit
    setTimeout(() => {
      welcomeScreen.remove();

      // Reveal the homepage
      document.body.classList.remove("homepage-entering");

      // Restore normal scrolling
      document.body.style.overflow = "";
    }, 900);

  }, 3800);
}


(() => {
  gsap.registerPlugin(ScrollTrigger);

  const section = document.querySelector("#headphone-experience");
  const canvas = document.querySelector("#headphone-canvas");
  const degreeLabel = document.querySelector("#headphone-degree");

  if (!section || !canvas) return;

  // Three.js scene
  
const headphoneWrap = document.getElementById(
  "headphone-canvas-wrap"
);

let targetTiltX = 0;
let targetTiltZ = 0;
let currentTiltX = 0;
let currentTiltZ = 0;

headphoneWrap.addEventListener("mousemove", (event) => {
  const rect = headphoneWrap.getBoundingClientRect();

  const x = (event.clientX - rect.left) / rect.width;
  const y = (event.clientY - rect.top) / rect.height;

  targetTiltZ = (x - 0.5) * 0.20;
  targetTiltX = (y - 0.5) * 0.20;
});

headphoneWrap.addEventListener("mouseleave", () => {
  targetTiltX = 0;
  targetTiltZ = 0;
});

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(
    35,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );

  camera.position.set(0, 0, 7);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: "high-performance"
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;



  // Studio-style lighting
  scene.add(new THREE.HemisphereLight(0xdce4ff, 0x171525, 2));

  const keyLight = new THREE.DirectionalLight(0xffffff, 3);
  keyLight.position.set(3, 5, 6);
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0x8880ff, 4);
  rimLight.position.set(-5, 2, -4);
  scene.add(rimLight);

  const sideLight = new THREE.PointLight(0x63d9ff, 35, 12);
  sideLight.position.set(4, -1, 3);
  scene.add(sideLight);

  const headphoneGroup = new THREE.Group();
  scene.add(headphoneGroup);

  let modelLoaded = false;
  let animationFrame;

  // Replace this path with your actual GLB model URL.
  const modelPath = "over-ear-headphones.glb";

  const loader = new THREE.GLTFLoader();

  loader.load(
    modelPath,
    (gltf) => {
      const model = gltf.scene;

      // Center the model and fit it to the scene.
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());

      model.position.sub(center);

      const maxDimension = Math.max(size.x, size.y, size.z);
      const scale = 2.6 / maxDimension;

      model.scale.setScalar(scale);

      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;

          if (child.material) {
            child.material.needsUpdate = true;
          }
        }
      });

      headphoneGroup.add(model);
      modelLoaded = true;
    },
    undefined,
    (error) => {
      console.error(
        "Could not load the headphone model. Check the GLB file path.",
        error
      );
    }
  );

  // Resize the renderer
  function resizeRenderer() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    camera.aspect = width / height;
    camera.position.z = width < 700 ? 8.5 : 7;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  window.addEventListener("resize", resizeRenderer);

  // Scroll progress controls a complete 360-degree rotation.
  const rotation = { y: 0 };

  gsap.to(rotation, {
    y: Math.PI,
    ease: "none",
    scrollTrigger: {
      trigger: section,
      start: "top top",
      end: "+=1000",
      scrub: 1,
      pin: true,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        degreeLabel.textContent =
          String(Math.round(self.progress * 360)).padStart(3, "0") + "°";
      }
    }
  });

  // Render continuously for smooth 3D movement.
  function render() {
    animationFrame = requestAnimationFrame(render);

    if (modelLoaded) {
      headphoneGroup.rotation.y = rotation.y;
    }

  currentTiltX += (targetTiltX - currentTiltX) * 0.06;
  currentTiltZ += (targetTiltZ - currentTiltZ) * 0.06;

// Small resting tilt + smooth mouse movement
  headphoneGroup.rotation.x =
    THREE.MathUtils.degToRad(15) + currentTiltX;

  headphoneGroup.rotation.z =
    THREE.MathUtils.degToRad(-15) + currentTiltZ;

    renderer.render(scene, camera);
  }

  render();

  // Clean up if this component is manually removed.
  window.addEventListener("pagehide", () => {
    cancelAnimationFrame(animationFrame);
    window.removeEventListener("resize", resizeRenderer);
    renderer.dispose();
  }, { once: true });
})(); 

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
      `translate(calc(-50% + ${x * 16}px), calc(-50% + ${y * 16}px)) rotate(${x * 7 - 6}deg)`;
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
      target.style.setProperty("--parallax-rotate", `${x * 1.5}deg` );
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
          `translate(${end.left - start.left}px,${end.top - start.top}px)  +
          scale(${scaleX},${scaleY})`
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

(() => {
  const section = document.querySelector(".message-section");
  const pin = section?.querySelector(".horizontal-pin");
  const track = section?.querySelector(".horizontal-track");
  const panels = [...(section?.querySelectorAll(".message-panel") || [])];
  const progress = section?.querySelector(".message-progress span");

  if (!section || !pin || !track || !panels.length) return;

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  // Create the individual letter blocks.
  section.querySelectorAll("[data-phrase]").forEach(element => {
    const phrase = element.dataset.phrase || "";
    element.replaceChildren();

    phrase.split(" ").forEach((word, wordIndex) => {
      if (wordIndex > 0) {
        const space = document.createElement("span");
        space.className = "word-space";
        space.setAttribute("aria-hidden", "true");
        element.appendChild(space);
      }

      [...word].forEach(character => {
        const letter = document.createElement("span");
        letter.className = "letter-box";
        letter.textContent = character;
        letter.setAttribute("aria-hidden", "true");
        element.appendChild(letter);
      });
    });
  });

  // Keep the section readable if GSAP is unavailable
  // or the visitor prefers reduced motion.
  function useVerticalLayout() {
    track.style.width = "100%";
    track.style.display = "block";
    track.style.transform = "none";

    pin.style.height = "auto";
    pin.style.minHeight = "0";
    pin.style.overflow = "visible";

    panels.forEach(panel => {
      panel.style.width = "100%";
      panel.style.minWidth = "0";
      panel.style.height = "min(80svh, 680px)";
      panel.style.minHeight = "420px";
    });

    section.querySelectorAll(".letter-box").forEach(letter => {
      letter.style.opacity = "1";
      letter.style.visibility = "visible";
      letter.style.transform = "none";
    });
  }

  if (reduceMotion || !window.gsap || !window.ScrollTrigger) {
    useVerticalLayout();
    return;
  }

  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;

  gsap.registerPlugin(ScrollTrigger);

  // Calculate the distance required to reach the final panel.
  const getDistance = () =>
    Math.max(0, track.scrollWidth - pin.clientWidth);

  // Make letters visible by default. Their animations will
  // take over as the visitor scrolls through the panels.
  gsap.set(section.querySelectorAll(".letter-box"), {
    autoAlpha: 1,
    y: 0,
    rotateX: 0,
    scale: 1
  });

  // Pin the section and convert vertical scrolling to horizontal.
  const horizontalTween = gsap.to(track, {
    x: () => -getDistance(),
    ease: "none",

    scrollTrigger: {
      trigger: pin,
      start: "top top",
      end: () => "+=" + Math.max(getDistance(), window.innerHeight),
      pin: true,
      pinSpacing: true,
      scrub: 0.8,
      anticipatePin: 1,
      invalidateOnRefresh: true,

      onUpdate: self => {
        if (progress) {
          gsap.set(progress, {
            scaleX: self.progress
          });
        }
      }
    }
  });

  // Animate each panel's letters as that panel slides into view.
  panels.forEach(panel => {
    const letters = panel.querySelectorAll(".letter-box");
    const shape = panel.querySelector(".panel-shape");

    if (letters.length) {
      gsap.fromTo(
        letters,
        {
          y: 28,
          rotateX: -35,
          scale: 0.92,
          autoAlpha: 0
        },
        {
          y: 0,
          rotateX: 0,
          scale: 1,
          autoAlpha: 1,
          stagger: 0.025,
          duration: 0.45,
          ease: "power2.out",

          scrollTrigger: {
            trigger: panel,
            containerAnimation: horizontalTween,
            start: "left 85%",
            end: "left 30%",
            scrub: 0.5,
            invalidateOnRefresh: true
          }
        }
      );
    }

    if (shape) {
      gsap.to(shape, {
        rotation: 20,
        ease: "none",

        scrollTrigger: {
          trigger: panel,
          containerAnimation: horizontalTween,
          start: "left right",
          end: "right left",
          scrub: 1
        }
      });
    }
  });

  // Refresh after the browser has calculated the final layout.
  window.addEventListener("load", () => ScrollTrigger.refresh());
  window.addEventListener("resize", () => ScrollTrigger.refresh());

  if (document.fonts?.ready) {
    document.fonts.ready.then(() => ScrollTrigger.refresh());
  }

  requestAnimationFrame(() => ScrollTrigger.refresh());
})();
/* ===========================================
   AURA — COLOUR SHIFT INTERACTION
=========================================== */

(() => {
  const section = document.querySelector(".aura-colors");

  if (!section) return;

  const stage = section.querySelector("[data-color-stage]");
  const product = section.querySelector("[data-color-product]");
  const buttons = section.querySelectorAll("[data-color-option]");
  const name = section.querySelector("[data-color-name]");
  const description = section.querySelector("[data-color-description]");
  const index = section.querySelector("[data-color-index]");
  const stageName = section.querySelector("[data-stage-name]");

  if (!stage || !product || !buttons.length) return;

  let switchTimer;

  function selectColour(button, animate = true) {
    const colour = button.dataset.color;
    const colourName = button.dataset.name;
    const colourDescription = button.dataset.description;

    if (!colour || !colourName) return;

    // Update the selected palette.
    section.dataset.color = colour;

    // Update the selected swatch.
    buttons.forEach((item) => {
      const active = item === button;

      item.classList.toggle("is-active", active);
      item.setAttribute("aria-pressed", String(active));
    });

    // Update the product information.
    name.textContent = colourName;
    description.textContent = colourDescription;
    stageName.textContent = colourName.toUpperCase();

    const colourIndex = Array.from(buttons).indexOf(button) + 1;
    index.textContent =
      `${String(colourIndex).padStart(2, "0")} / ${String(buttons.length).padStart(2, "0")}`;

    if (!animate) return;

    // Restart the colour-swap animation.
    clearTimeout(switchTimer);

    stage.classList.remove("is-switching");
    product.classList.remove("is-switching");

    // Force the browser to restart the animations.
    void stage.offsetWidth;
    void product.offsetWidth;

    stage.classList.add("is-switching");
    product.classList.add("is-switching");

    switchTimer = window.setTimeout(() => {
      stage.classList.remove("is-switching");
      product.classList.remove("is-switching");
    }, 900);
  }

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      selectColour(button, true);
    });
  });

  // Subtle mouse-controlled 3D tilt.
  const canTilt =
    window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (canTilt) {
    stage.addEventListener("pointermove", (event) => {
      // Avoid changing the tilt during the colour-spin animation.
      if (product.classList.contains("is-switching")) return;

      const bounds = stage.getBoundingClientRect();

      const x = (event.clientX - bounds.left) / bounds.width;
      const y = (event.clientY - bounds.top) / bounds.height;

      const rotateY = (x - 0.5) * 14;
      const rotateX = (0.5 - y) * 9;

      product.style.setProperty("--tilt-x", `${rotateY}deg`);
      product.style.setProperty("--tilt-y", `${rotateX}deg`);
    });

    stage.addEventListener("pointerleave", () => {
      product.style.setProperty("--tilt-x", "-9deg");
      product.style.setProperty("--tilt-y", "0deg");
    });
  }

  // Ensure that the initial state matches the selected swatch.
  const initialButton =
    section.querySelector("[data-color-option].is-active") || buttons[0];

  selectColour(initialButton, false);
})();

/* =========================================
   AURA — CHIP CAMERA SCROLL
========================================= */

(() => {
  const section = document.querySelector(".aura-chip-journey");

  if (!section) return;

  const productLayer = section.querySelector(
    ".aura-chip-product-layer"
  );

  const headphone = section.querySelector(
    ".aura-chip-headphone"
  );

  const macroLayer = section.querySelector(
    ".aura-chip-macro-layer"
  );

  const macroPlane = section.querySelector(
    ".aura-chip-macro-plane"
  );

  const target = section.querySelector(
    ".aura-chip-target"
  );

  const opening = section.querySelector(
    ".aura-chip-opening"
  );

  const detail = section.querySelector(
    ".aura-chip-detail"
  );

  const progressBar = section.querySelector(
    ".aura-chip-progress span"
  );

  const stepLabel = section.querySelector(
    ".aura-chip-step"
  );

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (
    !productLayer ||
    !headphone ||
    !macroLayer ||
    !macroPlane ||
    !target
  ) {
    return;
  }

  const clamp = (value, min, max) =>
    Math.min(Math.max(value, min), max);

  // Smooth interpolation between two values.
  const smoothStep = (start, end, value) => {
    const t = clamp((value - start) / (end - start), 0, 1);

    return t * t * (3 - 2 * t);
  };

  let animationFrame = null;

  function updateScene() {
    animationFrame = null;

    if (reducedMotion) return;

    const rect = section.getBoundingClientRect();

    const scrollDistance =
      section.offsetHeight - window.innerHeight;

    // Progress from 0 to 1 while scrolling through this section.
    const progress = scrollDistance > 0
      ? clamp(-rect.top / scrollDistance, 0, 1)
      : 0;

    /* 1. ZOOM INTO THE HEADPHONE */

    const headphoneProgress = smoothStep(
      0,
      0.61,
      progress
    );

    const headphoneScale =
      1 + headphoneProgress * 3.7;

    headphone.style.setProperty(
      "--headphone-zoom",
      headphoneScale
    );

    /* 2. TRANSITION TO THE CIRCUIT BOARD */

    const macroOpacity = smoothStep(
      0.36,
      0.64,
      progress
    );

    productLayer.style.opacity = 1 - macroOpacity;
    macroLayer.style.opacity = macroOpacity;

    /* 3. ZOOM TOWARD THE PROCESSOR */

    const chipProgress = smoothStep(
      0.47,
      1,
      progress
    );

    const chipScale = 1 + chipProgress * 1.65;

    macroPlane.style.setProperty(
      "--chip-zoom",
      chipScale
    );

    // Move the marked chip toward the centre of the screen.
    const panX = window.innerWidth * 0.06 * chipProgress;
    const panY = -window.innerHeight * 0.04 * chipProgress;

    macroPlane.style.setProperty(
      "--chip-pan-x",
      `${panX}px`
    );

    macroPlane.style.setProperty(
      "--chip-pan-y",
      `${panY}px`
    );

    /* 4. INTENSIFY THE CHIP GLOW */

    const glowProgress = smoothStep(
      0.48,
      0.76,
      progress
    );

    target.style.setProperty(
      "--chip-target-opacity",
      glowProgress
    );

    target.style.setProperty(
      "--chip-halo-scale",
      0.65 + glowProgress * 0.8
    );

    target.style.setProperty(
      "--chip-glow-blur",
      `${20 + glowProgress * 65}px`
    );

    target.style.setProperty(
      "--chip-glow-alpha",
      0.2 + glowProgress * 0.65
    );

    /* 5. CHANGE THE HEADLINE */

    const openingOpacity =
      1 - smoothStep(0.18, 0.43, progress);

    const detailProgress = smoothStep(
      0.58,
      0.79,
      progress
    );

    opening.style.setProperty(
      "--opening-opacity",
      openingOpacity
    );

    detail.style.setProperty(
      "--detail-opacity",
      detailProgress
    );

    detail.style.setProperty(
      "--detail-shift",
      `${15 * (1 - detailProgress)}px`
    );

    /* 6. UPDATE THE SCROLL INDICATOR */

    progressBar.style.setProperty(
      "--scroll-progress",
      progress
    );

    if (stepLabel) {
      if (progress < 0.35) {
        stepLabel.textContent = "01 — THE HARDWARE";
      } else if (progress < 0.68) {
        stepLabel.textContent = "02 — CIRCUIT SYSTEM";
      } else {
        stepLabel.textContent = "03 — THE SIGNAL CORE";
      }
    }
  }

  function requestSceneUpdate() {
    if (animationFrame !== null) return;

    animationFrame = window.requestAnimationFrame(updateScene);
  }

  window.addEventListener("scroll", requestSceneUpdate, {
    passive: true
  });

  window.addEventListener("resize", requestSceneUpdate);

  // Set the correct initial frame.
  updateScene();
})();

/* ==========================================
   ISOLATED CAT SCROLL MOVEMENT
========================================== */

(() => {
  "use strict";

  const cat = document.getElementById("armor-cat-animation");

  if (!cat) return;

  const svg = cat.querySelector(".armor-cat-animation__svg");
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );

  let targetX = 14;
  let currentX = 14;
  let previousScrollY = window.scrollY;
  let direction = 1;
  let frameId = null;
  let stopWalkingTimer = null;

  const clamp = (value, min, max) =>
    Math.max(min, Math.min(max, value));

  function getTargetX() {
    const catWidth = cat.getBoundingClientRect().width;
    const margin = 14;
    const maxX = Math.max(
      margin,
      window.innerWidth - catWidth - margin
    );

    const maxScroll = Math.max(
      0,
      document.documentElement.scrollHeight - window.innerHeight
    );

    const progress = maxScroll > 0
      ? clamp(window.scrollY / maxScroll, 0, 1)
      : 0;

    return margin + progress * (maxX - margin);
  }

  function render() {
    frameId = null;

    if (reducedMotion.matches) {
      currentX = 14;
      targetX = 14;
    } else {
      // Smoothly ease the cat toward its scroll position.
      currentX += (targetX - currentX) * 0.16;

      if (Math.abs(targetX - currentX) < 0.35) {
        currentX = targetX;
      }
    }

    cat.style.setProperty("--armor-cat-x", `${currentX}px`);

    // Continue easing only while there is movement left to complete.
    if (
      !reducedMotion.matches &&
      Math.abs(targetX - currentX) >= 0.35
    ) {
      frameId = window.requestAnimationFrame(render);
    }
  }

  function requestRender() {
    if (frameId === null) {
      frameId = window.requestAnimationFrame(render);
    }
  }

  function handleScroll() {
    const currentScrollY = window.scrollY;
    const delta = currentScrollY - previousScrollY;

    if (!reducedMotion.matches && Math.abs(delta) > 0) {
      direction = delta > 0 ? 1 : -1;

      cat.classList.toggle("is-facing-left", direction < 0);
      cat.classList.add("is-walking");

      clearTimeout(stopWalkingTimer);

      stopWalkingTimer = window.setTimeout(() => {
        cat.classList.remove("is-walking");
      }, 160);
    }

    previousScrollY = currentScrollY;
    targetX = getTargetX();

    requestRender();
  }

  function handleResize() {
    targetX = getTargetX();
    requestRender();
  }

  function handleMotionPreference() {
    if (reducedMotion.matches) {
      cat.classList.remove("is-walking");
      cat.classList.remove("is-facing-left");
      clearTimeout(stopWalkingTimer);
    }

    targetX = getTargetX();
    requestRender();
  }

  window.addEventListener("scroll", handleScroll, {
    passive: true
  });

  window.addEventListener("resize", handleResize, {
    passive: true
  });

  if (typeof reducedMotion.addEventListener === "function") {
    reducedMotion.addEventListener("change", handleMotionPreference);
  } else {
    reducedMotion.addListener(handleMotionPreference);
  }

  // Position correctly on initial load and after page restoration.
  targetX = getTargetX();
  currentX = targetX;
  cat.style.setProperty("--armor-cat-x", `${currentX}px`);
})();

/* ==========================================
   CAT — SCROLL, WALK, SIT AND GET UP
========================================== */

(() => {
  "use strict";

  const cat = document.getElementById("armor-cat-animation");

  if (!cat) return;

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );

  const SIT_DELAY = 2600;
  const WALK_RELEASE_DELAY = 180;

  let targetX = 14;
  let currentX = 14;
  let previousScrollY = window.scrollY;

  let direction = 1;
  let frameId = null;
  let sitTimer = null;
  let walkTimer = null;

  let hasScrolled = false;

  const clamp = (value, min, max) =>
    Math.max(min, Math.min(max, value));

  function getTargetX() {
    const catWidth = cat.getBoundingClientRect().width;
    const margin = 14;

    const maxX = Math.max(
      margin,
      window.innerWidth - catWidth - margin
    );

    const maxScroll = Math.max(
      0,
      document.documentElement.scrollHeight -
        window.innerHeight
    );

    const progress = maxScroll > 0
      ? clamp(window.scrollY / maxScroll, 0, 1)
      : 0;

    return margin + progress * (maxX - margin);
  }

  function render() {
    frameId = null;

    if (reducedMotion.matches) {
      currentX = 14;
      targetX = 14;
    } else {
      // Smooth horizontal movement.
      currentX += (targetX - currentX) * 0.16;

      if (Math.abs(targetX - currentX) < 0.35) {
        currentX = targetX;
      }
    }

    cat.style.setProperty(
      "--armor-cat-x",
      `${currentX}px`
    );

    if (
      !reducedMotion.matches &&
      Math.abs(targetX - currentX) >= 0.35
    ) {
      frameId = window.requestAnimationFrame(render);
    }
  }

  function requestRender() {
    if (frameId === null) {
      frameId = window.requestAnimationFrame(render);
    }
  }

  // Begin sitting only after the user has actually scrolled.
  function scheduleSitting() {
    clearTimeout(sitTimer);

    if (reducedMotion.matches || !hasScrolled) return;

    sitTimer = window.setTimeout(() => {
      cat.classList.remove("is-walking");

      // CSS transitions animate the cat lowering into its pose.
      cat.classList.add("is-sitting");
    }, SIT_DELAY);
  }

  function handleScroll() {
    const currentScrollY = window.scrollY;
    const delta = currentScrollY - previousScrollY;

    if (Math.abs(delta) > 0) {
      hasScrolled = true;

      if (!reducedMotion.matches) {
        direction = delta > 0 ? 1 : -1;

        // Turn the cat to face its direction of travel.
        cat.classList.toggle(
          "is-facing-left",
          direction < 0
        );

        // Remove the sitting pose to animate standing up.
        cat.classList.remove("is-sitting");

        clearTimeout(sitTimer);
        clearTimeout(walkTimer);

        // Start the walking cycle immediately.
        cat.classList.add("is-walking");

        // Briefly stop the walking cycle between scroll events.
        walkTimer = window.setTimeout(() => {
          cat.classList.remove("is-walking");
        }, WALK_RELEASE_DELAY);

        // Restart the idle timer whenever scrolling continues.
        scheduleSitting();
      }
    }

    previousScrollY = currentScrollY;
    targetX = getTargetX();

    requestRender();
  }

  function handleResize() {
    targetX = getTargetX();
    requestRender();
  }

  function handleMotionPreference() {
    clearTimeout(sitTimer);
    clearTimeout(walkTimer);

    if (reducedMotion.matches) {
      cat.classList.remove("is-walking", "is-sitting");
    } else if (hasScrolled) {
      scheduleSitting();
    }

    targetX = getTargetX();
    requestRender();
  }

  window.addEventListener("scroll", handleScroll, {
    passive: true
  });

  window.addEventListener("resize", handleResize, {
    passive: true
  });

  if (typeof reducedMotion.addEventListener === "function") {
    reducedMotion.addEventListener(
      "change",
      handleMotionPreference
    );
  } else {
    reducedMotion.addListener(handleMotionPreference);
  }

  // Set the initial position without starting the sit timer.
  targetX = getTargetX();
  currentX = targetX;

  cat.style.setProperty(
    "--armor-cat-x",
    `${currentX}px`
  );
})();

/* ============================================
   AURA — CAT LOOP INTERACTION
============================================ */

(() => {
  "use strict";

  const illustrations = document.querySelectorAll(
    "[data-aura-cat-loop]"
  );

  if (!illustrations.length) return;

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );

  illustrations.forEach((illustration) => {
    const scene = illustration.querySelector(
      ".aura-cat-loop__scene"
    );

    if (!scene) return;

    // Pause animation when the illustration is off-screen.
    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            illustration.classList.toggle(
              "is-paused",
              !entry.isIntersecting
            );
          });
        },
        {
          threshold: 0.05
        }
      );

      observer.observe(illustration);
    }

    // Respect accessibility settings.
    if (
      reducedMotion.matches ||
      !window.matchMedia(
        "(hover: hover) and (pointer: fine)"
      ).matches
    ) {
      return;
    }

    let animationFrame = null;
    let pointerX = 0;
    let pointerY = 0;

    function updateTilt() {
      animationFrame = null;

      scene.style.setProperty(
        "--aura-cat-tilt-x",
        `${pointerY * -3}deg`
      );

      scene.style.setProperty(
        "--aura-cat-tilt-y",
        `${pointerX * 4}deg`
      );
    }

    function handlePointerMove(event) {
      const bounds = illustration.getBoundingClientRect();

      pointerX =
        ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;

      pointerY =
        ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;

      if (animationFrame !== null) return;

      animationFrame = requestAnimationFrame(updateTilt);
    }

    function resetTilt() {
      pointerX = 0;
      pointerY = 0;

      if (animationFrame !== null) {
        cancelAnimationFrame(animationFrame);
        animationFrame = null;
      }

      scene.style.setProperty("--aura-cat-tilt-x", "0deg");
      scene.style.setProperty("--aura-cat-tilt-y", "0deg");
    }

    illustration.addEventListener(
      "pointermove",
      handlePointerMove,
      { passive: true }
    );

    illustration.addEventListener("pointerleave", resetTilt);
  });
})();

