"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Play, Pause, RotateCcw, Bell, Eye, EyeOff, Palette, Clock, Coffee } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// カラーテーマの定義
const colorThemes = {
  default: {
    name: "デフォルト",
    background: "#e2e8f0",
    progress: "#3b82f6",
    text: "#1e293b",
    status: "#64748b",
  },
  pastelBlue: {
    name: "パステルブルー",
    background: "#dbeafe",
    progress: "#93c5fd",
    text: "#1e40af",
    status: "#60a5fa",
  },
  pastelPink: {
    name: "パステルピンク",
    background: "#fce7f3",
    progress: "#f9a8d4",
    text: "#9d174d",
    status: "#ec4899",
  },
  pastelGreen: {
    name: "パステルグリーン",
    background: "#d1fae5",
    progress: "#6ee7b7",
    text: "#065f46",
    status: "#10b981",
  },
  vscode: {
    name: "VSCode",
    background: "#1e1e1e",
    progress: "#007acc",
    text: "#d4d4d4",
    status: "#6a9955",
  },
  dracula: {
    name: "Dracula",
    background: "#282a36",
    progress: "#bd93f9",
    text: "#f8f8f2",
    status: "#ff79c6",
  },
  monokai: {
    name: "Monokai",
    background: "#272822",
    progress: "#f92672",
    text: "#f8f8f2",
    status: "#a6e22e",
  },
  github: {
    name: "GitHub",
    background: "#f6f8fa",
    progress: "#2da44e",
    text: "#24292f",
    status: "#0969da",
  },
}

type ThemeKey = keyof typeof colorThemes

// ポモドーロの状態タイプ
type PomodoroState = "work" | "shortBreak" | "longBreak"

// ポモドーロの設定
interface PomodoroSettings {
  workTime: number // 分
  shortBreakTime: number // 分
  longBreakTime: number // 分
  cycles: number // 長い休憩までのサイクル数
}

