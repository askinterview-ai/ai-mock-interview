"use client"
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import React, { useEffect, useState, useRef } from 'react'
import Webcam from 'react-webcam'
import useSpeechToText from 'react-hook-speech-to-text'
import { Mic, StopCircle } from 'lucide-react'
import { toast } from 'sonner'
import { chatSession } from '@/utils/GeminiAIModal'
import { db } from '@/utils/db'
import { UserAnswer } from '@/utils/schema'
import { useUser } from '@clerk/nextjs'
import moment from 'moment'

function RecordAnswerSection({ mockInterviewQuestion, activeQuestionIndex, interviewData }) {
  const [userAnswer, setUserAnswer] = useState('')
  const { user } = useUser()
  const [loading, setLoading] = useState(false)
  const isRecordingRef = useRef(false)

  const {
    error,
    interimResult,
    isRecording,
    results,
    startSpeechToText,
    stopSpeechToText,
    setResults
  } = useSpeechToText({
    continuous: false,
    useLegacyResults: false
  })

  // Update the user answer when new results come in
  useEffect(() => {
    if (results && results.length > 0) {
      const combinedResult = results.map((result) => result?.transcript).join(' ')
      setUserAnswer((prevAns) => prevAns + combinedResult)
    }
  }, [results])

  // Update user answer when recording stops
  useEffect(() => {
    if (!isRecording && userAnswer?.length > 10) {
      UpdateUserAnswer()
    }
  }, [isRecording])

  // Function to handle start and stop recording
  const StartStopRecording = async () => {
    if (isRecordingRef.current) {
      stopSpeechToText()
      isRecordingRef.current = false
    } else {
      setUserAnswer('') // Clear previous answer
      setResults([]) // Clear previous results
      startSpeechToText()
      isRecordingRef.current = true
    }
  }

  // Function to update the user's answer
  const UpdateUserAnswer = async () => {
    if (loading) return
    setLoading(true)

    try {
      const feedbackPrompt = `
        Question: ${mockInterviewQuestion[activeQuestionIndex]?.question}
        User Answer: ${userAnswer}
        Based on the question and user answer, please provide:
        - A rating for the answer (out of 10)
        - Feedback for improvement (in 3 to 5 lines)
        Output should be in JSON format with "rating" and "feedback" fields.
      `

      const result = await chatSession.sendMessage(feedbackPrompt)
      const mockJsonResp = result.response.text().replace('```json', '').replace('```', '')
      const JsonFeedbackResp = JSON.parse(mockJsonResp)

      const resp = await db.insert(UserAnswer).values({
        mockIdRef: interviewData?.mockId,
        question: mockInterviewQuestion[activeQuestionIndex]?.question,
        correctAns: mockInterviewQuestion[activeQuestionIndex]?.answer,
        userAns: userAnswer,
        feedback: JsonFeedbackResp?.feedback,
        rating: JsonFeedbackResp?.rating,
        userEmail: user?.primaryEmailAddress?.emailAddress,
        createdAt: moment().format('DD-MM-yyyy')
      })

      if (resp) {
        toast('User Answer recorded successfully')
        setUserAnswer('')
        setResults([])
      }
    } catch (error) {
      console.error('Failed to update user answer:', error)
      toast.error('Failed to update answer')
    }

    setLoading(false)
  }

  return (
    <div className="flex items-center justify-center flex-col">
      {/* Webcam Section */}
      <div className="flex flex-col mt-20 justify-center items-center bg-black rounded-lg p-5">
        <Image src={'/webcam.png'} width={200} height={200} className="absolute" alt="Webcam" />
        <Webcam
          mirrored={true}
          style={{
            height: 500,
            width: 500,
            zIndex: 10,
          }}
        />
      </div>

      {/* Start/Stop Button */}
      <Button
        disabled={loading}
        variant="outline"
        className="my-10"
        onClick={StartStopRecording}
      >
        {isRecording ? (
          <h2 className="text-red-600 animate-pulse flex gap-2 items-center">
            <StopCircle /> Stop Recording
          </h2>
        ) : (
          <h2 className="text-primary flex gap-2 items-center">
            <Mic /> Record Answer
          </h2>
        )}
      </Button>
    </div>
  )
}

export default RecordAnswerSection
