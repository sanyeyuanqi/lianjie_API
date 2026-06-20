package model

import (
	"errors"
	"testing"

	"github.com/glebarez/sqlite"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
)

func newUserEmailTestDB(t *testing.T) *gorm.DB {
	t.Helper()
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)
	require.NoError(t, db.AutoMigrate(&User{}))
	return db
}

func TestNormalizeEmail(t *testing.T) {
	require.Equal(t, "user@example.com", NormalizeEmail("  User@Example.COM "))
	require.Empty(t, NormalizeEmail("   "))
}

func TestEnsureEmailAvailableRejectsCaseVariant(t *testing.T) {
	db := newUserEmailTestDB(t)
	user := User{Username: "existing", Password: "password", Email: "User@Example.com"}
	require.NoError(t, db.Create(&user).Error)

	err := ensureEmailAvailable(db, " user@example.COM ", 0)
	require.ErrorIs(t, err, ErrEmailAlreadyTaken)
}

func TestEnsureEmailAvailableAllowsCurrentUser(t *testing.T) {
	db := newUserEmailTestDB(t)
	user := User{Username: "existing", Password: "password", Email: "user@example.com"}
	require.NoError(t, db.Create(&user).Error)

	require.NoError(t, ensureEmailAvailable(db, "USER@example.com", user.Id))
}

func TestEnsureEmailAvailableIncludesDeletedUsers(t *testing.T) {
	db := newUserEmailTestDB(t)
	user := User{Username: "deleted", Password: "password", Email: "deleted@example.com"}
	require.NoError(t, db.Create(&user).Error)
	require.NoError(t, db.Delete(&user).Error)

	err := ensureEmailAvailable(db, "deleted@example.com", 0)
	require.True(t, errors.Is(err, ErrEmailAlreadyTaken))
}
