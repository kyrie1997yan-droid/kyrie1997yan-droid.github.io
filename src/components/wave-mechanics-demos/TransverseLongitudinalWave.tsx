import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";

export default function TransverseLongitudinalWave() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [waveType, setWaveType] = useState<"transverse" | "longitudinal">("transverse");
    const [period, setPeriod] = useState<number>(2);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [amplitude, setAmplitude] = useState<number>(30);
    const [mode, setMode] = useState<"auto" | "manual">("auto");
    const [mouseScrollAngle, setMouseScrollAngle] = useState<number>(0);
    const totalPoints = 10;
    const ballRadius = 10;
    const animationFrameRef = useRef<number>();
    const startTimeRef = useRef<number | null>(null);
    const accumulatedTimeRef = useRef<number>(0);
    const lastWheelTimestampRef = useRef<number>(0);
    const wheelSpeedRef = useRef<number>(0);

    interface Particle {
        x: number;
        y: number;
        originalX: number;
        originalY: number;
        displacement: number;
    }

    const initializeParticles = useCallback(() => {
        const particles: Particle[] = [];
        const canvas = canvasRef.current;

        if (!canvas)
            return particles;

        const padding = 60;
        const availableWidth = canvas.width - 2 * padding;
        const availableHeight = canvas.height - 2 * padding;
        const offsetY = amplitude * 2 + ballRadius * 2;
        const spacing = availableWidth / (totalPoints - 1);

        for (let i = 0; i < totalPoints; i++) {
            const x = padding + i * spacing;
            const y = padding + offsetY;

            particles.push({
                x,
                y,
                originalX: x,
                originalY: y,
                displacement: 0
            });
        }

        return particles;
    }, [amplitude, ballRadius, totalPoints]);

    const [particles, setParticles] = useState<Particle[]>(initializeParticles());

    const handleWheel = useCallback((e: WheelEvent) => {
        if (mode !== "manual")
            return;

        e.preventDefault();
        const currentTime = performance.now();
        const deltaTime = currentTime - lastWheelTimestampRef.current;
        const wheelDelta = -e.deltaY;
        wheelSpeedRef.current = Math.abs(wheelDelta) / (deltaTime || 1);
        const angleIncrement = wheelDelta / 120 * (Math.PI / 3);
        setMouseScrollAngle(prev => prev + angleIncrement);
        lastWheelTimestampRef.current = currentTime;
    }, [mode]);

    useEffect(() => {
        if (mode !== "manual")
            return;

        const decayInterval = setInterval(() => {
            if (wheelSpeedRef.current > 0) {
                wheelSpeedRef.current *= 0.95;

                if (wheelSpeedRef.current < 0.1) {
                    wheelSpeedRef.current = 0;
                }
            }
        }, 16);

        return () => clearInterval(decayInterval);
    }, [mode]);

    const animate = useCallback(() => {
        const canvas = canvasRef.current;

        if (!canvas)
            return;

        const ctx = canvas.getContext("2d");

        if (!ctx)
            return;

        const padding = 60;
        const availableWidth = canvas.width - 2 * padding;
        const availableHeight = canvas.height - 2 * padding;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const offsetY = amplitude * 2 + ballRadius * 2;
        ctx.beginPath();
        ctx.moveTo(padding, padding + offsetY);
        ctx.lineTo(padding + availableWidth, padding + offsetY);
        ctx.strokeStyle = "#e2e8f0";
        ctx.lineWidth = 1;
        ctx.stroke();
        let t = 0;

        if (mode === "auto") {
            t = accumulatedTimeRef.current;

            if (isPlaying) {
                const currentTime = performance.now();

                if (startTimeRef.current === null) {
                    startTimeRef.current = currentTime;
                }

                accumulatedTimeRef.current = accumulatedTimeRef.current + (currentTime - startTimeRef.current) / 1000;
                t = accumulatedTimeRef.current;
                startTimeRef.current = currentTime;
            } else {
                startTimeRef.current = null;
            }
        } else {
            t = mouseScrollAngle / (2 * Math.PI) * period;
        }

        const updatedParticles = particles.map((particle, index) => {
            const phase = index / (totalPoints - 1) * 2 * Math.PI;
            const angularFrequency = 2 * Math.PI / period;
            let adjustedPeriod = period;

            if (mode === "manual" && wheelSpeedRef.current > 0) {
                adjustedPeriod = Math.max(0.5, period / (1 + wheelSpeedRef.current * 0.01));
            }

            const adjustedAngularFrequency = 2 * Math.PI / adjustedPeriod;
            const displacement = amplitude * Math.sin(adjustedAngularFrequency * t - phase);
            let newX = particle.originalX;
            let newY = particle.originalY;

            if (waveType === "transverse") {
                newY = particle.originalY - displacement;
            } else {
                newX = particle.originalX + displacement;
            }

            return {
                ...particle,
                x: newX,
                y: newY,
                displacement
            };
        });

        setParticles(updatedParticles);

        updatedParticles.forEach(particle => {
            ctx.beginPath();

            if (waveType === "transverse") {
                ctx.moveTo(particle.originalX, padding);
                ctx.lineTo(particle.originalX, padding + availableHeight);
            } else {
                ctx.moveTo(padding, particle.originalY);
                ctx.lineTo(padding + availableWidth, particle.originalY);
            }

            ctx.strokeStyle = "#e2e8f0";
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, ballRadius, 0, 2 * Math.PI);
            ctx.fillStyle = "#3b82f6";
            ctx.fill();
            ctx.strokeStyle = "#2563eb";
            ctx.lineWidth = 2;
            ctx.stroke();

            if (Math.abs(particle.displacement) > 1) {
                ctx.strokeStyle = "#ef4444";
                ctx.lineWidth = 2;
                ctx.beginPath();

                if (waveType === "transverse") {
                    const arrowLength = particle.displacement;
                    const startY = particle.originalY;
                    const endY = particle.originalY - arrowLength;
                    ctx.moveTo(particle.originalX, startY);
                    ctx.lineTo(particle.originalX, endY);
                    const arrowSize = 6;
                    ctx.moveTo(particle.originalX, endY);
                    ctx.lineTo(particle.originalX - arrowSize, endY + arrowSize);
                    ctx.moveTo(particle.originalX, endY);
                    ctx.lineTo(particle.originalX + arrowSize, endY + arrowSize);
                } else {
                    const arrowLength = particle.displacement;
                    const startX = particle.originalX;
                    const endX = particle.originalX + arrowLength;
                    ctx.moveTo(startX, particle.originalY);
                    ctx.lineTo(endX, particle.originalY);
                    const arrowSize = 6;
                    ctx.moveTo(endX, particle.originalY);
                    ctx.lineTo(endX - arrowSize, particle.originalY - arrowSize);
                    ctx.moveTo(endX, particle.originalY);
                    ctx.lineTo(endX - arrowSize, particle.originalY + arrowSize);
                }

                ctx.stroke();
            }
        });

        if (waveType === "transverse" && updatedParticles.length > 1) {
            ctx.beginPath();
            ctx.moveTo(updatedParticles[0].x, updatedParticles[0].y);

            for (let i = 1; i < updatedParticles.length; i++) {
                ctx.lineTo(updatedParticles[i].x, updatedParticles[i].y);
            }

            ctx.strokeStyle = "#6366f1";
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        ctx.strokeStyle = "#10b981";
        ctx.lineWidth = 2;
        ctx.beginPath();
        const arrowStartX = padding + availableWidth * 0.1;
        const arrowEndX = padding + availableWidth * 0.9;
        const arrowY = padding + availableHeight - 30;
        ctx.moveTo(arrowStartX, arrowY);
        ctx.lineTo(arrowEndX, arrowY);
        const arrowSize = 10;
        ctx.moveTo(arrowEndX, arrowY);
        ctx.lineTo(arrowEndX - arrowSize, arrowY - arrowSize / 2);
        ctx.moveTo(arrowEndX, arrowY);
        ctx.lineTo(arrowEndX - arrowSize, arrowY + arrowSize / 2);
        ctx.stroke();
        ctx.fillStyle = "#10b981";
        ctx.font = "12px Arial";
        ctx.textAlign = "center";
        ctx.fillText("波的传播方向", (arrowStartX + arrowEndX) / 2, arrowY - 15);

        

        animationFrameRef.current = requestAnimationFrame(animate);
    }, [particles, waveType, period, amplitude, isPlaying, mode, mouseScrollAngle]);

    const handlePlayPause = () => {
        setIsPlaying(!isPlaying);
    };

    const handleReset = () => {
        setIsPlaying(false);
        accumulatedTimeRef.current = 0;
        setMouseScrollAngle(0);

        setParticles(prevParticles => prevParticles.map(particle => ({
            ...particle,
            x: particle.originalX,
            y: particle.originalY,
            displacement: 0
        })));
    };

    const handleModeChange = (newMode: "auto" | "manual") => {
        setMode(newMode);

        if (newMode === "auto") {
            setIsPlaying(false);
            accumulatedTimeRef.current = 0;
        } else {
            setMouseScrollAngle(0);
            wheelSpeedRef.current = 0;
        }
    };

    const resizeCanvas = useCallback(() => {
        const canvas = canvasRef.current;

        if (!canvas)
            return;

        const container = canvas.parentElement;

        if (container) {
            const {
                width,
                height
            } = container.getBoundingClientRect();

            canvas.width = width;
            canvas.height = height;
            const newParticles = initializeParticles();
            setParticles(newParticles);
        }
    }, [initializeParticles]);

    useEffect(() => {
        resizeCanvas();
        window.addEventListener("resize", resizeCanvas);

        window.addEventListener("wheel", handleWheel, {
            passive: false
        });

        animationFrameRef.current = requestAnimationFrame(animate);

        return () => {
            window.removeEventListener("resize", resizeCanvas);
            window.removeEventListener("wheel", handleWheel);

            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [resizeCanvas, animate, handleWheel]);

    useEffect(() => {
        handleReset();
    }, [waveType]);

    return (
        <div className="h-full flex flex-col">
            <></>
            <div className="flex-1 flex flex-col md:flex-row">
                <div className="flex-1 p-4">
                    <div
                        className="h-full bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <canvas ref={canvasRef} className="w-full h-full"></canvas>
                    </div>
                </div>
                <div className="md:w-1/3 p-4 space-y-4">
                    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
                        <h4 className="font-medium text-gray-800">参数调节</h4>
                        {}
                        <div className="space-y-2">
                            <label className="text-sm text-gray-600">模式</label>
                            <div className="flex space-x-4">
                                <label className="inline-flex items-center">
                                    <input
                                        type="radio"
                                        name="mode"
                                        value="auto"
                                        checked={mode === "auto"}
                                        onChange={() => handleModeChange("auto")}
                                        className="form-radio text-blue-500" />
                                    <span className="ml-1 text-sm">自动模式</span>
                                </label>
                                <label className="inline-flex items-center">
                                    <input
                                        type="radio"
                                        name="mode"
                                        value="manual"
                                        checked={mode === "manual"}
                                        onChange={() => handleModeChange("manual")}
                                        className="form-radio text-blue-500" />
                                    <span className="ml-1 text-sm">手动模式</span>
                                </label>
                            </div>
                        </div>
                        {}
                        <div className="space-y-2">
                            <label className="text-sm text-gray-600">波类型</label>
                            <div className="flex space-x-4">
                                <label className="inline-flex items-center">
                                    <input
                                        type="radio"
                                        name="waveType"
                                        value="transverse"
                                        checked={waveType === "transverse"}
                                        onChange={() => setWaveType("transverse")}
                                        className="form-radio text-blue-500" />
                                    <span className="ml-1 text-sm">横波</span>
                                </label>
                                <label className="inline-flex items-center">
                                    <input
                                        type="radio"
                                        name="waveType"
                                        value="longitudinal"
                                        checked={waveType === "longitudinal"}
                                        onChange={() => setWaveType("longitudinal")}
                                        className="form-radio text-blue-500" />
                                    <span className="ml-1 text-sm">纵波</span>
                                </label>
                            </div>
                        </div>
                        {}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-sm text-gray-600">波的周期 (s)</label>
                                <span className="text-sm font-medium">{period}</span>
                            </div>
                            <input
                                type="range"
                                min="0.5"
                                max="4"
                                step="0.1"
                                value={period}
                                onChange={e => setPeriod(parseFloat(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                        </div>
                        {}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-sm text-gray-600">波的振幅</label>
                                <span className="text-sm font-medium">{amplitude}</span>
                            </div>
                            <input
                                type="range"
                                min="10"
                                max="60"
                                step="5"
                                value={amplitude}
                                onChange={e => setAmplitude(parseInt(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                        </div>
                    </div>
                    {}
                    {mode === "auto" && <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
                        <h4 className="font-medium text-gray-800">控制</h4>
                        <div className="flex space-x-3">
                            <motion.button
                                onClick={handlePlayPause}
                                className={`flex-1 px-4 py-2 rounded-lg text-white font-medium ${isPlaying ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"}`}
                                whileTap={{
                                    scale: 0.95
                                }}>
                                {isPlaying ? <i className="fas fa-pause mr-1"></i> : <i className="fas fa-play mr-1"></i>}
                                {isPlaying ? "暂停" : "播放"}
                            </motion.button>
                            <motion.button
                                onClick={handleReset}
                                className="flex-1 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-lg"
                                whileTap={{
                                    scale: 0.95
                                }}>
                                <i className="fas fa-sync-alt mr-1"></i>重置
                                                                </motion.button>
                        </div>
                    </div>}
                    {}
                    {mode === "manual" && <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
                        <h4 className="font-medium text-blue-700">手动模式说明</h4>
                        <ul className="text-sm text-blue-600 space-y-2 mt-2">
                            <li><i className="fas fa-mouse-wheel mr-1"></i>向下滚动鼠标滚轮使波传播</li>
                            <li><i className="fas fa-tachometer-alt mr-1"></i>滚动速度越快，波的频率越高</li>
                            <></>
                        </ul>
                    </div>}
                </div>
            </div>
        </div>
    );
}