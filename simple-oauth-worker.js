addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  
  // WICHTIG: Diese Werte müssen Sie anpassen!
  const CLIENT_ID = 'Ov23liDFRkPnp1RJw8TM' // Ihre GitHub App Client ID
  const CLIENT_SECRET = 'IHR_GITHUB_CLIENT_SECRET' // Ihr GitHub Client Secret
  const REDIRECT_URL = 'https://cms-oauth.IHR-USERNAME.workers.dev/callback'
  
  // OAuth Start
  if (url.pathname === '/auth' || url.pathname === '/oauth/authorize') {
    const site_id = url.searchParams.get('site_id') || 'demo-static-18i.pages.dev'
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&scope=repo,user&redirect_uri=${REDIRECT_URL}&state=${site_id}`
    
    return Response.redirect(githubAuthUrl, 302)
  }
  
  // OAuth Callback
  if (url.pathname === '/callback') {
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state') || 'demo-static-18i.pages.dev'
    
    // Token von GitHub holen
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code: code,
      }),
    })
    
    const data = await tokenResponse.json()
    
    // Zurück zum CMS mit Token
    const script = `
      <script>
        (function() {
          function receiveMessage(e) {
            console.log("receiveMessage", e);
            if (e.origin !== "https://${state}") {
              console.log("Invalid origin:", e.origin);
              return;
            }
            
            window.opener.postMessage(
              'authorization:github:success:' + JSON.stringify({
                token: '${data.access_token}',
                provider: 'github'
              }),
              e.origin
            );
            
            window.removeEventListener("message", receiveMessage, false);
          }
          window.addEventListener("message", receiveMessage, false);
          
          window.opener.postMessage("authorizing:github", "https://${state}");
        })()
      </script>
    `
    
    return new Response(script, {
      headers: { 'Content-Type': 'text/html' },
    })
  }
  
  // Default response
  return new Response('CMS OAuth Worker', { status: 200 })
}