export function CircleTimer() {
  const [minutes, setMinutes] = useState(25)
  const [seconds, setSeconds] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [timeLeft, setTimeLeft] = useState(minutes * 60 + seconds)
  const [totalTime, setTotalTime] = useState(minutes * 60 + seconds)
  const [showNotification, setShowNotification] = useState(false)
  const [showTimeDisplay, setShowTimeDisplay] = useState(true)
  const [theme, setTheme] = useState<ThemeKey>("default")

  // ポモドーロ関連の状態
  const [pomodoroMode, setPomodoroMode] = useState(false)
  const [pomodoroState, setPomodoroState] = useState<PomodoroState>("work")
  const [pomodoroSettings, setPomodoroSettings] = useState<PomodoroSettings>({
    workTime: 25,
    shortBreakTime: 5,
    longBreakTime: 15,
    cycles: 4,
  })
  const [currentCycle, setCurrentCycle] = useState(1)
  const [notificationMessage, setNotificationMessage] = useState("タイマーが終了しました！")

  const timerRef = useRef<number | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // 現在のテーマカラー
  const currentTheme = colorThemes[theme]

  // タイマーの初期化
  useEffect(() => {
    if (!isRunning) {
      const newTotalTime = minutes * 60 + seconds
      setTimeLeft(newTotalTime)
      setTotalTime(newTotalTime)
    }
  }, [minutes, seconds, isRunning])

  // ポモドーロモードが変更されたときの処理
  useEffect(() => {
    if (pomodoroMode) {
      // ポモドーロモードが有効になったら、作業時間で初期化
      setMinutes(pomodoroSettings.workTime)
      setSeconds(0)
      setPomodoroState("work")
      setCurrentCycle(1)
    }
  }, [pomodoroMode, pomodoroSettings])

  // タイマーのロジック
  useEffect(() => {
    if (isRunning) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(timerRef.current!)
            setIsRunning(false)

            // ポモドーロモードの場合、次の状態に移行
            if (pomodoroMode) {
              handlePomodoroStateChange()
            }

            setShowNotification(true)
            if (audioRef.current) {
              audioRef.current.play().catch((e) => console.error("音声の再生に失敗しました:", e))
            }
            return 0
          }
          return prevTime - 1
        })
      }, 1000)
    } else if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isRunning, pomodoroMode])

  // ポモドーロの状態変更処理
  const handlePomodoroStateChange = () => {
    if (pomodoroState === "work") {
      // 作業後は、サイクル数に応じて短い休憩か長い休憩に移行
      if (currentCycle >= pomodoroSettings.cycles) {
        // 長い休憩に移行
        setPomodoroState("longBreak")
        setMinutes(pomodoroSettings.longBreakTime)
        setSeconds(0)
        setNotificationMessage("長い休憩の時間です！")
        // 次のセットのために、サイクルをリセット
        setCurrentCycle(1)
      } else {
        // 短い休憩に移行
        setPomodoroState("shortBreak")
        setMinutes(pomodoroSettings.shortBreakTime)
        setSeconds(0)
        setNotificationMessage("短い休憩の時間です！")
        // サイクルを増やす
        setCurrentCycle((prev) => prev + 1)
      }
    } else {
      // 休憩後は作業に移行
      setPomodoroState("work")
      setMinutes(pomodoroSettings.workTime)
      setSeconds(0)
      setNotificationMessage("作業の時間です！")
    }
  }

  // 通知の自動非表示
  useEffect(() => {
    if (showNotification) {
      const timeout = setTimeout(() => {
        setShowNotification(false)
      }, 3000)

      return () => clearTimeout(timeout)
    }
  }, [showNotification])

  // 音声要素の作成
  useEffect(() => {
    audioRef.current = new Audio("/notification.mp3")
    return () => {
      if (audioRef.current) {
        audioRef.current = null
      }
    }
  }, [])

  // タイマーの開始/一時停止
  const toggleTimer = () => {
    setIsRunning(!isRunning)
  }

  // タイマーのリセット
  const resetTimer = () => {
    setIsRunning(false)

    if (pomodoroMode) {
      // ポモドーロモードの場合は、現在の状態に応じた時間にリセット
      if (pomodoroState === "work") {
        setMinutes(pomodoroSettings.workTime)
      } else if (pomodoroState === "shortBreak") {
        setMinutes(pomodoroSettings.shortBreakTime)
      } else {
        setMinutes(pomodoroSettings.longBreakTime)
      }
      setSeconds(0)
    } else {
      setTimeLeft(totalTime)
    }

    setShowNotification(false)
  }

  // 分数の入力ハンドラー
  const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(e.target.value) || 0
    setMinutes(Math.max(0, Math.min(60, value)))
  }

  // 秒数の入力ハンドラー
  const handleSecondsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(e.target.value) || 0
    setSeconds(Math.max(0, Math.min(59, value)))
  }

  // ポモドーロ設定の変更ハンドラー
  const handlePomodoroSettingChange = (setting: keyof PomodoroSettings, value: number) => {
    setPomodoroSettings((prev) => ({
      ...prev,
      [setting]: value,
    }))
  }

  // 残り時間の表示形式
  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60)
    const secs = time % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  // 円グラフの進行度
  const progress = timeLeft / totalTime
  const circumference = 2 * Math.PI * 35
  const strokeDashoffset = circumference * (1 - progress)

  // テーマに基づいた背景色クラスを取得
  const getBackgroundClass = () => {
    // VSCode、Dracula、Monokaiテーマの場合は暗い背景
    if (["vscode", "dracula", "monokai"].includes(theme)) {
      return "bg-gray-900"
    }
    return "bg-gray-50"
  }

  // テーマに基づいたテキスト色クラスを取得
  const getTextClass = () => {
    // VSCode、Dracula、Monokaiテーマの場合は明るいテキスト
    if (["vscode", "dracula", "monokai"].includes(theme)) {
      return "text-gray-100"
    }
    return "text-gray-900"
  }

  // ポモドーロの状態に応じた色を取得
  const getPomodoroColor = () => {
    if (!pomodoroMode) return currentTheme.progress

    switch (pomodoroState) {
      case "work":
        return "#ef4444" // 赤色（作業中）
      case "shortBreak":
        return "#22c55e" // 緑色（短い休憩）
      case "longBreak":
        return "#3b82f6" // 青色（長い休憩）
      default:
        return currentTheme.progress
    }
  }

  // ポモドーロの状態テキスト
  const getPomodoroStateText = () => {
    if (!pomodoroMode) return isRunning ? "実行中" : "停止中"

    switch (pomodoroState) {
      case "work":
        return `作業中 (${currentCycle}/${pomodoroSettings.cycles})`
      case "shortBreak":
        return "短い休憩中"
      case "longBreak":
        return "長い休憩中"
      default:
        return ""
    }
  }

  return (
    <div className={cn("flex flex-col items-center space-y-6 p-6 rounded-lg transition-colors", getBackgroundClass())}>
      {/* 上部コントロール */}
      <div className="flex justify-between w-full">
        <div className="flex items-center space-x-2">
          <Switch id="pomodoro-mode" checked={pomodoroMode} onCheckedChange={setPomodoroMode} />
          <Label htmlFor="pomodoro-mode" className={getTextClass()}>
            ポモドーロモード
          </Label>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className={getTextClass()}>
              <Palette className="h-5 w-5" />
              <span className="sr-only">テーマを変更</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {Object.entries(colorThemes).map(([key, value]) => (
              <DropdownMenuItem key={key} onClick={() => setTheme(key as ThemeKey)} className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: value.progress }} />
                {value.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 残り時間表示（円タイマーの上） */}
      {showTimeDisplay && (
        <div className="text-4xl font-bold mb-2" style={{ color: currentTheme.text }}>
          {formatTime(timeLeft)}
        </div>
      )}

      {/* タイマー表示 */}
      <div className="relative w-64 h-64 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          {/* 背景の円 */}
          <circle cx="50" cy="50" r="35" fill="none" stroke={currentTheme.background} strokeWidth="25" />
          {/* 進行状況の円 */}
          <circle
            cx="50"
            cy="50"
            r="35"
            fill="none"
            stroke={pomodoroMode ? getPomodoroColor() : currentTheme.progress}
            strokeWidth="25"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="butt"
            className="transition-all duration-1000 ease-linear"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm" style={{ color: currentTheme.status }}>
            {getPomodoroStateText()}
          </span>
        </div>
      </div>

      {/* タブ切り替え（通常モード / ポモドーロ設定） */}
      <Tabs defaultValue="timer" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="timer" className={getTextClass()}>
            <Clock className="h-4 w-4 mr-2" />
            タイマー
          </TabsTrigger>
          <TabsTrigger value="pomodoro" className={getTextClass()}>
            <Coffee className="h-4 w-4 mr-2" />
            ポモドーロ設定
          </TabsTrigger>
        </TabsList>

        <TabsContent value="timer" className="space-y-4 mt-4">
          {/* タイマー設定 */}
          <div className="grid grid-cols-2 gap-4 w-full">
            <div>
              <Label htmlFor="minutes" className={getTextClass()}>
                分
              </Label>
              <Input
                id="minutes"
                type="number"
                min="0"
                max="60"
                value={minutes}
                onChange={handleMinutesChange}
                disabled={isRunning || pomodoroMode}
                className={cn(getBackgroundClass(), getTextClass(), "border-gray-400")}
              />
            </div>
            <div>
              <Label htmlFor="seconds" className={getTextClass()}>
                秒
              </Label>
              <Input
                id="seconds"
                type="number"
                min="0"
                max="59"
                value={seconds}
                onChange={handleSecondsChange}
                disabled={isRunning || pomodoroMode}
                className={cn(getBackgroundClass(), getTextClass(), "border-gray-400")}
              />
            </div>
          </div>

          {/* コントロールボタン */}
          <div className="flex space-x-4 justify-center">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowTimeDisplay(!showTimeDisplay)}
              aria-label={showTimeDisplay ? "時間を非表示" : "時間を表示"}
              className={getTextClass()}
            >
              {showTimeDisplay ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={toggleTimer}
              aria-label={isRunning ? "一時停止" : "開始"}
              className={getTextClass()}
            >
              {isRunning ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </Button>
            <Button variant="outline" size="icon" onClick={resetTimer} aria-label="リセット" className={getTextClass()}>
              <RotateCcw className="h-5 w-5" />
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="pomodoro" className="space-y-4 mt-4">
          {/* ポモドーロ設定 */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="work-time" className={getTextClass()}>
                作業時間（分）
              </Label>
              <Input
                id="work-time"
                type="number"
                min="1"
                max="60"
                value={pomodoroSettings.workTime}
                onChange={(e) => handlePomodoroSettingChange("workTime", Number.parseInt(e.target.value) || 25)}
                disabled={isRunning && pomodoroMode}
                className={cn(getBackgroundClass(), getTextClass(), "border-gray-400")}
              />
            </div>
            <div>
              <Label htmlFor="short-break" className={getTextClass()}>
                短い休憩（分）
              </Label>
              <Input
                id="short-break"
                type="number"
                min="1"
                max="30"
                value={pomodoroSettings.shortBreakTime}
                onChange={(e) => handlePomodoroSettingChange("shortBreakTime", Number.parseInt(e.target.value) || 5)}
                disabled={isRunning && pomodoroMode}
                className={cn(getBackgroundClass(), getTextClass(), "border-gray-400")}
              />
            </div>
            <div>
              <Label htmlFor="long-break" className={getTextClass()}>
                長い休憩（分）
              </Label>
              <Input
                id="long-break"
                type="number"
                min="1"
                max="60"
                value={pomodoroSettings.longBreakTime}
                onChange={(e) => handlePomodoroSettingChange("longBreakTime", Number.parseInt(e.target.value) || 15)}
                disabled={isRunning && pomodoroMode}
                className={cn(getBackgroundClass(), getTextClass(), "border-gray-400")}
              />
            </div>
            <div>
              <Label htmlFor="cycles" className={getTextClass()}>
                サイクル数（長い休憩までの回数）
              </Label>
              <Input
                id="cycles"
                type="number"
                min="1"
                max="10"
                value={pomodoroSettings.cycles}
                onChange={(e) => handlePomodoroSettingChange("cycles", Number.parseInt(e.target.value) || 4)}
                disabled={isRunning && pomodoroMode}
                className={cn(getBackgroundClass(), getTextClass(), "border-gray-400")}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* 通知 */}
      <div
        className={cn(
          "fixed bottom-4 right-4 bg-white shadow-lg rounded-lg p-4 transition-opacity duration-300 flex items-center space-x-2",
          showNotification ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
      >
        <Bell className="h-5 w-5" style={{ color: pomodoroMode ? getPomodoroColor() : currentTheme.progress }} />
        <span>{notificationMessage}</span>
      </div>
    </div>
  )
}
