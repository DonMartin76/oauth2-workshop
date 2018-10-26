# Authorization Code Grant

## Aim of this Lab

We want to be able to access our personal data via the API, not just the data which is readily available for all clients.

To accomplish this, we will use the so-called Authorization Code Gran, which also associates an access token with an end user (Resource Owner) identity.

## Preparation - Creating some data

In order to have some data to play with, first open up the magnificent "Markdown Notes" application:

[Markdown Notes](https://app.ow.donmartin76.com)

![Login Screen](images/markdown-notes-login-screen.png)

Hit the "Markdown Notes User" button, which takes you to the login screen for the application:

![Create new user](images/create-new-user.png)

Please click the "Create new user" (this may possibly be in German like in the screenshot) and then create a new account for use with the application. Choose some arbitrary email address, and a password. The password has to be at least 6 characters long. Remember the credentials, we will need them again later on; so note them alongside with the Client ID and Client Secret we created in the first lab.

![Create account](images/create-account.png)

The Markdown Notes app will ask you to register your user with the application:

![Register User](images/register-user.png)

Now create a couple of notes so that your user has some data to play with:

![Create Notes](images/create-notes.png)

## What have we done?

- We have used the application which belongs to the API to create some data for ourselves
- We, in this case, are the **Resource Owners**, and the data we have created **belongs to us**
- The Markdown Notes Application is a trusted application and can use the API without asking for our permission

Why the last remark is important is going to be the topic of the next small experiments.

## Obtaining an Authorization Code

The last part of Lab 1 showed that tokens which are obtained via the Client Credentials Flow do not carry any information on the actual Resource Owner. This changes when we apply the Authorization Code Grant.

With the Client Credentials Flow, we only needed a single end point of the Authorization Server, the `/token` end point. The Token endpoint is a UI-less machine-to-machine type of endpoint - you send a request (e.g. as JSON or as a form) to it, and get JSON payload back.

To implement the Authorization Code Grant, OAuth2 defines an additional endpoint called `/authorize`. The `/authorize` endpoint is a UI based end point which is intended to be called in a user agent (aka browser). This is important, as the Authorization Server somehow has to find out who the Resource Owner is (authenticate), and then afterwards possibly ask the Resource Owner to authorize the client to access a Resource on his behalf.

This sounds very complicated, and alas, when reading it the first time, it is. But it makes sense. If you didn't fully understand yet, don't worry, and bear with me. I hope I can set this straight.

### Checking out the documentation again...

Now let's head back to the API Portal to see whether we can find some more information on the topic of the Authorize endpoint:

![Authorize endpoint](images/authorize-endpoint.png)

Oh hey, it does! This is a typical piece of information which belongs into the API/Resource documentation of an API. This is not specific to wicked, even though the way the information is displayed to the developer can differ between solutions. But it has to be available.

### Asking for permission to access

What we want to do now is to interactively log in with a user and by that obtain permission to access the API *on behalf of the logged in user*. To accomplish this, we make use of the Authorize endpoint in the following way:

```
https://api.ow.donmartin76.com/auth/local/api/markdown-notes/authorize?response_type=code&client_id=<...>&redirect_uri=http://localhost:3000/callback
```

This assumes that you registered `http://localhost:3000/callback` as the redirect URI of the application/client you created in Lab 1. Replace `<...>` with the Client ID of your application subscription to the Markdown Notes API.

> **IMPORTANT**: We are using the `http` protocol here for demonstration purposes. In production scenarios, **all communication MUST be done over TLS**, i.e. over `https`. OAuth2 **relies** on TLS security; not using TLS/`https` opens up various attack scenarios.

**Open a browser in anonymous mode** and copy/paste the URL into the browser. Remember that we need to log in interactively, and thus we need a browser.

You will ideally now be presented with a log in screen for **your registered application**:

![Client Login Screen](images/client-login-screen.png)

Log in using the same credentials as you used when creating the user for the Markdown Notes App; this is the user (Resource Owner!) we want to access the data for.

If you entered the credentials correctly, the Authorization Server will redirect you to the following type of URL:

![Authorization Code Redirect](images/auth-code-redirect.png)

You can see here that you are redirected back to the URI that **you** registered for your client application. The Authorization Server also adds a query parameter:

```
http://localhost:3000/callback?code=HpALB8tBTTU2PAP3pSIFnMmTPYcEF8Fi
```

The query parameter `code` is the so-called Authorization Code. This code is **only** delivered to the URL that you explicitly registered, and nowhere else. In this case, we don't have an application listening to your localhost at port 3000, but we will just grab this code and use it as a web application would use it.

### Obtaining an Access Token

Now we have all the information we need to obtain an access token which is actually associated with the end user we logged in. To get the token, we obviously need the `/token` end point again, which is called with slightly different parameters this time:

Again, replace `<...>` with your Client ID and Client Secret correspondingly, and also use the `code` query parameter you received in your redirect. The `code` parameter is usually quite short lived (from a couple of seconds to under an hour), so hurry up :-D

```
$ curl -d 'grant_type=authorization_code&client_id=<...>&client_secret=<...>&code=HpALB8tBTTU2PAP3pSIFnMmTPYcEF8Fi' https://api.ow.donmartin76.com/auth/local/api/markdown-notes/token
{"refresh_token":"eP32QoYJJWFp27Ffn4fbhsAjbnq1W5Nd","token_type":"bearer","access_token":"3hhiCzWuDpT2QPTwQcHscE7kPP12hCZV","expires_in":3600}
```

Woo! We got an access token back which we now can use to access the API, as the client application, **on behalf of** the Resource Owner (aka, the logged in user).

### Using the Access Token

So, we retry the call we did in the last Lab:

```
$ curl -H 'Authorization: Bearer 3hhiCzWuDpT2QPTwQcHscE7kPP12hCZV' https://api.ow.donmartin76.com/markdown-notes/users/me
{"code":403,"message":"Forbidden, missing required scope 'read_profile'"}
```

Wait, what?

![FFFFFF](images/fffffff.png)

## What went wrong here?

Nothing went wrong. We successfully finished the Authorization Code Grant and obtained an access token which actually lets us access the API on behalf of the Resource Owner (see how I sneak in that term once in a while? aka end user/logged in user).

The kicker with OAuth2 here is now that we actually never asked the user whether we are allowed to access his data with our client application on his behalf. We'll get to this in a minute, but let's first get a positive ending of this lab, OK?

Append an additional parameter `&scope=read_profile` to the URL for authorizing the client application, like this:

```
https://api.ow.donmartin76.com/auth/local/api/markdown-notes/authorize?response_type=code&client_id=<...>&redirect_uri=http://localhost:3000/callback&scope=read_profile
```

Replace the `<...>`,... you know the game. Open up an anonymous browser window and paste the URL. As before, log in, and then you should be presented with this type of screen:

![Grant Access](images/grant-access-to-client.png)

Oh wow! The Authorization Server now interactively asks whether the Client Application is allowed to access my data on the Markdown Notes API on my behalf. The logged in user is the **Resource Owner**, and thus the application should have to ask me before it can access data.

Now hit "Allow", and you should once again get an authorization code; `curl` the `/token` end point with the same request again as above, and you will receive a new access token.

```
$ curl -d 'grant_type=authorization_code&client_id=<...>&client_secret=<...>&code=HpALB8tBTTU2PAP3pSIFnMmTPYcEF8Fi' https://api.ow.donmartin76.com/auth/local/api/markdown-notes/token
{"refresh_token":"lanil4BmhKOPyoO1tTXklXud9yBW28WG","token_type":"bearer","access_token":"jJUEjQUNvyTVVG5ncOVeQpUKYcEr78oU","expires_in":3600}
```

Using this access token, try the endpoint `/users/me` which failed before again:

```
$ curl -H 'Authorization: Bearer jJUEjQUNvyTVVG5ncOVeQpUKYcEr78oU' https://api.ow.donmartin76.com/markdown-notes/users/me
{
  "registered": true,
  "id": "ca8a4ebfe6ae529d35135b9cd737239984a814ef45f2a91afeae227fb9316551",
  "external_id": "sub=5f8578784d5b5074457b59003a50f65fa0d2117b",
  "created_date": 1540388169441,
  "updated_date": 1540388285267,
  "username": "hello@hello.com",
  "name": "Hello World",
  "email": "hello@hello.com"
}
```

Aha!

![Relief](images/relief.png)

---
[Index](../README.md)
