const STYLE_ID = "mindvault-web-theme";

/** Adds browser-only details that React Native styles cannot express. */
export function installWebTheme() {
  if (typeof document === "undefined" || document.getElementById(STYLE_ID))
    return;

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    * {
      scrollbar-width: thin;
      scrollbar-color: #789866 transparent;
    }

    *::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }

    *::-webkit-scrollbar-track {
      background: transparent;
    }

    *::-webkit-scrollbar-thumb {
      background: #789866;
      border: 2px solid #101a14;
      border-radius: 999px;
    }

    *::-webkit-scrollbar-thumb:hover {
      background: #a5c77f;
    }

    *::-webkit-scrollbar-corner {
      background: transparent;
    }
  `;
  document.head.appendChild(style);
}
