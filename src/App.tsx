import React, { useState, useEffect } from 'react'

interface Player {
  id: number;
  name: string;
  progress: number;
  multiplier?: number;
  score: number;
  answerTime?: number;
}

interface Question {
  title: string;
  description: string;
  difficulty: string;
  targetCount: number;
  options: Array<{
    id: number;
    count: number;
    image: string;
  }>;
}

// 题目库
const questionBank: Question[] = [
  {
    title: '合并计算',
    description: '点选两个板子，使数量与范本相同',
    difficulty: '简单',
    targetCount: 6,
    options: [
      { id: 1, count: 2, image: '🦁' },
      { id: 2, count: 1, image: '🐻' },
      { id: 3, count: 4, image: '🐰' }
    ]
  },
  {
    title: '动物派对',
    description: '选择两组动物，让派对人数相等',
    difficulty: '简单',
    targetCount: 8,
    options: [
      { id: 1, count: 3, image: '🐨' },
      { id: 2, count: 5, image: '🐯' },
      { id: 3, count: 3, image: '🐸' }
    ]
  },
  {
    title: '农场计数',
    description: '帮助农场主数清动物数量',
    difficulty: '中等',
    targetCount: 10,
    options: [
      { id: 1, count: 4, image: '🐷' },
      { id: 2, count: 6, image: '🐮' },
      { id: 3, count: 3, image: '🐔' }
    ]
  },
  {
    title: '海洋冒险',
    description: '组合海洋生物达到目标数量',
    difficulty: '中等',
    targetCount: 12,
    options: [
      { id: 1, count: 5, image: '🐠' },
      { id: 2, count: 7, image: '🐋' },
      { id: 3, count: 4, image: '🦈' }
    ]
  }
];

