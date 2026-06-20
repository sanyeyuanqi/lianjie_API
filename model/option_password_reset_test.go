package model

import (
	"testing"

	"github.com/QuantumNous/new-api/common"
	"github.com/stretchr/testify/require"
)

func TestUpdatePasswordResetCountdownSeconds(t *testing.T) {
	originalValue := common.PasswordResetCountdownSeconds
	originalOptions := common.OptionMap
	common.PasswordResetCountdownSeconds = 120
	common.OptionMap = map[string]string{}
	t.Cleanup(func() {
		common.PasswordResetCountdownSeconds = originalValue
		common.OptionMap = originalOptions
	})

	require.NoError(t, updateOptionMap("PasswordResetCountdownSeconds", "180"))
	require.Equal(t, 180, common.PasswordResetCountdownSeconds)
	require.Equal(t, "180", common.OptionMap["PasswordResetCountdownSeconds"])

	err := updateOptionMap("PasswordResetCountdownSeconds", "0")
	require.Error(t, err)
	require.Equal(t, 180, common.PasswordResetCountdownSeconds)
	require.Equal(t, "180", common.OptionMap["PasswordResetCountdownSeconds"])
}
