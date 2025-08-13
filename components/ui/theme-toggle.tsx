"use client";

import { Sun, Moon, ArrowUp } from "lucide-react";
import { useTheme } from "next-themes";

function handleScrollTop() {
  window.scroll({
    top: 0,
    behavior: "smooth",
  });
}

const ThemeToggle = () => {
  const { setTheme, theme } = useTheme();

  return (
    <div className="flex items-center justify-center">
      <div className="flex items-center rounded-full border border-dotted border-gray-300 bg-white">
        <button
          onClick={() => setTheme("light")}
          className={`rounded-full p-2 mr-3 transition-colors ${
            theme === "light" 
              ? "bg-blue-600 text-white" 
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <Sun className="h-5 w-5" strokeWidth={1} />
          <span className="sr-only">Light theme</span>
        </button>

        <button type="button" onClick={handleScrollTop} className="p-2">
          <ArrowUp className="h-3 w-3 text-gray-600" />
          <span className="sr-only">Scroll to top</span>
        </button>

        <button
          onClick={() => setTheme("dark")}
          className={`rounded-full p-2 ml-3 transition-colors ${
            theme === "dark" 
              ? "bg-blue-600 text-white" 
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <Moon className="h-5 w-5" strokeWidth={1} />
          <span className="sr-only">Dark theme</span>
        </button>
      </div>
    </div>
  );
};

export default ThemeToggle;