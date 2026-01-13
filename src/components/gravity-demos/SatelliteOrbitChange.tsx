import { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';

// 卫星变轨模型组件
export default function SatelliteOrbitChange() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [lowOrbitHeight, setLowOrbitHeight] = useState<number>(300); // 近地轨道高度（km）
  const [boostPower, setBoostPower] = useState<number>(2); // 变轨加速度（倍数）
  const [isPlaying, setIsPlaying] = useState<boolean>(true); // 是否播放
  const [showStepByStep, setShowStepByStep] = useState<boolean>(false); // 是否分步演示
  const [currentStep, setCurrentStep] = useState<number>(0); // 当前步骤
  const [showHeight, setShowHeight] = useState<boolean>(false); // 是否显示轨道高度
  const [showVelocity, setShowVelocity] = useState<boolean>(false); // 是否显示速度数值
  const [showGrid, setShowGrid] = useState<boolean>(true); // 是否显示坐标系网格
  
  // 动画相关 - 使用全局单一角度数据源
  const animationFrameRef = useRef<number>();
  const globalAngleRef = useRef<number>(0); // 全局单一角度数据源，从0开始单调递增
  const lastTimestampRef = useRef<number>(0);
  
  // 3D视角控制相关
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
  
  const rotationRef = useRef(calculateInitialRotation()); // 初始视角
  const scaleRef = useRef(1);
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  
  // 重置参数
  const handleReset = () => {
    setIsPlaying(false);
    setShowStepByStep(false);
    setCurrentStep(0);
    setShowHeight(false);
    setShowVelocity(false);
    setShowGrid(true);
    globalAngleRef.current = 0; // 重置全局角度
    rotationRef.current = calculateInitialRotation(); // 重置到初始视角
    scaleRef.current = 1;
  };
  
   // 下一步 - 按阶段推进
   const handleNextStep = () => {
     if (currentStep < 4) {
       setCurrentStep(currentStep + 1);
       // 根据阶段设置全局角度
       switch (currentStep + 1) {
         case 1: // 转移轨道
           globalAngleRef.current = 2 * Math.PI;
           break;
         case 2: // 同步轨道
           globalAngleRef.current = 3 * Math.PI;
           break;
         case 3: // 返回转移轨道
           globalAngleRef.current = 5 * Math.PI;
           break;
         case 4: // 返回近地轨道
           globalAngleRef.current = 6 * Math.PI;
           break;
       }
     } else {
       // 完成一个完整循环后回到初始状态
       setCurrentStep(0);
       globalAngleRef.current = 0;
     }
   };
  
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
  
  // 绘制坐标系网格
  const drawGrid = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
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
    ctx.lineWidth = 1;
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
    ctx.lineWidth = 1;
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
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(z1.x, z1.y);
    ctx.lineTo(z2.x, z2.y);
    ctx.stroke();
    
    // Z轴标签
    ctx.fillStyle = 'rgba(0, 0, 255, 0.7)';
    ctx.fillText('Z', z2.x + 5, z2.y + 5);
  }, [project, showGrid]);
  
  // 绘制宇宙飞船
  const drawSpaceship = (ctx: CanvasRenderingContext2D, x: number, y: number, rotation: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation); // 旋转飞船使其指向速度方向
    
    // 使用fontawesome图标，我们可以绘制一个简单的飞船形状
    ctx.fillStyle = '#32CD32';
    ctx.strokeStyle = '#228B22';
    ctx.lineWidth = 1;
    
    // 绘制飞船主体
    ctx.beginPath();
    ctx.moveTo(0, -5);    // 顶部
    ctx.lineTo(10, 0);    // 右中部
    ctx.lineTo(5, 5);     // 右底部
    ctx.lineTo(-5, 5);    // 左底部
    ctx.lineTo(-10, 0);   // 左中部
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // 绘制飞船窗口
    ctx.fillStyle = '#1E90FF';
    ctx.beginPath();
    ctx.arc(0, 0, 2, 0, 2 * Math.PI);
    ctx.fill();
    
    // 绘制飞船喷射火焰
    ctx.fillStyle = '#FF6347';
    ctx.beginPath();
    ctx.moveTo(-5, 5);
    ctx.lineTo(-2, 12);
    ctx.lineTo(2, 12);
    ctx.lineTo(5, 5);
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
  };
  
  // 绘制卫星变轨
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // 地球参数
    const earthRadius = 6371; // 地球平均半径(km)
    
     // 计算各轨道参数
    const calculateOrbitParams = () => {
      // 近地轨道参数 - 缩小为原来的0.002倍
      const lowOrbitRadius = earthRadius + lowOrbitHeight;
      const scaledLowOrbitRadius = lowOrbitRadius * 0.002; // 再缩小10倍
      
      // 同步轨道参数（固定高度35786km）- 缩小为原来的0.002倍
      const geoOrbitHeight = 35786;
      const geoOrbitRadius = earthRadius + geoOrbitHeight;
      const scaledGeoOrbitRadius = geoOrbitRadius * 0.002; // 再缩小10倍
      
      // 转移轨道参数（霍曼转移轨道，椭圆）- 缩小为原来的0.002倍
      const transferSemiMajorAxis = (lowOrbitRadius + geoOrbitRadius) / 2;
      const scaledTransferSemiMajorAxis = transferSemiMajorAxis * 0.002; // 再缩小10倍
      const transferEccentricity = (geoOrbitRadius - lowOrbitRadius) / (geoOrbitRadius + lowOrbitRadius);
      
      // 计算速度
      const G = 6.67430e-11; // 引力常数
      const M = 5.972e24; // 地球质量(kg)
      
      // 近地轨道速度
      const lowOrbitVelocity = Math.sqrt(G * M / lowOrbitRadius);
      
      // 同步轨道速度
      const geoOrbitVelocity = Math.sqrt(G * M / geoOrbitRadius);
      
      // 转移轨道近地点速度
      const transferPerigeeVelocity = Math.sqrt(G * M * (2/lowOrbitRadius - 1/transferSemiMajorAxis));
      
      // 转移轨道远地点速度
      const transferApogeeVelocity = Math.sqrt(G * M * (2/geoOrbitRadius - 1/transferSemiMajorAxis));
      
      return {
        lowOrbitRadius: scaledLowOrbitRadius,
        geoOrbitRadius: scaledGeoOrbitRadius,
        transferSemiMajorAxis: scaledTransferSemiMajorAxis,
        transferEccentricity,
        lowOrbitVelocity,
        geoOrbitVelocity,
        transferPerigeeVelocity,
        transferApogeeVelocity,
        originalLowOrbitRadius: lowOrbitRadius, // 保存原始值用于显示
        originalGeoOrbitRadius: geoOrbitRadius
      };
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
      drawGrid(ctx, canvas);
      
      // 获取轨道参数
      const {
        lowOrbitRadius,
        geoOrbitRadius,
        transferSemiMajorAxis,
        transferEccentricity,
        lowOrbitVelocity,
        geoOrbitVelocity,
        transferPerigeeVelocity,
        transferApogeeVelocity,
        originalLowOrbitRadius,
        originalGeoOrbitRadius
      } = calculateOrbitParams();
      
      // 重新计算scale，确保大圆轨道能完整显示且视距固定
      const maxOrbitRadius = geoOrbitRadius;
      // 使用固定比例，确保大圆轨道完整显示且留有适当边距
      const baseScale = Math.min(canvas.width, canvas.height) * 0.4 / maxOrbitRadius;
      const finalScale = baseScale * scaleRef.current; // 结合用户控制的缩放
      
      // 创建渲染对象数组
      const renderObjects: RenderObject[] = [];
      
      // 地球在3D空间中的位置
      const earthX = 0;
      const earthY = 0;
      const earthZ = 0;
      
       // 地球半径
       const earthRadius3D = earthRadius * 0.001; // 
      const earthCanvasRadius = earthRadius3D * finalScale * 0.8; // 再次缩小，使其比椭圆轨道内切圆小
      
      // 获取地球的投影信息
      const earthProjection = getSphereProjection(earthX, earthY, earthZ, earthRadius3D, centerX, centerY);
      
      // 添加地球到渲染队列
      renderObjects.push({
        x: earthX,
        y: earthY,
        z: earthZ,
        radius: earthRadius3D,
        fillColor: '#4682B4',
        strokeColor: '#1E3A8A',
        zIndex: earthProjection.z,
        type: 'earth',
        render: () => {
          // 创建径向渐变来模拟3D效果
          const gradient = ctx.createRadialGradient(
            earthProjection.x - earthCanvasRadius * 0.3, 
            earthProjection.y - earthCanvasRadius * 0.3, 
            earthCanvasRadius * 0.1,
            earthProjection.x, 
            earthProjection.y, 
            earthCanvasRadius
          );
          gradient.addColorStop(0, '#87CEEB');
          gradient.addColorStop(0.5, '#4682B4');
          gradient.addColorStop(1, '#1E3A8A');
          
          // 绘制球体
          ctx.beginPath();
          ctx.arc(earthProjection.x, earthProjection.y, earthCanvasRadius, 0, 2 * Math.PI);
          ctx.fillStyle = gradient;
          ctx.fill();
          ctx.strokeStyle = '#1E3A8A';
          ctx.lineWidth = 1; // 同时减小边框宽度
          ctx.stroke();
          
           // 绘制地球名称
          ctx.font = '14px Arial';
          ctx.textAlign = 'center';
          ctx.fillStyle = '#FFFFFF';
          ctx.fillText('地球', earthProjection.x, earthProjection.y - earthCanvasRadius - 10);
        }
      });
      
       // 绘制近地轨道
      ctx.beginPath();
      for (let i = 0; i <= 2 * Math.PI; i += 0.01) {
        const x = earthX + lowOrbitRadius * Math.cos(i);
        const y = earthY + lowOrbitRadius * Math.sin(i);
        const z = 0; // 确保轨道严格在XY平面上
        const projected = project(x, y, z, centerX, centerY);
        
        if (i === 0) {
          ctx.moveTo(projected.x, projected.y);
        } else {
          ctx.lineTo(projected.x, projected.y);
        }
      }
      ctx.strokeStyle = 'rgba(100, 149, 237, 0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // 绘制同步轨道（大圆轨道）- 确保严格在XY平面内
      ctx.beginPath();
      for (let i = 0; i <= 2 * Math.PI; i += 0.01) {
        const x = earthX + geoOrbitRadius * Math.cos(i);
        const y = earthY + geoOrbitRadius * Math.sin(i);
        const z = 0; // 确保大圆轨道严格在XY平面上
        const projected = project(x, y, z, centerX, centerY);
        
        if (i === 0) {
          ctx.moveTo(projected.x, projected.y);
        } else {
          ctx.lineTo(projected.x, projected.y);
        }
      }
      ctx.strokeStyle = 'rgba(100, 149, 237, 0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // 绘制转移轨道（椭圆）- 确保严格在XY平面内
      const transferSemiMinorAxis = transferSemiMajorAxis * Math.sqrt(1 - transferEccentricity * transferEccentricity);
      
      // 计算椭圆中心偏移 - 确保地球在右焦点，椭圆中心在左侧
      const focusDistance = transferEccentricity * transferSemiMajorAxis;
      const ellipseCenterX = earthX - focusDistance; // 椭圆中心相对于地球中心的偏移
      
      ctx.beginPath();
      for (let i = 0; i <= 2 * Math.PI; i += 0.01) {
        const x = ellipseCenterX + transferSemiMajorAxis * Math.cos(i);
        const y = earthY + transferSemiMinorAxis * Math.sin(i);
        const z = 0; // 确保转移轨道严格在XY平面上
        const projected = project(x, y, z, centerX, centerY);
        
        if (i === 0) {
          ctx.moveTo(projected.x, projected.y);
        } else {
          ctx.lineTo(projected.x, projected.y);
        }
      }
      ctx.strokeStyle = 'rgba(255, 99, 71, 0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // 绘制变轨点
      // 近地点变轨（低轨道到转移轨道）- 确保在XY平面内
      const perigeeX = earthX + lowOrbitRadius;
      const perigeeY = earthY;
      const perigeeZ = 0; // 确保在XY平面上
      
      // 远地点变轨（转移轨道到同步轨道）- 确保在XY平面内
      const apogeeX = earthX - geoOrbitRadius;
      const apogeeY = earthY;
      const apogeeZ = 0; // 确保在XY平面上
      
      // 获取变轨点投影
      const perigeeProjection = project(perigeeX, perigeeY, perigeeZ, centerX, centerY);
      const apogeeProjection = project(apogeeX, apogeeY, apogeeZ, centerX, centerY);
      
      // 近地点变轨标注
      renderObjects.push({
        x: perigeeX,
        y: perigeeY,
        z: perigeeZ,
        radius: 0,
        fillColor: '',
        strokeColor: '',
        zIndex: perigeeProjection.z,
        type: 'perigee',
        render: () => {
          ctx.beginPath();
          ctx.arc(perigeeProjection.x, perigeeProjection.y, 2, 0, 2 * Math.PI);
          ctx.fillStyle = '#FF6347';
          ctx.fill();
           ctx.font = '12px Arial';
          ctx.textAlign = 'left';
          ctx.fillStyle = '#FFFFFF';
          ctx.fillText('近地点', perigeeProjection.x + 10, perigeeProjection.y - 5);
        }
      });
      
      // 远地点变轨标注
      renderObjects.push({
        x: apogeeX,
        y: apogeeY,
        z: apogeeZ,
        radius: 0,
        fillColor: '',
        strokeColor: '',
        zIndex: apogeeProjection.z,
        type: 'apogee',
        render: () => {
          ctx.beginPath();
          ctx.arc(apogeeProjection.x, apogeeProjection.y, 2, 0, 2 * Math.PI);
          ctx.fillStyle = '#FF6347';
          ctx.fill();
           ctx.textAlign = 'right';
          ctx.fillStyle = '#FFFFFF';
          ctx.fillText('远地点', apogeeProjection.x - 10, apogeeProjection.y - 5);
        }
      });
      
      // 计算卫星位置 - 使用全局单一角度数据源
      let satelliteX = earthX + lowOrbitRadius;
      let satelliteY = earthY;
      let satelliteZ = 0;
      let currentVelocity = lowOrbitVelocity;
      let velocityDirection = Math.PI / 2;
      
  // 确保速度方向始终保持逆时针旋转
  const calculateEllipticVelocityDirection = (x: number, y: number, a: number, e: number) => {
    // 计算到焦点的距离向量
    const dx = x - earthX;
    const dy = y - earthY;
    
    // 计算位置向量角度
    const posAngle = Math.atan2(dy, dx);
    
    // 关键修复：无论在椭圆轨道的什么位置，始终保持逆时针方向
    // 速度方向垂直于位置向量并固定为逆时针方向
    let tangentAngle = posAngle + Math.PI / 2;
    
    // 确保角度在0到2π之间，防止溢出导致的方向计算错误
    tangentAngle = ((tangentAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    
    return tangentAngle;
  };
      
       // 根据全局角度确定当前阶段
      if (showStepByStep) {
        // 分步演示模式
        if (isPlaying) {
        // 根据当前步骤调整角度增量速度，确保符合开普勒第二定律
        let angleIncrement = 0;
        switch (currentStep) {
          case 0: // 近地轨道：最快
            angleIncrement = 0.03; // 提高3倍
            break;
          case 1: // 转移轨道：先快后慢
            angleIncrement = 0.015 - (0.01 * (globalAngleRef.current - 2 * Math.PI)) / Math.PI;
            if (angleIncrement < 0.005) angleIncrement = 0.005;
            break;
          case 2: // 同步轨道：最慢
            angleIncrement = 0.004; // 保持最慢速度
            break;
          case 3: // 返回转移轨道：先慢后快
            angleIncrement = 0.005 + (0.01 * (globalAngleRef.current - 5 * Math.PI)) / Math.PI;
            if (angleIncrement > 0.015) angleIncrement = 0.015;
            break;
          case 4: // 返回近地轨道：最快
            angleIncrement = 0.03; // 提高3倍
            break;
        }
          globalAngleRef.current += angleIncrement;
        }
       } else {
      // 连续动画模式 - 全局角度持续递增，但根据轨道位置调整角速度以符合开普勒第二定律
      if (isPlaying) {
        let angleIncrement = 0.01; // 基础角度增量
        
        // 根据当前轨道阶段调整角速度
        if (globalAngleRef.current < 2 * Math.PI) {
          // 近地轨道：应该最快，增加1.5倍速度
          angleIncrement = 0.015;
        } else if (globalAngleRef.current < 3 * Math.PI) {
          // 转移轨道：根据位置动态调整速度
          const mappedAngle = globalAngleRef.current - 2 * Math.PI;
          // 计算到地球的距离
          const r = Math.sqrt(
            Math.pow(ellipseCenterX + transferSemiMajorAxis * Math.cos(mappedAngle), 2) + 
            Math.pow(transferSemiMinorAxis * Math.sin(mappedAngle), 2)
          );
          // 基于距离调整角速度，距离越近速度越快
          const maxSpeed = 0.015; // 近地点最大速度
          const minSpeed = 0.005; // 远地点最小速度
          angleIncrement = maxSpeed - (maxSpeed - minSpeed) * (r - lowOrbitRadius) / (geoOrbitRadius - lowOrbitRadius);
        } else if (globalAngleRef.current < 5 * Math.PI) {
          // 同步轨道：应该最慢，降低0.5倍速度
          angleIncrement = 0.005;
        } else if (globalAngleRef.current < 6 * Math.PI) {
          // 返回转移轨道：同样根据位置动态调整速度
          const mappedAngle = 3 * Math.PI + (globalAngleRef.current - 5 * Math.PI);
          // 计算到地球的距离
          const r = Math.sqrt(
            Math.pow(ellipseCenterX + transferSemiMajorAxis * Math.cos(mappedAngle), 2) + 
            Math.pow(transferSemiMinorAxis * Math.sin(mappedAngle), 2)
          );
          // 基于距离调整角速度，距离越近速度越快
          const maxSpeed = 0.015; // 近地点最大速度
          const minSpeed = 0.005; // 远地点最小速度
          angleIncrement = maxSpeed - (maxSpeed - minSpeed) * (r - lowOrbitRadius) / (geoOrbitRadius - lowOrbitRadius);
        } else if (globalAngleRef.current < 8 * Math.PI) {
          // 返回近地轨道：恢复最快速度
          angleIncrement = 0.015;
        }
        
        globalAngleRef.current += angleIncrement;
      }
    }
      
      // 角度阶段精准映射
      if (globalAngleRef.current < 2 * Math.PI) {
        // 近地轨道：0→2π（转一圈）
        satelliteX = earthX + lowOrbitRadius * Math.cos(globalAngleRef.current);
        satelliteY = earthY + lowOrbitRadius * Math.sin(globalAngleRef.current);
        satelliteZ = 0;
        currentVelocity = lowOrbitVelocity;
        velocityDirection = Math.atan2(satelliteY - earthY, satelliteX - earthX) + Math.PI / 2;
        setCurrentStep(0);
      } else if (globalAngleRef.current < 3 * Math.PI) {
        // 转移轨道：2π→3π（近地点→远地点）
        // 使用全局角度的模2π值计算位置
        const mappedAngle = globalAngleRef.current - 2 * Math.PI;
        satelliteX = ellipseCenterX + transferSemiMajorAxis * Math.cos(mappedAngle);
        satelliteY = earthY + transferSemiMinorAxis * Math.sin(mappedAngle);
        satelliteZ = 0;
        
        // 计算到焦点的距离
        const r = Math.sqrt((satelliteX - earthX) * (satelliteX - earthX) + (satelliteY - earthY) * (satelliteY - earthY));
        // 使用面积速度守恒计算速度
        currentVelocity = (transferPerigeeVelocity * lowOrbitRadius) / r;
        
        // 使用精确的椭圆轨道速度方向计算方法
        velocityDirection = calculateEllipticVelocityDirection(satelliteX, satelliteY, transferSemiMajorAxis, transferEccentricity);
        setCurrentStep(1);
      } else if (globalAngleRef.current < 5 * Math.PI) {
        // 同步轨道：3π→5π（远地点转一圈，回到远地点）
        // 从π开始，旋转两圈
        const mappedAngle = Math.PI + (globalAngleRef.current - 3 * Math.PI);
        satelliteX = earthX + geoOrbitRadius * Math.cos(mappedAngle);
        satelliteY = earthY + geoOrbitRadius * Math.sin(mappedAngle);
        satelliteZ = 0;
        currentVelocity = geoOrbitVelocity;
        velocityDirection = Math.atan2(satelliteY - earthY, satelliteX - earthX) + Math.PI / 2;
        setCurrentStep(2);
       } else if (globalAngleRef.current < 6 * Math.PI) {
        // 返回转移轨道：5π→6π（远地点→近地点）
        // 修复：不再使用反向运动，而是使用正常的角度映射，确保方向一致
        const mappedAngle = 3 * Math.PI + (globalAngleRef.current - 5 * Math.PI);
        satelliteX = ellipseCenterX + transferSemiMajorAxis * Math.cos(mappedAngle);
        satelliteY = earthY + transferSemiMinorAxis * Math.sin(mappedAngle);
        satelliteZ = 0;
        
        // 计算到焦点的距离
        const r = Math.sqrt((satelliteX - earthX) * (satelliteX - earthX) + (satelliteY - earthY) * (satelliteY - earthY));
        // 使用面积速度守恒计算速度
        currentVelocity = (transferApogeeVelocity * geoOrbitRadius) / r;
        
        // 使用精确的椭圆轨道速度方向计算方法
        velocityDirection = calculateEllipticVelocityDirection(satelliteX, satelliteY, transferSemiMajorAxis, transferEccentricity);
        setCurrentStep(3);
      } else if (globalAngleRef.current < 8 * Math.PI) {
        // 返回近地轨道：6π→8π（近地轨道转一圈）
        const mappedAngle = globalAngleRef.current - 6 * Math.PI;
        satelliteX = earthX + lowOrbitRadius * Math.cos(mappedAngle);
        satelliteY = earthY + lowOrbitRadius * Math.sin(mappedAngle);
        satelliteZ = 0;
        currentVelocity = lowOrbitVelocity;
        velocityDirection = Math.atan2(satelliteY - earthY, satelliteX - earthX) + Math.PI / 2;
        setCurrentStep(4);
      } else {
        // 完成一个完整循环后重置角度
        globalAngleRef.current = 0;
        setCurrentStep(0);
      }
      
      // 获取卫星投影
      const satelliteProjection = project(satelliteX, satelliteY, satelliteZ, centerX, centerY);
      
      // 添加卫星到渲染队列
      renderObjects.push({
        x: satelliteX,
        y: satelliteY,
        z: satelliteZ,
        radius: 10,
        fillColor: '#32CD32',
        strokeColor: '#228B22',
        zIndex: satelliteProjection.z,
        type: 'satellite',
        render: () => {
          // 绘制宇宙飞船，头部指向速度方向
          drawSpaceship(ctx, satelliteProjection.x, satelliteProjection.y, velocityDirection);
          
          // 绘制卫星名称
           ctx.font = '12px Arial';
          ctx.textAlign = 'center';
          ctx.fillStyle = '#FFFFFF';
          ctx.fillText('宇宙飞船', satelliteProjection.x, satelliteProjection.y - 18);
          
          // 显示速度数值
          if (showVelocity) {
           ctx.font = '11px Arial';
          ctx.fillStyle = '#FFFFFF';
          // 转换为km/s显示
          ctx.fillText(`${(currentVelocity / 1000).toFixed(2)}km/s`, satelliteProjection.x + 20, satelliteProjection.y + 5);
          }
        }
      });
      
      // 显示轨道高度
      if (showHeight) {
        // 近地轨道高度标注
        const lowOrbitHeightLabelPos = project(lowOrbitRadius, 0, 0, centerX, centerY);
        renderObjects.push({
          x: lowOrbitRadius,
          y: 0,
          z: 0,
          radius: 0,
          fillColor: '',
          strokeColor: '',
          zIndex: lowOrbitHeightLabelPos.z,
          type: 'lowOrbitLabel',
          render: () => {
           ctx.font = '11px Arial';
          ctx.fillStyle = '#FFFFFF';
          ctx.fillText(`${lowOrbitHeight}km`, lowOrbitHeightLabelPos.x + 10, lowOrbitHeightLabelPos.y - 20);
          }
        });
        
        // 同步轨道高度标注
        const geoOrbitHeightLabelPos = project(geoOrbitRadius, 0, 0, centerX, centerY);
        renderObjects.push({
          x: geoOrbitRadius,
          y: 0,
          z: 0,
          radius: 0,
          fillColor: '',
          strokeColor: '',
          zIndex: geoOrbitHeightLabelPos.z,
          type: 'geoOrbitLabel',
          render: () => {
           ctx.font = '11px Arial';
          ctx.fillStyle = '#FFFFFF';
          ctx.fillText('35786km', geoOrbitHeightLabelPos.x + 10, geoOrbitHeightLabelPos.y - 20);
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
        
        // 计算时间差，用于更平滑的动画
        const deltaTime = timestamp - lastTimestampRef.current;
        lastTimestampRef.current = timestamp;
        
        // 限制帧率，防止在高性能设备上动画过快
        if (deltaTime > 16) { // 约60fps
          drawScene(timestamp);
        }
        
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
  }, [lowOrbitHeight, boostPower, isPlaying, showStepByStep, showHeight, showVelocity, showGrid, project, drawGrid]);
  
   return (
    <div className="h-full flex flex-col">
       {/* 画布区域 */}
      <div className="flex-1 relative overflow-hidden">
        <canvas ref={canvasRef} className="w-full h-full bg-black"></canvas>
        <div className="absolute bottom-4 left-4 text-xs text-gray-500">
          <p><i className="fas fa-mouse-pointer mr-1"></i> 拖拽旋转视角</p>
          <p><i className="fas fa-search-plus mr-1"></i> 滚轮缩放视图</p>
        </div>
      </div>
      
      {/* 控制面板 */}
      <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 参数调节 */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-700">参数调节</h3>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm text-gray-600">近地轨道高度 (km)</label>
                <span className="text-sm font-medium">{lowOrbitHeight}</span>
              </div>
              <input 
                type="range" 
                min="200" 
                max="500" 
                step="10" 
                value={lowOrbitHeight}
                onChange={(e) => setLowOrbitHeight(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm text-gray-600">变轨加速度</label>
                <span className="text-sm font-medium">{boostPower}x</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="3" 
                step="0.5" 
                value={boostPower}
                onChange={(e) => setBoostPower(parseFloat(e.target.value))}
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
            
            <div className="mt-2 flex items-center space-x-2">
              <input 
                type="checkbox" 
                id="stepByStep" 
                checked={showStepByStep}
                onChange={() => setShowStepByStep(!showStepByStep)}
                className="form-checkbox text-blue-500"
              />
              <label htmlFor="stepByStep" className="text-sm text-gray-600">分步演示</label>
            </div>
            
            {showStepByStep && (
               <motion.button
                 onClick={handleNextStep}
                 className={`px-4 py-2 rounded-lg text-white font-medium ${
                   currentStep >= 4 
                     ? 'bg-gray-400 cursor-not-allowed' 
                     : 'bg-blue-500 hover:bg-blue-600'
                 }`}
                 whileTap={{ scale: 0.95 }}
                 disabled={currentStep >= 4}
               >
                 下一步
               </motion.button>
            )}
            
             {showStepByStep && (
               <div className="text-sm text-gray-600">
                 当前步骤: {
                   currentStep === 0 ? '近地轨道' : 
                   currentStep === 1 ? '转移轨道（近地→同步）' : 
                   currentStep === 2 ? '同步轨道' :
                   currentStep === 3 ? '返回转移轨道（同步→近地）' : '返回近地轨道'
                 }
               </div>
             )}
          </div>
          
          {/* 辅助开关 */}
          <div className="flex flex-col justify-center space-y-4">
            <h3 className="font-medium text-gray-700 text-center">辅助显示</h3>
            
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-600">显示轨道高度</label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={showHeight}
                  onChange={() => setShowHeight(!showHeight)}
                  className="sr-only peer"
                /><div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-600">显示速度数值</label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={showVelocity}
                  onChange={() => setShowVelocity(!showVelocity)}
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