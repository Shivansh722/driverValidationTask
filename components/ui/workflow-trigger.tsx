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
    }
    HyperKycConfig?: new (
      jwtToken: string,
      workflowID?: string,
      transactionID?: string,
      showLandingPage?: boolean
    ) => any
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
      // Check if HyperKYC SDK is loaded
      if (!window.HyperKYCModule || !window.HyperKycConfig) {
        throw new Error("HyperKYC SDK not loaded. Please refresh the page and try again.")
      }

      // Mock configuration for demo purposes
      const mockJwtToken = "mock-jwt-token-for-demo"
      const mockWorkflowID = "demo-workflow-id"
      const mockTransactionID = `txn-${Date.now()}`

      // Create HyperKYC configuration
      const hyperKycConfig = new window.HyperKycConfig(
        mockJwtToken,
        mockWorkflowID,
        mockTransactionID,
        true // Show landing page
      )

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

      // Launch the workflow
      await window.HyperKYCModule.launch(hyperKycConfig, handleWorkflowResult)

      toast({
        title: "Workflow Launched",
        description: "HyperKYC verification workflow has been started.",
      })

    } catch (error: any) {
      console.error("Failed to launch HyperKYC workflow:", error)
      toast({
        title: "Launch Failed",
        description: error.message || "Failed to launch verification workflow.",
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
          Mock setup - No real workflow ID required
        </p>
      </CardContent>
    </Card>
  )
}