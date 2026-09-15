import prisma from '../config/db';
import { Roadmap, RoadmapStatus } from '@prisma/client';

export interface RoadmapInput {
  userId: string;
  title: string;
  sourceType: string;
  sourceUrl?: string;
  status?: RoadmapStatus;
  errorMessage?: string;
}

export class RoadmapRepository {
  createRoadmap(data: RoadmapInput): Promise<Roadmap> {
    return prisma.roadmap.create({ data });
  }

  updateRoadmapStatus(
    roadmapId: string,
    status: RoadmapStatus,
    errorMessage?: string
  ): Promise<Roadmap> {
    return prisma.roadmap.update({
      where: { id: roadmapId },
      data: {
        status,
        ...(errorMessage !== undefined && { errorMessage })
      }
    });
  }
}