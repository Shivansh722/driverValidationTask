import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log('[read-id] Incoming request')
    const formData = await request.formData()
    const keys: string[] = []
    for (const key of formData.keys()) keys.push(key)
    console.log('[read-id] form keys =', keys)
    const image = formData.get("image")
    const countryId = formData.get("countryId") || "IND"
    const documentId = formData.get("documentId") || "PAN"
    const expectedDocumentSide = formData.get("expectedDocumentSide")
    if (image && (image as any).size) console.log('[read-id] image size=', (image as any).size)
    
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
  const maskedAppKey = appKey ? appKey.replace(/.(?=.{4})/g, '*') : undefined
  console.log('[read-id] env: appId=', appId, 'appKey(masked)=', maskedAppKey, 'region=', region)
    
    if (!appId || !appKey) {
      return NextResponse.json(
        { error: "HyperVerge credentials not configured" },
        { status: 500 }
      )
    }

    // Generate a unique transaction ID
  const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  console.log('[read-id] using transactionId=', transactionId)

    // Prepare the form data for HyperVerge API
    const hypervergeFormData = new FormData()
    hypervergeFormData.append("image", image)
    hypervergeFormData.append("countryId", countryId as string)
    hypervergeFormData.append("documentId", documentId as string)
    
    if (expectedDocumentSide) {
      hypervergeFormData.append("expectedDocumentSide", expectedDocumentSide as string)
    }

    // Call HyperVerge Read ID API
    const forwardUrl = `https://${region}.idv.hyperverge.co/v1/readId`
    console.log('[read-id] forwarding to', forwardUrl)
    const response = await fetch(forwardUrl, {
      method: "POST",
      headers: {
        appId: appId,
        appKey: appKey,
        transactionId: transactionId,
      },
      body: hypervergeFormData,
    })

    const data = await response.json()
    console.log('[read-id] hyperverge status=', response.status, 'summary=', { status: data.status, statusCode: data.statusCode, transactionId: data.metadata?.transactionId })

    if (!response.ok) {
      console.error('[read-id] hyperverge error body=', JSON.stringify(data).slice(0, 2000))
      return NextResponse.json(
        { error: data.error || "ID reading failed", details: data },
        { status: response.status }
      )
    }

    if (!data.metadata) data.metadata = {}
    if (!data.metadata.transactionId) data.metadata.transactionId = transactionId

    return NextResponse.json(data)
  } catch (error) {
    console.error("Read ID error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
