import { apiClient } from "@/lib/api-client";
import type { Roadmap, RoadmapDetail, TopicGroup, RoadmapProblemItem } from "../types";
import { SAMPLE_ROADMAP } from "./mock-data";

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export async function fetchUserRoadmaps(): Promise<Roadmap[]> {
  try {
    const response = await apiClient.get<ApiResponse<Roadmap[]>>("/roadmaps");
    if (response?.data && Array.isArray(response.data)) {
      return response.data;
    }
    return [];
  } catch (error) {
    // If backend is unreachable or user has no roadmaps, return empty array
    return [];
  }
}

export async function fetchRoadmapById(id: string): Promise<RoadmapDetail | null> {
  if (id === "sample-neetcode-150" || id === "demo") {
    return SAMPLE_ROADMAP;
  }

  try {
    const response = await apiClient.get<ApiResponse<any>>(`/roadmaps/${id}`);
    if (!response?.data) return null;

    const raw = response.data;
    // Normalize raw roadmapProblems into grouped topics
    const rawProblems = (raw.roadmapProblems || []) as any[];
    
    // Group problems by topic
    const topicMap = new Map<string, RoadmapProblemItem[]>();

    rawProblems.forEach((rp) => {
      const topicName = rp.topic || "General";
      const item: RoadmapProblemItem = {
        id: rp.id,
        roadmapId: rp.roadmapId,
        problemId: rp.problemId,
        topic: topicName,
        originalTitle: rp.originalTitle || rp.problem?.title || "Untitled Problem",
        originalUrl: rp.originalUrl || rp.problem?.externalUrl,
        originalCategory: rp.originalCategory,
        originalDifficulty: rp.originalDifficulty || rp.problem?.difficulty || "UNKNOWN",
        orderIndex: rp.orderIndex ?? 0,
        status: rp.progressEvent?.status || rp.problem?.progressEvents?.[0]?.status || "NOT_STARTED",
        solvedAt: rp.progressEvent?.solvedAt || rp.problem?.progressEvents?.[0]?.solvedAt,
        githubSyncStatus: rp.submission?.githubSyncStatus || rp.problem?.submissions?.[0]?.githubSyncStatus || null,
        githubRepo: rp.submission?.githubRepo || rp.problem?.submissions?.[0]?.githubRepo,
        githubCommitSha: rp.submission?.githubCommitSha || rp.problem?.submissions?.[0]?.githubCommitSha,
        githubFilePath: rp.submission?.githubFilePath || rp.problem?.submissions?.[0]?.githubFilePath,
        timeComplexity: rp.submission?.timeComplexity || rp.problem?.submissions?.[0]?.timeComplexity,
        spaceComplexity: rp.submission?.spaceComplexity || rp.problem?.submissions?.[0]?.spaceComplexity,
        aiNotes: rp.progressEvent?.aiNotes || rp.problem?.progressEvents?.[0]?.aiNotes,
        language: rp.submission?.language || rp.problem?.submissions?.[0]?.language,
        code: rp.submission?.code || rp.problem?.submissions?.[0]?.code,
        problem: rp.problem,
      };

      if (!topicMap.has(topicName)) {
        topicMap.set(topicName, []);
      }
      topicMap.get(topicName)!.push(item);
    });

    const topics: TopicGroup[] = Array.from(topicMap.entries()).map(([topic, problems]) => {
      const solved = problems.filter((p) => p.status === "SOLVED").length;
      const total = problems.length;
      return {
        topic,
        total,
        solved,
        progressPercentage: total > 0 ? Math.round((solved / total) * 1000) / 10 : 0,
        problems,
      };
    });

    const totalProblems = rawProblems.length;
    const solvedProblems = rawProblems.filter(
      (p) => (p.progressEvent?.status || p.problem?.progressEvents?.[0]?.status) === "SOLVED"
    ).length;

    return {
      id: raw.id,
      userId: raw.userId,
      title: raw.title,
      sourceType: raw.sourceType,
      sourceUrl: raw.sourceUrl,
      status: raw.status,
      errorMessage: raw.errorMessage,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      totalProblems,
      solvedProblems,
      progressPercentage: totalProblems > 0 ? Math.round((solvedProblems / totalProblems) * 1000) / 10 : 0,
      roadmapProblems: rawProblems,
      topics,
    };
  } catch (error) {
    // If roadmap ID is not in backend yet, fallback to sample for previewing
    return SAMPLE_ROADMAP;
  }
}

export async function deleteRoadmap(id: string): Promise<boolean> {
  try {
    await apiClient.delete(`/roadmaps/${id}`);
    return true;
  } catch {
    return false;
  }
}
