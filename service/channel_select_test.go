package service

import (
	"net/http/httptest"
	"testing"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/setting/ratio_setting"
	"github.com/glebarez/sqlite"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
)

func TestCacheGetRandomSatisfiedChannelFallsBackToOriginalGroup(t *testing.T) {
	gin.SetMode(gin.TestMode)

	oldDB := model.DB
	oldMemoryCacheEnabled := common.MemoryCacheEnabled
	oldUsingSQLite := common.UsingSQLite

	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)
	require.NoError(t, db.AutoMigrate(&model.Channel{}, &model.Ability{}))

	model.DB = db
	common.UsingSQLite = true
	common.MemoryCacheEnabled = true
	t.Cleanup(func() {
		model.DB = oldDB
		common.MemoryCacheEnabled = oldMemoryCacheEnabled
		common.UsingSQLite = oldUsingSQLite
	})

	require.NoError(t, db.Exec("DELETE FROM abilities").Error)
	require.NoError(t, db.Exec("DELETE FROM channels").Error)

	channel := &model.Channel{
		Id:     1,
		Name:   "fallback-channel",
		Key:    "sk-test",
		Status: common.ChannelStatusEnabled,
		Group:  "model-square-group",
		Models: "gemini-3.1-flash-image",
	}
	require.NoError(t, db.Create(channel).Error)
	require.NoError(t, db.Create(&model.Ability{
		Group:     "model-square-group",
		Model:     "gemini-3.1-flash-image",
		ChannelId: 1,
		Enabled:   true,
	}).Error)
	model.InitChannelCache()

	ctx, _ := gin.CreateTestContext(httptest.NewRecorder())
	ctx.Set("image_model_candidates", []ratio_setting.ImageModelCandidate{
		{Group: "antigravity-gemini", Model: "gemini-3.1-flash-image"},
	})

	channelResult, selectGroup, err := CacheGetRandomSatisfiedChannel(&RetryParam{
		Ctx:        ctx,
		TokenGroup: "model-square-group",
		ModelName:  "gemini-3.1-flash-image",
		Retry:      common.GetPointer(0),
	})

	require.NoError(t, err)
	require.NotNil(t, channelResult)
	require.Equal(t, 1, channelResult.Id)
	require.Equal(t, "model-square-group", selectGroup)
}

func TestCacheGetRandomSatisfiedChannelSkipsUnavailableImageCandidateGroups(t *testing.T) {
	gin.SetMode(gin.TestMode)

	oldDB := model.DB
	oldMemoryCacheEnabled := common.MemoryCacheEnabled
	oldUsingSQLite := common.UsingSQLite

	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)
	require.NoError(t, db.AutoMigrate(&model.Channel{}, &model.Ability{}))

	model.DB = db
	common.UsingSQLite = true
	common.MemoryCacheEnabled = true
	t.Cleanup(func() {
		model.DB = oldDB
		common.MemoryCacheEnabled = oldMemoryCacheEnabled
		common.UsingSQLite = oldUsingSQLite
	})

	require.NoError(t, db.Exec("DELETE FROM abilities").Error)
	require.NoError(t, db.Exec("DELETE FROM channels").Error)

	channel := &model.Channel{
		Id:     1,
		Name:   "fallback-channel",
		Key:    "sk-test",
		Status: common.ChannelStatusEnabled,
		Group:  "model-square-group",
		Models: "gemini-3.1-flash-image",
	}
	require.NoError(t, db.Create(channel).Error)
	require.NoError(t, db.Create(&model.Ability{
		Group:     "model-square-group",
		Model:     "gemini-3.1-flash-image",
		ChannelId: 1,
		Enabled:   true,
	}).Error)
	model.InitChannelCache()

	ctx, _ := gin.CreateTestContext(httptest.NewRecorder())
	ctx.Set("image_model_candidates", []ratio_setting.ImageModelCandidate{
		{Group: "antigravity-gemini", Model: "gemini-3.1-flash-image"},
		{Group: "model-square-group", Model: "gemini-3.1-flash-image"},
	})

	channelResult, selectGroup, err := CacheGetRandomSatisfiedChannel(&RetryParam{
		Ctx:        ctx,
		TokenGroup: "default",
		ModelName:  "gemini-3.1-flash-image",
		Retry:      common.GetPointer(0),
	})

	require.NoError(t, err)
	require.NotNil(t, channelResult)
	require.Equal(t, 1, channelResult.Id)
	require.Equal(t, "model-square-group", selectGroup)
}
