import { useEffect, useRef, useState, useCallback } from "react";

export default function MicroElementMethod() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [deltaT, setDeltaT] = useState<number>(0.5);
    const [initialVelocity, setInitialVelocity] = useState<number>(0);
    const [acceleration, setAcceleration] = useState<number>(2);
    const totalTime = 5;
    // 固定的最大速度范围，确保刻度不变
    const fixedMaxVelocity = 15;

    const timePoints = useCallback(() => {
        return Array.from({
            length: Math.ceil(totalTime / deltaT) + 1
        }, (_, i) => i * deltaT);
    }, [deltaT, totalTime]);

    const calculateData = useCallback(() => {
        const points = timePoints();

        return points.map(t => {
            const velocity = initialVelocity + acceleration * t;
            const exactDisplacement = initialVelocity * t + 0.5 * acceleration * t * t;

            const approximateDisplacement = points.filter(ti => ti <= t).reduce((sum, ti, index) => {
                const vi = initialVelocity + acceleration * ti;
                const dt = index === 0 ? 0 : ti - points[index - 1];
                return sum + vi * dt;
            }, 0);

            return {
                time: t,
                velocity,
                exactDisplacement,
                approximateDisplacement,
                error: Math.abs(exactDisplacement - approximateDisplacement)
            };
        });
    }, [timePoints, initialVelocity, acceleration]);

    const [data, setData] = useState(calculateData());

    const [prevParams, setPrevParams] = useState({
        deltaT,
        initialVelocity,
        acceleration
    });

