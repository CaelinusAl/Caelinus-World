"use client";

/**
 * CameraRig — masaüstü gezinti kontrolcüsü.
 *
 *   • WASD / ok tuşları → meydanda yürüme (XZ düzleminde, bakış yönüne göre).
 *   • Mouse → bakış (yaw/pitch; pointer konumu hedefe yumuşak takip — pointer
 *     lock YOK, böylece kapılar tıklanabilir kalır).
 *   • Yürünebilir alan kare sınırla kısıtlı; göz yüksekliği sabit.
 *
 * Mobilde kullanılmaz — orada OrbitControls (orbit/parallax) devreye girer.
 */

import { useEffect, useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";

const SPEED = 7; // birim/sn
const BOUND = 30; // yürünebilir kare yarıçapı
const EYE_Y = 2.4; // göz yüksekliği

type Props = {
  enabled?: boolean;
  start?: [number, number, number];
};

export default function CameraRig({
  enabled = true,
  start = [0, EYE_Y, 12],
}: Props) {
  const { camera } = useThree();
  const keys = useRef<Record<string, boolean>>({});
  const yaw = useRef(0);
  const pitch = useRef(0);
  const pos = useRef(new THREE.Vector3(start[0], start[1], start[2]));

  const fwd = useRef(new THREE.Vector3());
  const right = useRef(new THREE.Vector3());
  const look = useRef(new THREE.Vector3());

  useEffect(() => {
    pos.current.set(start[0], start[1], start[2]);
    camera.position.copy(pos.current);
    camera.lookAt(0, 1.7, 0);
  }, [camera, start]);

  useEffect(() => {
    if (!enabled) return;
    const down = (e: KeyboardEvent) => {
      keys.current[e.code] = true;
    };
    const up = (e: KeyboardEvent) => {
      keys.current[e.code] = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      keys.current = {};
    };
  }, [enabled]);

  useFrame((state, delta) => {
    if (!enabled) return;
    const dt = Math.min(delta, 0.05);

    // Bakış — pointer konumuna yumuşak yaw/pitch.
    const targetYaw = state.pointer.x * 0.7;
    const targetPitch = THREE.MathUtils.clamp(state.pointer.y * 0.4, -0.3, 0.45);
    yaw.current += (targetYaw - yaw.current) * 0.07;
    pitch.current += (targetPitch - pitch.current) * 0.07;

    // Hareket tabanı (yaw=0 → -Z'ye, yani merkeze bakar).
    fwd.current.set(Math.sin(yaw.current), 0, -Math.cos(yaw.current));
    right.current.set(Math.cos(yaw.current), 0, Math.sin(yaw.current));

    const k = keys.current;
    let mz = 0;
    let mx = 0;
    if (k["KeyW"] || k["ArrowUp"]) mz += 1;
    if (k["KeyS"] || k["ArrowDown"]) mz -= 1;
    if (k["KeyD"] || k["ArrowRight"]) mx += 1;
    if (k["KeyA"] || k["ArrowLeft"]) mx -= 1;

    if (mz !== 0 || mx !== 0) {
      const step = SPEED * dt;
      pos.current.addScaledVector(fwd.current, mz * step);
      pos.current.addScaledVector(right.current, mx * step);
      pos.current.x = THREE.MathUtils.clamp(pos.current.x, -BOUND, BOUND);
      pos.current.z = THREE.MathUtils.clamp(pos.current.z, -BOUND, BOUND);
    }
    pos.current.y = EYE_Y;
    camera.position.copy(pos.current);

    const cp = Math.cos(pitch.current);
    look.current.set(
      pos.current.x + Math.sin(yaw.current) * cp,
      pos.current.y + Math.sin(pitch.current),
      pos.current.z - Math.cos(yaw.current) * cp,
    );
    camera.lookAt(look.current);
  });

  return null;
}
