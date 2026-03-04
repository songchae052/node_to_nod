/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import TetrisGame from './components/TetrisGame';

export default function App() {
  const [isHintOpen, setIsHintOpen] = React.useState(false);

  return (
    <div className="h-[100dvh] bg-white text-black font-sans p-4 flex flex-col relative overflow-hidden selection:bg-black selection:text-white">
      
      {/* Top Section */}
      <div className="flex justify-between items-start w-full max-w-md mx-auto mb-2 shrink-0">
        
        {/* Top Left: Hint Button */}
        <button
          onClick={() => setIsHintOpen(prev => !prev)}
          className="bg-black text-white px-3 h-8 flex items-center justify-center text-sm font-bold hover:bg-gray-800 transition-colors rounded-none"
        >
          Hint
        </button>

        {/* Top Right: Title Text Blocks */}
        <div className="flex flex-col items-end gap-1.5">
          <div className="flex gap-1.5">
            <div className="bg-black text-white px-3 h-8 flex items-center justify-center text-sm font-bold tracking-widest">
              노드
            </div>
            <div className="bg-black text-white px-3 h-8 flex items-center justify-center text-sm font-bold tracking-widest">
              투
            </div>
          </div>
          <div className="bg-black text-white px-3 h-8 flex items-center justify-center text-sm font-bold tracking-widest self-end">
            노드
          </div>
        </div>
      </div>

      {/* Center: Tetris Game Frame */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md mx-auto relative z-10 min-h-0">
        {/* The "Frame" container for the game */}
        <div className="relative p-1 origin-center">
           <TetrisGame isHintOpen={isHintOpen} setIsHintOpen={setIsHintOpen} />
        </div>
      </div>

      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none opacity-5 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]"></div>
    </div>
  );
}
