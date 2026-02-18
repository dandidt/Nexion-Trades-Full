// ───────── Introduction ───────── //
(() => {
  let cursorIntroDone = false;
  
  async function setupTyping(elementId, speed = 100) {
    return new Promise(async (resolve) => {
      const el = document.getElementById(elementId);
      const cursor = el.nextElementSibling;
  
      el.style.visibility = "visible";
  
      const text = el.innerText;
      el.innerHTML = "";
  
      const chars = text.split("").map((char) => {
        const span = document.createElement("span");
        span.innerText = char;
        span.classList.add("char");
        el.appendChild(span);
        return span;
      });
  
      cursor.classList.add("active");
  
      if (!cursorIntroDone) {
        cursorIntroDone = true;
        await new Promise((r) => setTimeout(r, 1000));
      }
  
      let i = 0;
      const typingInterval = setInterval(() => {
        if (i < chars.length) {
          chars[i].classList.add("visible");
  
          const charRect = chars[i].getBoundingClientRect();
          const containerRect = el.getBoundingClientRect();
          cursor.style.left = `${charRect.right - containerRect.left}px`;
  
          i++;
        } else {
          clearInterval(typingInterval);
          cursor.classList.remove("active");
          resolve();
        }
      }, speed);
    });
  }
  
  async function startAnimation() {
    await setupTyping("title", 60);
    await setupTyping("subtitle", 60);
    runShowUp(180);
  }
  
  window.onload = startAnimation;
})();

function runShowUp() {
  const items = document.querySelectorAll(".show-up");
  const STAGGER = 150;
  const INITIAL_DELAY = 200;

  items.forEach((el, i) => {
    setTimeout(
      () => {
        el.classList.add("active");
      },
      INITIAL_DELAY + i * STAGGER,
    );
  });
}

(() => {
  const marquee = document.querySelector(".marquee-content");
  if (!marquee) return;

  let baseOffset = 0;
  let scrollOffset = 0;
  let targetScrollOffset = 0;
  let lastScrollY = window.scrollY;

  window.addEventListener("scroll", () => {
    const currentScrollY = window.scrollY;
    const delta = currentScrollY - lastScrollY;
    
    targetScrollOffset -= Math.abs(delta) * 0.2; 
    
    lastScrollY = currentScrollY;
  });

  function render() {
    const autoSpeed = 0.4;
    baseOffset -= autoSpeed;

    const easing = 0.05;
    scrollOffset += (targetScrollOffset - scrollOffset) * easing;

    let totalOffset = baseOffset + scrollOffset;

    const halfWidth = marquee.scrollWidth / 2;
    
    const displayOffset = totalOffset % halfWidth;

    marquee.style.transform = `translateX(${displayOffset}px)`;

    requestAnimationFrame(render);
  }

  render();
})();

// ───────── Features ───────── //
// Animasi Title Scroll
(() => {
  let cursorIntroDone = false;

  async function setupTyping(elementId, speed = 20) {
    return new Promise(async (resolve) => {
      const el = document.getElementById(elementId);
      if (!el) return resolve();
      
      const cursor = el.nextElementSibling;
      el.style.visibility = "visible";

      const text = el.innerText;
      el.innerHTML = "";

      const chars = text.split("").map((char) => {
        const span = document.createElement("span");
        span.innerText = char;
        span.classList.add("char");
        el.appendChild(span);
        return span;
      });

      cursor.classList.add("active");

      if (!cursorIntroDone) {
        cursorIntroDone = true;
        await new Promise((r) => setTimeout(r, 100));
      }

      let i = 0;
      const typingInterval = setInterval(() => {
        if (i < chars.length) {
          chars[i].classList.add("visible");
          const charRect = chars[i].getBoundingClientRect();
          const containerRect = el.getBoundingClientRect();
          cursor.style.left = `${charRect.right - containerRect.left}px`;
          i++;
        } else {
          clearInterval(typingInterval);
          cursor.classList.remove("active");
          resolve();
        }
      }, speed);
    });
  }

  const featureSection = document.querySelector(".features-container");
  
  if (featureSection) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(async (entry) => {
        if (entry.isIntersecting) {
          observer.unobserve(entry.target);
          
          await setupTyping("feature-title", 20);
          await setupTyping("feature-subtitle", 20);
        }
      });
    }, { threshold: 0.6 });

    observer.observe(featureSection);
  }
})();

