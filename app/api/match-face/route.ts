import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log('[match-face] Incoming request')
    const formData = await request.formData()
    const keys: string[] = []
    for (const key of formData.keys()) keys.push(key)
    console.log('[match-face] form keys =', keys)
    const selfie = formData.get("selfie")
    const id = formData.get("id")
    if (selfie && (selfie as any).size) console.log('[match-face] selfie size=', (selfie as any).size)
    if (id && (id as any).size) console.log('[match-face] id size=', (id as any).size)
    
    if (!selfie || !id) {
      return NextResponse.json(
        { error: "Both selfie and ID images are required" },
        { status: 400 }
      )
    }

    // Get credentials from environment variables
  const appId = process.env.HYPERVERGE_APP_ID
  const appKey = process.env.HYPERVERGE_APP_KEY
  const region = process.env.HYPERVERGE_REGION || "ind"
  const maskedAppKey = appKey ? appKey.replace(/.(?=.{4})/g, '*') : undefined
  console.log('[match-face] env: appId=', appId, 'appKey(masked)=', maskedAppKey, 'region=', region)
    
    if (!appId || !appKey) {
      return NextResponse.json(
        { error: "HyperVerge credentials not configured" },
        { status: 500 }
      )
    }

    // Generate a unique transaction ID
  const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  console.log('[match-face] using transactionId=', transactionId)

    // Prepare the form data for HyperVerge API
    const hypervergeFormData = new FormData()
    hypervergeFormData.append("selfie", selfie)
    hypervergeFormData.append("id", id)
    hypervergeFormData.append("preferences.returnScore", "yes")

    // Call HyperVerge Face Match API
    const forwardUrl = `https://${region}.idv.hyperverge.co/v1/matchFace`
    console.log('[match-face] forwarding to', forwardUrl)
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
    console.log('[match-face] hyperverge status=', response.status, 'summary=', { status: data.status, statusCode: data.statusCode, transactionId: data.metadata?.transactionId })

    if (!response.ok) {
      console.error('[match-face] hyperverge error body=', JSON.stringify(data).slice(0, 2000))
      return NextResponse.json(
        { error: data.error || "Face match failed", details: data },
        { status: response.status }
      )
    }

    if (!data.metadata) data.metadata = {}
    if (!data.metadata.transactionId) data.metadata.transactionId = transactionId

    return NextResponse.json(data)
  } catch (error) {
    console.error("Face match error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
