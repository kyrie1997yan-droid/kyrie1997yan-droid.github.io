import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import TransverseLongitudinalWave from '../components/wave-mechanics-demos/TransverseLongitudinalWave';
import WaveSuperposition from '../components/wave-mechanics-demos/WaveSuperposition';

// 子功能类型定义
type SubFunction = {
  id: number;
  name: string;
  component: React.ComponentType;
  description: string;
  principle: string;
  formula?: string;
};

export default function WaveMechanicsPage() {
  const navigate = useNavigate();
  const [selectedFunction, setSelectedFunction] = useState<number>(1);
  
  // 子功能配置
  const subFunctions: SubFunction[] = [
    {
      id: 1,
      name: '横波和纵波的演示',
      component: TransverseLongitudinalWave,
      description: '通过可视化方式展示横波和纵波的运动特点，理解波动的基本概念',
      principle: '横波中质点振动方向与波的传播方向垂直，纵波中质点振动方向与波的传播方向平行',
      formula: ''
    },
    {
      id: 2,
      name: '波的叠加和驻波的形成',
      component: WaveSuperposition,
      description: '展示两个波源产生的波的叠加效果，以及驻波的形成过程',
      principle: '波的叠加原理：多列波在同一介质中传播时，相遇点的位移是各列波单独引起的位移的矢量和。当两列频率相同、振幅相同、传播方向相反的波叠加时，会形成驻波',
      formula: 'y = y₁ + y₂ = A₁sin(ω₁t - k₁x + φ₁) + A₂sin(ω₂t + k₂x + φ₂)'
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
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">波动力学和光学</h1>
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
               <div className="h-96 md:h-[500px] bg-gray-50 rounded-lg mb-4 overflow-y-auto">
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