"use client";

import { useEffect } from "react";
import { registerServiceWorker } from "@workspace/lib/registerServiceWorker";
import { modelService } from "@workspace/model/modelService";

export function AppBootstrapper() {
  useEffect(() => {
    // 1. Register Service Worker — starts caching model files in background
    //    Future visits will load model files from cache instantly.
    registerServiceWorker();

    // 2. Start loading the model proactively.
    //    - First visit: SW pre-cached the files during install,
    //      so the fetch is already fast
    //    - Repeat visits: SW serves from cache → near-instant load
    //    - modelService.load() is idempotent — calling it again does nothing
    modelService.load();
  }, []);

  return null;
}
