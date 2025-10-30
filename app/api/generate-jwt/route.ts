import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

export async function POST(request: NextRequest) {
  try {
    const { workflowId, transactionId } = await request.json()

    // HyperKYC credentials from environment variables
    const appId = process.env.HYPERVERGE_APP_ID
    const appKey = process.env.HYPERVERGE_APP_KEY
    
    if (!workflowId || !transactionId) {
      return NextResponse.json(
        { error: 'Missing workflowId or transactionId' },
        { status: 400 }
      )
    }

    if (!appId || !appKey) {
      return NextResponse.json(
        { error: 'Missing HyperKYC credentials in environment variables' },
        { status: 500 }
      )
    }

    // Create JWT payload with exact structure expected by SDK
  const payload = {
    appId: appId, // Use the appId from environment variables
    // Use camelCase for consistency
    workflowId: workflowId,
    transactionId: transactionId,
    // Also include uppercase versions as the SDK might be looking for these
    workflowID: workflowId,
    transactionID: transactionId,
    // Standard JWT fields
    sub: transactionId,
    aud: "hyperverge",
    iss: "your-app",
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour expiration
  }

    // Generate JWT token
    const secretKey = appKey // Using app key as secret for JWT signing
    const token = jwt.sign(payload, secretKey)

    return NextResponse.json({
      success: true,
      token,
      payload: {
        workflowId,
        transactionId,
        appId
      }
    })

  } catch (error: any) {
    console.error('JWT generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate JWT token', details: error.message },
      { status: 500 }
    )
  }
}