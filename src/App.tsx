/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import TetrisGame from './components/TetrisGame';

export default function App() {
  return (
    <div className="h-[100dvh] bg-white text-black font-sans p-4 flex flex-col relative overflow-hidden selection:bg-black selection:text-white">
      
      {/* Top Section */}
      <div className="flex justify-between items-start w-full max-w-md mx-auto mb-2 shrink-0">
        
        {/* Top Left: Color Bars */}
        <div className="flex gap-0 h-3 w-24 sm:h-4 sm:w-32">
          <div className="flex-1 bg-[#FF00FF]"></div> {/* Magenta */}
          <div className="flex-1 bg-[#89CFF0]"></div> {/* Light Blue */}
          <div className="flex-1 bg-[#00FF00]"></div> {/* Green */}
          <div className="flex-1 bg-[#00FFFF]"></div> {/* Cyan */}
          <div className="flex-1 bg-black"></div>      {/* Black */}
        </div>

        {/* Top Right: Title Text Blocks */}
        <div className="flex flex-col items-end gap-1.5">
          <div className="flex gap-1.5">
            <div className="bg-black text-white px-2 py-0.5 text-lg sm:text-xl font-bold tracking-widest">
              노드
            </div>
            <div className="bg-black text-white px-2 py-0.5 text-lg sm:text-xl font-bold tracking-widest">
              투
            </div>
          </div>
          <div className="bg-black text-white px-2 py-0.5 text-lg sm:text-xl font-bold tracking-widest self-end">
            노드
          </div>
        </div>
      </div>

      {/* Center: Tetris Game Frame */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md mx-auto relative z-10 min-h-0">
        {/* The "Frame" container for the game */}
        <div className="relative p-1 origin-center">
           <TetrisGame />
        </div>
      </div>

      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none opacity-5 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]"></div>
    </div>
  );
}
