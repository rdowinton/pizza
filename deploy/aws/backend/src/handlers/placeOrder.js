const axios = require("axios").default;
const jwt = require("jsonwebtoken");

const jsonContentTypeHeader = { 'Content-Type': 'application/json' }
let cachedToken;

exports.placeOrderHandler = async (event) => {
  if (event.httpMethod !== 'POST') {
    throw new Error(`postMethod only accepts POST method, you tried: ${event.httpMethod} method.`);
  }

  const { AUTH0_DOMAIN: domain, CLIENT_ID: clientId, CLIENT_SECRET: clientSecret } = process.env;

  const token = event.authorizationToken;
  const { sub: userId } = jwt.decode(token) || { sub: null }; // no need to verify as this should be done in authorizer
  if(userId === null) {
    return {
      statusCode: 400,
      headers: { ...jsonContentTypeHeader },
      body: JSON.stringify({ error: 'Malformed or missing token' }),
    }
  }

  const newOrder = JSON.parse(event.body);

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
        headers: { ...jsonContentTypeHeader },
        body: JSON.stringify({ error: 'Internal server error' })
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
      headers: { ...baseOptions.headers, ...jsonContentTypeHeader },
      data: {
        user_metadata: metadata,
      }
    };
    return axios.request(patchUserOptions);
  }).then(() => {
    return { statusCode: 201, headers: { ...jsonContentTypeHeader }, body: newOrder };
  }).catch(() => {
    return {
      statusCode: 500,
      headers: { ...jsonContentTypeHeader },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  })
}