import { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';

// 双星模型组件
export default function BinaryStarSystem() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [massA, setMassA] = useState<number>(2); // 天体A质量（太阳质量倍数）
  const [massB, setMassB] = useState<number>(1); // 天体B质量（太阳质量倍数）
  const [distance, setDistance] = useState<number>(5); // 两天体间距（AU）
  const [isPlaying, setIsPlaying] = useState<boolean>(true); // 是否播放
  const [orbitType, setOrbitType] = useState<'circular' | 'elliptical'>('circular'); // 轨道类型
  const [showCenter, setShowCenter] = useState<boolean>(true); // 是否显示质心
  const [showRadius, setShowRadius] = useState<boolean>(false); // 是否显示轨道半径标注
  
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
  
  const rotationRef = useRef(calculateInitialRotation()); // 初始视角
  const scaleRef = useRef(1);
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  
  // 重置参数
  const handleReset = () => {
    setMassA(2);
    setMassB(1);
    setDistance(5);
    setOrbitType('circular');
    setShowCenter(true);
    setShowRadius(false);
    angleRef.current = 0;
    rotationRef.current = calculateInitialRotation(); // 重置到初始视角
    scaleRef.current = 1;
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
  }, [project]);
  
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
  
  // 绘制双星系统
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
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
      
      // 计算轨道参数
      const scale = Math.min(canvas.width, canvas.height) * 0.15; // 缩放因子
      const r1 = (massB / (massA + massB)) * distance * scale; // 天体A到质心的距离
      const r2 = (massA / (massA + massB)) * distance * scale; // 天体B到质心的距离
      
      // 质心位置
      const cmX = 0; // 以质心为原点
      const cmY = 0;
      const cmZ = 0;
      
      // 计算天体A和B的位置
      let xA, yA, zA, xB, yB, zB;
      
      if (orbitType === 'circular') {
        // 圆周轨道（在XY平面上）
        xA = cmX + r1 * Math.cos(angleRef.current);
        yA = cmY + r1 * Math.sin(angleRef.current);
        zA = cmZ; // 轨道在XY平面上
        
        xB = cmX - r2 * Math.cos(angleRef.current);
        yB = cmY - r2 * Math.sin(angleRef.current);
        zB = cmZ; // 轨道在XY平面上
      } else {
        // 椭圆轨道（简化版，在XY平面上）
        const eccentricity = 0.3;
        const a1 = r1 / (1 - eccentricity);
        const a2 = r2 / (1 - eccentricity);
        
        xA = cmX + a1 * Math.cos(angleRef.current) * (1 - eccentricity);
        yA = cmY + a1 * Math.sin(angleRef.current);
        zA = cmZ; // 轨道在XY平面上
        
        xB = cmX - a2 * Math.cos(angleRef.current + Math.PI) * (1 - eccentricity);
        yB = cmY - a2 * Math.sin(angleRef.current + Math.PI);
        zB = cmZ; // 轨道在XY平面上
      }
      
      // 绘制轨道
      if (orbitType === 'circular') {
        // 天体A的轨道（圆形）
        ctx.beginPath();
        for (let i = 0; i <= 2 * Math.PI; i += 0.01) {
          const x = cmX + r1 * Math.cos(i);
          const y = cmY + r1 * Math.sin(i);
          const z = cmZ;
          const projected = project(x, y, z, centerX, centerY);
          
          if (i === 0) {
            ctx.moveTo(projected.x, projected.y);
          } else {
            ctx.lineTo(projected.x, projected.y);
          }
        }
        ctx.strokeStyle = 'rgba(255, 165, 0, 0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // 天体B的轨道（圆形）
        ctx.beginPath();
        for (let i = 0; i <= 2 * Math.PI; i += 0.01) {
          const x = cmX - r2 * Math.cos(i);
          const y = cmY - r2 * Math.sin(i);
          const z = cmZ;
          const projected = project(x, y, z, centerX, centerY);
          
          if (i === 0) {
            ctx.moveTo(projected.x, projected.y);
          } else {
            ctx.lineTo(projected.x, projected.y);
          }
        }
        ctx.strokeStyle = 'rgba(135, 206, 250, 0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();
      } else {
        // 椭圆轨道
        const eccentricity = 0.3;
        
        // 天体A的椭圆轨道
        ctx.beginPath();
        const a1 = r1 / (1 - eccentricity);
        for (let i = 0; i <= 2 * Math.PI; i += 0.01) {
          const x = cmX + a1 * Math.cos(i) * (1 - eccentricity);
          const y = cmY + a1 * Math.sin(i);
          const z = cmZ;
          const projected = project(x, y, z, centerX, centerY);
          
          if (i === 0) {
            ctx.moveTo(projected.x, projected.y);
          } else {
            ctx.lineTo(projected.x, projected.y);
          }
        }
        ctx.strokeStyle = 'rgba(255, 165, 0, 0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // 天体B的椭圆轨道
        ctx.beginPath();
        const a2 = r2 / (1 - eccentricity);
        for (let i = 0; i <= 2 * Math.PI; i += 0.01) {
          const x = cmX - a2 * Math.cos(i + Math.PI) * (1 - eccentricity);
          const y = cmY - a2 * Math.sin(i + Math.PI);
          const z = cmZ;
          const projected = project(x, y, z, centerX, centerY);
          
          if (i === 0) {
            ctx.moveTo(projected.x, projected.y);
          } else {
            ctx.lineTo(projected.x, projected.y);
          }
        }
        ctx.strokeStyle = 'rgba(135, 206, 250, 0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      
      // 创建渲染对象数组
      const renderObjects: RenderObject[] = [];
      
      // 天体半径（质量越大，半径越大）
      const radiusA = (10 + Math.min(massA * 3, 15)) * scaleRef.current; // 限制最大半径为25
      const radiusB = (10 + Math.min(massB * 3, 15)) * scaleRef.current; // 限制最大半径为25
      
      // 获取天体A和B的投影信息
      const planetAProjection = getSphereProjection(xA, yA, zA, radiusA, centerX, centerY);
      const planetBProjection = getSphereProjection(xB, yB, zB, radiusB, centerX, centerY);
      
      // 添加天体A到渲染队列
      renderObjects.push({
        x: xA,
        y: yA,
        z: zA,
        radius: radiusA,
        fillColor: '#FFA500',
        strokeColor: '#FF8C00',
        zIndex: planetAProjection.z,
        type: 'planetA',
        render: () => {
          // 创建径向渐变来模拟3D效果
          const gradient = ctx.createRadialGradient(
            planetAProjection.x - radiusA * 0.3, 
            planetAProjection.y - radiusA * 0.3, 
            radiusA * 0.1,
            planetAProjection.x, 
            planetAProjection.y, 
            radiusA
          );
          gradient.addColorStop(0, '#FFD700');
          gradient.addColorStop(0.5, '#FFA500');
          gradient.addColorStop(1, '#FF8C00');
          
          // 绘制球体
          ctx.beginPath();
          ctx.arc(planetAProjection.x, planetAProjection.y, radiusA, 0, 2 * Math.PI);
          ctx.fillStyle = gradient;
          ctx.fill();
          
          // 添加边框
          ctx.strokeStyle = '#FF8C00';
          ctx.lineWidth = 1;
          ctx.stroke();
          
           // 绘制天体A名称和质量
          ctx.fillStyle = '#FFFFFF';
          ctx.font = '12px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(`天体A (${massA}M☉)`, planetAProjection.x, planetAProjection.y - radiusA - 10);
        }
      });
      
      // 添加天体B到渲染队列
      renderObjects.push({
        x: xB,
        y: yB,
        z: zB,
        radius: radiusB,
        fillColor: '#87CEFA',
        strokeColor: '#4682B4',
        zIndex: planetBProjection.z,
        type: 'planetB',
        render: () => {
          // 创建径向渐变来模拟3D效果
          const gradient = ctx.createRadialGradient(
            planetBProjection.x - radiusB * 0.3, 
            planetBProjection.y - radiusB * 0.3, 
            radiusB * 0.1,
            planetBProjection.x, 
            planetBProjection.y, 
            radiusB
          );
          gradient.addColorStop(0, '#E6F3FF');
          gradient.addColorStop(0.5, '#87CEFA');
          gradient.addColorStop(1, '#4682B4');
          
          // 绘制球体
          ctx.beginPath();
          ctx.arc(planetBProjection.x, planetBProjection.y, radiusB, 0, 2 * Math.PI);
          ctx.fillStyle = gradient;
          ctx.fill();
          
          // 添加边框
          ctx.strokeStyle = '#4682B4';
          ctx.lineWidth = 1;
          ctx.stroke();
          
           // 绘制天体B名称和质量
          ctx.fillStyle = '#FFFFFF';
          ctx.font = '12px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(`天体B (${massB}M☉)`, planetBProjection.x, planetBProjection.y - radiusB - 10);
        }
      });
      
      // 质心投影
      const cmProjection = getSphereProjection(cmX, cmY, cmZ, 5 * scaleRef.current, centerX, centerY);
      
      // 绘制质心
      if (showCenter) {
        renderObjects.push({
          x: cmX,
          y: cmY,
          z: cmZ,
          radius: 5 * scaleRef.current,
          fillColor: '#FF6347',
          strokeColor: '#FF6347',
          zIndex: cmProjection.z,
          type: 'center',
          render: () => {
            // 绘制质心
            ctx.beginPath();
            ctx.arc(cmProjection.x, cmProjection.y, 5 * scaleRef.current, 0, 2 * Math.PI);
            ctx.fillStyle = '#FF6347';
            ctx.fill();
            
           // 绘制质心标签
          ctx.fillStyle = '#FFFFFF';
          ctx.font = '12px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('质心', cmProjection.x, cmProjection.y - 15);
          }
        });
      }
      
      // 绘制轨道半径
      if (showRadius) {
        const renderRadiusLines = () => {
          // 天体A到质心的连线
          const aProj = project(xA, yA, zA, centerX, centerY);
          const cmProj = project(cmX, cmY, cmZ, centerX, centerY);
          
          ctx.beginPath();
          ctx.moveTo(aProj.x, aProj.y);
          ctx.lineTo(cmProj.x, cmProj.y);
          ctx.strokeStyle = 'rgba(255, 165, 0, 0.5)';
          ctx.lineWidth = 1;
          ctx.stroke();
          
          // 天体B到质心的连线
          const bProj = project(xB, yB, zB, centerX, centerY);
          
          ctx.beginPath();
          ctx.moveTo(bProj.x, bProj.y);
          ctx.lineTo(cmProj.x, cmProj.y);
          ctx.strokeStyle = 'rgba(135, 206, 250, 0.5)';
          ctx.lineWidth = 1;
          ctx.stroke();
          
          // 两天体之间的连线
          ctx.beginPath();
          ctx.moveTo(aProj.x, aProj.y);
          ctx.lineTo(bProj.x, bProj.y);
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
          ctx.lineWidth = 1;
          ctx.setLineDash([5, 5]);
          ctx.stroke();
          ctx.setLineDash([]);
          
          // 标注半径值
          const midX1 = (aProj.x + cmProj.x) / 2;
          const midY1 = (aProj.y + cmProj.y) / 2;
           ctx.font = '10px Arial';
          ctx.fillStyle = '#FFFFFF';
          ctx.fillText(`r1: ${r1.toFixed(0)}px`, midX1 + 5, midY1);
          
          const midX2 = (bProj.x + cmProj.x) / 2;
          const midY2 = (bProj.y + cmProj.y) / 2;
          ctx.fillText(`r2: ${r2.toFixed(0)}px`, midX2 + 5, midY2);
          
          // 标注距离值
          const midX = (aProj.x + bProj.x) / 2;
          const midY = (aProj.y + bProj.y) / 2;
          ctx.fillText(`L: ${(r1 + r2).toFixed(0)}px`, midX + 5, midY - 5);
        };
        
        // 添加半径线到渲染队列
        renderObjects.push({
          x: 0,
          y: 0,
          z: 0,
          radius: 0,
          fillColor: '',
          strokeColor: '',
          zIndex: -10, // 在所有物体下方渲染
          type: 'radiusLines',
          render: renderRadiusLines
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
        // 根据距离和质量计算角速度（简单模拟，保持动画流畅）
        const angularSpeed = 0.003 * Math.sqrt((massA + massB) / (distance * distance * distance));
        angleRef.current += deltaTime * angularSpeed % (2 * Math.PI);
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
  }, [massA, massB, distance, isPlaying, orbitType, showCenter, showRadius, project, drawGrid]);
  
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
                <label className="text-sm text-gray-600">天体A质量 (M☉)</label>
                <span className="text-sm font-medium">{massA}</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="5" 
                step="0.5" 
                value={massA}
                onChange={(e) => setMassA(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm text-gray-600">天体B质量 (M☉)</label>
                <span className="text-sm font-medium">{massB}</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="5" 
                step="0.5" 
                value={massB}
                onChange={(e) => setMassB(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm text-gray-600">两天体间距 (AU)</label>
                <span className="text-sm font-medium">{distance}</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="10" 
                step="0.5" 
                value={distance}
                onChange={(e) => setDistance(parseFloat(e.target.value))}
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
            
            <div className="mt-2">
              <label className="block text-sm text-gray-600 mb-1">轨道类型</label>
              <div className="flex space-x-2">
                <label className="inline-flex items-center">
                  <input 
                    type="radio" 
                    name="orbitType" 
                    value="circular" 
                    checked={orbitType === 'circular'}
                    onChange={() => setOrbitType('circular')}
                    className="form-radio text-blue-500"
                  />
                  <span className="ml-1 text-sm">圆周</span>
                </label>
                <label className="inline-flex items-center">
                  <input 
                    type="radio" 
                    name="orbitType" 
                    value="elliptical" 
                    checked={orbitType === 'elliptical'}
                    onChange={() => setOrbitType('elliptical')}
                    className="form-radio text-blue-500"
                  />
                  <span className="ml-1 text-sm">椭圆</span>
                </label>
              </div>
            </div>
          </div>
          
          {/* 辅助开关 */}
          <div className="flex flex-col justify-center space-y-4">
            <h3 className="font-medium text-gray-700 text-center">辅助显示</h3>
            
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-600">显示质心</label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={showCenter}
                  onChange={() => setShowCenter(!showCenter)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-600">显示轨道半径标注</label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={showRadius}
                  onChange={() => setShowRadius(!showRadius)}
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