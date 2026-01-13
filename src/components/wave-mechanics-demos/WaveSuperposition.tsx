import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";

export default function WaveSuperposition() {
    const canvasRef = useRef(null);
    const animationRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [time, setTime] = useState(0);
    const waveSpeed = 1;
    const [leftAmplitude, setLeftAmplitude] = useState(50);
    const [leftWavelength, setLeftWavelength] = useState(100);
    const [leftPhase, setLeftPhase] = useState(0);
    const [rightAmplitude, setRightAmplitude] = useState(50);
    const [rightWavelength, setRightWavelength] = useState(100);
    const [rightPhase, setRightPhase] = useState(0);
    const leftFrequency = waveSpeed / leftWavelength;
    const rightFrequency = waveSpeed / rightWavelength;

    useEffect(() => {
        const canvas = canvasRef.current;

        if (!canvas)
            return;

        const ctx = canvas.getContext("2d");
        const width = canvas.width;
        const height = canvas.height;
        const centerY = height / 2;
        const leftWaveFront = waveSpeed * time;
        const rightWaveFront = waveSpeed * time;

        const draw = () => {
            ctx.fillStyle = "#0f172a";
            ctx.fillRect(0, 0, width, height);
            ctx.strokeStyle = "#1e293b";
            ctx.lineWidth = 1;

            for (let i = 0; i <= 10; i++) {
                ctx.beginPath();
                ctx.moveTo(0, height / 10 * i);
                ctx.lineTo(width, height / 10 * i);
                ctx.stroke();
            }

            for (let i = 0; i <= 20; i++) {
                ctx.beginPath();
                ctx.moveTo(width / 20 * i, 0);
                ctx.lineTo(width / 20 * i, height);
                ctx.stroke();
            }

            ctx.strokeStyle = "#475569";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, centerY);
            ctx.lineTo(width, centerY);
            ctx.stroke();
            ctx.strokeStyle = "#06b6d4";
            ctx.lineWidth = 2;
            ctx.beginPath();
            let hasLeftPath = false;

            for (let x = 0; x < width; x++) {
                if (x <= leftWaveFront) {
                    const k = 2 * Math.PI / leftWavelength;
                    const omega = 2 * Math.PI * leftFrequency;
                    const y = leftAmplitude * Math.sin(k * x - omega * time + leftPhase);

                    if (!hasLeftPath) {
                        ctx.moveTo(x, centerY - y);
                        hasLeftPath = true;
                    } else {
                        ctx.lineTo(x, centerY - y);
                    }
                }
            }

            if (hasLeftPath)
                ctx.stroke();

            ctx.strokeStyle = "#ec4899";
            ctx.lineWidth = 2;
            ctx.beginPath();
            let hasRightPath = false;

            for (let x = 0; x < width; x++) {
                if (width - x <= rightWaveFront) {
                    const k = 2 * Math.PI / rightWavelength;
                    const omega = 2 * Math.PI * rightFrequency;
                    const y = rightAmplitude * Math.sin(-k * (x - width) - omega * time + rightPhase);

                    if (!hasRightPath) {
                        ctx.moveTo(x, centerY - y);
                        hasRightPath = true;
                    } else {
                        ctx.lineTo(x, centerY - y);
                    }
                }
            }

            if (hasRightPath)
                ctx.stroke();

            ctx.strokeStyle = "#fbbf24";
            ctx.lineWidth = 3;
            ctx.beginPath();
            let hasSuperpositionPath = false;

            for (let x = 0; x < width; x++) {
                const leftReached = x <= leftWaveFront;
                const rightReached = width - x <= rightWaveFront;

                if (leftReached && rightReached) {
                    const k1 = 2 * Math.PI / leftWavelength;
                    const omega1 = 2 * Math.PI * leftFrequency;
                    const y1 = leftAmplitude * Math.sin(k1 * x - omega1 * time + leftPhase);
                    const k2 = 2 * Math.PI / rightWavelength;
                    const omega2 = 2 * Math.PI * rightFrequency;
                    const y2 = rightAmplitude * Math.sin(-k2 * (x - width) - omega2 * time + rightPhase);
                    const yTotal = y1 + y2;

                    if (!hasSuperpositionPath) {
                        ctx.moveTo(x, centerY - yTotal);
                        hasSuperpositionPath = true;
                    } else {
                        ctx.lineTo(x, centerY - yTotal);
                    }
                } else {
                    if (hasSuperpositionPath) {
                        ctx.stroke();
                        ctx.beginPath();
                        hasSuperpositionPath = false;
                    }
                }
            }

            if (hasSuperpositionPath)
                ctx.stroke();

            ctx.fillStyle = "#06b6d4";
            ctx.beginPath();
            ctx.arc(10, centerY, 6, 0, 2 * Math.PI);
            ctx.fill();
            ctx.fillStyle = "#fff";
            ctx.font = "bold 12px sans-serif";
            ctx.fillText("左", 6, centerY + 4);
            ctx.fillStyle = "#ec4899";
            ctx.beginPath();
            ctx.arc(width - 10, centerY, 6, 0, 2 * Math.PI);
            ctx.fill();
            ctx.fillStyle = "#fff";
            ctx.fillText("右", width - 14, centerY + 4);
            ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
            ctx.fillRect(10, 10, 480, 60);
            ctx.strokeStyle = "#06b6d4";
            ctx.lineWidth = 2;
            ctx.strokeRect(10, 10, 480, 60);
            ctx.fillStyle = "#06b6d4";
            ctx.font = "bold 14px monospace";
            ctx.fillText("左侧波函数:", 20, 30);
            ctx.font = "13px monospace";
            const leftK = (2 * Math.PI / leftWavelength).toFixed(3);
            const leftOmega = (2 * Math.PI * leftFrequency).toFixed(3);
            const leftPhaseStr = leftPhase !== 0 ? ` + ${leftPhase.toFixed(2)}` : "";

            ctx.fillText(
                `y₁ = ${leftAmplitude}sin(${leftK}x - ${leftOmega}t${leftPhaseStr})`,
                20,
                55
            );

            ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
            ctx.fillRect(width - 490, 10, 480, 60);
            ctx.strokeStyle = "#ec4899";
            ctx.lineWidth = 2;
            ctx.strokeRect(width - 490, 10, 480, 60);
            ctx.fillStyle = "#ec4899";
            ctx.font = "bold 14px monospace";
            ctx.fillText("右侧波函数:", width - 480, 30);
            ctx.font = "13px monospace";
            const rightK = (-2 * Math.PI / rightWavelength).toFixed(3);
            const rightConst = (2 * Math.PI / rightWavelength * 1000).toFixed(1);
            const rightOmega = (2 * Math.PI * rightFrequency).toFixed(3);
            const rightPhaseStr = rightPhase !== 0 ? ` + ${rightPhase.toFixed(2)}` : "";

            ctx.fillText(
                `y₂ = ${rightAmplitude}sin(${rightK}x + ${rightConst} - ${rightOmega}t${rightPhaseStr})`,
                width - 480,
                55
            );
        };

        const animate = () => {
            if (isPlaying) {
                setTime(t => t + 0.05);
            }

            draw();
            animationRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [
        time,
        isPlaying,
        leftAmplitude,
        leftWavelength,
        leftPhase,
        leftFrequency,
        rightAmplitude,
        rightWavelength,
        rightPhase,
        rightFrequency
    ]);

    const reset = () => {
        setTime(0);
        setIsPlaying(false);
    };

    return (
        <div
            className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6">
            <div className="max-w-7xl mx-auto">
                <h1
                    className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-400 mb-8 text-center"
                    style={{
                        fontSize: "24px"
                    }}>波的叠加和驻波演示
                                                </h1>
                {}
                <div
                    className="bg-slate-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-2xl mb-8 border border-slate-700">
                    <canvas
                        ref={canvasRef}
                        width={1000}
                        height={400}
                        className="w-full rounded-lg shadow-lg" />
                    {}
                    <div className="flex justify-center gap-4 mt-6">
                        <button
                            onClick={() => setIsPlaying(!isPlaying)}
                            className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-semibold text-lg shadow-lg transition-all transform hover:scale-105">
                            {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                            {isPlaying ? "暂停" : "开始"}
                        </button>
                        <button
                            onClick={reset}
                            className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white rounded-xl font-semibold text-lg shadow-lg transition-all transform hover:scale-105">
                            <RotateCcw size={24} />复位
                                                                    </button>
                    </div>
                </div>
                {}
                <div className="grid md:grid-cols-2 gap-8">
                    {}
                    <div
                        className="bg-gradient-to-br from-cyan-900/40 to-slate-800/60 backdrop-blur-xl rounded-2xl p-8 border-2 border-cyan-500/30 shadow-xl">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-5 h-5 bg-cyan-400 rounded-full shadow-lg shadow-cyan-400/50"></div>
                            <h2
                                className="text-3xl font-bold text-cyan-300"
                                style={{
                                    fontSize: "18px"
                                }}>左侧波源参数</h2>
                        </div>
                        <div className="space-y-6">
                            <div>
                                <div className="flex justify-between items-center mb-3">
                                    <label
                                        className="text-white font-semibold text-lg"
                                        style={{
                                            fontSize: "14px"
                                        }}>振幅 A</label>
                                    <span
                                        className="text-cyan-300 font-mono text-lg bg-slate-900/50 px-3 py-1 rounded">{leftAmplitude}</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={leftAmplitude}
                                    onChange={e => setLeftAmplitude(Number(e.target.value))}
                                    className="w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer slider-cyan" />
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-3">
                                    <label
                                        className="text-white font-semibold text-lg"
                                        style={{
                                            fontSize: "14px"
                                        }}>波长 λ</label>
                                    <span
                                        className="text-cyan-300 font-mono text-lg bg-slate-900/50 px-3 py-1 rounded">{leftWavelength}</span>
                                </div>
                                <input
                                    type="range"
                                    min="30"
                                    max="300"
                                    value={leftWavelength}
                                    onChange={e => setLeftWavelength(Number(e.target.value))}
                                    className="w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer slider-cyan" />
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-3">
                                    <label
                                        className="text-white font-semibold text-lg"
                                        style={{
                                            fontSize: "14px"
                                        }}>初相位 φ</label>
                                    <span
                                        className="text-cyan-300 font-mono text-lg bg-slate-900/50 px-3 py-1 rounded">{(leftPhase / Math.PI).toFixed(2)}π</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max={2 * Math.PI}
                                    step="0.1"
                                    value={leftPhase}
                                    onChange={e => setLeftPhase(Number(e.target.value))}
                                    className="w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer slider-cyan" />
                            </div>
                        </div>
                    </div>
                    {}
                    <div
                        className="bg-gradient-to-br from-pink-900/40 to-slate-800/60 backdrop-blur-xl rounded-2xl p-8 border-2 border-pink-500/30 shadow-xl">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-5 h-5 bg-pink-400 rounded-full shadow-lg shadow-pink-400/50"></div>
                            <h2
                                className="text-3xl font-bold text-pink-300"
                                style={{
                                    fontSize: "18px"
                                }}>右侧波源参数</h2>
                        </div>
                        <div className="space-y-6">
                            <div>
                                <div className="flex justify-between items-center mb-3">
                                    <label
                                        className="text-white font-semibold text-lg"
                                        style={{
                                            fontSize: "14px"
                                        }}>振幅 A</label>
                                    <span
                                        className="text-pink-300 font-mono text-lg bg-slate-900/50 px-3 py-1 rounded">{rightAmplitude}</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={rightAmplitude}
                                    onChange={e => setRightAmplitude(Number(e.target.value))}
                                    className="w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer slider-pink" />
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-3">
                                    <label
                                        className="text-white font-semibold text-lg"
                                        style={{
                                            fontSize: "14px"
                                        }}>波长 λ</label>
                                    <span
                                        className="text-pink-300 font-mono text-lg bg-slate-900/50 px-3 py-1 rounded">{rightWavelength}</span>
                                </div>
                                <input
                                    type="range"
                                    min="30"
                                    max="300"
                                    value={rightWavelength}
                                    onChange={e => setRightWavelength(Number(e.target.value))}
                                    className="w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer slider-pink" />
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-3">
                                    <label
                                        className="text-white font-semibold text-lg"
                                        style={{
                                            fontSize: "14px"
                                        }}>初相位 φ</label>
                                    <span
                                        className="text-pink-300 font-mono text-lg bg-slate-900/50 px-3 py-1 rounded">{(rightPhase / Math.PI).toFixed(2)}π</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max={2 * Math.PI}
                                    step="0.1"
                                    value={rightPhase}
                                    onChange={e => setRightPhase(Number(e.target.value))}
                                    className="w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer slider-pink" />
                            </div>
                        </div>
                    </div>
                </div>
                {}
                <div
                    className="mt-8 bg-gradient-to-r from-yellow-900/30 to-amber-900/30 backdrop-blur-xl rounded-xl p-6 border border-yellow-500/30">
                    <div className="flex items-start gap-3">
                        <div className="w-4 h-4 bg-yellow-400 rounded-full mt-1 flex-shrink-0"></div>
                        <div>
                            <p className="text-yellow-100 text-lg font-semibold mb-2">金色曲线为叠加波（仅在两波相遇区域显示）</p>
                            <p className="text-yellow-200/80">💡 提示：波速恒定为 v = 10，频率由 f = v / λ 自动计算。将两个波源的波长设置为相同值，可观察到驻波现象</p>
                        </div>
                    </div>
                </div>
            </div>
            <style>{`
        input[type="range"].slider-cyan::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          background: #06b6d4;
          cursor: pointer;
          border-radius: 50%;
          box-shadow: 0 0 10px rgba(6, 182, 212, 0.5);
        }
        
        input[type="range"].slider-pink::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          background: #ec4899;
          cursor: pointer;
          border-radius: 50%;
          box-shadow: 0 0 10px rgba(236, 72, 153, 0.5);
        }
        
        input[type="range"]::-moz-range-thumb {
          width: 20px;
          height: 20px;
          background: #06b6d4;
          cursor: pointer;
          border-radius: 50%;
          border: none;
        }
      `}</style>
        </div>
    );
}