(() => {
  let targetScale = 1;
  let currentScale = 0.7;

  const previewBox = document.querySelector(".subcontainer-features");

  if (!previewBox) return;

  window.addEventListener("scroll", () => {
    const rect = previewBox.getBoundingClientRect();
    const windowHeight = window.innerHeight;

    const start = windowHeight * 0.9;
    const end = windowHeight * 0.45;

    let progress = (start - rect.top) / (start - end);
    progress = Math.max(0, Math.min(1, progress));

    targetScale = 0.7 + 0.3 * progress;
  });

  function render() {
    const easing = 0.1;

    currentScale += (targetScale - currentScale) * easing;

    previewBox.style.transform = `scale(${currentScale})`;

    requestAnimationFrame(render);
  }

  render();
})();

// ───────── Preview ───────── //
(() => {
  let cursorIntroDone = false;

  async function setupTyping(elementId, speed = 20) {
    return new Promise(async (resolve) => {
      const el = document.getElementById(elementId);
      if (!el) return resolve();
      
      const cursor = el.nextElementSibling;
      el.style.visibility = "visible";

      const text = el.innerText;
      el.innerHTML = "";

      const chars = text.split("").map((char) => {
        const span = document.createElement("span");
        span.innerText = char;
        span.classList.add("char");
        el.appendChild(span);
        return span;
      });

      cursor.classList.add("active");

      if (!cursorIntroDone) {
        cursorIntroDone = true;
        await new Promise((r) => setTimeout(r, 100));
      }

      let i = 0;
      const typingInterval = setInterval(() => {
        if (i < chars.length) {
          chars[i].classList.add("visible");
          const charRect = chars[i].getBoundingClientRect();
          const containerRect = el.getBoundingClientRect();
          cursor.style.left = `${charRect.right - containerRect.left}px`;
          i++;
        } else {
          clearInterval(typingInterval);
          cursor.classList.remove("active");
          resolve();
          runShowUpPreview(400);
        }
      }, speed);
    });
  }

  const featureSection = document.querySelector(".preview-container");
  
  if (featureSection) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(async (entry) => {
        if (entry.isIntersecting) {
          observer.unobserve(entry.target);
          
          await setupTyping("preview-title", 20);
          await setupTyping("preview-subtitle", 20);
        }
      });
    }, { threshold: 0.6 });

    observer.observe(featureSection);
  }
})();

function runShowUpPreview() {
  const items = document.querySelectorAll(".show-up-preview");
  const STAGGER = 150;
  const INITIAL_DELAY = 200;

  items.forEach((el, i) => {
    setTimeout(
      () => {
        el.classList.add("active");
      },
      INITIAL_DELAY + i * STAGGER,
    );
  });
}

// Animasi Box Scroll
(() => {
  let targetScale = 1;
  let currentScale = 0.7;

  const previewBox = document.querySelector(".container-preview");

  if (!previewBox) return;

  window.addEventListener("scroll", () => {
    const rect = previewBox.getBoundingClientRect();
    const windowHeight = window.innerHeight;

    const start = windowHeight * 0.9;
    const end = windowHeight * 0.45;

    let progress = (start - rect.top) / (start - end);
    progress = Math.max(0, Math.min(1, progress));

    targetScale = 0.7 + 0.3 * progress;
  });

  function render() {
    const easing = 0.1;

    currentScale += (targetScale - currentScale) * easing;

    previewBox.style.transform = `scale(${currentScale})`;

    requestAnimationFrame(render);
  }

  render();
})();

// ───────── Community ───────── //
// Animasi Text
(() => {
  const setupFastReveal = async (elId) => {
    const el = document.getElementById(elId);
    if (!el) return;

    const text = el.innerText;
    el.innerHTML = "";

    const chars = text.split("").map((char) => {
      const span = document.createElement("span");
      span.innerText = char;
      span.classList.add("char");
      el.appendChild(span);
      return span;
    });

    await new Promise(r => setTimeout(r, 200));

    let i = 0;
    const speed = 10;

    const revealInterval = setInterval(() => {
      if (i < chars.length) {
        chars[i].classList.add("visible");
        i++;
      } else {
        clearInterval(revealInterval);
      }
    }, speed);
  };

  const targetEl = document.getElementById("text-community");
  if (targetEl) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setupFastReveal("text-community");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    observer.observe(targetEl);
  }
})();

