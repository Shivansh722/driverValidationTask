import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const image = formData.get("image")
    const countryId = formData.get("countryId") || "IND"
    const documentId = formData.get("documentId") || "PAN"
    const expectedDocumentSide = formData.get("expectedDocumentSide")
    
    if (!image) {
      return NextResponse.json(
        { error: "No image provided" },
        { status: 400 }
      )
    }

    // Get credentials from environment variables
    const appId = process.env.HYPERVERGE_APP_ID
    const appKey = process.env.HYPERVERGE_APP_KEY
    const region = process.env.HYPERVERGE_REGION || "ind"
    
    if (!appId || !appKey) {
      return NextResponse.json(
        { error: "HyperVerge credentials not configured" },
        { status: 500 }
      )
    }

    // Generate a unique transaction ID
    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Prepare the form data for HyperVerge API
    const hypervergeFormData = new FormData()
    hypervergeFormData.append("image", image)
    hypervergeFormData.append("countryId", countryId as string)
    hypervergeFormData.append("documentId", documentId as string)
    
    if (expectedDocumentSide) {
      hypervergeFormData.append("expectedDocumentSide", expectedDocumentSide as string)
    }

    // Call HyperVerge Read ID API
    const response = await fetch(
      `https://${region}.idv.hyperverge.co/v1/readId`,
      {
        method: "POST",
        headers: {
          appId: appId,
          appKey: appKey,
          transactionId: transactionId,
        },
        body: hypervergeFormData,
      }
    )

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || "ID reading failed", details: data },
        { status: response.status }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Read ID error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
