# Roadmap Ingestion Flow

## Overview

The roadmap ingestion pipeline ingests unstructured learning materials and converts them into structured, trackable entities (`roadmaps`, `problems`).
The roadmap ingestion pipeline ingests unstructured learning materials (Google Sheets, Google Docs, PDFs, Web links) and converts them into structured, trackable entities mapped to a **Canonical Problem Bank**.

```mermaid
flowchart TD
    User([User]) -->|Submit URL or File| Endpoint["POST /api/v1/ingest/url or /file"]
    Endpoint --> IngestCtrl["Ingest Controller"]
    
    subgraph Stage0["0. Extraction Cache Check (Clone-on-Ingest)"]
        IngestCtrl --> CacheCheck{"Existing roadmap with source_url in DB?\n(and forceRefresh != true)"}
        CacheCheck -- Yes --> CloneDB["SQL Batch Clone\nDuplicate Roadmap & Problems for User"]
        CloneDB --> SuccessFast["200 OK (~5ms, 0 LLM tokens)"]
        CacheCheck -- Yes --> CloneDB["SQL Batch Clone\nCopy Roadmap & roadmap_problems for User"]
        CloneDB --> SuccessFast["200 OK (~10ms, 0 LLM tokens)"]
    end

    subgraph Stage1["1. Extraction & Normalization"]
        CacheCheck -- No --> Dispatcher["Extractor Dispatcher"]
        Dispatcher -->|Google Sheet| SheetExt["Sheet Extractor"]
        Dispatcher -->|Google Doc| DocExt["Doc Extractor"]
        Dispatcher -->|Web Page| WebExt["Cheerio Extractor"]
        Dispatcher -->|PDF Upload| PdfExt["pdf-parse Extractor"]
        SheetExt & DocExt & WebExt & PdfExt --> NormalizedText["Normalized Text (string[])"]
    end

    subgraph Stage2["2. Tiered LLM Extraction"]
        NormalizedText --> Tier1Check{"Lines <= 350?"}
        Tier1Check -- Yes --> GemSingle["Tier 1A: Gemini 3.6 Flash\nSingle-Shot (32k token buffer)"]
        Tier1Check -- No --> GemChunk["Tier 1B: Gemini 3.6 Flash\nLarge Chunks (150 lines)"]
        GemSingle & GemChunk -->|Success| Dedupe
        GemSingle & GemChunk -->|Error / 429 Failover| GroqChunk["Tier 2: Groq Fallback\nSafe Chunks (7 lines, 1.5k buffer)\nwith 8s rate-limit backoff"]
        GroqChunk --> Dedupe
    end

    subgraph Stage3["3. Quality Gate & Persistence"]
        Dedupe["Deduplicate by URL / Title"] --> QualityGate{"Quality Gate\n(totalExtracted > 0?)"}
    subgraph Stage3["3. Identity Resolution & Canonical Linking"]
        Dedupe["Deduplicate Extracted Items"] --> QualityGate{"Quality Gate\n(totalExtracted > 0?)"}
        QualityGate -- No --> ErrResp["422 Unprocessable Content"]
        QualityGate -- Yes --> PersistDB["Persist to PostgreSQL\n(roadmaps & problems)"]
        PersistDB --> Success["200 OK"]
        QualityGate -- Yes --> IdResolver["Problem Identity Resolver\n(Extract universal canonical slugs)"]
        IdResolver --> BatchMatch["Batch Database Matching\nWHERE canonical_slug IN (...)"]
        BatchMatch --> SplitMatch{"Partition by Map:\nMatched vs Unmatched"}
        SplitMatch -->|Unmatched| CreateNew["createManyAndReturn into problems"]
        SplitMatch -->|Matched| ReuseId["Retrieve existing problem_ids"]
        CreateNew & ReuseId --> LinkJunction["createMany into roadmap_problems"]
        LinkJunction --> Success["200 OK"]
    end
```

## Step-by-Step Pipeline
---

1. **Submission**:
   - `POST /api/v1/ingest/url`: Validated body `{ url: string, forceRefresh?: boolean }`.
   - `POST /api/v1/ingest/file`: Multipart upload (`multer`) with PDF file.
## End-to-End Problem Lifecycle

2. **Extraction Cache Check ("Clone-on-Ingest")**:
   - If `source_url` exists in the `roadmaps` table and `forceRefresh` is not requested, the backend bypasses the LLM entirely.
   - It performs an atomic SQL clone into a new `roadmaps` and `problems` record set assigned directly to the requesting user.
   - Response time: $\sim 5\text{ms}$; LLM tokens consumed: 0.
```
             ROADMAP INGESTION
                    │
                    ▼
            LLM STRUCTURING
                    │
                    ▼
          IDENTITY RESOLUTION
                    │
                    ▼
             CANONICAL PROBLEM
                    │
                    ▼
          ROADMAP_PROBLEM LINK
                    │
                    │
           later: submission
                    │
                    ▼
          USER_PROBLEM_PROGRESS
                    │
                    ▼
              AI ANALYSIS
                    │
                    ▼
                NOTES
                    │
                    ▼
             GITHUB SYNC
```

