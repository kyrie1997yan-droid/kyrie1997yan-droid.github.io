import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function TopicsList() {
  const navigate = useNavigate();
  
  const handleTopicClick = (topicId: number, isDeveloped: boolean) => {
    if (!isDeveloped) {
      toast.info('该模块暂未开发');
      return;
    }
    
    // 目前只有"万有引力与天体运动"可点击
    if (topicId === 2) {
      navigate('/gravity');
    }
  };
  
  const topics = [
    { id: 1, name: '力学基础', isDeveloped: false },
    { id: 2, name: '万有引力与天体运动', isDeveloped: true },
    { id: 3, name: '电磁学', isDeveloped: false },
    { id: 4, name: '热力学', isDeveloped: false },
    { id: 5, name: '光学', isDeveloped: false }
  ];
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="py-12 bg-white shadow-sm">
        <div className="container mx-auto px-4">
          <motion.h1 
            className="text-3xl md:text-4xl font-bold text-center text-gray-800"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            高中物理核心知识点演示目录
          </motion.h1>
        </div>
      </header>
      
      <main className="flex-1 container mx-auto px-4 py-8 md:py-16">
        <div className="max-w-xl mx-auto">
          <motion.ul 
            className="space-y-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {topics.map((topic, index) => (
              <motion.li 
                key={topic.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
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
          </motion.ul>
        </div>
      </main>
      
      <footer className="py-6 bg-white border-t border-gray-200">
        <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
          <p>© 2025 会动的物理 - 高中物理在线演示平台</p>
        </div>
      </footer>
    </div>
  );
}