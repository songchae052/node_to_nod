import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, ArrowLeft, ArrowRight, ArrowDown, RotateCw } from 'lucide-react';

// --- Constants & Types ---

const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 28;
const TICK_RATE = 1000;

const CHAR_POOL = ['n', 'n', 'o', 'o', 'o', 'd', 'd', 'e', 't']; // Weighted
const TARGET_WORDS = ['node', 'to', 'nod'];
const HIGHLIGHT_COLORS = ['#8FF1FC', '#FF1DB0', '#A2C6F8', '#9FF63B'];

// Custom Shape Mask (1 = Valid Play Area, 0 = Wall/Empty)
const GRID_MASK = [
  [0,0,1,1,1,1,1,0,0,0],
  [0,0,1,1,1,1,1,1,0,0],
  [1,1,1,1,1,1,1,1,1,0],
  [1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1],
  [0,1,1,1,1,1,1,1,1,1],
  [0,1,1,1,1,1,1,1,1,0],
  [0,0,1,1,1,1,1,1,1,0],
  [0,0,0,1,1,1,1,1,0,0],
];

// Standard Tetris Shapes
const SHAPES = {
  I: [[0,0,0,0], [1,1,1,1], [0,0,0,0], [0,0,0,0]],
  J: [[1,0,0], [1,1,1], [0,0,0]],
  L: [[0,0,1], [1,1,1], [0,0,0]],
  O: [[1,1], [1,1]],
  S: [[0,1,1], [1,1,0], [0,0,0]],
  T: [[0,1,0], [1,1,1], [0,0,0]],
  Z: [[1,1,0], [0,1,1], [0,0,0]],
};

type ShapeType = keyof typeof SHAPES;

interface Cell {
  char: string;
  color: string;
}

interface Piece {
  shape: number[][];
  type: ShapeType;
  x: number;
  y: number;
  chars: string[];
}

// --- Helper Functions ---

const getRandomChar = () => CHAR_POOL[Math.floor(Math.random() * CHAR_POOL.length)];

const shuffleArray = (array: string[]) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const createPiece = (): Piece => {
  const types = Object.keys(SHAPES) as ShapeType[];
  const type = types[Math.floor(Math.random() * types.length)];
  const shape = SHAPES[type];
  
  let blockCount = 0;
  shape.forEach(row => row.forEach(cell => { if(cell) blockCount++; }));
  
  const chars = Array(blockCount).fill(null).map(() => getRandomChar());

  return {
    shape,
    type,
    x: Math.floor(COLS / 2) - Math.ceil(shape[0].length / 2),
    y: 0, 
    chars,
  };
};

const checkCollision = (piece: Piece, board: (Cell | null)[][], moveX = 0, moveY = 0) => {
  for (let y = 0; y < piece.shape.length; y++) {
    for (let x = 0; x < piece.shape[y].length; x++) {
      if (piece.shape[y][x]) {
        const newX = piece.x + x + moveX;
        const newY = piece.y + y + moveY;

        if (newX < 0 || newX >= COLS || newY >= ROWS) return true;
        if (GRID_MASK[newY][newX] === 0) return true;
        if (newY >= 0 && board[newY][newX]) return true;
      }
    }
  }
  return false;
};

