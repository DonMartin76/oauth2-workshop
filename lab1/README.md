# Lab 1 - Client Credentials

## Aim of this Lab

The aim of this lab is to try out the Client Credentials Flow to get Access to a protected resource on behalf of a client application.

The Resource which we want to get access to is an API which is located at the following URL: `https://api.ow.donmartin76.com/markdown-notes`. 

Accessing this URL via curl results in the following response:

```
martind:oauth2-workshop$ curl https://api.ow.donmartin76.com/markdown-notes
{"error_description":"The access token is missing","error":"invalid_request"}
```

So, we need to get our hands on an Access Token; this Lab explains how.

## Sign up for the API Portal

In order to use the Markdown Notes API, you will have to sign up for the Markdown Notes API Portal:

[Markdown Notes API Portal](https://portal.ow.donmartin76.com)

Navigate to "Log In" in the menu bar and choose how you want to authenticate to the API Portal. You have the choice using a username and password, or using your GitHub identity.

At this point of time, it does not matter which you are using. Usernames and passwords are immediately "trusted", so that you don't have to verify your email address or such, so any email address will work for logging in.

![Log in screen](images/2018-10-24-11-43-41.png)

## Create an Application (Client)

As mentioned in the presentation, you will need a client (here: "Application" in wicked's terminology) to authenticate to the Authorization Server when requesting access to resources (here: an API). Do this by navigating to the applications:

[Applications](https://portal.ow.donmartin76.com/applications)

Then register an application to play with:

![Register application](images/register-application.png)

You need to choose a unique application id, so do not use `my-app` as displayed in this screenshot.

But please enter exactly this redirect URI (even if it's not yet clear what it does, and it's not used in this lab yet) and tick the two boxes as shown in the screenshot. Use this redirect URI: `http://localhost:3000/callback` (note that it's **http**, not **https**). We will get back to what the check boxes mean as well later.

## Subscribe to the API

Then head over to the [APIs section](https://portal.ow.donmartin76.com/apis) and select the "Markdown Notes API".

In the "Applications" section, hit the "Subscribe" button:

![Subscribe!](images/2018-10-24-11-51-23.png)

On the next screen, keep the default settings and hit "Subscribe":

![Subscribe step 2](images/2018-10-24-11-52-16.png)

This will take you back to the API screen, but now you will have data for the "Client ID" and the "Client Secret":

![Client ID and Secret](images/2018-10-24-11-53-22.png)

Please copy/paste the Client ID and Client Secret to a separate text file.

**Note**: In OAuth2, the Client ID and the Client Secret are the values which are used to identify a Client Application. The Client ID is usually seen as **public**, whereas the Client Secret must be kept **confidential**.

## Obtain an Access Token

To obtain an Access Token we need to make use of the so-called "Token Endpoint". The URL of the Token Endpoint can differ highly between different implementations of Authorization Servers; they only have in common that it has to exists and how it has to react. Usually, the Token endpoint ends with `/token`.

With wicked, the Token Endpoint differs depending on the type of authentication (we will get to this later), but for the Client Credentials flow we don't authenticate any users, so we can pick any, e.g. the one for the "Username and Password":

![Token Endpoint](images/2018-10-24-12-02-01.png)

Now open up your preferred command line (PowerShell, bash,...) where you have access to [curl](https://curl.haxx.se). The following screenshots and command prompts are taken from macOS, but should work just the same on Windows as well. Below, replace the two occurrences of `<...>` with your Client ID and Client Secret.

```
$ curl -d 'grant_type=client_credentials&client_id=<...>&client_secret=<...>' https://api.ow.donmartin76.com/auth/local/api/markdown-notes/token
{"token_type":"bearer","access_token":"FDI1IjOnXhUX060uwCvLul4AF2PC1o86","expires_in":3600}
```

Ideally, this call should immediately respond with an access token.

## Using the Access Token to access Resources (the API)

The base URL of the Markdown Notes API is noted on the API page in the API portal:

![API Base URL](images/2018-10-24-12-06-13.png)

The obtained access token can now per OAuth2 RFC be used as a Bearer Token to access the Resource Server (aka the API; replace the token below with your own token):

```
$ curl -H 'Authorization: Bearer FDI1IjOnXhUX060uwCvLul4AF2PC1o86' https://api.ow.donmartin76.com/markdown-notes
{"comment":"I know this is not HAL. It's just for demonstration purposes.","public":{"index":{"url":"/","scope":null},"api-docs":{"url":"/api-docs","scope":null}},"private":{"profile":{"url":"/users/me","scope":"read_profile"},"user_get":{"url":"/users/:user_id","scope":"read_users"},"user_put":{"url":"/users/:user_id","scope":"write_profile"},"notes_index":{"url":"/users/:user_id/index","scope":"read_index"},"notes_get":{"url":"/notes/:notes_id","scope":"read_notes"},"notes_put":{"url":"/notes/:notes_id","scope":"write_notes"}}}
```

Yay! We have achieved the main target of this Lab, we have gained access to the Resource, in our case the Markdown Notes API, via the API Gateway.


## Accessing other resources

Now let's try a different endpoint, using the same access token:

```
$ curl -H 'Authorization: Bearer FDI1IjOnXhUX060uwCvLul4AF2PC1o86' https://api.ow.donmartin76.com/markdown-notes/users/me
{"message":"Forbidden. No user, or user not authorized."}
```

This time we get an error back; `curl -v` would show you that it's a `403 Forbidden` which is returned. If we leave out the access token, we would get a `401 Unauthenticated` back. The `403` shows that the API Gateway actually lets you through, but the API implementation in the background says it's forbidden to access the resource.

Why this is the case, will be the topic of the next couple of minutes.

---
[Index](../README.md)
