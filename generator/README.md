# Kinde TypeScript generator

The generator for the [Kinde TypeScript SDK](https://github.com/kinde-oss/kinde-typescript-sdk).

[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](https://makeapullrequest.com) [![Kinde Docs](https://img.shields.io/badge/Kinde-Docs-eee?style=flat-square)](https://kinde.com/docs/developer-tools) [![Kinde Community](https://img.shields.io/badge/Kinde-Community-eee?style=flat-square)](https://thekindecommunity.slack.com)

## Overview

This generator creates an SDK in TypeScript that can authenticate to Kinde using the Authorization Code grant or the Authorization Code with PKCE grant via the [OAuth 2.0 protocol](https://oauth.net/2/). It can also access the [Kinde Management API](https://kinde.com/api/docs/#kinde-management-api) using the client credentials grant.

Also, see the SDKs section in Kinde’s [contributing guidelines](https://github.com/kinde-oss/.github/blob/main/.github/CONTRIBUTING.md).

## Usage

### Requirements

You will need the following tools to be able to generate the SDK.

#### Docker engine
The `openapi-generator-cli` dependency of this generator is made use of as a docker image. You can find the instructions for installing docker engine [**here**](https://docs.docker.com/engine/install). Once installed the required image can be installed with the following command.
```
docker pull openapitools/openapi-generator-cli
```

#### cURL
This command-line program is required since the generating script `generate.sh` (see below), performs a `GET` request to fetch the `kinde-mgmt-api-specs.yaml` open-api spec file for Kinde. This program is most likely available via your operating systems package manager (some examples are provided below). If not then see [**this**](https://curl.se/download.html) link.

On linux distributions like Ubuntu and Debian.
```bash
apt install curl
```

On MacOS you can install `curl` using Homebrew.
```bash
brew install curl
```

### Initial set up

1. Clone the repository to your machine:

   ```bash
   git clone https://github.com/kinde-oss/kinde-typescript-generator.git
   ```

2. Go into the project:

   ```bash
   cd kinde-typescript-generator
   ```

3. Install the OpenAPI Generator tool:

   https://openapi-generator.tech/docs/installation

### SDK generation

Run the following command to generate the SDK:

```bash
./generate.sh kinde-business-name
```

Please be mindful that `kinde-business-name` is an optional argument which replaces the {businessName} variable in the `kinde-mgmt-api-specs.yaml` specification file, if provided.

**Note:** The API specifications should always point to Kinde's hosted version: https://kinde.com/api/kinde-mgmt-api-specs.yaml. This is set via the ` -i` option in the [OpenAPI Generator CLI](https://openapi-generator.tech/docs/usage/), for example:

```bash
openapi-generator-cli generate -i https://kinde.com/api/kinde-mgmt-api-specs.yaml
```

The SDK gets outputted to: `generated-sdk`, which you can enter via:

```bash
cd generated-sdk
```

## SDK documentation

[TypeScript SDK](https://kinde.com/docs/developer-tools/typescript-sdk)

## Development

The instructions provided in the "Usage → Requirements" section above are sufficient to get you started.

## Contributing

Please refer to Kinde’s [contributing guidelines](https://github.com/kinde-oss/.github/blob/489e2ca9c3307c2b2e098a885e22f2239116394a/CONTRIBUTING.md).

## License

By contributing to Kinde, you agree that your contributions will be licensed under its MIT License.