// Scan board, highlight words, and return found words list
const checkAndHighlightWords = (board: (Cell | null)[][], getNextColor: () => string) => {
  // Deep copy to allow mutation of cell colors
  const newBoard = board.map(row => row.map(cell => cell ? { ...cell } : null));
  const found = new Set<string>();
  const visited = new Set<string>(); // Shared visited set for both directions

  // Sort words by length descending to prioritize longer matches (e.g. "node" before "nod")
  const sortedTargets = [...TARGET_WORDS].sort((a, b) => b.length - a.length);

  const processSegment = (segment: {r: number, c: number}[], word: string) => {
    // Check overlap with already found words in this scan
    if (segment.some(({r, c}) => visited.has(`${r},${c}`))) return;

    // Check if we need to assign a new color
    // If ANY cell in the segment is uncolored ('black'), it means this is a new formation 
    // or an upgrade (e.g. "nod" -> "node"). In this case, we assign a new color to the WHOLE word.
    const needsColoring = segment.some(({r, c}) => newBoard[r][c]?.color === 'black');
    
    if (needsColoring) {
      const newColor = getNextColor();
      segment.forEach(({r, c}) => {
        if (newBoard[r][c]) {
          newBoard[r][c]!.color = newColor;
        }
      });
    }

    // Mark visited and add to found list
    segment.forEach(({r, c}) => visited.add(`${r},${c}`));
    found.add(word);
  };

  // Horizontal Scan (Priority)
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      for (const word of sortedTargets) {
        if (c + word.length <= COLS) {
          let match = true;
          const segment = [];
          for (let i = 0; i < word.length; i++) {
            if (newBoard[r][c + i]?.char !== word[i]) {
              match = false;
              break;
            }
            segment.push({r, c: c + i});
          }
          if (match) processSegment(segment, word);
        }
      }
    }
  }

  // Vertical Scan
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r < ROWS; r++) {
      for (const word of sortedTargets) {
        if (r + word.length <= ROWS) {
          let match = true;
          const segment = [];
          for (let i = 0; i < word.length; i++) {
            if (newBoard[r + i][c]?.char !== word[i]) {
              match = false;
              break;
            }
            segment.push({r: r + i, c});
          }
          if (match) processSegment(segment, word);
        }
      }
    }
  }

  return { newBoard, found: Array.from(found) };
};

// --- Component ---

