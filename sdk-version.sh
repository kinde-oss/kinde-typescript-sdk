#!/bin/bash

target_path='./lib/sdk/sdk-version.ts'
version_regex='[0-9]+\.[0-9]+\.[0-9]+'
version=$(cat package.json | grep version | grep -oE $version_regex)

if [[ $1 == "clean" ]]; then 
  sed_expression="s/$version/SDK_VERSION_PLACEHOLDER/g"
else
  sed_expression="s/SDK_VERSION_PLACEHOLDER/$version/g"
fi

sed -i $sed_expression $target_path
