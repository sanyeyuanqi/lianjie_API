package router

import (
	"embed"
	"net/http"
	"strings"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/controller"
	"github.com/QuantumNous/new-api/middleware"
	"github.com/gin-contrib/gzip"
	"github.com/gin-contrib/static"
	"github.com/gin-gonic/gin"
)

const (
	immutableAssetCacheControl = "public, max-age=31536000, immutable"
	htmlCacheControl           = "no-cache, must-revalidate"
	shortAssetCacheControl     = "public, max-age=86400"
)

// ThemeAssets holds the embedded frontend assets.
type ThemeAssets struct {
	DefaultBuildFS   embed.FS
	DefaultIndexPage []byte
}

func setWebCacheHeaders() gin.HandlerFunc {
	return func(c *gin.Context) {
		path := c.Request.URL.Path

		switch {
		case path == "/" || strings.HasSuffix(path, ".html"):
			c.Header("Cache-Control", htmlCacheControl)
			c.Header("Pragma", "no-cache")
			c.Header("Expires", "0")
		case strings.HasPrefix(path, "/static/"):
			c.Header("Cache-Control", immutableAssetCacheControl)
		case path == "/favicon.ico":
			c.Header("Cache-Control", shortAssetCacheControl)
		}

		c.Next()
	}
}

func SetWebRouter(router *gin.Engine, assets ThemeAssets) {
	defaultFS := common.EmbedFolder(assets.DefaultBuildFS, "web/default/dist")

	router.Use(gzip.Gzip(gzip.DefaultCompression))
	router.Use(middleware.GlobalWebRateLimit())
	router.Use(middleware.Cache())
	router.Use(setWebCacheHeaders())
	router.Use(static.Serve("/", defaultFS))
	router.NoRoute(func(c *gin.Context) {
		c.Set(middleware.RouteTagKey, "web")
		if strings.HasPrefix(c.Request.RequestURI, "/v1") || strings.HasPrefix(c.Request.RequestURI, "/api") || strings.HasPrefix(c.Request.RequestURI, "/assets") {
			controller.RelayNotFound(c)
			return
		}
		c.Header("Cache-Control", htmlCacheControl)
		c.Header("Pragma", "no-cache")
		c.Header("Expires", "0")
		c.Data(http.StatusOK, "text/html; charset=utf-8", assets.DefaultIndexPage)
	})
}
