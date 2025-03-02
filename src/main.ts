import { bangs } from "./bang";
import "./global.css";

// Initialize theme from localStorage or system preference
function initializeTheme() {
  const savedTheme = localStorage.getItem("theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const theme = savedTheme || (prefersDark ? "dark" : "light");
  
  document.documentElement.dataset.theme = theme;
  if (!savedTheme) {
    localStorage.setItem("theme", theme);
  }
}

initializeTheme();

function toggleTheme() {
  const currentTheme = document.documentElement.dataset.theme;
  const newTheme = (currentTheme || "light") === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = newTheme;
  localStorage.setItem("theme", newTheme);
  
  // Update theme toggle button icon
  const themeIcon = document.querySelector<HTMLImageElement>(".theme-button img")!;
  themeIcon.src = newTheme === "dark" ? "/sun.svg" : "/moon.svg";
  themeIcon.alt = newTheme === "dark" ? "Light mode" : "Dark mode";
}

function noSearchDefaultPageRender() {
  const app = document.querySelector<HTMLDivElement>("#app")!;
  const hostname = window.location.hostname;
  app.innerHTML = `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh;">
      <div id="settingsModal" class="modal" style="display: none;">
        <div class="modal-content">
          <h2>Settings</h2>
          <div class="settings-group">
            <label for="defaultBang">Default Bang:</label>
            <input 
              type="text" 
              id="defaultBang" 
              class="bang-input" 
              value="${localStorage.getItem("default-bang") ?? DEFAULT_BANG}"
            />
          </div>
          <div class="button-group">
            <button class="settings-button save-button">Save</button>
            <button class="settings-button cancel-button">Cancel</button>
          </div>
        </div>
      </div>
      <div class="content-container">
        <h1>Und*ck</h1>
        <p>DuckDuckGo's bang redirects are too slow. Add the following URL as a custom search engine to your browser. Enables <a href="https://duckduckgo.com/bang.html" target="_blank">all of DuckDuckGo's bangs.</a></p>
        <div class="url-container"> 
          <input 
            type="text" 
            class="url-input"
            value="https://${hostname}?q=%s"
            readonly 
          />
          <button class="copy-button">
            <img src="/clipboard.svg" alt="Copy" />
          </button>
          <button class="theme-button settings-button" title="Toggle theme">
            <img src="${document.documentElement.dataset.theme === 'dark' ? '/sun.svg' : '/moon.svg'}" 
                 alt="${document.documentElement.dataset.theme === 'dark' ? 'Light mode' : 'Dark mode'}" />
          </button>
          <button class="settings-button" title="Settings">
            <img src="/settings.svg" alt="Settings" />
          </button>
        </div>
      </div>
      <footer class="footer">
        <a href="https://t3.chat" target="_blank">t3.chat</a>
        •
        <a href="https://x.com/theo" target="_blank">theo</a>
        •
        <a href="https://github.com/t3dotgg/unduck" target="_blank">github</a>
      </footer>
    </div>
  `;

  const copyButton = app.querySelector<HTMLButtonElement>(".copy-button")!;
  const copyIcon = copyButton.querySelector("img")!;
  const urlInput = app.querySelector<HTMLInputElement>(".url-input")!;

  // Theme toggle functionality
  const themeButton = app.querySelector<HTMLButtonElement>(".theme-button")!;
  themeButton.addEventListener("click", toggleTheme);

  copyButton.addEventListener("click", async () => {
    await navigator.clipboard.writeText(urlInput.value);
    copyIcon.src = "/clipboard-check.svg";

    setTimeout(() => {
      copyIcon.src = "/clipboard.svg";
    }, 2000);
  });

  // Settings modal functionality
  const settingsButton = app.querySelector<HTMLButtonElement>(".settings-button[title='Settings']")!;
  const settingsModal = app.querySelector<HTMLDivElement>("#settingsModal")!;
  const defaultBangInput = app.querySelector<HTMLInputElement>("#defaultBang")!;
  const saveButton = app.querySelector<HTMLButtonElement>(".save-button")!;
  const cancelButton = app.querySelector<HTMLButtonElement>(".cancel-button")!;

  settingsButton.addEventListener("click", () => {
    settingsModal.style.display = "flex";
    defaultBangInput.value = localStorage.getItem("default-bang") ?? DEFAULT_BANG;
  });

  const closeModal = () => {
    settingsModal.style.display = "none";
  };

  // Close modal when clicking outside
  settingsModal.addEventListener("click", (e) => {
    if (e.target === settingsModal) {
      closeModal();
    }
  });

  saveButton.addEventListener("click", () => {
    const newDefaultBang = defaultBangInput.value.trim().toLowerCase();
    if (newDefaultBang) {
      localStorage.setItem("default-bang", newDefaultBang);
    }
    closeModal();
  });

  cancelButton.addEventListener("click", closeModal);
}

const url = new URL(window.location.href);
const DEFAULT_BANG = "g";

const defaultParam = url.searchParams.get("default")?.toLowerCase();
if (defaultParam) {
  localStorage.setItem("default-bang", defaultParam);
}

const defaultBang = bangs.find(
  (b) => b.t === (defaultParam ?? localStorage.getItem("default-bang"))
) || bangs.find((b) => b.t === DEFAULT_BANG);

function getBangredirectUrl() {
  const query = url.searchParams.get("q")?.trim() ?? "";
  if (!query) {
    noSearchDefaultPageRender();
    return null;
  }

  const match = query.match(/!(\S+)/i);

  const bangCandidate = match?.[1]?.toLowerCase();
  const selectedBang = bangs.find((b) => b.t === bangCandidate) ?? defaultBang;

  // Remove the first bang from the query
  const cleanQuery = query.replace(/!\S+\s*/i, "").trim();

  // Format of the url is:
  // https://www.google.com/search?q={{{s}}}
  const searchUrl = selectedBang?.u.replace(
    "{{{s}}}",
    // Replace %2F with / to fix formats like "!ghr+t3dotgg/unduck"
    encodeURIComponent(cleanQuery).replace(/%2F/g, "/")
  );
  if (!searchUrl) return null;

  return searchUrl;
}

function doRedirect() {
  const searchUrl = getBangredirectUrl();
  if (!searchUrl) return;
  window.location.replace(searchUrl);
}

doRedirect();
