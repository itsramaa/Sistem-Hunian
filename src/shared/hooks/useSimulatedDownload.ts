export function useSimulatedDownload() {
  const simulateProgress = (
    onProgress: (progress: number) => void,
    durationMs: number = 2000
  ): Promise<void> => {
    return new Promise((resolve) => {
      let progress = 0;
      const interval = durationMs / 100;
      
      const timer = setInterval(() => {
        progress += Math.random() * 10;
        if (progress >= 100) {
          progress = 100;
          clearInterval(timer);
          onProgress(100);
          resolve();
        } else {
          onProgress(Math.floor(progress));
        }
      }, interval);
    });
  };

  return { simulateProgress };
}
