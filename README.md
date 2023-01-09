# Vermarktungsplattform

As part of the DATEN:RAUM:FREIBURG project, immovativ GmbH has developed this prototype of a marketing platform for urban properties in concept allocation.

# License Information

This code is published by immovativ GmbH under the German Free Software License. Please refer to the document in the link for usage, change and distribution information: https://www.hbz-nrw.de/produkte/open-access/lizenzen/dfsl/german-free-software-license

## Prerequisites

### Mandatory
* `docker-compose`
* `Java 17 JDK`
* `yarn`

### Recommended
* `hurl`
* `s3cmd`

## Run

```bash
./gradlew run
```

Starts application:

* ktor app runs at `http://localhost:8080`
* webpack devserver runs at `http://localhost:8000` (and proxies all `/api` calls to the ktor app on 8080)
* docker container with postgres(+postgis) runs alongside the application
    * Port: `5432`
    * User: `vermarktungsplattform`
    * Password: `vermarktungsplattform`
    * Root Password: `vermarktungsplattform`
    * Database: `vermarktungsplattform`
    * JDBC String: `jdbc:postgresql://localhost:5432/vermarktungsplattform`
* docker container with mailhog exposes UI on http://localhost:8025

### Test data for UI development

Very minimal:

```bash
./gradlew run
# in other shell:
hurl --variables-file requests/demo-data.env requests/demo-data.hurl
```

Fully fledged (basically almost everything you can think of):

```bash
./gradlew testDataGenerator # this takes care of compose up
./gradlew run
```

