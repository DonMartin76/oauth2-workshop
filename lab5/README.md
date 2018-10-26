# Resource Owner Password Grant

## Aim of this lab

We will explore how the Resource Owner Password Grant works, what its limitation and caveats are, and what possible use cases are.

## Trying to obtain an access token

The Resource Owner Password Grant is, much like the Client Credentials Grant, a completely headless flow. We only need the token endpoint to get an access token which is associated with a client, a resource owner, and a scope (albeit this is sometimes implicit).

Let's just try out how it works, using `curl`, replacing `client_id`, `client_secret`, `username` and `password` with your corresponding values.

```
martind:lab5$ curl -d 'grant_type=password&client_id=<...>&client_secret=<...>&username=<...>&password=<...>&scope=read_profile read_index read_notes' https://api.ow.donmartin76.com/auth/local/api/markdown-notes/token
{"error":"invalid_request","error_description":"only trusted application subscriptions can retrieve tokens via the password grant."}
```

Okay, this was perhaps somewhat unexpected. What's that, a trusted application?

## Trusted applications

There is no such thing in the RFC as a specification of a "trusted client" or "trusted application". There is just this section in the RFC: https://tools.ietf.org/html/rfc6749#section-4.3

Excerpt from there:

> The resource owner password credentials grant type is suitable in
  cases where the resource owner has a trust relationship with the
  client, such as the device operating system or a highly privileged
  application.  The authorization server should take special care when
  enabling this grant type and only allow it when other flows are not
  viable.

Why does using the Resource Owner Password Grant imply that the Client has to be highly trusted? The reason lies within this: **The Resource Owner has no chance in interactively giving consent to the Client** to accessing the API on his behalf. The flow is headless, and thus there cannot be an interactive part where the Resource Owner (the end user) is actually asked whether it's okay that the application accesses the resources on the resource owner's behalf.

## Creating a trusted subscription

We have worked all the time with the same client application, but now it's time to create another one. Head over to the [API Portal](https://portal.ow.donmartin76.com/applications) again, and create a new application:

![Very Trusted Application](images/very-trusted-app.png)

Note that the redirect URI can be whatever here; we will not use it with the Resource Owner Password Grant.

Now head over to the [Markdown Notes API page](https://portal.ow.donmartin76.com/apis/markdown-notes) and hit the "Subscribe..." button for your new application:

![Tick the trusted box](images/tick-trusted-box.png)

The way wicked.haufe.io implements the concept of "trusted applications" is that that type of subscription always has to be approved by either a person with the "Approver" role, or by an admin of the API Portal. So after you have created the subscription, give the instructor a wave (who hopefully is admin in the portal) so that the subscription can be approved.

![Trusted App Subscription](images/trusted-app.png)

Now copy/paste out the new Client ID and Client Secret for use in `curl`, and retry getting an access token:

```
martind:lab5$ curl -d 'grant_type=password&client_id=<...>&client_secret=<...>&username=<...>&password=<...>&scope=read_profile read_index read_notes' https://api.ow.donmartin76.com/auth/local/api/markdown-notes/token
{"refresh_token":"og0IKMBBJPtODsg1v1pmN1p9Cq1IaqLZ","token_type":"bearer","access_token":"b8JtFYoIARWm8tBsNPTSqBXvlNmxV2Qc","expires_in":3600}
```

That worked! Now we can use that token to access the API via the usual `Authorization: Bearer <...>` header:

```
martind:lab5$ curl -H 'Authorization: Bearer b8JtFYoIARWm8tBsNPTSqBXvlNmxV2Qc' https://api.ow.donmartin76.com/markdown-notes/users/me
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

So, in short, you can say having a "trusted" application means that the Authorization Server will never ask for permission when creating a token with a specific scope. **Scope requests will always be granted**, even without the consent of the Resource Owner.

**Note**: With wicked.haufe.io, this also applies to the other two flows, the Authorization Code Grant and the Implicit Grant. The "real" Markdown Notes application at [https://app.ow.donmartin76.com](https://app.ow.donmartin76.com) has a trusted subscription to the underlying API, so that the application does not have to ask for consent from the Resource Owner. This would seem very strange - the actual application begs for permission to access its own data - but actually that would be required if there wasn't the concept of trusted applications.

---
[Index](../README.md)
