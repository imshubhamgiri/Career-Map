// import fs from 'fs';
// import path from 'path';
// import { normalizeGoogleSheet } from "../services/extractors/googleSheet.extractor";
// import { processDocumentPipeline } from "../services/ingestion/pipeline.service";

// async function testNormalizeGoogleSheet() {
//     const spreadsheetId = "1mvlc8EYc3OVVU3X7NKoC0iZJr_45BL_pVxiJec0r94c"; // Replace with a valid Google Sheet ID

//     try {
//         const normalizedData = await normalizeGoogleSheet(spreadsheetId);
//         console.log(`Extracted ${normalizedData.length} raw lines from Google Sheet.\n`);
//         return normalizedData;
//     } catch (error) {
//         console.error("Error normalizing Google Sheet:", error);
//         throw error;
//     }
// }

// async function getResults() {
//     try {
//         const data = await testNormalizeGoogleSheet();
//         console.log("Raw extracted data from Google Sheet:\n", data);
//         if (!data || data.length === 0) {
//             console.log("No data returned from Google Sheet.");
//             return;
//         }

//         console.log("Processing document pipeline (chunking + Groq LLM parsing)...");
//         const result = await processDocumentPipeline(data);

//         if (!result.success) {
//             console.warn("Pipeline returned failure:", result.message);
//             return;
//         }

//         console.log(`\n================== RESULTS SUMMARY ==================`);
//         console.log(`Total Extracted Questions: ${result.totalExtracted}\n`);

//         // 1. Display as a clean, formatted table in the console
//         const tableData = result.data.map((q, idx) => ({
//             "#": idx + 1,
//             Title: q.title,
//             Category: q.category,
//             Difficulty: q.difficulty,
//             Platform: q.platform,
//             URL: q.url || "(None)"
//         }));
//         console.table(tableData);

//         // 2. Save full structured result to a temporary output.json
//         const outputPath = path.resolve(__dirname, "output.json");
//         fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), "utf-8");
//         console.log(`\n Detailed JSON saved to: ${outputPath}`);

//         // 3. Quick breakdown stats
//         const difficultyCounts = result.data.reduce((acc, q) => {
//             acc[q.difficulty] = (acc[q.difficulty] || 0) + 1;
//             return acc;
//         }, {} as Record<string, number>);

//         const platformCounts = result.data.reduce((acc, q) => {
//             acc[q.platform] = (acc[q.platform] || 0) + 1;
//             return acc;
//         }, {} as Record<string, number>);

//         console.log("\n--- Breakdown by Difficulty ---");
//         console.table(difficultyCounts);

//         console.log("\n--- Breakdown by Platform ---");
//         console.table(platformCounts);

//     } catch (error) {
//         console.error("Error during pipeline test execution:", error);
//     }
// }

// getResults();

// async function newFunction() {
//     const url = "https://docs.google.com/spreadsheets/d/1mvlc8EYc3OVVU3X7NKoC0iZJr_45BL_pVxiJec0r94c/edit#gid=0";

//     const models = await fetch("https://api.groq.com/openai/v1/models",{
//         "method": "GET",
//         "headers": {
//             "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
//             "Content-Type": "application/json"
//         }
//     })

//     models.json().then((data) => {
//         console.log("Available models from Groq API:", data);
//     })

// }

// newFunction();

const url = "https://docs.google.com/document/d/1krrCrWl-uvcgV8Q6FTQDiJpUZdmvys0wHly7nRriI6c/edit?tab=t.0";
const sourceType = new URL(url).pathname[0] === '/' ? new URL(url).pathname.split('/')[1] : new URL(url).pathname;
console.log("Source Type:", sourceType);