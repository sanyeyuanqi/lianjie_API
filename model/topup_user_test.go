package model

import (
	"testing"

	"github.com/QuantumNous/new-api/common"
	"github.com/glebarez/sqlite"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
)

func setupTopUpUserTestDB(t *testing.T) {
	t.Helper()

	originalDB := DB
	originalUsingSQLite := common.UsingSQLite
	originalUsingPostgreSQL := common.UsingPostgreSQL

	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)
	require.NoError(t, db.AutoMigrate(&User{}, &TopUp{}))

	DB = db
	common.UsingSQLite = true
	common.UsingPostgreSQL = false
	t.Cleanup(func() {
		DB = originalDB
		common.UsingSQLite = originalUsingSQLite
		common.UsingPostgreSQL = originalUsingPostgreSQL
	})
}

func TestGetAllTopUpsIncludesUserIdentity(t *testing.T) {
	setupTopUpUserTestDB(t)

	user := &User{Username: "alice", DisplayName: "Alice Chen", Password: "password"}
	require.NoError(t, DB.Create(user).Error)
	require.NoError(t, DB.Create(&TopUp{UserId: user.Id, TradeNo: "order-with-user"}).Error)

	topups, total, err := GetAllTopUps(&common.PageInfo{Page: 1, PageSize: 10})
	require.NoError(t, err)
	require.EqualValues(t, 1, total)
	require.Len(t, topups, 1)
	require.Equal(t, "alice", topups[0].Username)
	require.Equal(t, "Alice Chen", topups[0].DisplayName)
}

func TestSearchAllTopUpsIncludesUserIdentity(t *testing.T) {
	setupTopUpUserTestDB(t)

	user := &User{Username: "bob", Password: "password"}
	require.NoError(t, DB.Create(user).Error)
	require.NoError(t, DB.Create(&TopUp{UserId: user.Id, TradeNo: "searchable-order"}).Error)

	topups, total, err := SearchAllTopUps("%searchable%", &common.PageInfo{Page: 1, PageSize: 10})
	require.NoError(t, err)
	require.EqualValues(t, 1, total)
	require.Len(t, topups, 1)
	require.Equal(t, "bob", topups[0].Username)
}
