import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log('[validate-selfie] Incoming request')
    const formData = await request.formData()
    // Log keys present in the form data
    const keys: string[] = []
    for (const key of formData.keys()) keys.push(key)
    console.log('[validate-selfie] form keys =', keys)
    const image = formData.get("image")
    if (image && (image as any).size) {
      console.log('[validate-selfie] received image size=', (image as any).size, 'type=', (image as any).type || 'unknown')
    }
    
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
  console.log('[validate-selfie] env: appId=', appId, 'appKey(masked)=', maskedAppKey, 'region=', region)
    
    if (!appId || !appKey) {
      return NextResponse.json(
        { error: "HyperVerge credentials not configured" },
        { status: 500 }
      )
    }

    // Generate a unique transaction ID
  const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  console.log('[validate-selfie] using transactionId=', transactionId)

    // Prepare the form data for HyperVerge API
    const hypervergeFormData = new FormData()
    hypervergeFormData.append("image", image)
    hypervergeFormData.append("returnCroppedImageURL", "yes")
    hypervergeFormData.append("qualityChecks.blur", "yes")
    hypervergeFormData.append("qualityChecks.eyesClosed", "yes")
    hypervergeFormData.append("qualityChecks.occlusion", "yes")
    hypervergeFormData.append("qualityChecks.multipleFaces", "yes")

    // Call HyperVerge Selfie Validation API
    const forwardUrl = `https://${region}.idv.hyperverge.co/v1/checkLiveness`
    console.log('[validate-selfie] forwarding to', forwardUrl)
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
    console.log('[validate-selfie] hyperverge status=', response.status, 'summary=', {
      status: data.status, statusCode: data.statusCode, transactionId: data.metadata?.transactionId, action: data.result?.summary?.action
    })

    if (!response.ok) {
      console.error('[validate-selfie] hyperverge error body=', JSON.stringify(data).slice(0, 2000))
      return NextResponse.json(
        { error: data.error || "Selfie validation failed", details: data },
        { status: response.status }
      )
    }

    // Attach the transactionId we created if the provider didn't echo it
    if (!data.metadata) data.metadata = {}
    if (!data.metadata.transactionId) data.metadata.transactionId = transactionId

    console.log('[validate-selfie] returning success to client transactionId=', data.metadata.transactionId)
    return NextResponse.json(data)
  } catch (error) {
    console.error("Selfie validation error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
