"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { fetchIngestStatus } from "../services/ingest.service";
import type { IngestStatus, IngestStatusResponse } from "../types";

export interface UseIngestPollingOptions {
  /** Polling interval in milliseconds (default: 2500ms) */
  intervalMs?: number;
  /** Maximum number of polling attempts before timing out (default: 60 = ~2.5 mins) */
  maxAttempts?: number;
  /** Whether polling is actively enabled (default: true) */
  enabled?: boolean;
  /** Callback triggered when status reaches COMPLETED */
  onCompleted?: (data: IngestStatusResponse) => void;
  /** Callback triggered when status becomes FAILED or on timeout */
  onFailed?: (errorMessage: string) => void;
}

export interface UseIngestPollingResult {
  statusData: IngestStatusResponse | null;
  status: IngestStatus | null;
  isLoading: boolean;
  isPolling: boolean;
  error: string | null;
  attempts: number;
  refetch: () => Promise<void>;
  stopPolling: () => void;
}

/**
 * Custom React hook for polling roadmap ingestion progress.
 *
 * Hits the lightweight GET /api/v1/ingest/status/:roadmapId endpoint.
 * Automatically ceases polling on COMPLETED or FAILED states, protects against
 * stale component unmounts, and halts polling when the browser tab is hidden.
 */
export function useIngestPolling(
  roadmapId: string | null | undefined,
  options: UseIngestPollingOptions = {}
): UseIngestPollingResult {
  const {
    intervalMs = 2500,
    maxAttempts = 60,
    enabled = true,
    onCompleted,
    onFailed,
  } = options;

  const [statusData, setStatusData] = useState<IngestStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPolling, setIsPolling] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState<number>(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const isCancelledRef = useRef<boolean>(false);
  const attemptsRef = useRef<number>(0);
  const onCompletedRef = useRef(onCompleted);
  const onFailedRef = useRef(onFailed);

  onCompletedRef.current = onCompleted;
  onFailedRef.current = onFailed;

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const stopPolling = useCallback(() => {
    isCancelledRef.current = true;
    clearTimer();
    if (isMountedRef.current) {
      setIsPolling(false);
    }
  }, [clearTimer]);

  const executePoll = useCallback(
    async (isManualTrigger = false): Promise<IngestStatusResponse | null> => {
      if (!roadmapId || isCancelledRef.current) return null;

      try {
        const data = await fetchIngestStatus(roadmapId);

        if (!isMountedRef.current || isCancelledRef.current) return null;

        setStatusData(data);
        setError(null);
        setIsLoading(false);

        // Success state
        if (data.status === "COMPLETED") {
          setIsPolling(false);
          clearTimer();
          onCompletedRef.current?.(data);
          return data;
        }

        // Failure state
        if (data.status === "FAILED") {
          setIsPolling(false);
          clearTimer();
          const failMsg = data.errorMessage || "Roadmap ingestion failed";
          setError(failMsg);
          onFailedRef.current?.(failMsg);
          return data;
        }

        // Still PENDING or PROCESSING
        if (data.status === "PROCESSING" || data.status === "PENDING") {
          attemptsRef.current += 1;
          setAttempts(attemptsRef.current);

          if (attemptsRef.current >= maxAttempts) {
            setIsPolling(false);
            clearTimer();
            const timeoutMsg = "Ingestion is taking longer than expected. Please check back shortly.";
            setError(timeoutMsg);
            onFailedRef.current?.(timeoutMsg);
            return data;
          }

          if (enabled && !isCancelledRef.current) {
            setIsPolling(true);
            scheduleNextPoll();
          }
        }

        return data;
      } catch (err: any) {
        if (!isMountedRef.current || isCancelledRef.current) return null;

        const errMsg = err?.message || "Failed to fetch ingestion status";
        if (isManualTrigger) {
          setError(errMsg);
        }
        setIsLoading(false);

        // Continue polling on transient network glitches until maxAttempts
        if (enabled && !isCancelledRef.current && attemptsRef.current < maxAttempts) {
          scheduleNextPoll();
        }
        return null;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [roadmapId, enabled, maxAttempts, clearTimer]
  );

  const scheduleNextPoll = useCallback(() => {
    clearTimer();
    if (isCancelledRef.current || !enabled) return;

    timerRef.current = setTimeout(() => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        const handleVisibilityChange = () => {
          if (document.visibilityState === "visible") {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            executePoll();
          }
        };
        document.addEventListener("visibilitychange", handleVisibilityChange, { once: true });
        return;
      }

      executePoll();
    }, intervalMs);
  }, [clearTimer, enabled, intervalMs, executePoll]);

  useEffect(() => {
    isMountedRef.current = true;
    isCancelledRef.current = false;
    attemptsRef.current = 0;
    setAttempts(0);
    setIsLoading(true);
    setError(null);

    if (roadmapId) {
      executePoll();
    } else {
      setIsLoading(false);
    }

    return () => {
      isMountedRef.current = false;
      isCancelledRef.current = true;
      clearTimer();
    };
  }, [roadmapId, executePoll, clearTimer]);

  const refetch = useCallback(async () => {
    isCancelledRef.current = false;
    attemptsRef.current = 0;
    setAttempts(0);
    setIsLoading(true);
    setError(null);
    await executePoll(true);
  }, [executePoll]);

  return {
    statusData,
    status: statusData?.status ?? null,
    isLoading,
    isPolling,
    error,
    attempts,
    refetch,
    stopPolling,
  };
}