### Pre-seeded accounts
Login at [http://localhost:8000/protected/login](http://localhost:8080/protected/login)

- projekt@dietenbach.de (Projektgruppe Dietenbach / ALW) pw=projekt

- consulting@baurechtsamt.de (Baurechtsamt) pw=consulting

- bewerber@dietenbach.de (Bewerber/Candidates) pw=bewerber

### Custom postgres
```bash
Set any of the following environment variables before gradle run:
* POSTGRES_JDBC=jdbc:postgresql://localhost:5432/vermarktungsplattform
* POSTGRES_USER=test
* POSTGRES_PASSWORD=pass

## Connect to database
```bash
psql postgresql://vermarktungsplattform:vermarktungsplattform@localhost:5432/vermarktungsplattform
```

## Access S3

### Local
```bash
s3cmd --no-check-certificate --host=http://localhost:8001 --host-bucket=localhost --region=eu-central-1
```

### Open Telekom Cloud
```bash
s3cmd -c s3cmd_config ls
```

## Access DB
We recommend using https://github.com/dbcli/pgcli

```bash
pgcli postgresql://vermarktungsplattform:vermarktungsplattform@localhost:5432
```

## Test

This project has several testing vehicles:
* Javascript unit tests with `Jest`
  * Test small chunks of the frontend
* End-to-end (driven by a browser) tests with `Cypress`
  * Test the frontend under "real" conditions
* Kotlin tests for the backend with `Kotest`

### Kotlin
```bash
./gradlew --info test
```

To keep docker containers running (recommended so the containers are not started/stopped before/after each test run):

```bash
./gradlew --info test -PdontStopContainers
```

#### IntelliJ IDEA
Use the [kotest plugin](https://plugins.jetbrains.com/plugin/14080-kotest) to run tests in IntelliJ.
If running a single test be aware that the plugin doesn't correctly use gradle so the docker containers will not
automatically start. If the containers are still running due to `-PdontStopContainers` then it will work.
You can also just `./gradlew composeUp` which will start and keep the containers runnning.

### Cypress
Note: almost all data is cleared before each test (via `data_reset.sh`)
* Run all specs quickly
  ```bash
  ./run_cypress_headless.sh
  ```
* `yarn cypress open` opens the cypress UI which allows things like DOM time-travel and is recommended
* Locations:
  * Screenshots `cypress/screenshots`
  * Videos `cypress/videos` (this is disabled in the `./run_cypress` shell scripts though

## Build docker container and run locally

### One application
```bash
./build.sh
docker-compose -f docker-compose-run.yaml up
```

## Check for gradle dependency updates

```bash
./gradlew dependencyUpdates [--refresh-dependencies]
```

## Check for node dependency updates

```bash
yarn outdated
```

## Deployment

The docker image is name and tag is `10.38.11.90:5000/zielbildgenerator:latest`.
The application listens on port `8080`. The configuration is located in the `application.conf` (resides in `src/main/kotlin`).
To deploy the application somewhere via docker, you need to set the following environment variables:

| Name                                 | Type      | Optional | Description                                                                                     |
|--------------------------------------|-----------|:--------:|-------------------------------------------------------------------------------------------------|
| `POSTGRES_JDBC`                      | `string`  |          | JDBC string e.g. `jdbc:postgresql://<ip-or-domain-of-database>:<database-port>/<database-name>` |
| `POSTGRES_USER`                      | `string`  |          | database user                                                                                   |
| `POSTGRES_PASSWORD`                  | `string`  |          | database password                                                                               |
| `URL_PW_RESET`                       | `string`  |          | url for password reset email link `https://<domain>/protected/passwordReset`                    |
| `URL_PW_INVITE`                      | `string`  |          | url for invite email link `https://<domain>/protected/invitation`                               |
| `EMAIL_HOST`                         | `string`  |          | smtp host                                                                                       |
| `EMAIL_PORT`                         | `integer` |          | smtp port                                                                                       |
| `EMAIL_USERNAME`                     | `string`  |          | smtp user                                                                                       |
| `EMAIL_PASSWORD`                     | `string`  |          | smtp password                                                                                   |
| `EMAIL_SENDER`                       | `string`  |    x     | sender email address. defaults to `noreply@vermarktungsplattform.de`                            |
| `APP_SECRET`                         | `string`  |          | secret to encrypt JWT                                                                           |
| `JWT_ISSUER`                         | `string`  |          | jwt issuer domain                                                                               |
| `JWT_AUDIENCE`                       | `string`  |          | jwt audience domain                                                                             |
| `JWT_VALID_DURATION`                 | `string`  |    x     | jwt cookie validity. defaults to `PT30M` (30 minutes)                                           |
| `COOKIE_DOMAIN`                      | `string`  |          | session cookie domain                                                                           |
| `COOKIE_SECURE`                      | `boolean` |          | session cookie is secure                                                                        |
| `API_TOKEN_SECRET`                   | `string`  |          | secret to sign API token                                                                        |
| `LOGIN_MAX_REQUESTS`                 | `integer` |    x     | number of max requests for login (fixed window rate limit). Default `20`                        |
| `LOGIN_MAX_REQUESTS_WINDOW`          | `string`  |    x     | window for login (fixed window rate limit). Default `PT5M` (5 minutes)                          |
| `PASSWORD_RESET_MAX_REQUESTS`        | `integer` |    x     | number of max requests for password reset (fixed window rate limit). Default `5`                |
| `PASSWORD_RESET_MAX_REQUESTS_WINDOW` | `string`  |    x     | window for password reset (fixed window rate limit). Default `PT15M` (15 minutes)               |

Hint for value types
  * `string` values should be `ENV_VAR=some-value`
  * `boolean` values should be `ENV_VAR=true` or `ENV_VAR=false`
  * `integer` values should be like `ENV_VAR=1`

A healthcheck endpoint exists under `/health` and returns `204 No Content`.

#### Rate limits
There is a fixed window rate limiting on login and password reset.
The window starts with the first request (based on the `X-REAL-IP` header, the check is case insensitive).
Once the rate limit is hit, all limited requests in that window will fail with HTTP 429 for the limited IP.
If there is no X-REAL-IP header, the rate limiting has no effect.
The login window can be reset for a specific IP by performing a successful login.
For password reset, there is no way to reset the window.

Attention: the rate limit is purely in-memory. This means a node restart resets it. And if there are N nodes, assuming a
perfect round-robin distribution, this means the rate limit will be hit after N * `LOGIN_MAX_REQUESTS` requests instead of
`LOGIN_MAX_REQUESTS`.

## Caveats
- The scrypt salt/pepper is explicitly **not** configurable. This is technically possible but it would break the default user accounts, as that needs to be
  scrypted somehow.
