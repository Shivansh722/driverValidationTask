"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Workflow, Loader2 } from "lucide-react"

// Extend global Window interface to include HyperKYC types
declare global {
  interface Window {
    HyperKYCModule?: {
      launch: (config: any, callback: (result: any) => void) => Promise<void>
      version?: string // Add version property to fix TypeScript error
    }
    HyperKycConfig?: {
      // Option 1: Pass token, workflowID, transactionID, and landing page flag
      new (token: string, workflowID: string, transactionID: string, showLandingPage?: boolean): any
      // Option 2: Pass only token (with workflowID and transactionID in payload) and landing page flag
      new (token: string, showLandingPage?: boolean): any
    }
  }
}

interface WorkflowTriggerProps {
  className?: string
}

export default function WorkflowTrigger({ className = "" }: WorkflowTriggerProps) {
  const [isLaunching, setIsLaunching] = useState(false)
  const { toast } = useToast()

  const handleWorkflowLaunch = async () => {
    setIsLaunching(true)

    try {
      // Wait for SDK to be fully loaded
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Check if SDK is loaded
      if (!window.HyperKYCModule) {
        throw new Error("HyperKYC SDK not loaded. Please refresh the page and try again.")
      }

      // Generate a unique transaction ID
      const transactionID = `txn-${Date.now()}`
      const workflowID = "shivanch_test_workflow"

      // Generate JWT token from backend
      toast({
        title: "Generating Token",
        description: "Creating secure authentication token...",
      })

      console.log('🔄 Generating JWT for:', { workflowID, transactionID })
      const jwtResponse = await fetch("/api/generate-jwt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workflowId: workflowID,
          transactionId: transactionID,
        }),
      })

      if (!jwtResponse.ok) {
        const errorData = await jwtResponse.json()
        throw new Error(errorData.error || "Failed to generate authentication token")
      }

      const { token } = await jwtResponse.json()
      console.log('✅ JWT Generated successfully')
      
      // Decode and log JWT payload for debugging
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        console.log('🔍 JWT Payload:', JSON.parse(jsonPayload));
      } catch (e) {
        console.error('Error decoding JWT:', e);
      }
      
      // Try using the HyperKycConfig constructor as defined in the interface
      console.log('🔧 SDK Version:', window.HyperKYCModule?.version || 'Unknown')
      console.log('🌐 Window Location:', window.location.href)
      
      // Check if HyperKycConfig constructor exists
      if (!window.HyperKycConfig) {
        console.warn('⚠️ HyperKycConfig constructor not found, falling back to direct object')
        
        // Create a direct configuration object as fallback
        const configObject = {
          token: token,
          showLandingPage: true,
          countries: ["IND", "USA", "GBR", "SGP"],
          appId: "demo",
          workflowID: workflowID,
          transactionID: transactionID,
          region: "ind",
          moduleConfig: {
            baseUrl: "https://ind-docs.hyperverge.co/v1",
            workflowsPath: "/workflows",
            configPath: "/config",
            debug: true
          },
          disableSentry: true,
          onModuleEvent: (event: { type: string; data?: any }) => {
            console.log('📊 SDK Module Event:', event);
          }
        }
        
        console.log('📝 Using direct config object:', configObject)
        
        // Define callback handler
        const handleWorkflowResult = (result: any) => {
          console.log("HyperKYC Workflow Result:", result)
          
          switch (result.status) {
            case "user_cancelled":
              toast({
                title: "Workflow Cancelled",
                description: "User cancelled the verification workflow.",
                variant: "default",
              })
              break
            case "error":
              toast({
                title: "Workflow Error",
                description: "An error occurred during the workflow.",
                variant: "destructive",
              })
              break
            case "auto_approved":
              toast({
                title: "Verification Approved ✓",
                description: "User verification completed successfully.",
                variant: "default",
              })
              break
            case "auto_declined":
              toast({
                title: "Verification Declined",
                description: "Workflow was automatically declined.",
                variant: "destructive",
              })
              break
            case "needs_review":
              toast({
                title: "Manual Review Required",
                description: "Workflow needs manual review.",
                variant: "default",
              })
              break
            default:
              toast({
                title: "Unknown Status",
                description: `Received unknown status: ${result.status}`,
                variant: "default",
              })
              break
          }
          
          setIsLaunching(false)
        }

        toast({
          title: "Launching Workflow",
          description: "Starting HyperKYC verification...",
        })

        // Launch the workflow with direct object
        await window.HyperKYCModule.launch(configObject, handleWorkflowResult)
        console.log('✅ HyperKYCModule.launch completed successfully')
      } else {
        console.log('✅ Using HyperKycConfig constructor')
        
        // Option 1: Pass token, workflowID, transactionID, and landing page flag
        const config = new window.HyperKycConfig(token, workflowID, transactionID, true)
        console.log('📝 Created config using constructor:', config)
        
        // Define callback handler
        const handleWorkflowResult = (result: any) => {
          console.log("HyperKYC Workflow Result:", result)
          
          switch (result.status) {
            case "user_cancelled":
              toast({
                title: "Workflow Cancelled",
                description: "User cancelled the verification workflow.",
                variant: "default",
              })
              break
            case "error":
              toast({
                title: "Workflow Error",
                description: "An error occurred during the workflow.",
                variant: "destructive",
              })
              break
            case "auto_approved":
              toast({
                title: "Verification Approved ✓",
                description: "User verification completed successfully.",
                variant: "default",
              })
              break
            case "auto_declined":
              toast({
                title: "Verification Declined",
                description: "Workflow was automatically declined.",
                variant: "destructive",
              })
              break
            case "needs_review":
              toast({
                title: "Manual Review Required",
                description: "Workflow needs manual review.",
                variant: "default",
              })
              break
            default:
              toast({
                title: "Unknown Status",
                description: `Received unknown status: ${result.status}`,
                variant: "default",
              })
              break
          }
          
          setIsLaunching(false)
        }

        toast({
          title: "Launching Workflow",
          description: "Starting HyperKYC verification...",
        })

        // Launch the workflow with the config object
        await window.HyperKYCModule.launch(config, handleWorkflowResult)
        console.log('✅ HyperKYCModule.launch completed successfully')
      }

    } catch (error: any) {
      console.error("❌ Failed to launch HyperKYC workflow:", error)
      
      // Log detailed error information
      console.error("Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: error.code,
        status: error.status,
        response: error.response
      })
      
      // Check if window.HyperKYCModule exists and log its state
      console.log("HyperKYCModule state:", {
        exists: !!window.HyperKYCModule,
        methods: window.HyperKYCModule ? Object.keys(window.HyperKYCModule) : 'N/A',
        version: window.HyperKYCModule?.version || 'Unknown'
      })
      
      // Provide more specific error messages
      let errorMessage = "Failed to launch verification workflow."
      
      if (error.message?.includes("forEach")) {
        errorMessage = "SDK configuration error. Please check your workflow ID and credentials."
      } else if (error.message?.includes("JWT")) {
        errorMessage = "Authentication token error. Please try again."
      } else if (error.message?.includes("403")) {
        errorMessage = "Access forbidden. Check your appId and credentials."
      } else if (error.message?.includes("404")) {
        errorMessage = "Resource not found. Check workflow path configuration."
      } else if (error.message?.includes("401")) {
        errorMessage = "Unauthorized access. Check your authentication token."
      } else if (error.message) {
        errorMessage = error.message
      }

      toast({
        title: "Launch Failed",
        description: errorMessage,
        variant: "destructive",
      })
      setIsLaunching(false)
    }
  }

  return (
    <Card className={`border-2 border-orange-200 bg-orange-50 ${className}`}>
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Workflow className="h-5 w-5 text-orange-600" />
          HyperKYC Workflow
        </CardTitle>
        <CardDescription>
          Launch the complete HyperKYC verification workflow with a single click
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={handleWorkflowLaunch}
          disabled={isLaunching}
          className="w-full bg-orange-600 hover:bg-orange-700"
          size="lg"
        >
          {isLaunching ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Launching Workflow...
            </>
          ) : (
            <>
              <Workflow className="mr-2 h-4 w-4" />
              Launch HyperKYC Workflow
            </>
          )}
        </Button>
        <p className="text-xs text-gray-500 mt-2 text-center">
          Real Workflow ID: shivanch_test_workflow
        </p>
      </CardContent>
    </Card>
  )
}