import { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';

// 椭圆轨道运动组件
export default function EllipticalOrbit() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [eccentricity, setEccentricity] = useState<number>(0.7); // 轨道偏心率（初始设为0.7）
  const [angularVelocity, setAngularVelocity] = useState<number>(0.5); // 运动角速度（初始设为0.5x）
  const [isPlaying, setIsPlaying] = useState<boolean>(true); // 是否播放
  const [showArea, setShowArea] = useState<boolean>(false); // 是否显示面积示意
  const [showPoints, setShowPoints] = useState<boolean>(false); // 是否显示近/远日点标注（默认隐藏）
  const [showFoci, setShowFoci] = useState<boolean>(true); // 是否显示焦点标注
  const [showGrid, setShowGrid] = useState<boolean>(true); // 是否显示坐标系网格
  
  // 动画相关
  const animationFrameRef = useRef<number>();
  const angleRef = useRef<number>(0);
  const lastTimestampRef = useRef<number>(0);
  
   // 3D视角控制相关
  // 根据向量(-2, -1, -0.1)计算初始视角
  const calculateInitialRotation = () => {
    const vx = -0.1;
    const vy = -1;
    const vz = -0.2;
    
    // 计算绕X轴的旋转角度（pitch）
    const pitch = Math.atan2(-vy, Math.sqrt(vx * vx + vz * vz));
    
    // 计算绕Y轴的旋转角度（yaw）
    const yaw = Math.atan2(vx, -vz);
    
    return { x: pitch, y: yaw };
  };
  
  const rotationRef = useRef(calculateInitialRotation()); // 初始视角沿着(-2, -1, -1)向量方向
  const scaleRef = useRef(1);
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  
  // 重置参数
  const handleReset = () => {
    setEccentricity(0.7);
    setAngularVelocity(1.0);
    setShowArea(false);
    setShowPoints(false);
    setShowFoci(true);
    setShowGrid(true);
    angleRef.current = 0;
    rotationRef.current = calculateInitialRotation(); // 重置到初始视角
    scaleRef.current = 1;
  };

// ========== 新增：自动微调参数触发重绘，解决初始模糊 ==========
useEffect(() => {
  // 延迟100ms执行，确保DOM布局完全稳定
  const timer = setTimeout(() => {
    // 微扰偏心率：先改0.1，触发重绘
    setEccentricity(prev => prev - 0.1);
    // 立刻恢复原值，用户无感知
    setTimeout(() => setEccentricity(prev => prev + 0.1), 0);
  }, 100);

  // 组件卸载时清除定时器，避免内存泄漏
  return () => clearTimeout(timer);
}, []); // 空依赖：仅组件挂载时执行一次
// ========== 新增结束 ==========
	
   // 3D变换函数
  const project = useCallback((x: number, y: number, z: number, centerX: number, centerY: number) => {
    // 应用旋转变换
    const cosX = Math.cos(rotationRef.current.x);
    const sinX = Math.sin(rotationRef.current.x);
    const cosY = Math.cos(rotationRef.current.y);
    const sinY = Math.sin(rotationRef.current.y);
    
    // 先绕X轴旋转
    let yRot = y * cosX - z * sinX;
    let zRot = y * sinX + z * cosX;
    
    // 再绕Y轴旋转
    let xRot = x * cosY + zRot * sinY;
    zRot = -x * sinY + zRot * cosY;
    
    // 应用缩放
    xRot *= scaleRef.current;
    yRot *= scaleRef.current;
    
    // 添加透视效果
    const perspective = 1 / (0.8 - zRot * 0.001);
    
    // 投影到2D屏幕
    return {
      x: centerX + xRot * perspective,
      y: centerY + yRot * perspective,
      z: zRot
    };
  }, []);
  
  // 绘制椭圆轨道
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // 绘制坐标系网格
    const drawGrid = () => {
      if (!showGrid || !canvas || !ctx) return;
      
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const gridSize = 30;
      const gridExtent = 10; // 网格延伸范围
      
      ctx.strokeStyle = 'rgba(200, 200, 200, 0.3)';
      ctx.lineWidth = 1;
      
      // 绘制X轴和Y轴网格
      for (let i = -gridExtent; i <= gridExtent; i++) {
        // X轴平行线
        const y = i * gridSize;
        const p1 = project(-gridExtent * gridSize, y, 0, centerX, centerY);
        const p2 = project(gridExtent * gridSize, y, 0, centerX, centerY);
        
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
        
        // Y轴平行线
        const x = i * gridSize;
        const p3 = project(x, -gridExtent * gridSize, 0, centerX, centerY);
        const p4 = project(x, gridExtent * gridSize, 0, centerX, centerY);
        
        ctx.beginPath();
        ctx.moveTo(p3.x, p3.y);
        ctx.lineTo(p4.x, p4.y);
        ctx.stroke();
      }
      
      // 绘制坐标轴
      const axisLength = gridExtent * gridSize * 0.7;
      
       // X轴（红色）
      const x1 = project(-axisLength, 0, 0, centerX, centerY);
      const x2 = project(axisLength, 0, 0, centerX, centerY);
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.7)';
      ctx.lineWidth = 1; // 线条变细
      ctx.beginPath();
      ctx.moveTo(x1.x, x1.y);
      ctx.lineTo(x2.x, x2.y);
      ctx.stroke();
      
      // X轴标签
      ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('X', x2.x, x2.y - 5);
      
       // Y轴（绿色）
      const y1 = project(0, -axisLength, 0, centerX, centerY);
      const y2 = project(0, axisLength, 0, centerX, centerY);
      ctx.strokeStyle = 'rgba(0, 255, 0, 0.7)';
      ctx.lineWidth = 1; // 线条变细
      ctx.beginPath();
      ctx.moveTo(y1.x, y1.y);
      ctx.lineTo(y2.x, y2.y);
      ctx.stroke();
      
      // Y轴标签
      ctx.fillStyle = 'rgba(0, 255, 0, 0.7)';
      ctx.fillText('Y', y2.x - 5, y2.y);
      
       // Z轴（蓝色）
      const z1 = project(0, 0, -axisLength, centerX, centerY);
      const z2 = project(0, 0, axisLength, centerX, centerY);
      ctx.strokeStyle = 'rgba(0, 0, 255, 0.7)';
      ctx.lineWidth = 1; // 线条变细
      ctx.beginPath();
      ctx.moveTo(z1.x, z1.y);
      ctx.lineTo(z2.x, z2.y);
      ctx.stroke();
      
      // Z轴标签
      ctx.fillStyle = 'rgba(0, 0, 255, 0.7)';
      ctx.fillText('Z', z2.x + 5, z2.y + 5);
    };
    
    // 辅助函数：调整颜色亮度
    const shadeColor = (color: string, percent: number) => {
      let R = parseInt(color.substring(1, 3), 16);
      let G = parseInt(color.substring(3, 5), 16);
      let B = parseInt(color.substring(5, 7), 16);
      
      R = Math.floor(R * (100 + percent) / 100);
      G = Math.floor(G * (100 + percent) / 100);
      B = Math.floor(B * (100 + percent) / 100);
      
      R = (R < 255) ? R : 255;
      G = (G < 255) ? G : 255;
      B = (B < 255) ? B : 255;
      
      R = (R > 0) ? R : 0;
      G = (G > 0) ? G : 0;
      B = (B > 0) ? B : 0;
      
      return "#" + 
        (0x1000000 + R * 0x10000 + G * 0x100 + B)
          .toString(16)
          .slice(1);
    };
    
    // 渲染对象接口
    interface RenderObject {
      x: number;
      y: number;
      z: number;
      radius: number;
      fillColor: string;
      strokeColor: string;
      render: () => void;
      zIndex: number;
      type: string; // 用于标识对象类型
    }
    
    // 绘制3D球体并返回投影位置
    const getSphereProjection = (x: number, y: number, z: number, radius: number, centerX: number, centerY: number) => {
      // 计算球体在屏幕上的位置
      const pos = project(x, y, z, centerX, centerY);
      
      return {
        x: pos.x,
        y: pos.y,
        z: pos.z,
        radius: radius
      };
    };
    
      // 星星数据结构
    interface Star {
      x: number;
      y: number;
      size: number;
      baseAlpha: number;
      alpha: number;
      phase: number; // 闪烁相位
      period: number; // 闪烁周期(ms)
      color: string;
    }
    
     // 初始化星星数组
    const starsCount = 300;
    const stars: Star[] = [];
    const colors = ['#FFFFFF', '#E0FFFF', '#FFFFE0']; // 移除鲜艳颜色，使用更柔和的色调
    
    for (let i = 0; i < starsCount; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 1.5 + 0.3, // 减小星星尺寸范围 (0.3-1.8)
        baseAlpha: Math.random() * 0.4 + 0.1, // 降低基础透明度 (0.1-0.5)
        alpha: 0,
        phase: Math.random() * Math.PI * 2, // 随机相位
        period: 1000 + Math.random() * 500, // 1000-1500ms的周期，大约1Hz
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
    
    // 更新星星闪烁状态
    let lastUpdateTime = 0;
    const updateStars = (timestamp: number) => {
      // 控制更新频率，约每16ms更新一次(60fps)
      if (timestamp - lastUpdateTime >= 16) {
        const deltaTime = timestamp - lastUpdateTime;
        lastUpdateTime = timestamp;
        
        for (const star of stars) {
          // 更新相位
          star.phase = (star.phase + (deltaTime / star.period) * Math.PI * 2) % (Math.PI * 2);
          // 使用正弦函数计算当前透明度
          star.alpha = star.baseAlpha * (0.5 + 0.5 * Math.sin(star.phase));
        }
      }
    };
    
    // 绘制星空背景
    const drawStarfield = (timestamp: number) => {
      // 先更新星星状态
      updateStars(timestamp);
      
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // 绘制恒星
      for (const star of stars) {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = star.color;
        ctx.globalAlpha = star.alpha;
        ctx.fill();
        ctx.globalAlpha = 1; // 重置透明度
        
         // 给极少数较亮的星星添加非常微弱的光晕效果
        if (star.alpha > 0.4) {
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size * 1.2, 0, Math.PI * 2);
          ctx.fillStyle = star.color;
          ctx.globalAlpha = star.alpha * 0.15; // 大幅减弱光晕强度
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      }
    };
    
     // 绘制场景
     // 先绘制星空背景，确保星星在最底层
     const drawScene = (currentTimestamp: number) => {
      if (!canvas || !ctx) return;
      
      // 首先清除画布并绘制星空背景，确保星星始终在最底层
      drawStarfield(currentTimestamp);
      
      // 中心点
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      // 绘制坐标系网格
      drawGrid();
      
      // 计算椭圆参数
      const a = Math.min(canvas.width, canvas.height) * 0.4 * scaleRef.current; // 半长轴
      const b = a * Math.sqrt(1 - eccentricity * eccentricity); // 半短轴
      const c = a * eccentricity; // 焦点距离
      
      // 两个焦点位置
      const focus1X = -c; // F1 - 太阳位置（相对于中心）
      const focus1Y = 0;
      const focus1Z = 0;
      const focus2X = c; // F2（相对于中心）
      const focus2Y = 0;
      const focus2Z = 0;
      
    // 绘制椭圆轨道
    ctx.beginPath();
    for (let i = 0; i <= 2 * Math.PI; i += 0.01) {
      const x = a * Math.cos(i);
      const y = b * Math.sin(i);
      const z = 0; // 轨道在XY平面上
      const projected = project(x, y, z, centerX, centerY);
      
      if (i === 0) {
        ctx.moveTo(projected.x, projected.y);
      } else {
        ctx.lineTo(projected.x, projected.y);
      }
    }
     ctx.strokeStyle = 'rgba(100, 149, 237, 0.5)';
     ctx.lineWidth = 1; // 椭圆线条变细
     ctx.stroke();
    
    // 绘制长轴以验证近日点和远日点位置
    const majorAxisStart = project(-a, 0, 0, centerX, centerY);
    const majorAxisEnd = project(a, 0, 0, centerX, centerY);
    ctx.beginPath();
    ctx.moveTo(majorAxisStart.x, majorAxisStart.y);
    ctx.lineTo(majorAxisEnd.x, majorAxisEnd.y);
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.2)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.stroke();
    ctx.setLineDash([]);
      
      // 计算绕行天体位置
      const earthX = a * Math.cos(angleRef.current);
      const earthY = b * Math.sin(angleRef.current);
      const earthZ = 0;
      
      // 绘制面积示意（开普勒第二定律）
      if (showArea) {
        const prevAngle = (angleRef.current - 0.2) % (2 * Math.PI);
        const prevX = a * Math.cos(prevAngle);
        const prevY = b * Math.sin(prevAngle);
        const prevZ = 0;
        
        const f1Projected = project(focus1X, focus1Y, focus1Z, centerX, centerY);
        const earthProjected = project(earthX, earthY, earthZ, centerX, centerY);
        const prevProjected = project(prevX, prevY, prevZ, centerX, centerY);
        
        ctx.beginPath();
        ctx.moveTo(f1Projected.x, f1Projected.y);
        ctx.lineTo(earthProjected.x, earthProjected.y);
        ctx.lineTo(prevProjected.x, prevProjected.y);
        ctx.closePath();
        ctx.fillStyle = 'rgba(100, 149, 237, 0.2)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(100, 149, 237, 0.5)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      
      // 创建渲染对象数组
      const renderObjects: RenderObject[] = [];
      
     // 太阳半径和地球半径（固定地球半径，不再与质量挂钩）
      const sunRadius = 15 * scaleRef.current;
      const earthRadius = 9 * scaleRef.current; // 固定地球半径
      
      // 获取太阳和地球的投影信息
      const sunProjection = getSphereProjection(focus1X, focus1Y, focus1Z, sunRadius, centerX, centerY);
      const earthProjection = getSphereProjection(earthX, earthY, earthZ, earthRadius, centerX, centerY);
      
      // 添加太阳到渲染队列
      renderObjects.push({
        x: focus1X,
        y: focus1Y,
        z: focus1Z,
        radius: sunRadius,
        fillColor: '#FFD700',
        strokeColor: '#FFA500',
        zIndex: sunProjection.z,
        type: 'sun',
        render: () => {
          // 创建径向渐变来模拟3D效果
          const gradient = ctx.createRadialGradient(
            sunProjection.x - sunRadius * 0.3, 
            sunProjection.y - sunRadius * 0.3, 
            sunRadius * 0.1,
            sunProjection.x, 
            sunProjection.y, 
            sunRadius
          );
       // 太阳透明度设为60%
      gradient.addColorStop(0, 'rgba(255, 255, 204, 0.6)');
      gradient.addColorStop(0.5, 'rgba(255, 215, 0, 0.6)');
      gradient.addColorStop(1, 'rgba(255, 165, 0, 0.6)');
          
          // 绘制球体
          ctx.beginPath();
          ctx.arc(sunProjection.x, sunProjection.y, sunRadius, 0, 2 * Math.PI);
          ctx.fillStyle = gradient;
          ctx.fill();
          
          // 添加边框
       ctx.strokeStyle = 'rgba(255, 165, 0, 0.6)'; // 太阳边框也设置为60%透明度
      ctx.lineWidth = 1;
          ctx.stroke();
          
           // 绘制中心天体名称
          ctx.fillStyle = '#FFFFFF';
          ctx.font = '12px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('太阳', sunProjection.x, sunProjection.y - 20);
        }
      });
      
      // 计算地球是否在太阳后面（简化的遮挡检测）
      // 计算地球到太阳的向量
      const dx = earthX - focus1X;
      const dy = earthY - focus1Y;
      const dz = earthZ - focus1Z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
      
      // 如果距离大于太阳半径减去地球半径，且地球在太阳后面，才绘制地球
      // 这是一个简化的遮挡检测，实际应该基于3D变换后的Z坐标和视角
      if (distance > sunRadius || earthProjection.z > sunProjection.z) {
        // 添加地球到渲染队列
        renderObjects.push({
          x: earthX,
          y: earthY,
          z: earthZ,
          radius: earthRadius,
          fillColor: '#4682B4',
          strokeColor: '#1E3A8A',
          zIndex: earthProjection.z,
          type: 'earth',
          render: () => {
            // 创建径向渐变来模拟3D效果
            const gradient = ctx.createRadialGradient(
              earthProjection.x - earthRadius * 0.3, 
              earthProjection.y - earthRadius * 0.3, 
              earthRadius * 0.1,
              earthProjection.x, 
              earthProjection.y, 
              earthRadius
            );
            gradient.addColorStop(0, '#87CEEB');
            gradient.addColorStop(0.5, '#4682B4');
            gradient.addColorStop(1, '#1E3A8A');
            
            // 绘制球体
            ctx.beginPath();
            ctx.arc(earthProjection.x, earthProjection.y, earthRadius, 0, 2 * Math.PI);
            ctx.fillStyle = gradient;
            ctx.fill();
            
            // 添加边框
            ctx.strokeStyle = '#1E3A8A';
            ctx.lineWidth = 1;
            ctx.stroke();
            
           // 绘制绕行天体名称
          ctx.fillStyle = '#FFFFFF';
          ctx.font = '10px Arial';
          ctx.fillText('地球', earthProjection.x, earthProjection.y - earthRadius - 5);
          }
        });
      }
      
      // 如果显示焦点，添加焦点到渲染队列
      if (showFoci) {
        // 左焦点（太阳位置）
        renderObjects.push({
          x: focus1X,
          y: focus1Y,
          z: focus1Z,
             radius: 2.5 * scaleRef.current, // 焦点半径缩小一半
          fillColor: '#FF8C00',
          strokeColor: '#FF8C00',
          zIndex: sunProjection.z + 0.1, // 焦点应该在太阳上方
          type: 'focus1',
          render: () => {
            // 绘制焦点
            ctx.beginPath();
             ctx.arc(sunProjection.x, sunProjection.y, 2.5 * scaleRef.current, 0, 2 * Math.PI); // 焦点半径缩小一半
            ctx.fillStyle = '#FF8C00';
            ctx.fill();
            
             // F1标签 - 使用上标样式，放在焦点右侧x轴上，更靠近原点
            ctx.fillStyle = '#FF8C00'; // 改为橙色，与左焦点颜色一致
            ctx.font = '14px Arial';
            ctx.textAlign = 'right';
            // 使用Unicode上标字符₁来实现真正的上标效果
            ctx.fillText('F₁', sunProjection.x - 10, sunProjection.y); // 移到焦点右侧x轴上，更靠近原点
          }
        });
        
         // 右焦点（改为橙色）
        const focus2Projection = getSphereProjection(focus2X, focus2Y, focus2Z, 5 * scaleRef.current, centerX, centerY);
        renderObjects.push({
          x: focus2X,
          y: focus2Y,
          z: focus2Z,
             radius: 2.5 * scaleRef.current, // 焦点半径缩小一半
          fillColor: '#FF8C00',
          strokeColor: '#FF8C00',
          zIndex: focus2Projection.z,
          type: 'focus2',
          render: () => {
            // 绘制焦点
            ctx.beginPath();
             ctx.arc(focus2Projection.x, focus2Projection.y, 2.5 * scaleRef.current, 0, 2 * Math.PI); // 焦点半径缩小一半
            ctx.fillStyle = '#FF8C00'; // 改为橙色
            ctx.fill();
            
             // F2标签 - 使用上标样式，放在焦点左侧x轴上，更靠近原点
            ctx.fillStyle = '#FF8C00'; // 改为橙色
            ctx.font = '14px Arial';
            ctx.textAlign = 'left';
            // 使用Unicode上标字符₂来实现真正的上标效果
            ctx.fillText('F₂', focus2Projection.x + 10, focus2Projection.y); // 移到焦点左侧x轴上，更靠近原点
          }
        });
      }
      
      // 如果显示近/远日点，添加到渲染队列
      if (showPoints) {
         // 近日点（最靠近焦点F1的点 - 位于椭圆长轴右端点）
        const perihelionX = a - c; // 椭圆右端点
        const perihelionY = 0;
        const perihelionZ = 0;
        
        // 远日点（最远离焦点F1的点 - 位于椭圆长轴左端点）
        const aphelionX = -a - c; // 椭圆左端点
        const aphelionY = 0;
        const aphelionZ = 0;
        
        // 近日点投影
        const periProjection = getSphereProjection(perihelionX, perihelionY, perihelionZ, 4 * scaleRef.current, centerX, centerY);
        renderObjects.push({
          x: perihelionX,
          y: perihelionY,
          z: perihelionZ,
          radius: 4 * scaleRef.current,
          fillColor: '#000000',
          strokeColor: '#000000',
          zIndex: periProjection.z,
          type: 'perihelion',
          render: () => {
            // 绘制近日点
            ctx.beginPath();
            ctx.arc(periProjection.x, periProjection.y, 4 * scaleRef.current, 0, 2 * Math.PI);
            ctx.fillStyle = '#000000';
            ctx.fill();
            
            // 绘制近日点标签
            ctx.fillStyle = '#333';
            ctx.font = '12px Arial';
            ctx.textAlign = 'left';
            ctx.fillText('近日点', periProjection.x + 8, periProjection.y + 4);
          }
        });
        
        // 远日点投影
        const apheProjection = getSphereProjection(aphelionX, aphelionY, aphelionZ, 4 * scaleRef.current, centerX, centerY);
        renderObjects.push({
          x: aphelionX,
          y: aphelionY,
          z: aphelionZ,
          radius: 4 * scaleRef.current,
          fillColor: '#000000',
          strokeColor: '#000000',
          zIndex: apheProjection.z,
          type: 'aphelion',
          render: () => {
            // 绘制远日点
            ctx.beginPath();
            ctx.arc(apheProjection.x, apheProjection.y, 4 * scaleRef.current, 0, 2 * Math.PI);
            ctx.fillStyle = '#000000';
            ctx.fill();
            
            // 绘制远日点标签
            ctx.fillStyle = '#333';
            ctx.font = '12px Arial';
            ctx.textAlign = 'right';
            ctx.fillText('远日点', apheProjection.x - 8, apheProjection.y + 4);
          }
        });
      }
      
      // 按zIndex排序渲染对象（从小到大，远的物体先渲染）
      renderObjects.sort((a, b) => a.zIndex - b.zIndex);
      
      // 执行渲染
      renderObjects.forEach(obj => obj.render());
    };
    
    // 鼠标事件处理 - 拖拽旋转视角
    const handleMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    };
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      
      const deltaX = e.clientX - lastMousePosRef.current.x;
      const deltaY = e.clientY - lastMousePosRef.current.y;
      
      // 更新旋转角度
      rotationRef.current.y += deltaX * 0.005;
      rotationRef.current.x += deltaY * 0.005;
      
      // 限制X轴旋转范围，防止过度翻转
      rotationRef.current.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, rotationRef.current.x));
      
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    };
    
    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };
    
    // 鼠标滚轮缩放
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      scaleRef.current = Math.max(0.5, Math.min(2, scaleRef.current * zoomFactor));
    };
    
    // 设置canvas尺寸
    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      drawScene();
    };
    
    // 动画循环
    const animate = (timestamp: number) => {
      if (!lastTimestampRef.current) {
        lastTimestampRef.current = timestamp;
      }
      
      const deltaTime = timestamp - lastTimestampRef.current;
      lastTimestampRef.current = timestamp;
      
      // 仅在播放状态下更新角度
      if (isPlaying) {
        angleRef.current += (deltaTime * 0.005 * angularVelocity) % (2 * Math.PI);
      }
      
       drawScene(timestamp);
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    // 添加鼠标事件监听器
    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    
    // 初始调整尺寸
    resizeCanvas();
    
    // 监听窗口大小变化
    window.addEventListener('resize', resizeCanvas);
    
    // 启动动画
    animationFrameRef.current = requestAnimationFrame(animate);
    
    // 清理函数
    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('wheel', handleWheel);
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
   }, [eccentricity, angularVelocity, isPlaying, showArea, showPoints, showFoci, showGrid, project]);
  
   return (
    <div className="h-full flex flex-col">
       {/* 画布区域 */}
      <div className="flex-1 relative overflow-hidden">
        <canvas ref={canvasRef} className="w-full h-full bg-black"></canvas>
      </div>
      
      {/* 控制面板 */}
      <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 参数调节 */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-700">参数调节</h3>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm text-gray-600">轨道偏心率</label>
                <span className="text-sm font-medium">{eccentricity.toFixed(2)}</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="0.9" 
                step="0.01" 
                value={eccentricity}
                onChange={(e) => setEccentricity(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm text-gray-600">运动角速度</label>
                <span className="text-sm font-medium">{angularVelocity.toFixed(1)}x</span>
              </div>
              <input 
                type="range" 
                min="0.5" 
                max="2" 
                step="0.1" 
                value={angularVelocity}
                onChange={(e) => setAngularVelocity(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
          
          {/* 操作按钮 */}
          <div className="flex flex-col justify-center items-center space-y-4">
            <h3 className="font-medium text-gray-700 w-full text-center">操作控制</h3>
            
            <div className="flex space-x-3">
              <motion.button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`px-4 py-2 rounded-lg text-white font-medium ${
                  isPlaying ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
                }`}
                whileTap={{ scale: 0.95 }}
              >
                {isPlaying ? <i className="fas fa-pause mr-1"></i> : <i className="fas fa-play mr-1"></i>}
                {isPlaying ? '暂停' : '播放'}
              </motion.button>
              
              <motion.button
                onClick={handleReset}
                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-lg"
                whileTap={{ scale: 0.95 }}
              >
                <i className="fas fa-sync-alt mr-1"></i>
                重置
              </motion.button>
            </div>
            
            <div className="text-xs text-gray-500 mt-2">
              <p><i className="fas fa-mouse-pointer mr-1"></i> 拖拽旋转视角</p>
              <p><i className="fas fa-search-plus mr-1"></i> 滚轮缩放视图</p>
              <p><i className="fas fa-eye mr-1"></i> 调整视角可观察地球被太阳遮挡效果</p>
              <p><i className="fas fa-info-circle mr-1"></i> 两个焦点均为橙色，初始离心率为0.7</p>
            </div>
          </div>
          
          {/* 辅助开关 */}
          <div className="flex flex-col justify-center space-y-4">
            <h3 className="font-medium text-gray-700 text-center">辅助显示</h3>
            
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-600">显示面积示意</label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={showArea}
                  onChange={() => setShowArea(!showArea)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-600">显示焦点标注</label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={showFoci}
                  onChange={() => setShowFoci(!showFoci)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-600">显示坐标系</label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={showGrid}
                  onChange={() => setShowGrid(!showGrid)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}