// The site's own address, for link previews, the sitemap and robots.txt.
// Vercel sets this variable to the production domain (a custom domain once
// one is added); local builds fall back to localhost.
export const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

export const REPOSITORY = "https://github.com/haygenwarren/mission-atlas";

export const AUTHOR = {
  name: "Haygen Warren",
  github: "https://github.com/haygenwarren",
};