(() => {
  let cursorIntroDone = false;

  async function setupTyping(elementId, speed = 20) {
    return new Promise(async (resolve) => {
      const el = document.getElementById(elementId);
      if (!el) return resolve();
      
      const cursor = el.nextElementSibling;
      el.style.visibility = "visible";

      const text = el.innerText;
      el.innerHTML = "";

      const chars = text.split("").map((char) => {
        const span = document.createElement("span");
        span.innerText = char;
        span.classList.add("char");
        el.appendChild(span);
        return span;
      });

      cursor.classList.add("active");

      if (!cursorIntroDone) {
        cursorIntroDone = true;
        await new Promise((r) => setTimeout(r, 100));
      }

      let i = 0;
      const typingInterval = setInterval(() => {
        if (i < chars.length) {
          chars[i].classList.add("visible");
          const charRect = chars[i].getBoundingClientRect();
          const containerRect = el.getBoundingClientRect();
          cursor.style.left = `${charRect.right - containerRect.left}px`;
          i++;
        } else {
          clearInterval(typingInterval);
          cursor.classList.remove("active");
          resolve();
        }
      }, speed);
    });
  }

  const featureSection = document.querySelector(".community-container");
  
  if (featureSection) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(async (entry) => {
        if (entry.isIntersecting) {
          observer.unobserve(entry.target);
          
          await setupTyping("community-title", 20);
        }
      });
    }, { threshold: 0.6 });

    observer.observe(featureSection);
  }
})();

// Animasi Text
(() => {
  const setupFastReveal = async (elId) => {
    const el = document.getElementById(elId);
    if (!el) return;

    const text = el.innerText;
    el.innerHTML = "";

    const chars = text.split("").map((char) => {
      const span = document.createElement("span");
      span.innerText = char;
      span.classList.add("char");
      el.appendChild(span);
      return span;
    });

    await new Promise(r => setTimeout(r, 200));

    let i = 0;
    const speed = 10;

    const revealInterval = setInterval(() => {
      if (i < chars.length) {
        chars[i].classList.add("visible");
        i++;
      } else {
        clearInterval(revealInterval);
        runShowUpCommunity(180);
      }
    }, speed);
  };

  const targetEl = document.getElementById("subtitle-community");
  if (targetEl) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setupFastReveal("subtitle-community");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    
    observer.observe(targetEl);
  }
})();

// Animasi Community
(() => {
  let targetP1 = 0;
  let targetP2 = 0;
  let currentP1 = 0;
  let currentP2 = 0;

  const shadowEl = document.querySelector(".shadow-community");

  if (!shadowEl) return;

  window.addEventListener("scroll", () => {
    const rect = shadowEl.getBoundingClientRect();
    const windowHeight = window.innerHeight;

    const start = windowHeight * 0.9;
    const end = windowHeight * 0.25;

    let progress = (start - rect.top) / (start - end);
    progress = Math.max(0, Math.min(1, progress));

    targetP1 = 50 * progress;
    targetP2 = 75 * progress;
  });

  function render() {
    const easing = 0.07;

    currentP1 += (targetP1 - currentP1) * easing;
    currentP2 += (targetP2 - currentP2) * easing;

    shadowEl.style.background = `radial-gradient(
      circle at 50% -80%,
      rgba(0, 0, 0, 0) ${currentP1}%,
      var(--bg-20) ${currentP2}%
    )`;

    requestAnimationFrame(render);
  }

  render();
})();

function runShowUpCommunity() {
  const items = document.querySelectorAll(".show-up-community");
  const STAGGER = 150;
  const INITIAL_DELAY = 200;

  items.forEach((el, i) => {
    setTimeout(
      () => {
        el.classList.add("active");
      },
      INITIAL_DELAY + i * STAGGER,
    );
  });
}