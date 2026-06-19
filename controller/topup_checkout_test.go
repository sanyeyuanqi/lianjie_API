package controller

import (
	"bytes"
	"context"
	"fmt"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestBuildEpayCheckoutURL(t *testing.T) {
	params := map[string]string{
		"out_trade_no": "USR1NO123",
		"money":        "1.00",
		"sign":         "test-signature",
		"type":         "wxpay",
	}

	checkoutURL, err := buildEpayCheckoutURL("https://pay.example.com/", params)
	require.NoError(t, err)

	parsed, err := url.Parse(checkoutURL)
	require.NoError(t, err)
	require.Equal(t, "/api/user/epay/checkout", parsed.Path)
	for key, value := range params {
		require.Equal(t, value, parsed.Query().Get(key))
	}
}

func TestBuildSubscriptionEpayCheckoutURL(t *testing.T) {
	params := map[string]string{
		"out_trade_no": "SUBUSR1NO123",
		"money":        "1.00",
		"sign":         "test-signature",
		"type":         "alipay",
	}

	checkoutURL, err := buildSubscriptionEpayCheckoutURL("https://pay.example.com/", params)
	require.NoError(t, err)

	parsed, err := url.Parse(checkoutURL)
	require.NoError(t, err)
	require.Equal(t, "/api/subscription/epay/checkout", parsed.Path)
	for key, value := range params {
		require.Equal(t, value, parsed.Query().Get(key))
	}
}

func TestEpayCheckoutPagePostsToGateway(t *testing.T) {
	var page bytes.Buffer
	err := epayCheckoutPage.Execute(&page, epayCheckoutPageData{
		Action: "https://gateway.example.com/submit.php",
		Params: map[string]string{
			"out_trade_no": "USR1NO123",
			"type":         "wxpay",
		},
	})
	require.NoError(t, err)

	html := page.String()
	require.Contains(t, html, `method="post"`)
	require.Contains(t, html, `action="https://gateway.example.com/submit.php"`)
	require.Contains(t, html, `name="out_trade_no" value="USR1NO123"`)
	require.Contains(t, html, `name="type" value="wxpay"`)
	require.True(t, strings.Contains(html, ".submit()"))
}

func TestInitializeEpayCheckoutReturnsGatewayQRCode(t *testing.T) {
	var server *httptest.Server
	server = httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/submit.php":
			require.Equal(t, http.MethodPost, r.Method)
			require.NoError(t, r.ParseForm())
			require.Equal(t, "USR1NO123", r.Form.Get("out_trade_no"))
			http.Redirect(w, r, server.URL+"/cashier-pc?orderNo=USR1NO123&merchantNo=M123", http.StatusFound)
		case "/cashier-pc":
			_, _ = fmt.Fprint(w, "checkout")
		default:
			http.NotFound(w, r)
		}
	}))
	defer server.Close()

	paymentURL, qrCode, err := initializeEpayCheckout(
		context.Background(),
		server.URL+"/submit.php",
		map[string]string{"out_trade_no": "USR1NO123"},
	)
	require.NoError(t, err)
	require.Equal(t, server.URL+"/cashier-pc?orderNo=USR1NO123&merchantNo=M123", paymentURL)
	require.Equal(t, server.URL+"/cashier?orderNo=USR1NO123", qrCode)
}