function App() {
  const [players, setPlayers] = useState<Player[]>([
    { id: 1, name: '我', progress: 0, multiplier: 10, score: 0, answerTime: 0 },
    { id: 2, name: '巴拉克', progress: 0, multiplier: 5, score: 0, answerTime: 0 },
    { id: 3, name: '柠檬', progress: 0, score: 0, answerTime: 0 },
    { id: 4, name: '夏天', progress: 0, score: 0, answerTime: 0 },
    { id: 5, name: '小树苗', progress: 0, multiplier: 3, score: 0, answerTime: 0 },
    { id: 6, name: 'labob', progress: 0, score: 0, answerTime: 0 },
    { id: 7, name: '嘻嘻哈哈', progress: 0, score: 0, answerTime: 0 }
  ]);

  const [currentQuestion, setCurrentQuestion] = useState<Question>(questionBank[0]);
  const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
  const [showResult, setShowResult] = useState<'correct' | 'wrong' | null>(null);
  const [questionCount, setQuestionCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [waitingForOthers, setWaitingForOthers] = useState(false);
  const [answeredPlayers, setAnsweredPlayers] = useState<number[]>([]);
  const [botTimers, setBotTimers] = useState<{ [key: number]: ReturnType<typeof setTimeout> | null }>({});
  const [gameState, setGameState] = useState<'start' | 'playing' | 'finished'>('start');
  const [currentScore, setCurrentScore] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<number>(0);

  const startGame = () => {
    setGameState('playing');
    setPlayers(players.map(p => ({ ...p, score: 0, progress: 0, answerTime: 0 })));
    setStartTime(Date.now());
    generateNewQuestion();
    setSelectedOptions([]);
    setShowResult(null);
    setStreak(0);
    setAnsweredPlayers([]);
    setCurrentScore(null);
  };

  const resetGame = () => {
    setGameState('playing');
    setPlayers(players.map(p => ({ ...p, score: 0, progress: 0, answerTime: 0 })));
    setStartTime(Date.now());
    generateNewQuestion();
    setSelectedOptions([]);
    setShowResult(null);
    setStreak(0);
    setAnsweredPlayers([]);
    setCurrentScore(null);
  };

  const handleOptionClick = (optionId: number) => {
    if (showResult !== null) return; // 如果正在显示结果，不允许选择

    if (selectedOptions.includes(optionId)) {
      setSelectedOptions(selectedOptions.filter(id => id !== optionId));
    } else if (selectedOptions.length < 2) {
      const newSelected = [...selectedOptions, optionId];
      setSelectedOptions(newSelected);
      
      if (newSelected.length === 2) {
        checkAnswer(newSelected);
      }
    }
  };

  const checkAnswer = (selected: number[]) => {
    const selectedSum = selected.reduce((total, id) => {
      const option = currentQuestion.options.find(opt => opt.id === id);
      return total + (option?.count || 0);
    }, 0);

    const isCorrect = selectedSum === currentQuestion.targetCount;
    setShowResult(isCorrect ? 'correct' : 'wrong');

    if (isCorrect) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      
      setPlayers(prevPlayers => {
        const sortedPlayers = [...prevPlayers].sort((a, b) => b.score - a.score);
        const currentRank = sortedPlayers.findIndex(p => p.id === 1) + 1;
        
        let scoreToAdd = 10; // 前三名加10分
        if (currentRank === 4) scoreToAdd = 6;
        else if (currentRank === 5) scoreToAdd = 5;
        else if (currentRank >= 6) scoreToAdd = 4;

        const newScore = Math.min(100, players[0].score + scoreToAdd);
        setCurrentScore(scoreToAdd);
        setTimeout(() => setCurrentScore(null), 2000);

        return prevPlayers.map(player =>
          player.id === 1
            ? {
                ...player,
                score: newScore,
                progress: newScore,
                answerTime: Date.now() - startTime
              }
            : player
        );
      });

      setAnsweredPlayers(prev => [...prev, 1]);
      setWaitingForOthers(true);
    } else {
      setStreak(0);
      setTimeout(() => {
        setSelectedOptions([]);
        setShowResult(null);
      }, 1000);
    }
  };

  const generateNewQuestion = () => {
    // 从题库中随机选择一题，但不要选到当前的题
    let nextQuestion: Question;
    do {
      nextQuestion = questionBank[Math.floor(Math.random() * questionBank.length)];
    } while (nextQuestion.title === currentQuestion.title);
    
    // 确保至少存在两个选项的组合等于目标数量
    let validOptions = false;
    let newOptions: Array<{ id: number; count: number; image: string }>;
    let newTarget: number;
    
    do {
      // 随机调整目标数量（4-12之间）
      newTarget = Math.floor(Math.random() * 9) + 4;
      
      // 生成三个选项，确保至少存在两个选项的组合等于目标数量
      newOptions = [];
      const optionCounts: number[] = [];
      
      // 生成第一个选项（1-7之间）
      const firstCount = Math.floor(Math.random() * 7) + 1;
      optionCounts.push(firstCount);
      
      // 生成第二个选项，确保与第一个选项的组合可能等于目标数量
      const secondCount = Math.floor(Math.random() * 7) + 1;
      optionCounts.push(secondCount);
      
      // 生成第三个选项，确保至少存在两个选项的组合等于目标数量
      let thirdCount: number;
      if (firstCount + secondCount === newTarget) {
        // 如果前两个选项之和等于目标，第三个选项可以任意
        thirdCount = Math.floor(Math.random() * 7) + 1;
      } else {
        // 否则，第三个选项必须与前两个选项之一的和等于目标
        thirdCount = newTarget - (Math.random() > 0.5 ? firstCount : secondCount);
        // 确保第三个选项在合理范围内
        thirdCount = Math.max(1, Math.min(7, thirdCount));
      }
      optionCounts.push(thirdCount);
      
      // 检查是否至少存在两个选项的组合等于目标数量
      validOptions = optionCounts.some((count, i) => 
        optionCounts.some((otherCount, j) => 
          i !== j && count + otherCount === newTarget
        )
      );
      
      // 创建选项对象
      newOptions = optionCounts.map((count, index) => ({
        id: index + 1,
        count: count,
        image: nextQuestion.options[index].image
      }));
    } while (!validOptions);
    
    setCurrentQuestion({
      ...nextQuestion,
      targetCount: newTarget,
      options: newOptions
    });
  };

  // 为每个机器人设置答题时间
  useEffect(() => {
    if (gameState !== 'playing') return;

    Object.values(botTimers).forEach(timer => {
      if (timer) clearTimeout(timer);
    });

    const newBotTimers: { [key: number]: ReturnType<typeof setTimeout> } = {};
    
    const bots = players.filter(player => player.id !== 1);

    bots.forEach(bot => {
      const randomDelay = Math.floor(Math.random() * 2000) + 3000; // 3-5秒随机延迟
      
      newBotTimers[bot.id] = setTimeout(() => {
        setPlayers(prevPlayers => {
          const sortedPlayers = [...prevPlayers].sort((a, b) => b.score - a.score);
          const currentRank = sortedPlayers.findIndex(p => p.id === bot.id) + 1;
          
          let scoreToAdd = 10; // 前三名加10分
          if (currentRank === 4) scoreToAdd = 6;
          else if (currentRank === 5) scoreToAdd = 5;
          else if (currentRank >= 6) scoreToAdd = 4;

          return prevPlayers.map(p =>
            p.id === bot.id
              ? {
                  ...p,
                  score: Math.min(100, p.score + scoreToAdd),
                  progress: Math.min(100, p.score + scoreToAdd),
                  answerTime: Date.now() - startTime
                }
              : p
          );
        });

        setAnsweredPlayers(prev => [...prev, bot.id]);
      }, randomDelay);
    });

    setBotTimers(newBotTimers);

    return () => {
      Object.values(newBotTimers).forEach(timer => clearTimeout(timer));
    };
  }, [currentQuestion, gameState]);

  // 检查是否所有玩家都已答题
  useEffect(() => {
    if (gameState !== 'playing') return;

    const checkAllAnswered = setInterval(() => {
      setAnsweredPlayers(prev => {
        if (prev.length === players.length) {
          clearInterval(checkAllAnswered);
          Object.values(botTimers).forEach(timer => {
            if (timer) clearTimeout(timer);
          });
          setBotTimers({});
          
          // 检查是否有至少三个玩家达到100分
          const winners = players.filter(player => player.score >= 100);
          if (winners.length < 3) {
            setTimeout(() => {
              setAnsweredPlayers([]);
              generateNewQuestion();
              setSelectedOptions([]);
              setShowResult(null);
            }, 1000);
          } else {
            setGameState('finished');
          }
        }
        return prev;
      });
    }, 100);

    return () => {
      clearInterval(checkAllAnswered);
    };
  }, [answeredPlayers.length, gameState, players]);

  // 检查游戏是否结束
  useEffect(() => {
    if (gameState !== 'playing') return;

    const checkGameFinished = () => {
      const winners = players.filter(p => p.score >= 100);
      if (winners.length >= 3) {
        setGameState('finished');
      }
    };

    checkGameFinished();
  }, [players, gameState]);

  return (
    <div className="min-h-screen bg-purple-100">
      <div style={{ display: 'flex', maxWidth: '1200px', margin: '0 auto', padding: '1rem', gap: '2rem' }}>
        {/* 左侧PK区域 */}
        <div style={{ 
          width: '360px', 
          flexShrink: 0, 
          backgroundColor: 'white', 
          borderRadius: '1rem', 
          padding: '1.5rem', 
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <button className="mb-6 text-3xl text-gray-600 hover:text-gray-800 transition-colors">←</button>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">PK排名</h2>
            <span className="text-sm text-gray-500">目标: 100分</span>
          </div>
          {/* 排行榜主体区域 */}
          <div className="flex-1 flex flex-col justify-between">
            <div className="space-y-3">
              {players.map((player, index) => (
                <div key={player.id} className="relative">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <span className="text-sm">
                        {player.id === 1 ? '👨‍💻' : '🤖'}
                      </span>
                      <span className="font-medium text-xs text-gray-700">
                        {player.name.split('x')[0]}
                      </span>
                    </div>
                    <div className="ml-auto text-[10px] text-gray-500">
                      {player.score}分
                    </div>
                  </div>
                  {/* 进度条 - 使用表情符号 */}
                  <div className="mt-1 text-[8px] leading-none tracking-tighter">
                    {Array.from({ length: Math.floor(player.score / 5) }).map((_, i) => (
                      <span key={i}>
                        {player.id === 1 ? '🟦' : '🟩'}
                      </span>
                    ))}
                    {Array.from({ length: 20 - Math.floor(player.score / 5) }).map((_, i) => (
                      <span key={i} className="opacity-20">⬜</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            {/* 底部对战信息 */}
            <div className="mt-6 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm">👨‍💻</span>
                  <span className="text-xs font-medium">我</span>
                </div>
                <span className="text-[10px] text-red-500">VS</span>
                <div className="flex items-center gap-2">
                  {players.slice(1).map(player => (
                    <div key={player.id} className="flex items-center gap-1">
                      <span className="text-sm">🤖</span>
                      <span className="text-xs font-medium">{player.name.split('x')[0]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 右侧答题区域 */}
        <div style={{ flex: 1, backgroundColor: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
          {gameState === 'start' && (
            <div className="flex flex-col items-center justify-center h-full">
              <h2 className="text-3xl font-bold mb-8">数学游戏</h2>
              <p className="text-lg mb-4">第一个达到100分的前三名玩家获胜！</p>
              <button 
                onClick={startGame}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                开始游戏
              </button>
            </div>
          )}

          {gameState === 'finished' && (
            <div className="flex flex-col items-center justify-center h-full">
              <h2 className="text-3xl font-bold mb-8">游戏结束</h2>
              <div className="mb-8">
                {players
                  .filter(p => p.score >= 100)
                  .sort((a, b) => (a.answerTime || 0) - (b.answerTime || 0))
                  .slice(0, 3)
                  .map((player, index) => (
                    <div key={player.id} className="flex items-center gap-4 mb-4">
                      <span className="text-2xl">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                      </span>
                      <span className="text-xl font-medium">{player.name}</span>
                      <span className="text-xl text-gray-600">{player.score}分</span>
                      <span className="text-sm text-gray-500">
                        {Math.floor((player.answerTime || 0) / 1000)}秒
                      </span>
                    </div>
                  ))}
              </div>
              <button 
                onClick={resetGame}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                再来一局
              </button>
            </div>
          )}

          {gameState === 'playing' && (
            <>
              <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold">{currentQuestion.title}</h2>
                  <div className="flex items-center gap-3">
                    {streak > 1 && (
                      <span style={{ 
                        backgroundColor: '#fef3c7', 
                        color: '#92400e',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '9999px',
                        fontSize: '0.875rem',
                        fontWeight: '500'
                      }}>
                        连续答对 {streak}
                      </span>
                    )}
                    <span style={{ 
                      backgroundColor: '#fff7ed', 
                      color: '#9a3412',
                      padding: '0.25rem 1rem',
                      borderRadius: '9999px',
                      fontSize: '0.875rem',
                      fontWeight: '500'
                    }}>
                      {currentQuestion.difficulty}
                    </span>
                  </div>
                </div>
                <p style={{ color: '#4b5563' }}>{currentQuestion.description}</p>
              </div>

              {/* 题目展示区 */}
              <div className="mb-10">
                <div style={{ 
                  display: 'flex', 
                  gap: '0.75rem', 
                  flexWrap: 'wrap', 
                  padding: '1.5rem', 
                  backgroundColor: showResult === 'correct' ? '#f0fdf4' : showResult === 'wrong' ? '#fef2f2' : '#f9fafb',
                  borderRadius: '0.75rem',
                  transition: 'background-color 0.3s'
                }}>
                  {Array(currentQuestion.targetCount).fill('🦊').map((emoji, i) => (
                    <span key={i} style={{ fontSize: '2rem' }}>{emoji}</span>
                  ))}
                </div>
                {currentScore !== null && (
                  <div style={{ 
                    color: '#059669',
                    fontSize: '1.875rem',
                    marginTop: '1rem',
                    fontWeight: '700',
                    textAlign: 'center',
                    transition: 'color 0.3s'
                  }}>
                    +{currentScore}
                  </div>
                )}
              </div>

              {/* 答题区 */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                {currentQuestion.options.map(option => (
                  <button
                    key={option.id}
                    onClick={() => handleOptionClick(option.id)}
                    disabled={showResult !== null}
                    style={{
                      padding: '1.5rem',
                      border: '2px solid',
                      borderColor: selectedOptions.includes(option.id) ? '#22c55e' : '#e5e7eb',
                      borderRadius: '0.75rem',
                      backgroundColor: selectedOptions.includes(option.id) ? '#f0fdf4' : 'white',
                      transition: 'all 0.2s',
                      cursor: showResult !== null ? 'not-allowed' : 'pointer',
                      opacity: showResult !== null ? 0.7 : 1
                    }}
                  >
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                      {Array(option.count).fill(option.image).map((emoji, i) => (
                        <span key={i} style={{ fontSize: '1.875rem' }}>{emoji}</span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App 