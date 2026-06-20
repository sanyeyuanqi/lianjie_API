/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
package service

import (
	"errors"
	"sync"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/wenlng/go-captcha-assets/resources/imagesv2"
	"github.com/wenlng/go-captcha-assets/resources/shapes"
	"github.com/wenlng/go-captcha-assets/resources/thumbs"
	"github.com/wenlng/go-captcha/v2/base/option"
	"github.com/wenlng/go-captcha/v2/click"
)

const (
	imageCaptchaWidth         = 300
	imageCaptchaHeight        = 220
	imageCaptchaTTL           = 3 * time.Minute
	imageCaptchaTokenTTL      = 2 * time.Minute
	imageCaptchaMaxAttempts   = 5
	imageCaptchaVerifyPadding = 8
)

var (
	errImageCaptchaInvalid = errors.New("图像验证失败，请重试")
	imageCaptchaOnce       sync.Once
	imageCaptchaGenerator  click.Captcha
	imageCaptchaInitErr    error
	imageCaptchaGenerateMu sync.Mutex
	imageCaptchaStore      = struct {
		sync.Mutex
		challenges map[string]imageCaptchaChallenge
		tokens     map[string]imageCaptchaToken
	}{
		challenges: make(map[string]imageCaptchaChallenge),
		tokens:     make(map[string]imageCaptchaToken),
	}
)

type imageCaptchaChallenge struct {
	targets   []ImageCaptchaPoint
	ip        string
	attempts  int
	expiresAt time.Time
}

type imageCaptchaToken struct {
	ip        string
	expiresAt time.Time
}

type ImageCaptchaData struct {
	Key            string `json:"key"`
	MasterImage    string `json:"master_image"`
	ThumbImage     string `json:"thumb_image"`
	ImageWidth     int    `json:"image_width"`
	ImageHeight    int    `json:"image_height"`
	RequiredClicks int    `json:"required_clicks"`
	ExpiresIn      int    `json:"expires_in"`
}

type ImageCaptchaPoint struct {
	X int `json:"x"`
	Y int `json:"y"`
}

func initImageCaptchaGenerator() {
	backgrounds, err := imagesv2.GetImages()
	if err != nil {
		imageCaptchaInitErr = err
		return
	}
	thumbBackgrounds, err := thumbs.GetThumbs()
	if err != nil {
		imageCaptchaInitErr = err
		return
	}
	shapeImages, err := shapes.GetShapes()
	if err != nil {
		imageCaptchaInitErr = err
		return
	}
	builder := click.NewBuilder(
		click.WithImageSize(option.Size{Width: imageCaptchaWidth, Height: imageCaptchaHeight}),
		click.WithRangeLen(option.RangeVal{Min: 4, Max: 5}),
		click.WithRangeVerifyLen(option.RangeVal{Min: 3, Max: 3}),
		click.WithRangeThumbImageSize(option.Size{Width: 160, Height: 42}),
	)
	builder.SetResources(
		click.WithBackgrounds(backgrounds),
		click.WithThumbBackgrounds(thumbBackgrounds),
		click.WithShapes(shapeImages),
	)
	imageCaptchaGenerator = builder.MakeShape()
}

func cleanupImageCaptchaStoreLocked(now time.Time) {
	for key, challenge := range imageCaptchaStore.challenges {
		if now.After(challenge.expiresAt) {
			delete(imageCaptchaStore.challenges, key)
		}
	}
	for token, verified := range imageCaptchaStore.tokens {
		if now.After(verified.expiresAt) {
			delete(imageCaptchaStore.tokens, token)
		}
	}
}

func GenerateImageCaptcha(clientIP string) (*ImageCaptchaData, error) {
	imageCaptchaOnce.Do(initImageCaptchaGenerator)
	if imageCaptchaInitErr != nil {
		return nil, imageCaptchaInitErr
	}

	imageCaptchaGenerateMu.Lock()
	data, err := imageCaptchaGenerator.Generate()
	imageCaptchaGenerateMu.Unlock()
	if err != nil {
		return nil, err
	}
	masterImage, err := data.GetMasterImage().ToBase64()
	if err != nil {
		return nil, err
	}
	thumbImage, err := data.GetThumbImage().ToBase64()
	if err != nil {
		return nil, err
	}
	dots := data.GetData()
	targets := make([]ImageCaptchaPoint, 0, len(dots))
	for i := 0; i < len(dots); i++ {
		dot, ok := dots[i]
		if !ok {
			return nil, errors.New("图像验证生成失败")
		}
		targets = append(targets, ImageCaptchaPoint{X: dot.X + dot.Width/2, Y: dot.Y + dot.Height/2})
	}

	now := time.Now()
	key := common.GetUUID()
	imageCaptchaStore.Lock()
	cleanupImageCaptchaStoreLocked(now)
	imageCaptchaStore.challenges[key] = imageCaptchaChallenge{
		targets:   targets,
		ip:        clientIP,
		expiresAt: now.Add(imageCaptchaTTL),
	}
	imageCaptchaStore.Unlock()

	return &ImageCaptchaData{
		Key:            key,
		MasterImage:    masterImage,
		ThumbImage:     thumbImage,
		ImageWidth:     imageCaptchaWidth,
		ImageHeight:    imageCaptchaHeight,
		RequiredClicks: len(targets),
		ExpiresIn:      int(imageCaptchaTTL.Seconds()),
	}, nil
}

func VerifyImageCaptcha(key string, points []ImageCaptchaPoint, clientIP string) (string, error) {
	now := time.Now()
	imageCaptchaStore.Lock()
	defer imageCaptchaStore.Unlock()
	cleanupImageCaptchaStoreLocked(now)

	challenge, ok := imageCaptchaStore.challenges[key]
	if !ok || challenge.ip != clientIP {
		return "", errImageCaptchaInvalid
	}
	challenge.attempts++
	valid := len(points) == len(challenge.targets)
	if valid {
		for i, target := range challenge.targets {
			if !click.Validate(points[i].X, points[i].Y, target.X-imageCaptchaVerifyPadding, target.Y-imageCaptchaVerifyPadding, imageCaptchaVerifyPadding*2, imageCaptchaVerifyPadding*2, 0) {
				valid = false
				break
			}
		}
	}
	if !valid {
		if challenge.attempts >= imageCaptchaMaxAttempts {
			delete(imageCaptchaStore.challenges, key)
		} else {
			imageCaptchaStore.challenges[key] = challenge
		}
		return "", errImageCaptchaInvalid
	}

	delete(imageCaptchaStore.challenges, key)
	token := common.GetUUID()
	imageCaptchaStore.tokens[token] = imageCaptchaToken{
		ip:        clientIP,
		expiresAt: now.Add(imageCaptchaTokenTTL),
	}
	return token, nil
}

func ConsumeImageCaptchaToken(token string, clientIP string) bool {
	if token == "" {
		return false
	}
	now := time.Now()
	imageCaptchaStore.Lock()
	defer imageCaptchaStore.Unlock()
	cleanupImageCaptchaStoreLocked(now)

	verified, ok := imageCaptchaStore.tokens[token]
	if !ok || verified.ip != clientIP {
		return false
	}
	delete(imageCaptchaStore.tokens, token)
	return true
}
