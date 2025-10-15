"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/components/ui/use-toast"
import { Camera, Shield, IdCard, CheckCircle2, Upload, Loader2 } from "lucide-react"

type VerificationStep = "idle" | "selfie" | "faceMatch" | "readId" | "complete"

interface StepData {
  selfieImage?: File
  idImage?: File
  results: {
    selfie?: any
    faceMatch?: any
    readId?: any
  }
}

export default function VerificationPage() {
  const [currentStep, setCurrentStep] = useState<VerificationStep>("idle")
  const [loading, setLoading] = useState(false)
  const [stepData, setStepData] = useState<StepData>({ results: {} })
  const { toast } = useToast()
  
  const selfieInputRef = useRef<HTMLInputElement>(null)
  const idInputRef = useRef<HTMLInputElement>(null)

  const getProgress = () => {
    switch (currentStep) {
      case "idle": return 0
      case "selfie": return 33
      case "faceMatch": return 66
      case "readId": return 90
      case "complete": return 100
      default: return 0
    }
  }

  const handleFileSelect = (file: File, type: "selfie" | "id") => {
    if (file.size > 6 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 6MB",
        variant: "destructive",
      })
      return
    }

    if (type === "selfie") {
      setStepData({ ...stepData, selfieImage: file })
    } else {
      setStepData({ ...stepData, idImage: file })
    }
  }

  const startVerification = () => {
    setCurrentStep("selfie")
    toast({
      title: "Verification Started",
      description: "Please upload your selfie to begin.",
    })
  }

  const handleSelfieValidation = async () => {
    if (!stepData.selfieImage) {
      toast({
        title: "Error",
        description: "Please upload a selfie image first.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append("image", stepData.selfieImage)

      const response = await fetch("/api/validate-selfie", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Validation failed")
      }

      setStepData({
        ...stepData,
        results: { ...stepData.results, selfie: data }
      })

      // Check if validation passed
      if (data.result?.details?.liveFace?.value === "yes") {
        toast({
          title: "Selfie Validated ✓",
          description: "Live face detected. Proceeding to face match.",
        })
        setCurrentStep("faceMatch")
      } else {
        toast({
          title: "Validation Failed",
          description: "Liveness check failed. Please try again with a clear selfie.",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "Validation Failed",
        description: error.message || "Failed to validate selfie. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleFaceMatch = async () => {
    if (!stepData.idImage) {
      toast({
        title: "Error",
        description: "Please upload your ID card image.",
        variant: "destructive",
      })
      return
    }

    if (!stepData.selfieImage) {
      toast({
        title: "Error",
        description: "Selfie image is missing. Please restart verification.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append("selfie", stepData.selfieImage)
      formData.append("id", stepData.idImage)

      const response = await fetch("/api/match-face", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Face match failed")
      }

      setStepData({
        ...stepData,
        results: { ...stepData.results, faceMatch: data }
      })

      // Check if face match passed
      if (data.result?.details?.match?.value === "yes") {
        toast({
          title: "Face Match Successful ✓",
          description: "Face matches with ID. Proceeding to ID verification.",
        })
        setCurrentStep("readId")
      } else {
        toast({
          title: "Match Failed",
          description: "Face does not match with ID. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "Match Failed",
        description: error.message || "Face match failed. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleReadId = async () => {
    if (!stepData.idImage) {
      toast({
        title: "Error",
        description: "ID image is missing.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append("image", stepData.idImage)
      // You can add these as form fields in the UI if needed
      formData.append("countryId", "IND")
      formData.append("documentId", "PAN")

      const response = await fetch("/api/read-id", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "ID reading failed")
      }

      setStepData({
        ...stepData,
        results: { ...stepData.results, readId: data }
      })

      toast({
        title: "Verification Complete! 🎉",
        description: "All steps completed successfully.",
      })
      
      setCurrentStep("complete")
    } catch (error: any) {
      toast({
        title: "ID Reading Failed",
        description: error.message || "Failed to read ID. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const resetVerification = () => {
    setCurrentStep("idle")
    setStepData({ results: {} })
    if (selfieInputRef.current) selfieInputRef.current.value = ""
    if (idInputRef.current) idInputRef.current.value = ""
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            HyperVerge Verification
          </h1>
          <p className="text-gray-600">
            Complete identity verification in three simple steps
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <Progress value={getProgress()} className="h-3" />
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            <span className={currentStep !== "idle" ? "font-semibold text-blue-600" : ""}>
              Start
            </span>
            <span className={currentStep === "selfie" ? "font-semibold text-blue-600" : ""}>
              Selfie
            </span>
            <span className={currentStep === "faceMatch" ? "font-semibold text-blue-600" : ""}>
              Face Match
            </span>
            <span className={currentStep === "readId" ? "font-semibold text-blue-600" : ""}>
              ID Verification
            </span>
            <span className={currentStep === "complete" ? "font-semibold text-green-600" : ""}>
              Complete
            </span>
          </div>
        </div>

        {/* Main Content */}
        {currentStep === "idle" && (
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Shield className="h-6 w-6 text-blue-600" />
                Welcome to Identity Verification
              </CardTitle>
              <CardDescription>
                We'll verify your identity through three quick steps: selfie validation, face matching, and ID card verification.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                  <Camera className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold">Step 1: Selfie Validation</h3>
                    <p className="text-sm text-gray-600">Capture a live selfie for liveness detection</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg">
                  <Shield className="h-5 w-5 text-purple-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold">Step 2: Face Match</h3>
                    <p className="text-sm text-gray-600">Match your selfie with your ID photo</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
                  <IdCard className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold">Step 3: ID Verification</h3>
                    <p className="text-sm text-gray-600">Extract and verify information from your ID</p>
                  </div>
                </div>
              </div>
              <Button onClick={startVerification} className="w-full" size="lg">
                Start Verification
              </Button>
            </CardContent>
          </Card>
        )}

        {currentStep === "selfie" && (
          <Card className="border-2 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-6 w-6 text-blue-600" />
                Step 1: Selfie Validation
              </CardTitle>
              <CardDescription>
                Upload a clear selfie for liveness detection
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <input
                  ref={selfieInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0], "selfie")}
                  className="hidden"
                  id="selfie-upload"
                />
                <label htmlFor="selfie-upload" className="cursor-pointer">
                  <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-sm text-gray-600 mb-2">
                    {stepData.selfieImage ? stepData.selfieImage.name : "Click to upload selfie"}
                  </p>
                  <p className="text-xs text-gray-500">PNG, JPG or JPEG (max. 6MB)</p>
                </label>
              </div>
              <Button 
                onClick={handleSelfieValidation} 
                disabled={!stepData.selfieImage || loading}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Validating...
                  </>
                ) : (
                  "Validate Selfie"
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {currentStep === "faceMatch" && (
          <Card className="border-2 border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-6 w-6 text-purple-600" />
                Step 2: Face Match
              </CardTitle>
              <CardDescription>
                Upload your ID card for face matching
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="text-sm text-green-700">Selfie validated successfully</span>
              </div>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <input
                  ref={idInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0], "id")}
                  className="hidden"
                  id="id-upload"
                />
                <label htmlFor="id-upload" className="cursor-pointer">
                  <IdCard className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-sm text-gray-600 mb-2">
                    {stepData.idImage ? stepData.idImage.name : "Click to upload ID card"}
                  </p>
                  <p className="text-xs text-gray-500">PNG, JPG or JPEG (max. 6MB)</p>
                </label>
              </div>
              <Button 
                onClick={handleFaceMatch} 
                disabled={!stepData.idImage || loading}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Matching...
                  </>
                ) : (
                  "Match Face"
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {currentStep === "readId" && (
          <Card className="border-2 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IdCard className="h-6 w-6 text-green-600" />
                Step 3: ID Verification
              </CardTitle>
              <CardDescription>
                Extracting information from your ID card
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="text-sm text-green-700">Selfie validated successfully</span>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="text-sm text-green-700">Face match successful</span>
                </div>
              </div>
              <Button 
                onClick={handleReadId} 
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Reading ID...
                  </>
                ) : (
                  "Verify ID"
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {currentStep === "complete" && (
          <Card className="border-2 border-green-300 bg-gradient-to-br from-green-50 to-emerald-50">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2 text-green-700">
                <CheckCircle2 className="h-8 w-8" />
                Verification Complete!
              </CardTitle>
              <CardDescription>
                All verification steps completed successfully
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-white rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-lg mb-3">Verification Results:</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Liveness Check: Passed</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Face Match: Confirmed (Score: {stepData.results.faceMatch?.result?.details?.match?.score || "N/A"})</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>ID Verification: Complete</span>
                  </div>
                </div>
                {stepData.results.readId?.result?.details?.[0]?.fieldsExtracted && (
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="font-semibold mb-2">Extracted Information:</h4>
                    <div className="space-y-1 text-sm text-gray-700">
                      {Object.entries(stepData.results.readId.result.details[0].fieldsExtracted).map(([key, value]: [string, any]) => (
                        value?.value && (
                          <p key={key}>
                            <strong className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</strong> {value.value}
                          </p>
                        )
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <Button onClick={resetVerification} variant="outline" className="w-full" size="lg">
                Start New Verification
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
