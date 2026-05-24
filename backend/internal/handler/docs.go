package handler

import (
	"fmt"
	"net/http"
)

// ScalarDocs handles GET /docs — serves the Scalar API documentation UI.
// Scalar is loaded from CDN; no npm build step required.
func ScalarDocs(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	fmt.Fprint(w, `<!doctype html>
<html>
  <head>
    <title>SiHuni API Docs</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body>
    <script
      id="api-reference"
      data-url="/openapi.json"
      src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
  </body>
</html>`)
}