3. **Extraction (`src/services/extractors/`)**:
   - For novel URLs, the dispatcher determines the source type and extracts textual content into an array of clean lines (`string[]`).
---

4. **Tiered LLM Parsing (`src/services/ingestion/llmParser.service.ts`)**:
   - **Tier 1 (Google Gemini 3.6 Flash)**: Handles up to 350 lines in a single pass with `maxOutputTokens: 32000`. Larger documents are partitioned into 150-line blocks.
   - **Tier 2 (Groq Fallback)**: If Gemini experiences quota limits or errors, the pipeline automatically fails over to Groq (`openai/gpt-oss-20b`) with 7-line chunks and 8-second 429 backoff retry pacing.
## Identity Resolution & Batch Matching Logic

5. **Deduplication & Quality Gate**:
   - Problems extracted from the LLM are deduplicated by URL or canonicalized title.
   - If 0 problems are found, an error (422) is returned.
   - On success, problems and roadmap records are persisted to PostgreSQL.
When the LLM extracts problems (e.g. 7 problems, where 3 exist from a previous roadmap and 4 are brand new):

1. **Normalization to Canonical Slugs**:
   - Platform-agnostic kebab-case identifier (e.g. `two-sum`, `valid-anagram`, `coin-change`).
   - Standardizes variations across platforms (e.g., GFG "Key Pair" and LeetCode "Two Sum" both resolve to `two-sum`).
2. **Batch Query 1 (`WHERE canonical_slug IN (...)`)**:
   ```sql
   SELECT id, canonical_slug FROM problems WHERE canonical_slug IN ('two-sum', '3sum', 'valid-anagram', 'subsets', 'word-search', 'coin-change', 'climbing-stairs');
   ```
3. **In-Memory Partitioning via Map**:
   - `slugToIdMap: Map<canonicalSlug, problemId>`
   - Matched items: 3 problems already exist $\rightarrow$ assign their `id`.
   - Unmatched items: 4 problems need creation.
4. **Batch Query 2 (Insert Unmatched)**:
   ```typescript
   const newlyCreated = await tx.problem.createManyAndReturn({
     data: unmatched.map(p => ({
       canonicalSlug: p.slug,
       title: p.title,
       difficulty: p.difficulty,
       platform: p.platform,
       externalUrl: p.url,
     })),
     select: { id: true, canonicalSlug: true }
   });
   for (const p of newlyCreated) {
     slugToIdMap.set(p.canonicalSlug, p.id);
   }
   ```
5. **Batch Query 3 (Insert Junction Rows)**:
   ```typescript
   const roadmapProblemsData = extractedProblems.map((p, index) => ({
     roadmapId: newRoadmap.id,
     problemId: slugToIdMap.get(p.slug)!,
     topic: p.topic,
     originalTitle: p.title,
     originalUrl: p.url,
     originalCategory: p.category,
     originalDifficulty: p.difficulty,
     orderIndex: index,
   }));

   await tx.roadmapProblem.createMany({ data: roadmapProblemsData });
   ```

---

## change In ingestion Process
## Downstream Integrations


                        Google Sheet / PDF
                                ↓
                        Raw extraction
                                ↓
                        LLM structuring
                                ↓
                        RoadmapProblemCandidate
                                ↓
                        Problem Identity Resolver  ← NEW
                                ↓
                        ┌──────────────────────────────┐
                        │ Does canonical problem exist?│
                        └──────────────┬───────────────┘
                                    │
                            ┌───────┴────────┐
                            │                │
                            YES               NO
                            │                │
                            ▼                ▼
                        link existing      create new
                        Problem            Problem
                            │                │
                            └───────┬────────┘
                                    ▼
                            create RoadmapProblem


 This change introduces a new step in the ingestion process called the "Problem Identity Resolver." This step checks if a canonical problem already exists in the database. If it does, the existing problem is linked to the new roadmap. If not, a new problem is created and then linked to the roadmap. This ensures that duplicate problems are not created and maintains a clean and organized database of problems.


- **`progress_events`**: Tracks `(user_id, problem_id)`. Cross-roadmap progress synchronizes effortlessly because progress attaches to the canonical problem.
- **AI Analysis**: Code evaluations and complexity assessments attach to the canonical problem context.
- **Notes**: Personal approaches and notes remain available regardless of which roadmap is opened.
- **GitHub Sync**:
  - `progress_events.github_sync_status`: `NOT_SYNCED`, `PENDING`, `SYNCED`, `FAILED`.
  - Commits solutions cleanly as `solutions/<canonical-slug>.<ext>` to the user's connected GitHub repository, avoiding duplicate file pollution across roadmaps.
