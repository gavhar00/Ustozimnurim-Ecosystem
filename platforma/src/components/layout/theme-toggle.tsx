"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

type Theme = "dark" | "light";

export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [tayyor, setTayyor] = useState(false);

  useEffect(() => {
    // Mavzuni keyingi kadrda o‘qiymiz — effekt ichida bevosita setState
    // chaqirmaslik uchun.
    const kadr = requestAnimationFrame(() => {
      setTheme(
        document.documentElement.classList.contains("light") ? "light" : "dark",
      );
      setTayyor(true);
    });
    return () => cancelAnimationFrame(kadr);
  }, []);

  function almashtir() {
    const yangi: Theme = theme === "dark" ? "light" : "dark";
    const root = document.documentElement;
    root.classList.remove("dark", "light");
    root.classList.add(yangi);
    root.style.colorScheme = yangi;
    try {
      localStorage.setItem("un-theme", yangi);
    } catch {
      /* localStorage mavjud bo‘lmasa — jim o‘tamiz */
    }
    setTheme(yangi);
  }

  return (
    <button
      type="button"
      onClick={almashtir}
      aria-label={
        theme === "dark" ? "Yorug‘ rejimga o‘tish" : "Qorong‘i rejimga o‘tish"
      }
      className={className}
    >
      {tayyor && theme === "light" ? (
        <Sun className="size-[18px]" aria-hidden="true" />
      ) : (
        <Moon className="size-[18px]" aria-hidden="true" />
      )}
    </button>
  );
}
