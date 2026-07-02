/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Scene, 
  Hotspot, 
  ViewerSettings, 
  HotspotIcon 
} from './types';
import PanoramaViewer from './components/PanoramaViewer';
import HotspotDialog from './components/HotspotDialog';
import ExeGuide from './components/ExeGuide';
import { 
  Globe, 
  Plus, 
  Upload, 
  Trash2, 
  Compass, 
  BookOpen, 
  Settings, 
  Laptop, 
  Maximize2, 
  Sparkles, 
  Check, 
  Eye, 
  HelpCircle, 
  Navigation, 
  Download, 
  FolderOpen,
  X,
  ChevronRight,
  Info
} from 'lucide-react';

// Pre-defined scenic 360° environments (CORS-friendly direct CDN links & procedurals)
const INITIAL_SCENES: Scene[] = [
  {
    id: 'cyber_celestial_grid',
    name: '离线测试 · 星空经纬度坐标网格',
    imageUrl: 'PRO_GRID_FALLBACK', // Special flag triggering the procedural high-tech canvas generator
    isUserUploaded: false,
    description: '一个完全离线、本地自绘制的高科技星空经纬度坐标球。用于在没有互联网连接时测试视角畸变、阻尼和热点的绝对经度/纬度标定。',
    hotspots: [
      {
        id: 'grid_info_1',
        type: 'info',
        icon: 'info',
        title: '全景赤道带标识',
        description: '这里的水平蓝线表示 0° 俯仰角，也就是绝对水平视线。向上为正（最高90°天顶），向下为负（最低-90°天底）。',
        yaw: 0,
        pitch: 0
      },
      {
        id: 'grid_portal_1',
        type: 'portal',
        icon: 'arrow-right',
        title: '漫游传送：阿塔卡马星系射电阵列',
        description: '瞬间穿梭至位于南美洲智利海拔5000米的高空射电望远镜全景实景中。',
        yaw: 90,
        pitch: -12,
        targetSceneId: 'atacama_desert'
      }
    ]
  },
  {
    id: 'atacama_desert',
    name: '智利 · 阿塔卡马星空大型射电阵列',
    imageUrl: 'https://pannellum.org/images/alma.jpg',
    isUserUploaded: false,
    description: '智利阿塔卡马沙漠的 ALMA (阿塔卡马大型毫米波/亚毫米波阵列) 超高清实景全景。抬头可以看到震撼的深空银河、星云尘埃盘以及高海拔架设的巨型抛物面天线群。',
    hotspots: [
      {
        id: 'atacama_info_1',
        type: 'info',
        icon: 'star',
        title: 'ALMA 巨型抛物面天线',
        description: '这台高精度射电天文天线属于欧洲南方天文台(ESO)等国际合作机构，专门用于捕捉宇宙中极冷物质发出的毫米波辐射。',
        yaw: 164,
        pitch: -2
      },
      {
        id: 'atacama_info_2',
        type: 'info',
        icon: 'eye',
        title: '璀璨的银河核心带',
        description: '在此处可清晰俯瞰人马座/天蝎座方向的银道面，以及大小麦哲伦伴星系。这是地球上最完美的星空观测地之一。',
        yaw: 35,
        pitch: 38
      },
      {
        id: 'atacama_portal_1',
        type: 'portal',
        icon: 'door',
        title: '漫游传送：皇家公园清晨广场',
        description: '传送至阳光明媚的欧式古典喷泉草坪。',
        yaw: 300,
        pitch: -8,
        targetSceneId: 'royal_plaza'
      }
    ]
  },
  {
    id: 'royal_plaza',
    name: '皇家草坪 · 清晨古典广角公园',
    imageUrl: 'https://threejs.org/examples/textures/2294472375_24a3b8ef46_o.jpg',
    isUserUploaded: false,
    description: '静谧清晨里的欧洲皇家滨海广场公园。维多利亚铸铁喷泉、古典罗马连廊、精致的路灯和繁茂的古树交织出一幅写意的景观，球体细节非常精美。',
    hotspots: [
      {
        id: 'royal_info_1',
        type: 'info',
        icon: 'info',
        title: '皇家古典音乐廊 (Royal Pavilion)',
        description: '典型的19世纪维多利亚轻质钢架凉亭结构。过去主要用于避雨、遮阳、或供古典乐团在清晨进行户外管弦乐演出。',
        yaw: 167,
        pitch: 1
      },
      {
        id: 'royal_info_2',
        type: 'info',
        icon: 'star',
        title: '古希腊石柱长廊',
        description: '位于广角远景深处的托斯卡纳半圆形连廊，主要作为欧式古典园林的背景构图。',
        yaw: 285,
        pitch: -1
      },
      {
        id: 'royal_portal_1',
        type: 'portal',
        icon: 'arrow-right',
        title: '漫游传送：返回自研星空坐标球',
        description: '瞬间折返回充满未来主义的科幻经纬度刻度测试场景。',
        yaw: 65,
        pitch: -5,
        targetSceneId: 'cyber_celestial_grid'
      }
    ]
  }
];

