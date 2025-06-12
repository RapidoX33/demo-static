export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // GitHub OAuth App credentials
    const CLIENT_ID = 'Ov23liDFRkPnp1RJw8TM';
    const CLIENT_SECRET = env.GITHUB_CLIENT_SECRET; // Set this in Cloudflare Workers environment
    
    // Handle OAuth callback
    if (url.pathname === '/callback') {
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');
      
      if (!code) {
        return new Response('Missing code parameter', { status: 400 });
      }
      
      // Exchange code for token
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
      });
      
      const tokenData = await tokenResponse.json();
      
      // Redirect back to CMS with token
      const redirectUrl = `https://demo-static-18i.pages.dev/admin/#access_token=${tokenData.access_token}&token_type=bearer`;
      return Response.redirect(redirectUrl, 302);
    }
    
    // Handle auth request
    if (url.pathname === '/auth') {
      const provider = url.searchParams.get('provider');
      const siteId = url.searchParams.get('site_id');
      
      if (provider !== 'github') {
        return new Response('Only GitHub provider is supported', { status: 400 });
      }
      
      // Redirect to GitHub OAuth
      const authUrl = new URL('https://github.com/login/oauth/authorize');
      authUrl.searchParams.set('client_id', CLIENT_ID);
      authUrl.searchParams.set('scope', 'repo,user');
      authUrl.searchParams.set('redirect_uri', `${url.origin}/callback`);
      
      return Response.redirect(authUrl.toString(), 302);
    }
    
    return new Response('OAuth Worker for Sveltia CMS', { status: 200 });
  }
};