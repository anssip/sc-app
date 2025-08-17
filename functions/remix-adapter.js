import { createReadableStreamFromReadable } from '@remix-run/node'

export async function handleRequest(request, serverBuild) {
  const { default: handleRequest } = serverBuild.entry.module
  
  // Create a response stream
  const responseStream = await handleRequest(
    request,
    serverBuild.routes,
    serverBuild.assets
  )
  
  // Convert to Response
  if (responseStream instanceof Response) {
    return responseStream
  }
  
  // If it's a stream, convert it
  const stream = createReadableStreamFromReadable(responseStream)
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  })
}