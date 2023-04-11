#!/bin/bash
## test the gene search query using curl

# query Query($description: String!, $start: Int, $size: Int) {
#   genes(description: $description, start: $start, size: $size) {
#     name
#     description
#   }
# }

curl --request POST \
     --header 'content-type: application/json' \
     --url http://localhost:4444/ \
     --data '{"query":"query Query($description: String, $start: Int, $size: Int) {genes(description: $description, start: $start, size: $size) {name description}}","variables":{"description":"Photosystem II","start":0,"size":100}}'
