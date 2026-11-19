# Backend API

In all cases, 400 (Bad Request) or 500 (Internal Server Error) may be returned in addition to the error codes listed.

> Blockquotes are JSON

<br>

## Create short code for a URL
POST /api/shorten

**Request Body**: `multipart/form-data`

url: string

**Response Body**: `application/json`

> code: string

**Errors**:

Rate limit hit: HTTP 429, will include `Retry-After` header

<br>

## Get password hashing information for user
GET /api/hash-information

**Query Parameters**:

username: string

**Response**: `application/json`

> salt: base64\
> The salt used client-side in the PBKDF2 algorithm. Usually 128 bits in length.
>
> algorithm: string\
> The hashing algorithm used internally for PBKDF2. Usually `SHA-256`.
>
> iterations: number\
> Number of iterations for PBKDF2. Usually `500000`
>
> length: number\
> Length of PBKDF2 hash to generate, in bits. Usually `256`.

**Errors**:

User not found: HTTP 404

Rate limit hit: HTTP 429, will include `Retry-After` header

<br>

## Log in
POST /api/login

**Request Body**: `application/json`

> username: string
>
> hash: string\
> PBKDF2 hash of password

**Response**: HTTP 204

**Set Cookies**:

session: object\
A token that proves the user is logged in.

>  username: string
>
>  expiration: number\
>  Unix time in seconds.
>
>  signature: base64

**Errors**:

Incorrect username or password: HTTP 403

Rate limit hit: HTTP 429, will include `Retry-After` header

<br>

## Create account
POST /api/create-account

**Request Body**: `application/json`

> username: string
>
> hash: base64\
> PBKDF2 hash of password.
>
> hashInfo: object
>
>> salt: base64\
>> The salt used client-side in the PBKDF2 algorithm. Usually 128 bits in length.
>>
>> algorithm: string\
>> The hashing algorithm used internally for PBKDF2. Usually `SHA-256`.
>>
>> iterations: number\
>> Number of iterations for PBKDF2. Usually `500000`
>>
>> length: number\
>> Length of PBKDF2 hash to generate, in bits. Usually `256`.

**Response**: HTTP 204

**Set Cookies**:

session: object\
A token that proves the user is logged in.

>  username: string
>
>  expiration: number\
>  Unix time in seconds.
>
>  signature: base64

**Errors**:

Username taken: HTTP 409

Rate limit hit: HTTP 429, will include `Retry-After` header

<br>

## List URLs for user
GET /api/urls

**Query Parameters**:

page: optional number

**Authentication**: Valid `session` cookie required

**Response**: `application/json`

> urls: array
> Sorted descending by create_time. Will return 50 per page.
>
>> code: string
>>
>> url: string
>>
>> description: string | null
>>
>> create_time: number

**Errors**:

Invalid or missing session: HTTP 401

<br>

## Update a URL
PATCH /api/urls/`code`

**Authentication**: Valid `session` cookie required

**Request Body**: `application/json`

> description: optional string | null
> A helpful description for this URL.
>
> url: optional string
> Update the URL the code points to.

**Response**: HTTP 204

**Errors**:

Invalid or missing session: HTTP 401

User does not own URL: HTTP 403

URL not found: HTTP 404

<br>

## Delete a URL
DELETE /api/urls/`code`

**Authentication**: Valid `session` cookie required

**Response**: HTTP 204

**Errors**:

Invalid or missing session: HTTP 401

User does not own URL: HTTP 403

URL not found: HTTP 404

<br>

## Redirect to URL by code
GET /`code`

**Response**: HTTP 302

**Errors**:

URL not found: HTTP 404, displays single-page app with not-found page