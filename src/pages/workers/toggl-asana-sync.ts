export const prerender = false;

export async function POST({ request }: { request: Request }) {
  const GOOGLE_APPS_SCRIPT_URL = import.meta.env.TOGGL_ASANA_SCRIPT_URL || "https://script.google.com/macros/s/AKfycbxb0iSucSMseYnijg1EZOuC3eS0STz7CSHAPKy6kZk4cBzuZMYIZOgvCiFCA1AMBZkj/exec";
  
  try {
    const body = await request.text();
    const headers = new Headers();
    
    for (const [key, value] of request.headers.entries()) {
      if (key.toLowerCase() !== 'host' && key.toLowerCase() !== 'cf-ray' && key.toLowerCase() !== 'cf-connecting-ip') {
        headers.set(key, value);
      }
    }
    
    const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: 'POST',
      headers,
      body,
      redirect: 'follow'
    });
    
    const responseBody = await response.text();
    
    return new Response(responseBody, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'text/plain',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
    
  } catch (error) {
    console.error('Error proxying to Google Apps Script:', error);
    return new Response('Internal server error', { status: 500 });
  }
}

export async function OPTIONS({ request }: { request: Request }) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}