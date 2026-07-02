/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { Hotspot, Scene, ViewerSettings } from '../types';
import { 
  Info, 
  ArrowRight, 
  Eye, 
  DoorOpen, 
  Star, 
  MapPin, 
  Maximize, 
  Minimize, 
  RotateCw, 
  Plus, 
  Trash2, 
  Settings2, 
  Navigation 
} from 'lucide-react';

interface PanoramaViewerProps {
  scene: Scene;
  settings: ViewerSettings;
  isEditMode: boolean;
  onUpdateSettings: (settings: Partial<ViewerSettings>) => void;
  onAddHotspot?: (yaw: number, pitch: number) => void;
  onClickHotspot?: (hotspot: Hotspot) => void;
  onDeleteHotspot?: (hotspotId: string) => void;
}

// Procedural high-tech canvas grid texture creator for standalone/offline rendering
export function createGridTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Deep space dark gradient
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, '#030712'); // gray-950
  grad.addColorStop(0.3, '#0b1329'); // slate-900 / blue-950 mix
  grad.addColorStop(0.5, '#0f172a'); // slate-900
  grad.addColorStop(0.7, '#0b1329');
  grad.addColorStop(1, '#030712');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle grid lines
  const cols = 36; // Every 10 degrees
  const rows = 18; // Every 10 degrees

  // Latitude grid
  ctx.strokeStyle = 'rgba(30, 64, 175, 0.25)'; // blue-800 subtle
  ctx.lineWidth = 1;
  for (let j = 1; j < rows; j++) {
    const y = (j / rows) * canvas.height;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  // Longitude grid
  for (let i = 0; i < cols; i++) {
    const x = (i / cols) * canvas.width;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }

  // Principal lines (Equator and Prime Meridian)
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(59, 130, 246, 0.6)'; // blue-500
  // Equator
  ctx.beginPath();
  ctx.moveTo(0, canvas.height / 2);
  ctx.lineTo(canvas.width, canvas.height / 2);
  ctx.stroke();

  // Draw cyber glow circles & grid references
  ctx.strokeStyle = 'rgba(96, 165, 250, 0.3)'; // blue-400
  ctx.setLineDash([5, 5]);
  for (let i = 0; i < cols; i += 3) {
    const x = (i / cols) * canvas.width;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // Draw beautiful glowing neon star particles
  ctx.fillStyle = '#60a5fa'; // blue-400
  for (let k = 0; k < 250; k++) {
    const px = Math.random() * canvas.width;
    const py = Math.random() * canvas.height;
    // Don't clutter the equator text lines
    if (Math.abs(py - canvas.height / 2) < 40) continue;
    const size = Math.random() * 2 + 0.5;
    ctx.beginPath();
    ctx.arc(px, py, size, 0, Math.PI * 2);
    ctx.fill();
    
    // Occasional twinkling cross glow
    if (k % 30 === 0) {
      ctx.strokeStyle = 'rgba(147, 197, 253, 0.4)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(px - 10, py); ctx.lineTo(px + 10, py);
      ctx.moveTo(px, py - 10); ctx.lineTo(px, py + 10);
      ctx.stroke();
    }
  }

  // Draw horizon grid circles with coordinates
  ctx.fillStyle = '#e2e8f0'; // slate-200
  ctx.font = 'bold 36px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const directions = [
    { label: 'N 0° (北)', x: 0 },
    { label: 'E 90° (东)', x: 0.25 },
    { label: 'S 180° (南)', x: 0.5 },
    { label: 'W 270° (西)', x: 0.75 },
    { label: 'N 360° (北)', x: 1.0 },
  ];

  directions.forEach(dir => {
    const xPos = dir.x * canvas.width;
    const yPos = canvas.height / 2;
    
    // Draw neon background plate
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(xPos - 120, yPos - 30, 240, 60, 8);
    ctx.fill();
    ctx.stroke();

    // Text
    ctx.fillStyle = '#60a5fa';
    ctx.fillText(dir.label, xPos, yPos);
  });

  // Coordinates indicator ticks
  ctx.font = '16px monospace';
  ctx.fillStyle = 'rgba(148, 163, 184, 0.6)'; // slate-400
  for (let deg = -180; deg <= 180; deg += 30) {
    if (deg === 0 || deg === 90 || deg === -90 || deg === 180 || deg === -180) continue;
    const fraction = (deg + 180) / 360;
    const xPos = fraction * canvas.width;
    ctx.fillText(`${deg}°`, xPos, canvas.height / 2 + 50);
  }

  // Tech grid lines descriptions
  ctx.font = '14px monospace';
  ctx.fillStyle = 'rgba(59, 130, 246, 0.4)';
  ctx.fillText('CELESTIAL GRID PROJECTION v1.0', canvas.width / 2, 80);
  ctx.fillText('SPHERICAL COORDINATES MATRIX', canvas.width / 2, canvas.height - 80);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.minFilter = THREE.LinearFilter;
  return texture;
}

