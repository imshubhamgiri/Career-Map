# Feature Specifications & Roadmap

## Phase 1: Ingestion & Normalization (Current)

- [x] **Multi-format Ingestion Engine**:
  - Google Sheets API integration
  - Google Docs API integration
  - Generic Web & DSA blog HTML scraping via Cheerio
  - PDF document parsing via `pdf-parse`
- [x] **AI Extraction Pipeline**:
  - Sliding window chunking with context overlap
  - Structured JSON parsing via Groq (Llama-3.3-70b) and Google Gemini
  - Paced batch concurrency to respect LLM rate limits
- [x] **Problem Normalization**:
  - Canonical slug generation for cross-curriculum deduplication
  - Difficulty standardizing (`Easy`, `Medium`, `Hard`)
  - Topic tagging and hierarchy assignment

---

## Phase 2: Curriculum Management & Tracking (Next)

- [ ] **Interactive Curriculum Tree**:
  - Expandable/collapsible topic nodes with completion percentages
  - Filter by difficulty, completion state, and topic tags
  - Global search across all imported roadmaps
- [ ] **Problem State Tracking**:
  - Interactive state selector: `SOLVED`, `ATTEMPTED`, `REVISE`
  - Personal notes and time tracking per problem
- [ ] **Spaced Repetition Review Queue**:
  - Daily queue of problems flagged for revision based on spaced repetition intervals

---

## Phase 3: External Integrations & Intelligence (Future)

- [ ] **LeetCode Automated Sync**:
  - Background crawler pulling latest solved questions and syncing progress events
- [ ] **GitHub Activity Integration**:
  - Daily commit streak calculation and solution repository sync
- [ ] **AI Interview / Hint Assistant**:
  - On-demand hint generation and algorithmic complexity breakdown without spoiling full solutions

