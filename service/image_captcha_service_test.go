package service

import (
	"testing"
	"time"

	"github.com/stretchr/testify/require"
)

func resetImageCaptchaStoreForTest() {
	imageCaptchaStore.Lock()
	defer imageCaptchaStore.Unlock()
	imageCaptchaStore.challenges = make(map[string]imageCaptchaChallenge)
	imageCaptchaStore.tokens = make(map[string]imageCaptchaToken)
}

func TestGenerateImageCaptcha(t *testing.T) {
	resetImageCaptchaStoreForTest()
	data, err := GenerateImageCaptcha("127.0.0.1")
	require.NoError(t, err)
	require.NotEmpty(t, data.Key)
	require.Contains(t, data.MasterImage, "data:image/jpeg;base64,")
	require.Contains(t, data.ThumbImage, "data:image/png;base64,")
	require.Equal(t, imageCaptchaWidth, data.ImageWidth)
	require.Equal(t, imageCaptchaHeight, data.ImageHeight)
	require.Equal(t, 3, data.RequiredClicks)
}

func TestVerifyAndConsumeImageCaptcha(t *testing.T) {
	resetImageCaptchaStoreForTest()
	imageCaptchaStore.Lock()
	imageCaptchaStore.challenges["challenge"] = imageCaptchaChallenge{
		targets:   []ImageCaptchaPoint{{X: 120, Y: 60}, {X: 180, Y: 80}},
		ip:        "127.0.0.1",
		expiresAt: time.Now().Add(time.Minute),
	}
	imageCaptchaStore.Unlock()

	token, err := VerifyImageCaptcha("challenge", []ImageCaptchaPoint{{X: 124, Y: 64}, {X: 184, Y: 84}}, "127.0.0.1")
	require.NoError(t, err)
	require.NotEmpty(t, token)
	require.True(t, ConsumeImageCaptchaToken(token, "127.0.0.1"))
	require.False(t, ConsumeImageCaptchaToken(token, "127.0.0.1"))
}

func TestVerifyImageCaptchaRejectsWrongIP(t *testing.T) {
	resetImageCaptchaStoreForTest()
	imageCaptchaStore.Lock()
	imageCaptchaStore.challenges["challenge"] = imageCaptchaChallenge{
		targets:   []ImageCaptchaPoint{{X: 120, Y: 60}, {X: 180, Y: 80}},
		ip:        "127.0.0.1",
		expiresAt: time.Now().Add(time.Minute),
	}
	imageCaptchaStore.Unlock()

	_, err := VerifyImageCaptcha("challenge", []ImageCaptchaPoint{{X: 120, Y: 60}, {X: 180, Y: 80}}, "127.0.0.2")
	require.Error(t, err)
}

func TestVerifyImageCaptchaRejectsWrongOrder(t *testing.T) {
	resetImageCaptchaStoreForTest()
	imageCaptchaStore.Lock()
	imageCaptchaStore.challenges["challenge"] = imageCaptchaChallenge{
		targets:   []ImageCaptchaPoint{{X: 120, Y: 60}, {X: 180, Y: 80}},
		ip:        "127.0.0.1",
		expiresAt: time.Now().Add(time.Minute),
	}
	imageCaptchaStore.Unlock()

	_, err := VerifyImageCaptcha("challenge", []ImageCaptchaPoint{{X: 180, Y: 80}, {X: 120, Y: 60}}, "127.0.0.1")
	require.Error(t, err)
}