interface TetrisGameProps {
  isHintOpen: boolean;
  setIsHintOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function TetrisGame({ isHintOpen, setIsHintOpen }: TetrisGameProps) {
  const [board, setBoard] = useState<(Cell | null)[][]>(
    Array.from({ length: ROWS }, () => Array(COLS).fill(null))
  );
  const [activePiece, setActivePiece] = useState<Piece>(createPiece());
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  
  // Color Queue State
  const colorQueue = useRef<string[]>([]);

  const getNextColor = useCallback(() => {
    if (colorQueue.current.length === 0) {
      colorQueue.current = shuffleArray(HIGHLIGHT_COLORS);
    }
    return colorQueue.current.pop()!;
  }, []);

  const startGame = () => {
    setGameStarted(true);
    resetGame();
  };

  const resetGame = () => {
    setBoard(Array.from({ length: ROWS }, () => Array(COLS).fill(null)));
    setActivePiece(createPiece());
    setGameOver(false);
    setGameWon(false);
    setFoundWords([]);
    setIsHintOpen(false);
    colorQueue.current = []; // Reset color queue
  };

  const toggleHint = () => {
    setIsHintOpen(prev => !prev);
  };

  // --- Game Logic ---

  const lockPiece = useCallback(() => {
    // 1. Place the piece on a temporary board
    const tempBoard = board.map(row => row.map(cell => cell ? { ...cell } : null));
    let charIndex = 0;

    activePiece.shape.forEach((row, dy) => {
      row.forEach((value, dx) => {
        if (value) {
          const x = activePiece.x + dx;
          const y = activePiece.y + dy;
          if (y >= 0 && y < ROWS && x >= 0 && x < COLS && GRID_MASK[y][x] === 1) {
            tempBoard[y][x] = {
              char: activePiece.chars[charIndex],
              color: 'black',
            };
          }
          charIndex++;
        }
      });
    });

    // 2. Check for words and highlight
    const { newBoard, found } = checkAndHighlightWords(tempBoard, getNextColor);

    setBoard(newBoard);
    setFoundWords(found);

    // Check if all target words are found
    if (found.length === TARGET_WORDS.length) {
      setGameWon(true);
      setGameOver(true);
    } else {
      const newPiece = createPiece();
      if (checkCollision(newPiece, newBoard)) {
        setGameOver(true);
      } else {
        setActivePiece(newPiece);
      }
    }
  }, [activePiece, board, getNextColor]);

  const move = useCallback((dx: number, dy: number) => {
    if (gameOver || gameWon) return;

    if (!checkCollision(activePiece, board, dx, dy)) {
      setActivePiece(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
      return true;
    } else if (dy > 0) {
      lockPiece();
      return false;
    }
    return false;
  }, [activePiece, board, gameOver, gameWon, lockPiece]);

  const rotate = useCallback(() => {
    if (gameOver || gameWon) return;

    const rotatedShape = activePiece.shape[0].map((_, index) =>
      activePiece.shape.map(row => row[index]).reverse()
    );
    
    const newPiece = { ...activePiece, shape: rotatedShape };
    
    if (!checkCollision(newPiece, board)) {
      setActivePiece(newPiece);
    } else if (!checkCollision(newPiece, board, -1, 0)) {
      setActivePiece({ ...newPiece, x: newPiece.x - 1 });
    } else if (!checkCollision(newPiece, board, 1, 0)) {
      setActivePiece({ ...newPiece, x: newPiece.x + 1 });
    }
  }, [activePiece, board, gameOver, gameWon]);

  // --- Controls ---

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameStarted || gameOver || gameWon) return;
      
      switch (e.key) {
        case 'ArrowLeft': move(-1, 0); break;
        case 'ArrowRight': move(1, 0); break;
        case 'ArrowDown': move(0, 1); break;
        case 'ArrowUp': rotate(); break;
        case ' ': move(0, 1); break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [move, rotate, gameOver, gameWon, gameStarted]);

  useEffect(() => {
    if (!gameStarted || gameOver || gameWon) return;
    const tick = () => move(0, 1);
    gameLoopRef.current = setInterval(tick, TICK_RATE);
    return () => { if (gameLoopRef.current) clearInterval(gameLoopRef.current); };
  }, [move, gameOver, gameWon, gameStarted]);

  // --- Rendering ---

  const displayGrid = useMemo(() => {
    const grid = board.map(row => row.map(cell => cell));
    if (!gameOver && !gameWon) {
      let charIndex = 0;
      activePiece.shape.forEach((row, dy) => {
        row.forEach((value, dx) => {
          if (value) {
            const x = activePiece.x + dx;
            const y = activePiece.y + dy;
            if (y >= 0 && y < ROWS && x >= 0 && x < COLS && GRID_MASK[y][x] === 1) {
              grid[y][x] = {
                char: activePiece.chars[charIndex],
                color: 'active',
              };
            }
            charIndex++;
          }
        });
      });
    }
    return grid;
  }, [board, activePiece, gameOver, gameWon]);

  const borderPath = useMemo(() => {
    let path = "";
    const cellSize = BLOCK_SIZE;
    const isValid = (r: number, c: number) => 
      r >= 0 && r < ROWS && c >= 0 && c < COLS && GRID_MASK[r][c] === 1;

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (isValid(r, c)) {
          if (!isValid(r - 1, c)) path += `M${c * cellSize},${r * cellSize} L${(c + 1) * cellSize},${r * cellSize} `;
          if (!isValid(r + 1, c)) path += `M${c * cellSize},${(r + 1) * cellSize} L${(c + 1) * cellSize},${(r + 1) * cellSize} `;
          if (!isValid(r, c - 1)) path += `M${c * cellSize},${r * cellSize} L${c * cellSize},${(r + 1) * cellSize} `;
          if (!isValid(r, c + 1)) path += `M${(c + 1) * cellSize},${r * cellSize} L${(c + 1) * cellSize},${(r + 1) * cellSize} `;
        }
      }
    }
    return path;
  }, []);

  const maskImage = useMemo(() => {
    const rects = [];
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if (GRID_MASK[y][x] === 1) {
          // Add slight overlap (0.5px) to prevent sub-pixel gaps between mask rects
          rects.push(
            `<rect x="${x * BLOCK_SIZE}" y="${y * BLOCK_SIZE}" width="${BLOCK_SIZE + 0.5}" height="${BLOCK_SIZE + 0.5}" fill="black" />`
          );
        }
      }
    }
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${COLS * BLOCK_SIZE}" height="${ROWS * BLOCK_SIZE}" viewBox="0 0 ${COLS * BLOCK_SIZE} ${ROWS * BLOCK_SIZE}" shape-rendering="crispEdges">${rects.join('')}</svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  }, []);

  return (
    <div className="relative flex flex-col items-center justify-center gap-2">
      
      {/* Target Words Display */}
      <div className="flex gap-4 mb-0 z-10 scale-90 origin-bottom">
        {TARGET_WORDS.map(word => (
          <div 
            key={word}
            className={`
              px-3 py-1 border-2 font-mono font-bold uppercase tracking-widest text-sm transition-all
              ${foundWords.includes(word) 
                ? 'bg-black text-white border-black line-through opacity-50' 
                : 'bg-white text-black border-black'}
            `}
          >
            {word}
          </div>
        ))}
      </div>

      <div 
        className="relative origin-top scale-[0.80] sm:scale-100"
        style={{ 
          width: `${COLS * BLOCK_SIZE}px`,
          height: `${ROWS * BLOCK_SIZE}px`,
        }}
      >
        <svg 
          className="absolute inset-0 pointer-events-none z-[60]"
          width={COLS * BLOCK_SIZE}
          height={ROWS * BLOCK_SIZE}
        >
          <path d={borderPath} stroke="black" strokeWidth="2.5" fill="none" />
        </svg>

        <div 
          className="grid absolute inset-0 z-10"
          style={{ 
            gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
          }}
        >
          {displayGrid.map((row, y) =>
            row.map((cell, x) => {
              const isHighlight = cell?.color && cell.color !== 'black' && cell.color !== 'active';
              return (
                <div
                  key={`${y}-${x}`}
                  className={`
                    w-full h-full flex items-center justify-center text-sm font-bold font-mono
                    ${GRID_MASK[y][x] === 0 ? 'opacity-0' : ''} 
                    ${cell?.color === 'active' ? 'ring-1 ring-white/20' : ''}
                  `}
                  style={{ 
                    height: BLOCK_SIZE,
                    backgroundColor: isHighlight ? cell?.color : (cell ? 'black' : 'transparent'),
                    color: isHighlight ? 'black' : (cell ? 'white' : 'transparent'),
                  }}
                >
                  {GRID_MASK[y][x] === 1 ? cell?.char : ''}
                </div>
              );
            })
          )}
        </div>

        <AnimatePresence>
          {!gameStarted && (
            <motion.div 
              key="start-screen"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-40 flex flex-col items-center justify-center text-center p-6 bg-white"
            >
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="relative z-10 flex flex-col items-center gap-8"
              >
                <h2 className="text-xl font-bold text-black leading-relaxed break-keep">
                  테트리스를 쌓아<br/>
                  NODE TO NOD 를<br/>
                  연결해보세요
                </h2>
                
                <button 
                  onClick={startGame}
                  className="px-8 py-3 bg-black text-white text-sm font-bold hover:bg-gray-800 transition-colors rounded-full tracking-widest"
                >
                  START
                </button>
              </motion.div>
            </motion.div>
          )}

          {isHintOpen && !gameOver && (
            <motion.div 
              key="hint-screen"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 flex flex-col items-center justify-center text-center p-6"
            >
              {/* Masked Background */}
              <div 
                className="absolute inset-0 bg-white"
                style={{ 
                  maskImage: maskImage,
                  WebkitMaskImage: maskImage,
                  maskSize: '100% 100%',
                  WebkitMaskSize: '100% 100%'
                }}
              />

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="relative z-10 flex flex-col items-center gap-6"
              >
                {/* Title Section */}
                <div>
                  <h2 className="text-3xl font-black uppercase tracking-tighter mb-2 text-black">Node To Nod</h2>
                  <div className="text-[10px] font-bold text-gray-500 leading-tight space-y-0.5">
                    <p>국민대 AI 디자인 Synapse</p>
                    <p>x</p>
                    <p>홍익대 산업디자인 Cre8</p>
                  </div>
                </div>
                
                {/* Info Section */}
                <div className="text-[11px] space-y-1 leading-tight text-black">
                  <p className="font-medium">서울 중구 을지로 108 2층 페이지 메일</p>
                  <p className="font-bold">2026.03.17. - 21.</p>
                  <p className="font-medium">@synapse_kmu</p>
                </div>

                <div className="flex gap-3 mt-4">
                  <button 
                    onClick={() => {
                      resetGame();
                      // Game is reset, isHintOpen becomes false in resetGame
                      setGameStarted(true); // Ensure game starts after reset if it was paused
                    }}
                    className="px-6 py-2 bg-black text-white text-xs font-bold hover:bg-gray-800 transition-colors rounded-full"
                  >
                    다시하기
                  </button>
                  <button 
                    onClick={toggleHint}
                    className="px-6 py-2 border border-black text-black text-xs font-bold hover:bg-gray-100 transition-colors rounded-full"
                  >
                    이어하기
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {gameOver && (
            <motion.div 
              key="game-over-screen"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-40 flex flex-col items-center justify-center text-center"
            >
              {/* Masked Background */}
              <div 
                className="absolute inset-0 bg-black"
                style={{ 
                  maskImage: maskImage,
                  WebkitMaskImage: maskImage,
                  maskSize: '100% 100%',
                  WebkitMaskSize: '100% 100%'
                }}
              />

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="relative z-10 flex flex-col items-center gap-6"
              >
                {/* Title Section */}
                <div>
                  {gameWon && (
                    <h3 className="text-sm font-bold text-[#FF1DB0] tracking-widest mb-1">COMPLETE!</h3>
                  )}
                  <h2 className="text-4xl font-black uppercase tracking-tighter mb-2 text-white">Node To Nod</h2>
                  <div className="text-[10px] font-bold text-gray-400 leading-tight space-y-0.5">
                    <p>국민대 AI 디자인 Synapse</p>
                    <p>x</p>
                    <p>홍익대 산업디자인 Cre8</p>
                  </div>
                </div>
                
                {/* Info Section */}
                <div className="text-[11px] space-y-1 leading-tight">
                  <p className="text-white font-medium">서울 중구 을지로 108 2층 페이지 메일</p>
                  <p className="text-white font-bold">2026.03.17. - 21.</p>
                  <p className="text-white font-medium">@synapse_kmu</p>
                </div>

                <button 
                  onClick={resetGame}
                  className="inline-flex items-center gap-2 px-6 py-2 bg-white text-black text-xs font-bold hover:bg-gray-200 transition-colors rounded-full mt-2"
                >
                  <RefreshCw size={12} />
                  {gameWon ? 'PLAY AGAIN' : 'RETRY'}
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile Controls */}
      <div className="grid grid-cols-4 gap-2 w-full max-w-[200px] -mt-20 sm:hidden relative z-20">
        <button 
          className="aspect-square bg-black text-white flex items-center justify-center active:bg-gray-800 touch-manipulation shadow-sm"
          onClick={() => move(-1, 0)}
          aria-label="Left"
        >
          <ArrowLeft size={20} />
        </button>
        <button 
          className="aspect-square bg-black text-white flex items-center justify-center active:bg-gray-800 touch-manipulation shadow-sm"
          onClick={() => move(0, 1)}
          aria-label="Down"
        >
          <ArrowDown size={20} />
        </button>
        <button 
          className="aspect-square bg-black text-white flex items-center justify-center active:bg-gray-800 touch-manipulation shadow-sm"
          onClick={() => move(1, 0)}
          aria-label="Right"
        >
          <ArrowRight size={20} />
        </button>
        <button 
          className="aspect-square bg-[#FF1DB0] text-white flex items-center justify-center active:bg-[#d91694] touch-manipulation shadow-sm"
          onClick={rotate}
          aria-label="Rotate"
        >
          <RotateCw size={20} />
        </button>
      </div>
    </div>
  );
}
