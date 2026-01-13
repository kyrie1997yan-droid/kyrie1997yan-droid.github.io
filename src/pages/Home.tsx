import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function Home() {
  const navigate = useNavigate();
  
  const handleTopicClick = (topicId: number, isDeveloped: boolean) => {
    if (!isDeveloped) {
      toast.info('该模块暂未开发');
      return;
    }
    
    // 导航到对应的物理模块
     if (topicId === 1) {
      navigate('/mechanics');
    } else if (topicId === 2) {
      navigate('/gravity');
    } else if (topicId === 5) {
      navigate('/wave-mechanics');
    }
  };
  
   const topics = [
    { id: 1, name: '力学基础', isDeveloped: true },
    { id: 2, name: '万有引力与天体运动', isDeveloped: true },
    { id: 3, name: '电磁学', isDeveloped: false },
    { id: 4, name: '热力学和原子物理', isDeveloped: false },
    { id: 5, name: '波动力学和光学', isDeveloped: true }
  ];
  
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-blue-50 to-white">
       {/* 顶部区域 */}
      <header className="py-16 text-center">
        <motion.h1 
          className="text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-800"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          会动的物理
        </motion.h1>
      </header>
      
      {/* 中部区域 */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <motion.div 
          className="max-w-2xl text-center mb-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <p className="text-lg md:text-xl text-gray-700 leading-relaxed">
            会动的物理是闫老师开发的，聚焦高中物理核心知识点的交互式演示平台，通过动态可视化效果，让抽象物理规律变得直观易懂。
          </p>
        </motion.div>
        
        {/* 知识点目录区域 */}
        <motion.div 
          className="max-w-xl w-full mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">高中物理核心知识点演示目录</h2>
          
          <ul className="space-y-4">
            {topics.map((topic, index) => (
              <motion.li 
                key={topic.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
              >
                <button
                  onClick={() => handleTopicClick(topic.id, topic.isDeveloped)}
                  className={`w-full px-6 py-4 text-left rounded-xl transition-all duration-300 flex items-center justify-between
                    ${topic.isDeveloped 
                      ? 'bg-white hover:bg-blue-50 hover:shadow-md text-gray-800 border border-gray-200' 
                      : 'bg-white text-gray-500 border border-gray-200 cursor-not-allowed'
                    }`}
                  disabled={!topic.isDeveloped}
                >
                  <div className="flex items-center">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center mr-4
                      ${topic.isDeveloped ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                      {topic.id}
                    </span>
                    <span className="text-lg">{topic.name}</span>
                  </div>
                  {topic.isDeveloped && (
                    <i className="fas fa-arrow-right text-blue-500"></i>
                  )}
                </button>
              </motion.li>
            ))}
          </ul>
        </motion.div>
      </main>
      
       {/* 底部区域 */}
      <footer className="py-6 text-center text-gray-500 text-sm">
        <p>© 2025 会动的物理 - 高中物理在线演示平台</p>
      </footer>
    </div>
  );
}