import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Designers — Conscious Creators",
  description:
    "Caelinus Designers. Bilinçli yaratıcılar için global vitrin. Hikâyeli tasarımlarını AI avatar mankenlerde sergile.",
  openGraph: {
    title: "Caelinus Designers",
    description: "Global conscious creators of the Caelinus universe.",
    type: "website",
  },
};

export default function DesignersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
