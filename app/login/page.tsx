"use client"
import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { ArrowRight, Eye, EyeOff } from 'lucide-react'

export default function LoginInterface() {
  const [username, setUsername] = useState('')
  const [error, setError] = useState("")
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState<'username' | 'password'>('username')

  const handleContinue = async () => {
    if (step === 'username' && username) {
      setStep("password")
    } else if (step === "password" && password) {
      try {
        setIsLoading(true);
        const res = await fetch("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password })
        });
        if (res.ok) {
          location.href = "/";
        } else if (res.status === 404) {
          const reg = await fetch("/api/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
          });
          if (reg.ok) {
            location.href = "/";
          } else {
            const data = await reg.json();
            setError(data.error || "无法注册");
          }
        } else {
          const data = await res.json();
          setError(data.error || "凭证无效");
        }
      } finally {
        setIsLoading(false);
      }
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleContinue()
    }
  }

  const canContinue = step === 'username' ? username.length > 0 : password.length > 0

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm"
      >
        {/* Logo/Title */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-black rounded-2xl mb-6"
          >
            <span className="text-white text-2xl font-medium">CNC</span>
          </motion.div>
          <h1 className="text-2xl font-medium text-gray-900">
            生产日志
          </h1>
          <p className="text-gray-500 mt-2">
            继续进入你的工作区
          </p>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <AnimatePresence mode="wait">
            {step === 'username' ? (
              <motion.div
                key="username"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    用户名
                  </label>
                  <Input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="请输入用户名"
                    className="h-12 px-4 text-base border-gray-200 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 rounded-xl transition-all"
                    autoFocus
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="password"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <button
                    onClick={() => setStep('username')}
                    className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
                  >
                    {username}
                  </button>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    密码
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="请输入密码"
                      className="h-12 px-4 pr-12 text-base border-gray-200 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 rounded-xl transition-all"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Button
              onClick={handleContinue}
              disabled={!canContinue || isLoading}
              className={cn(
                "w-full h-12 rounded-xl font-medium text-base",
                "bg-gray-900 hover:bg-gray-800 text-white",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "transition-all duration-200",
                "shadow-sm hover:shadow-md"
              )}
            >
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                />
              ) : (
                <span className="flex items-center justify-center">
                  继续
                  <ArrowRight className="ml-2 h-4 w-4" />
                </span>
              )}
            </Button>
            {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
          </motion.div>
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center"
        >
          <p className="text-sm text-gray-500">
            第一次使用生产日志?{' '}
            <button className="text-gray-900 font-medium hover:underline">
              创建账号
            </button>
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}
