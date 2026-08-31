import { Cairo, Heebo, Ubuntu } from "next/font/google";

export const cairo = Cairo({
  subsets: ["arabic", "latin"],
  display: "swap",
  variable: "--font-arabic",
});

export const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  display: "swap",
  variable: "--font-hebrew",
});

export const ubuntu = Ubuntu({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-english",
  weight: ["400", "500", "700"],
});
