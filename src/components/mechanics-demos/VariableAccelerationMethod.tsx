import { useEffect, useRef, useState, useCallback } from "react";

export default function VariableAccelerationMethod() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [deltaT, setDeltaT] = useState<number>(0.5);
    const [initialVelocity, setInitialVelocity] = useState<number>(0);
    const [initialAcceleration, setInitialAcceleration] = useState<number>(4);
    const [accelerationDecreaseRate, setAccelerationDecreaseRate] = useState<number>(0.8);
    const totalTime = 5;
    // 固定的最大速度范围，确保刻度不变
    const fixedMaxVelocity = 15;

    const timePoints = useCallback(() => {
        return Array.from({
            length: Math.ceil(totalTime / deltaT) + 1
        }, (_, i) => i * deltaT);
    }, [deltaT, totalTime]);

    // 计算变加速运动的数据
    const calculateData = useCallback(() => {
        const points = timePoints();

        // 变加速运动的速度和位移公式
        // a(t) = a0 - kt (加速度随时间均匀减小)
        // v(t) = v0 + a0*t - 0.5*k*t²
        // s(t) = v0*t + 0.5*a0*t² - (1/6)*k*t³
        
        return points.map(t => {
            // 计算当前时刻的加速度
            const acceleration = Math.max(0, initialAcceleration - accelerationDecreaseRate * t);
            
            // 计算当前时刻的速度
            // 当加速度减为0后，速度保持恒定
            let velocity;
            if (initialAcceleration - accelerationDecreaseRate * t > 0) {
                // 加速度仍为正时的速度公式
                velocity = initialVelocity + initialAcceleration * t - 0.5 * accelerationDecreaseRate * t * t;
            } else {
                // 加速度为0后的速度公式（保持恒定）
                const tZeroAcceleration = initialAcceleration / accelerationDecreaseRate;
                velocity = initialVelocity + initialAcceleration * tZeroAcceleration - 0.5 * accelerationDecreaseRate * tZeroAcceleration * tZeroAcceleration;
            }
            
            // 精确位移（积分结果）
            let exactDisplacement;
            if (initialAcceleration - accelerationDecreaseRate * t > 0) {
                // 加速度仍为正时的位移公式
                exactDisplacement = initialVelocity * t + 0.5 * initialAcceleration * t * t - (1/6) * accelerationDecreaseRate * t * t * t;
            } else {
                // 加速度为0后的位移公式
                const tZeroAcceleration = initialAcceleration / accelerationDecreaseRate;
                const displacementBeforeZero = initialVelocity * tZeroAcceleration + 0.5 * initialAcceleration * tZeroAcceleration * tZeroAcceleration - (1/6) * accelerationDecreaseRate * tZeroAcceleration * tZeroAcceleration * tZeroAcceleration;
                const constantVelocity = initialVelocity + initialAcceleration * tZeroAcceleration - 0.5 * accelerationDecreaseRate * tZeroAcceleration * tZeroAcceleration;
                exactDisplacement = displacementBeforeZero + constantVelocity * (t - tZeroAcceleration);
            }

            // 近似位移（微元法）
            const approximateDisplacement = points.filter(ti => ti <= t).reduce((sum, ti, index) => {
                // 计算ti时刻的加速度
                const ai = Math.max(0, initialAcceleration - accelerationDecreaseRate * ti);
                // 计算ti时刻的速度
                let vi;
                if (initialAcceleration - accelerationDecreaseRate * ti > 0) {
                    vi = initialVelocity + initialAcceleration * ti - 0.5 * accelerationDecreaseRate * ti * ti;
                } else {
                    const tZeroAcceleration = initialAcceleration / accelerationDecreaseRate;
                    vi = initialVelocity + initialAcceleration * tZeroAcceleration - 0.5 * accelerationDecreaseRate * tZeroAcceleration * tZeroAcceleration;
                }
                const dt = index === 0 ? 0 : ti - points[index - 1];
                return sum + vi * dt;
            }, 0);

            return {
                time: t,
                acceleration,
                velocity,
                exactDisplacement,
                approximateDisplacement,
                error: Math.abs(exactDisplacement - approximateDisplacement)
            };
        });
    }, [timePoints, initialVelocity, initialAcceleration, accelerationDecreaseRate]);

    const [data, setData] = useState(calculateData());

    const [prevParams, setPrevParams] = useState({
        deltaT,
        initialVelocity,
        initialAcceleration,
        accelerationDecreaseRate
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
        if (deltaT !== prevParams.deltaT || 
            initialVelocity !== prevParams.initialVelocity || 
            initialAcceleration !== prevParams.initialAcceleration ||
            accelerationDecreaseRate !== prevParams.accelerationDecreaseRate) {
            setData(calculateData());

            setPrevParams({
                deltaT,
                initialVelocity,
                initialAcceleration,
                accelerationDecreaseRate
            });
        }
    }, [deltaT, initialVelocity, initialAcceleration, accelerationDecreaseRate, calculateData, prevParams]);

    useEffect(() => {
        const canvas = canvasRef.current;

        if (!canvas)
            return;

        const ctx = canvas.getContext("2d");

        if (!ctx)
            return;

        const resizeCanvas = () => {
            // 获取父容器的实际尺寸
            const container = canvas.parentElement;
            if (container) {
                const { width, height } = container.getBoundingClientRect();
                // 确保设置canvas的实际像素尺寸
                canvas.width = width;
                canvas.height = height;
            }
        };

        resizeCanvas();
        window.addEventListener("resize", resizeCanvas);
        
        // 绘制固定刻度的图表
        const drawChart = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            // 增加底部padding，确保时间标签完全可见
            const padding = {
                top: 40,
                right: 40,
                bottom: 50, // 增加底部padding
                left: 40
            };
            
            const chartWidth = canvas.width - padding.left - padding.right;
            const chartHeight = canvas.height - padding.top - padding.bottom;
            
            // 绘制坐标轴
            ctx.beginPath();
            ctx.moveTo(padding.left, padding.top);
            ctx.lineTo(padding.left, canvas.height - padding.bottom);
            ctx.lineTo(canvas.width - padding.right, canvas.height - padding.bottom);
            ctx.strokeStyle = "#94a3b8";
            ctx.lineWidth = 1;
            ctx.stroke();
            
            // 绘制坐标轴标签
            ctx.fillStyle = "#64748b";
            ctx.font = "12px Arial";
            ctx.fillText("t (s)", canvas.width - 20, canvas.height - padding.bottom + 20);
            ctx.save();
            ctx.translate(padding.left - 20, canvas.height / 2);
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
                const y = canvas.height - padding.bottom - v * velocityScale;
                ctx.beginPath();
                ctx.moveTo(padding.left, y);
                ctx.lineTo(canvas.width - padding.right, y);
                ctx.stroke();
                
                // 绘制速度刻度标签
                ctx.fillStyle = "#64748b";
                ctx.font = "10px Arial";
                ctx.textAlign = "right";
                ctx.fillText(v.toString(), padding.left - 5, y + 4);
            }
            
            // 绘制时间网格线
            ctx.strokeStyle = "rgba(148, 163, 184, 0.2)";
            ctx.lineWidth = 1;
            for (let t = 0; t <= totalTime; t += 1) {
                const x = padding.left + t * timeScale;
                ctx.beginPath();
                ctx.moveTo(x, padding.top);
                ctx.lineTo(x, canvas.height - padding.bottom);
                ctx.stroke();
                
                // 绘制时间刻度标签 - 确保在画布可见范围内
                ctx.fillStyle = "#64748b";
                ctx.font = "10px Arial";
                ctx.textAlign = "center";
                ctx.fillText(t.toString(), x, canvas.height - padding.bottom + 20);
            }
            
            // 绘制速度-时间曲线
            ctx.beginPath();
            ctx.moveTo(padding.left, canvas.height - padding.bottom - initialVelocity * velocityScale);
            
            data.forEach((d, index) => {
                const x = padding.left + d.time * timeScale;
                const y = canvas.height - padding.bottom - d.velocity * velocityScale;

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
                
                // 计算ti时刻的加速度和速度
                const acceleration = Math.max(0, initialAcceleration - accelerationDecreaseRate * t);
                let v;
                if (initialAcceleration - accelerationDecreaseRate * t > 0) {
                    v = initialVelocity + initialAcceleration * t - 0.5 * accelerationDecreaseRate * t * t;
                } else {
                    const tZeroAcceleration = initialAcceleration / accelerationDecreaseRate;
                    v = initialVelocity + initialAcceleration * tZeroAcceleration - 0.5 * accelerationDecreaseRate * tZeroAcceleration * tZeroAcceleration;
                }
                
                const x1 = padding.left + t * timeScale;
                const x2 = padding.left + nextT * timeScale;
                const y1 = canvas.height - padding.bottom;
                const y2 = canvas.height - padding.bottom - v * velocityScale;
                
                // 确保矩形不会超出图表范围
                const clippedY2 = Math.max(padding.top, y2);
                
                ctx.fillStyle = "rgba(59, 130, 246, 0.6)";
                ctx.fillRect(x1, clippedY2, x2 - x1, y1 - clippedY2);
                ctx.strokeStyle = "#3b82f6";
                ctx.lineWidth = 1;
                ctx.strokeRect(x1, clippedY2, x2 - x1, y1 - clippedY2);
            }
        };
        
        // 确保画布尺寸正确后绘制图表
        drawChart();
        
        // 额外添加一个延时重绘，确保在DOM完全渲染后再绘制一次
        const timer = setTimeout(() => {
            resizeCanvas();
            drawChart();
        }, 200);
        
        return () => {
            window.removeEventListener("resize", resizeCanvas);
            clearTimeout(timer);
        };
    }, [data, initialVelocity, initialAcceleration, accelerationDecreaseRate, timePoints, totalTime, fixedMaxVelocity]);

    const errorPercentage = (data[data.length - 1]?.error || 0) / (data[data.length - 1]?.exactDisplacement || 1) * 100;

    return (
        <div className="h-full flex flex-col">
            <div className="p-4 bg-blue-50 rounded-t-lg">
                <p className="text-sm text-blue-700 mt-1">通过微元法将变加速运动的速度-时间曲线下的面积分割成多个小矩形，累加后近似得到位移。加速度随时间均匀减小。</p>
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
                                <label className="text-sm text-gray-600">初始加速度 a₀ (m/s²)</label>
                                <span className="text-sm font-medium">{initialAcceleration}</span>
                            </div>
                            <input
                                type="range"
                                min="0.5"
                                max="8"
                                step="0.5"
                                value={initialAcceleration}
                                onChange={e => setInitialAcceleration(parseFloat(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-sm text-gray-600">加速度减小速率 k (m/s³)</label>
                                <span className="text-sm font-medium">{accelerationDecreaseRate}</span>
                            </div>
                            <input
                                type="range"
                                min="0.1"
                                max="2"
                                step="0.1"
                                value={accelerationDecreaseRate}
                                onChange={e => setAccelerationDecreaseRate(parseFloat(e.target.value))}
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
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-600">最终加速度:</span>
                            <span className="text-sm font-medium">{data[data.length - 1]?.acceleration.toFixed(2)}m/s²</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-600">最终速度:</span>
                            <span className="text-sm font-medium">{data[data.length - 1]?.velocity.toFixed(2)}m/s</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}