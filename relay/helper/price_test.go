package helper

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/dto"
	"github.com/QuantumNous/new-api/pkg/billingexpr"
	relaycommon "github.com/QuantumNous/new-api/relay/common"
	"github.com/QuantumNous/new-api/setting/billing_setting"
	"github.com/QuantumNous/new-api/setting/config"
	"github.com/QuantumNous/new-api/setting/ratio_setting"
	"github.com/QuantumNous/new-api/types"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/require"
)

func TestModelPriceHelperTieredUsesPreloadedRequestInput(t *testing.T) {
	gin.SetMode(gin.TestMode)

	saved := map[string]string{}
	require.NoError(t, config.GlobalConfig.SaveToDB(func(key, value string) error {
		saved[key] = value
		return nil
	}))
	t.Cleanup(func() {
		require.NoError(t, config.GlobalConfig.LoadFromDB(saved))
	})

	require.NoError(t, config.GlobalConfig.LoadFromDB(map[string]string{
		"billing_setting.billing_mode": `{"tiered-test-model":"tiered_expr"}`,
		"billing_setting.billing_expr": `{"tiered-test-model":"param(\"stream\") == true ? tier(\"stream\", p * 3) : tier(\"base\", p * 2)"}`,
	}))

	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	req := httptest.NewRequest(http.MethodPost, "/api/channel/test/1", nil)
	req.Body = nil
	req.ContentLength = 0
	req.Header.Set("Content-Type", "application/json")
	ctx.Request = req
	ctx.Set("group", "default")

	info := &relaycommon.RelayInfo{
		OriginModelName: "tiered-test-model",
		UserGroup:       "default",
		UsingGroup:      "default",
		RequestHeaders:  map[string]string{"Content-Type": "application/json"},
		BillingRequestInput: &billingexpr.RequestInput{
			Headers: map[string]string{"Content-Type": "application/json"},
			Body:    []byte(`{"stream":true}`),
		},
	}

	priceData, err := ModelPriceHelper(ctx, info, 1000, &types.TokenCountMeta{})
	require.NoError(t, err)
	require.Equal(t, 1500, priceData.QuotaToPreConsume)
	require.NotNil(t, info.TieredBillingSnapshot)
	require.Equal(t, "stream", info.TieredBillingSnapshot.EstimatedTier)
	require.Equal(t, billing_setting.BillingModeTieredExpr, info.TieredBillingSnapshot.BillingMode)
	require.Equal(t, common.QuotaPerUnit, info.TieredBillingSnapshot.QuotaPerUnit)
}

func TestModelPriceHelperUsesImageModelActualSizePriceForPlaygroundImage(t *testing.T) {
	gin.SetMode(gin.TestMode)
	require.NoError(t, ratio_setting.UpdateImageModelPricingByJSONString(`{
		"models": [
			{
				"name": "image-alias",
				"model": "upstream-image",
				"models": ["upstream-image"],
				"base_price": 0.03,
				"size_ratios": {"1K": 1, "2K": 2, "4K": 4}
			}
		]
	}`))
	t.Cleanup(func() {
		require.NoError(t, ratio_setting.UpdateImageModelPricingByJSONString(`{"models":[]}`))
	})

	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Set("group", "default")
	ctx.Set("playground_image_actual_price", true)

	imageReq := &dto.ImageRequest{
		Model: "image-alias",
		Size:  "2048x2048",
	}
	info := &relaycommon.RelayInfo{
		OriginModelName: "image-alias",
		UserGroup:       "default",
		UsingGroup:      "default",
		Request:         imageReq,
	}

	priceData, err := ModelPriceHelper(ctx, info, 1, &types.TokenCountMeta{ImagePriceRatio: 99})
	require.NoError(t, err)
	require.True(t, priceData.UsePrice)
	require.InEpsilon(t, 0.06, priceData.ModelPrice, 0.000001)
	require.Equal(t, int(0.06*common.QuotaPerUnit), priceData.QuotaToPreConsume)
}

func TestModelPriceHelperKeepsNormalImageAPIModelPrice(t *testing.T) {
	gin.SetMode(gin.TestMode)
	savedModelPrice := ratio_setting.ModelPrice2JSONString()
	require.NoError(t, ratio_setting.UpdateModelPriceByJSONString(`{"dall-e-3":0.04}`))
	require.NoError(t, ratio_setting.UpdateImageModelPricingByJSONString(`{
		"models": [
			{
				"name": "dall-e-3",
				"model": "dall-e-3",
				"models": ["dall-e-3"],
				"base_price": 0.03,
				"size_ratios": {"1K": 1, "2K": 2, "4K": 4}
			}
		]
	}`))
	t.Cleanup(func() {
		require.NoError(t, ratio_setting.UpdateImageModelPricingByJSONString(`{"models":[]}`))
		require.NoError(t, ratio_setting.UpdateModelPriceByJSONString(savedModelPrice))
	})

	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Set("group", "default")

	info := &relaycommon.RelayInfo{
		OriginModelName: "dall-e-3",
		UserGroup:       "default",
		UsingGroup:      "default",
		Request: &dto.ImageRequest{
			Model: "dall-e-3",
			Size:  "2048x2048",
		},
	}

	priceData, err := ModelPriceHelper(ctx, info, 1, &types.TokenCountMeta{ImagePriceRatio: 2})
	require.NoError(t, err)
	require.True(t, priceData.UsePrice)
	require.InEpsilon(t, 0.08, priceData.ModelPrice, 0.000001)
	require.Equal(t, int(0.08*common.QuotaPerUnit), priceData.QuotaToPreConsume)
}
