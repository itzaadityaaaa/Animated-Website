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
