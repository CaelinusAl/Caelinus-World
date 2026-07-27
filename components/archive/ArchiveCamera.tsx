"use client";

export type ArchiveCameraState = { x: number; y: number; zoom: number };

type ArchiveCameraProps = {
  camera: ArchiveCameraState;
  onCamera: (camera: ArchiveCameraState) => void;
};

export const ARCHIVE_CAMERA_LIMITS = {
  minZoom: 0.7,
  maxZoom: 2.2,
  panStep: 24,
} as const;

export function constrainCamera(camera: ArchiveCameraState): ArchiveCameraState {
  return {
    x: Math.max(-240, Math.min(240, camera.x)),
    y: Math.max(-160, Math.min(160, camera.y)),
    zoom: Math.max(
      ARCHIVE_CAMERA_LIMITS.minZoom,
      Math.min(ARCHIVE_CAMERA_LIMITS.maxZoom, camera.zoom),
    ),
  };
}

export default function ArchiveCamera({ camera, onCamera }: ArchiveCameraProps) {
  const update = (next: ArchiveCameraState) => onCamera(constrainCamera(next));
  return (
    <div className="archive-camera-controls" aria-label="Kamera kontrolleri">
      <button type="button" onClick={() => update({ ...camera, x: camera.x + ARCHIVE_CAMERA_LIMITS.panStep })} aria-label="Kamerayı sola taşı">←</button>
      <button type="button" onClick={() => update({ ...camera, y: camera.y + ARCHIVE_CAMERA_LIMITS.panStep })} aria-label="Kamerayı yukarı taşı">↑</button>
      <button type="button" onClick={() => update({ ...camera, y: camera.y - ARCHIVE_CAMERA_LIMITS.panStep })} aria-label="Kamerayı aşağı taşı">↓</button>
      <button type="button" onClick={() => update({ ...camera, x: camera.x - ARCHIVE_CAMERA_LIMITS.panStep })} aria-label="Kamerayı sağa taşı">→</button>
      <button type="button" onClick={() => update({ ...camera, zoom: camera.zoom - 0.15 })} aria-label="Uzaklaştır">−</button>
      <output aria-label="Yakınlaştırma">{Math.round(camera.zoom * 100)}%</output>
      <button type="button" onClick={() => update({ ...camera, zoom: camera.zoom + 0.15 })} aria-label="Yakınlaştır">+</button>
      <button type="button" onClick={() => onCamera({ x: 0, y: 0, zoom: 1 })}>Sıfırla</button>
    </div>
  );
}
