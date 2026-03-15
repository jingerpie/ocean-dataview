import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";

export const gitConfig = {
  user: "jingchen",
  repo: "ocean-dataview",
  branch: "main",
};

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: "Ocean Dataview",
    },
    githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
  };
}
