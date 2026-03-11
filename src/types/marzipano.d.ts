declare module "marzipano" {
  class Viewer {
    constructor(element: HTMLElement, options?: Record<string, unknown>);
    createScene(options: Record<string, unknown>): Scene;
    destroy(): void;
  }
  class Scene {
    switchTo(options?: Record<string, unknown>): void;
  }
  class ImageUrlSource {
    static fromString(url: string): ImageUrlSource;
  }
  class EquirectGeometry {
    constructor(levels: Array<{ width: number }>);
  }
  class RectilinearView {
    constructor(params: Record<string, unknown>, limiter: unknown);
    static limit: {
        traditional(maxResolution: number, maxFov: number, minFov: number): unknown;
        vfov(minFov: number, maxFov: number): unknown;
        hfov(minFov: number, maxFov: number): unknown;
      };
  }
}
