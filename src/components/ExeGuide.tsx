/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Laptop, 
  Terminal, 
  Files, 
  Check, 
  ExternalLink, 
  Cpu, 
  FolderGit2, 
  Download, 
  ArrowRight,
  Sparkles,
  Layers
} from 'lucide-react';

export default function ExeGuide() {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const steps = [
    {
      title: "1. 导出项目源码",
      desc: "在当前 Google AI Studio 界面，点击右上角设置/导出菜单，选择「导出为 ZIP 压缩包」或「导出至 GitHub」并下载到您的本地电脑上。",
      icon: <FolderGit2 className="text-blue-400" size={18} />
    },
    {
      title: "2. 解压并打开文件夹",
      desc: "在您的 Windows 本地电脑上解压 ZIP 包，并进入解压后的根目录。确保您电脑已安装了 Node.js 环境 (推荐 v18+ 或 v20+)。",
      icon: <Layers className="text-emerald-400" size={18} />
    },
    {
      title: "3. 一键运行打包工具",
      desc: "在解压根目录下，找到我为您生成的「一键打包EXE.bat」文件。直接双击运行它，它会自动执行依赖安装、React构建以及EXE封装。",
      icon: <Cpu className="text-violet-400" size={18} />
    },
    {
      title: "4. 获取绿色运行包",
      desc: "打包成功后，在本地项目的 dist/win-unpacked/ 目录下，即可看到「react-example.exe」程序。双击即可离线全屏浏览！",
      icon: <Sparkles className="text-amber-400" size={18} />
    }
  ];

  const commands = [
    {
      label: "手动打包第一步：安装桌面端容器 Electron",
      cmd: "npm install electron electron-builder --save-dev"
    },
    {
      label: "手动打包第二步：编译全景浏览器静态文件",
      cmd: "npm run build"
    },
    {
      label: "手动打包第三步：编译生成免安装绿色版 EXE",
      cmd: "npx electron-builder --win --dir"
    },
    {
      label: "手动打包可选：生成完整独立的单文件安装包 EXE (NSIS)",
      cmd: "npx electron-builder --win nsis"
    }
  ];

  return (
    <div id="exe-guide-container" className="h-full flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg select-text">
      {/* Banner */}
      <div className="bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-slate-900 px-6 py-5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400">
            <Laptop size={24} />
          </div>
          <div>
            <h2 className="font-sans font-bold text-slate-100 text-lg flex items-center gap-2">
              本地 EXE 桌面打包中心
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              我已为您自动配置好完整的 Electron 桌面封装环境，支持一键脱离浏览器离线运行！
            </p>
          </div>
        </div>
        <span className="text-[10px] font-semibold bg-blue-600/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
          Windows EXE Supporter
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Why Electron banner */}
        <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 text-xs text-slate-300 leading-relaxed flex gap-3 items-start">
          <div className="p-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-md text-emerald-400 shrink-0 mt-0.5">
            <Check size={14} />
          </div>
          <div className="space-y-1">
            <span className="font-semibold text-slate-100 block">本地桌面端运行优势：</span>
            <span>由于浏览器沙箱环境限制，普通的网页端无法直接读取您本地电脑上的无限量超清全景图。通过打包为本地桌面级 EXE，程序能够直接高速加载本地几十MB的 8K/16K 超高清全景文件，并且支持 100% 离线运行、双击启动、全屏浸入式浏览！</span>
          </div>
        </div>

        {/* Visual Roadmap steps */}
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
            <span>Windows 一键智能打包指南</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {steps.map((st, i) => (
              <div key={i} className="bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 rounded-xl p-4 flex gap-3 transition-colors">
                <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center font-semibold text-sm">
                  {st.icon}
                </div>
                <div className="space-y-1">
                  <h4 className="font-sans font-bold text-slate-200 text-xs flex items-center gap-1.5">
                    {st.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {st.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Manual commands for developer */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <Terminal size={14} className="text-blue-400" />
            <span>命令行手动精细打包 (支持 Mac/Linux 编译)</span>
          </h3>
          
          <div className="space-y-3">
            {commands.map((cmdObj, i) => (
              <div key={i} className="bg-slate-950 border border-slate-800 rounded-lg p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-semibold text-slate-300 font-sans">{cmdObj.label}</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(cmdObj.cmd, i)}
                    className="flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 transition-colors bg-slate-900 px-2 py-0.5 rounded border border-slate-800"
                  >
                    {copiedIndex === i ? (
                      <>
                        <Check size={10} className="text-emerald-400" />
                        <span className="text-emerald-400">已复制</span>
                      </>
                    ) : (
                      <>
                        <Files size={10} />
                        <span>复制指令</span>
                      </>
                    )}
                  </button>
                </div>
                <code className="block text-xs font-mono text-emerald-400 bg-slate-900 p-2 rounded border border-slate-950 break-all select-all">
                  {cmdObj.cmd}
                </code>
              </div>
            ))}
          </div>
        </div>

        {/* Configurations checklist */}
        <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 space-y-2.5">
          <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <Check size={14} className="text-emerald-400" />
            <span>我已为您在项目根目录中完成了以下文件：</span>
          </h4>
          <ul className="text-[11px] text-slate-400 space-y-1.5 pl-5 list-disc font-mono">
            <li>
              <span className="text-slate-200 font-semibold">/electron-main.cjs</span>
              <span className="text-slate-500"> - </span> 
              <span>主控层文件。负责本地端口映射与独立窗口创建。</span>
            </li>
            <li>
              <span className="text-slate-200 font-semibold">/一键打包EXE.bat</span>
              <span className="text-slate-500"> - </span> 
              <span>Windows 自动化批处理脚本。双击即可全自动运行。</span>
            </li>
            <li>
              <span className="text-slate-200 font-semibold">/package.json (配置更新)</span>
              <span className="text-slate-500"> - </span> 
              <span>追加了桌面 main 入口、以及 electron-builder 编译器属性。</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="bg-slate-950 px-6 py-4 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-3">
        <span className="text-[11px] text-slate-500 font-sans">
          © 全景图浏览器桌面端打包集成引擎 · 支持 360° VR 混合渲染
        </span>
        <a 
          href="https://www.electronjs.org/" 
          target="_blank" 
          rel="noreferrer referrer"
          className="flex items-center gap-1 text-[11px] text-blue-400 hover:underline"
        >
          <span>了解更多 Electron 打包技术</span>
          <ExternalLink size={10} />
        </a>
      </div>
    </div>
  );
}
