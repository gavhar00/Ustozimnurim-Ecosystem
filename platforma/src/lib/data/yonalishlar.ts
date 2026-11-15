import type { LucideIcon } from "lucide-react";
import { Code2, Database, LineChart, Palette } from "lucide-react";

export type Yonalish = {
  slug: string;
  nom: string;
  tavsif: string;
  ikona: LucideIcon;
};

/**
 * Platformaning kasbiy yo‘nalishlari — mahsulot qarori, o‘ylab topilgan statistika emas.
 * Baza ulangach `yonalishlar` jadvalidan o‘qiladi; hozircha shu ro‘yxat manba.
 */
export const YONALISHLAR: Yonalish[] = [
  {
    slug: "frontend",
    nom: "Frontend Development",
    tavsif: "HTML, CSS, JavaScript va React bilan zamonaviy interfeys qurish.",
    ikona: Code2,
  },
  {
    slug: "backend",
    nom: "Backend Development",
    tavsif: "Server, API va ma’lumotlar bazasi — ilovaning ichki qismi.",
    ikona: Database,
  },
  {
    slug: "data-science",
    nom: "Data Science",
    tavsif: "Ma’lumotlarni tahlil qilish, vizualizatsiya va mashinaviy o‘qitish.",
    ikona: LineChart,
  },
  {
    slug: "ui-ux",
    nom: "UI/UX Design",
    tavsif: "Foydalanuvchi tajribasi, interfeys dizayni va prototiplash.",
    ikona: Palette,
  },
];
