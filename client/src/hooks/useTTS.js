import { useRef, useCallback, useState } from 'react'

/**
 * TTS audio playback hook.
 *
 * Queues audio blobs/URLs and plays them sequentially.
 * Exposes isPlaying state for UI (waveform animation on avatar).
 */
export default function useTTS() {
  const [isPlaying, setIsPlaying] = useState(false)
  const queueRef = useRef([])
  const currentAudioRef = useRef(null)
  const playingRef = useRef(false)

  const playNext = useCallback(() => {
    if (queueRef.current.length === 0) {
      playingRef.current = false
      setIsPlaying(false)
      return
    }

    playingRef.current = true
    setIsPlaying(true)
    const src = queueRef.current.shift()

    const audio = new Audio(src)
    currentAudioRef.current = audio

    audio.onended = () => {
      currentAudioRef.current = null
      playNext()
    }

    audio.onerror = () => {
      currentAudioRef.current = null
      playNext()
    }

    audio.play().catch(() => {
      // Autoplay blocked — continue
      currentAudioRef.current = null
      playNext()
    })
  }, [])

  /**
   * Enqueue an audio source (URL or base64 data URI) for playback.
   */
  const enqueue = useCallback((src) => {
    if (!src) return
    queueRef.current.push(src)
    if (!playingRef.current) {
      playNext()
    }
  }, [playNext])

  /**
   * Enqueue a base64-encoded audio blob.
   */
  const enqueueBase64 = useCallback((base64, mimeType = 'audio/mpeg') => {
    const dataUri = `data:${mimeType};base64,${base64}`
    enqueue(dataUri)
  }, [enqueue])

  const stop = useCallback(() => {
    queueRef.current = []
    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
      currentAudioRef.current = null
    }
    playingRef.current = false
    setIsPlaying(false)
  }, [])

  return { isPlaying, enqueue, enqueueBase64, stop }
}