// 自动触发一次参数微调，解决初始模糊问题
useEffect(() => {
  // 异步执行，等DOM布局完全稳定后再操作
  const timer = setTimeout(() => {
    // 微扰deltaT：先改一点点，触发重绘
    setDeltaT(prev => prev + 0.01);
    // 立刻恢复原值，用户无感知
    setTimeout(() => setDeltaT(prev => prev - 0.01), 0);
  }, 100); // 100ms足够DOM布局稳定，可根据需要调整

  // 组件卸载时清除定时器，避免内存泄漏
  return () => clearTimeout(timer);
}, []); // 空依赖：仅组件挂载时执行一次
	
    useEffect(() => {
        if (deltaT !== prevParams.deltaT || initialVelocity !== prevParams.initialVelocity || acceleration !== prevParams.acceleration) {
            setData(calculateData());

            setPrevParams({
                deltaT,
                initialVelocity,
                acceleration
            });
        }
    }, [deltaT, initialVelocity, acceleration, calculateData, prevParams]);

    useEffect(() => {
        const canvas = canvasRef.current;

        if (!canvas)
            return;

        const ctx = canvas.getContext("2d");

        if (!ctx)
            return;

        const resizeCanvas = () => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        };

        resizeCanvas();
        window.addEventListener("resize", resizeCanvas);
        
        // 绘制固定刻度的图表
        const drawChart = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const padding = 40;
            const chartWidth = canvas.width - 2 * padding;
            const chartHeight = canvas.height - 2 * padding;
            
            // 绘制坐标轴
            ctx.beginPath();
            ctx.moveTo(padding, padding);
            ctx.lineTo(padding, canvas.height - padding);
            ctx.lineTo(canvas.width - padding, canvas.height - padding);
            ctx.strokeStyle = "#94a3b8";
            ctx.lineWidth = 1;
            ctx.stroke();
            
            // 绘制坐标轴标签
            ctx.fillStyle = "#64748b";
            ctx.font = "12px Arial";
            ctx.fillText("t (s)", canvas.width - 20, canvas.height - 20);
            ctx.save();
            ctx.translate(padding - 20, canvas.height / 2);
            ctx.rotate(-Math.PI / 2);
            ctx.fillText("v (m/s)", 0, 0);
            ctx.restore();
            
            // 固定的时间和速度缩放比例，确保刻度不变
            const velocityScale = chartHeight / fixedMaxVelocity;
            const timeScale = chartWidth / totalTime;
            
            // 绘制速度网格线
            ctx.strokeStyle = "rgba(148, 163, 184, 0.2)";
            ctx.lineWidth = 1;
            for (let v = 0; v <= fixedMaxVelocity; v += 5) {
                const y = canvas.height - padding - v * velocityScale;
                ctx.beginPath();
                ctx.moveTo(padding, y);
                ctx.lineTo(canvas.width - padding, y);
                ctx.stroke();
                
                // 绘制速度刻度标签
                ctx.fillStyle = "#64748b";
                ctx.font = "10px Arial";
                ctx.textAlign = "right";
                ctx.fillText(v.toString(), padding - 5, y + 4);
            }
            
            // 绘制时间网格线
            ctx.strokeStyle = "rgba(148, 163, 184, 0.2)";
            ctx.lineWidth = 1;
            for (let t = 0; t <= totalTime; t += 1) {
                const x = padding + t * timeScale;
                ctx.beginPath();
                ctx.moveTo(x, padding);
                ctx.lineTo(x, canvas.height - padding);
                ctx.stroke();
                
                // 绘制时间刻度标签
                ctx.fillStyle = "#64748b";
                ctx.font = "10px Arial";
                ctx.textAlign = "center";
                ctx.fillText(t.toString(), x, canvas.height - padding + 15);
            }
            
            // 绘制速度-时间曲线
            ctx.beginPath();
            ctx.moveTo(padding, canvas.height - padding - initialVelocity * velocityScale);
            
            data.forEach((d, index) => {
                const x = padding + d.time * timeScale;
                const y = canvas.height - padding - d.velocity * velocityScale;

                if (index === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });
            
            ctx.strokeStyle = "#3b82f6";
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // 绘制矩形微元
            const points = timePoints();
            for (let i = 0; i < points.length - 1; i++) {
                const t = points[i];
                const nextT = points[i + 1];
                const v = initialVelocity + acceleration * t;
                const x1 = padding + t * timeScale;
                const x2 = padding + nextT * timeScale;
                const y1 = canvas.height - padding;
                const y2 = canvas.height - padding - v * velocityScale;
                
                // 确保矩形不会超出图表范围
                const clippedY2 = Math.max(padding, y2);
                
                ctx.fillStyle = "rgba(59, 130, 246, 0.6)";
                ctx.fillRect(x1, clippedY2, x2 - x1, y1 - clippedY2);
                ctx.strokeStyle = "#3b82f6";
                ctx.lineWidth = 1;
                ctx.strokeRect(x1, clippedY2, x2 - x1, y1 - clippedY2);
            }
        };
        
        drawChart();
        
        return () => {
            window.removeEventListener("resize", resizeCanvas);
        };
    }, [data, initialVelocity, acceleration, timePoints, totalTime, fixedMaxVelocity]);

    const errorPercentage = (data[data.length - 1]?.error || 0) / (data[data.length - 1]?.exactDisplacement || 1) * 100;

    return (
        <div className="h-full flex flex-col">
            <div className="p-4 bg-blue-50 rounded-t-lg">
                <p className="text-sm text-blue-700 mt-1">通过微元法将速度-时间曲线下的面积分割成多个小矩形，累加后近似得到位移。</p>
            </div>
            <div className="flex-1 flex flex-col md:flex-row">
                <div className="flex-1 p-4">
                    <div className="h-full bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <canvas ref={canvasRef} className="w-full h-full"></canvas>
                    </div>
                </div>
                <div className="md:w-1/3 p-4 space-y-4">
                    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
                        <h4 className="font-medium text-gray-800">参数调节</h4>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-sm text-gray-600">时间微元 △t (s)</label>
                                <span className="text-sm font-medium">{deltaT}</span>
                            </div>
                            <input
                                type="range"
                                min="0.01"
                                max="1"
                                step="0.01"
                                value={deltaT}
                                onChange={e => setDeltaT(parseFloat(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-sm text-gray-600">初速度 v₀ (m/s)</label>
                                <span className="text-sm font-medium">{initialVelocity}</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="5"
                                step="1"
                                value={initialVelocity}
                                onChange={e => setInitialVelocity(parseFloat(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-sm text-gray-600">加速度 a (m/s²)</label>
                                <span className="text-sm font-medium">{acceleration}</span>
                            </div>
                            <input
                                type="range"
                                min="0.5"
                                max="5"
                                step="0.5"
                                value={acceleration}
                                onChange={e => setAcceleration(parseFloat(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
                        <h4 className="font-medium text-gray-800">计算结果</h4>
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-600">精确位移:</span>
                            <span className="text-sm font-medium">{data[data.length - 1]?.exactDisplacement.toFixed(2)}m</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-600">近似位移:</span>
                            <span className="text-sm font-medium">{data[data.length - 1]?.approximateDisplacement.toFixed(2)}m</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-600">误差:</span>
                            <span className="text-sm font-medium">{errorPercentage.toFixed(2)}%</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}