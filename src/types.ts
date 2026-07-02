/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type HotspotType = 'info' | 'portal';

export type HotspotIcon = 'info' | 'arrow-right' | 'eye' | 'door' | 'star' | 'marker';

export interface Hotspot {
  id: string;
  type: HotspotType;
  icon: HotspotIcon;
  title: string;
  description: string;
  yaw: number;   // Horizontal rotation in degrees (-180 to 180)
  pitch: number; // Vertical rotation in degrees (-85 to 85)
  targetSceneId?: string; // If type is 'portal'
}

export interface Scene {
  id: string;
  name: string;
  imageUrl: string; // URL or data URL
  isUserUploaded: boolean;
  hotspots: Hotspot[];
  thumbnailUrl?: string;
  description?: string;
}

export interface ViewerSettings {
  autoRotate: boolean;
  autoRotateSpeed: number; // multiplier
  zoom: number; // FOV (larger means zoomed out, e.g. 30 to 100, default 75)
  projectionMode: 'equirectangular' | 'flat' | 'fisheye';
  isVrMode: boolean; // Stereo side-by-side mode simulation
}
