"use client";

import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";

export interface PanoramaViewerHandle {
  /** The live Marzipano RectilinearView — use to project coords */
  getView: () => MarzipanoView | null;
  /** The container element — needed for bounds */
  getContainer: () => HTMLDivElement | null;
}

/** Minimal typings for the parts of Marzipano we actually use */
export interface MarzipanoView {
  yaw: () => number;
  pitch: () => number;
  fov: () => number;
  setParameters: (p: { yaw: number; pitch: number; fov: number }) => void;
  coordinatesToScreen: (
    coords: { yaw: number; pitch: number },
    dest?: { x: number; y: number }
  ) => { x: number; y: number } | null;
  screenToCoordinates: (
    screen: { x: number; y: number },
    dest?: { yaw: number; pitch: number }
  ) => { yaw: number; pitch: number } | null;
}

interface PanoramaViewerProps {
  src: string;
  className?: string;
}

const PanoramaViewer = forwardRef<PanoramaViewerHandle, PanoramaViewerProps>(
  function PanoramaViewer({ src, className }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const viewRef = useRef<MarzipanoView | null>(null);
    const viewerRef = useRef<unknown>(null);

    useImperativeHandle(ref, () => ({
      getView: () => viewRef.current,
      getContainer: () => containerRef.current,
    }));

    useEffect(() => {
      if (!containerRef.current) return;

      let destroyed = false;

      import("marzipano").then((Marzipano) => {
        if (destroyed || !containerRef.current) return;

        if (viewerRef.current) {
          (viewerRef.current as { destroy: () => void }).destroy();
          viewerRef.current = null;
          viewRef.current = null;
        }

        const viewer = new Marzipano.Viewer(containerRef.current, {
          controls: { mouseViewMode: "drag" },
        });
        viewerRef.current = viewer;

        const source = Marzipano.ImageUrlSource.fromString(src);
        const geometry = new Marzipano.EquirectGeometry([{ width: 4096 }]);

        const limiter = Marzipano.RectilinearView.limit.vfov(
          (30 * Math.PI) / 180,
          (120 * Math.PI) / 180
        );

        const view = new Marzipano.RectilinearView(
          { yaw: 0, pitch: 0, fov: (90 * Math.PI) / 180 },
          limiter
        );

        viewRef.current = view as unknown as MarzipanoView;

        const scene = viewer.createScene({ source, geometry, view });
        scene.switchTo({ transitionDuration: 1000 });
      });

      return () => {
        destroyed = true;
        viewRef.current = null;
        if (viewerRef.current) {
          (viewerRef.current as { destroy: () => void }).destroy();
          viewerRef.current = null;
        }
      };
    }, [src]);

    return (
      <div
        ref={containerRef}
        className={`w-full h-full ${className ?? ""}`}
        style={{ minHeight: 0, cursor: "grab" }}
      />
    );
  }
);

export default PanoramaViewer;
