#!/bin/bash

# getting businessName as a script argument
if [[ $# -ge 1 ]]; then business_name=$1; fi

# fetching latest open-api specification
openapi_spec_file=kinde-mgmt-api-specs.yaml
rm -rf ./generated-sdk && rm -f $openapi_spec_file
curl https://kinde.com/api/$openapi_spec_file \
  -o $openapi_spec_file

# replacing business name in script argument
[[ -z ${business_name} ]] || \
  sed -i '' s/\{businessName\}/$business_name/g $openapi_spec_file

# generating sdk
docker run --rm -v $PWD:/local -u $(id -u) \
    openapitools/openapi-generator-cli generate \
    -i /local/$openapi_spec_file \
    -c /local/generator-config.yaml -g typescript-fetch \
    -o /local/generated-sdk \
    --additional-properties=importFileExtension=.js

# moving apis, models, runtime.ts to lib directory
mkdir -p ./generated-sdk/lib 
mv ./generated-sdk/index.ts ./generated-sdk/lib/index.ts
mv ./generated-sdk/runtime.ts ./generated-sdk/lib
mv ./generated-sdk/models ./generated-sdk/lib
mv ./generated-sdk/apis ./generated-sdk/lib 

# clean up api files from sdk
rm -rf ./generated-sdk/.openapi-generator 
rm -rf ./generated-sdk/.openapi-generator-ignore
