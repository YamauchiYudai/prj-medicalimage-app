import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { image } = data;

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // Prepare the payload to mimic API Gateway event structure
    // or just direct invocation if handler supports it.
    // Our handler expects event['body'] to contain the data (stringified or raw).
    const payload = {
      body: JSON.stringify({ image })
    };

    // Connect to the backend container (service name 'backend' in docker-compose)
    // Port 8080 is the internal port of the Lambda RIE/Emulator
    const backendUrl = 'http://backend:8080/2015-03-31/functions/function/invocations';
    
    console.log(`Forwarding request to ${backendUrl}`);

    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Backend responded with ${response.status}`);
    }

    const result = await response.json();
    
    // result is the return value from lambda_handler
    // lambda_handler returns { statusCode, body, headers }
    
    if (result.body) {
        const parsedBody = JSON.parse(result.body);
        return NextResponse.json(parsedBody);
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Prediction proxy error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
