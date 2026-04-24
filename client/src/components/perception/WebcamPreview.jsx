import { useEffect, useRef, useState, useCallback } from 'react'
import useFaceMesh from '@/hooks/useFaceMesh'
import usePerceptionStore from '@/store/usePerceptionStore'
import EmotionBadge from './EmotionBadge'
import GazeIndicator from './GazeIndicator'

export default function WebcamPreview({ isActive = false }) {
  const videoRef = useRef(null)
  const [stream, setStream] = useState(null)
  const [cameraError, setCameraError] = useState(null)
  const [hasPermission, setHasPermission] = useState(false)

  const { canvasRef, emotion, gaze, fps, isReady } = useFaceMesh(videoRef, hasPermission && isActive)
  const updatePerception = usePerceptionStore((s) => s.updatePerception)
  const setPerceptionReady = usePerceptionStore((s) => s.setPerceptionReady)

  // Sync perception to store
  useEffect(() => {
    if (isReady) {
      updatePerception({ emotion, gaze, confidence: 1.0 })
      setPerceptionReady(true)
    }
  }, [emotion, gaze, isReady, updatePerception, setPerceptionReady])

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user', frameRate: { ideal: 30 } },
        audio: false,
      })
      setStream(mediaStream)
      setHasPermission(true)
      setCameraError(null)
    } catch (err) {
      const msg = err.name === 'NotAllowedError'
        ? 'Camera permission denied'
        : err.name === 'NotFoundError'
        ? 'No camera found'
        : 'Camera unavailable'
      setCameraError(msg)
    }
  }, [])

  // Assign stream to video element
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  // Start camera when active
  useEffect(() => {
    if (isActive && !stream && !cameraError) {
      startCamera()
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop())
      }
    }
  }, [isActive]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-3">
      {/* Video preview */}
      <div className="relative rounded-xl overflow-hidden border-2" style={{ borderColor: hasPermission ? 'var(--palm-sky)' : 'var(--palm-border)', background: '#1a1a1a' }}>
        {hasPermission ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full aspect-video object-cover scale-x-[-1]"
            />
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full pointer-events-none"
            />
            {/* Live badge */}
            <span className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-white bg-red-500/80">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              LIVE
            </span>
            {/* FPS */}
            {isReady && (
              <span className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-mono bg-black/40 text-white">
                {fps} FPS
              </span>
            )}
          </>
        ) : (
          <div className="w-full aspect-video flex flex-col items-center justify-center gap-2 p-4 text-center" style={{ background: 'var(--palm-bg)' }}>
            {cameraError ? (
              <>
                <span className="text-2xl">📷</span>
                <p className="text-xs font-medium" style={{ color: 'var(--palm-text-muted)' }}>
                  {cameraError}
                </p>
                <p className="text-[10px]" style={{ color: 'var(--palm-text-muted)' }}>
                  Don't worry, I can still help you! 📚
                </p>
                <button
                  onClick={startCamera}
                  className="text-[10px] px-3 py-1 rounded-full font-medium"
                  style={{ background: 'var(--palm-sky-light)', color: 'var(--palm-sky)' }}
                >
                  Try Again
                </button>
              </>
            ) : (
              <>
                <span className="text-2xl animate-pulse">📷</span>
                <p className="text-xs" style={{ color: 'var(--palm-text-muted)' }}>Starting camera...</p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Perception info */}
      <div className="flex flex-wrap items-center gap-2">
        <EmotionBadge emotion={emotion} />
        <GazeIndicator gaze={gaze} />
      </div>
    </div>
  )
}
