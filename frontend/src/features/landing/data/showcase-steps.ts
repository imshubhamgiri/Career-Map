import { ShowcaseStep } from "../types/showcase.types";

export const SHOWCASE_STEPS: ShowcaseStep[] = [
  {
    id: "ingest",
    stepNumber: "01",
    badge: "Import Roadmap",
    shortTitle: "1. Import",
    title: "Paste a roadmap link or upload a PDF",
    description:
      "Paste any course syllabus, sheet URL (like Striver's sheet or NeetCode), or upload a PDF. We extract every question, organize them by topic, and generate your ready-to-solve checklist.",
    durationMs: 4200,
    highlightTag: "URL or PDF Upload",
    takeaways: [
      "Accepts web links or PDF documents",
      "Extracts questions with topic tags and difficulty",
      "Creates an interactive checklist with 1 click",
    ],
  },
  {
    id: "config",
    stepNumber: "02",
    badge: "Extension Setup",
    shortTitle: "2. Extension",
    title: "Get your API key & setup the extension",
    description:
      "Head to Settings in Career OS, click 'Generate API Key', install the Career OS Chrome extension, and paste your key into it. It takes under 15 seconds.",
    durationMs: 4000,
    highlightTag: "15-Sec Setup",
    takeaways: [
      "Generate an API key with 1 click in Settings",
      "Paste it once in the Chrome extension popup",
      "Ready to track without logging in repeatedly",
    ],
  },
  {
    id: "github",
    stepNumber: "03",
    badge: "GitHub Backup",
    shortTitle: "3. GitHub (Optional)",
    title: "Connect your GitHub repository (Optional)",
    description:
      "Want all your accepted code pushed to GitHub automatically? Enable GitHub in Settings and select your repo. If not, just leave it off—it is 100% optional.",
    durationMs: 3800,
    highlightTag: "Optional Backup",
    takeaways: [
      "Completely optional — turn it on or off anytime",
      "Select your custom repository and branch",
      "Pushes your solutions cleanly on every submit",
    ],
  },
  {
    id: "submission",
    stepNumber: "04",
    badge: "Solve on LeetCode",
    shortTitle: "4. LeetCode",
    title: "Solve on LeetCode — we catch your Accepted answer",
    description:
      "Open any problem on LeetCode and solve it normally. As soon as you hit Submit and get Accepted, our Chrome extension catches it and marks the question complete in your roadmap.",
    durationMs: 4500,
    highlightTag: "Auto-Detected",
    takeaways: [
      "Looks and works inside real LeetCode",
      "Extension detects 'Accepted' verdicts instantly",
      "Your Career OS roadmap updates in the background",
    ],
  },
  {
    id: "notes",
    stepNumber: "05",
    badge: "Smart Revision",
    shortTitle: "5. Notes",
    title: "Instant approach notes — plus add your own",
    description:
      "Never bang your head months later wondering how your code worked. Career OS writes a clear breakdown explaining why this approach was chosen, and you can edit or add your own personal notes.",
    durationMs: 4200,
    highlightTag: "Editable Notes",
    takeaways: [
      "Clear explanation of why this algorithm was chosen",
      "Highlights common pitfalls and tricky edge cases",
      "Add your personal notes or edit the generated breakdown",
    ],
  },
  {
    id: "git-push",
    stepNumber: "06",
    badge: "Find Code Easily",
    shortTitle: "6. Code Link",
    title: "Your GitHub code is linked right on the question",
    description:
      "Never dig through hundreds of commits or folders to find your code. The exact GitHub commit link and your notes are pinned directly to the question in Career OS.",
    durationMs: 4000,
    highlightTag: "Direct Links",
    takeaways: [
      "Every question has a direct 'View Code on GitHub' link",
      "All notes and code files are connected in one place",
      "Zero time wasted searching for old solutions",
    ],
  },
  {
    id: "multi-roadmap",
    stepNumber: "07",
    badge: "Shared Progress",
    shortTitle: "7. All Sheets",
    title: "All your roadmaps share the same notes and progress",
    description:
      "Following Striver's sheet AND NeetCode 150? Solve a problem once, and it gets marked done across all roadmaps. Your notes, code, and progress are synced everywhere.",
    durationMs: 4200,
    highlightTag: "Synced Everywhere",
    takeaways: [
      "Solve once — updates across multiple roadmaps",
      "Shared notes vault across all your learning goals",
      "Snap photo of notebook notes (Coming soon)",
    ],
  },
];