export default function App() {
  const [scenes, setScenes] = useState<Scene[]>(() => {
    const saved = localStorage.getItem('PANO_SCENES');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_SCENES;
      }
    }
    return INITIAL_SCENES;
  });

  const [activeSceneId, setActiveSceneId] = useState<string>('cyber_celestial_grid');
  const [activeTab, setActiveTab] = useState<'explorer' | 'exeguide'>('explorer');
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [viewerSettings, setViewerSettings] = useState<ViewerSettings>({
    autoRotate: true,
    autoRotateSpeed: 0.8,
    zoom: 70, // FOV in degrees
    projectionMode: 'equirectangular',
    isVrMode: false
  });

  // Dialog & popover management
  const [pendingHotspotCoords, setPendingHotspotCoords] = useState<{ yaw: number; pitch: number } | null>(null);
  const [activeInfoHotspot, setActiveInfoHotspot] = useState<Hotspot | null>(null);
  
  // Custom toast notifications
  const [toasts, setToasts] = useState<Array<{ id: string; message: string }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync to localstorage for data persistence
  useEffect(() => {
    localStorage.setItem('PANO_SCENES', JSON.stringify(scenes));
  }, [scenes]);

  // Find active scene object
  const activeScene = scenes.find(s => s.id === activeSceneId) || scenes[0];

  const showToast = (message: string) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  };

  // Drag and drop file upload handlers
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleFileImport = (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('⚠️ 格式不支持！请选择 JPG、PNG 或 WebP 图片格式。');
      return;
    }

    showToast('正在读取本地超清全景图片，请稍候...');
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;

      const newScene: Scene = {
        id: `user_scene_${Date.now()}`,
        name: file.name.substring(0, file.name.lastIndexOf('.')) || file.name,
        imageUrl: dataUrl,
        isUserUploaded: true,
        hotspots: [],
        description: `您本地导入的 360° 全景图 (文件大小: ${(file.size / 1024 / 1024).toFixed(2)} MB)`
      };

      setScenes(prev => [...prev, newScene]);
      setActiveSceneId(newScene.id);
      showToast(`✨ 全景场景 "${newScene.name}" 导入成功！`);
    };

    reader.onerror = () => {
      showToast('⚠️ 文件读取失败！');
    };

    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileImport(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileImport(file);
    }
  };

  // Hotspots creation / execution
  const triggerAddHotspot = (yaw: number, pitch: number) => {
    setPendingHotspotCoords({ yaw, pitch });
  };

  const saveNewHotspot = (hotspotData: {
    type: 'info' | 'portal';
    icon: HotspotIcon;
    title: string;
    description: string;
    targetSceneId?: string;
  }) => {
    if (!pendingHotspotCoords) return;

    const newHotspot: Hotspot = {
      id: `hotspot_${Date.now()}`,
      yaw: pendingHotspotCoords.yaw,
      pitch: pendingHotspotCoords.pitch,
      ...hotspotData
    };

    setScenes(prev => prev.map(s => {
      if (s.id === activeSceneId) {
        return {
          ...s,
          hotspots: [...s.hotspots, newHotspot]
        };
      }
      return s;
    }));

    setPendingHotspotCoords(null);
    showToast(`✅ 热点 "${newHotspot.title}" 创建成功！`);
  };

  const deleteHotspot = (hotspotId: string) => {
    setScenes(prev => prev.map(s => {
      if (s.id === activeSceneId) {
        return {
          ...s,
          hotspots: s.hotspots.filter(h => h.id !== hotspotId)
        };
      }
      return s;
    }));
    showToast('🗑️ 热点已成功移除');
  };

  const handleInteractHotspot = (hotspot: Hotspot) => {
    if (hotspot.type === 'portal' && hotspot.targetSceneId) {
      const targetExists = scenes.some(s => s.id === hotspot.targetSceneId);
      if (targetExists) {
        setActiveSceneId(hotspot.targetSceneId);
        showToast(`🌀 传送至场景: ${scenes.find(s => s.id === hotspot.targetSceneId)?.name}`);
      } else {
        showToast('⚠️ 目标传送场景已不存在');
      }
    } else {
      // Show info popover overlay
      setActiveInfoHotspot(hotspot);
    }
  };

  // Delete scene
  const deleteScene = (sceneId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (sceneId === activeSceneId) {
      // Find another scene
      const remaining = scenes.filter(s => s.id !== sceneId);
      if (remaining.length > 0) {
        setActiveSceneId(remaining[0].id);
      }
    }
    setScenes(prev => prev.filter(s => s.id !== sceneId));
    showToast('🗑️ 场景已成功删除');
  };

  // Reset to default presets
  const handleResetToPresets = () => {
    if (window.confirm('您确定要恢复到默认的全景图预设场景吗？您上传的内容和新增的热点将被清空。')) {
      setScenes(INITIAL_SCENES);
      setActiveSceneId('cyber_celestial_grid');
      showToast('🔄 已重置为系统默认精美场景');
    }
  };

  // Export all custom scenes & hotspots as a downloadable project config JSON
  const handleExportConfig = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(scenes, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "panorama_project_config.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('💾 场景配置工程 JSON 文件导出成功！');
  };

  return (
    <div id="main-app" className="w-screen h-screen bg-slate-950 flex flex-col overflow-hidden text-slate-100 font-sans antialiased">
      {/* 1. Global Header Navigation */}
      <header className="h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-6 flex justify-between items-center z-40 shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Globe size={18} className="animate-spin" style={{ animationDuration: '15s' }} />
          </div>
          <div>
            <h1 className="font-sans font-extrabold text-slate-100 tracking-tight text-sm sm:text-base flex items-center gap-1.5">
              360°全景图浏览器与漫游编辑器 
              <span className="text-[10px] font-mono font-medium bg-blue-950 border border-blue-800 text-blue-400 px-1.5 py-0.5 rounded">v1.2 Studio</span>
            </h1>
            <p className="text-[10px] text-slate-400">基于 WebGL 与 Three.js 的极速渲染视窗 · 支持本地打包 EXE</p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-lg">
          <button
            type="button"
            id="tab-explorer"
            onClick={() => setActiveTab('explorer')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold tracking-wide transition-all ${
              activeTab === 'explorer'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Compass size={14} />
            全景球体视界
          </button>
          <button
            type="button"
            id="tab-exeguide"
            onClick={() => setActiveTab('exeguide')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold tracking-wide transition-all ${
              activeTab === 'exeguide'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Laptop size={14} />
            一键打包EXE桌面版
          </button>
        </div>
      </header>

      {/* 2. Main content dashboard */}
      <div className="flex-1 flex overflow-hidden w-full relative">
        <AnimatePresence mode="wait">
          {activeTab === 'explorer' ? (
            <motion.div 
              key="explorer-tab"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex-1 flex flex-col md:flex-row overflow-hidden w-full"
            >
              {/* Left Panel: Scene Library */}
              <aside className="w-full md:w-80 border-r border-slate-800 flex flex-col bg-slate-950 shrink-0">
                <div className="p-4 border-b border-slate-800 flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <FolderOpen size={13} className="text-blue-400" />
                      全景场景库 ({scenes.length})
                    </span>
                    <button
                      type="button"
                      id="btn-reset-presets"
                      onClick={handleResetToPresets}
                      className="text-[10px] text-rose-400 hover:text-rose-300 transition-colors"
                      title="清空用户导入并恢复预设"
                    >
                      恢复默认
                    </button>
                  </div>

                  {/* Drag and Drop Zone */}
                  <div
                    id="dropzone"
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-800 hover:border-blue-500/50 bg-slate-900/50 hover:bg-slate-900 rounded-xl p-4 text-center cursor-pointer transition-all duration-200 flex flex-col items-center group relative overflow-hidden"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileInputChange}
                      className="hidden"
                    />
                    <Upload size={22} className="text-slate-500 group-hover:text-blue-400 transition-colors mb-1.5" />
                    <span className="text-xs font-semibold text-slate-200">
                      拖放或点击导入本地图片
                    </span>
                    <span className="text-[10px] text-slate-500 mt-0.5">
                      支持 360° 等距柱状投影 JPG/PNG
                    </span>
                  </div>
                </div>

                {/* Scene list */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {scenes.map(sc => {
                    const isActive = sc.id === activeSceneId;
                    const hotspotCount = sc.hotspots.length;

                    return (
                      <div
                        key={sc.id}
                        id={`scene-item-${sc.id}`}
                        onClick={() => {
                          setActiveSceneId(sc.id);
                          showToast(`切换场景: ${sc.name}`);
                        }}
                        className={`group p-2.5 rounded-xl border transition-all cursor-pointer flex gap-3 relative items-center ${
                          isActive
                            ? 'bg-blue-950/40 border-blue-500 text-slate-100 shadow-md shadow-blue-950/30'
                            : 'bg-slate-900/45 border-slate-800 hover:bg-slate-900 hover:border-slate-700 text-slate-300'
                        }`}
                      >
                        {/* Bullet color tag or thumbnail */}
                        <div className={`h-11 w-11 rounded-lg bg-slate-950 border overflow-hidden flex-shrink-0 flex items-center justify-center font-mono text-[9px] ${
                          isActive ? 'border-blue-400 text-blue-300' : 'border-slate-800 text-slate-500'
                        }`}>
                          {sc.imageUrl === 'PRO_GRID_FALLBACK' ? (
                            <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center p-0.5 text-center">
                              <span className="text-blue-400 font-bold leading-none">GRID</span>
                              <span className="text-[7px] text-slate-500 mt-0.5 leading-none">1.0</span>
                            </div>
                          ) : (
                            <img 
                              src={sc.imageUrl} 
                              alt="" 
                              className="w-full h-full object-cover opacity-75"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                // If fail to load (e.g. CORS), fallback to thumbnail placeholder
                                (e.currentTarget as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          )}
                        </div>

                        {/* Title details */}
                        <div className="flex-1 min-w-0 pr-6">
                          <h4 className="text-xs font-bold truncate tracking-tight">{sc.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-[9px] px-1 py-0.2 rounded ${
                              sc.isUserUploaded 
                                ? 'bg-amber-950/40 text-amber-400 border border-amber-900/50' 
                                : 'bg-slate-800 text-slate-400'
                            }`}>
                              {sc.isUserUploaded ? '用户导入' : '系统预设'}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {hotspotCount}个互动点
                            </span>
                          </div>
                        </div>

                        {/* Hover Action delete button */}
                        {sc.isUserUploaded && (
                          <button
                            type="button"
                            id={`btn-delete-scene-${sc.id}`}
                            onClick={(e) => deleteScene(sc.id, e)}
                            className="absolute right-2 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity p-1.5 hover:bg-rose-950/40 border border-transparent hover:border-rose-900/50 rounded-md text-rose-400 hover:text-rose-300"
                            title="删除此场景"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Left panel bottom controls */}
                <div className="p-4 border-t border-slate-800 bg-slate-950 flex gap-2 flex-col">
                  <button
                    type="button"
                    id="btn-export-project"
                    onClick={handleExportConfig}
                    className="w-full bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-200 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer transition-colors"
                  >
                    <Download size={13} />
                    导出漫游工程配置 (JSON)
                  </button>
                </div>
              </aside>

              {/* Center Panel: 3D Spherical Window */}
              <main className="flex-1 relative flex flex-col min-w-0 bg-slate-950">
                {/* 3D Viewer header info bar */}
                <div className="h-11 border-b border-slate-800/80 px-4 bg-slate-950/70 backdrop-blur-sm flex justify-between items-center z-10 shrink-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                    <span className="text-xs text-slate-300 truncate font-sans">
                      当前全景场景: <b className="text-slate-100">{activeScene.name}</b>
                    </span>
                  </div>

                  {/* Mode switcher: browse vs edit */}
                  <div className="flex bg-slate-900 border border-slate-800 p-0.5 rounded-lg shrink-0">
                    <button
                      type="button"
                      id="btn-mode-browse"
                      onClick={() => {
                        setIsEditMode(false);
                        showToast('👁️ 已进入【交互漫游模式】，点击热点触发动作。');
                      }}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase transition-all ${
                        !isEditMode
                          ? 'bg-slate-800 text-blue-400 shadow-sm'
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      浏览浏览
                    </button>
                    <button
                      type="button"
                      id="btn-mode-edit"
                      onClick={() => {
                        setIsEditMode(true);
                        showToast('✏️ 已进入【热点编辑模式】，在球面上任意处点击可直接新增标记。');
                      }}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase transition-all ${
                        isEditMode
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      编辑热点
                    </button>
                  </div>
                </div>

                {/* The 3D view window */}
                <div className="flex-1 relative">
                  <PanoramaViewer
                    scene={activeScene}
                    settings={viewerSettings}
                    isEditMode={isEditMode}
                    onUpdateSettings={(newSettings) => setViewerSettings(prev => ({ ...prev, ...newSettings }))}
                    onAddHotspot={triggerAddHotspot}
                    onClickHotspot={handleInteractHotspot}
                    onDeleteHotspot={deleteHotspot}
                  />

                  {/* Navigation guide notification strip inside canvas */}
                  <div className="absolute bottom-4 left-4 right-4 z-10 pointer-events-none flex justify-center">
                    <div className="bg-slate-950/85 border border-slate-800 backdrop-blur-md rounded-full px-4 py-1.5 text-[10px] text-slate-300 shadow-lg flex items-center gap-2 pointer-events-auto">
                      <span className="font-bold text-blue-400">操作说明:</span>
                      <span>按住鼠标左键并拖拽可 360° 旋转视角</span>
                      <span className="text-slate-700">|</span>
                      <span>鼠标滚轮进行视角缩放 (FOV)</span>
                    </div>
                  </div>
                </div>

                {/* Bottom interactive settings adjustment deck */}
                <div className="border-t border-slate-800 bg-slate-950 px-4 py-3 flex flex-wrap gap-4 items-center justify-between shrink-0">
                  {/* Left auto rotate speed */}
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={viewerSettings.autoRotate}
                        onChange={(e) => setViewerSettings(prev => ({ ...prev, autoRotate: e.target.checked }))}
                        className="rounded border-slate-800 bg-slate-900 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 h-4 w-4"
                      />
                      <span>自动旋转</span>
                    </label>

                    {viewerSettings.autoRotate && (
                      <div className="flex items-center gap-1 animate-fade-in">
                        <span className="text-[10px] text-slate-500">速度:</span>
                        <input
                          type="range"
                          min="0.2"
                          max="3.0"
                          step="0.1"
                          value={viewerSettings.autoRotateSpeed}
                          onChange={(e) => setViewerSettings(prev => ({ ...prev, autoRotateSpeed: parseFloat(e.target.value) }))}
                          className="w-20 accent-blue-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="text-[10px] font-mono text-slate-400 w-6 text-right">
                          {viewerSettings.autoRotateSpeed.toFixed(1)}x
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Middle zoom controls */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">广角缩放 (FOV):</span>
                    <input
                      type="range"
                      min="30"
                      max="110"
                      value={viewerSettings.zoom}
                      onChange={(e) => setViewerSettings(prev => ({ ...prev, zoom: parseInt(e.target.value) }))}
                      className="w-28 accent-blue-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-[10px] font-mono text-slate-400 w-8 text-right">
                      {Math.round(viewerSettings.zoom)}°
                    </span>
                  </div>

                  {/* Right view projections and VR */}
                  <div className="flex items-center gap-2">
                    {/* Projection Select */}
                    <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-[10px]">
                      <button
                        type="button"
                        id="proj-equi"
                        onClick={() => setViewerSettings(prev => ({ ...prev, projectionMode: 'equirectangular' }))}
                        className={`px-2 py-1 rounded transition-colors ${
                          viewerSettings.projectionMode === 'equirectangular'
                            ? 'bg-slate-800 text-blue-400 font-bold'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        360全景
                      </button>
                      <button
                        type="button"
                        id="proj-flat"
                        onClick={() => setViewerSettings(prev => ({ ...prev, projectionMode: 'flat' }))}
                        className={`px-2 py-1 rounded transition-colors ${
                          viewerSettings.projectionMode === 'flat'
                            ? 'bg-slate-800 text-blue-400 font-bold'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        平面长画
                      </button>
                      <button
                        type="button"
                        id="proj-fish"
                        onClick={() => setViewerSettings(prev => ({ ...prev, projectionMode: 'fisheye' }))}
                        className={`px-2 py-1 rounded transition-colors ${
                          viewerSettings.projectionMode === 'fisheye'
                            ? 'bg-slate-800 text-blue-400 font-bold'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        超广角
                      </button>
                    </div>

                    {/* VR stereoscopic split view simulation toggle */}
                    <button
                      type="button"
                      id="btn-vr-toggle"
                      onClick={() => {
                        const nextVrState = !viewerSettings.isVrMode;
                        setViewerSettings(prev => ({ ...prev, isVrMode: nextVrState }));
                        showToast(nextVrState ? '🕶️ 已开启【VR双目立体分屏】。请将您的手机放入VR盒子中体验！' : '📺 已返回标准单屏视界');
                      }}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-all ${
                        viewerSettings.isVrMode
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <span>VR双目分屏</span>
                    </button>
                  </div>
                </div>
              </main>

              {/* Right Panel: Active hotspot descriptions or editor properties */}
              <aside className="w-full md:w-80 border-l border-slate-800 flex flex-col bg-slate-950 shrink-0">
                {/* Section title */}
                <div className="p-4 border-b border-slate-800">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Settings size={13} className="text-blue-400" />
                    场景参数与漫游属性
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {/* Scene properties */}
                  <div className="space-y-1.5">
                    <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">场景简介:</h5>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans bg-slate-900/40 p-3 rounded-lg border border-slate-900">
                      {activeScene.description || '暂无该全景图像的详细背景说明描述。您可以通过导入新照片来构建属于您自己的虚拟漫游项目！'}
                    </p>
                  </div>

                  {/* Hotspots checklist */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">已配置互动热点 ({activeScene.hotspots.length}):</h5>
                      {isEditMode && (
                        <span className="text-[10px] text-blue-400 font-semibold animate-pulse">
                          编辑模式激活
                        </span>
                      )}
                    </div>

                    {activeScene.hotspots.length > 0 ? (
                      <div className="space-y-1.5">
                        {activeScene.hotspots.map(hp => (
                          <div
                            key={hp.id}
                            id={`hotspot-item-${hp.id}`}
                            onClick={() => {
                              // Force view simulation: orient the view to point directly towards the hotspot coordinates!
                              // We can simulate this by setting the lon (yaw) and lat (pitch) state
                              // Note: we can use a custom event or update longitude directly!
                              // In our Three.js, longitude runs 0-360, pitch is -85 to 85.
                              // Let's set it! We want a smooth visual navigation jump:
                              // Since we are in the parent App, if we can trigger updating lon/lat, it will update camera!
                              // The user clicks the hotspot list item: we jump camera to point at this hotspot. Beautiful!
                              // Wait! The lon state is currently local to PanoramaViewer but we can sync or let them click.
                              // Let's see: if we can pass a callback or just tell them we focus! Actually, they'll see it on screen.
                              // Let's trigger the hotspot click itself (navigating portal or showing modal)
                              handleInteractHotspot(hp);
                            }}
                            className="p-2 bg-slate-900/60 border border-slate-800 hover:border-slate-700 hover:bg-slate-900 rounded-lg text-xs flex justify-between items-center group transition-colors cursor-pointer"
                          >
                            <div className="min-w-0 pr-2">
                              <div className="font-semibold text-slate-200 truncate flex items-center gap-1">
                                <span className={`h-1.5 w-1.5 rounded-full ${hp.type === 'portal' ? 'bg-emerald-400' : 'bg-blue-400'}`} />
                                {hp.title}
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                Yaw: {hp.yaw}°, Pitch: {hp.pitch}° ({hp.type === 'portal' ? '传送门' : '信息牌'})
                              </div>
                            </div>
                            
                            {isEditMode && (
                              <button
                                type="button"
                                id={`hp-delete-btn-${hp.id}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteHotspot(hp.id);
                                }}
                                className="text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 p-1 rounded transition-colors"
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-500 bg-slate-900/20 border border-slate-900 p-3 rounded-lg text-center leading-relaxed font-sans">
                        <span>该场景当前没有添加交互点。</span>
                        {isEditMode ? (
                          <span className="block text-blue-400 mt-1 font-semibold">请在左侧全景视图上任意点点击，即可立刻新增标注！</span>
                        ) : (
                          <span className="block text-slate-400 mt-1">切换到上方「编辑热点」按钮即可在画面中随心添加文字看板或漫游传送。</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Exe packaging promo card */}
                  <div className="border border-indigo-950 bg-indigo-950/20 rounded-xl p-4 space-y-2">
                    <h5 className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                      <Laptop size={14} />
                      <span>想要脱离浏览器离线运行？</span>
                    </h5>
                    <p className="text-[10px] text-slate-400 leading-relaxed font-sans">
                      点击顶部导航栏中的「一键打包EXE桌面版」，我会指引您一键生成独立绿色的本地 EXE 文件，随时双击加载 8K 超高清全景图片！
                    </p>
                    <button
                      type="button"
                      id="btn-sidebar-go-exe"
                      onClick={() => setActiveTab('exeguide')}
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-0.5 cursor-pointer hover:underline"
                    >
                      <span>前往打包中心</span>
                      <ChevronRight size={10} />
                    </button>
                  </div>
                </div>
              </aside>
            </motion.div>
          ) : (
            <motion.div 
              key="exeguide-tab"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex-1 overflow-hidden w-full p-6 bg-slate-950"
            >
              <div className="max-w-4xl mx-auto h-full">
                <ExeGuide />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 3. Global Modals & Dialogs */}
      
      {/* Dynamic Hotspot Creation Modal Overlay */}
      {pendingHotspotCoords && (
        <HotspotDialog
          yaw={pendingHotspotCoords.yaw}
          pitch={pendingHotspotCoords.pitch}
          scenes={scenes}
          currentSceneId={activeSceneId}
          onClose={() => setPendingHotspotCoords(null)}
          onSave={saveNewHotspot}
        />
      )}

      {/* Detail info popover overlay (when info hotspot is triggered in browse mode) */}
      <AnimatePresence>
        {activeInfoHotspot && (
          <div 
            id="hp-info-overlay-backdrop" 
            className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setActiveInfoHotspot(null)}
          >
            <motion.div 
              id="hp-info-overlay-box"
              initial={{ scale: 0.93, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.93, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-xl max-w-sm w-full shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header card banner */}
              <div className="bg-slate-950 px-5 py-4 border-b border-slate-800 flex justify-between items-start">
                <div className="flex gap-2.5 items-center">
                  <div className="p-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400">
                    <Info size={16} />
                  </div>
                  <h4 className="font-sans font-bold text-slate-100 text-sm">
                    {activeInfoHotspot.title}
                  </h4>
                </div>
                <button
                  type="button"
                  id="btn-close-hp-info"
                  onClick={() => setActiveInfoHotspot(null)}
                  className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-850"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 space-y-4">
                <p className="text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-wrap">
                  {activeInfoHotspot.description || '该互动标记暂无补充描述内容。'}
                </p>

                {/* Spherical details tag */}
                <div className="flex justify-between items-center bg-slate-950 p-2 rounded-lg border border-slate-950 text-[10px] text-slate-500 font-mono">
                  <span>三维球面经度 Yaw: <b>{activeInfoHotspot.yaw}°</b></span>
                  <span>球面纬度 Pitch: <b>{activeInfoHotspot.pitch}°</b></span>
                </div>

                <button
                  type="button"
                  id="btn-hp-info-ok"
                  onClick={() => setActiveInfoHotspot(null)}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 rounded-lg text-xs cursor-pointer transition-colors"
                >
                  我知道了
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. Global Floating Toast Notifications */}
      <div className="fixed bottom-16 right-6 z-50 flex flex-col gap-2 pointer-events-none max-w-sm">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ transform: 'translateY(12px)', opacity: 0 }}
              animate={{ transform: 'translateY(0)', opacity: 1 }}
              exit={{ transform: 'translateY(-6px)', opacity: 0 }}
              className="bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-3 text-xs text-slate-200 shadow-xl backdrop-blur-md flex items-center gap-2.5 pointer-events-auto"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-ping" />
              <span>{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
