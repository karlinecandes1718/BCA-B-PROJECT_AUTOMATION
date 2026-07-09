"use client";

import { useEffect } from "react";

export default function SecurityGuard() {
  useEffect(() => {
    // 1. Prevent right-click context menu
    const handleContextMenu = (e) => {
      e.preventDefault();
    };
    document.addEventListener("contextmenu", handleContextMenu);

    // 2. Prevent common developer tools shortcuts
    const handleKeyDown = (e) => {
      // Disable F12 (F12 keycode is 123)
      if (e.key === "F12" || e.keyCode === 123) {
        e.preventDefault();
        return false;
      }

      // Disable Ctrl+Shift+I / J / C (Inspect / Console / Element select)
      if (
        e.ctrlKey &&
        e.shiftKey &&
        (e.key === "I" || e.key === "J" || e.key === "C" || e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67)
      ) {
        e.preventDefault();
        return false;
      }

      // Disable Cmd+Opt+I (macOS inspect shortcut)
      if (e.metaKey && e.altKey && (e.key === "i" || e.key === "I" || e.keyCode === 73)) {
        e.preventDefault();
        return false;
      }

      // Disable Ctrl+U / Cmd+U (View Source code)
      if ((e.ctrlKey || e.metaKey) && (e.key === "u" || e.key === "U" || e.keyCode === 85)) {
        e.preventDefault();
        return false;
      }
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return null;
}
