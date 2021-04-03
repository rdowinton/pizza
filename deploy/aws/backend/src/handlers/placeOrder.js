const axios = require("axios").default;

const corsHeaders = {
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Origin': 'https://pizza.auth.yoga',
  'Access-Control-Allow-Methods': 'OPTIONS, POST',
  'Access-Control-Allow-Credentials': 'true',
};
const jsonContentTypeHeader = { 'Content-Type': 'application/json' };
const commonHeaders = { ...corsHeaders, ...jsonContentTypeHeader };
let cachedToken;

exports.corsHandler = async (event) => ({ statusCode: 200, headers: corsHeaders, body: '' });

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    throw new Error(`postMethod only accepts POST method, you tried: ${event.httpMethod} method.`);
  }

  const { AUTH0_DOMAIN: domain, CLIENT_ID: clientId, CLIENT_SECRET: clientSecret } = process.env;

  const userId = event.requestContext.authorizer && event.requestContext.authorizer.principalId;
  if(typeof userId !== 'string') {
    return {
      statusCode: 400,
      headers: commonHeaders,
      body: JSON.stringify({ error: 'Malformed request' }),
    }
  }

  const newOrder = JSON.parse(event.body).order;
  if(!Array.isArray(newOrder)) {
    return {
      statusCode: 400,
      headers: commonHeaders,
      body: JSON.stringify({ error: 'Malformed request' }),
    }
  }

  // Fetch new token if necessary
  if(!cachedToken || cachedToken.exp > Date.now()) {
    cachedToken = undefined;

    const options = {
      method: 'POST',
      url: `https://${domain}/oauth/token`,
      headers: { ...jsonContentTypeHeader },
      data: {
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
        audience: `https://${domain}/api/v2/`
      }
    };
    await axios.request(options).then(response => {
      cachedToken = response.data.access_token;
    });

    if(!cachedToken) {
      return {
        statusCode: 500,
        headers: commonHeaders,
        body: JSON.stringify({ error: 'Internal server error: no token' })
      }
    }
  }

  // Store order in user profile
  const baseOptions = {
    url: `https://${domain}/api/v2/users/${userId}`,
    headers: { 'Authorization': `Bearer ${cachedToken}` },
  };

  return axios.request(baseOptions).then(response => {
    const user = response.data;
    const metadata = user.user_metadata || {};

    if(!Array.isArray(metadata.orders)) {
      metadata.orders = [];
    }
    metadata.orders.push(newOrder);

    const patchUserOptions = {
      ...baseOptions,
      method: 'PATCH',
      headers: { ...baseOptions.headers, ...commonHeaders },
      data: {
        user_metadata: metadata,
      }
    };
    return axios.request(patchUserOptions);
  }).then(() => {
    return { statusCode: 201, headers: commonHeaders, body: JSON.stringify(newOrder) };
  }).catch(err => {
    return {
      statusCode: 500,
      headers: commonHeaders,
      body: JSON.stringify({ error: 'Internal server error: ' + JSON.stringify(err) })
    };
  });
}