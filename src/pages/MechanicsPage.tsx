import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import MicroElementMethod from '../components/mechanics-demos/MicroElementMethod';
import VariableAccelerationMethod from '../components/mechanics-demos/VariableAccelerationMethod';

// 子功能类型定义
type SubFunction = {
  id: number;
  name: string;
  component: React.ComponentType;
  description: string;
  principle: string;
  formula?: string;
};

export default function MechanicsPage() {
  const navigate = useNavigate();
  const [selectedFunction, setSelectedFunction] = useState<number>(1);
  
   // 子功能配置
  const subFunctions: SubFunction[] = [
    {
      id: 1,
      name: '微元法推导匀变速位移公式',
      component: MicroElementMethod,
      description: '通过可视化的方式展示如何用微元法推导匀变速直线运动的位移公式',
      principle: '将速度-时间曲线下的面积分割成许多小矩形，累加后近似得到位移，当微元趋近于无穷小时，近似值趋近于精确值',
      formula: 's = v₀t + ½at²'
    },
    {
      id: 2,
      name: '微元法推导变加速（加速度均匀减小）位移公式',
      component: VariableAccelerationMethod,
      description: '通过可视化的方式展示如何用微元法推导加速度均匀减小的变加速直线运动的位移公式',
      principle: '将速度-时间曲线下的面积分割成许多小矩形，累加后近似得到位移。加速度随时间均匀减小，当加速度减为0后，物体做匀速直线运动',
      formula: '当a(t) = a₀ - kt > 0时，s = v₀t + ½a₀t² - (1/6)kt³；当a(t) = 0时，s = 匀速直线运动位移'
    }
  ];
  
  const currentFunction = subFunctions.find(f => f.id === selectedFunction);
  
  const handleBackToTopics = () => {
    navigate('/');
  };
  
  const handleSubFunctionChange = (id: number) => {
    setSelectedFunction(id);
  };
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* 顶部栏 */}
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button 
            onClick={handleBackToTopics}
            className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            <span>回到目录页</span>
          </button>
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">力学基础</h1>
          <div className="w-28"></div> {/* 为了平衡布局 */}
        </div>
      </header>
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* 左侧栏 */}
          <motion.div 
            className="lg:w-1/4 bg-white rounded-xl shadow-sm p-4 h-fit sticky top-24"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-lg font-semibold text-gray-800 mb-4">子功能目录</h2>
            <ul className="space-y-2">
              {subFunctions.map((subFunc) => (
                <li key={subFunc.id}>
                  <button
                    onClick={() => handleSubFunctionChange(subFunc.id)}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-all duration-200
                      ${selectedFunction === subFunc.id 
                        ? 'bg-blue-100 text-blue-700 font-medium' 
                        : 'text-gray-700 hover:bg-gray-100'
                      }`}
                  >
                    {subFunc.id}. {subFunc.name}
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
          
          {/* 主演示区 */}
          <div className="lg:w-3/4">
            <motion.div 
              className="bg-white rounded-xl shadow-sm p-4 mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-xl font-bold text-gray-800 mb-4">{currentFunction?.name}</h2>
              {/* 动态画布区域 */}
              <div className="h-96 md:h-[500px] bg-gray-50 rounded-lg mb-4 overflow-hidden">
                {currentFunction?.component && <currentFunction.component />}
              </div>
            </motion.div>
            
            {/* 底部栏：知识点说明 */}
            <motion.div 
              className="bg-white rounded-xl shadow-sm p-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-3">物理知识点说明</h3>
              <div className="space-y-3 text-gray-700">
                <p><strong>演示目标：</strong>{currentFunction?.description}</p>
                <p><strong>核心原理：</strong>{currentFunction?.principle}</p>
                {currentFunction?.formula && (
                  <p><strong>核心公式：</strong><span className="formula">{currentFunction.formula}</span></p>
                )}
              </div>
            </motion.div>
          </div>
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