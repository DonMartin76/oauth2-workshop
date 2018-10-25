const express = require('express');
const router = express.Router();
const qs = require('querystring');
const request = require('request');

const settings = require('../settings')
const utils = require('./utils');

// GET home page
router.get('/', function (req, res, next) {
  res.render('index', {
    title: 'Markdown Test Client',
    user: req.session.user,
    auth_methods: settings.auth_methods,
    client_id: settings.client_id,
    logout: makeLogoutUrl(),
    access_token: req.session.access_token ? JSON.stringify(req.session.access_token, null, 2) : null,
    grants_url: makeGrantsUrl(req)
  });
});

router.get('/login', function (req, res, next) {
  const client_id = req.query.client_id;
  const scope = makeScopeArray(req.query.scope);
  console.log(req.query.scope);
  const auth_method = req.query.auth_method;
  const response_type = req.query.response_type;
  const redirect_uri = qs.escape(req.query.redirect_uri);

  const scopeUri = scope.length > 0 ? qs.escape(scope.join(' ')) : null;

  let authServerUrl = `${settings.auth_server}/${auth_method}/api/markdown-notes/authorize?client_id=${client_id}&response_type=${response_type}&redirect_uri=${redirect_uri}`;
  if (scopeUri)
    authServerUrl += `&scope=${scopeUri}`;

  req.session.auth_method = auth_method;

  res.render('login', {
    auth_url: authServerUrl
  });
});

function makeScopeArray(scopes) {
  if (!scopes)
    return [];
  if (typeof scopes == 'string')
    return [scopes];
  return scopes;
}

router.get('/callback', function (req, res, next) {
  const error = req.query.error;
  const error_description = req.query.error_description;
  const code = req.query.code;

  if (error || error_description) {
    return res.render('oauth_error', {
      error,
      error_description
    });
  }

  if (!code) {
    return res.render('no_code', {});
  }

  return res.render('code', {
    code: code,
    token_url: makeTokenUrl(req),
    token_payload: JSON.stringify(makeTokenPayload(req, code), null, 2)
  });
});

router.get('/token', function (req, res, next) {
  const code = req.query.code;

  const tokenUrl = makeTokenUrl(req);
  const tokenPayload = makeTokenPayload(req, code);

  request.post({
    url: tokenUrl,
    json: true,
    body: tokenPayload
  }, function (err, apiRes, apiBody) {
    if (err) {
      return next(err);
    }
    if (apiRes.statusCode !== 200) {
      console.error(apiBody);
      return next(new Error('Token endpoint returned unexpected status code: ' + apiRes.statusCode));
    }
    const accessToken = utils.getJson(apiBody);
    req.session.access_token = accessToken;

    request.get({
      url: makeProfileUrl(),
      headers: {
        Authorization: `Bearer ${accessToken.access_token}`
      }
    }, function (err, apiRes, apiBody) {
      if (err) {
        return next(err);
      }
      const profile = utils.getJson(apiBody);
      req.session.user = profile;

      res.render('logged_in', {
        access_token: JSON.stringify(accessToken, null, 2),
        user: profile
      });
    })
  });
});

router.get('/logout', function (req, res) {
  req.session.destroy(function () {
    res.redirect(makeLogoutUrl());
  });
});

router.get('/profile', function (req, res, next) {
  getUsersMe(req, function (err, usersMe) {
    if (err)
      return next(err);
    return res.render('api_content', {
      user: req.session.user,
      url: makeProfileUrl(),
      content: JSON.stringify(usersMe, null, 2)
    });
  })
});

router.get('/index', function (req, res, next) {
  getAccessToken(req, function (err, token) {
    if (err)
      return next(err);
    getUsersMe(req, function (err, usersMe) {
      if (err)
        return next(err);
      const reqUrl = `${settings.api_base}/users/${usersMe.id}/index`;
      request.get({
        url: reqUrl,
        headers: {
          Authorization: `Bearer ${token}`
        }
      }, function (err, apiRes, apiBody) {
        if (err)
          return next(err);
        if (apiRes.statusCode !== 200)
          return next(makeStatusError('Get notes index', apiRes, apiBody));
        return res.render('api_content', {
          user: req.session.user,
          url: reqUrl,
          content: JSON.stringify(utils.getJson(apiBody), null, 2)
        });
      });
    });
  })
});

router.get('/refresh', function (req, res, next) {
  if (!req.session.access_token)
    return next(new Error('Not logged in, no access_token in session.'));
  const tokenUrl = makeTokenUrl(req);
  const tokenPayload = makeRefreshPayload(req);

  request.post({
    url: tokenUrl,
    json: true,
    body: tokenPayload
  }, function (err, apiRes, apiBody) {
    if (err)
      return next(err);

    if (apiRes.statusCode !== 200)
      return next(makeStatusError('Refresh token', apiRes, apiBody));
    const newToken = utils.getJson(apiBody);
    req.session.access_token = newToken;

    res.render('refresh', {
      user: req.session.user,
      url: tokenUrl,
      token_payload: JSON.stringify(tokenPayload, null, 2),
      access_token: JSON.stringify(newToken, null, 2)
    });
  });
});

function getUsersMe(req, callback) {
  getAccessToken(req, function (err, token) {
    if (err)
      return callback(err);
    request.get({
      url: settings.api_base + '/users/me',
      headers: {
        Authorization: `Bearer ${token}`
      }
    }, function (err, apiRes, apiBody) {
      if (err)
        return callback(err);
      if (apiRes.statusCode !== 200)
        return callback(makeStatusError('Get user profile', apiRes, apiBody)); //new Error('API returned non-200 status code ' + apiRes.statusCode));
      return callback(null, utils.getJson(apiBody));
    });
  });
}

function makeStatusError(topic, res, body) {
  let errorMessage = `${topic}: Non-200 status code ${res.statusCode} was returned. `;
  try {
    const jsonBody = utils.getJson(body);
    console.error(JSON.stringify(jsonBody));
    if (jsonBody.error || jsonBody.message)
      errorMessage += `Error: ${jsonBody.error || jsonBody.message}`;
  } catch (err) {
    errorMessage += ' (unknown error)';
  }
  const err = new Error(errorMessage);
  err.status = res.statusCode;
  return err;
}

function getAccessToken(req, callback) {
  if (!req.session.access_token || !req.session.access_token.access_token)
    return callback(new Error('Not logged in? No access token in session.'));
  return callback(null, req.session.access_token.access_token);
}

function makeTokenUrl(req) {
  const auth_method = req.session.auth_method;
  return `${settings.auth_server}/${auth_method}/api/markdown-notes/token`;
}

function makeProfileUrl() {
  return `${settings.auth_server}/profile`;
}

function makeLogoutUrl() {
  return `${settings.auth_server}/logout?redirect_uri=${qs.escape('http://localhost:3000')}`;
}

function makeGrantsUrl(req) {
  if (req.session.auth_method)
    return `${settings.auth_server}/${req.session.auth_method}/grants`;
  return null;
}

function makeTokenPayload(req, code) {
  return {
    client_id: settings.client_id,
    client_secret: settings.client_secret,
    code: code,
    grant_type: 'authorization_code'
  };
}

function makeRefreshPayload(req) {
  return {
    client_id: settings.client_id,
    client_secret: settings.client_secret,
    refresh_token: req.session.access_token.refresh_token,
    grant_type: 'refresh_token'
  };
}

module.exports = router;
