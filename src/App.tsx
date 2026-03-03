/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import TetrisGame from './components/TetrisGame';

export default function App() {
  return (
    <div className="h-screen bg-white text-black font-sans p-4 flex flex-col relative overflow-hidden selection:bg-black selection:text-white">
      
      {/* Top Section */}
      <div className="flex justify-between items-start w-full max-w-2xl mx-auto mb-4 shrink-0">
        
        {/* Top Left: Color Bars */}
        <div className="flex gap-0 h-4 w-32">
          <div className="flex-1 bg-[#FF00FF]"></div> {/* Magenta */}
          <div className="flex-1 bg-[#89CFF0]"></div> {/* Light Blue */}
          <div className="flex-1 bg-[#00FF00]"></div> {/* Green */}
          <div className="flex-1 bg-[#00FFFF]"></div> {/* Cyan */}
          <div className="flex-1 bg-black"></div>      {/* Black */}
        </div>

        {/* Top Right: Title Text Blocks */}
        <div className="flex flex-col items-end gap-2">
          <div className="flex gap-2">
            <div className="bg-black text-white px-3 py-1 text-xl font-bold tracking-widest">
              노드
            </div>
            <div className="bg-black text-white px-3 py-1 text-xl font-bold tracking-widest">
              투
            </div>
          </div>
          <div className="bg-black text-white px-3 py-1 text-xl font-bold tracking-widest self-end">
            노드
          </div>
        </div>
      </div>

      {/* Center: Tetris Game Frame */}
      <div className="flex-1 flex items-center justify-center w-full max-w-2xl mx-auto relative z-10 min-h-0 overflow-hidden">
        {/* The "Frame" container for the game */}
        <div className="relative p-2 scale-90 sm:scale-100 origin-center">
           <TetrisGame />
        </div>
      </div>

      {/* Bottom Left: Footer Text Block */}
      <div className="w-full max-w-2xl mx-auto mt-4 mb-4 shrink-0">
        <div className="bg-black text-white px-4 py-2 text-2xl font-bold tracking-widest inline-block">
          만드세요
        </div>
      </div>

      {/* Background decoration (optional, to mimic the clean white aesthetic) */}
      <div className="absolute inset-0 pointer-events-none opacity-5 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]"></div>
    </div>
  );
}
