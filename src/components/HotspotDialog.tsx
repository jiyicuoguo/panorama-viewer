/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Scene, HotspotIcon, HotspotType } from '../types';
import { X, Info, ArrowRight, Eye, DoorOpen, Star, MapPin, HelpCircle } from 'lucide-react';

interface HotspotDialogProps {
  yaw: number;
  pitch: number;
  scenes: Scene[];
  currentSceneId: string;
  onClose: () => void;
  onSave: (hotspotData: {
    type: HotspotType;
    icon: HotspotIcon;
    title: string;
    description: string;
    targetSceneId?: string;
  }) => void;
}

export default function HotspotDialog({
  yaw,
  pitch,
  scenes,
  currentSceneId,
  onClose,
  onSave,
}: HotspotDialogProps) {
  const [type, setType] = useState<HotspotType>('info');
  const [icon, setIcon] = useState<HotspotIcon>('info');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetSceneId, setTargetSceneId] = useState(
    scenes.filter(s => s.id !== currentSceneId)[0]?.id || ''
  );

  const availableScenes = scenes.filter(s => s.id !== currentSceneId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      type,
      icon,
      title,
      description,
      targetSceneId: type === 'portal' ? targetSceneId : undefined,
    });
  };

  const iconsList: Array<{ id: HotspotIcon; label: string; element: React.ReactNode }> = [
    { id: 'info', label: '信息提示', element: <Info size={16} /> },
    { id: 'arrow-right', label: '传送方向', element: <ArrowRight size={16} /> },
    { id: 'eye', label: '视点关注', element: <Eye size={16} /> },
    { id: 'door', label: '室内通道', element: <DoorOpen size={16} /> },
    { id: 'star', label: '重要推荐', element: <Star size={16} /> },
    { id: 'marker', label: '位置地标', element: <MapPin size={16} /> },
  ];

  return (
    <div id="hotspot-dialog-backdrop" className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div 
        id="hotspot-dialog-container"
        className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-5 py-4 border-b border-slate-800">
          <div>
            <h3 className="font-sans font-semibold text-slate-100 text-base">添加全景互动热点</h3>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
              坐标位置: Yaw={yaw}°, Pitch={pitch}°
            </p>
          </div>
          <button 
            type="button"
            id="btn-close-hotspot-dialog"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 transition-colors p-1 rounded-md hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-sm flex-1">
          {/* Hotspot Type Switcher */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">热点动作类型</label>
            <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                type="button"
                id="btn-type-info"
                onClick={() => {
                  setType('info');
                  setIcon('info');
                }}
                className={`py-1.5 px-3 rounded-md text-xs font-medium transition-all ${
                  type === 'info'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                信息看板 (图文卡片)
              </button>
              <button
                type="button"
                id="btn-type-portal"
                onClick={() => {
                  setType('portal');
                  setIcon('arrow-right');
                  // Auto-select first target if available
                  if (!targetSceneId && availableScenes.length > 0) {
                    setTargetSceneId(availableScenes[0].id);
                  }
                }}
                className={`py-1.5 px-3 rounded-md text-xs font-medium transition-all ${
                  type === 'portal'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                多场景传送 (虚拟漫游)
              </button>
            </div>
          </div>

          {/* Title input */}
          <div>
            <label htmlFor="hotspot-title" className="block text-xs font-semibold text-slate-300 mb-1">
              热点标题 <span className="text-rose-500">*</span>
            </label>
            <input
              id="hotspot-title"
              type="text"
              required
              placeholder={type === 'info' ? "例如: 远处的雪山 / 雕刻柱" : "例如: 传送至起居室 / 庭院入口"}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500 font-sans"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="hotspot-desc" className="block text-xs font-semibold text-slate-300 mb-1">
              详细描述内容
            </label>
            <textarea
              id="hotspot-desc"
              rows={2}
              placeholder={type === 'info' ? "可以写一下该物体的历史背景、说明介绍等..." : "对下一个场景做个简短的介绍..."}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500 text-xs resize-none"
            />
          </div>

          {/* Portal Target Selection (Conditional) */}
          {type === 'portal' && (
            <div className="animate-fade-in">
              <label htmlFor="portal-target-scene" className="block text-xs font-semibold text-slate-300 mb-1">
                目标传送场景
              </label>
              {availableScenes.length > 0 ? (
                <select
                  id="portal-target-scene"
                  value={targetSceneId}
                  onChange={(e) => setTargetSceneId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 text-xs"
                >
                  {availableScenes.map(sc => (
                    <option key={sc.id} value={sc.id}>
                      {sc.name} {sc.isUserUploaded ? '(自导入)' : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-[11px] text-amber-400 bg-amber-950/30 border border-amber-900/50 rounded-lg p-2 flex gap-1.5">
                  <HelpCircle size={14} className="shrink-0 mt-0.5" />
                  <span>目前没有其他可用场景，请先在左侧边栏“场景库”添加或上传一个其他全景图。</span>
                </div>
              )}
            </div>
          )}

          {/* Icon Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">热点图标样式</label>
            <div className="grid grid-cols-3 gap-2">
              {iconsList.map(ic => (
                <button
                  key={ic.id}
                  type="button"
                  id={`btn-icon-${ic.id}`}
                  onClick={() => setIcon(ic.id)}
                  className={`flex items-center gap-1.5 justify-center py-2 border rounded-lg transition-all text-[11px] ${
                    icon === ic.id
                      ? type === 'portal'
                        ? 'bg-emerald-950/50 border-emerald-500 text-emerald-300 shadow-sm'
                        : 'bg-blue-950/50 border-blue-500 text-blue-300 shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-300'
                  }`}
                >
                  {ic.element}
                  <span>{ic.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Submit Action */}
          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              id="btn-dialog-cancel"
              onClick={onClose}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white py-2 rounded-lg font-medium transition-colors cursor-pointer text-xs"
            >
              取消
            </button>
            <button
              type="submit"
              id="btn-dialog-save"
              disabled={type === 'portal' && availableScenes.length === 0}
              className={`flex-1 text-white py-2 rounded-lg font-medium transition-all cursor-pointer text-xs ${
                type === 'portal'
                  ? 'bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-900/40 disabled:text-emerald-500'
                  : 'bg-blue-600 hover:bg-blue-500'
              }`}
            >
              保存热点
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
