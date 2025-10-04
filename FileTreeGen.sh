#!/bin/bash

# I use this to generate the file tree for pubspec.yaml. Not sure if it's necessary

# Start output
echo "flutter:"
echo "  assets:"

# Find all directories recursively (excluding the current folder)
find . -type d ! -path "." | while read dir; do
    # Remove leading ./ and add trailing slash
    formatted_dir="${dir#./}/"
    echo "    - $formatted_dir"
done
