import { Github, Linkedin, Mail, type LucideIcon } from "lucide-react";

export interface Social {
  name: string;
  url: string;
  icon: LucideIcon;
}

export const socials: Social[] = [
  {
    name: "GitHub",
    url: "https://github.com/Szostak21",
    icon: Github,
  },
  {
    name: "LinkedIn",
    url: "https://www.linkedin.com/in/pawe%C5%82-szostak-0867703a8/",
    icon: Linkedin,
  },
  {
    name: "Email",
    url: "mailto:pszostak.contact@gmail.com",
    icon: Mail,
  },
];

export const siteConfig = {
  name: "Paweł Szostak",
  title: "Full Stack Developer",
  description: "I build useful products with modern web stack",
};