export default function PanoramaViewer({
  scene,
  settings,
  isEditMode,
  onUpdateSettings,
  onAddHotspot,
  onClickHotspot,
  onDeleteHotspot,
}: PanoramaViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Dragging and rotational states
  const [lon, setLon] = useState<number>(0); // Horizontal angle in degrees
  const [lat, setLat] = useState<number>(0); // Vertical angle in degrees
  
  // Track state in refs for ThreeJS frame loop
  const lonRef = useRef<number>(0);
  const latRef = useRef<number>(0);
  const settingsRef = useRef<ViewerSettings>(settings);
  const sceneRef = useRef<Scene>(scene);

  // Sync refs
  useEffect(() => {
    lonRef.current = lon;
  }, [lon]);

  useEffect(() => {
    latRef.current = lat;
  }, [lat]);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    sceneRef.current = scene;
  }, [scene]);

  // Keep track of hotspot screen positions for overlay
  const [projectedHotspots, setProjectedHotspots] = useState<Array<{
    hotspot: Hotspot;
    left: number;
    top: number;
    visible: boolean;
  }>>([]);

  // ThreeJS instances refs
  const scene3DRef1 = useRef<THREE.Scene | null>(null);
  const cameraRef1 = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef1 = useRef<THREE.WebGLRenderer | null>(null);
  const sphereMeshRef1 = useRef<THREE.Mesh | null>(null);
  const canvasContainerRef1 = useRef<HTMLDivElement>(null);

  // Second eye refs (for VR Mode Split-Screen)
  const scene3DRef2 = useRef<THREE.Scene | null>(null);
  const cameraRef2 = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef2 = useRef<THREE.WebGLRenderer | null>(null);
  const sphereMeshRef2 = useRef<THREE.Mesh | null>(null);
  const canvasContainerRef2 = useRef<HTMLDivElement>(null);

  // Pointer interaction states
  const isUserInteractingRef = useRef<boolean>(false);
  const onPointerDownPointerX = useRef<number>(0);
  const onPointerDownPointerY = useRef<number>(0);
  const onPointerDownLon = useRef<number>(0);
  const onPointerDownLat = useRef<number>(0);
  const dragDistance = useRef<number>(0);

  // Trigger loading new texture
  const loadSceneTexture = useCallback((imageUrl: string, isUserUploaded: boolean, mesh1: THREE.Mesh, mesh2?: THREE.Mesh) => {
    // Show a loading style or proceed to load
    const manager = new THREE.LoadingManager();
    const loader = new THREE.TextureLoader(manager);

    const onTextureLoaded = (texture: THREE.Texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      
      const material = new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.DoubleSide // Ensure visible from inside
      });

      // Update Mesh materials
      if (mesh1) {
        if (mesh1.material) (mesh1.material as THREE.Material).dispose();
        mesh1.material = material;
      }
      if (mesh2) {
        if (mesh2.material) (mesh2.material as THREE.Material).dispose();
        mesh2.material = material;
      }
    };

    const onTextureError = () => {
      console.warn('Failed to load image texture. Falling back to high-tech grid texture.');
      const fallbackTexture = createGridTexture();
      const material = new THREE.MeshBasicMaterial({
        map: fallbackTexture,
        side: THREE.DoubleSide
      });
      if (mesh1) {
        if (mesh1.material) (mesh1.material as THREE.Material).dispose();
        mesh1.material = material;
      }
      if (mesh2) {
        if (mesh2.material) (mesh2.material as THREE.Material).dispose();
        mesh2.material = material;
      }
    };

    if (imageUrl === 'PRO_GRID_FALLBACK') {
      onTextureError();
    } else {
      loader.load(
        imageUrl,
        onTextureLoaded,
        undefined, // onProgress
        onTextureError
      );
    }
  }, []);

  // Initialize ThreeJS contexts
  useEffect(() => {
    if (!canvasContainerRef1.current) return;

    // Create Scene, Camera, Renderer for Primary Eye
    const scene3D1 = new THREE.Scene();
    scene3DRef1.current = scene3D1;

    const width = canvasContainerRef1.current.clientWidth;
    const height = canvasContainerRef1.current.clientHeight;

    const camera1 = new THREE.PerspectiveCamera(
      settings.zoom,
      width / height,
      1,
      1100
    );
    // Camera is at center of sphere
    camera1.position.set(0, 0, 0);
    cameraRef1.current = camera1;

    const renderer1 = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer1.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer1.setSize(width, height);
    
    // Clear old canvases
    canvasContainerRef1.current.innerHTML = '';
    canvasContainerRef1.current.appendChild(renderer1.domElement);
    rendererRef1.current = renderer1;

    // Create Sphere Geometry
    // Scale X by -1 to mirror it inside out so that when looking from inside, the panoramic mapping is correct orientation
    const sphereGeometry1 = new THREE.SphereGeometry(500, 60, 40);
    sphereGeometry1.scale(-1, 1, 1);

    // Initial grid texture (will be replaced by scene image as soon as loaded)
    const initialTexture = createGridTexture();
    const sphereMaterial1 = new THREE.MeshBasicMaterial({
      map: initialTexture,
      side: THREE.DoubleSide
    });

    const sphereMesh1 = new THREE.Mesh(sphereGeometry1, sphereMaterial1);
    scene3D1.add(sphereMesh1);
    sphereMeshRef1.current = sphereMesh1;

    // Handle Second Eye (VR Stereoscopic Mode Split-Screen)
    let renderer2: THREE.WebGLRenderer | null = null;
    let camera2: THREE.PerspectiveCamera | null = null;
    let scene3D2: THREE.Scene | null = null;
    let sphereMesh2: THREE.Mesh | null = null;

    if (settings.isVrMode && canvasContainerRef2.current) {
      scene3D2 = new THREE.Scene();
      scene3DRef2.current = scene3D2;

      const vrWidth = canvasContainerRef2.current.clientWidth;
      const vrHeight = canvasContainerRef2.current.clientHeight;

      camera2 = new THREE.PerspectiveCamera(settings.zoom, vrWidth / vrHeight, 1, 1100);
      camera2.position.set(0, 0, 0);
      cameraRef2.current = camera2;

      renderer2 = new THREE.WebGLRenderer({ antialias: true, alpha: false });
      renderer2.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer2.setSize(vrWidth, vrHeight);

      canvasContainerRef2.current.innerHTML = '';
      canvasContainerRef2.current.appendChild(renderer2.domElement);
      rendererRef2.current = renderer2;

      const sphereGeometry2 = new THREE.SphereGeometry(500, 60, 40);
      sphereGeometry2.scale(-1, 1, 1);

      const sphereMaterial2 = new THREE.MeshBasicMaterial({
        map: initialTexture.clone(),
        side: THREE.DoubleSide
      });

      sphereMesh2 = new THREE.Mesh(sphereGeometry2, sphereMaterial2);
      scene3D2.add(sphereMesh2);
      sphereMeshRef2.current = sphereMesh2;
    }

    // Load actual scene image
    loadSceneTexture(
      scene.imageUrl, 
      scene.isUserUploaded, 
      sphereMesh1, 
      sphereMesh2 || undefined
    );

    // Dynamic resizing observer
    const handleResize = () => {
      if (!canvasContainerRef1.current || !camera1 || !renderer1) return;
      
      const w = canvasContainerRef1.current.clientWidth;
      const h = canvasContainerRef1.current.clientHeight;
      camera1.aspect = w / h;
      camera1.updateProjectionMatrix();
      renderer1.setSize(w, h);

      if (settingsRef.current.isVrMode && canvasContainerRef2.current && camera2 && renderer2) {
        const vw = canvasContainerRef2.current.clientWidth;
        const vh = canvasContainerRef2.current.clientHeight;
        camera2.aspect = vw / vh;
        camera2.updateProjectionMatrix();
        renderer2.setSize(vw, vh);
      }
    };

    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(canvasContainerRef1.current);
    if (canvasContainerRef2.current) {
      resizeObserver.observe(canvasContainerRef2.current);
    }

    // Request animation frame render loop
    let animationFrameId: number;
    const target = new THREE.Vector3();
    const target2 = new THREE.Vector3();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Auto rotation if activated and user is not actively panning
      if (settingsRef.current.autoRotate && !isUserInteractingRef.current) {
        const nextLon = (lonRef.current + settingsRef.current.autoRotateSpeed * 0.05) % 360;
        setLon(nextLon);
      }

      // Convert Lon/Lat degrees to spherical target vector
      const currentLon = lonRef.current;
      const currentLat = latRef.current;

      const phi = THREE.MathUtils.degToRad(90 - currentLat);
      const theta = THREE.MathUtils.degToRad(currentLon);

      target.x = 500 * Math.sin(phi) * Math.cos(theta);
      target.y = 500 * Math.cos(phi);
      target.z = 500 * Math.sin(phi) * Math.sin(theta);

      // Camera 1 (Left/Main Eye)
      if (camera1 && renderer1 && scene3D1) {
        // Handle custom projection settings
        if (settingsRef.current.projectionMode === 'fisheye') {
          camera1.fov = settingsRef.current.zoom + 25;
        } else if (settingsRef.current.projectionMode === 'flat') {
          camera1.fov = Math.max(35, settingsRef.current.zoom - 20);
        } else {
          camera1.fov = settingsRef.current.zoom;
        }
        camera1.updateProjectionMatrix();
        camera1.lookAt(target);
        renderer1.render(scene3D1, camera1);

        // Project Hotspots onto 2D screen positions for Overlay UI (only needs calculation on primary screen)
        calculateHotspotPositions(camera1);
      }

      // Camera 2 (Right Eye - Stereoscopic offset)
      if (settingsRef.current.isVrMode && camera2 && renderer2 && scene3D2) {
        // VR Eye parallax offset: offset the longitude by 1.6 degrees
        const vrLon = currentLon + 1.6;
        const vrTheta = THREE.MathUtils.degToRad(vrLon);

        target2.x = 500 * Math.sin(phi) * Math.cos(vrTheta);
        target2.y = 500 * Math.cos(phi);
        target2.z = 500 * Math.sin(phi) * Math.sin(vrTheta);

        camera2.fov = settingsRef.current.zoom;
        camera2.updateProjectionMatrix();
        camera2.lookAt(target2);
        renderer2.render(scene3D2, camera2);
      }
    };

    // Calculate Hotspot Projected screen Coordinates
    const calculateHotspotPositions = (camera: THREE.PerspectiveCamera) => {
      const currentScene = sceneRef.current;
      if (!currentScene || !currentScene.hotspots) return;

      const positions = currentScene.hotspots.map(hotspot => {
        // Convert hotspot yaw (horizontal) and pitch (vertical) to 3D spherical coordinate
        // Match camera coordinate mapping logic
        const hYaw = hotspot.yaw;
        const hPitch = hotspot.pitch;

        const hPhi = THREE.MathUtils.degToRad(90 - hPitch);
        const hTheta = THREE.MathUtils.degToRad(hYaw);

        const x = 400 * Math.sin(hPhi) * Math.cos(hTheta);
        const y = 400 * Math.cos(hPhi);
        const z = 400 * Math.sin(hPhi) * Math.sin(hTheta);

        const pointVector = new THREE.Vector3(x, y, z);
        
        // Check if hotspot is behind the camera using projection
        pointVector.project(camera);

        const visible = pointVector.z < 1.0; // In front of clipping plane

        const left = (pointVector.x * 0.5 + 0.5) * 100;
        const top = (-(pointVector.y * 0.5) + 0.5) * 100;

        return {
          hotspot,
          left,
          top,
          visible
        };
      });

      setProjectedHotspots(positions);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      
      // Clean up WebGL Context
      if (renderer1) renderer1.dispose();
      if (renderer2) renderer2.dispose();
      if (sphereMaterial1) sphereMaterial1.dispose();
      if (initialTexture) initialTexture.dispose();
    };
  }, [scene.id, settings.isVrMode]);

  // Handle active scene changes on SAME Three.js meshes
  useEffect(() => {
    if (sphereMeshRef1.current) {
      loadSceneTexture(
        scene.imageUrl, 
        scene.isUserUploaded, 
        sphereMeshRef1.current, 
        sphereMeshRef2.current || undefined
      );
    }
  }, [scene.imageUrl, scene.isUserUploaded, loadSceneTexture]);

  // Synchronize Camera Zoom/FOV
  useEffect(() => {
    if (cameraRef1.current) {
      cameraRef1.current.fov = settings.zoom;
      cameraRef1.current.updateProjectionMatrix();
    }
    if (cameraRef2.current) {
      cameraRef2.current.fov = settings.zoom;
      cameraRef2.current.updateProjectionMatrix();
    }
  }, [settings.zoom]);

  // Interaction handlers (Mouse and Touch dragging)
  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    // Only drag on left click
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    isUserInteractingRef.current = true;
    onPointerDownPointerX.current = event.clientX;
    onPointerDownPointerY.current = event.clientY;
    
    onPointerDownLon.current = lon;
    onPointerDownLat.current = lat;
    dragDistance.current = 0;

    // Capture pointer
    (event.currentTarget as HTMLDivElement).setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isUserInteractingRef.current) return;

    const dx = event.clientX - onPointerDownPointerX.current;
    const dy = event.clientY - onPointerDownPointerY.current;
    dragDistance.current += Math.sqrt(dx * dx + dy * dy);

    // Calculate next rotation values
    // Horizontal rotation (lon): Dragging left should rotate right (increase longitude)
    const factor = 0.15; // sensitivity adjustment
    const nextLon = (onPointerDownLon.current - dx * factor) % 360;
    
    // Vertical rotation (lat): Dragging up should look up (increase latitude)
    const rawLat = onPointerDownLat.current + dy * factor;
    const nextLat = Math.max(-85, Math.min(85, rawLat)); // Limit viewing angles

    setLon(nextLon);
    setLat(nextLat);

    onPointerDownPointerX.current = event.clientX;
    onPointerDownPointerY.current = event.clientY;
    onPointerDownLon.current = nextLon;
    onPointerDownLat.current = nextLat;
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    isUserInteractingRef.current = false;
    event.currentTarget.releasePointerCapture(event.pointerId);

    // If drag distance was very small, treat as a mouse click (Hotspot creation or Trigger)
    if (dragDistance.current < 5) {
      handleCanvasClick(event);
    }
  };

  // Handle Canvas Clicking (Either to add a hotspot in edit mode or deselect stuff)
  const handleCanvasClick = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isEditMode || !onAddHotspot) return;

    const canvasElement = rendererRef1.current?.domElement;
    const camera = cameraRef1.current;
    const sphereMesh = sphereMeshRef1.current;
    
    if (!canvasElement || !camera || !sphereMesh) return;

    // Raycast back to sphere mesh to find clicked 3D point
    const rect = canvasElement.getBoundingClientRect();
    const mouse = new THREE.Vector2();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObject(sphereMesh);

    if (intersects.length > 0) {
      // Normalize intersect point to sphere of radius 1
      const point = intersects[0].point.clone().normalize();

      // Invert sphere X-scaling logic to get true spherical angles matching our display
      // x = sin(phi) * cos(theta)
      // y = cos(phi)
      // z = sin(phi) * sin(theta)
      // Note: we flipped X on the sphere geometry, so point.x needs a negative sign to correctly align raycasts!
      const correctedX = -point.x;
      const correctedZ = -point.z;

      const phi = Math.acos(point.y);
      const clickedPitch = 90 - (phi * 180) / Math.PI;

      const theta = Math.atan2(correctedZ, correctedX);
      let clickedYaw = (theta * 180) / Math.PI;
      
      // Map back and round
      clickedYaw = (clickedYaw + 360) % 360;
      
      // Let's call callback to open Hotspot Creator Dialog
      onAddHotspot(Math.round(clickedYaw), Math.round(clickedPitch));
    }
  };

  // Wheel zoom listener
  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.stopPropagation();
    const zoomFactor = event.deltaY * 0.05;
    const nextZoom = Math.max(30, Math.min(110, settings.zoom + zoomFactor));
    onUpdateSettings({ zoom: nextZoom });
  };

  // Helper mapping from Lucide icons to specific JSX nodes
  const renderHotspotIcon = (iconName: string) => {
    const size = 18;
    switch (iconName) {
      case 'info':
        return <Info size={size} className="text-white" />;
      case 'arrow-right':
        return <ArrowRight size={size} className="text-white" />;
      case 'eye':
        return <Eye size={size} className="text-white" />;
      case 'door':
        return <DoorOpen size={size} className="text-white" />;
      case 'star':
        return <Star size={size} className="text-white fill-amber-400" />;
      case 'marker':
      default:
        return <MapPin size={size} className="text-white" />;
    }
  };

  return (
    <div 
      id="pano-viewer-container" 
      ref={containerRef}
      className="relative w-full h-full select-none bg-slate-950 overflow-hidden flex"
      onWheel={handleWheel}
    >
      {/* 3D Rendering Portals */}
      <div className="w-full h-full flex flex-row">
        {/* Eye 1: Main Eye Canvas */}
        <div 
          id="eye-canvas-1"
          ref={canvasContainerRef1}
          className={`h-full relative cursor-grab ${isUserInteractingRef.current ? 'cursor-grabbing' : ''} ${
            settings.isVrMode ? 'w-1/2 border-r border-slate-800' : 'w-full'
          } ${isEditMode ? 'cursor-crosshair' : ''}`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        />

        {/* Eye 2: Stereoscopic Split (VR simulation) */}
        {settings.isVrMode && (
          <div 
            id="eye-canvas-2"
            ref={canvasContainerRef2}
            className="w-1/2 h-full relative cursor-grab bg-slate-900"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          />
        )}
      </div>

      {/* HTML Hotspots overlays (We draw them on top of Canvas 1 for viewing) */}
      {!settings.isVrMode && projectedHotspots.map(({ hotspot, left, top, visible }) => {
        if (!visible) return null;

        // Clip boundary to keep it within eye viewport bounds
        if (left < 2 || left > 98 || top < 2 || top > 98) return null;

        const isPortal = hotspot.type === 'portal';

        return (
          <div
            key={hotspot.id}
            id={`hotspot-${hotspot.id}`}
            style={{ 
              position: 'absolute', 
              left: `${left}%`, 
              top: `${top}%`,
              transform: 'translate(-50%, -50%)',
              zIndex: 30
            }}
            className="group animate-fade-in"
          >
            {/* Hotspot Ring Element */}
            <div className="relative flex items-center justify-center">
              {/* Pulsating Ring */}
              <span className={`absolute inline-flex h-10 w-10 rounded-full opacity-65 animate-ping ${
                isPortal ? 'bg-emerald-400' : 'bg-blue-400'
              }`} />

              {/* Clickable Action Button */}
              <button
                type="button"
                id={`btn-hotspot-${hotspot.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (onClickHotspot) onClickHotspot(hotspot);
                }}
                className={`relative flex h-9 w-9 items-center justify-center rounded-full border border-white/20 shadow-lg transition-transform hover:scale-125 focus:outline-none ${
                  isPortal 
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-emerald-50' 
                    : 'bg-blue-600 hover:bg-blue-500 text-blue-50'
                }`}
                title={hotspot.title}
              >
                {renderHotspotIcon(hotspot.icon)}
              </button>

              {/* Popover Title Label */}
              <div className="absolute top-11 hidden group-hover:flex flex-col items-center whitespace-nowrap bg-slate-900/90 text-white text-xs px-2.5 py-1 rounded-md border border-slate-700/80 shadow-md backdrop-blur-sm pointer-events-none">
                <span className="font-semibold">{hotspot.title}</span>
                {hotspot.description && (
                  <span className="text-[10px] text-slate-300 max-w-[150px] truncate">
                    {hotspot.description}
                  </span>
                )}
                {isPortal && (
                  <span className="text-[9px] text-emerald-400 mt-0.5 flex items-center gap-0.5">
                    <Navigation size={8} /> 漫游传送
                  </span>
                )}
              </div>

              {/* Delete button (Visible only in edit mode overlay) */}
              {isEditMode && onDeleteHotspot && (
                <button
                  type="button"
                  id={`delete-hotspot-${hotspot.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteHotspot(hotspot.id);
                  }}
                  className="absolute -top-3 -right-3 flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow-md focus:outline-none transition-transform hover:scale-110 border border-white/10"
                  title="删除此热点"
                >
                  <Trash2 size={10} />
                </button>
              )}
            </div>
          </div>
        );
      })}

      {/* Crosshair guide for Edit Mode */}
      {isEditMode && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10 flex flex-col items-center">
          <div className="w-8 h-8 rounded-full border border-blue-400 border-dashed animate-pulse flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
          </div>
          <span className="mt-2 text-[10px] bg-blue-600/90 text-white font-semibold px-2 py-0.5 rounded-full backdrop-blur-sm tracking-wider">
            点击任意点放置新热点
          </span>
        </div>
      )}

      {/* Compass Badge indicator */}
      <div className="absolute top-4 left-4 z-10 bg-slate-950/80 text-white px-3 py-1.5 rounded-lg border border-slate-800 backdrop-blur-md shadow-md flex items-center gap-2 font-mono text-[11px]">
        <Navigation size={13} style={{ transform: `rotate(${-lon}deg)` }} className="text-blue-400 transition-transform duration-75" />
        <div className="flex flex-col">
          <span>方位角 (Yaw): <b className="text-blue-300">{Math.round(lon)}°</b></span>
          <span>俯仰角 (Pitch): <b className="text-blue-300">{Math.round(lat)}°</b></span>
        </div>
      </div>

      {/* VR stereoscopic layout divider labels */}
      {settings.isVrMode && (
        <>
          <span className="absolute top-4 left-4 z-10 bg-emerald-600/90 text-white text-[10px] font-bold tracking-widest px-2 py-0.5 rounded uppercase">左眼 L-Eye</span>
          <span className="absolute top-4 left-[calc(50%+16px)] z-10 bg-indigo-600/90 text-white text-[10px] font-bold tracking-widest px-2 py-0.5 rounded uppercase">右眼 R-Eye (立体移位)</span>
        </>
      )}
    </div>
  );
}
